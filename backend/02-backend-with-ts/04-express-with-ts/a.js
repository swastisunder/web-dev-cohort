const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.join(__dirname);
const OUTPUT_FILE = path.join(__dirname, "allcode.txt");

// ======================================
// FILTER EXTENSIONS
// ======================================

// [] => all files
// ["js"] => only js
// ["ejs", "css"] => only ejs and css

const ALLOWED_EXTENSIONS = ["ts"];

// ======================================
// IGNORE CONFIG
// ======================================

const IGNORE_FILES = ["allcode.txt", ".env", ".env.local", ".DS_Store"];

const IGNORE_FOLDERS = [
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "coverage",
  ".cache",
  ".idea",
  ".vscode",
  "logs",
];

// ======================================
// HELPERS
// ======================================

function shouldIgnoreFile(file) {
  return IGNORE_FILES.includes(file);
}

function shouldIgnoreFolder(folder) {
  return IGNORE_FOLDERS.includes(folder);
}

function isAllowedExtension(file) {
  if (ALLOWED_EXTENSIONS.length === 0) {
    return true;
  }

  const ext = path.extname(file).replace(".", "").toLowerCase();

  return ALLOWED_EXTENSIONS.includes(ext);
}

// ======================================
// GENERATE FOLDER TREE
// ======================================

function generateTree(dir, prefix = "") {
  let output = "";

  let items = fs
    .readdirSync(dir)
    .filter((item) => !shouldIgnoreFolder(item))
    .sort((a, b) => a.localeCompare(b));

  items.forEach((item, index) => {
    const fullPath = path.join(dir, item);

    let stat;

    try {
      stat = fs.statSync(fullPath);
    } catch {
      return;
    }

    const isLast = index === items.length - 1;

    output += `${prefix}${isLast ? "└── " : "├── "}${item}\n`;

    if (stat.isDirectory()) {
      output += generateTree(fullPath, prefix + (isLast ? "    " : "│   "));
    }
  });

  return output;
}

// ======================================
// READ FILES RECURSIVELY
// ======================================

function readDirRecursive(dirPath, results = []) {
  let files = [];

  try {
    files = fs.readdirSync(dirPath);
  } catch (err) {
    console.error("Cannot read:", dirPath);
    return results;
  }

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);

    let stat;

    try {
      stat = fs.statSync(fullPath);
    } catch {
      return;
    }

    // Folder
    if (stat.isDirectory()) {
      if (shouldIgnoreFolder(file)) return;

      readDirRecursive(fullPath, results);
    }

    // File
    else {
      if (shouldIgnoreFile(file)) return;

      if (!isAllowedExtension(file)) return;

      results.push(fullPath);
    }
  });

  return results;
}

// ======================================
// GENERATE CODE OUTPUT
// ======================================

function generateAllCodeFile() {
  const allFiles = readDirRecursive(ROOT_DIR);

  console.log(`Found ${allFiles.length} files`);

  let output = "";

  // ======================================
  // PROJECT STRUCTURE
  // ======================================

  output += "PROJECT STRUCTURE\n";
  output += "=================\n\n";

  output += ".\n";
  output += generateTree(ROOT_DIR);

  // ======================================
  // FILE CONTENTS
  // ======================================

  output += "\n\n";
  output += "FILE CONTENTS\n";
  output += "=============\n";

  allFiles.forEach((filePath) => {
    try {
      const relativePath = path.relative(ROOT_DIR, filePath);

      const content = fs.readFileSync(filePath, "utf-8");

      // Skip empty files
      if (!content.trim()) {
        return;
      }

      output += `\n\n========================================\n`;
      output += `FILE: ${relativePath}\n`;
      output += `========================================\n\n`;

      output += content;
      output += "\n";
    } catch (err) {
      console.error("Error reading:", filePath, err.message);
    }
  });

  fs.writeFileSync(OUTPUT_FILE, output, "utf-8");

  console.log("✅ allcode.txt generated successfully!");
}

generateAllCodeFile();
