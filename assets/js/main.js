// Interaksi ringan yang digunakan bersama oleh semua halaman.
document.addEventListener("DOMContentLoaded", () => {
  // Tahun footer diperbarui otomatis setiap tahun.
  document.querySelectorAll("[data-current-year]").forEach((element) => {
    element.textContent = new Date().getFullYear();
  });

  // Atur tautan bagikan dengan URL halaman saat ini agar tombol di header langsung berfungsi.
  const currentPageUrl = encodeURIComponent(window.location.href);
  const currentPageTitle = encodeURIComponent(document.title || "Siti Maesaroh");
  const shareLinks = document.querySelectorAll(".share-link[data-platform]");

  shareLinks.forEach((shareLink) => {
    const platform = shareLink.dataset.platform;
    let href = "#";

    switch (platform) {
      case "facebook":
        href = `https://www.facebook.com/sharer/sharer.php?u=${currentPageUrl}`;
        break;
      case "x":
        href = `https://twitter.com/intent/tweet?url=${currentPageUrl}&text=${currentPageTitle}`;
        break;
      case "linkedin":
        href = `https://www.linkedin.com/sharing/share-offsite/?url=${currentPageUrl}`;
        break;
      case "instagram":
        href = "https://www.instagram.com/";
        break;
      case "tiktok":
        href = "https://www.tiktok.com/";
        break;
      case "youtube":
        href = "https://www.youtube.com/";
        break;
      case "telegram":
        href = `https://t.me/share/url?url=${currentPageUrl}&text=${currentPageTitle}`;
        break;
      case "whatsapp":
        href = `https://api.whatsapp.com/send?text=${currentPageTitle}%20${currentPageUrl}`;
        break;
      default:
        href = "#";
    }

    shareLink.setAttribute("href", href);
    shareLink.setAttribute("title", `Bagikan ke ${platform}`);
  });

  // Gunakan zona waktu lokal perangkat untuk menampilkan tanggal Masehi dan Hijriyah.
  const localDateTicker = document.querySelector("[data-local-date]");
  const localDateTickerCopy = document.querySelector("[data-local-date-copy]");

  if (localDateTicker && localDateTickerCopy) {
    const gregorianDate = new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const hijriDate = new Intl.DateTimeFormat("id-ID-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const updateLocalDate = () => {
      const now = new Date();
      const dateText = `${gregorianDate.format(now)} · ${hijriDate.format(now)}`;
      localDateTicker.textContent = dateText;
      localDateTickerCopy.textContent = dateText;
      localDateTicker.parentElement?.setAttribute("aria-label", `Hari dan tanggal lokal: ${dateText}`);
    };

    updateLocalDate();
    window.setInterval(updateLocalDate, 60_000);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) updateLocalDate();
    });
  }

  // Teks perkenalan diketik bertahap; tampilkan langsung jika gerakan dikurangi.
  const typewriter = document.querySelector("[data-typewriter]");
  if (typewriter) {
    const fullText = typewriter.dataset.typewriter || "";
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      typewriter.textContent = fullText;
    } else {
      typewriter.textContent = "";
      let characterIndex = 0;

      const typeNextCharacter = () => {
        characterIndex += 1;
        typewriter.textContent = fullText.slice(0, characterIndex);

        if (characterIndex < fullText.length) {
          window.setTimeout(typeNextCharacter, 75);
        }
      };

      window.setTimeout(typeNextCharacter, 250);
    }
  }

  // Menu kecil untuk navigasi pada layar ponsel.
  const menuButton = document.querySelector(".menu-toggle");
  const navigation = document.querySelector(".main-nav");

  if (menuButton && navigation) {
    menuButton.addEventListener("click", () => {
      const isExpanded = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!isExpanded));
      menuButton.setAttribute("aria-label", isExpanded ? "Buka menu navigasi" : "Tutup menu navigasi");
      navigation.classList.toggle("is-open", !isExpanded);
    });

    navigation.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.setAttribute("aria-label", "Buka menu navigasi");
        navigation.classList.remove("is-open");
      });
    });
  }

  // Pencarian memfilter judul dan kata kunci artikel tanpa memuat ulang halaman.
  const searchInput = document.querySelector("#article-search");
  const emptyState = document.querySelector("#empty-state");
  const resultsCount = document.querySelector("[data-results-count]");

  if (searchInput) {
    const filterArticles = () => {
      const articleCards = Array.from(document.querySelectorAll(".searchable-card"));
      const query = searchInput.value.trim().toLocaleLowerCase("id");
      let visibleCount = 0;

      articleCards.forEach((card) => {
        const content = `${card.textContent} ${card.dataset.search || ""}`.toLocaleLowerCase("id");
        const isVisible = content.includes(query);
        card.hidden = !isVisible;
        if (isVisible) visibleCount += 1;
      });

      if (emptyState) emptyState.hidden = visibleCount !== 0;
      if (resultsCount) {
        resultsCount.textContent = `Menampilkan ${visibleCount} dari ${articleCards.length} artikel`;
      }
    };

    searchInput.addEventListener("input", filterArticles);
    filterArticles();

    // Tombol "/" memudahkan pengunjung langsung mencari artikel.
    document.addEventListener("keydown", (event) => {
      const activeElement = document.activeElement;
      const isTyping = activeElement instanceof HTMLElement
        && (activeElement.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(activeElement.tagName));

      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        searchInput.focus();
      }
    });
  }

  // Form membuka aplikasi email, karena versi statis ini belum memiliki backend.
  const contactForm = document.querySelector("#contact-form");
  const formStatus = document.querySelector("#form-status");

  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!contactForm.reportValidity()) return;

      const formData = new FormData(contactForm);
      const name = String(formData.get("name") || "").trim();
      const email = String(formData.get("email") || "").trim();
      const subject = String(formData.get("subject") || "").trim();
      const message = String(formData.get("message") || "").trim();
      const recipient = ""; // Isi dengan alamat email tujuan sebelum website dipublikasikan.

      if (!recipient) {
        if (formStatus) {
          formStatus.textContent = "Form sudah tervalidasi, tetapi belum dapat mengirim pesan. Atur alamat email tujuan pada assets/js/main.js.";
        }
        return;
      }

      const mailto = new URL(`mailto:${recipient}`);
      mailto.searchParams.set("subject", subject);
      mailto.searchParams.set("body", `Nama: ${name}\nEmail: ${email}\n\n${message}`);
      window.location.href = mailto.toString();
    });
  }
});
