import fs from 'fs';
import path from 'path';
import { searchFile, normalizePathForDisplay } from './rewritePath'

export async function createFlawInfo(flawInfo:any,options:any){

    if (options.DEBUG == 'true'){
        console.log('#######- DEBUG MODE -#######')
        console.log('createFlawInfo.ts')
        console.log('Flaw Info:')
        console.log(flawInfo)
        console.log('#######- DEBUG MODE -#######')
    }

    //find the correct flaw info from json inout file
    const resultsFile = fs.readFileSync(flawInfo.resultsFile, 'utf8')
    const data = JSON.parse(resultsFile)
    console.log('Reviewing issueID: '+flawInfo.issuedID)
    //const resultArray = data.findings.find((issueId: any) => issueId.issue_id == flawInfo.issuedID)
    const resultArray = data.findings.find((issue:any) => issue.issue_id == flawInfo.issuedID && issue.files.source_file.file == flawInfo.sourceFile);


    if (options.DEBUG == 'true'){
        console.log('#######- DEBUG MODE -#######')
        console.log('createFlawInfo.ts')
        console.log('Results array:')
        console.log(resultArray)
        console.log('#######- DEBUG MODE -#######')
    }
    
    const sourceFile = resultArray.files.source_file.file

    let flows:any = []

    //console.log('StackDumbs: ')
    //console.log(resultArray.stack_dumps)
    

    if ( resultArray.stack_dumps.stack_dump ){
        //console.log('StackDumbs length: '+resultArray.stack_dumps.stack_dump.length)

        if ( resultArray.stack_dumps.stack_dump.length > 0 ){
            const flowArray = resultArray.stack_dumps.stack_dump[0].Frame
            flowArray.forEach(async (element: any) => {
                if (element.SourceFile == sourceFile && element.VarNames != undefined){

                    if (options.DEBUG == 'true'){
                        console.log('#######- DEBUG MODE -#######')
                        console.log('createFlawInfo.ts')
                        console.log('Flow element: ')
                        console.log(element)
                        console.log('#######- DEBUG MODE -#######')
                    }

                    let flow = { 
                        "expression": element.VarNames,
                        "region": {
                            "startLine": parseInt(element.SourceLine)+1,
                            "endLine": parseInt(element.SourceLine)+1,
                            "startColumn": 0,
				            "endColumn": 0
                        }
                    }
                    //add flow to flows array
                    flows.push(flow)
                
                }
            });

            if (options.DEBUG == 'true'){
                console.log('#######- DEBUG MODE -#######')
                console.log('createFlawInfo.ts')
                console.log('Flows:')
                console.log(flows)
                console.log('#######- DEBUG MODE -#######')
            }
            
        }
        else {
            let flow = { 
                "expression": "",
                "region": {
                    "startLine": resultArray.files.source_file.line,
                    "endLine": resultArray.files.source_file.line,
                    "startColumn": 0,
				    "endColumn": 0
                }
            }
            flows.push(flow)
            console.log('No flows 1')
        }
    }
    else {
        let flow = { 
            "expression": "",
            "region": {
                "startLine": resultArray.files.source_file.line,
                "endLine": resultArray.files.source_file.line,
            }
        }
        flows.push(flow)
        console.log('No flows 2')
    }

    const filename = resultArray.files.source_file.file
    //get current directory
    const dir = process.cwd();
    if (options.DEBUG == 'true'){
        console.log('#######- DEBUG MODE -#######')
        console.log('createFlawInfo.ts')
        console.log('Searching for file: '+filename+' in directory: '+dir)
        console.log('#######- DEBUG MODE -#######')
    }
    const filenameOnly = path.basename(flawInfo.sourceFile);
    let filepath = await searchFile(dir, filenameOnly, options)
    
    if ( filepath == undefined || filepath === '' ){
        filepath = filename
    }

    // Normalize the path for display purposes (remove GitHub Actions runner prefix)
    const normalizedPath = normalizePathForDisplay(filepath);
    
    if (options.DEBUG == 'true'){
        console.log('#######- DEBUG MODE -#######')
        console.log('createFlawInfo.ts')
        console.log('Full path: '+filepath)
        console.log('Normalized path: '+normalizedPath)
        console.log('#######- DEBUG MODE -#######')
    }

    //add flow to flaw info
    const fullFlawInfo = {
        "sourceFile": normalizedPath,  // Use normalized path for display
        "sourceFileFull": filepath,    // Keep full path for file operations
        "function": resultArray.files.source_file.function_name,
        "line": resultArray.files.source_file.line,
        "CWEId": resultArray.cwe_id,
        "issueId": resultArray.issue_id,
        "flow": flows
    }

    if (options.DEBUG == 'true'){
        console.log('#######- DEBUG MODE -#######')
        console.log('createFlawInfo.ts')
        console.log('Full Flaw Info:')
        console.log(fullFlawInfo)
        console.log('#######- DEBUG MODE -#######')
    }

    return fullFlawInfo
}