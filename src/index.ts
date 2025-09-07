import * as core from '@actions/core'
import { runSingle } from './run_single';
import { runBatch } from './run_batch';
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
    
    

    if (options.DEBUG == 'true'){
        console.log('#######- DEBUG MODE -#######')
        console.log('process.env.RUNNER_TEMP= ' +process.env.RUNNER_TEMP)
        console.log('source folder = ' + sourcecodeFolderName)
        console.log('temp folder = ' + tempFolder)
        console.log('results.json: '+resultsFile)
        console.log('checking if items are present to fix: ')
        console.log('#######- DEBUG MODE -#######')
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




