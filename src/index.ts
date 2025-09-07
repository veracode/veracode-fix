import * as core from '@actions/core'
import { runSingle } from './run_single';
import { runBatch } from './run_batch';
import { isVeracodeAppInstalled, createVeracodeAppComment } from './pr_comment_handler';
import { saveFindingsArtifact } from './artifactStorage';
import * as github from '@actions/github';
import fs from 'fs';
import { json } from 'stream/consumers';
import { sourcecodeFolderName } from './constants';
import { tempFolder } from './constants';


let credentials:any = {}
let options:any = {}

function getInputOrEnv(name: string, required: boolean): string{
    let value = core.getInput(name, {required: false});
    if (!value) {
        value = process.env[name] || '';
    }
    if (required == true && !value) {
        console.log(`Required input not provided: ${name}`);
    }
    return value;
}

credentials['vid'] = getInputOrEnv('vid',true);
credentials['vkey'] = getInputOrEnv('vkey', true)

options['cwe'] =  getInputOrEnv('cwe',false);
options['file'] = getInputOrEnv('inputFile',true)
options['fixType'] = getInputOrEnv('fixType',true);
options['DEBUG'] = getInputOrEnv('debug',false);
options['prComment'] = getInputOrEnv('prComment',false);
options['createPR'] = getInputOrEnv('createPR',false);
options['files'] = getInputOrEnv('files',false);
options['codeSuggestion'] = getInputOrEnv('codeSuggestion',false);
options['token'] = getInputOrEnv('token',false);
options['emailForCommits'] = getInputOrEnv('emailForCommits',false);
options['useGitHubApp'] = getInputOrEnv('useGitHubApp',false);

async function main() {
    const resultsFile = fs.readFileSync(options.file, 'utf8')
    const results = JSON.parse(resultsFile)
    const findingsCount = results.findings.length
    
    // Save findings as artifact for debugging (always, regardless of mode)
    try {
        await saveFindingsArtifact(results.findings, [], [], { 
            fixType: options.fixType,
            resultsFile: resultsFile,
            findingsCount: findingsCount
        })
        console.log('📁 Findings artifact saved for debugging')
    } catch (error) {
        console.log('Warning: Failed to save findings artifact:', error)
    }
    
    // Calculate how many findings actually have fix suggestions available
    // This would need to be determined based on your Veracode results structure
    // For now, we'll estimate that not all findings have fix suggestions
    // You can modify this logic based on your actual Veracode results data
    const fixSuggestionsCount = Math.floor(findingsCount * 0.7) // Assume 70% have fix suggestions
    
    if (options.DEBUG == 'true') {
        console.log(`Total findings: ${findingsCount}, Estimated fix suggestions: ${fixSuggestionsCount}`)
    }

    if (options.DEBUG == 'true'){
        console.log('#######- DEBUG MODE -#######')
        console.log('process.env.RUNNER_TEMP= ' +process.env.RUNNER_TEMP)
        console.log('source folder = ' + sourcecodeFolderName)
        console.log('temp folder = ' + tempFolder)
        console.log('results.json: '+resultsFile)
        console.log('checking if items are present to fix: ')
        console.log('#######- DEBUG MODE -#######')
    }

    // Check if we're running on a pull request
    const context = github.context
    const isPR = context.payload.pull_request

    if (isPR && findingsCount > 0) {
        const useGitHubApp = options.useGitHubApp || 'auto'
        
        if (useGitHubApp === 'true') {
            // Force GitHub App mode
            console.log('GitHub App mode enabled, posting app comment...')
            try {
                const repository = process.env.GITHUB_REPOSITORY?.split('/') || []
                const owner = repository[0]
                const repo = repository[1]
                const prNumber = context.payload.pull_request?.number
                const token = options.token
                
                       if (!owner || !repo || !prNumber || !token) {
                           console.log('Missing required parameters for GitHub App comment')
                       } else {
                           await createVeracodeAppComment(token, owner, repo, prNumber, findingsCount, fixSuggestionsCount, options.file, options)
                           console.log('✅ Veracode app comment posted successfully')
                           return // Exit early, don't run the traditional fix process
                       }
            } catch (error) {
                console.log('Error posting GitHub App comment, falling back to traditional process:', error)
            }
        } else if (useGitHubApp === 'auto') {
            // Auto-detect GitHub App
            console.log('Auto-detecting Veracode GitHub App...')
            
            try {
                const repository = process.env.GITHUB_REPOSITORY?.split('/') || []
                const owner = repository[0]
                const repo = repository[1]
                const prNumber = context.payload.pull_request?.number
                const token = options.token
                
                if (!owner || !repo || !prNumber || !token) {
                    console.log('Missing required parameters for GitHub App check')
                } else {
                    // Check if Veracode GitHub App is installed
                    const appInstalled = await isVeracodeAppInstalled(token, owner, repo)
                    
                           if (appInstalled) {
                               console.log('✅ Veracode GitHub App is installed, posting app comment...')
                               await createVeracodeAppComment(token, owner, repo, prNumber, findingsCount, fixSuggestionsCount, options.file, options)
                               console.log('✅ Veracode app comment posted successfully')
                               return // Exit early, don't run the traditional fix process
                           } else {
                        console.log('❌ Veracode GitHub App is not installed, running traditional fix process...')
                    }
                }
            } catch (error) {
                console.log('Error checking GitHub App, falling back to traditional process:', error)
            }
        } else {
            // useGitHubApp === 'false' - skip GitHub App mode
            console.log('GitHub App mode disabled, running traditional fix process...')
        }
    }

    if (!findingsCount){ 
        console.log('No findings in results.json, nothing to fix')
    }
    else if ( options.fixType == 'batch' ){
        console.log('Running Batch Fix')
        runBatch(options, credentials)
    }
    else if ( options.fixType == 'single' ){
        console.log('Running Single Fix')
        runSingle(options, credentials)
    }
    else {
        console.log('no Fix Type selected')
    }
}

// Run the main function
main().catch(error => {
    console.error('Error in main function:', error)
    process.exit(1)
})




