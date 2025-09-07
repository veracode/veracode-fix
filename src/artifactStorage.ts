import * as core from '@actions/core'
import fs from 'fs'
import path from 'path'

/**
 * Save findings data as artifact for debugging
 */
export async function saveFindingsArtifact(
    findings: any[], 
    prChanges?: any[], 
    matches?: any[],
    additionalData?: any
): Promise<void> {
    try {
        const artifactData = {
            timestamp: new Date().toISOString(),
            totalFindings: findings.length,
            prChanges: prChanges || [],
            matches: matches || [],
            additionalData: additionalData || {},
            findings: findings.map(finding => ({
                issue_id: finding.issue_id,
                cwe_id: finding.cwe_id,
                severity: finding.severity,
                issue_type: finding.issue_type,
                availableFields: Object.keys(finding),
                sourceFile: finding.files?.source_file,
                fixResults: finding.fix_results,
                fixSuggestions: finding.fix_suggestions,
                recommendations: finding.recommendations,
                // Include the full finding for detailed analysis
                fullFinding: finding
            }))
        };

        const artifactPath = path.join(process.cwd(), 'veracode-findings-debug.json');
        fs.writeFileSync(artifactPath, JSON.stringify(artifactData, null, 2));
        
        core.info(`📁 Saved findings debug data to: ${artifactPath}`);
        core.info(`📊 Artifact contains ${findings.length} findings and ${matches?.length || 0} matches`);
        
        // Also save individual findings for easier analysis
        findings.forEach((finding, index) => {
            const findingPath = path.join(process.cwd(), `finding-${finding.issue_id || index}.json`);
            fs.writeFileSync(findingPath, JSON.stringify(finding, null, 2));
        });
        
        core.info(`📁 Saved ${findings.length} individual finding files for detailed analysis`);
        
        // Set output for GitHub Actions to upload artifacts
        core.setOutput('artifact-path', artifactPath);
        core.setOutput('artifact-created', 'true');
        
    } catch (error) {
        core.error(`Failed to save findings artifact: ${error}`);
    }
}

/**
 * Save fix results as artifact for debugging
 */
export async function saveFixResultsArtifact(
    fixResults: any[],
    sourceFile?: string,
    additionalData?: any
): Promise<void> {
    try {
        const artifactData = {
            timestamp: new Date().toISOString(),
            sourceFile: sourceFile,
            totalFixResults: fixResults.length,
            additionalData: additionalData || {},
            fixResults: fixResults
        };

        const artifactPath = path.join(process.cwd(), 'veracode-fix-results-debug.json');
        fs.writeFileSync(artifactPath, JSON.stringify(artifactData, null, 2));
        
        core.info(`📁 Saved fix results debug data to: ${artifactPath}`);
        core.info(`📊 Artifact contains ${fixResults.length} fix results`);
        
        // Set output for GitHub Actions to upload artifacts
        core.setOutput('fix-results-artifact-path', artifactPath);
        core.setOutput('fix-results-artifact-created', 'true');
        
    } catch (error) {
        core.error(`Failed to save fix results artifact: ${error}`);
    }
}
