import dotenv from "dotenv";
import * as fs from "fs/promises";
import { glob } from "glob";
import matter from "gray-matter";
import { OpenAI } from "openai";
import * as path from "path";

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
  batchSize: Number(process.env.TRANSLATION_BATCH_SIZE) || 1,
  dryRun: process.env.TRANSLATION_DRY_RUN === "true",
} as const;

interface TranslationMeta {
  sourcePath: string;
  targetPath: string;
  language: string;
  originalContent: string;
  frontmatter: Record<string, any>;
}

async function translateText(text: string, language: string): Promise<string> {
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

    return response.choices[0]?.message?.content || text;
  } catch (error) {
    console.error("Translation error:", error);
    throw error;
  }
}

async function translateFrontmatter(frontmatter: Record<string, any>, language: string): Promise<Record<string, any>> {
  const translatedFrontmatter = { ...frontmatter };

  for (const field of CONFIG.translatableFrontmatter) {
    if (frontmatter[field]) {
      console.log(`Translating frontmatter field: ${field}`);
      translatedFrontmatter[field] = await translateText(frontmatter[field], language);
    }
  }

  return translatedFrontmatter;
}

async function translateContent(content: string, language: string): Promise<string> {
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

    return response.choices[0]?.message?.content || content;
  } catch (error) {
    console.error("Translation error:", error);
    throw error;
  }
}

async function processFile(filePath: string, language: string): Promise<void> {
  try {
    // Read the source file
    const content = await fs.readFile(filePath, "utf-8");

    // Parse frontmatter
    const { data: frontmatter, content: markdownContent } = matter(content);

    // Create target path
    const relativePath = path.relative(CONFIG.docsContentDir, filePath);
    const targetDir = path.join(CONFIG.docsContentDir, language, path.dirname(relativePath));
    const targetPath = path.join(targetDir, path.basename(filePath));

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

    // Translate frontmatter
    const translatedFrontmatter = await translateFrontmatter(frontmatter, language);

    // Translate content
    const translatedContent = await translateContent(markdownContent, language);

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
      console.log(`✓ Translated: ${relativePath} -> ${language}/${relativePath}`);
    } else {
      console.log(`Would translate: ${relativePath} -> ${language}/${relativePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

async function main() {
  try {
    // Get all documentation files
    const files = await glob("**/*{.md,.mdx}", {
      ignore: CONFIG.excludeDirs.map(dir => `**/${dir}/**`),
      cwd: CONFIG.docsContentDir,
      absolute: true,
    });

    if (files.length === 0) {
      console.log("No documentation files found to translate");
      return;
    }

    console.log(`Found ${files.length} files to process`);
    console.log(`Mode: ${CONFIG.dryRun ? "DRY RUN" : "LIVE"}`);
    console.log(`Batch size: ${CONFIG.batchSize}`);

    // For testing, take the first N files based on batch size
    const filesToProcess = files.slice(0, CONFIG.batchSize);

    for (const file of filesToProcess) {
      console.log(`\nProcessing file: ${file}`);
      await processFile(file, "es");
    }
  } catch (error) {
    console.error("Translation failed:", error);
    process.exit(1);
  }
}

main();
