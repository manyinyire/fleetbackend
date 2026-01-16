/**
 * Script to remove debug console.log statements from the codebase
 * Keeps production error logging (console.error in catch blocks)
 * 
 * Run with: npx tsx scripts/remove-debug-logs.ts
 */

import fs from 'fs';
import path from 'path';

const srcDir = path.join(process.cwd(), 'src');

// Patterns to remove (debug logs)
const debugPatterns = [
  // Debug comments followed by console.log
  /\/\/ Debug.*\n\s*console\.log\([^)]*\);?\n?/g,
  /\/\/ Debug:.*\n\s*console\.log\([^)]*\);?\n?/g,
  
  // Standalone debug console.logs (not in catch blocks)
  /^\s*console\.log\(['"].*debug.*['"].*\);?\n?/gim,
  /^\s*console\.log\(['"].*Debug.*['"].*\);?\n?/gim,
  
  // Multiple console.log statements in a row (likely debug)
  /(\s*console\.log\([^)]*\);?\n){3,}/g,
];

// Files to process
const filesToClean: string[] = [];

function findFiles(dir: string) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findFiles(filePath);
    } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
      filesToClean.push(filePath);
    }
  }
}

function cleanFile(filePath: string): boolean {
  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;
  
  // Remove debug patterns
  for (const pattern of debugPatterns) {
    content = content.replace(pattern, '');
  }
  
  // Remove empty lines that were left behind (max 2 consecutive)
  content = content.replace(/\n{3,}/g, '\n\n');
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  }
  
  return false;
}

// Main execution
console.log('🧹 Cleaning debug logs from codebase...\n');

findFiles(srcDir);

let cleanedCount = 0;
for (const file of filesToClean) {
  if (cleanFile(file)) {
    cleanedCount++;
    console.log(`✓ Cleaned: ${path.relative(process.cwd(), file)}`);
  }
}

console.log(`\n✅ Cleaned ${cleanedCount} files`);
console.log('📝 Note: Production error logging (console.error in catch blocks) was preserved');
