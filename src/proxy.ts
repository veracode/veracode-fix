// Proxy management utility functions

/**
 * Unsets proxy environment variables for API calls that should bypass corporate proxy
 * Returns the original proxy values that can be used to restore them later
 */
export function unsetProxy(): { httpProxy: string | undefined, httpsProxy: string | undefined } {
    // Store original proxy settings
    const originalHttpProxy = process.env.HTTP_PROXY;
    const originalHttpsProxy = process.env.HTTPS_PROXY;
    
    // Unset proxy environment variables
    delete process.env.HTTP_PROXY;
    delete process.env.HTTPS_PROXY;
    
    console.log('Proxy disabled for API calls');
    
    return {
        httpProxy: originalHttpProxy,
        httpsProxy: originalHttpsProxy
    };
}

/**
 * Restores proxy environment variables using the original values
 * @param httpProxy - Original HTTP_PROXY value
 * @param httpsProxy - Original HTTPS_PROXY value
 */
export function restoreProxy(httpProxy: string | undefined, httpsProxy: string | undefined): void {
    if (httpProxy) {
        process.env.HTTP_PROXY = httpProxy;
    }
    if (httpsProxy) {
        process.env.HTTPS_PROXY = httpsProxy;
    }
    
    console.log('Proxy settings restored');
} 