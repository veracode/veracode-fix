export const sourcecodeFolderName = 'app/';
//export temp folder value from github action
export const tempFolder = process.env.RUNNER_TEMP ? (process.env.RUNNER_TEMP + '/') : '';

export const CWESupportMatrix = {
    "individual": {
      "java": [117, 80, 404, 159, 209, 597, 89, 611, 331, 327, 113, 601, 502],
      "cs": [80, 117, 352, 73, 404, 89, 209, 316, 601, 327, 331, 611],
      "js": [80, 117, 89, 73, 601, 352, 78, 209, 327, 312, 614, 311, 611, 113],
      "php": [80, 73, 89, 117],
      "py": [80, 73, 331, 327, 295, 601, 78, 89, 757],
      "kotlin": [80, 89, 113, 117, 331, 404],
      "scala": [611, 117, 80, 78],
      "go": [73, 78, 117],
      "ruby": [73, 80, 89, 117, 601]
    },
    "batch": {
      // Updated based on official Veracode Fix documentation
      // https://docs.veracode.com/r/About_Veracode_Fix#supported-cwes
      "java": [80, 89, 113, 117, 159, 209, 327, 331, 404, 597, 611],
      "cs": [80, 89, 117, 209, 316, 327, 331, 352, 404, 611],
      "js": [80, 89, 113, 117, 209, 352, 611, 614],
      "php": [80, 89, 117],
      "py": [78, 80, 89, 295, 331, 757],
      "kotlin": [80, 89, 113, 117, 331, 404],
      "scala": [78, 80, 117, 611],
      "go": [73, 78, 117],
      "ruby": [73, 80, 89, 117, 601]
    }
  }