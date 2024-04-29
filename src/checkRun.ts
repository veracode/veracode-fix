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
        console.log(response.data)
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
        console.log(fixResults)
        console.log(flawInfo)

        const end_line = flawInfo.sourceLine + 20

        
        const response = await octokit.request('PATCH /repos/'+repo[0]+'/'+repo[1]+'/check-runs/{check_run_id}', {
            owner: repo[0],
            repo: repo[1],
            check_run_id: options.checkRunID,
            status: 'in_progress',
            conclusion: 'success',
            output: {
                title: 'Veracode Autofix suggestions',
                summary: 'Will create Veracode Autofix suggestions as PR comments',
                text: 'Will create Veracode Autofix suggestions as PR comments',
                annotations: [
                    {
                    path: flawInfo.sourceFile,
                    annotation_level: 'warning',
                    title: 'Securityy findings',
                    message: 'Fix this security finding',
                    raw_details: commentBody,
                    start_line: flawInfo.sourceLine,
                    end_line: 2
                    }
                ]
            },
            headers: {
            'X-GitHub-Api-Version': '2022-11-28'
            }
        })
        console.log('Check run closed - updated')
        console.log(response.data)
    } catch (error:any) {
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
        const response = await octokit.request('PATCH /repos/'+repo[0]+'/'+repo[1]+'/check-runs/{check_run_id}', {
            owner: repo[0],
            repo: repo[1],
            check_run_id: checkRunID,
            status: 'completed',
            conclusion: 'success',
            headers: {
            'X-GitHub-Api-Version': '2022-11-28'
            }
        })
        console.log('Check run closed - updated')
        console.log(response.data)
    } catch (error:any) {
        core.info(error);
    }
}