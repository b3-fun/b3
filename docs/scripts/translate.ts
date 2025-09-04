import dotenv from "dotenv";
import * as fs from "fs/promises";
import { glob } from "glob";
import matter from "gray-matter";
import { OpenAI } from "openai";
import * as path from "path";

// Performance logging utility
class Timer {
  private startTime: number;
  private name: string;

  constructor(name: string) {
    this.startTime = Date.now();
    this.name = name;
  }

  log(message?: string) {
    const elapsed = Date.now() - this.startTime;
    console.log(`[${this.name}${message ? ` - ${message}` : ""}] ${elapsed}ms`);
  }

  reset() {
    this.startTime = Date.now();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const processAllFiles = args.includes("--all");
const updateMode = args.includes("--update");
const sourceHashesOnly = args.includes("--source-hashes-only");
const forceUpdateNavigation = args.includes("--force-update-navigation");

// Load environment variables from .env only if not using Doppler
if (!process.env.DOPPLER_PROJECT) {
  dotenv.config();
  console.log("Using local .env file for environment variables");
} else {
  console.log(`Using Doppler for environment variables (Project: ${process.env.DOPPLER_PROJECT})`);
}

// Validate environment
if (!process.env.OPENAI_API_KEY) {
  throw new Error(
    "OPENAI_API_KEY environment variable is required. " + "Please set it using Doppler or provide a .env file.",
  );
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface SourceHash {
  sourceFile: string;
  sourceHash: string;
  lastUpdated: string;
}

// Configuration
const CONFIG = {
  languages: ["es", "pt-BR", "id", "ko", "cn"], // All supported languages, removed "el" and "vi" as they are not supported
  sourceDir: path.join(process.cwd(), "..", "docs"), // Root docs directory
  docsContentDir: path.join(process.cwd(), "..", "docs"), // Where the actual docs content lives
  excludeDirs: ["node_modules", ".next", "public", "scripts", "images"],
  supportedExtensions: [".mdx", ".md"],
  sourceHashFile: path.join(process.cwd(), "..", "docs", ".source-hashes.json"), // File to store source content hashes
  // Frontmatter fields that should be translated
  translatableFrontmatter: ["title", "description"],
  // Language-specific instructions
  languageInstructions: {
    es: "Spanish (Español)",
    "pt-BR": "Brazilian Portuguese (Português do Brasil)",
    id: "Indonesian/Malay (Bahasa Indonesia/Melayu)",
    ko: "Korean (한국어)",
    cn: "Simplified Chinese (简体中文)",
    // vi: "Vietnamese (Tiếng Việt)",
    // el: "Greek (Ελληνικά)",
  },
  // Add configuration from environment variables
  batchSize: processAllFiles ? Infinity : Number(process.env.TRANSLATION_BATCH_SIZE) || 1,
  dryRun: process.env.TRANSLATION_DRY_RUN === "true",
} as const;

interface TranslationMeta {
  sourcePath: string;
  targetPath: string;
  language: string;
  originalContent: string;
  frontmatter: Record<string, any>;
}

interface NavigationItem {
  group?: string;
  pages?: (string | NavigationItem)[];
  tab?: string;
  icon?: string;
  openapi?: any;
}

interface Navigation {
  navigation: {
    tabs: NavigationItem[];
    global?: {
      anchors: {
        anchor: string;
        href: string;
        icon: string;
      }[];
    };
  };
}

async function translateText(text: string, language: string, context: string = ""): Promise<string> {
  const timer = new Timer("translateText");

  if (CONFIG.dryRun) {
    console.log("Dry run: Would translate text:", text);
    return text;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the following text to ${CONFIG.languageInstructions[language]}. 
          CRITICAL: This is MDX content that contains HTML elements. You MUST preserve all HTML exactly as written.
          
          Important rules:
          1. Preserve all markdown, MDX, and HTML syntax exactly as is - DO NOT modify HTML tags
          2. Preserve all special characters, quotes, and formatting
          3. Only translate human-readable text content, NOT HTML attributes or tags
          4. Keep all technical terms in English
          5. For ${language === "cn" ? "Chinese" : language === "ko" ? "Korean" : "your"} language, ensure proper character usage and typography
          6. Maintain the same line breaks and spacing as the original text
          7. NEVER wrap HTML elements in code blocks (\`\`\`html) or escape them
          8. HTML elements like <iframe>, <img>, <Card>, etc. must remain as raw HTML, not code blocks`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      temperature: 0.3,
    });

    timer.log(context);
    return response.choices[0]?.message?.content || text;
  } catch (error) {
    console.error("Translation error:", error);
    throw error;
  }
}

// Helper function to ensure all pages have proper language prefix
function ensureLanguagePrefix(pages: (string | NavigationItem)[], language: string): (string | NavigationItem)[] {
  return pages.map(page => {
    if (typeof page === "string") {
      // Handle special paths that shouldn't be prefixed
      if (page.startsWith("http") || page.startsWith("redirect/")) {
        return page;
      }
      // Remove any existing language prefix and ensure clean path
      const cleanPath = page.replace(/^[a-z]{2}(-[A-Z]{2})?\//, "");
      // Add the new language prefix
      return `${language}/${cleanPath}`;
    } else {
      // For nested items, recursively ensure language prefix
      const translatedNestedItem = { ...page };
      if (translatedNestedItem.pages) {
        translatedNestedItem.pages = ensureLanguagePrefix(translatedNestedItem.pages, language);
      }
      return translatedNestedItem;
    }
  });
}

async function translateNavigationItem(item: NavigationItem, language: string): Promise<NavigationItem> {
  const timer = new Timer("translateNavigationItem");
  const translatedItem: NavigationItem = { ...item };

  if (item.group) {
    translatedItem.group = await translateText(item.group, language, "group");
  }

  if (item.tab) {
    translatedItem.tab = await translateText(item.tab, language, "tab");
  }

  if (item.pages) {
    // First translate any text content in nested items
    translatedItem.pages = await Promise.all(
      item.pages.map(async page => {
        if (typeof page === "string") {
          return page; // Will be handled by ensureLanguagePrefix
        } else {
          // Recursively translate nested navigation items
          return await translateNavigationItem(page, language);
        }
      }),
    );
    
    // Then ensure all pages have proper language prefix
    translatedItem.pages = ensureLanguagePrefix(translatedItem.pages, language);
  }

  timer.log();
  return translatedItem;
}

async function translateNavigation(language: string): Promise<void> {
  const timer = new Timer("translateNavigation");
  try {
    const docsPath = path.join(CONFIG.docsContentDir, "docs.json");
    const docsContent = await fs.readFile(docsPath, "utf-8");
    const docs = JSON.parse(docsContent);
    timer.log("read docs.json");

    // Get the original navigation structure (English)
    const englishNav = docs.navigation.languages?.find(l => l.language === "en");
    if (!englishNav) {
      throw new Error("English navigation not found in docs.json");
    }
    const originalTabs = englishNav.tabs;

    // Find existing language entry if it exists
    const existingLangEntry = docs.navigation.languages?.find((l: any) => l.language === language);

    // If we have an existing entry, use it as the base
    const translatedNavigation = existingLangEntry || {
      language,
      name: CONFIG.languageInstructions[language], // Add proper language name
      tabs: [],
      global: {},
    };

    // Always translate tabs if force update is enabled, otherwise only if they don't exist or are empty
    if (forceUpdateNavigation || (!translatedNavigation.tabs?.length && originalTabs?.length)) {
      console.log(`Translating navigation tabs for ${language}...`);
      
      // Create a deep copy of the original tabs to avoid modifying the source
      const tabsToTranslate = JSON.parse(JSON.stringify(originalTabs));
      
      // Translate and ensure proper language prefixing
      translatedNavigation.tabs = await Promise.all(
        tabsToTranslate.map(async tab => {
          const translatedTab = await translateNavigationItem(tab, language);
          
          // Ensure all page references in the tab have proper language prefixes
          if (translatedTab.pages) {
            translatedTab.pages = ensureLanguagePrefix(translatedTab.pages, language);
          }
          
          return translatedTab;
        })
      );
      
      timer.log("translated tabs");
    } else {
      console.log(`Navigation tabs already exist for ${language} with ${translatedNavigation.tabs?.length || 0} items`);
      
      // Even if tabs exist, we need to ensure language prefixes are correct
      if (translatedNavigation.tabs?.length) {
        console.log(`Ensuring language prefixes are correct for existing ${language} navigation...`);
        translatedNavigation.tabs = translatedNavigation.tabs.map(tab => {
          // Recursively apply language prefix to all nested items
          const processTab = (tabItem: any): any => {
            if (tabItem.pages) {
              tabItem.pages = ensureLanguagePrefix(tabItem.pages, language);
            }
            if (tabItem.groups) {
              tabItem.groups = tabItem.groups.map((group: any) => processTab(group));
            }
            if (tabItem.menu) {
              tabItem.menu = tabItem.menu.map((menuItem: any) => processTab(menuItem));
            }
            return tabItem;
          };
          return processTab(tab);
        });
        timer.log("ensured language prefixes");
      }
      
      if (!forceUpdateNavigation) {
        console.log("Use --force-update-navigation to retranslate existing navigation");
      }
    }

    // CRITICAL: Always ensure language prefixes are applied to ALL navigation structures
    if (translatedNavigation.tabs?.length) {
      console.log(`Final pass: Ensuring ALL pages have ${language}/ prefix...`);
      translatedNavigation.tabs = translatedNavigation.tabs.map(tab => {
        const processTab = (tabItem: any): any => {
          if (tabItem.pages) {
            tabItem.pages = tabItem.pages.map((page: any) => {
              if (typeof page === "string" && !page.startsWith("http") && !page.startsWith("redirect/")) {
                const cleanPath = page.replace(/^[a-z]{2}(-[A-Z]{2})?\//, "");
                return `${language}/${cleanPath}`;
              }
              return page;
            });
          }
          if (tabItem.groups) {
            tabItem.groups = tabItem.groups.map((group: any) => processTab(group));
          }
          if (tabItem.menu) {
            tabItem.menu = tabItem.menu.map((menuItem: any) => processTab(menuItem));
          }
          return tabItem;
        };
        return processTab(tab);
      });
      timer.log("final language prefix pass");
    }

    // Handle global anchors - these might need translation too
    if (englishNav.global?.anchors) {
      const translatedAnchors = await Promise.all(
        englishNav.global.anchors.map(async anchor => ({
          ...anchor,
          anchor: await translateText(anchor.anchor, language, "anchor")
        }))
      );
      
      translatedNavigation.global = {
        anchors: translatedAnchors
      };
      timer.log("translated anchors");
    } else {
      console.log(`Global anchors already exist for ${language}`);
      if (!forceUpdateNavigation) {
        console.log("Use --force-update-navigation to retranslate existing anchors");
      }
    }

    // Initialize languages array if needed
    if (!docs.navigation.languages) {
      docs.navigation.languages = [];
    }

    // Update or add the language entry
    const langIndex = docs.navigation.languages.findIndex((l: any) => l.language === language);
    if (langIndex >= 0) {
      docs.navigation.languages[langIndex] = translatedNavigation;
    } else {
      docs.navigation.languages.push(translatedNavigation);
    }

    // Write the updated docs.json
    await fs.writeFile(docsPath, JSON.stringify(docs, null, 2));

    timer.log("wrote updated docs.json");
    console.log(`✓ Updated docs.json with ${language} navigation`);
  } catch (error) {
    console.error("Error translating navigation:", error);
    throw error;
  }
}

async function translateFrontmatter(frontmatter: Record<string, any>, language: string): Promise<Record<string, any>> {
  const timer = new Timer("translateFrontmatter");
  const translatedFrontmatter = { ...frontmatter };

  for (const field of CONFIG.translatableFrontmatter) {
    if (frontmatter[field]) {
      console.log(`Translating frontmatter field: ${field}`);
      translatedFrontmatter[field] = await translateText(frontmatter[field], language, `field: ${field}`);
    }
  }

  timer.log();
  return translatedFrontmatter;
}

async function translateContent(content: string, language: string): Promise<string> {
  const timer = new Timer("translateContent");

  // If dry run, return content unchanged
  if (CONFIG.dryRun) {
    console.log("Dry run: Would translate content here");
    return content;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the following content to ${language} while preserving all markdown and MDX syntax, code blocks, and special formatting. 
          
          CRITICAL: This is MDX content that contains HTML elements. You MUST preserve all HTML exactly as written - DO NOT wrap HTML in code blocks.
          
          Do not translate:
          1. Code examples
          2. Variable names
          3. Technical terms
          4. File paths
          5. URLs
          6. Component names
          7. Configuration keys
          8. Command line commands
          9. HTML/JSX tags and attributes
          
          NEVER wrap HTML elements like <iframe>, <img>, <Card>, etc. in code blocks. Keep them as raw HTML.`,
        },
        {
          role: "user",
          content,
        },
      ],
      temperature: 0.3,
    });

    timer.log();
    return response.choices[0]?.message?.content || content;
  } catch (error) {
    console.error("Translation error:", error);
    throw error;
  }
}

async function loadSourceHashes(): Promise<SourceHash[]> {
  try {
    const content = await fs.readFile(CONFIG.sourceHashFile, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    // If file doesn't exist or is invalid, return empty array
    return [];
  }
}

async function saveSourceHashes(hashes: SourceHash[]): Promise<void> {
  await fs.writeFile(CONFIG.sourceHashFile, JSON.stringify(hashes, null, 2));
}

async function updateSourceHash(sourceFile: string, content: string): Promise<string> {
  const sourceData = matter(content);
  const hash = Buffer.from(sourceData.content).toString("base64");

  const hashes = await loadSourceHashes();
  const existingIndex = hashes.findIndex(h => h.sourceFile === sourceFile);
  const hashEntry: SourceHash = {
    sourceFile,
    sourceHash: hash,
    lastUpdated: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    hashes[existingIndex] = hashEntry;
  } else {
    hashes.push(hashEntry);
  }

  await saveSourceHashes(hashes);
  return hash;
}

async function shouldTranslateFile(sourcePath: string, targetPath: string): Promise<boolean> {
  try {
    // If target doesn't exist, we should translate
    try {
      await fs.access(targetPath);
    } catch {
      console.log(`New file detected: ${path.relative(CONFIG.docsContentDir, sourcePath)}`);
      return true;
    }

    // In non-update mode, skip existing files
    if (!updateMode) {
      console.log(`Skipping existing file: ${path.relative(CONFIG.docsContentDir, targetPath)}`);
      return false;
    }

    // In update mode, compare source content with stored hash
    const sourceContent = await fs.readFile(sourcePath, "utf-8");
    const sourceData = matter(sourceContent);
    const currentSourceHash = Buffer.from(sourceData.content).toString("base64");

    // Load stored hashes
    const hashes = await loadSourceHashes();
    const storedHash = hashes.find(h => h.sourceFile === path.relative(CONFIG.docsContentDir, sourcePath));

    console.log(`
      sourcePath: ${sourcePath}      
      currentSourceHash: ${currentSourceHash.slice(0, 20)}...
      
      storedHash: ${storedHash?.sourceHash.slice(0, 20) || "not found"}...
      lastUpdated: ${storedHash?.lastUpdated || "never"}
    `);

    // If no stored hash or hash differs, we should update
    const shouldUpdate = !storedHash || currentSourceHash !== storedHash.sourceHash;
    if (shouldUpdate) {
      console.log(`Source content changed, updating: ${path.relative(CONFIG.docsContentDir, sourcePath)}`);
    } else {
      console.log(`No content changes detected, skipping: ${path.relative(CONFIG.docsContentDir, targetPath)}`);
    }

    return shouldUpdate;
  } catch (error) {
    console.error(`Error checking file status: ${error}`);
    return false;
  }
}

async function processFile(filePath: string, language: string): Promise<void> {
  const timer = new Timer("processFile");
  try {
    // Read the source file
    const content = await fs.readFile(filePath, "utf-8");
    timer.log("read file");

    // Parse frontmatter
    const { data: frontmatter, content: markdownContent } = matter(content);
    timer.log("parsed frontmatter");

    // Create target path
    const relativePath = path.relative(CONFIG.docsContentDir, filePath);

    // Check if the file is already in a language directory
    const isInLanguageDir = relativePath.startsWith(language + "/");
    const cleanRelativePath = isInLanguageDir ? relativePath : path.join(language, relativePath);

    const targetDir = path.join(CONFIG.docsContentDir, path.dirname(cleanRelativePath));
    const targetPath = path.join(CONFIG.docsContentDir, cleanRelativePath);

    // Check if we should translate this file
    if (!(await shouldTranslateFile(filePath, targetPath))) {
      return;
    }

    // Create translation metadata
    const meta: TranslationMeta = {
      sourcePath: filePath,
      targetPath,
      language,
      originalContent: markdownContent,
      frontmatter,
    };

    // Ensure target directory exists
    await fs.mkdir(targetDir, { recursive: true });
    timer.log("created target directory");

    // Translate frontmatter
    const translatedFrontmatter = await translateFrontmatter(frontmatter, language);
    timer.log("translated frontmatter");

    // Translate content
    const translatedContent = await translateContent(markdownContent, language);
    timer.log("translated content");

    // Update source hash in our central storage
    await updateSourceHash(relativePath, content);

    // Update frontmatter for translated version
    const updatedFrontmatter = {
      ...translatedFrontmatter,
      lang: language,
      originalPath: relativePath,
    };

    // Combine frontmatter and translated content
    const finalContent = matter.stringify(translatedContent, updatedFrontmatter);

    if (!CONFIG.dryRun) {
      // Write translated file
      await fs.writeFile(targetPath, finalContent);
      timer.log("wrote translated file");
      console.log(`✓ Translated: ${relativePath} -> ${cleanRelativePath}`);
    } else {
      console.log(`Would translate: ${relativePath} -> ${cleanRelativePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

function showHelp(): void {
  console.log(`
B3 Documentation Translation Script

Usage:
  pnpm run translate [options]

Options:
  --all                    Process ALL files (not just changed ones)
  --update                 Update existing translated files if source changed
  --force-update-navigation Force retranslation of navigation structure
  --source-hashes-only     Only update source file hashes (no translation)
  --help, -h               Show this help message

Environment Variables:
  TRANSLATION_DRY_RUN=true Run in dry-run mode (preview only, no changes)
  TRANSLATION_BATCH_SIZE=N Process N files at a time (default: 1)

Examples:
  pnpm run translate                           # Translate only new/changed files
  pnpm run translate --all                     # Translate all files
  pnpm run translate --update                  # Update existing files if source changed
  pnpm run translate --force-update-navigation # Force retranslate navigation
  pnpm run translate --source-hashes-only      # Only update source hashes
  TRANSLATION_DRY_RUN=true pnpm run translate  # Preview what would be translated

Language Support:
  - Spanish (es)
  - Brazilian Portuguese (pt-BR) 
  - Indonesian/Malay (id)
  - Korean (ko)
  - Simplified Chinese (cn)

What Gets Translated:
  - Page titles and descriptions
  - Navigation structure and labels
  - All human-readable text content
  - Preserves HTML elements, code blocks, and technical terms

HTML Preservation:
  The script now properly preserves HTML elements like <iframe>, <img>, <br />, etc.
  without wrapping them in code blocks. If you encounter files with HTML escaping
  issues, use the cleanup script:
  
  pnpm run clean-html-escaped --dry-run    # Preview affected files
  pnpm run clean-html-escaped --delete     # Delete affected files
  pnpm run translate --all                 # Re-translate with fixed prompts
`);
}

async function main() {
  // Handle help flag
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    showHelp();
    process.exit(0);
  }

  const totalTimer = new Timer("total");
  try {
    const files = await glob("**/*{.md,.mdx}", {
      ignore: [
        ...CONFIG.excludeDirs.map(dir => `**/${dir}/**`),
        // Ignore files that are already in language directories
        ...CONFIG.languages.map(lang => `${lang}/**`),
      ],
      cwd: CONFIG.docsContentDir,
      absolute: true,
    });

    if (files.length === 0) {
      console.log("No documentation files found to translate");
      return;
    }

    console.log(`Found ${files.length} files to process`);
    console.log(`Mode: ${CONFIG.dryRun ? "DRY RUN" : "LIVE"}${sourceHashesOnly ? " (SOURCE HASHES ONLY)" : ""}`);
    console.log(`Processing: ${processAllFiles ? "ALL FILES" : `${CONFIG.batchSize} file(s)`}`);
    console.log(`Update mode: ${updateMode ? "ON" : "OFF"}`);

    const filesToProcess = processAllFiles ? files : files.slice(0, CONFIG.batchSize);

    if (sourceHashesOnly) {
      // Only process source files and update their hashes
      console.log("\nUpdating source file hashes...");
      let hashesUpdated = 0;

      for (const file of filesToProcess) {
        const relativePath = path.relative(CONFIG.docsContentDir, file);
        console.log(`\nProcessing: ${relativePath}`);

        try {
          const content = await fs.readFile(file, "utf-8");
          if (CONFIG.dryRun) {
            console.log(`Would update hash for: ${relativePath}`);
            hashesUpdated++;
          } else {
            await updateSourceHash(relativePath, content);
            hashesUpdated++;
            console.log(`✓ Updated hash for: ${relativePath}`);
          }
        } catch (error) {
          console.error(`Error processing ${relativePath}:`, error);
        }
      }

      console.log(`\nSource hash update complete:`);
      console.log(`- Updated: ${hashesUpdated} files`);
      console.log(`- Skipped: ${files.length - hashesUpdated} files`);
      return;
    }

    // First, translate the navigation for all languages
    for (const language of CONFIG.languages) {
      await translateNavigation(language);
    }

    // Then process the documentation files for each language
    let totalProcessed = 0;
    let totalSkipped = 0;

    // Process each language independently
    // // TEMPORARY: Only process Spanish
    // for (const language of ["es", "pt-BR"]) {
      for (const language of CONFIG.languages) {
      console.log(`\nProcessing language: ${language}`);
      let processedCount = 0;
      let skippedCount = 0;

      for (const file of filesToProcess) {
        console.log(`\nProcessing file: ${file}`);
        const relativePath = path.relative(CONFIG.docsContentDir, file);

        // Skip files that are already in language directories
        if (CONFIG.languages.some(lang => relativePath.startsWith(lang + "/"))) {
          console.log(`Skipping already translated file: ${relativePath}`);
          skippedCount++;
          continue;
        }

        const targetPath = path.join(CONFIG.docsContentDir, language, relativePath);

        if (await shouldTranslateFile(file, targetPath)) {
          await processFile(file, language);
          processedCount++;
          totalProcessed++;
        } else {
          skippedCount++;
          totalSkipped++;
        }
      }

      console.log(`\nLanguage ${language} summary:`);
      console.log(`- Processed: ${processedCount} files`);
      console.log(`- Skipped: ${skippedCount} files`);
    }

    totalTimer.log(`completed all translations (${totalProcessed} processed, ${totalSkipped} skipped)`);
  } catch (error) {
    console.error("Translation failed:", error);
    process.exit(1);
  }
}

main();
