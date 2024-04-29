import * as core from '@actions/core'
import { runSingle } from './run_single';
import { runBatch } from './run_batch';
import { createCheckRun, updateCheckRunClose } from './checkRun';

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
options['source_base_path_1'] = getInputOrEnv('source_base_path_1',false);
options['source_base_path_2'] = getInputOrEnv('source_base_path_2',false);
options['source_base_path_3'] = getInputOrEnv('source_base_path_3',false);
options['DEBUG'] = getInputOrEnv('debug',false);
options['language'] = getInputOrEnv('language',false);
options['prComment'] = getInputOrEnv('prComment',false);
options['createPR'] = getInputOrEnv('createPR',false);
options['files'] = getInputOrEnv('files',false);
options['token'] = getInputOrEnv('token',false);



//if prComment is true and we run on a PR we need to create a check run
let checkRunID:any = ''
if (options.prComment == 'true'){
    console.log('PR commenting is enabled')
    if (process.env.GITHUB_EVENT_NAME == 'pull_request'){
        console.log('This is a PR - create a check run')
        //create a check run
        let checkRunID = createCheckRun(options)
        options['checkRunID'] = checkRunID
        console.log('Check Run ID is: '+checkRunID)
    }
}



if ( options.fixType == 'batch' ){
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


//if prComment is true and we run on a PR we need to close the check run
if (options.prComment == 'true'){
    console.log('PR commenting is enabled')
    if (process.env.GITHUB_EVENT_NAME == 'pull_request'){
        console.log('This is a PR - create a check run')
        //create a check run
        const checkRun = updateCheckRunClose(options, checkRunID)
    }
}

