import * as core from '@actions/core'
import * as github from '@actions/github'
import fs from 'fs';


export async function createPRComment(results:any, options:any, flawInfo:any){

    console.log('Results 0 to work with')
    console.log(results[0])

    //get more information from the flawInfo
    //find the correct flaw info from json inout file
    const resultsFile = fs.readFileSync(flawInfo.resultsFile, 'utf8')
    const data = JSON.parse(resultsFile)
    console.log('Reviewing issueID: '+flawInfo.issuedID)
    const resultArray = data.findings.find((issueId: any) => issueId.issue_id == flawInfo.issuedID)
    const flawCWEID = resultArray.cwe_id
    const flawSeverity = resultArray.severity
    const issueType = resultArray.issue_type
    const display_text = resultArray.display_text
    const sourceFile = resultArray.files.source_file.file
    const sourceLine = resultArray.files.source_file.line
    const sourceLineStart = sourceLine-5
    const sourceLineEnd = sourceLine+5
    const functionName = resultArray.files.source_file.function_name
    const repositoryEnv:any = process.env

    console.log('environment variables')
    console.log(repositoryEnv)

    //crete comment body
    let commentBody = ''
    commentBody = commentBody+'![](https://www.veracode.com/sites/default/files/2022-04/logo_1.svg)<br>'
    commentBody = commentBody+'> [!CAUTION]\n'
    commentBody = commentBody+'***Breaking Flaw identified in code!***<br>'
    commentBody = commentBody+'https://github.com/'+repositoryEnv.GITHUB_REPOSITORY+'/blob/'+repositoryEnv.GITHUB_WORKFLOW_SHA+'/src/main/java/com/veracode/verademo/commands/IgnoreCommand.java#L'+sourceLineStart+'-L'+sourceLineEnd+'<br>'
    commentBody = commentBody+'<br>'
    commentBody = commentBody+'> [!CAUTION]\n'
    commentBody = commentBody+'<br>CWE: '+flawCWEID+' '+issueType+'<br>Severity: '+flawSeverity+'<br>'
    commentBody = commentBody+display_text+'<br>'
    commentBody = commentBody+'<br>'
    commentBody = commentBody+'```diff\n'
    //commentBody = commentBody+'<br>'
    commentBody = commentBody+results[0]+'\n'
    //commentBody = commentBody+'<br>'
    commentBody = commentBody+'```'

    console.log('Comment body')
    console.log(commentBody)

    core.info('check if we run on a pull request')
    let pullRequest = process.env.GITHUB_REF
    console.log(pullRequest)
    let isPR:any = pullRequest?.indexOf("pull")

    if ( isPR >= 1 ){
        core.info("This run is part of a PR, should add some PR comment")
        const context = github.context
        const repository:any = process.env.GITHUB_REPOSITORY
        const token = core.getInput("token")
        const repo = repository.split("/");
        const commentID:any = context.payload.pull_request?.number

        

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

}