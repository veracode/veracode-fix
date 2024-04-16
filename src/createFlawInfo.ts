import fs from 'fs';

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
    const resultArray = data.findings.find((issueId: any) => issueId.issue_id == flawInfo.issuedID)


    if (options.DEBUG == 'true'){
        console.log('#######- DEBUG MODE -#######')
        console.log('createFlawInfo.ts')
        console.log('Results array:')
        console.log(resultArray)
        console.log('#######- DEBUG MODE -#######')
    }
    
    const sourceFile = resultArray.files.source_file.file

    //flow length
    //const flowArray = resultArray.stack_dumps.stack_dump[0].Frame
    //const flowLength = flowArray.length

/*     if (options.DEBUG == 'true'){
        console.log('#######- DEBUG MODE -#######')
        console.log('createFlawInfo.ts')
        console.log('Flow length: '+flowLength)
        console.log('#######- DEBUG MODE -#######')
    } */
    

    let flows:any = []

    if ( resultArray.stack_dumps.stack_dump[0].Frame != undefined && resultArray.stack_dumps != undefined ){
        const flowArray = resultArray.stack_dumps.stack_dump[0].Frame
        flowArray.forEach((element: any) => {
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
            }
        }
        console.log('No flows')
    }

    //rewrite path
    function replacePath (rewrite:any, path:any){
        const replaceValues = rewrite.split(":")
        const newPath = path.replace(replaceValues[0],replaceValues[1])

        if (options.DEBUG == 'true'){
            console.log('#######- DEBUG MODE -#######')
            console.log('createFlawInfo.ts')
            console.log('Value 1:'+replaceValues[0]+' Value 2: '+replaceValues[1]+' old path: '+path)
            console.log('new Path:'+newPath)
            console.log('#######- DEBUG MODE -#######')
        }

        return newPath
    }

    const filename = resultArray.files.source_file.file
    let filepath

    if (options.source_base_path_1 || options.source_base_path_2 || options.source_base_path_3){
        const orgPath1 = options.source_base_path_1.split(":")
        const orgPath2 = options.source_base_path_2.split(":")
        const orgPath3 = options.source_base_path_3.split(":")

        if (options.DEBUG == 'true'){
            console.log('#######- DEBUG MODE -#######')
            console.log('createFlawInfo.ts')
            console.log('path1: '+orgPath1[0]+':'+orgPath1[1]+' path2: '+orgPath2[0]+':'+orgPath2[1]+' path3: '+orgPath3[0]+':'+orgPath3[1])
            console.log('#######- DEBUG MODE -#######')
        }


        if( filename.includes(orgPath1[0])) {
            filepath = replacePath(options.source_base_path_1, filename)

            if (options.DEBUG == 'true'){
                console.log('#######- DEBUG MODE -#######')
                console.log('createFlawInfo.ts')
                console.log('file path1: '+filename)
                console.log('Filepath rewrite 1: '+filepath);
                console.log('#######- DEBUG MODE -#######')
            }
        }
        else if (filename.includes(orgPath2[0])){
            filepath = replacePath(options.source_base_path_2, filename)

            if (options.DEBUG == 'true'){
                console.log('#######- DEBUG MODE -#######')
                console.log('createFlawInfo.ts')
                console.log('file path2: '+filename)
                console.log('Filepath rewrite 2: '+filepath);
                console.log('#######- DEBUG MODE -#######')
            }
        }
        else if (filename.includes(orgPath3[0])){
            filepath = replacePath(options.source_base_path_3, filename)

            if (options.DEBUG == 'true'){
                console.log('#######- DEBUG MODE -#######')
                console.log('createFlawInfo.ts')
                console.log('file path3: '+filename)
                console.log('Filepath rewrite 3: '+filepath);
                console.log('#######- DEBUG MODE -#######')
            }
        }
        console.log('Rewritten Filepath: '+filepath);
    }

    if ( filepath == undefined ){
        filepath = filename
    }

    //add flow to flaw info
    const fullFlawInfo = {
        "sourceFile": filepath,
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