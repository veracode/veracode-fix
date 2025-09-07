import * as core from '@actions/core'
import * as github from '@actions/github'

/**
 * Check if the Veracode GitHub App is installed on the repository
 * @param token GitHub token
 * @param owner Repository owner
 * @param repo Repository name
 * @returns Promise<boolean> True if app is installed, false otherwise
 */
export async function isVeracodeAppInstalled(token: string, owner: string, repo: string): Promise<boolean> {
    try {
        const octokit = github.getOctokit(token);
        
        // The app ID is the same across all installations - it's the unique identifier for the GitHub App
        const appId = process.env.VERACODE_APP_ID || '1907493'; // Default to your app ID
        
        try {
            // Method 1: Try to get the app information directly
            const { data: appData } = await octokit.rest.apps.getBySlug({
                app_slug: 'veracode-fix-for-github' // This should match your app's slug
            });
            
            if (appData.id.toString() === appId) {
                core.info('✅ Veracode app found by slug');
                return true;
            }
        } catch (error) {
            core.info('Could not find app by slug, trying alternative method...');
        }
        
        try {
            // Method 2: Check if we can access the app's installation for this repository
            // This is more reliable as it checks the actual installation
            const { data: installation } = await octokit.rest.apps.getRepoInstallation({
                owner,
                repo
            });
            
            if (installation.app_id.toString() === appId) {
                core.info('✅ Veracode app installation found for repository');
                return true;
            }
        } catch (error) {
            core.info('Could not find app installation for repository: ' + error);
        }
        
        try {
            // Method 3: List all installations and check if our app is there
            const { data: installations } = await octokit.rest.apps.listInstallations({
                per_page: 100
            });
            
            const veracodeApp = installations.find((installation: any) => 
                installation.app_id.toString() === appId
            );
            
            if (veracodeApp) {
                core.info('✅ Veracode app found in installations list');
                return true;
            }
        } catch (error) {
            core.info('Could not list app installations: ' + error);
        }
        
        core.info('❌ Veracode app not found using any method');
        return false;
        
    } catch (error) {
        core.info('Error checking if Veracode app is installed: ' + error);
        return false;
    }
}

/**
 * Create a single PR comment with Veracode branding and command instructions
 * @param token GitHub token
 * @param owner Repository owner
 * @param repo Repository name
 * @param issueNumber PR number
 * @param findingsCount Number of findings detected
 */
export async function createVeracodeAppComment(
    token: string, 
    owner: string, 
    repo: string, 
    issueNumber: number, 
    findingsCount: number
): Promise<void> {
    const commentBody = `## 🟡 Veracode Security Analysis

<div align="center">
  <img src="https://www.veracode.com/sites/default/files/2021-08/veracode-logo.png" alt="Veracode" width="200"/>
</div>

### ⚠️ Security Findings Detected

| Metric | Count |
|--------|-------|
| **Total Flaws** | **${findingsCount}** |
| **Fix Suggestions Available** | **${findingsCount}** |
| **Severity Level** | **MEDIUM** |

---

### 🔧 Available Commands

Use these commands to interact with Veracode Fix suggestions:

| Command | Description |
|---------|-------------|
| \`/veracode show-all\` | Show all flaws with fix suggestions |
| \`/veracode fix-all\` | Apply all available fixes |
| \`/veracode filter-cwe CWE-117,CWE-89\` | Filter by specific CWE numbers |
| \`/veracode filter-commit\` | Show only flaws in changed files |
| \`/veracode apply-fix fix1,fix2\` | Apply specific fixes |

---

### ℹ️ About Veracode Fix

Veracode Fix provides intelligent remediation suggestions for security vulnerabilities. Use the commands above to review and apply fixes to your code.

---
*Powered by [Veracode](https://www.veracode.com/)*`;

    try {
        const octokit = github.getOctokit(token);
        
        const { data: comment } = await octokit.rest.issues.createComment({
            owner,
            repo,
            issue_number: issueNumber,
            body: commentBody,
        });
        
        core.info(`✅ Veracode app comment posted to PR #${issueNumber}`);
        core.info(`🔗 Comment URL: ${comment.html_url}`);
    } catch (error) {
        core.error(`❌ Failed to post Veracode app comment: ${error}`);
        throw error;
    }
}
