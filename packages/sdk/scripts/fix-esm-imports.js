const fs = require("fs");
const path = require("path");

function fixEsmImports(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      fixEsmImports(filePath);
    } else if (file.endsWith(".js")) {
      let content = fs.readFileSync(filePath, "utf-8");

      // Fix relative imports that don't have extensions
      content = content.replace(/from\s+["'](\.\.?\/.*?)["']/g, (match, importPath) => {
        // Skip if already has extension
        if (importPath.endsWith(".js") || importPath.endsWith(".json")) {
          return match;
        }

        // Check if it's a directory import (needs /index.js)
        const fullPath = path.resolve(path.dirname(filePath), importPath);
        const indexPath = path.join(fullPath, "index.js");

        if (fs.existsSync(indexPath)) {
          return match.replace(importPath, `${importPath}/index.js`);
        } else if (fs.existsSync(`${fullPath}.js`)) {
          return match.replace(importPath, `${importPath}.js`);
        }

        return match;
      });

      // Fix export statements
      content = content.replace(/export\s+\*\s+from\s+["'](\.\.?\/.*?)["']/g, (match, importPath) => {
        // Skip if already has extension
        if (importPath.endsWith(".js") || importPath.endsWith(".json")) {
          return match;
        }

        // Check if it's a directory import (needs /index.js)
        const fullPath = path.resolve(path.dirname(filePath), importPath);
        const indexPath = path.join(fullPath, "index.js");

        if (fs.existsSync(indexPath)) {
          return match.replace(importPath, `${importPath}/index.js`);
        } else if (fs.existsSync(`${fullPath}.js`)) {
          return match.replace(importPath, `${importPath}.js`);
        }

        return match;
      });

      fs.writeFileSync(filePath, content);
    }
  });
}

// Fix ESM imports in the dist/esm directory
const esmDir = path.join(__dirname, "../dist/esm");
if (fs.existsSync(esmDir)) {
  console.log("Fixing ESM imports...");
  fixEsmImports(esmDir);
  console.log("ESM imports fixed!");
}
