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
                summary: 'Will create Veracode Fix suggestions as PR annotations',
                text: 'Will create Veracode Fix suggestions as PR annotations'
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

        // Collect all annotations first
        let allAnnotations: any[] = [];

        //Let's check if there are multiple hunks on the first fix result
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
                
                // Add annotation to collection instead of sending immediately
                allAnnotations.push({
                    path: flawInfo.sourceFile,
                    start_line: startLineOriginal,
                    end_line: endLineNew,
                    annotation_level: 'warning',
                    title: 'Security findings between line numbers '+startLineOriginal+' and '+endLineNew,
                    message: cleanedHunk,
                });
            };
        }

        // Send all annotations in a single update
        if (allAnnotations.length > 0) {
            const response = await octokit.request('PATCH /repos/'+repo[0]+'/'+repo[1]+'/check-runs/'+options.checkRunID, {
                status: 'in_progress',
                output: {
                    title: 'Veracode Fix suggestions',
                    summary: 'Will create Veracode Fix suggestions as PR annotations',
                    text: 'Will create Veracode Fix suggestions as PR annotations',
                    annotations: allAnnotations
                },
                headers: {
                'X-GitHub-Api-Version': '2022-11-28'
                }
            })
            console.log('Check run updated with ' + allAnnotations.length + ' annotations')

            if (options.DEBUG == 'true'){
                console.log('#######- DEBUG MODE -#######')
                console.log('checkRun.ts - updateCheckRunUpdate')
                console.log(response)
                console.log('#######- DEBUG MODE -#######')
            }
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
        
        // Collect all annotations first
        let allAnnotations: any[] = [];

        //Let's check if there are multiple hunks on the first fix result
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
         
                        // Add annotation to collection instead of sending immediately
                        allAnnotations.push({
                            path: cleanedSourceFile,
                            start_line: startLineOriginal,
                            end_line: endLineNew,
                            annotation_level: 'warning',
                            title: 'Security findings between line numbers '+startLineOriginal+' and '+endLineNew,
                            message: cleanedHunk,
                        });
                    };
                }
            }
        }

        // Send all annotations in a single update
        if (allAnnotations.length > 0) {
            const response = await octokit.request('PATCH /repos/'+repo[0]+'/'+repo[1]+'/check-runs/'+options.checkRunID, {
                status: 'in_progress',
                output: {
                    title: 'Veracode Fix suggestions',
                    summary: 'Will create Veracode Fix suggestions as PR annotation',
                    text: 'Will create Veracode Fix suggestions as PR annotation',
                    annotations: allAnnotations
                },
                headers: {
                'X-GitHub-Api-Version': '2022-11-28'
                }
            })
            console.log('Check run updated with ' + allAnnotations.length + ' annotations')
            if (options.DEBUG == 'true'){
                console.log('#######- DEBUG MODE -#######')
                console.log('checkRun.ts - updateCheckRunUpdateBatch')
                console.log('Response')
                console.log(response)
                console.log('#######- DEBUG MODE -#######')
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

/**
 * Create check run annotations for a newly created PR with fixes
 * This aligns scan findings with the patches that were applied
 */
export async function createCheckRunAnnotationsForPR(
    options: any,
    prResponse: any,
    fixResults: any,
    flawArray: any
) {
    const repository: any = process.env.GITHUB_REPOSITORY
    const repo = repository.split("/");
    const owner = repo[0]
    const repoName = repo[1]
    const prNumber = prResponse.data.number
    const headSha = prResponse.data.head.sha

    if (options.DEBUG == 'true') {
        console.log('#######- DEBUG MODE -#######')
        console.log('checkRun.ts - createCheckRunAnnotationsForPR')
        console.log('PR Number: ' + prNumber)
        console.log('Head SHA: ' + headSha)
        console.log('#######- DEBUG MODE -#######')
    }

    const octokit = new Octokit({
        auth: options.token
    })

    try {
        // Create a check run for the new PR branch
        const checkRunResponse = await octokit.request('POST /repos/' + owner + '/' + repoName + '/check-runs', {
            owner: owner,
            repo: repoName,
            name: 'Veracode Fix - Scan Findings',
            head_sha: headSha,
            status: 'in_progress',
            output: {
                title: 'Veracode Fix - Scan Findings',
                summary: 'Scan findings aligned with applied fixes',
                text: 'Scan findings aligned with applied fixes'
            },
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
            }
        })

        const checkRunID = checkRunResponse.data.id
        console.log('Check run created for PR #' + prNumber + ' with ID: ' + checkRunID)

        // Collect all annotations aligned with the patches
        let allAnnotations: any[] = []

        // Iterate through each file that was fixed
        for (let key in fixResults.results) {
            const fileResult = fixResults.results[key]
            const patches = fileResult.patch || []
            const flaws = fileResult.flaws || []

            // Parse patches to get line number mappings
            for (let i = 0; i < patches.length; i++) {
                const patch = patches[i]

                if (patch.indexOf('@@') > 0) {
                    const cleanedPatch = patch.replace(/^---.*$\n?|^\+\+\+.*$\n?/gm, '')
                    const sourceFileMatch = patch.match(/---\s(.*)\n/)
                    const cleanedSourceFile = sourceFileMatch ? sourceFileMatch[1].replace(/^a\//, '').replace(/^b\//, '') : key
                    const hunks = cleanedPatch.split(/(?=@@ -\d+,\d+ \+\d+,\d+ @@\n)/)

                    for (let j = 0; j < hunks.length; j++) {
                        const hunkLines = hunks[j].split('\n')
                        const hunkHeader = hunkLines[0]
                        const hunkHeaderMatch = hunkHeader.match(/@@ -(\d+),\d+ \+(\d+),(\d+) @@/)

                        if (!hunkHeaderMatch) {
                            continue
                        }

                        const startLineOriginal = parseInt(hunkHeaderMatch[1])
                        const startLineNew = parseInt(hunkHeaderMatch[2])
                        const lineCountNew = parseInt(hunkHeaderMatch[3])
                        const endLineNew = startLineNew + lineCountNew - 1

                        // Find flaws that match this hunk's line range
                        for (let k = 0; k < flaws.length; k++) {
                            const flaw = flaws[k]
                            const flawLine = flaw.line

                            // Check if flaw line is within the original range (before patch)
                            // The annotation should point to the new line number after patch
                            if (flawLine >= startLineOriginal && flawLine <= startLineOriginal + 20) {
                                // Calculate the new line number after patch application
                                const lineOffset = startLineNew - startLineOriginal
                                const newFlawLine = flawLine + lineOffset

                                // Find the flaw details from flawArray
                                let flawDetails: any = null
                                for (let flawKey in flawArray) {
                                    flawDetails = flawArray[flawKey].find((f: any) => f.issue_id === flaw.issueId)
                                    if (flawDetails) break
                                }

                                const cweId = flaw.CWEId || flawDetails?.cwe_id || 'Unknown'
                                const issueType = flawDetails?.issue_type || 'Security Finding'
                                const severity = flawDetails?.severity || 'Unknown'
                                const displayText = flawDetails?.display_text || flawDetails?.description || 'No description available'

                                // Build the full annotation message with flaw description
                                let annotationMessage = `**Security finding fixed on line ${newFlawLine}**\n\n`
                                annotationMessage += `**Issue ID:** ${flaw.issueId}\n`
                                annotationMessage += `**CWE:** ${cweId}\n`
                                annotationMessage += `**Issue Type:** ${issueType}\n`
                                annotationMessage += `**Severity:** ${severity}\n\n`
                                annotationMessage += `**Description:**\n${displayText}\n\n`
                                annotationMessage += `This finding was addressed in the applied patch.`

                                // Create annotation aligned with the patch
                                allAnnotations.push({
                                    path: cleanedSourceFile,
                                    start_line: newFlawLine,
                                    end_line: newFlawLine,
                                    annotation_level: 'warning',
                                    title: `CWE-${cweId}: ${issueType} (Severity: ${severity})`,
                                    message: annotationMessage
                                })
                            }
                        }
                    }
                }
            }
        }

        // Update check run with all annotations
        if (allAnnotations.length > 0) {
            await octokit.request('PATCH /repos/' + owner + '/' + repoName + '/check-runs/' + checkRunID, {
                owner: owner,
                repo: repoName,
                status: 'completed',
                conclusion: 'success',
                output: {
                    title: 'Veracode Fix - Scan Findings',
                    summary: `Found ${allAnnotations.length} scan findings aligned with applied fixes`,
                    text: `Found ${allAnnotations.length} scan findings aligned with applied fixes`,
                    annotations: allAnnotations
                },
                headers: {
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            })
            console.log('Check run updated with ' + allAnnotations.length + ' annotations for PR #' + prNumber)
        } else {
            // Close check run even if no annotations
            await octokit.request('PATCH /repos/' + owner + '/' + repoName + '/check-runs/' + checkRunID, {
                owner: owner,
                repo: repoName,
                status: 'completed',
                conclusion: 'success',
                output: {
                    title: 'Veracode Fix - Scan Findings',
                    summary: 'No annotations to add',
                    text: 'No annotations to add'
                },
                headers: {
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            })
        }

        return checkRunID
    } catch (error: any) {
        console.log('Error creating check run annotations for PR:', error.message || error)
        if (options.DEBUG == 'true') {
            console.log('#######- DEBUG MODE -#######')
            console.log('Error details:', error.request || error.response || error)
            console.log('#######- DEBUG MODE -#######')
        }
        throw error
    }
}