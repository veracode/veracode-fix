import { upload, checkFix } from './requests'
import { createFlawInfo } from './createFlawInfo';
import fs from 'fs';
import tarModule from 'tar';
import * as core from '@actions/core'
import { checkCWE } from './check_cwe_support';
import { createPRComment } from './create_pr_comment';
import { selectPlatfrom } from './select_platform';

export async function runSingle(options: any, credentials: any) {

    //read json file
    const jsonRead = fs.readFileSync(options.file, 'utf8')
    const jsonData = JSON.parse(jsonRead);
    const jsonFindings = jsonData.findings
    const flawCount = jsonFindings.length
    console.log('Number of flaws: '+flawCount)

    //loop through json file
    let i = 0
    for (i = 0; i < flawCount; i++) {

        const initialFlawInfo = {
            resultsFile: options.file,
            issuedID: jsonFindings[i].issue_id,
            cweID: parseInt(jsonFindings[i].cwe_id),
            language: options.language,
        }

        if (options.DEBUG == 'true'){
            console.log('#######- DEBUG MODE -#######')
            console.log('run_single.ts - runSingle()')
            console.log('Initial Flaw Info')
            console.log(initialFlawInfo)
            console.log('#######- DEBUG MODE -#######')
        }
        
        console.log('#############################\n\n')

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

                        if (options.prComment == 'true'){
                            console.log('PR commenting is enabled')
                            const prComment = await createPRComment(checkFixResults, options, initialFlawInfo)
                        }
                    }
                    else {
                        console.log('CWE '+initialFlawInfo.cweID+' is not supported '+options.language)
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
                console.log('CWE '+initialFlawInfo.cweID+' is supported for '+options.language)
                const choosePlatform = await selectPlatfrom(credentials)
                const tar = await createTar(initialFlawInfo,options)
                const uploadTar = await upload(choosePlatform, tar, options)
                const checkFixResults = await checkFix(choosePlatform, uploadTar, options)

                if (options.prComment == 'true'){
                    console.log('PR commenting is enabled')
                    const prComment = await createPRComment(checkFixResults, options, initialFlawInfo)
                }
            }
            else {
                console.log('CWE '+initialFlawInfo.cweID+' is NOT supported for '+options.language)
            }
        }
        i++
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
    
    const filepath = flawInfo.sourceFile

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