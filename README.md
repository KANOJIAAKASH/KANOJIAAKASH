# Akash Kanojia

**Research Scholar (Ph.D.)** · Department of Library and Information Science
Babasaheb Bhimrao Ambedkar University (A Central University), Lucknow

[LinkedIn](https://www.linkedin.com/in/akash-kanojia-1a638a1b1)

---

## Personal website

This repository holds my personal academic profile website. It has these sections: about, positions, education, research papers, conference papers, seminars and workshops, book chapters, books, patents, certificates, skills, achievements and contact.

It's a static site with no server or database, so GitHub Pages can host it for free.

| File | Purpose |
|---|---|
| `index.html` | The public website |
| `admin.html` | Editor: add, edit or delete entries, upload PDFs and certificates, and publish |
| `data/profile.js` | All website content (the editor writes this file) |
| `assets/uploads/…` | Uploaded files: photo, CV, papers, certificates, and so on |
| `assets/js/schema.js` | Fields available in each section |

### 1. Put the site online (one time)

1. Merge this branch into `main`.
2. On GitHub, open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, then branch **main** and folder **/ (root)**, and click **Save**.
4. After a minute the site is live at `https://kanojiaakash.github.io/KANOJIAAKASH/`.

> To get the shorter address `https://kanojiaakash.github.io/`, rename the repository to `kanojiaakash.github.io`. But this repository (same name as the username) also shows its README on your GitHub profile page.

### 2. Add papers, conferences, certificates and more

1. Open `admin.html` on your site (or click **Edit site** at the bottom of any page).
2. First time only: open **GitHub connection** and follow the steps there to create a token (fine-grained token, this repository only, *Contents: Read and write*).
3. Pick a section, click **+ Add new**, fill in the details, and use **Upload…** to attach a PDF or certificate image.
4. Click **Preview** to check how it looks, then click **Publish to GitHub**. The live site updates in a minute or two.

Changes are kept in your browser until you publish, so nothing is lost if you close the tab.
Use **Backup & restore** to download a copy of your content.

### Editing without the editor

You can also edit `data/profile.js` directly on GitHub (pencil icon) and upload files into `assets/uploads/<folder>/` with **Add file → Upload files**. Then reference them as, for example, `"file": "assets/uploads/papers/my-paper.pdf"`.

### Preview on your computer

Open `index.html` in a browser, or run `python3 -m http.server` in this folder and visit <http://localhost:8000>.
