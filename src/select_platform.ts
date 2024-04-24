

export async function selectPlatfrom(creds:any){
    let requestParameters = {}
    if ( creds.vid.startsWith('vera01ei-') ){
        requestParameters = {
            apiUrl : 'api.veracode.eu',
            cleanedID : creds.vid?.replace('vera01ei-','') ?? '',
            cleanedKEY : creds.vkey?.replace('vera01es-','') ?? ''
        }
        console.log('Region: EU')
    }
    else {
        requestParameters = {
            apiUrl : 'api.veracode.com',
            cleanedID : creds.vid,
            cleanedKEY : creds.vkey
        }
        console.log('Region: US')
    }
    return requestParameters
}