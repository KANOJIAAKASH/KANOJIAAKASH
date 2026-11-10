(function () {
  "use strict";

  var DRAFT_KEY = "akk-site-draft";
  var META_KEY = "akk-site-draft-meta";
  var GH_KEY = "akk-github-settings";
  var GH_TOKEN_KEY = "akk-github-token";
  var DATA_PATH = "data/profile.js";

  var S = window.SITE_SCHEMA;
  var SECTIONS = window.SITE_SECTIONS;
  var pending = {};          // repo path -> File waiting to be published
  var current = "profile";   // selected panel
  var editing = null;        // { key, index } (index -1 = new)
  var data, meta;

  /* ---------- state ---------- */
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function normalise(d) {
    d = d || {};
    d.profile = d.profile || {};
    SECTIONS.forEach(function (k) { if (!Array.isArray(d[k])) d[k] = []; });
    return d;
  }
  function loadState() {
    var published = normalise(clone(window.SITE_DATA || {}));
    meta = {};
    try { meta = JSON.parse(localStorage.getItem(META_KEY) || "{}"); } catch (e) { meta = {}; }
    var draft = null;
    try { draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); } catch (e) { draft = null; }

    // Unpublished edits always win. A just-published draft is kept for 15 min
    // because GitHub Pages may still be serving the old data/profile.js.
    if (draft && (meta.dirty || (meta.publishedAt && Date.now() - meta.publishedAt < 15 * 60 * 1000))) {
      data = normalise(draft);
    } else {
      data = published;
      meta = { dirty: false };
      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem(META_KEY);
    }
  }
  function save() {
    meta.dirty = true;
    meta.savedAt = Date.now();
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    localStorage.setItem(META_KEY, JSON.stringify(meta));
    updateStatus();
  }
  function updateStatus() {
    var n = Object.keys(pending).length;
    var el = document.getElementById("status");
    if (meta.dirty || n) {
      el.innerHTML = '<span class="dirty-dot"></span>Unpublished changes' + (n ? " · " + n + " file" + (n > 1 ? "s" : "") + " to upload" : "") + " (saved in this browser)";
    } else if (meta.publishedAt) {
      el.textContent = "Published " + new Date(meta.publishedAt).toLocaleTimeString() + " — the live site updates within a minute or two.";
    } else {
      el.textContent = "All changes published.";
    }
  }

  /* ---------- helpers ---------- */
  function esc(v) {
    return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function toast(msg, ms) {
    var t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.classList.remove("show"); }, ms || 2600);
  }
  function slug(name) {
    var m = String(name).toLowerCase().match(/^(.*?)(\.[a-z0-9]+)?$/);
    var base = (m[1] || "file").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "file";
    return base + "-" + Date.now().toString(36) + (m[2] || "");
  }
  function isImage(p) { return /\.(png|jpe?g|gif|webp|svg)$/i.test(p || ""); }
  function listToText(v) { return Array.isArray(v) ? v.join(", ") : (v || ""); }
  function textToList(v) { return String(v || "").split(/[,\n]/).map(function (s) { return s.trim(); }).filter(Boolean); }

  /* ---------- sidebar ---------- */
  function renderSide() {
    var html = '<button data-go="profile" class="' + (current === "profile" ? "active" : "") + '">Profile</button>';
    SECTIONS.forEach(function (k) {
      html += '<button data-go="' + k + '" class="' + (current === k ? "active" : "") + '">' + esc(S[k].label) +
        '<span class="n">' + data[k].length + "</span></button>";
    });
    html += "<hr>" +
      '<button data-go="github" class="' + (current === "github" ? "active" : "") + '">GitHub connection</button>' +
      '<button data-go="backup" class="' + (current === "backup" ? "active" : "") + '">Backup &amp; restore</button>' +
      '<button data-go="help" class="' + (current === "help" ? "active" : "") + '">Help</button>';
    $("#side").innerHTML = html;
  }

  /* ---------- form fields ---------- */
  function fieldHtml(f, value, idPrefix) {
    var id = idPrefix + f.key;
    var wide = f.type === "textarea" || f.type === "file" || f.type === "list" || f.key === "title" || f.key === "chapterTitle";
    var h = '<div class="field' + (wide ? " full" : "") + (f.type === "checkbox" ? " check" : "") + '">';
    if (f.type === "checkbox") {
      return h + '<label><input type="checkbox" id="' + id + '" data-key="' + f.key + '"' + (value !== false ? " checked" : "") + "> " + esc(f.label) + "</label></div>";
    }
    h += '<label for="' + id + '">' + esc(f.label) + (f.required ? " *" : "") + "</label>";
    if (f.type === "textarea") {
      h += '<textarea id="' + id + '" data-key="' + f.key + '">' + esc(value) + "</textarea>";
    } else if (f.type === "select") {
      h += '<select id="' + id + '" data-key="' + f.key + '"><option value="">—</option>' +
        f.options.map(function (o) { return "<option" + (o === value ? " selected" : "") + ">" + esc(o) + "</option>"; }).join("") +
        (value && f.options.indexOf(value) < 0 ? "<option selected>" + esc(value) + "</option>" : "") + "</select>";
    } else if (f.type === "file") {
      var prev = pending[value] ? URL.createObjectURL(pending[value]) : value;
      h += '<div class="file-row">' +
        (value && isImage(value) ? '<img class="preview" src="' + esc(prev) + '" alt="">' : "") +
        '<input type="text" id="' + id + '" data-key="' + f.key + '" value="' + esc(value) + '" placeholder="Upload a file, or paste a link / repo path">' +
        '<label class="btn small">Upload…<input type="file" hidden accept="' + esc(f.accept || "") + '" data-upload="' + f.key + '" data-folder="' + esc(f.folder) + '"></label>' +
        (value ? '<button type="button" class="btn small" data-clear="' + f.key + '">Remove</button>' : "") +
        "</div>" +
        (pending[value] ? '<p class="small">“' + esc(pending[value].name) + '” will be uploaded when you click Publish.</p>' : "");
    } else {
      var v = f.type === "list" ? listToText(value) : value;
      h += '<input type="' + (f.type === "url" ? "url" : "text") + '" id="' + id + '" data-key="' + f.key + '" value="' + esc(v) + '"' +
        (f.type === "url" ? ' placeholder="https://…"' : "") + ">";
    }
    return h + "</div>";
  }
  function readForm(form, fields) {
    var out = {};
    fields.forEach(function (f) {
      var el = form.querySelector('[data-key="' + f.key + '"]');
      if (!el) return;
      if (f.type === "checkbox") out[f.key] = el.checked;
      else if (f.type === "list") out[f.key] = textToList(el.value);
      else out[f.key] = el.value.trim();
    });
    return out;
  }

  /* ---------- panels ---------- */
  function renderPanel() {
    renderSide();
    var p = $("#panel");
    if (current === "profile") return renderProfile(p);
    if (current === "github") return renderGithub(p);
    if (current === "backup") return renderBackup(p);
    if (current === "help") return renderHelp(p);
    renderList(p, current);
  }

  function renderProfile(p) {
    p.innerHTML = '<div class="panel-head"><h2>Profile</h2></div>' +
      '<form id="profile-form" class="form-grid">' +
      S.profile.fields.map(function (f) { return fieldHtml(f, data.profile[f.key], "pf-"); }).join("") +
      '<div class="full btn-row"><button class="btn primary" type="submit">Save profile</button></div></form>';
  }

  function summary(key, x) {
    var def = S[key];
    var t = x[def.itemTitle] || "(untitled)";
    var sub = [x.journal, x.event, x.bookTitle, x.organizer, x.institution, x.organization, x.issuer, x.publisher, x.office, x.year, x.date, x.period]
      .filter(Boolean).slice(0, 3).join(" · ");
    if (key === "skills") sub = listToText(x.items);
    return { t: t, sub: sub };
  }

  function renderList(p, key) {
    var def = S[key];
    var list = data[key];
    var html = '<div class="panel-head"><h2>' + esc(def.title || def.label) + "</h2>" +
      '<button class="btn primary" data-add="' + key + '" type="button">+ Add new</button></div>';

    if (editing && editing.key === key) {
      var item = editing.index >= 0 ? list[editing.index] : {};
      html += '<form id="item-form" class="editor-form"><h3 style="margin-top:0">' + (editing.index >= 0 ? "Edit entry" : "New entry") + "</h3>" +
        '<div class="form-grid">' + def.fields.map(function (f) { return fieldHtml(f, item[f.key], "it-"); }).join("") + "</div>" +
        '<div class="btn-row" style="margin-top:1rem"><button class="btn primary" type="submit">Save entry</button>' +
        '<button class="btn" type="button" data-cancel>Cancel</button></div></form>';
    }

    if (!list.length) {
      html += '<p class="notice">No entries yet. Click <strong>+ Add new</strong> to add the first one.</p>';
    } else {
      html += '<div class="entry-list">' + list.map(function (x, i) {
        var s = summary(key, x);
        return '<div class="entry"><div class="t"><strong>' + esc(s.t) + "</strong><span>" + esc(s.sub) + "</span></div>" +
          '<div class="btn-row">' +
          '<button class="btn small" type="button" data-move="-1" data-i="' + i + '" title="Move up"' + (i === 0 ? " disabled" : "") + ">↑</button>" +
          '<button class="btn small" type="button" data-move="1" data-i="' + i + '" title="Move down"' + (i === list.length - 1 ? " disabled" : "") + ">↓</button>" +
          '<button class="btn small" type="button" data-edit="' + i + '">Edit</button>' +
          '<button class="btn small danger" type="button" data-del="' + i + '">Delete</button></div></div>';
      }).join("") + "</div>";
      if (def.sortBy) html += '<p class="small" style="margin-top:1rem">On the website these entries are shown newest first (by year). The order here is used for entries from the same year.</p>';
    }
    p.innerHTML = html;
    var first = p.querySelector("#item-form input, #item-form textarea");
    if (first) first.focus();
  }

  function getGh() {
    var s = {};
    try { s = JSON.parse(localStorage.getItem(GH_KEY) || "{}"); } catch (e) { s = {}; }
    if (!s.owner) {
      var host = location.hostname;
      if (/\.github\.io$/i.test(host)) {
        s.owner = host.split(".")[0];
        var seg = location.pathname.split("/").filter(Boolean)[0];
        s.repo = seg && !/\.html$/.test(seg) ? seg : host;
      } else {
        s.owner = "KANOJIAAKASH";
        s.repo = "KANOJIAAKASH";
      }
    }
    s.branch = s.branch || "main";
    s.token = sessionStorage.getItem(GH_TOKEN_KEY) || localStorage.getItem(GH_TOKEN_KEY) || "";
    s.remember = !!localStorage.getItem(GH_TOKEN_KEY);
    return s;
  }

  function renderGithub(p) {
    var g = getGh();
    p.innerHTML = '<div class="panel-head"><h2>GitHub connection</h2></div>' +
      '<p class="notice">The website is hosted on GitHub Pages. To publish from this page, the editor needs a GitHub access token that can write to your repository. ' +
      'The token is stored only in this browser and sent only to api.github.com.</p>' +
      '<form id="gh-form" class="form-grid">' +
      '<div class="field"><label for="gh-owner">GitHub username / owner</label><input type="text" id="gh-owner" value="' + esc(g.owner) + '"></div>' +
      '<div class="field"><label for="gh-repo">Repository name</label><input type="text" id="gh-repo" value="' + esc(g.repo) + '"></div>' +
      '<div class="field"><label for="gh-branch">Branch the site is published from</label><input type="text" id="gh-branch" value="' + esc(g.branch) + '"></div>' +
      '<div class="field"><label for="gh-token">Access token</label><input type="password" id="gh-token" value="' + esc(g.token) + '" autocomplete="off" placeholder="github_pat_…"></div>' +
      '<div class="field check full"><label><input type="checkbox" id="gh-remember"' + (g.remember ? " checked" : "") + "> Remember token on this device (don't tick this on a shared or public computer)</label></div>" +
      '<div class="full btn-row"><button class="btn primary" type="submit">Save connection</button><button class="btn" type="button" id="gh-test">Test connection</button><button class="btn danger" type="button" id="gh-forget">Forget token</button></div>' +
      "</form>" +
      '<div class="help"><h3>How to create the token (one time)</h3><ol>' +
      '<li>Open <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">GitHub → Settings → Developer settings → Fine-grained tokens → Generate new token</a>.</li>' +
      "<li>Give it a name (e.g. <em>website editor</em>) and an expiry date.</li>" +
      "<li>Under <strong>Repository access</strong> choose <em>Only select repositories</em> and pick <code>" + esc(g.repo) + "</code>.</li>" +
      "<li>Under <strong>Permissions → Repository permissions</strong> set <strong>Contents</strong> to <em>Read and write</em>.</li>" +
      "<li>Generate the token, copy it, paste it above and click <em>Save connection</em>, then <em>Test connection</em>.</li>" +
      "</ol></div>";
  }

  function renderBackup(p) {
    p.innerHTML = '<div class="panel-head"><h2>Backup &amp; restore</h2></div>' +
      '<p class="notice">Download a copy of all your content to keep safe, or restore from a copy you downloaded earlier. Uploaded files (PDFs, images) stay in the repository and are not part of this backup.</p>' +
      '<div class="btn-row">' +
      '<button class="btn" type="button" id="dl-json">Download backup (.json)</button>' +
      '<label class="btn">Restore from backup…<input type="file" id="ul-json" accept=".json,application/json" hidden></label>' +
      '<button class="btn" type="button" id="dl-js">Download data/profile.js</button>' +
      "</div>" +
      '<h3 style="margin-top:2rem">Discard unpublished changes</h3>' +
      '<p class="small">Throws away everything you changed in this browser since the last publish and reloads the live content.</p>' +
      '<p><button class="btn danger" type="button" id="discard">Discard changes</button></p>';
  }

  function renderHelp(p) {
    p.innerHTML = '<div class="panel-head"><h2>How to use the editor</h2></div><div class="help"><ol>' +
      "<li>Pick a section on the left (Research Papers, Conferences, Book Chapters, Patents, Certificates…) and click <strong>+ Add new</strong>.</li>" +
      "<li>Fill in the details. Only the title is required. To attach a PDF or an image of a certificate, click <strong>Upload…</strong> next to the file field.</li>" +
      "<li>Click <strong>Save entry</strong>. Changes are kept in this browser straight away, so you can close the tab and continue later on the same device.</li>" +
      "<li>Click <strong>Preview</strong> at the top to see the website with your changes.</li>" +
      "<li>When you're happy, click <strong>Publish to GitHub</strong>. Your files and content are saved to the repository in one commit, and the public site updates within a minute or two.</li>" +
      "</ol>" +
      "<h3>Tips</h3><ul>" +
      "<li>The first time, set up the <strong>GitHub connection</strong> (left menu).</li>" +
      "<li>Use the ↑ ↓ buttons to change the order of entries. Papers, conferences, chapters, books and patents are shown newest-first on the site.</li>" +
      "<li>For DOIs, just paste the DOI (e.g. <code>10.1000/xyz123</code>); the site turns it into a link.</li>" +
      "<li>Visitors get a <em>Cite</em> button on each paper and book chapter that copies an APA-style reference.</li>" +
      "<li>Images (JPG/PNG) of certificates are shown as thumbnails that open full-size; PDFs open in a new tab.</li>" +
      "<li>Keep files under 25 MB. Compress large PDFs before uploading.</li>" +
      "</ul></div>";
  }

  /* ---------- events ---------- */
  document.addEventListener("click", function (e) {
    var t = e.target.closest("button, [data-go]");
    if (!t) return;

    if (t.dataset.go) { current = t.dataset.go; editing = null; renderPanel(); return; }
    if (t.dataset.add) { editing = { key: t.dataset.add, index: -1 }; renderPanel(); return; }
    if (t.hasAttribute("data-cancel")) { editing = null; renderPanel(); return; }
    if (t.dataset.edit != null) { editing = { key: current, index: +t.dataset.edit }; renderPanel(); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    if (t.dataset.del != null) {
      var item = data[current][+t.dataset.del];
      if (confirm("Delete “" + (item[S[current].itemTitle] || "this entry") + "”?")) {
        data[current].splice(+t.dataset.del, 1);
        editing = null; save(); renderPanel(); toast("Entry deleted");
      }
      return;
    }
    if (t.dataset.move) {
      var i = +t.dataset.i, j = i + +t.dataset.move, l = data[current];
      if (j < 0 || j >= l.length) return;
      var tmp = l[i]; l[i] = l[j]; l[j] = tmp;
      editing = null; save(); renderPanel(); return;
    }
    if (t.dataset.clear) {
      var input = t.closest(".field").querySelector('[data-key="' + t.dataset.clear + '"]');
      delete pending[input.value];
      input.value = "";
      t.closest(".file-row").querySelectorAll(".preview").forEach(function (n) { n.remove(); });
      var note = t.closest(".field").querySelector("p.small"); if (note) note.remove();
      t.remove();
      updateStatus();
      return;
    }
    if (t.id === "publish-btn") return publish(t);
    if (t.id === "gh-test") return testGithub(t);
    if (t.id === "gh-forget") {
      localStorage.removeItem(GH_TOKEN_KEY); sessionStorage.removeItem(GH_TOKEN_KEY);
      renderPanel(); toast("Token removed from this browser"); return;
    }
    if (t.id === "dl-json") return download("akash-kanojia-site-backup-" + new Date().toISOString().slice(0, 10) + ".json", JSON.stringify(data, null, 2), "application/json");
    if (t.id === "dl-js") return download("profile.js", buildDataFile(), "text/javascript");
    if (t.id === "discard") {
      if (!confirm("Discard all unpublished changes made in this browser?")) return;
      localStorage.removeItem(DRAFT_KEY); localStorage.removeItem(META_KEY); pending = {};
      location.reload();
    }
  });

  document.addEventListener("change", function (e) {
    var t = e.target;
    if (t.dataset.upload && t.files[0]) {
      var file = t.files[0];
      if (file.size > 25 * 1024 * 1024) { alert("This file is larger than 25 MB. Please compress it and try again."); t.value = ""; return; }
      var path = "assets/uploads/" + t.dataset.folder + "/" + slug(file.name);
      pending[path] = file;
      var field = t.closest(".field");
      var input = field.querySelector('[data-key="' + t.dataset.upload + '"]');
      delete pending[input.value];
      input.value = path;
      var row = field.querySelector(".file-row");
      row.querySelectorAll(".preview").forEach(function (n) { n.remove(); });
      if (isImage(path)) {
        var img = document.createElement("img");
        img.className = "preview"; img.alt = ""; img.src = URL.createObjectURL(file);
        row.insertBefore(img, row.firstChild);
      }
      var note = field.querySelector("p.small");
      if (!note) { note = document.createElement("p"); note.className = "small"; field.appendChild(note); }
      note.textContent = "“" + file.name + "” will be uploaded when you click Publish.";
      updateStatus();
      return;
    }
    if (t.id === "ul-json" && t.files[0]) {
      var r = new FileReader();
      r.onload = function () {
        try {
          var d = normalise(JSON.parse(r.result));
          if (!confirm("Replace all current content with this backup?")) return;
          data = d; save(); current = "profile"; renderPanel(); toast("Backup restored — remember to Publish");
        } catch (err) { alert("That file is not a valid backup."); }
      };
      r.readAsText(t.files[0]);
    }
  });

  document.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target;
    if (f.id === "profile-form") {
      Object.assign(data.profile, readForm(f, S.profile.fields));
      save(); toast("Profile saved"); renderPanel();
    } else if (f.id === "item-form") {
      var def = S[editing.key];
      var item = readForm(f, def.fields);
      var titleKey = def.itemTitle;
      if (!item[titleKey]) { alert("Please fill in: " + def.fields.filter(function (x) { return x.key === titleKey; })[0].label); return; }
      if (editing.index >= 0) data[editing.key][editing.index] = Object.assign({}, data[editing.key][editing.index], item);
      else data[editing.key].unshift(item);
      editing = null; save(); renderPanel(); toast("Entry saved");
    } else if (f.id === "gh-form") {
      var s = {
        owner: $("#gh-owner").value.trim(), repo: $("#gh-repo").value.trim(), branch: $("#gh-branch").value.trim() || "main"
      };
      localStorage.setItem(GH_KEY, JSON.stringify(s));
      var tok = $("#gh-token").value.trim();
      localStorage.removeItem(GH_TOKEN_KEY); sessionStorage.removeItem(GH_TOKEN_KEY);
      if (tok) ($("#gh-remember").checked ? localStorage : sessionStorage).setItem(GH_TOKEN_KEY, tok);
      toast("Connection saved");
    }
  });

  window.addEventListener("beforeunload", function (e) {
    if (Object.keys(pending).length) { e.preventDefault(); e.returnValue = ""; }
  });

  /* ---------- export ---------- */
  function buildDataFile() {
    return "/*\n * SITE CONTENT — generated by admin.html on " + new Date().toISOString() + "\n" +
      " * Edit with admin.html, or by hand (keep it valid JavaScript).\n */\n" +
      "window.SITE_DATA = " + JSON.stringify(data, null, 2) + ";\n";
  }
  function download(name, text, type) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: type }));
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
  }

  /* ---------- GitHub publishing (single commit via the Git Data API) ---------- */
  function utf8ToBase64(str) {
    var bytes = new TextEncoder().encode(str), bin = "";
    for (var i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  function fileToBase64(file) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () { res(String(r.result).split(",")[1] || ""); };
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }
  function api(g, method, path, body) {
    return fetch("https://api.github.com/repos/" + encodeURIComponent(g.owner) + "/" + encodeURIComponent(g.repo) + path, {
      method: method,
      headers: { "Authorization": "Bearer " + g.token, "Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) {
          var hint = r.status === 401 ? " (token invalid or expired)" : r.status === 403 ? " (token lacks Contents: write permission)" : r.status === 404 ? " (repository or branch not found, or token has no access to it)" : r.status === 409 ? " (repository is empty — make one commit on GitHub first)" : "";
          throw new Error("GitHub " + r.status + hint + ": " + (j.message || r.statusText));
        }
        return j;
      });
    });
  }
  function testGithub(btn) {
    var g = getGh();
    g.owner = $("#gh-owner").value.trim(); g.repo = $("#gh-repo").value.trim(); g.branch = $("#gh-branch").value.trim() || "main"; g.token = $("#gh-token").value.trim();
    if (!g.token) { alert("Paste your token first."); return; }
    btn.disabled = true;
    api(g, "GET", "/git/ref/heads/" + encodeURIComponent(g.branch))
      .then(function () { return api(g, "GET", ""); })
      .then(function (repo) {
        if (repo.permissions && !repo.permissions.push) throw new Error("Token can read but not write to this repository. Set Contents to Read and write.");
        toast("Connected to " + g.owner + "/" + g.repo + " (" + g.branch + ")", 3500);
      })
      .catch(function (err) { alert(err.message); })
      .then(function () { btn.disabled = false; });
  }

  function publish(btn) {
    var g = getGh();
    if (!g.token) {
      alert("Set up the GitHub connection first (left menu → GitHub connection).\n\nAlternatively, use Backup & restore → Download data/profile.js and upload it to the repository by hand.");
      current = "github"; editing = null; renderPanel(); return;
    }
    var json = JSON.stringify(data);
    Object.keys(pending).forEach(function (path) { if (json.indexOf(path) < 0) delete pending[path]; }); // drop files from cancelled edits
    var paths = Object.keys(pending);
    if (!confirm("Publish your changes" + (paths.length ? " and upload " + paths.length + " file(s)" : "") + " to " + g.owner + "/" + g.repo + " (" + g.branch + ")?")) return;

    btn.disabled = true;
    var label = btn.textContent;
    function step(t) { btn.textContent = t; }
    var head, baseTree;

    step("Connecting…");
    api(g, "GET", "/git/ref/heads/" + encodeURIComponent(g.branch))
      .then(function (ref) { head = ref.object.sha; return api(g, "GET", "/git/commits/" + head); })
      .then(function (c) {
        baseTree = c.tree.sha;
        var entries = [];
        var chain = Promise.resolve();
        paths.forEach(function (path, n) {
          chain = chain.then(function () {
            step("Uploading file " + (n + 1) + "/" + paths.length + "…");
            return fileToBase64(pending[path]);
          }).then(function (b64) {
            return api(g, "POST", "/git/blobs", { content: b64, encoding: "base64" });
          }).then(function (blob) {
            entries.push({ path: path, mode: "100644", type: "blob", sha: blob.sha });
          });
        });
        return chain.then(function () {
          step("Saving content…");
          return api(g, "POST", "/git/blobs", { content: utf8ToBase64(buildDataFile()), encoding: "base64" });
        }).then(function (blob) {
          entries.push({ path: DATA_PATH, mode: "100644", type: "blob", sha: blob.sha });
          return api(g, "POST", "/git/trees", { base_tree: baseTree, tree: entries });
        });
      })
      .then(function (tree) {
        var msg = "Update website content" + (paths.length ? " and upload " + paths.length + " file(s)" : "") + " via editor";
        return api(g, "POST", "/git/commits", { message: msg, tree: tree.sha, parents: [head] });
      })
      .then(function (commit) {
        step("Finishing…");
        return api(g, "PATCH", "/git/refs/heads/" + encodeURIComponent(g.branch), { sha: commit.sha });
      })
      .then(function () {
        pending = {};
        meta = { dirty: false, publishedAt: Date.now() };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
        localStorage.setItem(META_KEY, JSON.stringify(meta));
        updateStatus();
        renderPanel();
        toast("Published! The live site will update in a minute or two.", 4500);
      })
      .catch(function (err) { alert("Publishing failed. Nothing was lost — your changes are still saved in this browser.\n\n" + err.message); })
      .then(function () { btn.disabled = false; btn.textContent = label; });
  }

  /* ---------- start ---------- */
  var theme = localStorage.getItem("akk-theme");
  if (theme) document.documentElement.setAttribute("data-theme", theme);
  loadState();
  renderPanel();
  updateStatus();
})();
