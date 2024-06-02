export async function checkCWE(flawInfo:any, options:any) {
    if (flawInfo.language == 'java'){
        console.log('CWE check for Java')
        const supportedCWEs = [80,89,113,117,327,331,382,470,597,601]
        if (supportedCWEs.includes(flawInfo.cweID)){

            if (options.DEBUG == 'true'){
                console.log('#######- DEBUG MODE -#######')
                console.log('check_cwe_support.ts')
                console.log('CWE '+flawInfo.cweID+' is supported for Java')
                console.log('#######- DEBUG MODE -#######')
            }
            return true
        }
        else {
            if (options.DEBUG == 'true'){
                console.log('#######- DEBUG MODE -#######')
                console.log('check_cwe_support.ts')
                console.log('Checks - CWE '+flawInfo.CWE+' is not supported Java')
                console.log('#######- DEBUG MODE -#######')
            }
            return false
        }
    }
    else if (flawInfo.language == 'csharp'){
        console.log('CWE check for C#')
        const supportedCWEs = [80,89,201,209,259,352,404,601,611,798]
        if (supportedCWEs.includes(flawInfo.cweID)){
            if (options.DEBUG == 'true'){
                console.log('#######- DEBUG MODE -#######')
                console.log('check_cwe_support.ts')
                console.log('Checks - CWE '+flawInfo.cweID+' is supported for csharp')
                console.log('#######- DEBUG MODE -#######')
            }
            return true
        }
        else {
            if (options.DEBUG == 'true'){
                console.log('#######- DEBUG MODE -#######')
                console.log('check_cwe_support.ts')
                console.log('Checks - CWE '+flawInfo.cweID+' is not supported sharp')
                console.log('#######- DEBUG MODE -#######')
            }
            return false
        }
    }
    else if (flawInfo.language == 'javascript'){
        if (options.DEBUG == 'true'){
            console.log('#######- DEBUG MODE -#######')
            console.log('check_cwe_support.ts')
            console.log('CWE check for JavaScript')
            console.log('#######- DEBUG MODE -#######')
        }
        const supportedCWEs = [73,78,80,113,117,327,611,614]
        if (supportedCWEs.includes(flawInfo.cweID)){
            if (options.DEBUG == 'true'){
                console.log('#######- DEBUG MODE -#######')
                console.log('check_cwe_support.ts')
                console.log('Checks - CWE '+flawInfo.cweID+' is supported for JavaScript')
                console.log('#######- DEBUG MODE -#######')
            }
            return true
        }
        else {
            if (options.DEBUG == 'true'){
                console.log('#######- DEBUG MODE -#######')
                console.log('check_cwe_support.ts')
                console.log('Checks - CWE '+flawInfo.cweID+' is not supported JavaScript')
                console.log('#######- DEBUG MODE -#######')
            }
            return false
        }
    }
    else if (flawInfo.language == 'python'){
        console.log('CWE check for Python')
        const supportedCWEs = [73,78,80,89,295,327,331,601,757]
        if (supportedCWEs.includes(flawInfo.cweID)){
            if (options.DEBUG == 'true'){
                console.log('#######- DEBUG MODE -#######')
                console.log('check_cwe_support.ts')
                console.log('Checks - CWE '+flawInfo.cweID+' is supported for Python')
                console.log('#######- DEBUG MODE -#######')
            }
            return true
        }
        else {
            if (options.DEBUG == 'true'){
                console.log('#######- DEBUG MODE -#######')
                console.log('check_cwe_support.ts')
                console.log('Checks - CWE '+flawInfo.cweID+' is not supported Python')
                console.log('#######- DEBUG MODE -#######')
            }
            return false
        }
    }
    else if (flawInfo.language == 'php'){
        console.log('CWE check for PHP')
        const supportedCWEs = [73,80,89,117]
        if (supportedCWEs.includes(flawInfo.cweID)){
            if (options.DEBUG == 'true'){
                console.log('#######- DEBUG MODE -#######')
                console.log('check_cwe_support.ts')
                console.log('Checks - CWE '+flawInfo.cweID+' is supported for PHP')
                console.log('#######- DEBUG MODE -#######')
            }
            return true
        }
        else {
            if (options.DEBUG == 'true'){
                console.log('#######- DEBUG MODE -#######')
                console.log('check_cwe_support.ts')
                console.log('Checks - CWE '+flawInfo.cweID+' is not supported PHP')
                console.log('#######- DEBUG MODE -#######')
            }
            return false
        }
    }
    else if (flawInfo.language == 'scala'){
        console.log('CWE check for Scala')
        const supportedCWEs = [78,80,89,117,611]
        if (supportedCWEs.includes(flawInfo.cweID)){
            if (options.DEBUG == 'true'){
                console.log('#######- DEBUG MODE -#######')
                console.log('check_cwe_support.ts')
                console.log('Checks - CWE '+flawInfo.cweID+' is supported for Scala')
                console.log('#######- DEBUG MODE -#######')
            }
            return true
        }
        else {
            if (options.DEBUG == 'true'){
                console.log('#######- DEBUG MODE -#######')
                console.log('check_cwe_support.ts')
                console.log('Checks - CWE '+flawInfo.cweID+' is not supported Scala')
                console.log('#######- DEBUG MODE -#######')
            }
            return false
        }
    }
    else if (flawInfo.language == 'kotlin'){
        console.log('CWE check for Kotlin')
        const supportedCWEs = [80,89,113,117,331]
        if (supportedCWEs.includes(flawInfo.cweID)){
            if (options.DEBUG == 'true'){
                console.log('#######- DEBUG MODE -#######')
                console.log('check_cwe_support.ts')
                console.log('Checks - CWE '+flawInfo.cweID+' is supported for Kotlin')
                console.log('#######- DEBUG MODE -#######')
            }
            return true
        }
        else {
            if (options.DEBUG == 'true'){
                console.log('#######- DEBUG MODE -#######')
                console.log('check_cwe_support.ts')
                console.log('Checks - CWE '+flawInfo.cweID+' is not supported Kotlin')
                console.log('#######- DEBUG MODE -#######')
            }
            return false
        }
    }
    else if (flawInfo.language == 'go'){
        console.log('CWE check for Go')
        const supportedCWEs = [73,78,117]
        if (supportedCWEs.includes(flawInfo.cweID)){
            if (options.DEBUG == 'true'){
                console.log('#######- DEBUG MODE -#######')
                console.log('check_cwe_support.ts')
                console.log('Checks - CWE '+flawInfo.cweID+' is supported for Go')
                console.log('#######- DEBUG MODE -#######')
            }
            return true
        }
        else {
            if (options.DEBUG == 'true'){
                console.log('#######- DEBUG MODE -#######')
                console.log('check_cwe_support.ts')
                console.log('Checks - CWE '+flawInfo.cweID+' is not supported Go')
                console.log('#######- DEBUG MODE -#######')
            }
            return false
        }
    }
}