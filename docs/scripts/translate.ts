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

// Configuration
const CONFIG = {
  languages: ["es"], // Start with Spanish, can expand later
  sourceDir: path.join(process.cwd(), "..", "docs"), // Root docs directory
  docsContentDir: path.join(process.cwd(), "..", "docs"), // Where the actual docs content lives
  excludeDirs: ["node_modules", ".next", "public", "scripts", "images"],
  supportedExtensions: [".mdx", ".md"],
  // Frontmatter fields that should be translated
  translatableFrontmatter: ["title", "description"],
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
          content: `You are a professional translator. Translate the following text to ${language}. Preserve any special characters, quotes, or formatting. Only translate the actual text content.`,
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
    translatedItem.pages = await Promise.all(
      item.pages.map(async page => {
        if (typeof page === "string") {
          // Remove any existing language prefix
          const cleanPath = page.replace(/^[a-z]{2}\//, "");
          // Add the new language prefix
          return `${language}/${cleanPath}`;
        } else {
          // Recursively translate nested navigation items
          return await translateNavigationItem(page, language);
        }
      }),
    );
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

    // Get the original navigation structure
    const originalNavigation = docs.navigation;

    // Find existing language entry if it exists
    const existingLangEntry = docs.navigation.languages?.find((l: any) => l.language === language);

    // If we have an existing entry, use it as the base
    const translatedNavigation = existingLangEntry || {
      language,
      tabs: [],
      global: {},
    };

    // Only translate tabs if they don't exist in the language entry
    if (!translatedNavigation.tabs?.length && originalNavigation.tabs?.length) {
      translatedNavigation.tabs = await Promise.all(
        originalNavigation.tabs.map(tab => translateNavigationItem(tab, language)),
      );
      timer.log("translated tabs");
    } else {
      console.log("Preserving existing tabs for language:", language);
    }

    // Only translate global anchors if they don't exist in the language entry
    if (!translatedNavigation.global?.anchors?.length && originalNavigation.global?.anchors?.length) {
      translatedNavigation.global = {
        anchors: await Promise.all(
          originalNavigation.global.anchors.map(async anchor => ({
            ...anchor,
            anchor: await translateText(anchor.anchor, language, "anchor"),
          })),
        ),
      };
      timer.log("translated anchors");
    } else {
      console.log("Preserving existing anchors for language:", language);
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
          content: `You are a professional translator. Translate the following content to ${language} while preserving all markdown and MDX syntax, code blocks, and special formatting. Do not translate:
          1. Code examples
          2. Variable names
          3. Technical terms
          4. File paths
          5. URLs
          6. Component names
          7. Configuration keys
          8. Command line commands
          9. HTML/JSX tags and attributes`,
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

    // In update mode, check modification dates
    const sourceStats = await fs.stat(sourcePath);
    const targetStats = await fs.stat(targetPath);

    const shouldUpdate = sourceStats.mtime > targetStats.mtime;
    if (shouldUpdate) {
      console.log(`Source file modified, updating: ${path.relative(CONFIG.docsContentDir, sourcePath)}`);
    } else {
      console.log(`No changes detected, skipping: ${path.relative(CONFIG.docsContentDir, targetPath)}`);
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

async function main() {
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
    console.log(`Mode: ${CONFIG.dryRun ? "DRY RUN" : "LIVE"}`);
    console.log(`Processing: ${processAllFiles ? "ALL FILES" : `${CONFIG.batchSize} file(s)`}`);
    console.log(`Update mode: ${updateMode ? "ON" : "OFF"}`);

    // First, translate the navigation
    for (const language of CONFIG.languages) {
      await translateNavigation(language);
    }

    // Then process the documentation files
    const filesToProcess = processAllFiles ? files : files.slice(0, CONFIG.batchSize);

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

      const targetPath = path.join(CONFIG.docsContentDir, "es", relativePath);

      if (await shouldTranslateFile(file, targetPath)) {
        await processFile(file, "es");
        processedCount++;
      } else {
        skippedCount++;
      }
    }

    totalTimer.log(`completed all translations (${processedCount} processed, ${skippedCount} skipped)`);
  } catch (error) {
    console.error("Translation failed:", error);
    process.exit(1);
  }
}

main();
