# Veracode Fix  Action

### Note: `language` and `source_base_path` are no longer inputs

Older versions of this action required a **`language`** input and often a **`source_base_path`** input. Neither is supported anymore.

- **`language`:** The action infers the language for each finding from the source file (for example from its extension) when talking to Veracode Fix. You do not set a single project-wide language in the workflow.
- **`source_base_path`:** Paths in the scan results are matched to files under the checked-out repository automatically (search from the job working directory, plus normalization of typical GitHub Actions runner prefixes). You do not configure a base path to align scan paths with the repo.

If your workflow still passes `language:` or `source_base_path:` under `with:`, remove those keys so the job matches the current `action.yml`.

## About
This action will use the Veracode's AI assisted remediation service Veracode-Fix. For more information please see the official product page at https://www.veracode.com/fix and the official at https://docs.veracode.com/r/veracode_fix.
The action is based on the results of Veracode's pipeline-scan action. The Veracode pipeline-scan can store results with all flaws identified (`results.json`), or filtered results (`filtered_results.json`). Based on the results you provide to this actions fixes will be created.
It will take the results file and create fixes for the flaws that are found in the scan. The fixes will be created in the form of a code suggestion that can be applied to the source code. The action will create a comment on the PR with the fixes for every flaw that is fixable. That could lead to a lot of comments on the PR. We reccomend to run it with the batch option.
If the pipeline-scan for exampe is used with a baseline file to sort out already known flaws and you provide the `filtered_results.json` file as in inptu to tis action, it will only create fixes for the new flaws identified in the scan. 
-> Code suggestions generated will heavily depend on the input data.

The action will also automatically use the first code suggested provied by Veracode Fix. The first suggestion is the most likely to be the best one. However there could be situations where the first suggestion is not the best one. In this case you can use the Veracode Fix solution on your IDE or the Veracode CLI to see more suggestions and apply them manually.

Veracode Fix supports the a few languagess and CWE's right now, please review the official documentation at https://docs.veracode.com/r/About_Veracode_Fix.

## Usage

* Required
  * vid
    * the Veracode API ID
  * vkey
    * the Veracode API Secret Key
  * inputFile
    * The results file from a Veracode pipeline scan. Please make sure pipeline-scan is run wiht `--esd true`
  * fixType
    * The type of fix to generate, either `single` or `batch` 
  * files
    * Filter on `all` or on `changed` files only. 
  
* Optional
  * cwe
    * A single CWE or a comma separated list of CWEs to filter on and generate fix suggestions for
  * debug:
    * Enable debug mode - very verbose!
  * prComment
    * Create comments for fixes on PRs if the action runs on a PR (only works if run within a PR)
  * createPR
    * Create a PR with the fixes to the source branch (only works with `fixType=batch`)
  

## Documentation
- If `prComment` is set to `true` and 'fixType' is set to `single` the action will create a comment on the PR with the fixes for every flaw that is fixable. That could lead to a lot of comments on the PR. We reccomend to run it with the batch option.
![](/images/changedFileAnnotation.png)
  
- If `prComment` is set to `true` and 'fixType' is set to `batch` the action will create a comment on the PR with a single fixe per file, for every flaw that is fixable. 
![](/images/prComment_batchFix.png)
  
- If `fixType`ist set to `single` and the action runs on a PR, it will create annotations for either changed files or all files, depending on the `files` parameter. This cannot be disabled and should help PR reviewers to see what could be fixed with Veracode Fix. Please keep in mind that this could creat multiple annotations on the same line of code ofthe file which will lead to a situation where you need to carefully decide what has to be put into the file and what not. This is due to the fact that multiple flaws require the same line of code changed.
![](/images/chechAnnotationsSingleSameLine.png)
  
- If `files` is set to `changed` and the action runs on a PR, it will only fix flaws in files that have been changed in the PR. Only works if the action runs on a PR.
- If it is running on a PR it will create annotations for changed and unchagened files. This cannot be disabled and should help PR reviewers to see what could be fixed with Veracode Fix.
![](/images/changedFileAnnotation.png)
![](/images/unchangedFileAnnotation.png)
 
- If `createPR` is set to `true` it will create a new branch called `Veracode-fix-bot-COMMIT-SHA-TIMESTAMP` and a PR with the fixes to the source branch the action runs on.
![](/images/createPR.png)
![](/images/createPRFilesChanged.png)

- When `createPR` is set to `true`, the action will automatically create check run annotations for the newly created PR. These annotations show the scan findings aligned with the applied fixes, displaying the full flaw description including CWE, issue type, severity, and detailed description. This helps PR reviewers understand which security findings were addressed by each fix in the code changes.
![](/images/files_changed_annotations.png)


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
      name: Veracode Pipeline Scan
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
    name: Veracode Fix
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
      name: Veracode pipeline scan
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
    name: Veracode Fix
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
      name: Veracode Pipeline Scan
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
    name: Veracode Fix
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
          cwe: '89,117'
          prComment: true
          fixType: batch
  ``` 


## Compile the action  
The action comes pre-compiled as transpiled JavaScript. If you want to fork and build it on your own you need NPM to be installed, use `ncc` to compile all node modules into a single file, so they don't need to be installed on every action run. The command to build is simply  

```sh
ncc build ./src/index.ts  
```
