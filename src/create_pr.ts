import { Octokit } from "@octokit/rest";
import * as github from '@actions/github'
import * as Diff from 'diff';
import * as fs from 'fs-extra';

export async function createPR(fixResults:any, options:any){

    const environment = process.env
    const repository:any = process.env.GITHUB_REPOSITORY
    const repo = repository.split("/");
    const owner = repo[0]
    const repoName = repo[1]
    const context = github.context
    const prID:any = context.payload.pull_request?.number
    const baseRef = process.env.GITHUB_REF_NAME 
    const baseSha:any = process.env.GITHUB_SHA

    /*
    console.log('Environment: ')
    console.log(environment)
    console.log('Owner: '+owner)
    console.log('Repo: '+repoName)
    console.log('Context: ')
    console.log(context)
    console.log('PR ID: '+prID)
    console.log('Base Ref: '+baseRef)
    console.log('Base SHA: '+baseSha)
    */

    console.log('Environment: ')
    console.log(environment)
    console.log('Base Ref: '+baseRef)


    const octokit = new Octokit({
        auth: options.token
    })

    //create a new branch from base branch
    const timestamp = new Date().getTime()
    const branchName = 'Veracode-fix-bot'+baseSha+'-'+timestamp
    console.log('Branch Name: '+branchName)

    const createBranch = await octokit.request('POST /repos/'+(owner)+'/'+(repoName)+'/git/refs', {
        owner: owner,
        repo: repoName,
        ref: 'refs/heads/'+branchName,
        sha: baseSha,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
    })


    const branchSha = createBranch.data.object.sha

    /*
    console.log('Branch created: ')
    console.log(createBranch)
    console.log('Branch SHA: ')
    console.log(branchSha)

    console.log('Fix Results: ')
    console.log(fixResults)
    */

    const batchFixResultsCount = Object.keys(fixResults.results).length;

    console.log('Number of files with fixes: '+batchFixResultsCount)
    
    for (let i = 0; i < batchFixResultsCount; i++) {
        let keys = Object.keys(fixResults.results);
        console.log('Patching file: '+keys[i])

        const originalContent = await fs.readFile(keys[i], 'utf-8');
        const patch = fixResults.results[keys[i]].patch[0]

        const patches = Diff.parsePatch(patch);

        let updatedContent = originalContent;
        patches.forEach(async patch => {
            updatedContent = Diff.applyPatch(updatedContent, patch) as string;
        });


        const getFileSha = await octokit.request('GET /repos/'+(owner)+'/'+(repoName)+'/contents/'+keys[i], {
            owner: owner,
            repo: repoName,
            path: keys[i],
            ref: 'refs/heads/'+branchName,
            headers: {
              'X-GitHub-Api-Version': '2022-11-28'
            }
        })

        const fileSha = getFileSha.data.sha
        console.log('File SHA: '+fileSha)

        const updateFile = await octokit.request('PUT /repos/'+(owner)+'/'+(repoName)+'/contents/'+keys[i], {
            owner: owner,
            repo: repoName,
            path: keys[i],
            message: `Veracode-Fix-Bot - update ${keys[i]} with patch`,
            committer: {
              name: 'Veracode Fix Bot',
              email: 'octocat@github.com'
            },
            content: Buffer.from(updatedContent).toString('base64'),
            sha: fileSha,
            branch: branchName,
            headers: {
              'X-GitHub-Api-Version': '2022-11-28'
            }
        })

        /*
        console.log('Update file response: ')
        console.log(updateFile)
        */
    }

    //once everything is pushed to the new branch, create a PR from the new branch to the base branch
    const createPR = await octokit.request('POST /repos/'+(owner)+'/'+(repoName)+'/pulls', {
        owner: owner,
        repo: repoName,
        title: 'Veracode Batch Fix',
        head: branchName,
        base: baseRef,
        body: 'Veracode Batch Fix - MORE CONTENT TO BE ADDED',
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
    })

    /*
    console.log('Create PR response: ')
    console.log(createPR)
    */
}