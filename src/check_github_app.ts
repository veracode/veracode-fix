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
        
        // Get the repository information
        const { data: repoData } = await octokit.rest.repos.get({
            owner,
            repo
        });
        
        // Check if the Veracode app is installed by looking for it in the repository
        // We'll check for the app by looking for a specific app installation
        // The app ID should be configured in the environment or as a parameter
        const appId = process.env.VERACODE_APP_ID || '1907493'; // Default to your app ID
        
        try {
            // Try to get app installations for the repository
            const { data: installations } = await octokit.rest.apps.listInstallations({
                per_page: 100
            });
            
            // Check if our Veracode app is in the list
            const veracodeApp = installations.find((installation: any) => 
                installation.app_id.toString() === appId
            );
            
            return !!veracodeApp;
        } catch (error) {
            // If we can't check installations, assume app is not installed
            core.info('Could not check app installations, assuming app is not installed');
            return false;
        }
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
