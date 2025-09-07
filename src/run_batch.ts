import fs from 'fs';
import { createFlawInfo } from './createFlawInfo';
import { checkCWE } from './check_cwe_support';
import tarModule from 'tar';
import { uploadBatch, checkFixBatch, pullBatchFixResults, getFilesPartOfPR } from './requests'
import { createPRCommentBatch } from './create_pr_comment'
import { execSync }  from 'child_process';
import { createCheckRun, updateCheckRunClose, updateCheckRunUpdateBatch } from './checkRun';
import { rewritePath } from './rewritePath'
import { createPR } from './create_pr'
import { detectLanguageFromFile, isLanguageSupported } from './languageDetection';

import { isVeracodeAppInstalled, createVeracodeAppComment } from './pr_comment_handler'
import * as github from '@actions/github'

import { sourcecodeFolderName } from './constants';
import {tempFolder} from './constants'
export async function runBatch( options:any, credentials:any){

    //read json file
    const jsonRead = fs.readFileSync(options.file, 'utf8')
    const jsonData = JSON.parse(jsonRead);
    const jsonFindings = jsonData.findings
    const flawCount = jsonFindings.length
    console.log('Number of flaws: '+flawCount)

    let filesPartOfPR:any = {}
    if (process.env.GITHUB_EVENT_NAME == 'pull_request'){
        filesPartOfPR = await getFilesPartOfPR(options)
        if (options.DEBUG == 'true'){
            console.log('#######- DEBUG MODE -#######')
            console.log('run_batch.ts - runBatch()')
            console.log('Files part of PR:')
            console.log(filesPartOfPR)
            console.log('#######- DEBUG MODE -#######')
        }
        
        
    }

    //loop through json file and create a new array
    let i = 0
    let flawArray:any = {}
    for (i = 0; i < flawCount; i++) {

        //create a new array per source file
        let sourceFile = jsonFindings[i].files.source_file.file;

        if (!flawArray[sourceFile]) {
            flawArray[sourceFile] = [];
        }
        flawArray[sourceFile].push(jsonFindings[i]);
    }

    //loop through the new array per source file and find fixable flaws, supported CWE's and CWE's to be fixed
    let sourceFiles = Object.keys(flawArray);
    const sourceFilesCount = sourceFiles.length
    console.log('Number of source files with flaws: '+sourceFilesCount)
    for (let i = 0; i < sourceFilesCount; i++) {

        console.log('#############################\n\n')

        let sourceFile = sourceFiles[i];
        console.log('Source file with flaws:', sourceFile);

        let j = 0
        let flawCount = flawArray[sourceFile].length
        console.log('Number of flaws for '+sourceFile+': '+flawCount)

        for (j = 0; j < flawCount; j++) {

            // Auto-detect language from source file
            const detectedLanguage = detectLanguageFromFile(sourceFile);
            
            if (!isLanguageSupported(detectedLanguage)) {
                console.log(`Skipping issue ${flawArray[sourceFile][j].issue_id}: Language '${detectedLanguage}' is not supported for file ${sourceFile}`);
                continue;
            }

            const initialFlawInfo = {
                resultsFile: options.file,
                issuedID: flawArray[sourceFile][j].issue_id,
                cweID: parseInt(flawArray[sourceFile][j].cwe_id),
                language: detectedLanguage,
                sourceFile: sourceFile,
            }
            if (options.DEBUG == 'true'){
                console.log('#######- DEBUG MODE -#######')
                console.log('Detected Language: ' + detectedLanguage)
                console.log('initialFlawInfo',initialFlawInfo)
                console.log('#######- DEBUG MODE -#######')
            }

            let include = 0
            if ( options.files == 'changed' ){
                console.log('Checking if file is part of PR')
                //sourceFile needs rewrite before checking if its part of the PR

                const filepath = await rewritePath(options, sourceFile)

                if (process.env.GITHUB_EVENT_NAME == 'pull_request'){
                    for (let key in filesPartOfPR) {
                        if (filesPartOfPR[key].filename === filepath) {
                            include = 1
                            //console.log('File is part of PR')
                            break;
                        }
                    }
                }
                else {
                    console.log('Not a PR, all files should be fixed')
                    include = 1
                }
            }

            if ( include == 0 && options.files == 'changed' ){
                console.log('File is not part of PR, and only changed files should be fixed. -> Parameter "files" is set to "changed"')
            }
            else {
                console.log('File is part of PR, either all files should be fixed or this file is part of changed files to be fixed')

                if (options.cwe != '') {

                    console.log('Fix only for CWE: '+options.cwe)

                    //get CWE list input
                    let cweList = [];
                    if (options.cwe.includes(',')) {
                        cweList = options.cwe.split(',');
                    } else {
                        cweList = [options.cwe];
                    }

                    if (cweList.includes(flawArray[sourceFile][j].cwe_id)) {
                        console.log('CWE '+flawArray[sourceFile][j].cwe_id+' is in the list of CWEs to fix, creating flaw info')
                        
                        if (await checkCWE(initialFlawInfo, options, true) == true){
                            const flawInfo = await createFlawInfo(initialFlawInfo,options)

                            if (options.DEBUG == 'true'){
                                console.log('#######- DEBUG MODE -#######')
                                console.log('run_batch.ts - runBatch()')
                                console.log('Flaw Info:',flawInfo)
                                console.log('#######- DEBUG MODE -#######')
                            }

                            //write flaw info and source file
                            const flawFoldername = 'cwe-'+flawInfo.CWEId+'-line-'+flawInfo.line+'-issue-'+flawInfo.issueId
                            const flawFilenane = 'flaw_'+flawInfo.issueId+'.json'
                            console.log(`Writing flaw to: ${tempFolder + sourcecodeFolderName}`+flawFoldername+'/'+flawFilenane)
                            fs.mkdirSync(tempFolder + sourcecodeFolderName + 'flaws/'+flawFoldername, { recursive: true });
                            fs.writeFileSync(tempFolder + sourcecodeFolderName + '/flaws/'+flawFoldername+'/'+flawFilenane, JSON.stringify(flawInfo, null, 2))

                            if (fs.existsSync(tempFolder + sourcecodeFolderName + flawInfo.sourceFile)) {
                                console.log('File exists nothing to do');
                            } else {
                                console.log('File does not exist, copying file');
                                let str = flawInfo.sourceFile;
                                let lastSlashIndex = str.lastIndexOf('/');
                                let strBeforeLastSlash = str.substring(0, lastSlashIndex);
                                if (!fs.existsSync(tempFolder + sourcecodeFolderName + strBeforeLastSlash)) {
                                    console.log('Destination directory does not exist lest create it');
                                    fs.mkdirSync(tempFolder + sourcecodeFolderName + strBeforeLastSlash, { recursive: true });
                                }

                                // Use sourceFileFull for file operations
                                const fullPath = flawInfo.sourceFileFull || flawInfo.sourceFile;
                                fs.copyFileSync(fullPath, tempFolder + sourcecodeFolderName + flawInfo.sourceFile);
                            }
                        }
                        else {
                            console.log('CWE '+flawArray[sourceFile][j].cwe_id+' is not supported for '+detectedLanguage)
                        }
                    }
                    else {
                        console.log('CWE '+flawArray[sourceFile][j].cwe_id+' is not in the list of CWEs to fix')
                    }
                }
                else {
                    console.log('Fix for all CWEs')

                    if (await checkCWE(initialFlawInfo, options, true) == true){
                        const flawInfo = await createFlawInfo(initialFlawInfo,options)
                        
                        //write flaw info and source file
                        const flawFoldername = 'cwe-'+flawInfo.CWEId+'-line-'+flawInfo.line+'-issue-'+flawInfo.issueId
                        const flawFilenane = 'flaw_'+flawInfo.issueId+'.json'
                        console.log(`Writing flaw to: ${tempFolder + sourcecodeFolderName}`+flawFoldername+'/'+flawFilenane)
                        fs.mkdirSync(tempFolder + sourcecodeFolderName+'flaws/'+flawFoldername, { recursive: true });
                        fs.writeFileSync(tempFolder + sourcecodeFolderName+'flaws/'+flawFoldername+'/'+flawFilenane, JSON.stringify(flawInfo, null, 2))

                        if (fs.existsSync(tempFolder + sourcecodeFolderName+flawInfo.sourceFile)) {
                            console.log('File exists nothing to do');
                        } else {
                            console.log('File does not exist, copying file');
                            let str = flawInfo.sourceFile;
                            let lastSlashIndex = str.lastIndexOf('/');
                            let strBeforeLastSlash = str.substring(0, lastSlashIndex);
                            if (!fs.existsSync(tempFolder + sourcecodeFolderName+strBeforeLastSlash)) {
                                console.log('Destination directory does not exist lest create it');
                                fs.mkdirSync(tempFolder + sourcecodeFolderName+strBeforeLastSlash, { recursive: true });
                            }

                            // Use sourceFileFull for file operations
                            const fullPath = flawInfo.sourceFileFull || flawInfo.sourceFile;
                            fs.copyFileSync(fullPath, tempFolder + sourcecodeFolderName+flawInfo.sourceFile)
                        }

                    }
                    else {
                        console.log('CWE '+flawArray[sourceFile][j].cwe_id+' is not supported for '+detectedLanguage)
                    }
                }
            }
        }
    };

    if (!fs.existsSync(tempFolder + sourcecodeFolderName)) { // nothing to fix as no files with conditions met
        console.log("nothing to fix as no files with conditions met");
        process.exit(0);
    }

    //create the tar after all files are created and copied
    // the tr for the batch run has to be crearted with the local tar. The node moldule is not working
    const tarball = execSync(`tar -czf ${tempFolder}app.tar.gz -C ${tempFolder + sourcecodeFolderName} .`);
    console.log('Tar is created');

    const projectID = await uploadBatch(credentials, (tempFolder+'app.tar.gz'), options)
    console.log('Project ID is: '+projectID)

    const checkBatchFixStatus = await checkFixBatch(credentials, projectID, options)

    if ( checkBatchFixStatus == 1 ){
        console.log('Batch Fixs are ready to be reviewed')
        const batchFixResults = await pullBatchFixResults(credentials, projectID, options)
        
        
        filterEmptyPatchesFromBatch(batchFixResults, options);
        if ( batchFixResults == 0 ){
            console.log('Something went wrong, no fixes generated')
        }
        else {
            console.log('Fixs pulled from batch fix')

            if (options.DEBUG == 'true'){
                console.log('#######- DEBUG MODE -#######')
                console.log('run_batch.ts - runBatch()')
                console.log('Batch Fix Results:')
                console.log(batchFixResults)
                console.log('#######- DEBUG MODE -#######')
            }

            // Check if we should use GitHub App mode (declare at broader scope)
            let shouldUseGitHubApp = false
            let owner: string | undefined
            let repo: string | undefined
            let prNumber: number | undefined
            let token: string | undefined
            
            if (process.env.GITHUB_EVENT_NAME == 'pull_request') {
                const useGitHubApp = options.useGitHubApp || 'auto'
                const context = github.context
                const repository = process.env.GITHUB_REPOSITORY?.split('/') || []
                owner = repository[0]
                repo = repository[1]
                prNumber = context.payload.pull_request?.number
                token = options.token
                
                if (useGitHubApp === 'true') {
                    // Force GitHub App mode
                    console.log('GitHub App mode enabled')
                    shouldUseGitHubApp = true
                } else if (useGitHubApp === 'auto') {
                    // Auto-detect GitHub App
                    console.log('Auto-detecting Veracode GitHub App...')
                    try {
                        if (owner && repo && prNumber && token) {
                            const appInstalled = await isVeracodeAppInstalled(token, owner, repo)
                            if (appInstalled) {
                                console.log('✅ Veracode GitHub App is installed')
                                shouldUseGitHubApp = true
                            } else {
                                console.log('❌ Veracode GitHub App is not installed')
                            }
                        }
                    } catch (error) {
                        console.log('Error checking GitHub App:', error)
                    }
                }
            }

            //working with results
            if (options.prComment == 'true'){
                console.log('PR commenting is enabled')

                if (process.env.GITHUB_EVENT_NAME == 'pull_request'){
                    console.log('This is a PR - using GitHub App mode check from above')
                    
                    if (shouldUseGitHubApp) {
                        // Use GitHub App mode - create app comment with fix suggestions
                        console.log('Creating GitHub App comment with fix suggestions...')
                        try {
                            // Calculate actual fix suggestions count from batch results
                            let totalFixSuggestions = 0;
                            if (batchFixResults.results) {
                                Object.values(batchFixResults.results).forEach((fileResult: any) => {
                                    if (fileResult.flaws) {
                                        fileResult.flaws.forEach((flaw: any) => {
                                            if (flaw.patches && flaw.patches.length > 0) {
                                                totalFixSuggestions++;
                                            }
                                        });
                                    }
                                });
                            }
                            
                            if (owner && repo && prNumber && token) {
                                await createVeracodeAppComment(token, owner, repo, prNumber, jsonFindings.length, totalFixSuggestions, options.file, options, batchFixResults)
                            } else {
                                console.log('Missing required parameters for GitHub App comment')
                                createPRCommentBatch(batchFixResults, options, flawArray)
                            }
                            console.log('✅ Veracode app comment posted successfully')
                        } catch (error) {
                            console.log('Error posting GitHub App comment, falling back to traditional PR comments:', error)
                            createPRCommentBatch(batchFixResults, options, flawArray)
                        }
                    } else {
                        // Use traditional PR comments
                        console.log('Using traditional PR comments')
                        createPRCommentBatch(batchFixResults, options, flawArray)
                    }
                    
                    console.log('This is a PR - create a check annotations')
                    //create a check run
                    let checkRunID = await createCheckRun(options)
                    options['checkRunID'] = checkRunID
                    console.log('Check Run ID is: '+checkRunID)
                    const checkRunUpate = await updateCheckRunUpdateBatch(options, batchFixResults, flawArray)
                    const checkRun = await updateCheckRunClose(options, options.checkRunID)
                }
                else {
                    console.log('... but wea are not running on a pull request')
                }
            }

            if ( options.codeSuggestion == 'true' ){
                console.log('Code suggestion is enabled')

                const batchFixResultsCount = Object.keys(batchFixResults.results).length;

                console.log('Number of files with fixes: '+batchFixResultsCount)
                let commentBody:any
                for (let i = 0; i < batchFixResultsCount; i++) {
                    let keys = Object.keys(batchFixResults.results);
                    console.log('Creating suggestions for '+keys[i])

                    //const codeSuggestion = addCodeSuggestion(batchFixResults, keys[i], options)
                }
            }

            // Skip PR creation when using GitHub App mode
            if ( options.createPR == 'true' && !shouldUseGitHubApp ){
                console.log('Creating PRs is enabled')
                const createPr = await createPR(batchFixResults, options, flawArray)
            } else if (options.createPR == 'true' && shouldUseGitHubApp) {
                console.log('Skipping PR creation - using GitHub App mode')
            }

        }
    }
    else {
        console.log('Batch Fix failed')

    }
    function filterEmptyPatchesFromBatch(batchFixResults: any, options: any): void {
        for (let key in batchFixResults.results) {
            let patch = batchFixResults.results[key].patch;
            if (patch.length == 0) {
                if (options.DEBUG == 'true') {
                    console.log('#######- DEBUG MODE -#######');
                    console.log('Removing files with empty patch from batchfix results');
                    console.log('#######- DEBUG MODE -#######');
                }
                delete batchFixResults.results[key];
            }
        }
    }

}