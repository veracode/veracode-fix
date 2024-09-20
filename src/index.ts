import * as core from '@actions/core'
import { runSingle } from './run_single';
import { runBatch } from './run_batch';
import fs from 'fs';
import { json } from 'stream/consumers';


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
options['codeSuggestion'] = getInputOrEnv('codeSuggestion',false);
options['token'] = getInputOrEnv('token',false);

const resultsFile = fs.readFileSync(options.file, 'utf8')

if (!JSON.parse(resultsFile).findings){ 
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




