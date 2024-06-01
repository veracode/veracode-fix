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



    const octokit = new Octokit({
        auth: options.token
    })

    //create a new branch from base branch
    const branchName = 'Veracode-fix-bot'+baseSha
    console.log('Branch Name: '+branchName)
    const branch = await octokit.git.createRef({
        owner: owner,
        repo: repoName,
        ref: 'refs/heads/'+branchName,
        sha: baseSha
    })

    const branchSha = branch.data.object.sha

    console.log('Branch created: ')
    console.log(branch)
    console.log('Branch SHA: ')
    console.log(branchSha)

    console.log('Fix Results: ')
    console.log(fixResults)
    
    const batchFixResultsCount = Object.keys(fixResults.results).length;

    console.log('Number of files with fixes: '+batchFixResultsCount)
    
    for (let i = 0; i < batchFixResultsCount; i++) {
        let keys = Object.keys(fixResults.results);
        console.log('Patching file: '+keys[i])

        const originalContent = await fs.readFile(keys[i], 'utf-8');
        const patch = fixResults.results[keys[i]].patch[0]

        console.log('Patch: ')
        console.log(patch)

        const patches = Diff.parsePatch(patch);

        let updatedContent = originalContent;
        patches.forEach(async patch => {
            updatedContent = Diff.applyPatch(updatedContent, patch) as string;
        });

        await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: keys[i],
            message: `Veracode-Fix-Bot - update ${keys[i]} with patch`,
            content: Buffer.from(updatedContent).toString('base64'),
            sha: branchSha,
            branchName
        });


    }

}