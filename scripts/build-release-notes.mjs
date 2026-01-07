import fs from "node:fs/promises";

// markdown file path, default to release.md, can be overridden by argv[2]
const file = process.argv[2] || "release.md";

let forceUpdate = false;
const description = { cn: "", en: "" };
const content = { cn: "", en: "" };

let currentSection = null;
let currentLang = null;

const normLang = (s) => {
  const v = s.trim().toLowerCase();
  if (["zh", "zhcn", "zh-cn", "cn"].includes(v)) return "cn";
  if (["en", "enus", "en-us"].includes(v)) return "en";
  return null;
};

const raw = await fs.readFile(file, "utf8");

for (const line of raw.split(/\r?\n/)) {
  const stripped = line.trim();
  if (!stripped) continue;

  // ignore inline JSON template lines in the markdown
  if (stripped.startsWith("{") && stripped.includes('"force_update"')) {
    continue;
  }

  if (stripped.startsWith("# ")) {
    currentSection = stripped.slice(2).trim().toLowerCase();
    currentLang = null;
    continue;
  }

  if (stripped.startsWith("## ")) {
    currentLang = normLang(stripped.slice(3));
    continue;
  }

  if (currentSection === "force_update") {
    const v = stripped.toLowerCase();
    forceUpdate = ["true", "1", "yes", "y"].includes(v);
    continue;
  }

  if (currentSection === "description" && (currentLang === "cn" || currentLang === "en")) {
    description[currentLang] += (description[currentLang] ? "\n" : "") + line;
    continue;
  }

  if (currentSection === "content" && (currentLang === "cn" || currentLang === "en")) {
    content[currentLang] += (content[currentLang] ? "\n" : "") + line;
    continue;
  }
}

const notesObj = {
  force_update: forceUpdate,
  description,
  content,
};

process.stdout.write(JSON.stringify(notesObj));
