#!/usr/bin/env ts-node

// This was made to fix an issue where the translation script was wrapping HTML elements in code blocks (IE: ```html <img/> instead of just <img>), is not what we wanteds
// We've since updated the GPT prompt to be sure to tell GPT NOT to do this However, we made this script to scan the files for any that still have this issue
// and delete them. And are keeping it in case needed in the future, for future translations.
// Example commands:

import * as fs from "fs/promises";
import { glob } from "glob";
import * as path from "path";

// Configuration
const CONFIG = {
  docsContentDir: path.join(__dirname, ".."),
  languages: ["es", "pt-BR", "id", "ko", "cn"],
  dryRun: process.argv.includes("--dry-run"),
  deleteFiles: process.argv.includes("--delete"),
};

// HTML escaping patterns to detect (actual HTML elements, not MDX components)
const HTML_ESCAPING_PATTERNS = [
  /```html[\s\S]*?<iframe/gi,
  /```html[\s\S]*?<img/gi,
  /```html[\s\S]*?<br/gi,
  /```html[\s\S]*?<div/gi,
  /```html[\s\S]*?<span/gi,
  /```html[\s\S]*?<h[1-6]/gi,
  /```html[\s\S]*?<p/gi,
  /```html[\s\S]*?<a/gi,
  /```html[\s\S]*?<button/gi,
  /```html[\s\S]*?<input/gi,
  /```html[\s\S]*?<form/gi,
  /```html[\s\S]*?<table/gi,
  /```html[\s\S]*?<ul/gi,
  /```html[\s\S]*?<ol/gi,
  /```html[\s\S]*?<li/gi,
];

interface AffectedFile {
  path: string;
  patterns: string[];
  lineNumbers: number[];
}

async function checkFileForHtmlEscaping(filePath: string): Promise<AffectedFile | null> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const affectedPatterns: string[] = [];
    const affectedLines: number[] = [];

    // Check the entire content for patterns (not just line by line)
    HTML_ESCAPING_PATTERNS.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) {
        const patternName = pattern.source.replace(/[\\\/\^$.*+?()[\]{}|]/g, "").replace(/html[\s\S]*?/gi, "html");
        if (!affectedPatterns.includes(patternName)) {
          affectedPatterns.push(patternName);
        }
        
        // Find line numbers for matches
        const lines = content.split("\n");
        lines.forEach((line, index) => {
          if (pattern.test(line)) {
            affectedLines.push(index + 1);
          }
        });
      }
    });

    if (affectedPatterns.length > 0) {
      return {
        path: filePath,
        patterns: affectedPatterns,
        lineNumbers: affectedLines,
      };
    }

    return null;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return null;
  }
}

async function findAffectedFiles(): Promise<AffectedFile[]> {
  const affectedFiles: AffectedFile[] = [];

  for (const language of CONFIG.languages) {
    const languageDir = path.join(CONFIG.docsContentDir, language);
    
    try {
      // Check if language directory exists
      await fs.access(languageDir);
    } catch {
      console.log(`Language directory ${language} does not exist, skipping...`);
      continue;
    }

    // Find all .mdx files in the language directory
    const pattern = path.join(languageDir, "**/*.mdx");
    const files = await glob(pattern);

    console.log(`Checking ${files.length} files in ${language}/...`);

    for (const file of files) {
      // Debug: Check the specific scaling.mdx file
      if (file.includes("scaling.mdx")) {
        console.log(`Debug: Checking ${file}...`);
        const content = await fs.readFile(file, "utf-8");
        const hasHtmlBlock = content.includes("```html");
        console.log(`  - Contains \`\`\`html: ${hasHtmlBlock}`);
        if (hasHtmlBlock) {
          const lines = content.split("\n");
          const htmlLineIndex = lines.findIndex(line => line.includes("```html"));
          console.log(`  - \`\`\`html found at line ${htmlLineIndex + 1}`);
          if (htmlLineIndex >= 0 && htmlLineIndex < lines.length - 1) {
            console.log(`  - Next line: "${lines[htmlLineIndex + 1]}"`);
          }
        }
      }
      
      const affected = await checkFileForHtmlEscaping(file);
      if (affected) {
        affectedFiles.push(affected);
      }
    }
  }

  return affectedFiles;
}

async function deleteAffectedFiles(affectedFiles: AffectedFile[]): Promise<void> {
  if (CONFIG.dryRun) {
    console.log("\n🔍 DRY RUN - Would delete the following files:");
  } else {
    console.log("\n🗑️  Deleting affected files...");
  }

  for (const file of affectedFiles) {
    const relativePath = path.relative(CONFIG.docsContentDir, file.path);
    
    if (CONFIG.dryRun) {
      console.log(`  - ${relativePath}`);
    } else {
      try {
        await fs.unlink(file.path);
        console.log(`  ✅ Deleted: ${relativePath}`);
      } catch (error) {
        console.error(`  ❌ Failed to delete ${relativePath}:`, error);
      }
    }
  }
}

function displayResults(affectedFiles: AffectedFile[]): void {
  console.log("\n📊 HTML Escaping Detection Results");
  console.log("=" .repeat(50));

  if (affectedFiles.length === 0) {
    console.log("✅ No files found with HTML escaping issues!");
    return;
  }

  console.log(`Found ${affectedFiles.length} files with HTML escaping issues:\n`);

  affectedFiles.forEach((file, index) => {
    const relativePath = path.relative(CONFIG.docsContentDir, file.path);
    console.log(`${index + 1}. ${relativePath}`);
    console.log(`   Patterns found: ${file.patterns.join(", ")}`);
    console.log(`   Lines: ${file.lineNumbers.join(", ")}`);
    console.log("");
  });

  console.log("💡 To fix these files:");
  console.log("   1. Run: pnpm run clean-html-escaped --delete");
  console.log("   2. Then run: pnpm run translate --all");
  console.log("");
  console.log("🔍 To preview what would be deleted:");
  console.log("   pnpm run clean-html-escaped --dry-run");
}

async function main(): Promise<void> {
  console.log("🔍 Scanning for files with HTML escaping issues...\n");

  const affectedFiles = await findAffectedFiles();
  
  displayResults(affectedFiles);

  if (CONFIG.deleteFiles && affectedFiles.length > 0) {
    await deleteAffectedFiles(affectedFiles);
    
    if (!CONFIG.dryRun) {
      console.log(`\n✅ Deleted ${affectedFiles.length} files with HTML escaping issues.`);
      console.log("🔄 Now run: pnpm run translate --all");
    }
  }
}

// Handle command line arguments
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
HTML Escaping Cleanup Script

Usage:
  pnpm run clean-html-escaped [options]

Options:
  --dry-run     Show what would be deleted without actually deleting
  --delete      Actually delete the affected files
  --help, -h    Show this help message

Examples:
  pnpm run clean-html-escaped --dry-run    # Preview affected files
  pnpm run clean-html-escaped --delete     # Delete affected files
  pnpm run clean-html-escaped              # Just scan and report
`);
  process.exit(0);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
