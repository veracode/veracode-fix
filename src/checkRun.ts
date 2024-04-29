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
            name: 'Veracode Autofix suggestions',
            head_sha: commitID,
            status: 'in_progress',
            output: {
                title: 'Veracode Autofix suggestions',
                summary: 'Will create Veracode Autofix suggestions as PR comments',
                text: 'Will create Veracode Autofix suggestions as PR comments'
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

    const octokit = new Octokit({
        auth: token
    })

    try {
        console.log('Check run update started')
        console.log('Start line: '+flawInfo.sourceLine)
        const end_line = flawInfo.sourceLine + 20
        console.log('End line: '+end_line)
        const response = await octokit.request('PATCH /repos/'+repo[0]+'/'+repo[1]+'/check-runs/'+options.checkRunID, {
            status: 'in_progress',
            output: {
                title: 'Veracode Autofix suggestions',
                summary: 'Will create Veracode Autofix suggestions as PR comments',
                text: 'Will create Veracode Autofix suggestions as PR comments',
                annotations: [
                    {
                    path: flawInfo.sourceFile,
                    start_line: flawInfo.sourceLine,
                    end_line: end_line,
                    annotation_level: 'warning',
                    title: 'Securityy findings',
                    message: 'Fix this security finding',
                    raw_details: commentBody
                    }
                ]
            },
            headers: {
            'X-GitHub-Api-Version': '2022-11-28'
            }
        })
        console.log('Check run updated')
        console.log(response)
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