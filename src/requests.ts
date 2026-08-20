import https from 'https';
import {calculateAuthorizationHeader} from './auth'
import fs from 'fs';
import FormData from 'form-data';
import { selectPlatfrom } from './select_platform';
import * as github from '@actions/github'

// Helper function to get proxy agent if proxy environment variables are set
function getProxyAgent(targetUrl: string): any {
    const url = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`);
    const isHttps = url.protocol === 'https:';
    
    // Check for proxy environment variables (case-insensitive)
    // Priority: HTTPS_PROXY > HTTP_PROXY > ALL_PROXY
    const proxyUrl = (isHttps ? (process.env.HTTPS_PROXY || process.env.https_proxy) : null) ||
                     (process.env.HTTP_PROXY || process.env.http_proxy) ||
                     (process.env.ALL_PROXY || process.env.all_proxy);
    
    if (!proxyUrl) {
        return undefined; // No proxy configured
    }
    
    try {
        // Try to use https-proxy-agent or http-proxy-agent packages if available
        // These packages handle CONNECT tunneling for HTTPS through HTTP proxies
        if (isHttps) {
            try {
                const { HttpsProxyAgent } = require('https-proxy-agent');
                return new HttpsProxyAgent(proxyUrl);
            } catch (e) {
                // Package not available, proxy won't be used
                // This is fine - Node.js https.request will work without proxy
                return undefined;
            }
        } else {
            try {
                const { HttpProxyAgent } = require('http-proxy-agent');
                return new HttpProxyAgent(proxyUrl);
            } catch (e) {
                // Package not available, proxy won't be used
                return undefined;
            }
        }
    } catch (e: any) {
        // Invalid proxy URL or other error, ignore and proceed without proxy
        console.warn(`Proxy configuration error: ${e?.message || e}, proceeding without proxy`);
        return undefined;
    }
}

// Helper function to make HTTPS GET requests with proper proxy support
function makeHttpsRequest(options: any): Promise<any> {
    // Add proxy agent if proxy environment variables are set
    const targetUrl = `https://${options.hostname}${options.path || ''}`;
    const agent = getProxyAgent(targetUrl);
    if (agent) {
        options.agent = agent;
    }
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    // Check Content-Type to determine how to parse response
                    const contentType = res.headers['content-type'] || '';
                    let responseData = data;
                    
                    if (contentType.includes('application/json')) {
                        responseData = data ? JSON.parse(data) : null;
                    }
                    // else: keep raw response as-is
                    
                    resolve({
                        status: res.statusCode,
                        statusText: res.statusMessage,
                        data: responseData,
                        headers: res.headers
                    });
                } catch (e) {
                    // If JSON parsing still fails, return raw data
                    resolve({
                        status: res.statusCode,
                        statusText: res.statusMessage,
                        data: data,
                        headers: res.headers
                    });
                }
            });
        });

        req.on('error', reject);
        req.end();
        return req;
    });
}

// Helper function to make HTTPS POST requests with FormData
function makeHttpsPostRequest(options: any, formData: any): Promise<any> {
    // Add proxy agent if proxy environment variables are set
    const targetUrl = `https://${options.hostname}${options.path || ''}`;
    const agent = getProxyAgent(targetUrl);
    if (agent) {
        options.agent = agent;
    }
    
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    let responseData = data;
                    
                    if (res.statusCode != 200) {
                        reject(new Error(`Request failed with status ${res.statusCode}: ${responseData}`));
                        return;
                    }
                    
                    try {
                        responseData = JSON.parse(data);
                    } catch (e) {
                        // Keep as string if not JSON
                    }
                    
                    resolve(responseData);
                } catch (parseError) {
                    reject(parseError);
                }
            });
        });

        req.on('error', reject);
        formData.pipe(req);
    });
}

export async function upload(platform:any, tar:any, options:any) {

    const fileBuffer: Buffer = fs.readFileSync('data.tar.gz');
    const formData = new FormData();
    formData.append('data', fileBuffer, 'data.tar.gz');
    formData.append('name', 'data');
    
    const authHeader = calculateAuthorizationHeader({
          id: platform.cleanedID,
          key: platform.cleanedKEY,
          host: platform.apiUrl,
          url: '/fix/v1/project/upload_code',
          method: 'POST',
    })

    if (options.DEBUG == 'true'){
        console.log('#######- DEBUG MODE -#######')
        console.log('requests.ts - upload')
        console.log('Formdata created')
        console.log(formData)
        console.log('ViD: '+platform.cleanedID+' Key: '+platform.cleanedKEY+' Host: '+platform.apiUrl+' URL: fix/v1/project/upload_code'+' Method: POST')
        console.log('Auth header created')
        console.log(authHeader)
        console.log('#######- DEBUG MODE -#######')
    }

    console.log('Uploading data.tar.gz to Veracode')

    const reqOptions = {
        hostname: platform.apiUrl,
        port: 443,
        path: '/fix/v1/project/upload_code',
        method: 'POST',
        headers: {
            'Authorization': authHeader,
            'X-CLIENT-TYPE': 'fix-github-action',
            ...formData.getHeaders()
        }
    };

    try {
        const responseData = await makeHttpsPostRequest(reqOptions, formData);
        console.log('Data uploaded successfully')

        // Extract projectId from response object
        // The API returns { projectId: "xxx" } or similar structure
        const projectId = responseData?.projectId || responseData?.project_id || responseData;

        console.log('Project ID is:')
        console.log(projectId);

        if (options.DEBUG == 'true'){
            console.log('#######- DEBUG MODE -#######')
            console.log('requests.ts - upload')
            console.log('Full API Response:')
            console.log(responseData)
            console.log('Extracted Project ID:')
            console.log(projectId)
            console.log('#######- DEBUG MODE -#######')
        }

        return projectId;
    } catch (error: any) {
        console.log('Error uploading data')
        if (options.DEBUG == 'true'){
            console.log('#######- DEBUG MODE -#######')
            console.log('requests.ts - upload')
            console.log(error.message || error)
            console.log('#######- DEBUG MODE -#######')
        }
        throw error;
    }

}

export async function uploadBatch(credentials:any, tarPath:any, options:any) {

    const platform:any = await selectPlatfrom(credentials)

    const fileBuffer: Buffer = fs.readFileSync(tarPath);
    const formData = new FormData();
    formData.append('data', fileBuffer, 'app.tar.gz');
    formData.append('name', 'data');
    
    const authHeader = calculateAuthorizationHeader({
          id: platform.cleanedID,
          key: platform.cleanedKEY,
          host: platform.apiUrl,
          url: '/fix/v1/project/batch_upload',
          method: 'POST',
    })

    if (options.DEBUG == 'true'){
        console.log('#######- DEBUG MODE -#######')
        console.log('requests.ts - upload')
        console.log('Formdata created')
        console.log(formData)
        console.log('ViD: '+platform.cleanedID+' Key: '+platform.cleanedKEY+' Host: '+platform.apiUrl+' URL: fix/v1/project/batch_upload'+' Method: POST')
        console.log('Auth header created')
        console.log(authHeader)
        console.log('#######- DEBUG MODE -#######')
    }

    console.log('Uploading app.tar.gz to Veracode')

    const reqOptions = {
        hostname: platform.apiUrl,
        port: 443,
        path: '/fix/v1/project/batch_upload',
        method: 'POST',
        headers: {
            'Authorization': authHeader,
            'X-CLIENT-TYPE': 'fix-github-action',
            ...formData.getHeaders()
        }
    };

    try {
        const responseData = await makeHttpsPostRequest(reqOptions, formData);
        console.log('Data uploaded successfully')

        // Extract projectId from response object
        // The API returns { projectId: "xxx" } or similar structure
        const projectId = responseData?.projectId || responseData?.project_id || responseData;

        console.log('Project ID is:')
        console.log(projectId);

        if (options.DEBUG == 'true') {
            console.log('#######- DEBUG MODE -#######')
            console.log('requests.ts - uploadBatch')
            console.log('Full API Response:')
            console.log(responseData)
            console.log('Extracted Project ID:')
            console.log(projectId)
            console.log('#######- DEBUG MODE -#######')
        }

        return projectId;
    } catch (error: any) {
        console.log('Error uploading data')
        if (options.DEBUG == 'true') {
            console.log('#######- DEBUG MODE -#######')
            console.log('requests.ts - uploadBatch')
            console.log(error.message || error)
            console.log('#######- DEBUG MODE -#######')
        }
        throw error;
    }

}


export async function checkFix(platform:any, projectId:any, options:any) {
    const results = await makeRequest(platform, projectId, options);
    return results;
}

async function makeRequest(platform:any, projectId:any, options:any) {
    const authHeader = calculateAuthorizationHeader({
        id: platform.cleanedID,
        key: platform.cleanedKEY,
        host: platform.apiUrl,
        url: '/fix/v1/project/' + projectId + '/results',
        method: 'GET',
    })

    if (options.DEBUG == 'true'){
        console.log('#######- DEBUG MODE -#######')
        console.log('requests.ts - cehckFix')
        console.log('ViD: '+platform.cleanedID+' Key: '+platform.cleanedKEY+' Host: '+platform.apiUrl+' URL: /fix/v1/project/'+projectId+'/results'+' Method: GET')
        console.log('Auth header created')
        console.log(authHeader)
        console.log('#######- DEBUG MODE -#######')
    }

    const reqOptions = {
        hostname: platform.apiUrl,
        port: 443,
        path: '/fix/v1/project/'+projectId+'/results',
        method: 'GET',
        headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
            'X-CLIENT-TYPE': 'fix-github-action'
        }
    };

    const response = await makeHttpsRequest(reqOptions);

    if (!response.data) {
        console.log('Response is empty. Retrying in 10 seconds.');
        await new Promise(resolve => setTimeout(resolve, 10000));
        return await makeRequest(platform, projectId, options);
    } else {
        console.log('Fixes fetched successfully');
        if (options.DEBUG == 'true'){
            console.log('#######- DEBUG MODE -#######')
            console.log('requests.ts - checkFix')
            console.log('Response:')
            console.log(response.data);
            console.log('#######- DEBUG MODE -#######')
        }
        return response.data;
    }
}

export async function checkFixBatch(platform:any, projectId:any, options:any) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const results = await makeRequestBatch(platform, projectId, options);
    return results;
}

async function makeRequestBatch(
    credentials:any,
    projectId:any,
    options:any,
    previousProcessedResults: number = 0,
    stagnantIterations: number = 0,
    startTime: number = Date.now(),
    lastProgressTime: number = Date.now(),
    sleepTimeSeconds: number = 5
) {

    const platform:any = await selectPlatfrom(credentials)

    const authHeader = calculateAuthorizationHeader({
        id: platform.cleanedID,
        key: platform.cleanedKEY,
        host: platform.apiUrl,
        url: '/fix/v1/project/' + projectId + '/batch_status',
        method: 'GET',
    })

    if (options.DEBUG == 'true'){
        console.log('#######- DEBUG MODE -#######')
        console.log('requests.ts - makeRequestBatch')
        console.log('ViD: '+platform.cleanedID+' Key: '+platform.cleanedKEY+' Host: '+platform.apiUrl+' URL: /fix/v1/project/'+projectId+'/batch_status'+' Method: GET')
        console.log('Auth header created')
        console.log(authHeader)
        console.log('#######- DEBUG MODE -#######')
    }

    const reqOptions = {
        hostname: platform.apiUrl,
        port: 443,
        path: '/fix/v1/project/'+projectId+'/batch_status',
        method: 'GET',
        headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
            'X-CLIENT-TYPE': 'fix-github-action'
        }
    };

    const response = await makeHttpsRequest(reqOptions);

    if (!response.data) {
        console.log('Response is empty. Something went wrong. No fixes generated. ');
        return 0
    } else {

        console.log('Status fetched successfully');

        // Handle potential response wrapper - unwrap if needed
        let statusData = response.data;
        if (statusData.data && statusData.processedResults === undefined && typeof statusData.data === 'object') {
            statusData = statusData.data;
        }

        if (options.DEBUG == 'true'){
            console.log('#######- DEBUG MODE -#######')
            console.log('requests.ts - makeRequestBatch')
            console.log('Original Response:')
            console.log(response.data);
            console.log('Processing Response:')
            console.log(statusData);
            console.log('#######- DEBUG MODE -#######')
        }

        const currentProcessedResults = typeof statusData.processedResults === 'number'
            ? statusData.processedResults
            : 0;
        const totalFlaws = typeof statusData.totalFlaws === 'number'
            ? statusData.totalFlaws
            : 0;

        // TIMEOUT CHECKS (3-tier logic)
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        const elapsedMinutes = Math.floor(elapsedSeconds / 60);

        // 1) Global timeout: 2 hours (7200 seconds)
        if (elapsedSeconds > 7200) {
            console.log(`❌ TIMEOUT: Global 2-hour limit exceeded (${elapsedMinutes} minutes elapsed)`);
            return 1; // Return 1 to proceed with available results
        }

        // 2) Startup timeout: 10 minutes if processedResults still 0
        if (currentProcessedResults === 0 && elapsedSeconds > 600) {
            console.log(`❌ TIMEOUT: Processing did not start within 10 minutes`);
            return 0; // Return 0 to fail completely
        }

        // 3) No-progress timeout: 5 minutes with no new results
        const timeSinceLastProgress = Math.floor((Date.now() - lastProgressTime) / 1000);
        if (currentProcessedResults > 0 && timeSinceLastProgress > 300) {
            console.log(`❌ TIMEOUT: No progress in last ${Math.floor(timeSinceLastProgress / 60)} minutes (stuck at ${currentProcessedResults}/${totalFlaws})`);
            return 1; // Return 1 to proceed with available results
        }

        // Log progress
        let progressMsg = `Status: ${currentProcessedResults}/${totalFlaws} processed`;
        if (totalFlaws > 0) {
            const percentage = Math.round((currentProcessedResults / totalFlaws) * 100);
            progressMsg += ` (${percentage}%)`;
        }
        progressMsg += ` | Elapsed: ${elapsedMinutes}m ${elapsedSeconds % 60}s`;
        console.log(progressMsg);

        // 1) Detect regression: processedResults decreased
        if (previousProcessedResults > 0 && currentProcessedResults < previousProcessedResults) {
            console.log(`⚠️  Regression detected: processedResults dropped from ${previousProcessedResults} to ${currentProcessedResults}. Proceeding to fetch results.`);
            return 1;
        }

        // 2) Track stagnation
        let nextStagnantIterations = stagnantIterations;
        let nextLastProgressTime = lastProgressTime;

        if (currentProcessedResults > previousProcessedResults) {
            // Progress made, reset stagnant counter
            nextStagnantIterations = 0;
            nextLastProgressTime = Date.now();
            console.log(`✓ Progress detected: +${currentProcessedResults - previousProcessedResults} new results`);
        } else if (currentProcessedResults === previousProcessedResults && currentProcessedResults > 0) {
            // No progress since last check, but have some results
            nextStagnantIterations += 1;
        } else {
            nextStagnantIterations += 1;
        }

        // 3) Handle stagnation after results have been processed
        if (nextStagnantIterations >= 10) {
            if (currentProcessedResults === 0) {
                console.log(`❌ STAGNATION: No results processed after 10 iterations. Failing.`);
                return 0;
            } else {
                console.log(`⚠️  STAGNATION: Results stuck at ${currentProcessedResults}/${totalFlaws} for 10 iterations. Proceeding to fetch.`);
                return 1;
            }
        }

        if (statusData.hasMore === true) {
            console.log(`📊 More fixes being generated. Retrying in ${sleepTimeSeconds} seconds...`);

            if (options.DEBUG == 'true'){
                console.log('#######- DEBUG MODE -#######')
                console.log('requests.ts - makeRequestBatch')
                console.log('Response:')
                console.log(statusData);
                console.log('Stagnant iterations so far:', nextStagnantIterations);
                console.log('Time since last progress:', timeSinceLastProgress, 'seconds');
                console.log('#######- DEBUG MODE -#######')
            }

            await new Promise(resolve => setTimeout(resolve, sleepTimeSeconds * 1000));
            return await makeRequestBatch(
                credentials,
                projectId,
                options,
                currentProcessedResults,
                nextStagnantIterations,
                startTime,
                nextLastProgressTime,
                sleepTimeSeconds
            );
        } else {
            // hasMore is false: normal completion
            console.log(`✅ Batch processing complete. hasMore=false`);
            return 1;
        }
    }
}

// Store for caching partial results between polling attempts
let cachedPartialResults: any = null;
let cachedFinalResults: any = null;

export async function pullBatchFixResults(credentials:any, projectId:any, options:any) {

    await new Promise(resolve => setTimeout(resolve, 5000));

    const platform:any = await selectPlatfrom(credentials)

    const authHeader = calculateAuthorizationHeader({
        id: platform.cleanedID,
        key: platform.cleanedKEY,
        host: platform.apiUrl,
        url: '/fix/v1/project/' + projectId + '/batch_results',
        method: 'GET',
    })

    if (options.DEBUG == 'true'){
        console.log('#######- DEBUG MODE -#######')
        console.log('requests.ts - pullBatchFixResults')
        console.log('ViD: '+platform.cleanedID+' Key: '+platform.cleanedKEY+' Host: '+platform.apiUrl+' URL: /fix/v1/project/'+projectId+'/batch_results'+' Method: GET')
        console.log('Auth header created')
        console.log(authHeader)
        console.log('#######- DEBUG MODE -#######')
    }

    const reqOptions = {
        hostname: platform.apiUrl,
        port: 443,
        path: '/fix/v1/project/'+projectId+'/batch_results',
        method: 'GET',
        headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
            'X-CLIENT-TYPE': 'fix-github-action'
        }
    };

    const response = await makeHttpsRequest(reqOptions);

    if (!response.data) {
        console.log('Response is empty.');
        // Return cached results if available
        if (cachedFinalResults) {
            console.log('Returning cached final results');
            return cachedFinalResults;
        }
        if (cachedPartialResults) {
            console.log('⚠️  Returning cached partial results (final not available)');
            return cachedPartialResults;
        }
        console.log('No results available. Something went wrong.');
        return 0;
    } else {
        console.log('Results fetched successfully');

        let transformedResults: any = null;
        let isPartial = false;
        let filesCount = 0;

        // Handle NEW response format with wrapper: { isPartial, batchResults: {...} }
        if (response.data.isPartial !== undefined && response.data.batchResults !== undefined) {
            console.log('Detected NEW response format with wrapper');
            isPartial = response.data.isPartial;
            filesCount = Object.keys(response.data.batchResults || {}).length;

            // Transform nested batchResults into expected format: { results: {...} }
            transformedResults = {
                results: response.data.batchResults
            };
            console.log(`Processing batch results (isPartial: ${isPartial}, files: ${filesCount})`);
        }
        // Handle OLD response format: { results: {...} } or direct structure
        else if (response.data.results !== undefined) {
            console.log('Detected OLD response format');
            transformedResults = response.data;
            filesCount = Object.keys(response.data.results || {}).length;
            isPartial = false;
        }
        // Handle unwrapped data
        else if (response.data.data && response.data.data.results !== undefined) {
            console.log('Detected wrapped response with data field');
            transformedResults = response.data.data;
            filesCount = Object.keys(response.data.data.results || {}).length;
            isPartial = false;
        }
        // Fallback: treat as results directly
        else {
            console.log('Detected direct results format or empty results');
            transformedResults = {
                results: response.data
            };
            filesCount = Object.keys(response.data).length;
            isPartial = false;
        }

        // Cache partial and final results
        if (isPartial && filesCount > 0) {
            console.log(`📦 Caching partial results (${filesCount} files)`);
            cachedPartialResults = transformedResults;
        } else if (!isPartial && filesCount > 0) {
            console.log(`✅ Caching final results (${filesCount} files)`);
            cachedFinalResults = transformedResults;
        }

        if (options.DEBUG == 'true'){
            console.log('#######- DEBUG MODE -#######')
            console.log('requests.ts - pullBatchFixResults')
            console.log('Original Response:')
            console.log(response.data);
            console.log('Transformed Results:')
            console.log(transformedResults);
            console.log('Is Partial:', isPartial);
            console.log('Files Count:', filesCount);
            console.log('Cached Partial Available:', !!cachedPartialResults);
            console.log('Cached Final Available:', !!cachedFinalResults);
            console.log('#######- DEBUG MODE -#######')
        }

        // store the response in a file
        fs.writeFileSync('batch_fix_results.json', JSON.stringify(transformedResults, null, 2));
        console.log('Batch fix results stored in batch_fix_results.json');

        // upload the file as an artifact
        const artifactName = 'veracode-fix-results';
        const artifact = require('@actions/artifact');
        const artifactClient = artifact.default;
        const rootDirectory = process.cwd();
        const filesToUpload = ['batch_fix_results.json'];
        await artifactClient.uploadArtifact(artifactName, filesToUpload, rootDirectory);
        console.log('Batch fix results artifact uploaded');

        return transformedResults;
    }
}

export async function getFilesPartOfPR(options:any) {

    const octokit = github.getOctokit(options.token);

    const context = github.context
    const prID:any = context.payload.pull_request?.number
    const repository:any = process.env.GITHUB_REPOSITORY
    const repo = repository.split("/");

    let page = 1;
    let files:any = [];

    while (true) {
        const response = await octokit.request('GET /repos/'+repo[0]+'/'+repo[1]+'/pulls/'+prID+'/files', {
            owner: repo[0],
            repo: repo[1],
            pull_number: prID,
            per_page: 100,
            page: page,
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });

        if (!response.data) {
            console.log('Response is empty. Something went wrong. No files identified. ');
            return 0
        }

        files = files.concat(response.data);

        if (!response.headers.link || !response.headers.link.includes('rel="next"')) {
            break;
        }

        page++;
    }


    if (options.DEBUG == 'true'){
        console.log('#######- DEBUG MODE -#######')
        console.log('requests.ts - getFilesPartOfPR')
        console.log('Files changed in PR:')
        console.log(files);
        console.log('#######- DEBUG MODE -#######')
    }
    return files;
}
