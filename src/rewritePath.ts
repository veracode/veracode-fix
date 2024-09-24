   
export async function rewritePath(options:any, filename:any){
   
    async function replacePath (rewrite:any, path:any){
        const replaceValues = rewrite.split(":")
        const newPath = path.replace(replaceValues[0],replaceValues[1])

        if (options.DEBUG == 'true'){
            console.log('#######- DEBUG MODE -#######')
            console.log('rewritePath.ts')
            console.log('Value 1:'+replaceValues[0]+' Value 2: '+replaceValues[1]+' old path: '+path)
            console.log('new Path:'+newPath)
            console.log('#######- DEBUG MODE -#######')
        }

        return newPath
    }

    let filepath

    if (options.source_base_path_1 || options.source_base_path_2 || options.source_base_path_3){
        const orgPath1 = options.source_base_path_1.split(":")
        const orgPath2 = options.source_base_path_2.split(":")
        const orgPath3 = options.source_base_path_3.split(":")

        if (options.DEBUG == 'true'){
            console.log('#######- DEBUG MODE -#######')
            console.log('rewritePath.ts')
            console.log('path1: '+orgPath1[0]+':'+orgPath1[1]+' path2: '+orgPath2[0]+':'+orgPath2[1]+' path3: '+orgPath3[0]+':'+orgPath3[1])
            console.log('#######- DEBUG MODE -#######')
        }


        if( filename.includes(orgPath1[0])) {
            filepath = await replacePath(options.source_base_path_1, filename)

            if (options.DEBUG == 'true'){
                console.log('#######- DEBUG MODE -#######')
                console.log('rewritePath.ts')
                console.log('file path1: '+filename)
                console.log('Filepath rewrite 1: '+filepath);
                console.log('#######- DEBUG MODE -#######')
            }
        }
        else if (filename.includes(orgPath2[0])){
            filepath = await replacePath(options.source_base_path_2, filename)

            if (options.DEBUG == 'true'){
                console.log('#######- DEBUG MODE -#######')
                console.log('rewritePath.ts')
                console.log('file path2: '+filename)
                console.log('Filepath rewrite 2: '+filepath);
                console.log('#######- DEBUG MODE -#######')
            }
        }
        else if (filename.includes(orgPath3[0])){
            filepath = await replacePath(options.source_base_path_3, filename)

            if (options.DEBUG == 'true'){
                console.log('#######- DEBUG MODE -#######')
                console.log('rewritePath.ts')
                console.log('file path3: '+filename)
                console.log('Filepath rewrite 3: '+filepath);
                console.log('#######- DEBUG MODE -#######')
            }
        }
        console.log('Rewritten Filepath: '+filepath);
    } else { // if no source_base_path is provided, return the original path
        filepath = filename
    }
    return filepath
}