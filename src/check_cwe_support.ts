
const CWESupportMatrix = {
    "individual": {
      "java": ["117", "80", "404", "159", "209", "597", "89", "611", "331", "327", "113", "601", "502"],
      "cs": ["80", "117", "352", "73", "404", "89", "209", "316", "601", "327", "331", "611"],
      "js": ["80", "117", "89", "73", "601", "352", "78", "209", "327", "312", "614", "311", "611", "113"],
      "php": ["80", "73", "89", "117"],
      "py": ["80", "73", "331", "327", "295", "601", "78", "89", "757"],
      "kotlin": ["80", "89", "113", "117", "331", "404"],
      "scala": ["611", "117", "80", "78"],
      "go": ["73", "78", "117"],
      "ruby": ["73", "80", "89", "117", "601"]
    },
    "batch": {
      "java": ["117", "80", "404", "159", "209", "597", "89", "611", "331", "113"],
      "cs": ["80", "117", "352", "404", "89", "209", "316", "331", "611"],
      "js": ["80", "117", "89", "352", "78", "209", "614", "611", "113"],
      "php": ["80", "89", "117"],
      "py": ["80", "331", "295", "78", "89", "757"],
      "kotlin": ["80", "89", "113", "117", "331", "404"],
      "scala": ["611", "117", "80", "78"],
      "go": ["73", "78", "117"],
      "ruby": ["73", "80", "89", "117", "601"]
    }
  }

export async function checkCWE(flawInfo:any, options:any,batchFix=false){ 
    if (flawInfo.language == 'java'){
        console.log('CWE check for Java')
        const supportedCWEs = batchFix ? CWESupportMatrix.batch.java : CWESupportMatrix.individual.java
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
        const supportedCWEs = batchFix ? CWESupportMatrix.batch.cs : CWESupportMatrix.individual.cs
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
        const supportedCWEs = batchFix ? CWESupportMatrix.batch.js : CWESupportMatrix.individual.js
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
        const supportedCWEs = batchFix ? CWESupportMatrix.batch.py : CWESupportMatrix.individual.py
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
        const supportedCWEs = batchFix ? CWESupportMatrix.batch.php : CWESupportMatrix.individual.php
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
        const supportedCWEs = batchFix ? CWESupportMatrix.batch.scala : CWESupportMatrix.individual.scala
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
        const supportedCWEs = batchFix ? CWESupportMatrix.batch.kotlin : CWESupportMatrix.individual.kotlin
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
        const supportedCWEs = batchFix ? CWESupportMatrix.batch.go : CWESupportMatrix.individual.go
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