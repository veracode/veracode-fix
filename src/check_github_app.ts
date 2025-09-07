import * as core from '@actions/core'
import * as github from '@actions/github'
import fs from 'fs'
import path from 'path'
import { searchFile, normalizePathForDisplay } from './rewritePath'

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
        
        // Method 1: Try to get the app information directly by slug
        try {
            const { data: appData } = await octokit.rest.apps.getBySlug({
                app_slug: 'veracode-fix-for-github' // This should match your app's slug
            });
            
            if (appData.id.toString() === appId) {
                core.info('✅ Veracode app found by slug');
                return true;
            }
        } catch (error: any) {
            core.info('Could not find app by slug: ' + (error.message || error));
        }
        
        // Method 2: Check if we can access the app's installation for this repository
        // This is more reliable as it checks the actual installation
        try {
            const { data: installation } = await octokit.rest.apps.getRepoInstallation({
                owner,
                repo
            });
            
            if (installation.app_id.toString() === appId) {
                core.info('✅ Veracode app installation found for repository');
                return true;
            }
        } catch (error: any) {
            core.info('Could not find app installation for repository: ' + (error.message || error));
        }
        
        // Method 3: List all installations and check if our app is there
        try {
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
        } catch (error: any) {
            core.info('Could not list app installations: ' + (error.message || error));
        }
        
        // Method 4: Check if the token has sufficient permissions by trying a simple API call
        try {
            const { data: repoData } = await octokit.rest.repos.get({
                owner,
                repo
            });
            core.info('✅ Token has repository access, but app detection failed');
        } catch (error: any) {
            core.info('❌ Token lacks sufficient permissions: ' + (error.message || error));
        }
        
        core.info('❌ Veracode app not found using any method');
        return false;
        
    } catch (error: any) {
        core.info('Error checking if Veracode app is installed: ' + (error.message || error));
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
 * @param fixSuggestionsCount Number of findings with fix suggestions available
 */
/**
 * Get PR changes (files and line numbers)
 */
async function getPRChanges(token: string, owner: string, repo: string, prNumber: number): Promise<any[]> {
    try {
        const octokit = github.getOctokit(token);
        const { data: files } = await octokit.rest.pulls.listFiles({
            owner,
            repo,
            pull_number: prNumber
        });
        
        return files.map(file => {
            core.info(`📁 Processing file: ${file.filename}`);
            if (file.patch) {
                core.info(`📝 Patch preview: ${file.patch.substring(0, 200)}...`);
            }
            const changedLines = extractChangedLines(file.patch || '');
            return {
                filename: file.filename,
                status: file.status,
                additions: file.additions,
                deletions: file.deletions,
                changes: file.changes,
                patch: file.patch,
                // Extract line numbers from patch
                changedLines: changedLines
            };
        });
    } catch (error) {
        core.error(`Failed to get PR changes: ${error}`);
        return [];
    }
}

/**
 * Extract changed line numbers from git patch
 */
function extractChangedLines(patch: string): number[] {
    const lines: number[] = [];
    const patchLines = patch.split('\n');
    
    let currentLine = 0;
    let inHunk = false;
    
    for (const line of patchLines) {
        if (line.startsWith('@@')) {
            // Parse hunk header like "@@ -44,6 +44,12 @@"
            const match = line.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
            if (match) {
                currentLine = parseInt(match[2]); // Start line in new version
                inHunk = true;
                core.info(`📝 Starting hunk at line ${currentLine}`);
            }
        } else if (inHunk) {
            if (line.startsWith('+') && !line.startsWith('+++')) {
                // This is an added line
                lines.push(currentLine);
                core.info(`📝 Added line ${currentLine}: ${line.substring(1, 50)}...`);
                currentLine++;
            } else if (line.startsWith('-') && !line.startsWith('---')) {
                // This is a removed line, don't increment currentLine
                core.info(`📝 Removed line ${currentLine}: ${line.substring(1, 50)}...`);
            } else if (line.startsWith('\\')) {
                // End of patch
                inHunk = false;
            } else if (line.trim() === '') {
                // Empty line, still increment
                currentLine++;
            } else {
                // Regular context line, increment counter
                currentLine++;
            }
        }
    }
    
    core.info(`📝 Total changed lines extracted: ${lines.length} - ${lines.join(', ')}`);
    return [...new Set(lines)]; // Remove duplicates
}

/**
 * Match findings to changed code lines
 */
async function matchFindingsToChanges(findings: any[], prChanges: any[], options: any): Promise<any[]> {
    const matches: any[] = [];
    
    core.info(`🔍 Matching ${findings.length} findings against ${prChanges.length} changed files`);
    
    for (const finding of findings) {
        // Get the source file from the finding (same structure as in createFlawInfo.ts)
        const sourceFile = finding.files?.source_file?.file;
        if (!sourceFile) {
            core.info(`⚠️  Finding ${finding.issue_id || 'unknown'} has no sourceFile`);
            continue;
        }
        
        core.info(`🔍 Checking finding in file: ${sourceFile}`);
        
        // Use the same file search logic as createFlawInfo.ts
        const filenameOnly = path.basename(sourceFile);
        const dir = process.cwd();
        let actualFilePath = await searchFile(dir, filenameOnly, options);
        
        if (!actualFilePath || actualFilePath === '') {
            actualFilePath = sourceFile;
        }
        
        // Normalize the path for comparison
        const normalizedPath = normalizePathForDisplay(actualFilePath);
        core.info(`🔍 Actual file path: ${actualFilePath}`);
        core.info(`🔍 Normalized path: ${normalizedPath}`);
        
        // Find the corresponding file in PR changes
        const changedFile = prChanges.find(file => {
            const isExactMatch = file.filename === normalizedPath;
            const isEndsWithMatch = file.filename.endsWith(normalizedPath);
            const isSourceEndsWithMatch = normalizedPath.endsWith(file.filename);
            
            if (isExactMatch || isEndsWithMatch || isSourceEndsWithMatch) {
                core.info(`✅ Found matching file: ${file.filename} (exact: ${isExactMatch}, endsWith: ${isEndsWithMatch}, sourceEndsWith: ${isSourceEndsWithMatch})`);
                return true;
            }
            return false;
        });
        
        if (changedFile) {
            const findingLine = finding.files?.source_file?.line;
            core.info(`🔍 Finding line: ${findingLine}, Changed lines: ${changedFile.changedLines.slice(0, 10).join(', ')}${changedFile.changedLines.length > 10 ? '...' : ''}`);
            
            if (findingLine && changedFile.changedLines.includes(findingLine)) {
                core.info(`✅ Match found: ${sourceFile}:${findingLine}`);
                matches.push({
                    finding,
                    changedFile,
                    line: findingLine
                });
            } else {
                core.info(`❌ No line match: finding line ${findingLine} not in changed lines`);
            }
        } else {
            core.info(`❌ No file match for: ${sourceFile} (normalized: ${normalizedPath})`);
            // Log all changed files for debugging
            core.info(`📁 Changed files: ${prChanges.map(f => f.filename).join(', ')}`);
        }
    }
    
    core.info(`🎯 Total matches found: ${matches.length}`);
    return matches;
}

/**
 * Create inline code review comments for findings on changed lines
 */
async function createInlineComments(
    token: string,
    owner: string,
    repo: string,
    prNumber: number,
    matches: any[]
): Promise<void> {
    const octokit = github.getOctokit(token);
    
    // First, get the PR details to get the commit SHA
    const { data: pr } = await octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: prNumber
    });
    
    const commitSha = pr.head.sha;
    core.info(`📝 Using commit SHA: ${commitSha}`);
    
    for (const match of matches) {
        const { finding, line } = match;
        
        try {
            // Create a review comment on the specific line
            const commentBody = `## 🟡 Veracode Security Finding

**CWE:** ${finding.cwe_id || finding.cwe || 'Unknown'}
**Severity:** ${finding.severity || 'Medium'}
**Description:** ${finding.issue_type || finding.description || 'Security vulnerability detected'}

### 🔧 Fix Suggestion Available
A fix suggestion is available for this finding.

**To apply the fix, reply with:**
\`/veracode apply-fix ${finding.issue_id || finding.id || finding.flaw_id}\`

*Powered by [Veracode](https://www.veracode.com/)*`;

            // Use the correct API parameters for creating review comments
            await octokit.rest.pulls.createReviewComment({
                owner,
                repo,
                pull_number: prNumber,
                body: commentBody,
                commit_id: commitSha,
                path: match.changedFile.filename,
                line: line,
                side: 'RIGHT' // Comment on the new version of the code
            });
            
            core.info(`✅ Inline comment created for finding on line ${line} in ${match.changedFile.filename}`);
        } catch (error) {
            core.error(`Failed to create inline comment for line ${line}: ${error}`);
            
            // Try alternative approach - create a general review comment
            try {
                core.info(`🔄 Trying alternative approach for line ${line}...`);
                await octokit.rest.pulls.createReview({
                    owner,
                    repo,
                    pull_number: prNumber,
                    body: `## 🟡 Veracode Security Finding on ${match.changedFile.filename}:${line}

**CWE:** ${finding.cwe_id || finding.cwe || 'Unknown'}
**Severity:** ${finding.severity || 'Medium'}
**Description:** ${finding.issue_type || finding.description || 'Security vulnerability detected'}

### 🔧 Fix Suggestion Available
A fix suggestion is available for this finding.

**To apply the fix, reply with:**
\`/veracode apply-fix ${finding.issue_id || finding.id || finding.flaw_id}\`

*Powered by [Veracode](https://www.veracode.com/)*`,
                    event: 'COMMENT'
                });
                core.info(`✅ Alternative review comment created for line ${line}`);
            } catch (altError) {
                core.error(`Alternative approach also failed for line ${line}: ${altError}`);
            }
        }
    }
}

export async function createVeracodeAppComment(
    token: string,
    owner: string,
    repo: string,
    issueNumber: number,
    findingsCount: number,
    fixSuggestionsCount: number,
    resultsFile?: string,
    options?: any
): Promise<void> {
    try {
        const octokit = github.getOctokit(token);
        
        // Get PR changes
        const prChanges = await getPRChanges(token, owner, repo, issueNumber);
        core.info(`📁 Found ${prChanges.length} changed files in PR`);
        
        let findings: any[] = [];
        let inlineMatches: any[] = [];
        
        // If we have a results file, analyze findings
        if (resultsFile && fs.existsSync(resultsFile)) {
            const resultsData = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
            findings = resultsData.findings || [];
            
            core.info(`📊 Loaded ${findings.length} findings from results file`);
            if (findings.length > 0) {
                core.info(`📄 Sample finding: ${JSON.stringify(findings[0], null, 2)}`);
            }
            
            // Match findings to changed code
            inlineMatches = await matchFindingsToChanges(findings, prChanges, options || {});
            core.info(`🔍 Found ${inlineMatches.length} findings on changed code lines`);
            
            // Create inline comments for findings on changed lines
            if (inlineMatches.length > 0) {
                await createInlineComments(token, owner, repo, issueNumber, inlineMatches);
            }
        } else {
            core.info(`⚠️  No results file provided or file doesn't exist: ${resultsFile}`);
        }
        
        // Create summary comment
        const hasInlineComments = inlineMatches.length > 0;
        const commentBody = `## 🟡 Veracode Security Analysis

<div align="center">
  <img src="https://raw.githubusercontent.com/veracode/veracode.github.io/refs/heads/master/assets/images/veracode-black-hires.svg" alt="Veracode" width="200"/>
</div>

### ⚠️ Security Findings Detected
| Metric | Count |
|--------|-------|
| **Total Findings** | **${findingsCount}** |
| **Fix Suggestions Available** | **${fixSuggestionsCount}** |
| **Findings on Changed Code** | **${inlineMatches.length}** |
| **Severity Level** | **MEDIUM** |

---

### 🔧 Available Commands
| Command | Description |
|---------|-------------|
| \`/veracode show-all\` | Show all flaws with fix suggestions |
| \`/veracode fix-all\` | Apply all available fixes |
| \`/veracode filter-cwe CWE-117,CWE-89\` | Filter by specific CWE numbers |
| \`/veracode filter-commit\` | Show only flaws in changed files |
| \`/veracode apply-fix fix1,fix2\` | Apply specific fixes |

---

${hasInlineComments ? 
    `### 📝 Inline Comments Created
I've created inline comments for **${inlineMatches.length}** findings that affect code changed in this PR. You can reply to those comments to apply fixes.

**For all other findings, use the commands above to explore and apply fixes.**` :
    `### 📝 No Inline Comments
No findings were detected on the code changed in this PR. Use the commands above to explore and apply fixes for all findings.`
}

---

*Powered by [Veracode](https://www.veracode.com/)*`;

        const { data: comment } = await octokit.rest.issues.createComment({
            owner,
            repo,
            issue_number: issueNumber,
            body: commentBody,
        });
        
        core.info(`✅ Veracode app comment posted to PR #${issueNumber}`);
        core.info(`🔗 Comment URL: ${comment.html_url}`);
        if (hasInlineComments) {
            core.info(`📝 Created ${inlineMatches.length} inline comments on changed code`);
        }
    } catch (error) {
        core.error(`❌ Failed to post Veracode app comment: ${error}`);
        throw error;
    }
}
