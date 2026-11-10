/*
 * Section definitions shared by the public site (site.js) and the editor (admin.js).
 * Field types: text, textarea, url, file, select, list (comma separated -> array), checkbox
 */
window.SITE_SCHEMA = {
  profile: {
    label: "Profile",
    fields: [
      { key: "name", label: "Full name", type: "text" },
      { key: "title", label: "Designation", type: "text" },
      { key: "department", label: "Department", type: "text" },
      { key: "university", label: "University / Institution", type: "text" },
      { key: "location", label: "Location", type: "text" },
      { key: "tagline", label: "Tagline (one line under your name)", type: "text" },
      { key: "about", label: "About me (blank line = new paragraph)", type: "textarea" },
      { key: "researchInterests", label: "Research interests (comma separated)", type: "list" },
      { key: "photo", label: "Profile photo", type: "file", folder: "photo", accept: "image/*" },
      { key: "cv", label: "CV / Résumé (PDF)", type: "file", folder: "cv", accept: ".pdf" },
      { key: "email", label: "Email", type: "text" },
      { key: "phone", label: "Phone (leave blank to keep private)", type: "text" },
      { key: "linkedin", label: "LinkedIn URL", type: "url" },
      { key: "orcid", label: "ORCID URL (https://orcid.org/...)", type: "url" },
      { key: "googleScholar", label: "Google Scholar URL", type: "url" },
      { key: "researchGate", label: "ResearchGate URL", type: "url" },
      { key: "github", label: "GitHub URL", type: "url" },
      { key: "languages", label: "Languages known", type: "text" },
      { key: "showEmptySections", label: "Show sections that have no entries yet", type: "checkbox" }
    ]
  },

  positions: {
    label: "Positions",
    title: "Current & Past Positions",
    itemTitle: "role",
    fields: [
      { key: "role", label: "Role / Designation", type: "text", required: true },
      { key: "organization", label: "Organisation", type: "text" },
      { key: "period", label: "Period (e.g. 2024 – Present)", type: "text" },
      { key: "description", label: "Description", type: "textarea" }
    ]
  },

  education: {
    label: "Education",
    title: "Education",
    itemTitle: "degree",
    fields: [
      { key: "degree", label: "Degree / Course", type: "text", required: true },
      { key: "institution", label: "Institution / Board", type: "text" },
      { key: "year", label: "Year (or Pursuing / Completed)", type: "text" },
      { key: "score", label: "Score / Grade", type: "text" },
      { key: "notes", label: "Notes (e.g. Distance mode, thesis title)", type: "text" }
    ]
  },

  publications: {
    label: "Research Papers",
    title: "Research Papers (Journal Publications)",
    itemTitle: "title",
    sortBy: "year",
    fields: [
      { key: "title", label: "Paper title", type: "text", required: true },
      { key: "authors", label: "Authors (as printed)", type: "text" },
      { key: "journal", label: "Journal name", type: "text" },
      { key: "year", label: "Year", type: "text" },
      { key: "volume", label: "Volume", type: "text" },
      { key: "issue", label: "Issue", type: "text" },
      { key: "pages", label: "Pages", type: "text" },
      { key: "issn", label: "ISSN", type: "text" },
      { key: "indexing", label: "Indexing (e.g. Scopus, UGC-CARE, Web of Science)", type: "text" },
      { key: "status", label: "Status", type: "select", options: ["Published", "Accepted", "In Press", "Under Review"] },
      { key: "doi", label: "DOI (e.g. 10.1234/abcd)", type: "text" },
      { key: "url", label: "Online link", type: "url" },
      { key: "file", label: "Full text / PDF", type: "file", folder: "papers", accept: ".pdf,image/*" },
      { key: "abstract", label: "Abstract (optional)", type: "textarea" }
    ]
  },

  conferences: {
    label: "Conferences",
    title: "Conference Papers & Presentations",
    itemTitle: "title",
    sortBy: "date",
    fields: [
      { key: "title", label: "Paper / Presentation title", type: "text", required: true },
      { key: "authors", label: "Authors", type: "text" },
      { key: "event", label: "Conference name", type: "text" },
      { key: "level", label: "Level", type: "select", options: ["International", "National", "State", "University"] },
      { key: "role", label: "Participation", type: "select", options: ["Paper Presented", "Poster Presented", "Invited Talk", "Session Chair", "Participated"] },
      { key: "organizer", label: "Organised by", type: "text" },
      { key: "venue", label: "Venue / Mode", type: "text" },
      { key: "date", label: "Date (e.g. 12–14 March 2025)", type: "text" },
      { key: "proceedings", label: "Published in proceedings (details / ISBN)", type: "text" },
      { key: "url", label: "Link", type: "url" },
      { key: "file", label: "Paper / Certificate file", type: "file", folder: "conferences", accept: ".pdf,image/*" }
    ]
  },

  seminars: {
    label: "Seminars & Workshops",
    title: "Seminars, Workshops & Training Programmes",
    itemTitle: "title",
    sortBy: "date",
    fields: [
      { key: "title", label: "Title / Theme", type: "text", required: true },
      { key: "type", label: "Type", type: "select", options: ["Seminar", "Workshop", "Webinar", "Symposium", "FDP", "Training Programme", "Short-term Course", "Lecture"] },
      { key: "level", label: "Level", type: "select", options: ["International", "National", "State", "University"] },
      { key: "role", label: "Role", type: "select", options: ["Participant", "Paper Presented", "Resource Person", "Organising Member", "Volunteer"] },
      { key: "organizer", label: "Organised by", type: "text" },
      { key: "venue", label: "Venue / Mode", type: "text" },
      { key: "date", label: "Date", type: "text" },
      { key: "url", label: "Link", type: "url" },
      { key: "file", label: "Certificate / File", type: "file", folder: "seminars", accept: ".pdf,image/*" }
    ]
  },

  bookChapters: {
    label: "Book Chapters",
    title: "Chapters in Edited Books",
    itemTitle: "chapterTitle",
    sortBy: "year",
    fields: [
      { key: "chapterTitle", label: "Chapter title", type: "text", required: true },
      { key: "authors", label: "Authors", type: "text" },
      { key: "bookTitle", label: "Book title", type: "text" },
      { key: "editors", label: "Editors", type: "text" },
      { key: "publisher", label: "Publisher", type: "text" },
      { key: "year", label: "Year", type: "text" },
      { key: "pages", label: "Pages", type: "text" },
      { key: "isbn", label: "ISBN", type: "text" },
      { key: "doi", label: "DOI", type: "text" },
      { key: "url", label: "Link", type: "url" },
      { key: "file", label: "Chapter PDF", type: "file", folder: "chapters", accept: ".pdf,image/*" }
    ]
  },

  books: {
    label: "Books",
    title: "Books (Authored / Edited)",
    itemTitle: "title",
    sortBy: "year",
    fields: [
      { key: "title", label: "Book title", type: "text", required: true },
      { key: "authors", label: "Authors / Editors", type: "text" },
      { key: "role", label: "Your role", type: "select", options: ["Author", "Co-author", "Editor", "Co-editor"] },
      { key: "publisher", label: "Publisher", type: "text" },
      { key: "year", label: "Year", type: "text" },
      { key: "edition", label: "Edition", type: "text" },
      { key: "isbn", label: "ISBN", type: "text" },
      { key: "url", label: "Link", type: "url" },
      { key: "cover", label: "Cover image", type: "file", folder: "books", accept: "image/*" },
      { key: "file", label: "File (PDF)", type: "file", folder: "books", accept: ".pdf" }
    ]
  },

  patents: {
    label: "Patents",
    title: "Patents",
    itemTitle: "title",
    sortBy: "filedDate",
    fields: [
      { key: "title", label: "Patent title", type: "text", required: true },
      { key: "inventors", label: "Inventors", type: "text" },
      { key: "type", label: "Type", type: "select", options: ["Utility Patent", "Design Patent", "Copyright"] },
      { key: "office", label: "Patent office / Country", type: "text" },
      { key: "applicationNo", label: "Application number", type: "text" },
      { key: "patentNo", label: "Patent / Registration number", type: "text" },
      { key: "filedDate", label: "Filing date", type: "text" },
      { key: "publishedDate", label: "Publication date", type: "text" },
      { key: "grantedDate", label: "Grant date", type: "text" },
      { key: "status", label: "Status", type: "select", options: ["Filed", "Published", "Granted", "Registered"] },
      { key: "url", label: "Link", type: "url" },
      { key: "file", label: "Patent document / Certificate", type: "file", folder: "patents", accept: ".pdf,image/*" }
    ]
  },

  certificates: {
    label: "Certificates",
    title: "Certifications & Courses",
    itemTitle: "title",
    fields: [
      { key: "title", label: "Certificate / Course", type: "text", required: true },
      { key: "issuer", label: "Issued by", type: "text" },
      { key: "date", label: "Date / Year", type: "text" },
      { key: "credentialId", label: "Credential ID", type: "text" },
      { key: "url", label: "Verification link", type: "url" },
      { key: "file", label: "Certificate (image or PDF)", type: "file", folder: "certificates", accept: ".pdf,image/*" }
    ]
  },

  skills: {
    label: "Skills",
    title: "Skills",
    itemTitle: "category",
    fields: [
      { key: "category", label: "Category", type: "text", required: true },
      { key: "items", label: "Skills (comma separated)", type: "list" }
    ]
  },

  achievements: {
    label: "Achievements",
    title: "Achievements & Awards",
    itemTitle: "title",
    fields: [
      { key: "title", label: "Achievement / Award", type: "text", required: true },
      { key: "description", label: "Details", type: "textarea" },
      { key: "year", label: "Year", type: "text" },
      { key: "file", label: "Certificate / Photo", type: "file", folder: "misc", accept: ".pdf,image/*" }
    ]
  }
};

/* Order in which list sections appear on the site and in the editor. */
window.SITE_SECTIONS = [
  "positions", "education", "publications", "conferences", "seminars",
  "bookChapters", "books", "patents", "certificates", "skills", "achievements"
];
