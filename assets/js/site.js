(function () {
  "use strict";

  var DRAFT_KEY = "akk-site-draft";

  /* ---------- data ---------- */
  function loadData() {
    var data = window.SITE_DATA || {};
    if (/[?&]preview\b/.test(location.search)) {
      try {
        var draft = localStorage.getItem(DRAFT_KEY);
        if (draft) {
          data = JSON.parse(draft);
          document.body.classList.add("is-preview");
        }
      } catch (e) { /* ignore broken draft */ }
    }
    data.profile = data.profile || {};
    window.SITE_SECTIONS.forEach(function (k) { if (!Array.isArray(data[k])) data[k] = []; });
    return data;
  }

  /* ---------- helpers ---------- */
  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function safeUrl(u) {
    u = String(u || "").trim();
    if (!u) return "";
    if (/^(https?:|mailto:|tel:)/i.test(u)) return u;
    if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return ""; // block javascript:, data:, etc.
    return u; // relative path in repo
  }
  function doiUrl(doi) {
    doi = String(doi || "").trim();
    if (!doi) return "";
    return /^https?:/i.test(doi) ? doi : "https://doi.org/" + doi.replace(/^doi:\s*/i, "");
  }
  function isImage(p) { return /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(p || ""); }
  function yearOf(s) { var m = String(s || "").match(/(19|20)\d{2}/g); return m ? +m[m.length - 1] : 0; }
  function join(parts, sep) { return parts.filter(function (p) { return p && String(p).trim(); }).join(sep || ", "); }
  function badge(text, cls) { return text ? '<span class="badge ' + (cls || "") + '">' + esc(text) + "</span>" : ""; }
  function linkBtn(href, label, icon) {
    href = safeUrl(href);
    if (!href) return "";
    return '<a class="btn-link" href="' + esc(href) + '" target="_blank" rel="noopener">' + (icon || "") + esc(label) + "</a>";
  }
  function fileBtn(item, key, label) {
    var f = safeUrl(item[key || "file"]);
    if (!f) return "";
    if (isImage(f)) return '<button type="button" class="btn-link" data-lightbox="' + esc(f) + '">' + ICON.image + esc(label || "View") + "</button>";
    return linkBtn(f, label || "PDF", ICON.file);
  }
  function actions(html) { html = html.join(""); return html ? '<div class="item-actions">' + html + "</div>" : ""; }
  function sorted(list, key) {
    if (!key) return list.slice();
    return list.map(function (x, i) { return { x: x, i: i }; })
      .sort(function (a, b) { return (yearOf(b.x[key]) - yearOf(a.x[key])) || (a.i - b.i); })
      .map(function (o) { return o.x; });
  }

  var ICON = {
    file: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
    image: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>',
    link: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/></svg>',
    phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    download: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></svg>'
  };

  /* ---------- citations ---------- */
  function citePublication(p) {
    var s = "";
    if (p.authors) s += p.authors + " ";
    if (p.year) s += "(" + p.year + "). ";
    s += (p.title || "") + ". ";
    if (p.journal) {
      s += p.journal;
      if (p.volume) s += ", " + p.volume + (p.issue ? "(" + p.issue + ")" : "");
      if (p.pages) s += ", " + p.pages;
      s += ".";
    }
    if (p.doi) s += " " + doiUrl(p.doi);
    return s.replace(/\s+/g, " ").trim();
  }
  function citeChapter(c) {
    var s = "";
    if (c.authors) s += c.authors + " ";
    if (c.year) s += "(" + c.year + "). ";
    s += (c.chapterTitle || "") + ". ";
    if (c.bookTitle) s += "In " + (c.editors ? c.editors + " (Eds.), " : "") + c.bookTitle + (c.pages ? " (pp. " + c.pages + ")" : "") + ". ";
    if (c.publisher) s += c.publisher + ".";
    if (c.doi) s += " " + doiUrl(c.doi);
    return s.replace(/\s+/g, " ").trim();
  }
  function citeBtn(text) {
    return '<button type="button" class="btn-link" data-copy="' + esc(text) + '">' + ICON.copy + "Cite</button>";
  }

  /* ---------- renderers per section ---------- */
  var R = {
    positions: function (x) {
      return '<article class="item timeline-item"><h3>' + esc(x.role) + "</h3>" +
        '<p class="meta">' + esc(join([x.organization, x.period], " · ")) + "</p>" +
        (x.description ? "<p>" + esc(x.description) + "</p>" : "") + "</article>";
    },
    education: function (x) {
      return '<article class="item timeline-item"><div class="item-head"><h3>' + esc(x.degree) + "</h3>" +
        (x.year ? '<span class="pill">' + esc(x.year) + "</span>" : "") + "</div>" +
        '<p class="meta">' + esc(x.institution) + "</p>" +
        ((x.score || x.notes) ? '<p class="small">' + esc(join([x.score ? "Score: " + x.score : "", x.notes], " · ")) + "</p>" : "") +
        "</article>";
    },
    publications: function (p) {
      var venue = join([
        p.journal ? "<em>" + esc(p.journal) + "</em>" : "",
        p.volume ? "Vol. " + esc(p.volume) + (p.issue ? "(" + esc(p.issue) + ")" : "") : "",
        p.pages ? "pp. " + esc(p.pages) : "",
        p.issn ? "ISSN: " + esc(p.issn) : ""
      ]);
      return '<article class="item pub">' +
        '<div class="item-head"><h3>' + esc(p.title) + "</h3>" + (p.year ? '<span class="pill">' + esc(p.year) + "</span>" : "") + "</div>" +
        (p.authors ? '<p class="authors">' + esc(p.authors) + "</p>" : "") +
        (venue ? '<p class="meta">' + venue + "</p>" : "") +
        '<div class="badges">' + badge(p.status, p.status === "Published" ? "ok" : "warn") + String(p.indexing || "").split(/[,;]/).map(function (t) { return badge(t.trim(), "idx"); }).join("") + "</div>" +
        (p.abstract ? '<details class="abstract"><summary>Abstract</summary><p>' + esc(p.abstract) + "</p></details>" : "") +
        actions([linkBtn(doiUrl(p.doi), "DOI", ICON.link), linkBtn(p.url, "Online", ICON.link), fileBtn(p, "file", "PDF"), citeBtn(citePublication(p))]) +
        "</article>";
    },
    conferences: function (c) {
      return '<article class="item">' +
        '<div class="item-head"><h3>' + esc(c.title) + "</h3>" + (c.date ? '<span class="pill">' + esc(c.date) + "</span>" : "") + "</div>" +
        (c.authors ? '<p class="authors">' + esc(c.authors) + "</p>" : "") +
        '<p class="meta">' + esc(join([c.event, c.organizer, c.venue])) + "</p>" +
        (c.proceedings ? '<p class="small">Proceedings: ' + esc(c.proceedings) + "</p>" : "") +
        '<div class="badges">' + badge(c.level, "idx") + badge(c.role, "ok") + "</div>" +
        actions([linkBtn(c.url, "Link", ICON.link), fileBtn(c, "file", "File")]) +
        "</article>";
    },
    seminars: function (s) {
      return '<article class="item">' +
        '<div class="item-head"><h3>' + esc(s.title) + "</h3>" + (s.date ? '<span class="pill">' + esc(s.date) + "</span>" : "") + "</div>" +
        '<p class="meta">' + esc(join([s.organizer, s.venue])) + "</p>" +
        '<div class="badges">' + badge(s.type, "") + badge(s.level, "idx") + badge(s.role, "ok") + "</div>" +
        actions([linkBtn(s.url, "Link", ICON.link), fileBtn(s, "file", "Certificate")]) +
        "</article>";
    },
    bookChapters: function (c) {
      return '<article class="item pub">' +
        '<div class="item-head"><h3>' + esc(c.chapterTitle) + "</h3>" + (c.year ? '<span class="pill">' + esc(c.year) + "</span>" : "") + "</div>" +
        (c.authors ? '<p class="authors">' + esc(c.authors) + "</p>" : "") +
        '<p class="meta">' + join([
          c.bookTitle ? "In: <em>" + esc(c.bookTitle) + "</em>" : "",
          c.editors ? "Eds. " + esc(c.editors) : "",
          esc(c.publisher || ""),
          c.pages ? "pp. " + esc(c.pages) : "",
          c.isbn ? "ISBN: " + esc(c.isbn) : ""
        ]) + "</p>" +
        actions([linkBtn(doiUrl(c.doi), "DOI", ICON.link), linkBtn(c.url, "Link", ICON.link), fileBtn(c, "file", "PDF"), citeBtn(citeChapter(c))]) +
        "</article>";
    },
    books: function (b) {
      var cover = safeUrl(b.cover);
      return '<article class="item book">' +
        (cover ? '<img class="book-cover" src="' + esc(cover) + '" alt="Cover of ' + esc(b.title) + '" loading="lazy">' : "") +
        '<div class="book-body"><div class="item-head"><h3>' + esc(b.title) + "</h3>" + (b.year ? '<span class="pill">' + esc(b.year) + "</span>" : "") + "</div>" +
        (b.authors ? '<p class="authors">' + esc(b.authors) + "</p>" : "") +
        '<p class="meta">' + esc(join([b.publisher, b.edition ? b.edition + " edition" : "", b.isbn ? "ISBN: " + b.isbn : ""])) + "</p>" +
        '<div class="badges">' + badge(b.role, "ok") + "</div>" +
        actions([linkBtn(b.url, "Link", ICON.link), fileBtn(b, "file", "PDF")]) +
        "</div></article>";
    },
    patents: function (p) {
      var rows = [
        ["Application No.", p.applicationNo], ["Patent / Reg. No.", p.patentNo], ["Office", p.office],
        ["Filed", p.filedDate], ["Published", p.publishedDate], ["Granted", p.grantedDate]
      ].filter(function (r) { return r[1]; });
      return '<article class="item">' +
        '<div class="item-head"><h3>' + esc(p.title) + "</h3>" + badge(p.status, p.status === "Granted" || p.status === "Registered" ? "ok" : "warn") + "</div>" +
        (p.inventors ? '<p class="authors">Inventors: ' + esc(p.inventors) + "</p>" : "") +
        (p.type ? '<div class="badges">' + badge(p.type, "idx") + "</div>" : "") +
        (rows.length ? '<dl class="kv">' + rows.map(function (r) { return "<dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd>"; }).join("") + "</dl>" : "") +
        actions([linkBtn(p.url, "Link", ICON.link), fileBtn(p, "file", "Document")]) +
        "</article>";
    },
    certificates: function (c) {
      var f = safeUrl(c.file);
      var thumb = f && isImage(f)
        ? '<button type="button" class="cert-thumb" data-lightbox="' + esc(f) + '"><img src="' + esc(f) + '" alt="' + esc(c.title) + ' certificate" loading="lazy"></button>'
        : '<div class="cert-thumb cert-icon" aria-hidden="true">' + ICON.file + "</div>";
      return '<article class="item cert">' + thumb +
        '<div><h3>' + esc(c.title) + "</h3>" +
        '<p class="meta">' + esc(join([c.issuer, c.date], " · ")) + "</p>" +
        (c.credentialId ? '<p class="small">Credential ID: ' + esc(c.credentialId) + "</p>" : "") +
        actions([linkBtn(c.url, "Verify", ICON.link), f && !isImage(f) ? linkBtn(f, "Certificate", ICON.file) : ""]) +
        "</div></article>";
    },
    skills: function (s) {
      var items = Array.isArray(s.items) ? s.items : String(s.items || "").split(",");
      return '<article class="item skill-card"><h3>' + esc(s.category) + '</h3><ul class="chips">' +
        items.filter(Boolean).map(function (i) { return "<li>" + esc(String(i).trim()) + "</li>"; }).join("") + "</ul></article>";
    },
    achievements: function (a) {
      return '<article class="item"><div class="item-head"><h3>' + esc(a.title) + "</h3>" + (a.year ? '<span class="pill">' + esc(a.year) + "</span>" : "") + "</div>" +
        (a.description ? "<p>" + esc(a.description) + "</p>" : "") +
        actions([fileBtn(a, "file", "View")]) + "</article>";
    }
  };

  var LAYOUT = {
    positions: "timeline", education: "timeline", skills: "grid", certificates: "grid", books: "grid", achievements: "list"
  };
  var RESEARCH = ["publications", "conferences", "seminars", "bookChapters", "books", "patents"];

  /* ---------- page ---------- */
  function renderHero(p) {
    var photo = safeUrl(p.photo);
    var initials = String(p.name || "").split(/\s+/).map(function (w) { return w.charAt(0); }).join("").slice(0, 2).toUpperCase();
    var links = [];
    if (p.email) links.push('<a href="mailto:' + esc(p.email) + '" title="Email">' + ICON.mail + "<span>Email</span></a>");
    if (p.linkedin) links.push('<a href="' + esc(safeUrl(p.linkedin)) + '" target="_blank" rel="noopener">LinkedIn</a>');
    if (p.orcid) links.push('<a href="' + esc(safeUrl(p.orcid)) + '" target="_blank" rel="noopener">ORCID</a>');
    if (p.googleScholar) links.push('<a href="' + esc(safeUrl(p.googleScholar)) + '" target="_blank" rel="noopener">Google Scholar</a>');
    if (p.researchGate) links.push('<a href="' + esc(safeUrl(p.researchGate)) + '" target="_blank" rel="noopener">ResearchGate</a>');
    if (p.github) links.push('<a href="' + esc(safeUrl(p.github)) + '" target="_blank" rel="noopener">GitHub</a>');

    document.getElementById("hero").innerHTML =
      '<div class="container hero-inner">' +
        '<div class="avatar">' + (photo ? '<img src="' + esc(photo) + '" alt="Photo of ' + esc(p.name) + '">' : "<span>" + esc(initials) + "</span>") + "</div>" +
        '<div class="hero-text">' +
          '<p class="eyebrow">' + esc(p.title) + "</p>" +
          "<h1>" + esc(p.name) + "</h1>" +
          '<p class="affil">' + esc(p.department) + (p.university ? "<br>" + esc(p.university) : "") + "</p>" +
          (p.tagline ? '<p class="tagline">' + esc(p.tagline) + "</p>" : "") +
          '<div class="hero-links">' + links.join("") +
            (safeUrl(p.cv) ? '<a class="primary" href="' + esc(safeUrl(p.cv)) + '" target="_blank" rel="noopener">' + ICON.download + "<span>Download CV</span></a>" : "") +
          "</div>" +
        "</div>" +
      "</div>";
  }

  function renderAbout(p) {
    var paras = String(p.about || "").split(/\n\s*\n/).filter(Boolean).map(function (t) { return "<p>" + esc(t.trim()) + "</p>"; }).join("");
    var interests = (Array.isArray(p.researchInterests) ? p.researchInterests : String(p.researchInterests || "").split(","))
      .filter(Boolean).map(function (i) { return "<li>" + esc(String(i).trim()) + "</li>"; }).join("");
    return '<section id="about" class="section"><div class="container about-grid">' +
      '<div><h2 class="section-title">About</h2>' + paras + "</div>" +
      (interests ? '<aside class="card"><h3>Research Interests</h3><ul class="chips">' + interests + "</ul></aside>" : "") +
      "</div></section>";
  }

  function renderStats(data) {
    var items = [
      ["publications", "Research Papers"], ["conferences", "Conference Papers"], ["seminars", "Seminars & Workshops"],
      ["bookChapters", "Book Chapters"], ["books", "Books"], ["patents", "Patents"], ["certificates", "Certificates"]
    ];
    return '<section class="stats"><div class="container stats-grid">' + items.map(function (it) {
      return '<a class="stat" href="#' + it[0] + '"><strong>' + data[it[0]].length + "</strong><span>" + esc(it[1]) + "</span></a>";
    }).join("") + "</div></section>";
  }

  function renderSection(key, list, opts) {
    var def = window.SITE_SCHEMA[key];
    var items = sorted(list, def.sortBy);
    var layout = LAYOUT[key] || "list";
    var body = items.length
      ? '<div class="items ' + layout + '">' + items.map(function (x) {
          var text = Object.keys(x).map(function (k) { return Array.isArray(x[k]) ? x[k].join(" ") : x[k]; }).join(" ").toLowerCase();
          return '<div class="item-wrap" data-search="' + esc(text) + '">' + R[key](x) + "</div>";
        }).join("") + "</div>"
      : '<p class="empty">No entries yet — this section will be updated soon.</p>';
    return '<section id="' + key + '" class="section' + (opts.alt ? " alt" : "") + '" data-research="' + (RESEARCH.indexOf(key) > -1) + '">' +
      '<div class="container"><div class="section-head"><h2 class="section-title">' + esc(def.title) + "</h2>" +
      (items.length ? '<span class="count">' + items.length + "</span>" : "") + "</div>" + body + "</div></section>";
  }

  function renderContact(p) {
    var rows = [];
    if (p.email) rows.push('<li>' + ICON.mail + '<a href="mailto:' + esc(p.email) + '">' + esc(p.email) + "</a></li>");
    if (p.phone) rows.push('<li>' + ICON.phone + '<a href="tel:' + esc(String(p.phone).replace(/[^\d+]/g, "")) + '">' + esc(p.phone) + "</a></li>");
    rows.push('<li>' + ICON.pin + "<span>" + esc(join([p.department, p.university, p.location], ", ")) + "</span></li>");
    return '<section id="contact" class="section alt"><div class="container"><h2 class="section-title">Contact</h2>' +
      '<div class="contact-card card"><ul class="contact-list">' + rows.join("") + "</ul>" +
      (p.languages ? '<p class="small">Languages: ' + esc(p.languages) + "</p>" : "") + "</div></div></section>";
  }

  function buildNav(keys) {
    var nav = document.getElementById("nav-links");
    var short = {
      positions: "Positions", education: "Education", publications: "Papers", conferences: "Conferences",
      seminars: "Seminars", bookChapters: "Chapters", books: "Books", patents: "Patents",
      certificates: "Certificates", skills: "Skills", achievements: "Achievements"
    };
    nav.innerHTML = '<li><a href="#about">About</a></li>' +
      keys.map(function (k) { return '<li><a href="#' + k + '">' + short[k] + "</a></li>"; }).join("") +
      '<li><a href="#contact">Contact</a></li>';
  }

  function render() {
    var data = loadData();
    var p = data.profile;
    var show = p.showEmptySections !== false;
    document.title = (p.name || "Profile") + " — " + (p.title || "");
    document.getElementById("brand").textContent = p.name || "";

    renderHero(p);

    var keys = window.SITE_SECTIONS.filter(function (k) { return show || data[k].length; });
    var html = renderAbout(p) + renderStats(data);
    var researchShown = false;
    keys.forEach(function (k, i) {
      if (RESEARCH.indexOf(k) > -1 && !researchShown) {
        researchShown = true;
        html += '<div class="search-bar container"><label for="search" class="sr-only">Search research outputs</label>' +
          '<input id="search" type="search" placeholder="Search papers, conferences, chapters, books, patents…" autocomplete="off">' +
          '<span id="search-status" class="small" aria-live="polite"></span></div>';
      }
      html += renderSection(k, data[k], { alt: i % 2 === 0 });
    });
    html += renderContact(p);
    document.getElementById("main").innerHTML = html;
    buildNav(keys);

    document.getElementById("footer-text").innerHTML = "© " + new Date().getFullYear() + " " + esc(p.name) +
      ' · <a href="admin.html">Edit site</a>';
    bindSearch();
  }

  /* ---------- interactions ---------- */
  function bindSearch() {
    var input = document.getElementById("search");
    if (!input) return;
    input.addEventListener("input", function () {
      var q = input.value.trim().toLowerCase();
      var shown = 0;
      document.querySelectorAll('section[data-research="true"] .item-wrap').forEach(function (el) {
        var hit = !q || el.getAttribute("data-search").indexOf(q) > -1;
        el.hidden = !hit;
        if (hit) shown++;
      });
      document.getElementById("search-status").textContent = q ? shown + " match" + (shown === 1 ? "" : "es") : "";
    });
  }

  function toast(msg) {
    var t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.classList.remove("show"); }, 2200);
  }

  document.addEventListener("click", function (e) {
    var copy = e.target.closest("[data-copy]");
    if (copy) {
      var text = copy.getAttribute("data-copy");
      (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject())
        .then(function () { toast("Citation copied"); }, function () { window.prompt("Copy citation:", text); });
      return;
    }
    var lb = e.target.closest("[data-lightbox]");
    if (lb) {
      var box = document.getElementById("lightbox");
      box.querySelector("img").src = lb.getAttribute("data-lightbox");
      box.querySelector("a").href = lb.getAttribute("data-lightbox");
      box.hidden = false;
      return;
    }
    if (e.target.closest("#lightbox") && !e.target.closest("a")) document.getElementById("lightbox").hidden = true;
    if (e.target.closest("#nav-links a")) document.body.classList.remove("nav-open");
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") document.getElementById("lightbox").hidden = true; });

  document.getElementById("menu-btn").addEventListener("click", function () { document.body.classList.toggle("nav-open"); });

  var themeBtn = document.getElementById("theme-btn");
  function applyTheme(t) { document.documentElement.setAttribute("data-theme", t); themeBtn.setAttribute("aria-label", t === "dark" ? "Switch to light mode" : "Switch to dark mode"); }
  applyTheme(localStorage.getItem("akk-theme") || (window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  themeBtn.addEventListener("click", function () {
    var t = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    localStorage.setItem("akk-theme", t);
    applyTheme(t);
  });

  render();
})();
