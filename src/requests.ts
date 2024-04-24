import axios from 'axios';
import {calculateAuthorizationHeader} from './auth'
import fs from 'fs';
import FormData from 'form-data';
import { selectPlatfrom } from './select_platform';


export async function upload(platform:any, tar:any, options:any) {

    const fileBuffer: Buffer = fs.readFileSync('data.tar.gz');
    const formData = new FormData();
    formData.append('data', fileBuffer, 'data.tar.gz');
    formData.append('name', 'data');
    
    const authHeader = await calculateAuthorizationHeader({
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

    const response = await axios.post('https://'+platform.apiUrl+'/fix/v1/project/upload_code', formData, {
        headers: {
            'Authorization': authHeader,
            ...formData.getHeaders()
        }
    });

    if (response.status != 200){
        console.log('Error uploading data')
        if (options.DEBUG == 'true'){
            console.log('#######- DEBUG MODE -#######')
            console.log('requests.ts - upload')
            console.log(response.data)
            console.log('#######- DEBUG MODE -#######')
        }
    }
    else {
        console.log('Data uploaded successfully')
        console.log('Project ID is:')
        console.log(response.data);
        return response.data
    }

}

export async function uploadBatch(credentials:any, tar:any, options:any) {

    const platform:any = await selectPlatfrom(credentials)

    const fileBuffer: Buffer = fs.readFileSync('app.tar.gz');
    const formData = new FormData();
    formData.append('data', fileBuffer, 'app.tar.gz');
    formData.append('name', 'data');
    
    const authHeader = await calculateAuthorizationHeader({
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

    const response = await axios.post('https://'+platform.apiUrl+'/fix/v1/project/batch_upload', formData, {
        headers: {
            'Authorization': authHeader,
            ...formData.getHeaders()
        }
    });

    if (response.status != 200){
        console.log('Error uploading data')
        if (options.DEBUG == 'true'){
            console.log('#######- DEBUG MODE -#######')
            console.log('requests.ts - upload')
            console.log(response.data)
            console.log('#######- DEBUG MODE -#######')
        }
    }
    else {
        console.log('Data uploaded successfully')
        console.log('Project ID is:')
        console.log(response.data);
        return response.data
    }

}


export async function checkFix(platform:any, projectId:any, options:any) {
    const results = await makeRequest(platform, projectId, options);
    return results;
}

async function makeRequest(platform:any, projectId:any, options:any) {
    const authHeader = await calculateAuthorizationHeader({
        id: platform.cleanedID,
        key: platform.cleanedKEY,
        host: platform.apiUrl,
        url: '/fix/v1/project/'+projectId+'/results',
        method: 'GET',
    })

    if (options.DEBUG == 'true'){
        console.log('#######- DEBUG MODE -#######')
        console.log('requests.ts - cehckFix')
        console.log('ViD: '+platform.cleanedID+' Key: '+platform.cleanedKEY+' Host: '+platform.apiUrl+' URL: /fix/v1/project/'+projectId+'/results'+' Method: POST')
        console.log('Auth header created')
        console.log(authHeader)
        console.log('#######- DEBUG MODE -#######')
    }

    const response = await axios.get('https://'+platform.apiUrl+'/fix/v1/project/'+projectId+'/results', {
        headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
        }
    })

     if (!response.data) {
        console.log('Response is empty. Retrying in 10 seconds.');
        await new Promise(resolve => setTimeout(resolve, 10000));
        return await makeRequest(platform, projectId, options);
    } else {
        console.log('Fixes fetched successfully');
        if (options.DEBUG == 'true'){
            console.log('#######- DEBUG MODE -#######')
            console.log('requests.ts - cehckFix')
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

    const authHeader = await calculateAuthorizationHeader({
        id: platform.cleanedID,
        key: platform.cleanedKEY,
        host: platform.apiUrl,
        url: '/fix/v1/project/'+projectId+'/batch_status',
        method: 'GET',
    })

    if (options.DEBUG == 'true'){
        console.log('#######- DEBUG MODE -#######')
        console.log('requests.ts - makeRequestBatch')
        console.log('ViD: '+platform.cleanedID+' Key: '+platform.cleanedKEY+' Host: '+platform.apiUrl+' URL: /fix/v1/project/'+projectId+'/results'+' Method: POST')
        console.log('Auth header created')
        console.log(authHeader)
        console.log('#######- DEBUG MODE -#######')
    }

    const response = await axios.get('https://'+platform.apiUrl+'/fix/v1/project/'+projectId+'/batch_status', {
        headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
        }
    })


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

    const authHeader = await calculateAuthorizationHeader({
        id: platform.cleanedID,
        key: platform.cleanedKEY,
        host: platform.apiUrl,
        url: '/fix/v1/project/'+projectId+'/batch_results',
        method: 'GET',
    })

    if (options.DEBUG == 'true'){
        console.log('#######- DEBUG MODE -#######')
        console.log('requests.ts - pullBatchFixResults')
        console.log('ViD: '+platform.cleanedID+' Key: '+platform.cleanedKEY+' Host: '+platform.apiUrl+' URL: /fix/v1/project/'+projectId+'/results'+' Method: POST')
        console.log('Auth header created')
        console.log(authHeader)
        console.log('#######- DEBUG MODE -#######')
    }

    const response = await axios.get('https://'+platform.apiUrl+'/fix/v1/project/'+projectId+'/batch_results', {
        headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
        }
    })

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