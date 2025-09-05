/**
 * Language detection utility based on file extensions
 * Maps file extensions to programming languages supported by Veracode
 */

export function detectLanguageFromFile(filePath: string): string {
    if (!filePath) {
        return 'unknown';
    }

    // Extract file extension
    const extension = filePath.split('.').pop()?.toLowerCase();
    
    if (!extension) {
        return 'unknown';
    }

    // Map file extensions to Veracode-supported languages
    const extensionToLanguage: { [key: string]: string } = {
        // Java
        'java': 'java',
        
        // C# / .NET
        'cs': 'csharp',
        'csx': 'csharp',
        
        // JavaScript / TypeScript
        'js': 'javascript',
        'jsx': 'javascript',
        'ts': 'javascript',
        'tsx': 'javascript',
        'mjs': 'javascript',
        'cjs': 'javascript',
        
        // PHP
        'php': 'php',
        'phtml': 'php',
        'php3': 'php',
        'php4': 'php',
        'php5': 'php',
        'php7': 'php',
        'php8': 'php',
        
        // Python
        'py': 'python',
        'pyw': 'python',
        'pyi': 'python',
        'pyc': 'python',
        'pyo': 'python',
        'pyd': 'python',
        
        // Kotlin
        'kt': 'kotlin',
        'kts': 'kotlin',
        
        // Scala
        'scala': 'scala',
        'sc': 'scala',
        
        // Go
        'go': 'go',
        
        // Ruby
        'rb': 'ruby',
        'rbw': 'ruby',
        'rake': 'ruby',
        'gemspec': 'ruby',
        'podspec': 'ruby',
        'thor': 'ruby',
        'jbuilder': 'ruby',
        'ru': 'ruby',
        'rbx': 'ruby',
        'rjs': 'ruby',
        'irbrc': 'ruby',
        'pryrc': 'ruby',
        'Guardfile': 'ruby',
        'Procfile': 'ruby',
        'config.ru': 'ruby',
        'Capfile': 'ruby',
        'Gemfile': 'ruby',
        'Rakefile': 'ruby',
        'Vagrantfile': 'ruby',
        'Berksfile': 'ruby',
        'Cheffile': 'ruby',
        'Podfile': 'ruby',
        'Fastfile': 'ruby',
        'Appfile': 'ruby',
        'Deliverfile': 'ruby',
        'Matchfile': 'ruby',
        'Scanfile': 'ruby',
        'Gymfile': 'ruby',
        'Snapfile': 'ruby',
        'Precheckfile': 'ruby',
        'Screengrabfile': 'ruby',
        'Trainfile': 'ruby',
        'Supplyfile': 'ruby',
        'Pemfile': 'ruby',
        'Sighfile': 'ruby',
        'Producefile': 'ruby',
        'Pilotfile': 'ruby',
        'Spaceshipfile': 'ruby',
        'Credentialsfile': 'ruby',
        'Framefile': 'ruby'
    };

    const detectedLanguage = extensionToLanguage[extension];
    
    if (detectedLanguage) {
        return detectedLanguage;
    }

    // Check for special cases or patterns in filename
    const fileName = filePath.split('/').pop()?.toLowerCase() || '';
    
    // Check for common configuration files that might indicate language
    if (fileName === 'pom.xml' || fileName === 'build.gradle' || fileName === 'build.gradle.kts') {
        return 'java';
    }
    
    if (fileName === 'package.json' || fileName === 'yarn.lock' || fileName === 'package-lock.json') {
        return 'javascript';
    }
    
    if (fileName === 'requirements.txt' || fileName === 'setup.py' || fileName === 'pyproject.toml') {
        return 'python';
    }
    
    if (fileName === 'composer.json' || fileName === 'composer.lock') {
        return 'php';
    }
    
    if (fileName === 'go.mod' || fileName === 'go.sum') {
        return 'go';
    }
    
    if (fileName === 'gemfile' || fileName === 'gemfile.lock') {
        return 'ruby';
    }

    // Default to unknown if no match found
    return 'unknown';
}

/**
 * Get supported languages for Veracode
 */
export function getSupportedLanguages(): string[] {
    return ['java', 'csharp', 'javascript', 'php', 'python', 'kotlin', 'scala', 'go', 'ruby'];
}

/**
 * Check if a detected language is supported by Veracode
 */
export function isLanguageSupported(language: string): boolean {
    return getSupportedLanguages().includes(language);
}
