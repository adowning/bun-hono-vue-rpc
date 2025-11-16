/**
 * Token Injector - Automatically adds Bearer token to all HTTP requests
 * 
 * This script monkey-patches XMLHttpRequest and AJAX calls to automatically
 * add an Authorization header with a Bearer token extracted from URL parameters.
 * 
 * Usage:
 * 1. Include this script in your HTML: <script src="token-injector.js"></script>
 * 2. Ensure your URL contains a token parameter: ?token=your_jwt_token_here
 * 
 * The script will automatically:
 * - Extract token from URL parameter "token"
 * - Add "Authorization: Bearer {token}" header to all XHR requests
 * - Patch common AJAX libraries (jQuery, Axios if available)
 * 
 * No configuration required - works automatically!
 */

(function() {
    'use strict';

    /**
     * Extract token from URL parameters
     * @returns {string|null} The token if found, null otherwise
     */
    function extractTokenFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('token');
    }

    /**
     * Get the bearer token from URL
     */
    const bearerToken = extractTokenFromURL();

    // Only proceed if token is found
    if (!bearerToken) {
        console.log('Token Injector: No token found in URL parameters');
        return;
    }

    console.log('Token Injector: Token found, enabling automatic authorization headers');

    /**
     * Patch XMLHttpRequest to add authorization header
     */
    function patchXHR() {
        const OriginalXHR = window.XMLHttpRequest;
        
        function PatchedXHR() {
            const xhr = new OriginalXHR();
            const originalOpen = xhr.open;
            const originalSend = xhr.send;
            
            let requestMethod = '';
            let requestUrl = '';

            // Patch the open method to capture URL and method
            xhr.open = function(method, url, async, user, password) {
                requestMethod = method;
                requestUrl = url;
                return originalOpen.apply(this, arguments);
            };

            // Patch the send method to add authorization header
            xhr.send = function(data) {
                // Only add header for non-cross-origin requests or if explicitly needed
                try {
                    const currentUrl = new URL(requestUrl, window.location.href);
                    const targetUrl = new URL(requestUrl, window.location.href);
                    
                    // Add authorization header for same-origin requests
                    // You can modify this condition based on your needs
                    if (!this.getRequestHeader || !this.getRequestHeader('Authorization')) {
                        this.setRequestHeader('Authorization', 'Bearer ' + bearerToken);
                        console.log('Token Injector: Added authorization header to XHR request:', requestUrl);
                    }
                } catch (e) {
                    // Fallback - add header to all requests
                    if (!this.getRequestHeader || !this.getRequestHeader('Authorization')) {
                        this.setRequestHeader('Authorization', 'Bearer ' + bearerToken);
                        console.log('Token Injector: Added authorization header to XHR request (fallback):', requestUrl);
                    }
                }
                
                return originalSend.apply(this, arguments);
            };

            return xhr;
        }

        // Copy static properties
        PatchedXHR.prototype = OriginalXHR.prototype;
        PatchedXHR.UNSENT = OriginalXHR.UNSENT;
        PatchedXHR.OPENED = OriginalXHR.OPENED;
        PatchedXHR.HEADERS_RECEIVED = OriginalXHR.HEADERS_RECEIVED;
        PatchedXHR.LOADING = OriginalXHR.LOADING;
        PatchedXHR.DONE = OriginalXHR.DONE;

        // Replace global XMLHttpRequest
        window.XMLHttpRequest = PatchedXHR;
        console.log('Token Injector: XMLHttpRequest patched successfully');
    }

    /**
     * Patch jQuery AJAX if available
     */
    function patchJQuery() {
        if (typeof window.jQuery === 'undefined' && typeof window.$ === 'undefined') {
            return;
        }

        const $ = window.jQuery || window.$;
        
        if ($.ajaxSetup) {
            const originalAjaxSetup = $.ajaxSetup;
            $.ajaxSetup = function(options) {
                if (!options.headers) {
                    options.headers = {};
                }
                if (!options.headers['Authorization']) {
                    options.headers['Authorization'] = 'Bearer ' + bearerToken;
                    console.log('Token Injector: jQuery AJAX default headers updated');
                }
                return originalAjaxSetup.call(this, options);
            };
        }

        // Also patch individual AJAX calls
        const originalAjax = $.ajax;
        $.ajax = function(url, options) {
            // Handle both $.ajax(url, options) and $.ajax(options) signatures
            if (typeof url === 'object') {
                options = url;
                url = undefined;
            }
            if (!options) {
                options = {};
            }

            // Ensure headers exist
            if (!options.headers) {
                options.headers = {};
            }

            // Add authorization header if not already present
            if (!options.headers['Authorization']) {
                options.headers['Authorization'] = 'Bearer ' + bearerToken;
                console.log('Token Injector: Added authorization header to jQuery AJAX request');
            }

            return originalAjax.call(this, url, options);
        };

        console.log('Token Injector: jQuery AJAX patched successfully');
    }

    /**
     * Patch Axios if available
     */
    function patchAxios() {
        if (typeof window.axios === 'undefined') {
            return;
        }

        const axios = window.axios;
        
        // Use axios interceptors to add authorization header
        axios.interceptors.request.use(function(config) {
            if (!config.headers) {
                config.headers = {};
            }
            
            if (!config.headers['Authorization']) {
                config.headers['Authorization'] = 'Bearer ' + bearerToken;
                console.log('Token Injector: Added authorization header to Axios request:', config.url);
            }
            
            return config;
        });

        console.log('Token Injector: Axios patched successfully');
    }

    /**
     * Patch Fetch API if available
     */
    function patchFetch() {
        if (typeof window.fetch === 'undefined') {
            return;
        }

        const originalFetch = window.fetch;
        
        window.fetch = function(url, options) {
            // Handle options object
            if (!options) {
                options = {};
            }
            if (!options.headers) {
                options.headers = {};
            }

            // Add authorization header if not already present
            if (!options.headers['Authorization']) {
                options.headers['Authorization'] = 'Bearer ' + bearerToken;
                console.log('Token Injector: Added authorization header to Fetch request:', url);
            }

            return originalFetch.call(this, url, options);
        };

        console.log('Token Injector: Fetch API patched successfully');
    }

    /**
     * Initialize all patches
     */
    function initialize() {
        patchXHR();
        patchJQuery();
        patchAxios();
        patchFetch();
        
        console.log('Token Injector: All HTTP interceptors initialized successfully');
        console.log('Token Injector: Bearer token will be automatically added to all requests');
    }

    // Initialize immediately
    initialize();

    // Also try to initialize after DOM is loaded (for late-loading libraries)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            // Re-initialize in case new AJAX libraries were loaded
            patchJQuery();
            patchAxios();
            patchFetch();
        });
    }

    // Expose utility functions for debugging
    window.TokenInjector = {
        getToken: () => bearerToken,
        reinitialize: initialize,
        isEnabled: () => !!bearerToken
    };

})();