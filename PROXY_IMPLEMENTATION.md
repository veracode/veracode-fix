# Proxy Implementation for Veracode Fix GitHub Action

## Overview

This document describes the changes made to implement proxy support for the Veracode Fix GitHub Action. The implementation replaces axios with native fetch to enable proxy support through standard environment variables.

## Changes Made

### 1. Replaced Axios with Fetch

- **File**: `src/requests.ts`
- **Change**: Removed axios dependency and replaced all HTTP requests with native fetch
- **Reason**: Axios doesn't support HTTP over HTTPS proxy requests, while fetch automatically picks up standard proxy environment variables

### 2. Added Proxy Management Functions

Two simple functions were added to manage proxy settings:

#### `unsetProxy(): { httpProxy: string | undefined, httpsProxy: string | undefined }`
- Unsets proxy environment variables for API calls that should bypass corporate proxy
- Returns the original proxy values that can be used to restore them later
- Called before GitHub API requests

#### `restoreProxy(httpProxy: string | undefined, httpsProxy: string | undefined): void`
- Restores proxy environment variables using the original values
- Called after GitHub API requests are complete

**Note**: Veracode API calls don't need explicit proxy management since fetch automatically picks up environment variables.

**Location**: `src/proxy.ts` - Shared utility module for all files

### 3. Updated All Veracode API Calls

The following functions now use fetch with proxy enabled:

- `upload()` - POST to `/fix/v1/project/upload_code`
- `uploadBatch()` - POST to `/fix/v1/project/batch_upload`
- `checkFix()` - GET from `/fix/v1/project/{projectId}/results`
- `checkFixBatch()` - GET from `/fix/v1/project/{projectId}/batch_status`
- `pullBatchFixResults()` - GET from `/fix/v1/project/{projectId}/batch_results`

### 4. Updated GitHub API Calls

The following files now use `unsetProxy()` to disable proxy for GitHub API calls:

- **File**: `src/requests.ts` - `getFilesPartOfPR()` function
- **File**: `src/create_pr_comment.ts` - `createPRComment()` and `createPRCommentBatch()` functions
- **File**: `src/create_pr.ts` - `createPR()` function
- **File**: `src/create_code_suggestion.ts` - `createCodeSuggestion()` function
- **File**: `src/checkRun.ts` - `createCheckRun()`, `updateCheckRunUpdate()`, `updateCheckRunUpdateBatch()`, and `updateCheckRunClose()` functions

**Reason**: GitHub API calls should not go through corporate proxy

### 5. Added Helper Function

#### `makeFetchRequest(url: string, options: RequestInit): Promise<any>`
- Centralized fetch request handling
- Proper error handling and response parsing
- Automatic JSON/text response detection

### 6. Updated Dependencies

- **File**: `package.json`
- **Change**: Removed axios dependency
- **Reason**: No longer needed since we're using native fetch

### 7. Created Shared Proxy Utility

- **File**: `src/proxy.ts`
- **Change**: Created shared proxy management functions
- **Reason**: Centralized proxy management for all files to avoid code duplication

## Environment Variables

The implementation uses standard proxy environment variables:

- `HTTP_PROXY` - For HTTP requests
- `HTTPS_PROXY` - For HTTPS requests

These variables are automatically picked up by Node.js fetch when making requests.

## Usage

### For Veracode API Calls (with proxy):
```typescript
// No explicit proxy management needed - fetch automatically picks up environment variables
const response = await makeFetchRequest(url, options);
```

### For GitHub API Calls (without proxy):
```typescript
const originalProxySettings = unsetProxy(); // Disable proxy and get original values
// Make GitHub API calls
restoreProxy(originalProxySettings.httpProxy, originalProxySettings.httpsProxy); // Restore proxy settings
```

## Benefits

1. **Proxy Support**: Now supports HTTP over HTTPS proxy requests
2. **Standard Environment Variables**: Uses standard `HTTP_PROXY` and `HTTPS_PROXY` variables
3. **Selective Proxy Usage**: Veracode API calls use proxy, GitHub API calls don't
4. **Better Error Handling**: Improved error handling with fetch
5. **Reduced Dependencies**: Removed axios dependency

## Testing

To test the proxy implementation:

1. Set proxy environment variables:
   ```bash
   export HTTP_PROXY=http://proxy.company.com:8080
   export HTTPS_PROXY=http://proxy.company.com:8080
   ```

2. Run the GitHub Action and verify:
   - Veracode API calls go through the proxy
   - GitHub API calls bypass the proxy
   - All functionality works as expected

## Compatibility

- **Node.js**: Requires Node.js 18+ for native fetch support
- **GitHub Actions**: Compatible with all GitHub Actions runners (Node.js 18+)
- **Proxy Types**: Supports HTTP, HTTPS, and SOCKS proxies
- **TypeScript**: Updated to ES2022 target for fetch support 