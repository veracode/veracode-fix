import * as core from '@actions/core'
import artifact from '@actions/artifact'
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
        
        // Upload as GitHub Actions artifact
        try {
            const artifactClient = artifact;
            const artifactName = 'veracode-findings-debug';
            const rootDirectory = process.cwd();
            const filesToUpload = [
                'veracode-findings-debug.json',
                ...findings.map((_, index) => `finding-${findings[index].issue_id || index}.json`)
            ];
            
            const uploadResult = await artifactClient.uploadArtifact(
                artifactName,
                filesToUpload,
                rootDirectory,
                {
                    retentionDays: 30,
                    compressionLevel: 6
                }
            );
            
            core.info(`📦 Uploaded findings artifact: ${artifactName}`);
            core.setOutput('findings-artifact-name', artifactName);
            core.setOutput('findings-artifact-uploaded', 'true');
        } catch (uploadError) {
            core.warning(`Failed to upload findings artifact: ${uploadError}`);
            core.setOutput('findings-artifact-uploaded', 'false');
        }
        
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
        
        // Upload as GitHub Actions artifact
        try {
            const artifactClient = artifact;
            const artifactName = 'veracode-fix-results-debug';
            const rootDirectory = process.cwd();
            const filesToUpload = ['veracode-fix-results-debug.json'];
            
            const uploadResult = await artifactClient.uploadArtifact(
                artifactName,
                filesToUpload,
                rootDirectory,
                {
                    retentionDays: 30,
                    compressionLevel: 6
                }
            );
            
            core.info(`📦 Uploaded fix results artifact: ${artifactName}`);
            core.setOutput('fix-results-artifact-name', artifactName);
            core.setOutput('fix-results-artifact-uploaded', 'true');
        } catch (uploadError) {
            core.warning(`Failed to upload fix results artifact: ${uploadError}`);
            core.setOutput('fix-results-artifact-uploaded', 'false');
        }
        
    } catch (error) {
        core.error(`Failed to save fix results artifact: ${error}`);
    }
}
