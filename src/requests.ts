import https from 'https';
import {calculateAuthorizationHeader} from './auth'
import fs from 'fs';
import FormData from 'form-data';
import { selectPlatfrom } from './select_platform';
import * as github from '@actions/github'

// Helper function to make HTTPS GET requests with proper proxy support
function makeHttpsRequest(options: any): Promise<any> {
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
        console.log('Project ID is:')
        console.log(responseData);
        return responseData;
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
        console.log('Project ID is:')
        console.log(responseData);
        return responseData;
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

async function makeRequestBatch(credentials:any, projectId:any, options:any) {

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
        console.log('Response is empty. Something went wrong. No fixes generarted. ');
        return 0
    } else {
        
        console.log('Status fetched successfully');
        if (options.DEBUG == 'true'){
            console.log('#######- DEBUG MODE -#######')
            console.log('requests.ts - makeRequestBatch')
            console.log('Response:')
            console.log(response.data);
            console.log('#######- DEBUG MODE -#######')
        }

        if ( response.data.hasMore == true){
            console.log('More fixes are being generated. Retrying in 10 seconds.');

            if (options.DEBUG == 'true'){
                console.log('#######- DEBUG MODE -#######')
                console.log('requests.ts - makeRequestBatch')
                console.log('Response:')
                console.log(response.data);
                console.log('#######- DEBUG MODE -#######')
            }

            await new Promise(resolve => setTimeout(resolve, 10000));
            return await makeRequestBatch(credentials, projectId, options);
        }
        else {
            return 1;
        }
    }
}

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
        console.log('Response is empty. Something went wrong. No fixes generarted. ');
        return 0
    } else {
        console.log('Fixes fetched successfully');
        if (options.DEBUG == 'true'){
            console.log('#######- DEBUG MODE -#######')
            console.log('requests.ts - pullBatchFixResults')
            console.log('Response:')
            console.log(response.data);
            console.log('#######- DEBUG MODE -#######')
        }
        return response.data;
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