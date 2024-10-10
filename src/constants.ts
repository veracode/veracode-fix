export const sourcecodeFolderName = 'app/';
//export temp folder value from github action
export const tempFolder = process.env.RUNNER_TEMP ? (process.env.RUNNER_TEMP + '/') : '';