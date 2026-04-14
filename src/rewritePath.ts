import fs from 'fs';
import path from 'path';

interface Options {
    DEBUG?: string;
}

export async function rewritePath(options: Options, filename: string): Promise<string | undefined> {
    // Legacy function - now just returns the original filename
    // Auto-detection is handled in createFlawInfo.ts
    return filename;
}

export async function searchFile(dir: string, filename: string, options: Options): Promise<string> {
    if (options.DEBUG === 'true') {
        console.log('#######- DEBUG MODE -#######');
        console.log('rewritePath.ts');
        console.log(`Searching for file: ${filename} in directory: ${dir}`);
        console.log('#######- DEBUG MODE -#######');
    }

    let result: string | null = null;
    const files = fs.readdirSync(dir);

    for (const file of files) {
        if (file === '.git' || file === '.metadata' || file === 'app') continue;
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            result = await searchFile(fullPath, filename, options);
            // Only stop searching if we actually found the file
            if (result) {
                break;
            }
        } else if (file === filename) {
            console.log(`File found: ${fullPath}`);
            result = fullPath;
            break;
        } else if (options.DEBUG === 'true') {
            // Only log non-matching files in debug mode to avoid noisy logs
            console.log(`File checked and not matched: ${fullPath}`);
        }
    }
    
    if (options.DEBUG === 'true') {
        console.log('#######- DEBUG MODE -#######');
        console.log('rewritePath.ts');
        console.log(`Result: ${result}`);
        console.log('#######- DEBUG MODE -#######');
    }
    
    // If no file was found in the entire directory tree, return empty string
    if (!result) {
        if (options.DEBUG === 'true') {
            console.log('rewritePath.ts');
            console.log(`File ${filename} not found in directory tree starting at: ${dir}`);
        }
        return '';
    }

    return result;
}

/**
 * Normalizes file paths by removing GitHub Actions runner working directory prefix
 * and returning only the relative path from the repository root
 */
export function normalizePathForDisplay(fullPath: string, repositoryRoot?: string): string {
    if (!fullPath) {
        return fullPath;
    }

    // If repositoryRoot is provided, use it as the base
    if (repositoryRoot) {
        const relativePath = path.relative(repositoryRoot, fullPath);
        return relativePath.startsWith('..') ? fullPath : relativePath;
    }

    // Try to detect GitHub Actions runner paths
    const githubActionsPatterns = [
        /^\/home\/runner\/work\/[^\/]+\/[^\/]+\/(.+)$/,  // /home/runner/work/repo-owner/repo-name/...
        /^\/github\/workspace\/(.+)$/,                   // /github/workspace/...
        /^\/Users\/[^\/]+\/work\/[^\/]+\/[^\/]+\/(.+)$/ // /Users/username/work/repo-owner/repo-name/...
    ];

    for (const pattern of githubActionsPatterns) {
        const match = fullPath.match(pattern);
        if (match) {
            return match[1];
        }
    }

    // If no pattern matches, try to find the repository root by looking for .git directory
    let currentDir = path.dirname(fullPath);
    while (currentDir !== path.dirname(currentDir)) {
        if (fs.existsSync(path.join(currentDir, '.git'))) {
            const relativePath = path.relative(currentDir, fullPath);
            return relativePath;
        }
        currentDir = path.dirname(currentDir);
    }

    // If all else fails, return the original path
    return fullPath;
}