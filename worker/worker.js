const API_VERSION = "2022-11-28";
const ARTICLE_FILE = "articles.json";
const MAX_ARTICLE_BYTES = 500_000;

const jsonResponse = (body, status, origin) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...(origin ? { "Access-Control-Allow-Origin": origin, "Vary": "Origin" } : {})
  }
});

const encodeBase64 = (value) => {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
};

const decodeBase64 = (value) => {
  const binary = atob(value.replace(/\s/g, ""));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

const constantTimeEquals = (left, right) => {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
};

const validateArticle = (article) => {
  if (!article || typeof article !== "object" || Array.isArray(article)) return "Data artikel tidak valid.";
  if (typeof article.id !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(article.id)) return "ID artikel tidak valid.";
  if (typeof article.title !== "string" || !article.title.trim() || article.title.length > 200) return "Judul wajib diisi (maksimal 200 karakter).";
  if (typeof article.category !== "string" || !article.category.trim() || article.category.length > 80) return "Kategori wajib diisi (maksimal 80 karakter).";
  if (typeof article.summary !== "string" || !article.summary.trim() || article.summary.length > 1000) return "Ringkasan wajib diisi (maksimal 1000 karakter).";
  if (typeof article.content !== "string" || !article.content.trim()) return "Isi artikel wajib diisi.";
  if (new TextEncoder().encode(article.content).byteLength > MAX_ARTICLE_BYTES) return "Isi artikel melebihi batas 500 KB.";
  return "";
};

const getArticlesFile = async (env, headers) => {
  const url = `https://api.github.com/repos/${encodeURIComponent(env.GITHUB_OWNER)}/${encodeURIComponent(env.GITHUB_REPO)}/contents/${ARTICLE_FILE}?ref=${encodeURIComponent(env.GITHUB_BRANCH)}`;
  const response = await fetch(url, { headers });
  if (response.status === 404) return { articles: [], sha: null };
  if (!response.ok) {
    const details = await response.text();
    throw new Error(`GitHub gagal membaca ${ARTICLE_FILE} (HTTP ${response.status}): ${details.slice(0, 300)}`);
  }
  const file = await response.json();
  const parsed = JSON.parse(decodeBase64(file.content));
  if (!Array.isArray(parsed)) throw new Error(`${ARTICLE_FILE} harus berisi daftar artikel.`);
  return { articles: parsed, sha: file.sha };
};

const upsertArticle = async (article, env) => {
  const headers = {
    "Accept": "application/vnd.github+json",
    "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": API_VERSION
  };
  const current = await getArticlesFile(env, headers);
  const articleIndex = current.articles.findIndex((item) => item.id === article.id);
  const savedArticle = {
    ...article,
    published: true,
    publishedAt: current.articles[articleIndex]?.publishedAt || article.publishedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  if (articleIndex >= 0) current.articles[articleIndex] = savedArticle;
  else current.articles.unshift(savedArticle);

  const body = {
    message: `Publish article: ${savedArticle.title}`,
    content: encodeBase64(`${JSON.stringify(current.articles, null, 2)}\n`),
    branch: env.GITHUB_BRANCH
  };
  if (current.sha) body.sha = current.sha;

  const url = `https://api.github.com/repos/${encodeURIComponent(env.GITHUB_OWNER)}/${encodeURIComponent(env.GITHUB_REPO)}/contents/${ARTICLE_FILE}`;
  const response = await fetch(url, { method: "PUT", headers, body: JSON.stringify(body) });
  if (response.status === 409 || response.status === 422) {
    throw new Error("Artikel belum terkirim karena file berubah bersamaan. Coba simpan kembali.");
  }
  if (!response.ok) {
    const details = await response.text();
    throw new Error(`GitHub gagal menyimpan artikel (HTTP ${response.status}): ${details.slice(0, 300)}`);
  }
  const result = await response.json();
  return { id: savedArticle.id, commit: result.commit?.sha || "" };
};

export default {
  async fetch(request, env) {
    const allowedOrigins = (env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);
    const requestOrigin = request.headers.get("Origin") || "";
    if (!allowedOrigins.includes(requestOrigin)) {
      return jsonResponse({ error: "Origin website tidak diizinkan." }, 403);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": requestOrigin,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Authorization, Content-Type",
          "Access-Control-Max-Age": "86400",
          "Vary": "Origin"
        }
      });
    }
    if (request.method !== "POST") {
      return jsonResponse({ error: "Gunakan POST untuk menerbitkan artikel." }, 405, requestOrigin);
    }

    const authorization = request.headers.get("Authorization") || "";
    const providedToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    if (!env.PUBLISH_TOKEN || !constantTimeEquals(providedToken, env.PUBLISH_TOKEN)) {
      return jsonResponse({ error: "Kunci publikasi tidak benar." }, 401, requestOrigin);
    }
    if (!env.GITHUB_TOKEN || !env.GITHUB_OWNER || !env.GITHUB_REPO || !env.GITHUB_BRANCH) {
      return jsonResponse({ error: "Konfigurasi publikasi GitHub belum lengkap." }, 500, requestOrigin);
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return jsonResponse({ error: "Isi permintaan harus berupa JSON yang valid." }, 400, requestOrigin);
    }
    const article = payload?.article;
    const validationError = validateArticle(article);
    if (validationError) return jsonResponse({ error: validationError }, 400, requestOrigin);

    try {
      const result = await upsertArticle(article, env);
      return jsonResponse({ ok: true, ...result }, 200, requestOrigin);
    } catch (error) {
      console.error(error);
      return jsonResponse({ error: error.message || "Terjadi kesalahan saat menyimpan artikel ke GitHub." }, 502, requestOrigin);
    }
  }
};
