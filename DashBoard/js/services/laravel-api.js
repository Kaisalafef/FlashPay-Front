/**
 * Laravel API Service
 * ===================
 * Production-ready API client for Laravel backend communication
 * 
 * Features:
 * - Bearer token authentication
 * - Request/Response interceptors
 * - Auto token refresh
 * - Request deduplication
 * - Error handling with Arabic messages
 * - Office context injection
 */

(function() {
    'use strict';

    // API Configuration
    const API_CONFIG = {
        // Base URL from environment variable or default
        BASE_URL: window.API_BASE_URL || 'https://your-laravel-domain.com/api',
        // Timeout in milliseconds
        TIMEOUT: 30000,
        // Retry attempts for failed requests
        MAX_RETRIES: 3,
        // Token refresh threshold (5 minutes before expiry)
        TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000
    };

    // Request tracking for deduplication
    const pendingRequests = new Map();
    
    // Token management
    let accessToken = null;
    let refreshToken = null;
    let tokenExpiry = null;

    /**
     * Initialize API service
     */
    function init() {
        // Load tokens from storage
        loadTokens();
        
        // Setup interceptors
        setupInterceptors();
        
        console.log('🔌 Laravel API Service initialized');
        console.log('🌐 API Base URL:', API_CONFIG.BASE_URL);
    }

    /**
     * Load tokens from secure storage
     */
    function loadTokens() {
        try {
            // Try sessionStorage first (more secure, cleared on tab close)
            accessToken = sessionStorage.getItem('access_token');
            refreshToken = sessionStorage.getItem('refresh_token');
            const expiry = sessionStorage.getItem('token_expiry');
            if (expiry) tokenExpiry = parseInt(expiry);
        } catch (e) {
            console.warn('Session storage not available');
        }
    }

    /**
     * Save tokens to storage
     */
    function saveTokens(access, refresh, expiry) {
        accessToken = access;
        refreshToken = refresh;
        tokenExpiry = expiry;
        
        try {
            sessionStorage.setItem('access_token', access);
            if (refresh) sessionStorage.setItem('refresh_token', refresh);
            if (expiry) sessionStorage.setItem('token_expiry', expiry.toString());
        } catch (e) {
            console.warn('Failed to save tokens');
        }
    }

    /**
     * Clear all tokens
     */
    function clearTokens() {
        accessToken = null;
        refreshToken = null;
        tokenExpiry = null;
        
        try {
            sessionStorage.removeItem('access_token');
            sessionStorage.removeItem('refresh_token');
            sessionStorage.removeItem('token_expiry');
            localStorage.removeItem('user');
            localStorage.removeItem('userRole');
        } catch (e) {
            console.warn('Failed to clear tokens');
        }
    }

    /**
     * Check if token needs refresh
     */
    function shouldRefreshToken() {
        if (!tokenExpiry) return false;
        return Date.now() >= (tokenExpiry - API_CONFIG.TOKEN_REFRESH_THRESHOLD);
    }

    /**
     * Setup request/response interceptors
     */
    function setupInterceptors() {
        // Override fetch to add interceptors
        const originalFetch = window.fetch;
        
        window.fetch = async function(url, options = {}) {
            // Skip if not our API
            if (!url.includes(API_CONFIG.BASE_URL) && !url.startsWith('/api/')) {
                return originalFetch(url, options);
            }
            
            // Build full URL
            const fullUrl = url.startsWith('http') ? url : `${API_CONFIG.BASE_URL}${url}`;
            
            // Request interceptor
            const modifiedOptions = await handleRequest(fullUrl, options);
            
            // Check for pending identical request (deduplication)
            const requestKey = `${modifiedOptions.method || 'GET'}:${fullUrl}:${JSON.stringify(modifiedOptions.body)}`;
            if (pendingRequests.has(requestKey)) {
                return pendingRequests.get(requestKey);
            }
            
            // Create request promise
            const requestPromise = executeRequest(fullUrl, modifiedOptions, originalFetch);
            pendingRequests.set(requestKey, requestPromise);
            
            try {
                const response = await requestPromise;
                pendingRequests.delete(requestKey);
                return response;
            } catch (error) {
                pendingRequests.delete(requestKey);
                throw error;
            }
        };
    }

    /**
     * Handle request modifications
     */
    async function handleRequest(url, options) {
        const modifiedOptions = { ...options };
        
        // Ensure headers object exists
        modifiedOptions.headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...options.headers
        };
        
        // Add Authorization header if token exists
        if (accessToken) {
            // Check if token needs refresh
            if (shouldRefreshToken() && refreshToken) {
                await refreshAccessToken();
            }
            
            modifiedOptions.headers['Authorization'] = `Bearer ${accessToken}`;
        }
        
        // Add office context header for data isolation
        const officeContext = getOfficeContext();
        if (officeContext && officeContext.officeId) {
            modifiedOptions.headers['X-Office-Id'] = officeContext.officeId;
        }
        
        // Add role header for backend validation
        const role = getCurrentUserRole();
        if (role) {
            modifiedOptions.headers['X-User-Role'] = role;
        }
        
        // Add timeout
        const controller = new AbortController();
        modifiedOptions.signal = controller.signal;
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
        
        // Store timeout ID for cleanup
        modifiedOptions._timeoutId = timeoutId;
        
        return modifiedOptions;
    }

    /**
     * Execute the HTTP request
     */
    async function executeRequest(url, options, originalFetch) {
        let lastError;
        
        for (let attempt = 1; attempt <= API_CONFIG.MAX_RETRIES; attempt++) {
            try {
                const response = await originalFetch(url, options);
                
                // Clear timeout
                if (options._timeoutId) clearTimeout(options._timeoutId);
                
                // Handle response
                const handledResponse = await handleResponse(response);
                return handledResponse;
                
            } catch (error) {
                lastError = error;
                
                // Don't retry on 401/403 (auth errors)
                if (error.status === 401 || error.status === 403) {
                    throw error;
                }
                
                // Don't retry on abort
                if (error.name === 'AbortError') {
                    throw new ApiError('Request timeout', 408, 'TIMEOUT');
                }
                
                // Wait before retry (exponential backoff)
                if (attempt < API_CONFIG.MAX_RETRIES) {
                    await sleep(1000 * Math.pow(2, attempt - 1));
                }
            }
        }
        
        throw lastError;
    }

    /**
     * Handle API response
     */
    async function handleResponse(response) {
        // Clone response for reading
        const clonedResponse = response.clone();
        
        // Handle HTTP errors
        if (!response.ok) {
            let errorData;
            try {
                errorData = await clonedResponse.json();
            } catch (e) {
                errorData = { message: response.statusText };
            }
            
            // Handle specific status codes
            switch (response.status) {
                case 401:
                    // Unauthorized - clear tokens and redirect to login
                    clearTokens();
                    redirectToLogin();
                    throw new ApiError(
                        errorData.message || 'Session expired. Please login again.',
                        401,
                        'UNAUTHORIZED'
                    );
                    
                case 403:
                    // Forbidden - permission denied
                    showNotification('غير مصرح: ليس لديك صلاحية لهذه العملية', 'error');
                    throw new ApiError(
                        errorData.message || 'Permission denied',
                        403,
                        'FORBIDDEN'
                    );
                    
                case 404:
                    throw new ApiError(
                        errorData.message || 'Resource not found',
                        404,
                        'NOT_FOUND'
                    );
                    
                case 422:
                    // Validation errors
                    throw new ApiError(
                        errorData.message || 'Validation failed',
                        422,
                        'VALIDATION_ERROR',
                        errorData.errors
                    );
                    
                case 500:
                    throw new ApiError(
                        'Server error. Please try again later.',
                        500,
                        'SERVER_ERROR'
                    );
                    
                default:
                    throw new ApiError(
                        errorData.message || `HTTP Error: ${response.status}`,
                        response.status,
                        'HTTP_ERROR'
                    );
            }
        }
        
        // Parse successful response
        try {
            const data = await response.json();
            return {
                success: true,
                data: data.data || data,
                message: data.message,
                meta: data.meta
            };
        } catch (e) {
            // Non-JSON response
            return {
                success: true,
                data: null,
                raw: response
            };
        }
    }

    /**
     * Refresh access token
     */
    async function refreshAccessToken() {
        if (!refreshToken) return;
        
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${refreshToken}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                saveTokens(
                    data.data.access_token,
                    data.data.refresh_token,
                    Date.now() + (data.data.expires_in * 1000)
                );
            } else {
                // Refresh failed, clear tokens
                clearTokens();
                redirectToLogin();
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
        }
    }

    /**
     * API Error class
     */
    class ApiError extends Error {
        constructor(message, status, code, errors = null) {
            super(message);
            this.name = 'ApiError';
            this.status = status;
            this.code = code;
            this.errors = errors;
        }
    }

    /**
     * Helper functions
     */
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function redirectToLogin() {
        // Clear any sensitive data
        clearTokens();
        
        // Redirect to login page
        window.location.href = '/login.html';
    }

    function getOfficeContext() {
        // Get from window or localStorage
        if (window.currentOfficeContext) {
            return window.currentOfficeContext;
        }
        
        try {
            const saved = localStorage.getItem('currentOfficeContext');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    }

    function getCurrentUserRole() {
        try {
            return localStorage.getItem('userRole') || 'super_admin';
        } catch (e) {
            return 'super_admin';
        }
    }

    /**
     * Public API methods
     */
    const LaravelAPI = {
        // Configuration
        setBaseUrl: (url) => { API_CONFIG.BASE_URL = url; },
        getBaseUrl: () => API_CONFIG.BASE_URL,
        
        // Token management
        setTokens: saveTokens,
        clearTokens: clearTokens,
        getAccessToken: () => accessToken,
        isAuthenticated: () => !!accessToken,
        
        // HTTP methods
        get: (endpoint, params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            const url = `${endpoint}${queryString ? '?' + queryString : ''}`;
            return fetch(url, { method: 'GET' });
        },
        
        post: (endpoint, data) => {
            return fetch(endpoint, {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },
        
        put: (endpoint, data) => {
            return fetch(endpoint, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        },
        
        patch: (endpoint, data) => {
            return fetch(endpoint, {
                method: 'PATCH',
                body: JSON.stringify(data)
            });
        },
        
        delete: (endpoint) => {
            return fetch(endpoint, { method: 'DELETE' });
        },
        
        // Upload method for files
        upload: (endpoint, formData) => {
            return fetch(endpoint, {
                method: 'POST',
                body: formData,
                headers: {
                    // Don't set Content-Type, let browser set it with boundary
                    'Accept': 'application/json',
                    'Authorization': accessToken ? `Bearer ${accessToken}` : ''
                }
            });
        }
    };

    // Initialize on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose to window
    window.LaravelAPI = LaravelAPI;
    window.ApiError = ApiError;

})();
