import { Octokit } from "@octokit/rest";
import * as github from '@actions/github'
import * as Diff from 'diff';
import * as fs from 'fs-extra';

export async function createPR(fixResults:any, options:any, flawArray:any){

    const environment = process.env
    const repository:any = process.env.GITHUB_REPOSITORY
    const repo = repository.split("/");
    const owner = repo[0]
    const repoName = repo[1]
    const context = github.context
    const prID:any = context.payload.pull_request?.number
    let baseRef:any = ''
    if ( process.env.GITHUB_EVENT_NAME == 'pull_request' ){
        baseRef = process.env.GITHUB_HEAD_REF
    }
    else {
        baseRef = process.env.GITHUB_REF_NAME 
    }
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
    const branchName = 'Veracode-fix-bot-'+baseSha+'-'+timestamp
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

    //start body of PR comment
    let prCommentBody:any
    let keys = Object.keys(fixResults.results);
    prCommentBody = prCommentBody+'![](https://www.veracode.com/sites/default/files/2022-04/logo_1.svg)\n'
    prCommentBody = prCommentBody+'VERACOE-FIX CODE SUGGESTIONS\n'
    prCommentBody = prCommentBody+'> [!CAUTION]\n'
    prCommentBody = prCommentBody+'***Breaking Flaws identified in code!***\n'
    prCommentBody = prCommentBody+'\n'
    

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

        //PR body content for each file
        prCommentBody = prCommentBody+'Fixes for '+keys[i]+':\n'
        prCommentBody = prCommentBody +'Falws found for this file:\n'
        const flawsCount = fixResults.results[keys[i]].flaws.length
        for (let j = 0; j < flawsCount; j++) {
            const issueId = fixResults.results[keys[i]].flaws[j].issueId;
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
            prCommentBody = prCommentBody +'CWE '+fixResults.results[keys[i]].flaws[j].CWEId+' - '+issue_type+' - Severity '+severity+' on line '+fixResults.results[keys[i]].flaws[j].line+' for issue '+fixResults.results[keys[i]].flaws[j].issueId+'\n'
        }

        /*
        console.log('Update file response: ')
        console.log(updateFile)
        */
    }


    //end body of PR comment
    prCommentBody = prCommentBody + '\nThis PR is created by the Veracode-Fix bot to help fix security defects on your code\n\n'
    prCommentBody = prCommentBody + '\nThe base branch is '+baseRef+' the base commit sha is '+baseSha+'\n\n'
    prCommentBody = prCommentBody + '\nPlease reach out to your Veracode team if anything in question\n\n'



    //once everything is pushed to the new branch, create a PR from the new branch to the base branch
    const createPR = await octokit.request('POST /repos/'+(owner)+'/'+(repoName)+'/pulls', {
        owner: owner,
        repo: repoName,
        title: 'Veracode Batch Fix',
        head: branchName,
        base: baseRef,
        body: prCommentBody,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
    })

    /*
    console.log('Create PR response: ')
    console.log(createPR)
    */
}