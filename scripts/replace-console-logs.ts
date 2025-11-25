/**
 * Script to replace console statements with proper logger
 * Run with: npm run ts-node scripts/replace-console-logs.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface Replacement {
    pattern: RegExp;
    replacement: string;
    description: string;
}

// Map file types to appropriate loggers
const loggerMap: Record<string, string> = {
    'src/workers': 'jobLogger',
    'src/server/actions': 'authLogger',
    'src/app/api': 'apiLogger',
    'src/lib': 'apiLogger',
    'src/components': 'apiLogger', // Client components shouldn't use server loggers
    'src/hooks': 'apiLogger',
    'src/services': 'apiLogger',
};

// Replacements to perform
const replacements: Replacement[] = [
    // console.log replacements
    {
        pattern: /console\.log\((.*?)\);?$/gm,
        replacement: (match: string, args: string) => {
            // Try to extract structured data
            if (args.includes('{')) {
                return `logger.info(${args});`;
            }
            // Simple string message
            return `logger.info(${args});`;
        },
        description: 'Replace console.log with logger.info',
    },

    // console.error replacements  
    {
        pattern: /console\.error\((.*?),\s*(.*?)\);?$/gm,
        replacement: (match: string, msg: string, err: string) => {
            return `logger.error({ err: ${err} }, ${msg});`;
        },
        description: 'Replace console.error with logger.error',
    },

    // console.error simple
    {
        pattern: /console\.error\((.*?)\);?$/gm,
        replacement: (match: string, args: string) => {
            return `logger.error(${args});`;
        },
        description: 'Replace console.error (simple) with logger.error',
    },

    // console.warn replacements
    {
        pattern: /console\.warn\((.*?)\);?$/gm,
        replacement: (match: string, args: string) => {
            return `logger.warn(${args});`;
        },
        description: 'Replace console.warn with logger.warn',
    },

    // console.debug replacements
    {
        pattern: /console\.debug\((.*?)\);?$/gm,
        replacement: (match: string, args: string) => {
            return `logger.debug(${args});`;
        },
        description: 'Replace console.debug with logger.debug',
    },
];

async function getFilesToProcess(): Promise<string[]> {
    const patterns = [
        'src/**/*.ts',
        'src/**/*.tsx',
        '!src/**/*.test.ts',
        '!src/**/*.test.tsx',
        '!src/**/*.spec.ts',
        '!src/**/*.spec.tsx',
    ];

    const files: string[] = [];
    for (const pattern of patterns) {
        const matches = await glob(pattern, { absolute: true });
        files.push(...matches);
    }

    return files;
}

function determineLogger(filePath: string): string {
    for (const [dir, logger] of Object.entries(loggerMap)) {
        if (filePath.includes(dir)) {
            return logger;
        }
    }
    return 'apiLogger'; // default
}

function addLoggerImport(content: string, logger: string): string {
    // Check if already imported
    if (content.includes(`import { ${logger} }`)) {
        return content;
    }

    // Find existing imports from @/lib/logger
    const loggerImportRegex = /import\s+{([^}]+)}\s+from\s+['"]@\/lib\/logger['"]/;
    const match = content.match(loggerImportRegex);

    if (match) {
        // Add to existing import
        const imports = match[1].split(',').map(s => s.trim());
        if (!imports.includes(logger)) {
            imports.push(logger);
            return content.replace(
                loggerImportRegex,
                `import { ${imports.join(', ')} } from '@/lib/logger'`
            );
        }
        return content;
    }

    // Add new import after other imports
    const importRegex = /^import.*$/gm;
    const imports = content.match(importRegex);

    if (imports && imports.length > 0) {
        const lastImport = imports[imports.length - 1];
        const lastImportIndex = content.indexOf(lastImport) + lastImport.length;
        return content.slice(0, lastImportIndex) +
            `\nimport { ${logger} } from '@/lib/logger';` +
            content.slice(lastImportIndex);
    }

    // No imports found, add at beginning
    return `import { ${logger} } from '@/lib/logger';\n\n` + content;
}

async function processFile(filePath: string): Promise<boolean> {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;

    // Check if file has console statements
    if (!content.match(/console\.(log|error|warn|debug)/)) {
        return false; // No changes needed
    }

    // Skip files that shouldn't use server-side logging
    if (filePath.includes('.tsx') && filePath.includes('/components/')) {
        console.log(`Skipping client component: ${path.relative(process.cwd(), filePath)}`);
        return false;
    }

    // Determine appropriate logger
    const logger = determineLogger(filePath);

    // Perform replacements
    for (const { pattern, replacement } of replacements) {
        if (typeof replacement === 'string') {
            content = content.replace(pattern, replacement);
        }
    }

    // Replace generic 'logger' with specific logger
    content = content.replace(/logger\./g, `${logger}.`);

    // Add import if changes were made
    if (content !== originalContent) {
        content = addLoggerImport(content, logger);

        // Write changes
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`✓ Processed: ${path.relative(process.cwd(), filePath)}`);
        return true;
    }

    return false;
}

async function main() {
    console.log('🔍 Finding files with console statements...\n');

    const files = await getFilesToProcess();
    console.log(`Found ${files.length} files to check\n`);

    let processedCount = 0;
    let skippedCount = 0;

    for (const file of files) {
        const processed = await processFile(file);
        if (processed) {
            processedCount++;
        } else {
            skippedCount++;
        }
    }

    console.log(`\n✅ Complete!`);
    console.log(`   Processed: ${processedCount} files`);
    console.log(`   Skipped: ${skippedCount} files`);
    console.log(`\n💡 Review the changes and run tests before committing.`);
}

main().catch(console.error);
