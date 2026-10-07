const STORAGE_KEY = "siti-portfolio-articles";
const PUBLISH_WORKER_URL_KEY = "siti-portfolio-publish-worker-url";
const PUBLISH_WORKER_TOKEN_KEY = "siti-portfolio-publish-worker-token";
const DEFAULT_PUBLISH_WORKER_URL = "https://esma-blog-publisher.esma-blog.workers.dev";
const defaultArticles = [
  {
    id: "microsoft-learn",
    title: "Memulai perjalanan belajar di Microsoft Learn",
    category: "Microsoft Learn",
    summary: "Catatan awal saya mengenal berbagai modul, jalur belajar, dan teknologi di Microsoft Learn.",
    content: "Microsoft Learn menjadi tempat yang tepat untuk memulai perjalanan belajar saya. Di sana, saya bisa menjelajahi topik yang relevan dan mempelajarinya secara bertahap tanpa merasa kewalahan.\n\nSaya mulai dari dasar, memahami konsep, lalu mencoba menerapkannya dalam proyek kecil. Proses seperti ini membuat saya lebih percaya diri untuk terus berkembang."
  },
  {
    id: "web-development",
    title: "Belajar web dari HTML, CSS, dan rasa penasaran",
    category: "Web Development",
    summary: "Kenapa saya mulai dari dasar dan hal-hal kecil yang saya pelajari di sepanjang jalan.",
    content: "Ketika saya mulai belajar web, saya tidak langsung fokus pada framework. Saya mulai dari HTML, CSS, dan JavaScript dulu agar memahami fondasi yang benar.\n\nAwalnya terasa sederhana, tetapi semakin lama saya sadar bahwa fondasi itu penting. Dari sana, saya belajar bagaimana membangun halaman yang tidak hanya terlihat bagus, tetapi juga terasa rapi dan mudah dipahami."
  },
  {
    id: "ai-ketahui",
    title: "Mengenal AI: belajar memahami, bukan sekadar memakai",
    category: "Artificial Intelligence",
    summary: "Eksplorasi pertama saya tentang AI dan bagaimana teknologi ini bisa digunakan dengan bijak.",
    content: "AI bukan hanya soal alat yang canggih, tetapi juga soal bagaimana kita menggunakannya dengan bijak. Saya mulai melihat bahwa pemahaman terhadap data, proses, dan etika sangat penting.\n\nKetika saya membuka wawasan ini, saya mulai tertarik untuk melihat AI dari sisi yang lebih manusiawi: bagaimana teknologi bisa membantu, bukan menggantikan proses belajar yang sehat."
  },
  {
    id: "cloud-computing",
    title: "Catatan pertama saat mengenal cloud computing",
    category: "Cloud Computing",
    summary: "Memahami ide di balik cloud dan alasan layanan ini menjadi bagian penting teknologi modern.",
    content: "Cloud computing membuat saya mulai berpikir tentang bagaimana aplikasi dapat berjalan tanpa harus mengandalkan perangkat keras lokal. Konsep penyimpanan, skalabilitas, dan layanan berbasis internet terasa sangat relevan saat ini.\n\nSaya terus belajar tentang cara kerja layanan cloud dan mengapa teknologi ini menjadi fondasi bagi banyak aplikasi modern."
  },
  {
    id: "community-learning",
    title: "Belajar teknologi terasa lebih seru bersama komunitas",
    category: "Komunitas",
    summary: "Refleksi tentang berbagi proses, menemukan teman belajar, dan bertumbuh bersama.",
    content: "Saat berdiskusi dengan komunitas, saya menyadari bahwa proses belajar memang tidak harus dijalani sendirian. Ada banyak temuan baru, pengalaman berbeda, dan dorongan yang muncul dari sering berbagi.\n\nKarena itu, saya mulai lebih aktif menulis dan membagikan apa yang saya pelajari. Ternyata, proses berbagi justru membuat saya lebih paham."
  },
  {
    id: "document-process",
    title: "Mengapa saya mulai mendokumentasikan proses belajar",
    category: "Proyek Pribadi",
    summary: "Alasan di balik website ini dan bagaimana catatan kecil membantu saya terus berkembang.",
    content: "Saya memutuskan untuk mendokumentasikan setiap langkah belajar karena saya ingin melihat bagaimana proses itu berkembang. Dari ide sederhana hingga hasil yang lebih matang, semua terasa lebih berarti ketika ditulis dan dibagikan.\n\nWebsite ini menjadi ruang untuk mencatat perjalanan, refleksi, dan pengalaman baru saya. Dengan begitu, saya tetap termotivasi untuk terus mencoba dan belajar."
  }
];

const articleListPanel = document.querySelector("#article-list-panel");
const form = document.querySelector("#article-form");
const inputs = {
  title: document.querySelector("#article-title"),
  category: document.querySelector("#article-category"),
  summary: document.querySelector("#article-summary"),
  content: document.querySelector("#article-content")
};
const editor = document.querySelector("#article-content-editor");
const editorToolbar = document.querySelector(".rich-editor-toolbar");
const fontSelect = document.querySelector("#editor-font");
const sizeSelect = document.querySelector("#editor-size");
const newArticleButton = document.querySelector("#new-article");
const resetButton = document.querySelector("#reset-form");
const insertFigureButton = document.querySelector("#insert-figure");
const insertLinkButton = document.querySelector("#insert-link");
const figureFields = document.querySelector("#figure-fields");
const linkFields = document.querySelector("#link-fields");
const editorValidationStatus = document.querySelector("#editor-validation-status");
const publishWorkerUrlInput = document.querySelector("#publish-worker-url");
const publishWorkerTokenInput = document.querySelector("#publish-worker-token");
const publishStatus = document.querySelector("#publish-status");
const saveArticleButton = form.querySelector('button[type="submit"]');
const figureUrlInput = document.querySelector("#figure-url");
const figureAssetSelect = document.querySelector("#figure-asset-select");
const figurePreview = document.querySelector("#figure-preview");
const fontFamilies = new Map([
  ["dm sans", "DM Sans"],
  ["manrope", "Manrope"],
  ["arial", "Arial"],
  ["georgia", "Georgia"],
  ["verdana", "Verdana"]
]);
const allowedFontSizes = new Set(["12", "14", "16", "18", "24", "32"]);
const allowedEditorTags = new Set([
  "a", "b", "blockquote", "br", "div", "em", "figcaption", "figure",
  "h2", "h3", "i", "img", "li", "ol", "p", "span", "strong", "u", "ul"
]);
let savedEditorRange = null;

const isAllowedUrl = (value, allowedProtocols) => {
  try {
    const url = new URL(value, window.location.href);
    return allowedProtocols.includes(url.protocol);
  } catch {
    return false;
  }
};

const safeFontFamily = (value) => fontFamilies.get((value || "").split(",")[0].trim().replace(/^["']|["']$/g, "").toLowerCase()) || "";

const sanitizeEditorHtml = (markup) => {
  const parsed = new DOMParser().parseFromString(markup, "text/html");
  const cleanNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.nodeValue || "");
    if (node.nodeType !== Node.ELEMENT_NODE) return null;

    const tag = node.tagName.toLowerCase();
    if (["script", "style", "iframe", "object", "embed", "svg", "math"].includes(tag)) return null;

    const outputTag = tag === "font" ? "span" : tag;
    if (!allowedEditorTags.has(outputTag)) {
      const fragment = document.createDocumentFragment();
      Array.from(node.childNodes).forEach((child) => {
        const cleanChild = cleanNode(child);
        if (cleanChild) fragment.appendChild(cleanChild);
      });
      return fragment;
    }
    const output = document.createElement(outputTag);

    if (tag === "img") {
      const src = node.getAttribute("src") || "";
      if (!isAllowedUrl(src, ["http:", "https:"])) return null;
      output.setAttribute("src", src);
      output.setAttribute("alt", node.getAttribute("alt") || "");
      return output;
    }

    if (tag === "a") {
      const href = node.getAttribute("href") || "";
      if (isAllowedUrl(href, ["http:", "https:", "mailto:"])) {
        output.setAttribute("href", href);
        output.setAttribute("target", "_blank");
        output.setAttribute("rel", "noopener noreferrer");
      }
    }

    const fontFamily = safeFontFamily(tag === "font" ? node.getAttribute("face") : node.style.fontFamily);
    const legacyFontSize = tag === "font"
      ? ({ "1": "12", "2": "12", "3": "14", "4": "16", "5": "18", "6": "24", "7": "32" }[node.getAttribute("size")] || "")
      : "";
    const fontSizeValue = legacyFontSize || (node.style.fontSize || "").replace("px", "");
    if (fontFamily) output.style.fontFamily = fontFamily;
    if (allowedFontSizes.has(fontSizeValue)) output.style.fontSize = `${fontSizeValue}px`;

    const textAlign = ["left", "center", "right", "justify"].includes(node.style.textAlign)
      ? node.style.textAlign
      : "";
    if (textAlign && ["div", "p", "h2", "h3", "blockquote"].includes(outputTag)) {
      output.style.textAlign = textAlign;
    }

    Array.from(node.childNodes).forEach((child) => {
      const cleanChild = cleanNode(child);
      if (cleanChild) output.appendChild(cleanChild);
    });
    return output;
  };

  const cleanBody = document.createElement("div");
  Array.from(parsed.body.childNodes).forEach((node) => {
    const cleanNodeResult = cleanNode(node);
    if (cleanNodeResult) cleanBody.appendChild(cleanNodeResult);
  });
  return cleanBody.innerHTML;
};

const articleContentToHtml = (content) => {
  const value = content || "";
  if (/<(?:a|blockquote|br|div|figcaption|figure|h[2-3]|img|li|ol|p|ul)\b/i.test(value)) {
    return sanitizeEditorHtml(value);
  }

  return value
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>")}</p>`)
    .join("");
};

const syncEditorContent = () => {
  inputs.content.value = editor.innerHTML;
};

const saveEditorSelection = () => {
  const selection = window.getSelection();
  if (selection && selection.rangeCount && editor.contains(selection.anchorNode)) {
    savedEditorRange = selection.getRangeAt(0).cloneRange();
  }
};

const restoreEditorSelection = () => {
  editor.focus();
  const selection = window.getSelection();
  if (!selection) return;

  selection.removeAllRanges();
  if (savedEditorRange && editor.contains(savedEditorRange.commonAncestorContainer)) {
    selection.addRange(savedEditorRange);
  } else {
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    selection.addRange(range);
  }
};

const insertEditorNode = (node) => {
  restoreEditorSelection();
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return;
  const range = selection.getRangeAt(0);
  range.deleteContents();
  range.insertNode(node);
  range.setStartAfter(node);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
  savedEditorRange = range.cloneRange();
  syncEditorContent();
};

const insertFigureAtSelection = (figure) => {
  restoreEditorSelection();
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return;

  const range = selection.getRangeAt(0);
  const startElement = range.startContainer.nodeType === Node.ELEMENT_NODE
    ? range.startContainer
    : range.startContainer.parentElement;
  const block = startElement && startElement.closest("p, h2, h3, blockquote, li, div");
  if (block && block !== editor && editor.contains(block)) {
    block.after(figure);
    const nextParagraph = document.createElement("p");
    nextParagraph.appendChild(document.createElement("br"));
    figure.after(nextParagraph);
    const nextRange = document.createRange();
    nextRange.setStart(nextParagraph, 0);
    nextRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(nextRange);
    savedEditorRange = nextRange.cloneRange();
  } else {
    range.deleteContents();
    range.insertNode(figure);
    range.setStartAfter(figure);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    savedEditorRange = range.cloneRange();
  }
  syncEditorContent();
};

const closeInsertPanels = () => {
  figureFields.hidden = true;
  linkFields.hidden = true;
  document.querySelector("#toggle-figure-fields").setAttribute("aria-expanded", "false");
  document.querySelector("#toggle-link-fields").setAttribute("aria-expanded", "false");
};

const getStoredArticles = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!stored || !Array.isArray(stored) || stored.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultArticles));
      return [...defaultArticles];
    }
    return stored;
  } catch (error) {
    return [...defaultArticles];
  }
};

let articles = getStoredArticles();
let currentArticleId = null;

const slugify = (value) => value
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9\s-]/g, "")
  .replace(/\s+/g, "-")
  .replace(/-+/g, "-");

const saveArticles = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
};

const setPublishStatus = (message, state = "") => {
  publishStatus.textContent = message;
  publishStatus.dataset.state = state;
};

const publishArticle = async (article) => {
  const workerUrl = publishWorkerUrlInput.value.trim();
  const token = publishWorkerTokenInput.value.trim();
  if (!workerUrl || !token) {
    setPublishStatus("Masukkan URL Worker dan kunci publikasi sebelum menyimpan.", "error");
    return false;
  }

  let endpoint;
  try {
    endpoint = new URL(workerUrl);
  } catch {
    setPublishStatus("URL Cloudflare Worker tidak valid.", "error");
    return false;
  }
  if (endpoint.protocol !== "https:") {
    setPublishStatus("URL Cloudflare Worker harus menggunakan HTTPS.", "error");
    return false;
  }

  publishWorkerUrlInput.value = endpoint.href.replace(/\/$/, "");
  sessionStorage.setItem(PUBLISH_WORKER_URL_KEY, publishWorkerUrlInput.value);
  sessionStorage.setItem(PUBLISH_WORKER_TOKEN_KEY, token);

  try {
    const response = await fetch(publishWorkerUrlInput.value, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ article })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      setPublishStatus(result.error || `Publikasi gagal (HTTP ${response.status}).`, "error");
      return false;
    }
    setPublishStatus("Artikel sudah dikirim ke GitHub. Tunggu beberapa menit hingga GitHub Pages memperbarui situs.", "success");
    return true;
  } catch (error) {
    setPublishStatus(`Tidak dapat menghubungi Worker: ${error.message}`, "error");
    return false;
  }
};

const getSelectedArticle = () => articles.find((article) => article.id === currentArticleId)
  || articles[0] || null;

const updateForm = (article) => {
  if (!article) {
    form.reset();
    editor.innerHTML = "";
    syncEditorContent();
    currentArticleId = null;
    return;
  }

  currentArticleId = article.id;
  inputs.title.value = article.title || "";
  inputs.category.value = article.category || "";
  inputs.summary.value = article.summary || "";
  editor.innerHTML = articleContentToHtml(article.content || "");
  savedEditorRange = null;
  editorValidationStatus.textContent = "";
  syncEditorContent();
  closeInsertPanels();
};

const renderArticleList = () => {
  if (!articleListPanel) return;

  articleListPanel.innerHTML = "";

  articles.forEach((article) => {
    const listItem = document.createElement("button");
    listItem.type = "button";
    listItem.className = `article-list-item ${article.id === currentArticleId ? "is-active" : ""}`;
    listItem.innerHTML = `
      <span class="article-list-tag">${article.category}</span>
      <strong>${article.title}</strong>
      <small>${article.summary}</small>
    `;
    listItem.addEventListener("click", () => {
      currentArticleId = article.id;
      updateForm(article);
      renderArticleList();
      const url = new URL(window.location.href);
      url.searchParams.set("article", article.id);
      window.history.replaceState({}, "", url);
    });
    articleListPanel.appendChild(listItem);
  });
};

const createNewArticle = () => {
  const id = `draft-${Date.now()}`;
  const article = {
    id,
    title: "Judul artikel baru",
    category: "Kategori",
    summary: "Ringkasan singkat tentang artikel ini.",
    content: "Tuliskan isi artikel Anda di sini.",
    published: false
  };

  articles.unshift(article);
  saveArticles();
  currentArticleId = article.id;
  updateForm(article);
  renderArticleList();
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setPublishStatus("");

  const title = inputs.title.value.trim();
  const category = inputs.category.value.trim();
  const summary = inputs.summary.value.trim();
  const content = sanitizeEditorHtml(editor.innerHTML).trim();
  const contentDocument = new DOMParser().parseFromString(content, "text/html");
  const hasBody = Boolean(contentDocument.body.textContent.trim() || contentDocument.body.querySelector("img"));

  editorValidationStatus.textContent = hasBody ? "" : "Isi artikel tidak boleh kosong.";
  if (!title || !category || !summary || !content || !hasBody) {
    if (!hasBody) editor.focus();
    return;
  }

  if (!currentArticleId) {
    currentArticleId = slugify(title) || `draft-${Date.now()}`;
  }

  const articleIndex = articles.findIndex((article) => article.id === currentArticleId);
  const previousArticle = articleIndex >= 0 ? articles[articleIndex] : null;
  const now = new Date().toISOString();
  const nextArticle = {
    id: currentArticleId,
    title,
    category,
    summary,
    content,
    published: true,
    publishedAt: previousArticle?.publishedAt || now,
    updatedAt: now
  };
  inputs.content.value = content;

  saveArticleButton.disabled = true;
  saveArticleButton.textContent = "Menerbitkan...";
  const published = await publishArticle(nextArticle);
  saveArticleButton.disabled = false;
  saveArticleButton.textContent = "Simpan artikel";
  if (!published) return;

  if (articleIndex >= 0) {
    articles[articleIndex] = nextArticle;
  } else {
    articles.unshift(nextArticle);
  }

  saveArticles();
  articles = getStoredArticles();
  currentArticleId = nextArticle.id;
  updateForm(nextArticle);
  renderArticleList();

  const url = new URL(window.location.href);
  url.searchParams.set("article", nextArticle.id);
  window.history.replaceState({}, "", url);
});

newArticleButton.addEventListener("click", createNewArticle);
editor.addEventListener("input", syncEditorContent);
editor.addEventListener("input", () => {
  if (editorValidationStatus.textContent) editorValidationStatus.textContent = "";
});
editor.addEventListener("mouseup", saveEditorSelection);
editor.addEventListener("keyup", saveEditorSelection);
editor.addEventListener("focus", saveEditorSelection);
editorToolbar.addEventListener("mousedown", (event) => {
  saveEditorSelection();
  if (event.target.closest("button")) event.preventDefault();
});

editorToolbar.querySelectorAll("[data-editor-command]").forEach((button) => {
  button.addEventListener("click", () => {
    restoreEditorSelection();
    document.execCommand(button.dataset.editorCommand, false, button.dataset.editorValue || null);
    saveEditorSelection();
    syncEditorContent();
  });
});

fontSelect.addEventListener("change", () => {
  restoreEditorSelection();
  document.execCommand("fontName", false, fontSelect.value);
  saveEditorSelection();
  syncEditorContent();
});

sizeSelect.addEventListener("change", () => {
  restoreEditorSelection();
  document.execCommand("fontSize", false, "7");
  editor.querySelectorAll('font[size="7"]').forEach((font) => {
    font.removeAttribute("size");
    font.style.fontSize = `${sizeSelect.value}px`;
  });
  saveEditorSelection();
  syncEditorContent();
});

document.querySelector("#toggle-figure-fields").addEventListener("click", (event) => {
  const shouldOpen = figureFields.hidden;
  closeInsertPanels();
  figureFields.hidden = !shouldOpen;
  event.currentTarget.setAttribute("aria-expanded", String(shouldOpen));
  document.querySelector("#figure-status").textContent = "";
});

document.querySelector("#toggle-link-fields").addEventListener("click", (event) => {
  const shouldOpen = linkFields.hidden;
  closeInsertPanels();
  linkFields.hidden = !shouldOpen;
  event.currentTarget.setAttribute("aria-expanded", String(shouldOpen));
  document.querySelector("#link-status").textContent = "";
  const selectedText = savedEditorRange ? savedEditorRange.toString() : "";
  if (shouldOpen && selectedText) document.querySelector("#link-text").value = selectedText;
});

insertFigureButton.addEventListener("click", () => {
  const status = document.querySelector("#figure-status");
  const imageUrl = figureUrlInput.value.trim();
  const altText = document.querySelector("#figure-alt").value.trim();
  const caption = document.querySelector("#figure-caption").value.trim();
  if (!imageUrl || !isAllowedUrl(imageUrl, ["http:", "https:"])) {
    status.textContent = "Masukkan path seperti assets/images/nama-file.png atau URL HTTP/HTTPS.";
    return;
  }
  if (!altText) {
    status.textContent = "Teks alternatif gambar perlu diisi.";
    return;
  }

  const image = document.createElement("img");
  image.setAttribute("src", imageUrl);
  image.alt = altText;
  status.textContent = "Memeriksa gambar...";
  insertFigureButton.disabled = true;
  image.onload = () => {
    const figure = document.createElement("figure");
    figure.appendChild(image);
    if (caption) {
      const figcaption = document.createElement("figcaption");
      figcaption.textContent = caption;
      figure.appendChild(figcaption);
    }
    insertFigureAtSelection(figure);
    figureUrlInput.value = "";
    figureAssetSelect.value = "";
    document.querySelector("#figure-alt").value = "";
    document.querySelector("#figure-caption").value = "";
    figurePreview.hidden = true;
    status.textContent = "Gambar berhasil dimasukkan ke draft.";
    insertFigureButton.disabled = false;
  };
  image.onerror = () => {
    status.textContent = `Gambar tidak ditemukan: ${imageUrl}. Periksa nama file dan path assets/images/.`;
    insertFigureButton.disabled = false;
  };
});

const previewFigureUrl = () => {
  const imageUrl = figureUrlInput.value.trim();
  figurePreview.hidden = true;
  if (!imageUrl || !isAllowedUrl(imageUrl, ["http:", "https:"])) return;
  figurePreview.onload = () => {
    figurePreview.hidden = false;
    document.querySelector("#figure-status").textContent = "Gambar ditemukan.";
  };
  figurePreview.onerror = () => {
    figurePreview.hidden = true;
    document.querySelector("#figure-status").textContent = `Gambar tidak ditemukan: ${imageUrl}. Periksa nama file dan path assets/images/.`;
  };
  figurePreview.src = new URL(imageUrl, `${window.location.origin}/`).href;
};

figureAssetSelect.addEventListener("change", () => {
  if (!figureAssetSelect.value) return;
  figureUrlInput.value = figureAssetSelect.value;
  previewFigureUrl();
});
figureUrlInput.addEventListener("input", () => {
  figureAssetSelect.value = "";
  previewFigureUrl();
});

insertLinkButton.addEventListener("click", () => {
  const status = document.querySelector("#link-status");
  const linkText = document.querySelector("#link-text").value.trim();
  const linkUrl = document.querySelector("#link-url").value.trim();
  if (!linkText) {
    status.textContent = "Masukkan teks hyperlink atau sorot teks di editor terlebih dahulu.";
    return;
  }
  if (!linkUrl || !isAllowedUrl(linkUrl, ["http:", "https:", "mailto:"])) {
    status.textContent = "Masukkan URL HTTP/HTTPS, mailto, atau path relatif yang valid.";
    return;
  }

  restoreEditorSelection();
  const selection = window.getSelection();
  const link = document.createElement("a");
  link.setAttribute("href", linkUrl);
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  if (selection && selection.rangeCount && !selection.getRangeAt(0).collapsed) {
    link.appendChild(selection.getRangeAt(0).extractContents());
    selection.getRangeAt(0).insertNode(link);
    const range = document.createRange();
    range.setStartAfter(link);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    savedEditorRange = range.cloneRange();
    syncEditorContent();
  } else {
    link.textContent = linkText;
    insertEditorNode(link);
  }
  document.querySelector("#link-text").value = "";
  document.querySelector("#link-url").value = "";
  status.textContent = "Hyperlink berhasil dimasukkan ke draft.";
});

resetButton.addEventListener("click", () => {
  const selected = getSelectedArticle();
  if (selected) {
    updateForm(selected);
    return;
  }
  form.reset();
  editor.innerHTML = "";
  syncEditorContent();
  closeInsertPanels();
});

publishWorkerUrlInput.value = sessionStorage.getItem(PUBLISH_WORKER_URL_KEY) || DEFAULT_PUBLISH_WORKER_URL;
publishWorkerTokenInput.value = sessionStorage.getItem(PUBLISH_WORKER_TOKEN_KEY) || "";
publishWorkerUrlInput.addEventListener("change", () => {
  const value = publishWorkerUrlInput.value.trim();
  if (value) sessionStorage.setItem(PUBLISH_WORKER_URL_KEY, value);
  else sessionStorage.removeItem(PUBLISH_WORKER_URL_KEY);
});
publishWorkerTokenInput.addEventListener("input", () => {
  if (publishWorkerTokenInput.value) {
    sessionStorage.setItem(PUBLISH_WORKER_TOKEN_KEY, publishWorkerTokenInput.value);
  } else {
    sessionStorage.removeItem(PUBLISH_WORKER_TOKEN_KEY);
  }
});

const initializeDashboard = () => {
  const params = new URLSearchParams(window.location.search);
  const requestedId = params.get("article");

  if (requestedId) {
    const foundArticle = articles.find((article) => article.id === requestedId);
    if (foundArticle) {
      currentArticleId = foundArticle.id;
      updateForm(foundArticle);
    }
  }

  if (!currentArticleId && articles.length > 0) {
    currentArticleId = articles[0].id;
    updateForm(articles[0]);
  }

  renderArticleList();
};

initializeDashboard();
