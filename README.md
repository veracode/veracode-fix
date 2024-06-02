# Veracode Fix  Action



## About
This action will use the Veracode's AI assisted remediation service Veracode-Fix. For more information please see the official product page at https://www.veracode.com/fix and the official at https://docs.veracode.com/r/veracode_fix.
The action is based on the results of Veracode's pipeline-scan action. The Veracode pipeline-scan can store results with all flaws identified (`results.json`), or filtered results (`filtered_results.json`). Based on the results you provide to this actions fixes will be created.
It will take the results file and create fixes for the flaws that are found in the scan. The fixes will be created in the form of a code suggestion that can be applied to the source code. The action will create a comment on the PR with the fixes for every flaw that is fixable. That could lead to a lot of comments on the PR. We reccomend to run it with the batch option.
If the pipeline-scan for exampe is used with a baseline file to sort out already known flaws and you provide the `filtered_results.json` file as in inptu to tis action, it will only create fixes for the new flaws identified in the scan. 
-> Code suggestions generated will heavily depend on the input data.

The action will also automatically use the first code suggested provied by Veracode Fix. The first suggestion is the most likely to be the best one. However there could be situations where the first suggestion is not the best one. In this case you can use the Veracode Fix solution on your IDE or the Veracode CLI to see more suggestions and apply them manually.

Veracode Fix supports the following languagess and CWE's right now, please review the official documentation at https://docs.veracode.com/r/About_Veracode_Fix.

| Language | CWEs |
| --- | --- |
| C# | 73: External Control of File Name or Path
80: Improper Neutralization of Script-Related HTML Tags in a Web Page (HTML Injection)
89: Improper Neutralization of Special Elements used in an SQL Command (SQL Injection)
117: Improper Output Neutralization for Logs
201: Information Exposure Through Sent Data
209: Information Exposure Through an Error Message
316: Cleartext Storage of Sensitive Information in Memory
327: Use of a Broken or Risky Cryptographic Algorithm
331: Insufficient Entropy
352: Cross-Site Request Forgery (CSRF)
404: Improper Resource Shutdown or Release
601: URL Redirection to Untrusted Site ('Open Redirect')
611: Improper Restriction of XML External Entity Reference |
| Java | 80: Improper Neutralization of Script-Related HTML Tags in a Web Page (HTML Injection)
89: Improper Neutralization of Special Elements used in an SQL Command (SQL Injection)
113: Improper Neutralization of CRLF Sequences in HTTP Headers
117: Improper Output Neutralization for Logs
159: Improper Handling of Invalid Use of Special Elements
209: Generation of Error Message Containing Sensitive Information
327: Use of a Broken or Risky Cryptographic Algorithm
331: Insufficient Entropy
404: Improper Resource Shutdown or Release
502: Deserialization of Untrusted Data
597: Use of Wrong Operator in String Comparison
601: URL Redirection to Untrusted Site ('Open Redirect')
611: Improper Restriction of XML External Entity Reference |
| JavaScript & Typescript | 73: External Control of File Name or Path
78: Improper Neutralization of Special Elements used in an OS Command ('OS Command Injection')
80: Improper Neutralization of Script-Related HTML Tags in a Web Page (HTML Injection)
89: Improper Neutralization of Special Elements used in an SQL Command (SQL Injection)
113: Improper Neutralization of CRLF Sequences in HTTP Headers
117: Improper Output Neutralization for Logs
209: Generation of Error Message Containing Sensitive Information
311: Missing Encryption of Sensitive Data
312: Cleartext Storage of Sensitive Information
327: Use of a Broken or Risky Cryptographic Algorithm
352: Cross-Site Request Forgery (CSRF)
601: URL Redirection to Untrusted Site ('Open Redirect')
611: Improper Restriction of XML External Entity Reference
614: Sensitive Cookie in HTTPS Session Without 'Secure' Attribute |
| Python | 73: External Control of File Name or Path
78: Improper Neutralization of Special Elements used in an OS Command ('OS Command Injection')
80: Improper Neutralization of Script-Related HTML Tags in a Web Page (HTML Injection)
89: Improper Neutralization of Special Elements used in an SQL Command (SQL Injection)
295: Improper Certificate Validation
327: Use of a Broken or Risky Cryptographic Algorithm
331: Insufficient Entropy
601: URL Redirection to Untrusted Site ('Open Redirect')
757: Selection of Less-Secure Algorithm During Negotiation ('Algorithm Downgrade') |
| Kotline | 80: Improper Neutralization of Script-Related HTML Tags in a Web Page (HTML Injection)
89: Improper Neutralization of Special Elements used in an SQL Command (SQL Injection)
113: Improper Neutralization of CRLF Sequences in HTTP Headers
117: Improper Output Neutralization for Logs
331: Insufficient Entropy |
| Scala | 78: Improper Neutralization of Special Elements used in an OS Command ('OS Command Injection')
80: Improper Neutralization of Script-Related HTML Tags in a Web Page (HTML Injection)
89: Improper Neutralization of Special Elements used in an SQL Command (SQL Injection)
117: Improper Output Neutralization for Logs
611: Improper Restriction of XML External Entity Reference |
| PHP | 73: External Control of File Name or Path
80: Improper Neutralization of Script-Related HTML Tags in a Web Page (HTML Injection)
89: Improper Neutralization of Special Elements used in an SQL Command (SQL Injection)
117: Improper Output Neutralization for Logs |
| Go | 73: External Control of File Name or Path
78: Improper Neutralization of Special Elements used in an OS Command ('OS Command Injection')
117: Improper Output Neutralization for Logs |

## Usage

* Required
  * vid
    * the Veracode API ID
  * vkey
    * the Veracode API Secret Key
  * inputFile
    * The results file from a Veracode pipeline scan. Please make sure pipeline-scan is run wiht `--esd true`
  * language:
    The language the source code is written in. (will go away at some point in time)
  * fixType
    * The type of fix to generate, either `single` or `batch` 
  * files
    * Filter on `all` or on `changed` files only. 
  
* Optional
  * cwe
    * A single CWE or a comma separated list of CWEs to filter on and generate fix suggestions for
  * source_base_path_1
    * Rewrite path 1, in some cases the source file is on a different path than the one in the scan results
  * source_base_path_2
    * Rwrite path 2, in some cases the source file is on a different path than the one in the scan results
  * source_base_path_3
    * Rewrite path 3, in some cases the source file is on a different path than the one in the scan results
  * debug:
    * Enable debug mode - very verbose!
  * language:
    The language the source code is written in.
  * prComment
    * Create comments for fixes on PRs if the action runs on a PR (only works if run within a PR)
  * createPR
    * Create a PR with the fixes to the source branch (only works with `fixType=batch`)
  * files
    * Filter on `all` or on `changed` files only per commit or PR.
  * codeSuggestion
    * (`true`|`false`) This will create a code suggestion for every fix that is created. It will give you the posibility to commit the code suggestion back to the source branch. This is only available if the action runs on a PR and will not work in a combination with `prComment=true`
  

## Documentation
- If `prComment` is set to `true` and 'fixType' is set to `single` the action will create a comment on the PR with the fixes for every flaw that is fixable. That could lead to a lot of comments on the PR. We reccomend to run it with the batch option.
![](/images/changedFileAnnotation.png)
  
- If `prComment` is set to `true` and 'fixType' is set to `batch` the action will create a comment on the PR with a single fixe per file, for every flaw that is fixable. 
![](/images/prComment_batchFix.png)
  
- If `fixType`ist set to `single` and the action runs on a PR, it will create annotations for either changed files or all files, depending on the `files` parameter. This cannot be disabled and should help PR reviewers to see what could be fixed with Veracode Fix. Please keep in mind that this could creat multiple annotations on the same line of code ofthe file which will lead to a situation where you need to carefully decide what has to be put into the file and what not. This is due to the fact that multiple flaws require the same line of code changed.
![](/images/checkAnnotationsSingleSameLine.png)
  
- If `files` is set to `changed` and the action runs on a PR, it will only fix flaws in files that have been changed in the PR. Only works if the action runs on a PR.
- If it is running on a PR it will create annotations for changed and unchagened files. This cannot be disabled and should help PR reviewers to see what could be fixed with Veracode Fix.
![](/images/changedFileAnnotation.png)
![](/images/unchangedFileAnnotation.png)
 
- If `createPR` is set to `true` it will create a new branch called `Veracode-fix-bot-COMMIT-SHA-TIMESTAMP` and a PR with the fixes to the source branch the action runs on.
![](/images/createPR.png)
![](/images/createPRFilesChanged.png)

- If `codeSuggestion` is set to `true` and the action runs on a PR, it will create a code suggestion for every fix that is created. It will give you the posibility to commit the code suggestion back to the source branch. This is only available if the action runs on a PR and will not work in a combination with `prComment=true` and `file=changed`. It will automatically overwrite the `prComment=true` option. The reason for this is that otherwise you would see the code suggestions twice, which doesn't make sense. In addition it will add a little button at the bottom of the code that will let you commit the code suggestion back to the source branch. It also can only work with `files=changed` as tbere is no possibility to comment on unchanged files of the PR.


## Examples  
All examples follow the same strucutre, the will all `need` the `build` to be finished before the they will start running. Veraocde's static analysis is mainly binary static analysis, therefore a compile/build action is required before a pipeline scan can be started. Please read about the packaging and compilation requirements here: https://docs.veracode.com/r/compilation_packaging.  
The examples will checkout the repository, they will download the previously generated build artefact, that is named `verademo.war` and then run the action.  
  

The basic yml - single flaw run
Create individual fixes for each flaw identifed
  
```yml 
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-java@v3
      with:
        distribution: 'zulu'
        java-version: 8
    - name: Cache Maven packages
      uses: actions/cache@v3
      with:
        path: ~/.m2
        key: ${{ runner.os }}-m2-${{ hashFiles('**/pom.xml') }}
    - name: Build with Maven
      run: mvn clean package

    - uses: actions/upload-artifact@v4
      with:
        name: verademo.war
        path: target/verademo.war
        
  pipeline_scan:
      needs: build
      runs-on: ubuntu-latest
      name: pipeline scan
      steps:
        - name: checkout repo
          uses: actions/checkout@v3

        - name: get archive
          uses: actions/download-artifact@v4
          with:
            name: verademo.war
        - name: pipeline-scan action step
          id: pipelien-scan
          uses: veracode/Veracode-pipeline-scan-action@v1.0.12
          with:
            vid: ${{ secrets.VID }}
            vkey: ${{ secrets.VKEY }}
            file: "verademo.war" 
            request_policy: "VeraDemo Policy"
            debug: 1
            fail_build: false

  veracode-fix:
    runs-on: ubuntu-latest
    needs: pipeline_scan
    name: create fixes
    steps:
      - name: checkout repo
        uses: actions/checkout@v3

      - name: get flaw file
        uses: actions/download-artifact@v4
        with:
          name: Veracode Pipeline-Scan Results
          
      - name: Create fixes from static findings
        id: convert
        uses: Veracode/veracode-fix@main
        with:
          inputFile: filtered_results.json
          vid: ${{ secrets.VID }}
          vkey: ${{ secrets.VKEY }}
          source_base_path_1: "com/:src/main/java/com/"
          source_base_path_2: "WEB-INF:src/main/webapp/WEB-INF"
          language: java
          prComment: true
          fixType: single
  ``` 

The basic yml - batch flaw run
Create fixes per file for each flaw identifed
  
```yml 
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-java@v3
      with:
        distribution: 'zulu'
        java-version: 8
    - name: Cache Maven packages
      uses: actions/cache@v3
      with:
        path: ~/.m2
        key: ${{ runner.os }}-m2-${{ hashFiles('**/pom.xml') }}
    - name: Build with Maven
      run: mvn clean package

    - uses: actions/upload-artifact@v4
      with:
        name: verademo.war
        path: target/verademo.war
        
  pipeline_scan:
      needs: build
      runs-on: ubuntu-latest
      name: pipeline scan
      steps:
        - name: checkout repo
          uses: actions/checkout@v3

        - name: get archive
          uses: actions/download-artifact@v4
          with:
            name: verademo.war
        - name: pipeline-scan action step
          id: pipelien-scan
          uses: veracode/Veracode-pipeline-scan-action@v1.0.12
          with:
            vid: ${{ secrets.VID }}
            vkey: ${{ secrets.VKEY }}
            file: "verademo.war" 
            request_policy: "VeraDemo Policy"
            debug: 1
            fail_build: false

  veracode-fix:
    runs-on: ubuntu-latest
    needs: pipeline_scan
    name: create fixes
    steps:
      - name: checkout repo
        uses: actions/checkout@v3

      - name: get flaw file
        uses: actions/download-artifact@v4
        with:
          name: Veracode Pipeline-Scan Results
          
      - name: Create fixes from static findings
        id: convert
        uses: Veracode/veracode-fix@main
        with:
          inputFile: filtered_results.json
          vid: ${{ secrets.VID }}
          vkey: ${{ secrets.VKEY }}
          source_base_path_1: "com/:src/main/java/com/"
          source_base_path_2: "WEB-INF:src/main/webapp/WEB-INF"
          language: java
          prComment: true
          fixType: batch
  ``` 

Only fix flaws for CWE 89 and CWE 117

  ```yml 
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-java@v3
      with:
        distribution: 'zulu'
        java-version: 8
    - name: Cache Maven packages
      uses: actions/cache@v3
      with:
        path: ~/.m2
        key: ${{ runner.os }}-m2-${{ hashFiles('**/pom.xml') }}
    - name: Build with Maven
      run: mvn clean package

    - uses: actions/upload-artifact@v4
      with:
        name: verademo.war
        path: target/verademo.war
        
  pipeline_scan:
      needs: build
      runs-on: ubuntu-latest
      name: pipeline scan
      steps:
        - name: checkout repo
          uses: actions/checkout@v3

        - name: get archive
          uses: actions/download-artifact@v4
          with:
            name: verademo.war
        - name: pipeline-scan action step
          id: pipelien-scan
          uses: veracode/Veracode-pipeline-scan-action@v1.0.12
          with:
            vid: ${{ secrets.VID }}
            vkey: ${{ secrets.VKEY }}
            file: "verademo.war" 
            request_policy: "VeraDemo Policy"
            debug: 1
            fail_build: false

  veracode-fix:
    runs-on: ubuntu-latest
    needs: pipeline_scan
    name: create fixes
    steps:
      - name: checkout repo
        uses: actions/checkout@v3

      - name: get flaw file
        uses: actions/download-artifact@v4
        with:
          name: Veracode Pipeline-Scan Results
          
      - name: Create fixes from static findings
        id: convert
        uses: Veracode/veracode-fix@main
        with:
          inputFile: filtered_results.json
          vid: ${{ secrets.VID }}
          vkey: ${{ secrets.VKEY }}
          source_base_path_1: "com/:src/main/java/com/"
          source_base_path_2: "WEB-INF:src/main/webapp/WEB-INF"
          language: java
          cwe: '89,117'
          prComment: true
          fixType: batch
  ``` 


## Compile the action  
The action comes pre-compiled as transpiled JavaScript. If you want to fork and build it on your own you need NPM to be installed, use `ncc` to compile all node modules into a single file, so they don't need to be installed on every action run. The command to build is simply  

```sh
ncc build ./src/index.ts  
```