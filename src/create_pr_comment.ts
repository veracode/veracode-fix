import * as core from '@actions/core'
import * as github from '@actions/github'
import fs from 'fs';

export async function createPRComment(results:any, options:any, flawInfo:any){

    if (options.DEBUG == 'true'){
        console.log('#######- DEBUG MODE -#######')
        console.log('create_pr_comment.ts - createPRComment()')
        console.log('Results 0 to work with')
        console.log(results[0])
        console.log('Reviewing issueID: '+flawInfo.issuedID)
        console.log('#######- DEBUG MODE -#######')
    }

    //get more information from the flawInfo
    //find the correct flaw info from json inout file
    const resultsFile = fs.readFileSync(flawInfo.resultsFile, 'utf8')
    const data = JSON.parse(resultsFile)
    const flawFile = fs.readFileSync('flawInfo', 'utf8')
    const flawData = JSON.parse(flawFile)
    const resultArray = data.findings.find((issueId: any) => issueId.issue_id == flawInfo.issuedID)
    const flawCWEID = resultArray.cwe_id
    const flawSeverity = resultArray.severity
    const issueType = resultArray.issue_type
    const display_text = resultArray.display_text
    const sourceFile = flawData.sourceFile
    const sourceLine = resultArray.files.source_file.line
    const sourceLineStart = sourceLine-5
    const sourceLineEnd = sourceLine+5
    const functionName = resultArray.files.source_file.function_name
    const repositoryEnv:any = process.env

    //crete comment body
    let commentBody = ''
    commentBody = commentBody+'![](https://www.veracode.com/sites/default/files/2022-04/logo_1.svg)\n'
    commentBody = commentBody+'> [!CAUTION]\n'
    commentBody = commentBody+'***Breaking Flaw identified in code!***\n'
    commentBody = commentBody+'\n'
    commentBody = commentBody+'https://github.com/'+repositoryEnv.GITHUB_REPOSITORY+'/blob/'+repositoryEnv.GITHUB_WORKFLOW_SHA+'/'+sourceFile+'#L'+sourceLineStart+'-L'+sourceLineEnd+'\n'
    commentBody = commentBody+'\n'
    commentBody = commentBody+'> [!CAUTION]\n'
    commentBody = commentBody+'CWE: '+flawCWEID+' '+issueType+'<br>Severity: '+flawSeverity+'\n'
    commentBody = commentBody+display_text+'\n'
    commentBody = commentBody+'\n'
    if (options.codeSuggestion == 'false' || options.codeSuggestion == ''){
        commentBody = commentBody+'```diff\n'
        //commentBody = commentBody+'<br>'
        commentBody = commentBody+results[0]+'\n'
        //commentBody = commentBody+'<br>'
        commentBody = commentBody+'\n```'
    }

    if (options.DEBUG == 'true'){
        console.log('#######- DEBUG MODE -#######')
        console.log('create_pr_comment.ts - createPRComment()')
        console.log('Comment body')
        console.log(commentBody)
        console.log('#######- DEBUG MODE -#######')
    }
    

    core.info('check if we run on a pull request')
    let pullRequest = process.env.GITHUB_REF

    if (options.DEBUG == 'true'){
        console.log('#######- DEBUG MODE -#######')
        console.log('create_pr_comment.ts - createPRComment()')
        console.log(pullRequest)
        console.log('#######- DEBUG MODE -#######')
    }
    
    let isPR:any = pullRequest?.indexOf("pull")

    if ( isPR >= 1 ){
        core.info("This run is part of a PR, should add some PR comment")
        const context = github.context
        const repository:any = process.env.GITHUB_REPOSITORY
        const token = core.getInput("token")
        const repo = repository.split("/");
        const commentID:any = context.payload.pull_request?.number
        const commitID = context.payload.pull_request?.head.sha

        
        //add PR Comment
        try {
            const octokit = github.getOctokit(token);

            const { data: comment } = await octokit.rest.issues.createComment({
                owner: repo[0],
                repo: repo[1],
                issue_number: commentID,
                body: commentBody,
            });
            core.info('Adding scan results as comment to PR #'+commentID)
        } catch (error:any) {
            core.info(error);
        }
    }
    else {
        core.info('We are not running on a pull request')
    }

    return commentBody
}


export async function createPRCommentBatch(batchFixResults:any, options:any, flawArray:any){
    const batchFixResultsCount = Object.keys(batchFixResults.results).length;

    console.log('Number of files with fixes: '+batchFixResultsCount)
    
    for (let i = 0; i < batchFixResultsCount; i++) {
        let commentBody:any
        let keys = Object.keys(batchFixResults.results);
        console.log('Creating PR comment for '+keys[i])
        
        commentBody = '![](https://www.veracode.com/sites/default/files/2022-04/logo_1.svg)\n'
        commentBody = commentBody+'> [!CAUTION]\n'
        commentBody = commentBody+'***Breaking Flaws identified in code!***\n'
        commentBody = commentBody+'\n'
        commentBody = commentBody+'Fixes for '+keys[i]+':\n'
        commentBody = commentBody +'Falws found for this file:\n'
        const flawsCount = batchFixResults.results[keys[i]].flaws.length
        for (let j = 0; j < flawsCount; j++) {
            const issueId = batchFixResults.results[keys[i]].flaws[j].issueId;
            let flaw;
            for (let key in flawArray) {
                flaw = flawArray[key].find((flaw: any) => flaw.issue_id === issueId);
                if (flaw) break;
            }

            let issue_type = ''
            let severity = ''
            if (flaw) {
                issue_type = flaw.issue_type;
                severity = flaw.severity;
            } 
            commentBody = commentBody +'CWE '+batchFixResults.results[keys[i]].flaws[j].CWEId+' - '+issue_type+' - Severity '+severity+' on line '+batchFixResults.results[keys[i]].flaws[j].line+' for issue '+batchFixResults.results[keys[i]].flaws[j].issueId+'\n'
        }
        commentBody = commentBody + '\nFix suggestions:\n\n'
        commentBody = commentBody + '```diff\n'
        commentBody = commentBody + batchFixResults.results[keys[i]].patch[0]
        commentBody = commentBody + '\n```'

        //console.log('PR Comment: '+commentBody)

        console.log('check if we run on a pull request')
        let pullRequest = process.env.GITHUB_REF

        let isPR:any = pullRequest?.indexOf("pull")

        if ( isPR >= 1 ){
            console.log("This run is part of a PR, should add some PR comment")
            const context = github.context
            const repository:any = process.env.GITHUB_REPOSITORY
            const token = options.token
            const repo = repository.split("/");
            const commentID:any = context.payload.pull_request?.number
            const commitID = context.payload.pull_request?.head.sha

            try {
                const octokit = github.getOctokit(token);
    
                const { data: comment } = await octokit.rest.issues.createComment({
                    owner: repo[0],
                    repo: repo[1],
                    issue_number: commentID,
                    body: commentBody,
                });
                console.log('Adding scan results as comment to PR #'+commentID)
            } catch (error:any) {
                console.log(error);
            }

            


        }
        else {
            console.log('We are not running on a pull request')
        }
        
    }


}