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
            if (result) break;
        } else if (file === filename) {
            console.log(`File found: ${fullPath}`);
            result = fullPath;
            break;
        }
    }
    
    if (options.DEBUG === 'true') {
        console.log('#######- DEBUG MODE -#######');
        console.log('rewritePath.ts');
        console.log(`Result: ${result}`);
        console.log('#######- DEBUG MODE -#######');
    }
    
    return result || ''; // Return empty string if result is null
}