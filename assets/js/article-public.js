const cardThemes = ["visual-blue", "visual-lilac", "visual-peach", "visual-mint", "visual-yellow", "visual-pink"];
const cardImagesByArticleId = new Map([
  ["1-web-development", "assets/images/kartu.artikel.2.png"],
  ["2-learning-journey", "assets/images/Esma-Learning.Journey.png"],
  ["3-artificial-intelligence", "assets/images/10102026/pusat-zero-trust.png"],
  ["4-cloud-computing", "assets/images/project-cloud.svg"],
  ["5-community-learning", "assets/images/Ms.Learn.png"],
  ["6-document-process", "assets/images/project-web.svg"],
  ["7-scam-ready-asean", "assets/images/scam-asean.png"],
  ["8-halal-journey", "assets/images/halal-journey.png"]
]);

const defaultCardImage = "assets/images/project-web.svg";
const safeArticleTags = new Set([
  "a", "b", "blockquote", "br", "div", "em", "figcaption", "figure",
  "h2", "h3", "i", "img", "li", "ol", "p", "span", "strong", "u", "ul"
]);
const safeArticleFonts = new Set(["DM Sans", "Manrope", "Arial", "Georgia", "Verdana"]);
const safeArticleSizes = new Set(["12px", "14px", "16px", "18px", "24px", "32px"]);
const safeArticleLineHeights = new Set(["1.2", "1.5", "1.8", "2", "2.5"]);

const readPublicArticles = async () => {
  const response = await fetch(new URL("articles.json", window.location.href), { cache: "no-store" });
  if (!response.ok) throw new Error(`Gagal memuat artikel publik (HTTP ${response.status}).`);
  const parsed = await response.json();
  if (!Array.isArray(parsed)) throw new Error("Data artikel publik tidak berbentuk daftar.");
  return parsed.filter((article) => article && article.published !== false && article.id && article.title);
};

const safeArticleUrl = (value, protocols) => {
  try {
    const url = new URL(value, window.location.href);
    if (protocols.includes(url.protocol)) return true;
    return !/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value) && !value.startsWith("//");
  } catch {
    return false;
  }
};

const cleanArticleHtml = (html) => {
  const parsed = new DOMParser().parseFromString(html || "", "text/html");
  const cleanNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.nodeValue || "");
    if (node.nodeType !== Node.ELEMENT_NODE) return null;

    const tag = node.tagName.toLowerCase();
    if (["script", "style", "iframe", "object", "embed", "svg", "math"].includes(tag)) return null;

    if (!safeArticleTags.has(tag)) {
      const fragment = document.createDocumentFragment();
      Array.from(node.childNodes).forEach((child) => {
        const cleanChild = cleanNode(child);
        if (cleanChild) fragment.appendChild(cleanChild);
      });
      return fragment;
    }

    const output = document.createElement(tag);
    if (tag === "img") {
      const src = node.getAttribute("src") || "";
      if (!safeArticleUrl(src, ["http:", "https:"])) return null;
      output.setAttribute("src", src);
      output.setAttribute("alt", node.getAttribute("alt") || "");
      if (node.style.marginLeft === "0px" || node.style.marginLeft === "auto") {
        output.style.marginLeft = node.style.marginLeft;
      }
      if (node.style.marginRight === "0px" || node.style.marginRight === "auto") {
        output.style.marginRight = node.style.marginRight;
      }
      return output;
    }

    if (tag === "a") {
      const href = node.getAttribute("href") || "";
      if (safeArticleUrl(href, ["http:", "https:", "mailto:"])) {
        output.setAttribute("href", href);
        output.setAttribute("target", "_blank");
        output.setAttribute("rel", "noopener noreferrer");
      }
    }

    const fontFamily = (node.style.fontFamily || "").split(",")[0].replace(/^["']|["']$/g, "");
    const fontSize = node.style.fontSize;
    if (safeArticleFonts.has(fontFamily)) output.style.fontFamily = fontFamily;
    if (safeArticleSizes.has(fontSize)) output.style.fontSize = fontSize;
    if (safeArticleLineHeights.has(node.style.lineHeight)
      && ["div", "p", "h2", "h3", "blockquote", "li"].includes(tag)) {
      output.style.lineHeight = node.style.lineHeight;
    }
    if (["left", "center", "right", "justify"].includes(node.style.textAlign)
      && ["div", "p", "h2", "h3", "blockquote"].includes(tag)) {
      output.style.textAlign = node.style.textAlign;
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
  if (parsed.body.children.length && cleanBody.childNodes.length) return cleanBody.innerHTML;

  return (html || "")
    .split(/\n{2,}/)
    .map((paragraph) => {
      const safeText = paragraph.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return `<p>${safeText.replace(/\n/g, "<br>")}</p>`;
    })
    .join("");
};

const articleText = (content) => {
  const parsed = new DOMParser().parseFromString(content || "", "text/html");
  return parsed.body.textContent || "";
};

const readingTime = (article) => Math.max(1, Math.ceil(articleText(article.content).trim().split(/\s+/).filter(Boolean).length / 200));

const articleHref = (id) => `blog.html?article=${encodeURIComponent(id)}`;
const articleCardImage = (article) => cardImagesByArticleId.get(String(article.id)) || defaultCardImage;

const makeArticleCard = (article, index) => {
  const card = document.createElement("article");
  const theme = cardThemes[index % cardThemes.length];
  const image = articleCardImage(article);
  card.className = "article-card searchable-card";
  card.dataset.articleId = article.id;
  card.dataset.dynamicArticle = "true";
  card.dataset.search = `${article.category || ""} ${article.title} ${article.summary || ""}`;

  const visual = document.createElement("a");
  visual.className = `article-visual ${theme}`;
  visual.href = articleHref(article.id);
  visual.setAttribute("aria-label", `Baca artikel ${article.title}`);
  const visualImage = document.createElement("img");
  visualImage.src = image;
  visualImage.alt = "";
  visualImage.setAttribute("aria-hidden", "true");
  const visualLabel = document.createElement("span");
  visualLabel.className = "visual-label";
  visualLabel.textContent = article.category || "ARTIKEL";
  visual.append(visualImage, visualLabel);

  const content = document.createElement("div");
  content.className = "article-content";
  const meta = document.createElement("p");
  meta.className = "article-meta";
  meta.textContent = `${article.category || "Artikel"} · ${readingTime(article)} menit baca`;
  const heading = document.createElement("h2");
  const titleLink = document.createElement("a");
  titleLink.href = articleHref(article.id);
  titleLink.textContent = article.title;
  heading.appendChild(titleLink);
  const summary = document.createElement("p");
  summary.textContent = article.summary || "";
  const readLink = document.createElement("a");
  readLink.className = "card-link";
  readLink.href = articleHref(article.id);
  readLink.textContent = "BACA ARTIKEL";
  content.append(meta, heading, summary, readLink);
  card.append(visual, content);
  return card;
};

const updateExistingBlogCard = (card, article) => {
  card.dataset.search = `${article.category || ""} ${article.title} ${article.summary || ""}`;
  const image = card.querySelector(".article-visual img");
  if (image) image.src = articleCardImage(article);
  const meta = card.querySelector(".article-meta");
  if (meta) meta.textContent = `${article.category || "Artikel"} · ${readingTime(article)} menit baca`;
  const heading = card.querySelector("h2");
  if (heading) {
    const link = document.createElement("a");
    link.href = articleHref(article.id);
    link.textContent = article.title;
    heading.replaceChildren(link);
  }
  const summary = card.querySelector(".article-content > p:not(.article-meta)");
  if (summary) summary.textContent = article.summary || "";
  const readLink = card.querySelector(".card-link");
  if (readLink) {
    readLink.href = articleHref(article.id);
    readLink.textContent = "BACA ARTIKEL";
  }
};

const renderBlogCards = (articles) => {
  const list = document.querySelector("#article-list");
  if (!list) return;
  const storedIds = new Set();

  articles.forEach((article) => {
    const existing = list.querySelector(`[data-article-id="${CSS.escape(String(article.id))}"]`);
    if (existing) {
      updateExistingBlogCard(existing, article);
    } else {
      list.appendChild(makeArticleCard(article, list.children.length));
    }
    storedIds.add(String(article.id));
  });

  list.querySelectorAll("[data-dynamic-article='true']").forEach((card) => {
    if (!storedIds.has(card.dataset.articleId)) card.remove();
  });
  const disclaimer = document.querySelector("#blog-disclaimer");
  if (disclaimer) disclaimer.hidden = articles.length > 0;
  document.querySelector("#article-search")?.dispatchEvent(new Event("input", { bubbles: true }));
};

const renderHomeCards = (articles) => {
  const list = document.querySelector("#home-article-list");
  if (!list || articles.length === 0) return;
  const sortedArticles = [...articles].sort((a, b) => {
    const aDate = Date.parse(a.updatedAt || a.publishedAt || "") || 0;
    const bDate = Date.parse(b.updatedAt || b.publishedAt || "") || 0;
    return bDate - aDate;
  });
  list.replaceChildren(...sortedArticles.slice(0, 3).map(makeArticleCard));
};

const renderArticleDetail = (articles) => {
  const requestedId = new URLSearchParams(window.location.search).get("article");
  const detail = document.querySelector("#published-article");
  if (!requestedId || !detail) return;

  const article = articles.find((item) => String(item.id) === requestedId);
  const toolbar = document.querySelector("#blog-toolbar");
  const list = document.querySelector("#article-list");
  const emptyState = document.querySelector("#empty-state");
  const disclaimer = document.querySelector("#blog-disclaimer");
  if (toolbar) toolbar.hidden = true;
  if (list) list.hidden = true;
  if (emptyState) emptyState.hidden = true;
  if (disclaimer) disclaimer.hidden = true;
  detail.hidden = false;

  if (!article) {
    detail.textContent = "Artikel tidak ditemukan atau belum dipublikasikan di browser ini.";
    return;
  }

  const backLink = document.createElement("a");
  backLink.className = "text-link published-article-back";
  backLink.href = "blog.html";
  backLink.textContent = "← Kembali ke semua artikel";
  const category = document.createElement("p");
  category.className = "eyebrow";
  category.textContent = article.category || "ARTIKEL";
  const title = document.createElement("h1");
  title.textContent = article.title;
  const summary = document.createElement("p");
  summary.className = "published-article-summary";
  summary.textContent = article.summary || "";
  const body = document.createElement("div");
  body.className = "published-article-body";
  body.innerHTML = cleanArticleHtml(article.content);
  detail.replaceChildren(backLink, category, title, summary, body);
};

const renderPublicArticles = async () => {
  let articles;
  try {
    articles = await readPublicArticles();
  } catch (error) {
    console.error(error);
    const disclaimer = document.querySelector("#blog-disclaimer");
    if (disclaimer) {
      disclaimer.hidden = false;
      disclaimer.textContent = "Artikel terbaru belum dapat dimuat. Silakan muat ulang halaman beberapa saat lagi.";
    }
    return;
  }
  renderBlogCards(articles);
  renderHomeCards(articles);
  renderArticleDetail(articles);
};

document.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;
  const card = event.target.closest(".article-card[data-article-id]");
  if (!card || event.target.closest("a, button, input, select, textarea")) return;
  window.location.assign(articleHref(card.dataset.articleId));
});

document.addEventListener("DOMContentLoaded", renderPublicArticles);
