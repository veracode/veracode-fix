import { upload, checkFix } from './requests'
import { createFlawInfo } from './createFlawInfo';
import fs from 'fs';
import tarModule from 'tar';
import { checkCWE } from './check_cwe_support';
import { createPRComment } from './create_pr_comment';
import { selectPlatfrom } from './select_platform';
import { createCheckRun, updateCheckRunClose, updateCheckRunUpdate } from './checkRun';
import { getFilesPartOfPR } from './requests';
import { rewritePath } from './rewritePath'
import { createCodeSuggestion } from './create_code_suggestion';
import { detectLanguageFromFile, isLanguageSupported } from './languageDetection';

export async function runSingle(options: any, credentials: any) {

    //read json file
    const jsonRead = fs.readFileSync(options.file, 'utf8')
    const jsonData = JSON.parse(jsonRead);
    const jsonFindings = jsonData.findings
    const flawCount = jsonFindings.length
    console.log('Number of flaws: '+flawCount)

    const filesPartOfPR = await getFilesPartOfPR(options)

    //if prComment is true and we run on a PR we need to create a check run
    let checkRunID:any = ''
    if (options.prComment == 'true' && (options.codeSuggestion == 'false' || options.codeSuggestion == '')){
        console.log('PR commenting is enabled')
        if (process.env.GITHUB_EVENT_NAME == 'pull_request'){
            console.log('This is a PR - create a check run')
            //create a check run
            let checkRunID = await createCheckRun(options)
            options['checkRunID'] = checkRunID
            console.log('Check Run ID is: '+checkRunID)
        }
    }



    //loop through json file
    let i = 0
    for (i = 0; i < flawCount; i++) {

        // Auto-detect language from source file
        const detectedLanguage = detectLanguageFromFile(jsonFindings[i].files.source_file.file);
        
        if (!isLanguageSupported(detectedLanguage)) {
            console.log(`Skipping issue ${jsonFindings[i].issue_id}: Language '${detectedLanguage}' is not supported for file ${jsonFindings[i].files.source_file.file}`);
            continue;
        }

        const initialFlawInfo = {
            resultsFile: options.file,
            issuedID: jsonFindings[i].issue_id,
            cweID: parseInt(jsonFindings[i].cwe_id),
            language: detectedLanguage,
            sourceFile: jsonFindings[i].files.source_file.file,
        }

        if (options.DEBUG == 'true'){
            console.log('#######- DEBUG MODE -#######')
            console.log('run_single.ts - runSingle()')
            console.log('Detected Language: ' + detectedLanguage)
            console.log('Initial Flaw Info')
            console.log(initialFlawInfo)
            console.log('#######- DEBUG MODE -#######')
        }
        
        console.log('#############################\n\n')

        let include = 0
        if ( options.files == 'changed' ){
            console.log('Checking if file is part of PR')
            //sourceFile needs rewrite before checking if its part of the PR

            const filepath = await rewritePath(options, initialFlawInfo.sourceFile)

            for (let key in filesPartOfPR) {
                if (filesPartOfPR[key].filename === filepath) {
                    include = 1
                    //console.log('File is part of PR')
                    break;
                }
            }
        }

        if ( include == 0 && options.files == 'changed' ){
            console.log('File is not part of PR, and only changed files should be fixed. -> Parameter "files" is set to "changed"')
        }
        else {
            console.log('File is part of PR, either all files should be fixed or this file is part of changed files to be fixed')


            if ( options.cwe != '' ){
                console.log('Only run Fix for CWE: '+options.cwe)
                let cweList = [];
                if (options.cwe.includes(',')) {
                    cweList = options.cwe.split(',');
                } else {
                    cweList = [options.cwe];
                }
                const cweListLength = cweList.length
                let j = 0
                for (j = 0; j < cweListLength; j++) {
                    if (parseInt(cweList[j]) == initialFlawInfo.cweID){
                        if (await checkCWE(initialFlawInfo, options) == true){

                            const choosePlatform = await selectPlatfrom(credentials)
                            const tar = await createTar(initialFlawInfo,options)
                            const uploadTar = await upload(choosePlatform, tar, options)
                            const checkFixResults = await checkFix(choosePlatform, uploadTar, options)

                            if (options.prComment == 'true' && (options.codeSuggestion == 'false' || options.codeSuggestion == '')){
                                console.log('PR commenting is enabled')
                                const prComment = await createPRComment(checkFixResults, options, initialFlawInfo)
                                //need flawinfo again
                                const newFlawInfo = await createFlawInfo(initialFlawInfo,options)
                                console.log('Check Run ID is: '+options.checkRunID)
                                console.log('Update Check Run with PR Comment')
                                const checkRunUpate = await updateCheckRunUpdate(options, prComment, checkFixResults, newFlawInfo)
                            }
                            else if ( options.prComment == 'true' && options.codeSuggestion == 'true'){
                                console.log('PR commenting is enabled')
                                const prComment = await createPRComment(checkFixResults, options, initialFlawInfo)
                                console.log('Code Suggestions are enabled')
                                //need flawinfo again
                                const newFlawInfo = await createFlawInfo(initialFlawInfo,options)
                                const codeSuggestion = await createCodeSuggestion(options, checkFixResults, newFlawInfo)
                            }   
                        }
                        else {
                            console.log('CWE '+initialFlawInfo.cweID+' is not supported for '+detectedLanguage)
                        }
                    }
                    else {
                        console.log('CWE '+initialFlawInfo.cweID+' is not in the list of CWEs to fix')
                    }
                }
                
            }
            else {
                console.log('Run Fix for all CWEs')
                if (await checkCWE(initialFlawInfo, options) == true){
                    console.log('CWE '+initialFlawInfo.cweID+' is supported for '+detectedLanguage)
                    const choosePlatform = await selectPlatfrom(credentials)
                    const tar = await createTar(initialFlawInfo,options)
                    const uploadTar = await upload(choosePlatform, tar, options)
                    const checkFixResults = await checkFix(choosePlatform, uploadTar, options)

                    if (options.prComment == 'true' && (options.codeSuggestion == 'false' || options.codeSuggestion == '')){
                        console.log('PR commenting is enabled')
                        const prComment = await createPRComment(checkFixResults, options, initialFlawInfo)
                        //need flawinfo again
                        const newFlawInfo = await createFlawInfo(initialFlawInfo,options)
                        console.log('Check Run ID is: '+options.checkRunID)
                        console.log('Update Check Run with PR Comment')
                        const checkRunUpate = await updateCheckRunUpdate(options, prComment, checkFixResults, newFlawInfo)
                    }
                    else if ( options.prComment == 'true' && options.codeSuggestion == 'true'){
                        console.log('PR commenting is enabled')
                        const prComment = await createPRComment(checkFixResults, options, initialFlawInfo)
                        console.log('Code Suggestions are enabled')
                        //need flawinfo again
                        const newFlawInfo = await createFlawInfo(initialFlawInfo,options)
                        const codeSuggestion = await createCodeSuggestion(options, checkFixResults, newFlawInfo)
                    }
                }
                else {
                    console.log('CWE '+initialFlawInfo.cweID+' is NOT supported for '+detectedLanguage)
                }
            }
        }
        i++
    }

    //if prComment is true and we run on a PR we need to close the check run
    if (options.prComment == 'true' && (options.codeSuggestion == 'false' || options.codeSuggestion == '')){
        console.log('PR commenting is enabled')
        if (process.env.GITHUB_EVENT_NAME == 'pull_request'){
            console.log('This is a PR - check run should be closed')
            console.log('Check Run ID is: '+options.checkRunID)
            //create a check run
            const checkRun = await updateCheckRunClose(options, options.checkRunID)
        }
    }
    
}

async function createTar(initialFlawInfo:any, options:any){
    console.log('Creating tarball')
    const flawInfo = await createFlawInfo(initialFlawInfo,options)

    if (options.DEBUG == 'true'){
        console.log('#######- DEBUG MODE -#######')
        console.log('run_single.ts')
        console.log('flawInfo on run_single.ts:')
        console.log(JSON.stringify(flawInfo))
        console.log('#######- DEBUG MODE -#######')
    }
    
    // Use sourceFileFull for file operations, fallback to sourceFile for backward compatibility
    const filepath = flawInfo.sourceFileFull || flawInfo.sourceFile

    fs.accessSync(filepath, fs.constants.F_OK);

    if (options.DEBUG == 'true'){
        console.log('#######- DEBUG MODE -#######')
        console.log('run_single.ts')
        console.log('File '+filepath+' exists');
        console.log('#######- DEBUG MODE -#######')
    }
    
    fs.writeFileSync('flawInfo', JSON.stringify(flawInfo))

    try {
        const tarball = tarModule.create({ 
            gzip: true,
            file: 'data.tar.gz'
        }, ['flawInfo', filepath]);
        console.error('Tar is created');

        return tarball
    } catch (err) {
        // File does not exist
        console.error('Tar cannot be created');
    }
}