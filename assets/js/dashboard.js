const STORAGE_KEY = "siti-portfolio-articles";
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
const newArticleButton = document.querySelector("#new-article");
const resetButton = document.querySelector("#reset-form");

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

const getSelectedArticle = () => articles.find((article) => article.id === currentArticleId)
  || articles[0] || null;

const updateForm = (article) => {
  if (!article) {
    form.reset();
    currentArticleId = null;
    return;
  }

  currentArticleId = article.id;
  inputs.title.value = article.title || "";
  inputs.category.value = article.category || "";
  inputs.summary.value = article.summary || "";
  inputs.content.value = article.content || "";
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
    content: "Tuliskan isi artikel Anda di sini."
  };

  articles.unshift(article);
  saveArticles();
  currentArticleId = article.id;
  updateForm(article);
  renderArticleList();
};

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = inputs.title.value.trim();
  const category = inputs.category.value.trim();
  const summary = inputs.summary.value.trim();
  const content = inputs.content.value.trim();

  if (!title || !category || !summary || !content) {
    return;
  }

  if (!currentArticleId) {
    currentArticleId = slugify(title) || `draft-${Date.now()}`;
  }

  const articleIndex = articles.findIndex((article) => article.id === currentArticleId);
  const nextArticle = {
    id: currentArticleId,
    title,
    category,
    summary,
    content
  };

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
resetButton.addEventListener("click", () => {
  const selected = getSelectedArticle();
  if (selected) {
    updateForm(selected);
    return;
  }
  form.reset();
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
