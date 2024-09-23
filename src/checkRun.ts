import {Octokit} from '@octokit/rest';
import * as github from '@actions/github'
import * as core from '@actions/core'

export async function createCheckRun(options:any) {
    const context = github.context
    const repository:any = process.env.GITHUB_REPOSITORY
    const token = core.getInput("token")
    const repo = repository.split("/");
    const commentID:any = context.payload.pull_request?.number
    const commitID = context.payload.pull_request?.head.sha

    const octokit = new Octokit({
        auth: token
    })
     
    try {
        const response = await octokit.request('POST /repos/'+repo[0]+'/'+repo[1]+'/check-runs', {
            owner: repo[0],
            repo: repo[1],
            name: 'Veracode Fix suggestions',
            head_sha: commitID,
            status: 'in_progress',
            output: {
                title: 'Veracode Fix suggestions',
                summary: 'Will create Veracode Fix suggestions as PR comments',
                text: 'Will create Veracode Fix suggestions as PR comments'
            },
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
            }
        })
        console.log('Check run created')
        return response.data.id
    } catch (error:any) {
        core.info(error);
    }

}

export async function updateCheckRunUpdate(options:any, commentBody:any, fixResults:any, flawInfo:any) {
    const context = github.context
    const repository:any = process.env.GITHUB_REPOSITORY
    const token = core.getInput("token")
    const repo = repository.split("/");
    const commentID:any = context.payload.pull_request?.number
    const commitID = context.payload.pull_request?.head.sha

    if (options.DEBUG == 'true'){
        console.log('#######- DEBUG MODE -#######')
        console.log('checkRun.ts - updateCheckRunUpdate')
        console.log('results:')
        console.log(fixResults)
        console.log('#######- DEBUG MODE -#######')
    }

    const octokit = new Octokit({
        auth: token
    })

    try {
        console.log('Check run update started')
        console.log('Start line: '+flawInfo.line)
        const end_line = flawInfo.line + 20
        console.log('End line: '+end_line)


        //Let's check if there are multiple hunks on the first fix result
        let hunks = 0
        if (fixResults[0].indexOf('@@') > 0){
            //first remove the first part of the result that include the file names and path, we don't need that for the annotation
            const firstFixResult = fixResults[0]
            const cleanedResults = firstFixResult.replace(/^---.*$\n?|^\+\+\+.*$\n?/gm, '');
            const hunks = cleanedResults.split(/(?=@@ -\d+,\d+ \+\d+,\d+ @@\n)/);
            console.log('hunks:')
            console.log(hunks)
            const hunksCount = hunks.length
            console.log('Number of hunks: '+hunksCount)

           
            for (let i = 0; i < hunksCount; i++) {
                
                const hunkLines = hunks[i].split('\n');
                const hunkHeader = hunkLines[0];
                const hunkHeaderMatch = hunkHeader.match(/@@ -(\d+),\d+ \+(\d+),(\d+) @@/);
                if (!hunkHeaderMatch) {
                    console.log('No hunk header found');
                    continue;
                }

                const startLineOriginal = parseInt(hunkHeaderMatch[1]);
                const startLineNew = parseInt(hunkHeaderMatch[2]);
                const lineCountNew = parseInt(hunkHeaderMatch[3]);
                const endLineNew = startLineNew + lineCountNew - 1;

                
                if (options.DEBUG == 'true'){
                    console.log('#######- DEBUG MODE -#######')
                    console.log('checkRun.ts - updateCheckRunUpdate')
                    console.log('Start line original: '+startLineOriginal)
                    console.log('Start line new: '+startLineNew)
                    console.log('End line new: '+endLineNew)
                    console.log('#######- DEBUG MODE -#######')
                }
                

                const cleanedHunk = hunks[i].replace(/^@@ -\d+,\d+ \+\d+,\d+ @@\n/, '');
  
                const response = await octokit.request('PATCH /repos/'+repo[0]+'/'+repo[1]+'/check-runs/'+options.checkRunID, {
                    status: 'in_progress',
                    output: {
                        title: 'Veracode Fix suggestions',
                        summary: 'Will create Veracode Fix suggestions as PR comments',
                        text: 'Will create Veracode Fix suggestions as PR comments',
                        annotations: [
                            {
                            path: flawInfo.sourceFile,
                            start_line: startLineOriginal,
                            end_line: endLineNew,
                            annotation_level: 'warning',
                            title: 'Security findings',
                            message: cleanedHunk,
                            }
                        ]
                    },
                    headers: {
                    'X-GitHub-Api-Version': '2022-11-28'
                    }
                })
                console.log('Check run updated')

                if (options.DEBUG == 'true'){
                    console.log('#######- DEBUG MODE -#######')
                    console.log('checkRun.ts - updateCheckRunUpdate')
                    console.log(response)
                    console.log('#######- DEBUG MODE -#######')
                }
                
            };
        }
    } catch (error:any) {
        console.log(error.request)
        console.log(error.response)
        core.info(error);
    }
}

export async function updateCheckRunUpdateBatch(options:any, batchFixResults:any, flawInfo:any) {
    const context = github.context
    const repository:any = process.env.GITHUB_REPOSITORY
    const token = core.getInput("token")
    const repo = repository.split("/");
    const commentID:any = context.payload.pull_request?.number
    const commitID = context.payload.pull_request?.head.sha

    if (options.DEBUG == 'true'){
        console.log('#######- DEBUG MODE -#######')
        console.log('checkRun.ts - updateCheckRunUpdateBatch')
        console.log('results:')
        console.log(batchFixResults)
        console.log('#######- DEBUG MODE -#######')
    }

    const octokit = new Octokit({
        auth: token
    })

    try {
        console.log('Check run update started')
        const end_line = flawInfo.line + 20

        if (options.DEBUG == 'true'){
            console.log('#######- DEBUG MODE -#######')
            console.log('checkRun.ts - updateCheckRunUpdateBatch')
            console.log('Start line: '+flawInfo.line)
            console.log('End line: '+end_line)
            console.log('#######- DEBUG MODE -#######')
        }
        
       

        //Let's check if there are multiple hunks on the first fix result
        let hunks = 0
        for (let key in batchFixResults.results) {
            let patches = batchFixResults.results[key].patch;
            for (let i = 0; i < patches.length; i++) {
                let patch = patches[i];

                if (patch.indexOf('@@') > 0) {
                    const cleanedPatch = patch.replace(/^---.*$\n?|^\+\+\+.*$\n?/gm, '');
                    const sourceFile = patch.match(/---\s(.*)\n/);
                    const cleanedSourceFile = sourceFile[1].replace('--- ', '');
                    const hunks = cleanedPatch.split(/(?=@@ -\d+,\d+ \+\d+,\d+ @@\n)/);
                    if (options.DEBUG == 'true'){
                        console.log('#######- DEBUG MODE -#######')
                        console.log('checkRun.ts - updateCheckRunUpdateBatch')
                        console.log('hunks:');
                        console.log(hunks);
                        console.log('#######- DEBUG MODE -#######')
                    }
                    const hunksCount = hunks.length;
                    console.log('Number of hunks: ' + hunksCount);

                    for (let j = 0; j < hunksCount; j++) {
                        const hunkLines = hunks[j].split('\n');
                        const hunkHeader = hunkLines[0];
                        const hunkHeaderMatch = hunkHeader.match(/@@ -(\d+),\d+ \+(\d+),(\d+) @@/);
                        if (!hunkHeaderMatch) {
                            console.log('No hunk header found');
                            continue;
                        }

                        const startLineOriginal = parseInt(hunkHeaderMatch[1]);
                        const startLineNew = parseInt(hunkHeaderMatch[2]);
                        const lineCountNew = parseInt(hunkHeaderMatch[3]);
                        const endLineNew = startLineNew + lineCountNew - 1;

                        if (options.DEBUG == 'true'){
                            console.log('#######- DEBUG MODE -#######')
                            console.log('checkRun.ts - updateCheckRunUpdateBatch')
                            console.log('Start line original: '+startLineOriginal)
                            console.log('Start line new: '+startLineNew)
                            console.log('End line new: '+endLineNew)
                            console.log('#######- DEBUG MODE -#######')
                        }

                        const cleanedHunk = hunks[j].replace(/^@@ -\d+,\d+ \+\d+,\d+ @@\n/, '');
         
                        const response = await octokit.request('PATCH /repos/'+repo[0]+'/'+repo[1]+'/check-runs/'+options.checkRunID, {
                            status: 'in_progress',
                            name: "check run name test",
                            output: {
                                title: 'Veracode Fix suggestions',
                                summary: 'Will create Veracode Fix suggestions as PR annotation',
                                text: 'Will create Veracode Fix suggestions as PR annotation',
                                annotations: [
                                    {
                                    path: cleanedSourceFile,
                                    start_line: startLineOriginal,
                                    end_line: endLineNew,
                                    annotation_level: 'warning',
                                    title: 'Security findings between line numbers '+startLineOriginal+' and '+endLineNew,
                                    message: cleanedHunk
                                    
                                    }
                                ]
                            },
                            headers: {
                            'X-GitHub-Api-Version': '2022-11-28'
                            }
                        })
                        console.log('Check run updated')
                        if (options.DEBUG == 'true'){
                            console.log('#######- DEBUG MODE -#######')
                            console.log('checkRun.ts - updateCheckRunUpdateBatch')
                            console.log('Response')
                            console.log(response)
                            console.log('#######- DEBUG MODE -#######')
                        }
                    };
                }
            }
        }


    } catch (error:any) {
        console.log(error.request)
        console.log(error.response)
        core.info(error);
    }
}



export async function updateCheckRunClose(options:any, checkRunID:any) {
    const context = github.context
    const repository:any = process.env.GITHUB_REPOSITORY
    const token = core.getInput("token")
    const repo = repository.split("/");
    const commentID:any = context.payload.pull_request?.number
    const commitID = context.payload.pull_request?.head.sha

    const octokit = new Octokit({
        auth: token
    })

    try {
        const response = await octokit.request('PATCH /repos/'+repo[0]+'/'+repo[1]+'/check-runs/'+checkRunID, {
            status: 'completed',
            conclusion: 'success',
            headers: {
                accept: 'application/vnd.github.v3+json',
            }
        });
        console.log('Check run closed')
    } catch (error:any) {
        console.log(error.response)
        core.info(error);
    }
}