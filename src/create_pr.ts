import { Octokit } from "@octokit/rest";
import * as github from '@actions/github'

export async function createPR(fixResults:any, options:any){

    const environment = process.env
    const repository:any = process.env.GITHUB_REPOSITORY
    const repo = repository.split("/");
    const owner = repo[0]
    const repoName = repo[1]
    const context = github.context
    const prID:any = context.payload.pull_request?.number
    const baseRef = context.payload.pull_request?.base.ref 
    const baseSha = context.payload.pull_request?.base.sha

    console.log('Environment: ')
    console.log(environment)
    console.log('Owner: '+owner)
    console.log('Repo: '+repoName)
    console.log('Context: ')
    console.log(context)
    console.log('PR ID: '+prID)
    console.log('Base Ref: '+baseRef)
    console.log('Base SHA: '+baseSha)



    const octokit = new Octokit({
        auth: options.token
    })

    //create a new branch from base branch
    const branchName = 'Veracode-fix-'+baseSha
    console.log('Branch Name: '+branchName)
    const branch = await octokit.git.createRef({
        owner: owner,
        repo: repoName,
        ref: 'refs/heads/'+branchName,
        sha: baseSha
    })
    

}