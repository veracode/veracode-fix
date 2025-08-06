import {Octokit} from '@octokit/rest';
import * as github from '@actions/github'
import * as core from '@actions/core'
import { unsetProxy, restoreProxy } from './proxy'

export async function createCodeSuggestion(options:any, fixResults:any, flawInfo:any){
    const context = github.context
    const repository:any = process.env.GITHUB_REPOSITORY
    const token = core.getInput("token")
    const repo = repository.split("/");
    const commentID:any = context.payload.pull_request?.number
    const commitID = context.payload.pull_request?.head.sha
    const prId = github.context.payload.pull_request?.number;

    if (options.DEBUG == 'true'){
        console.log('#######- DEBUG MODE -#######')
        console.log('create_code_suggestions.ts - createCodeSuggestion')
        console.log('results:')
        console.log(fixResults)
        console.log('#######- DEBUG MODE -#######')
    }

    // Disable proxy for GitHub API calls
    const originalProxySettings = unsetProxy();
    
    const octokit = new Octokit({
        auth: token
    })

    try {
        console.log('Adding Code Suggestion')

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
                const hunkHeaderMatch = hunkHeader.match(/@@ -(\d+),(\d)+ \+(\d+),(\d+) @@/);
                if (!hunkHeaderMatch) {
                    console.log('No hunk header found');
                    continue;
                }

                const startLineOriginal = parseInt(hunkHeaderMatch[1]);
                const lineCountOriginal = parseInt(hunkHeaderMatch[2]);
                const endLineOriginal = startLineOriginal + lineCountOriginal;
                const startLineNew = parseInt(hunkHeaderMatch[3]);
                const lineCountNew = parseInt(hunkHeaderMatch[4]);
                const endLineNew = startLineNew + lineCountNew - 1;
                

                console.log('Hunk header: '+hunkHeader)
                console.log('Start line original: '+startLineOriginal)
                console.log('Line count original: '+lineCountOriginal)
                console.log('End Line Original: '+endLineOriginal)
                console.log('Start line new: '+startLineNew)
                console.log('Line count new: '+lineCountNew)
                console.log('End line new: '+endLineNew)
                console.log('End Line Original: '+endLineOriginal)

                const cleanedHunk = hunks[i].replace(/^@@ -\d+,\d+ \+\d+,\d+ @@\n/, '');
                //const cleanedHunkLines = cleanedHunk.split('\n').map((line: string) => line.replace(/^-|\+/, ''));
                const cleanedHunkLines = cleanedHunk.split('\n').filter((line: string) => !line.startsWith('-')).map((line: string) => line.replace(/^\+/, ''));
                let commentBody = '```suggestion\n'
                commentBody = commentBody+cleanedHunkLines.join('\n');
                commentBody = commentBody+'\n```'

                const response = await octokit.request('POST /repos/'+repo[0]+'/'+repo[1]+'/pulls/'+prId+'/comments', {
                    body: commentBody,
                    commit_id: commitID,
                    subject_type: 'file',
                    side: 'RIGHT',
                    start_side: 'LEFT',
                    path: flawInfo.sourceFile,
                    //line: endLineOriginal,
                    start_line: startLineOriginal,
                    position: lineCountOriginal,
                    headers: {
                    'X-GitHub-Api-Version': '2022-11-28'
                    }
                })
                console.log('PR review comment created')
                console.log(response)
            };
        }
    } catch (error:any) {
        console.log(error.request)
        console.log(error.response)
        core.info(error);
    }
    
    // Restore proxy settings
    restoreProxy(originalProxySettings.httpProxy, originalProxySettings.httpsProxy);
}