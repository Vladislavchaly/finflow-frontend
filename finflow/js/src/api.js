// finflow/js/src/api.js
/**
 * Provides a centralized function for making API requests using fetch.
 * Handles setting common headers, authorization, and basic error processing,
 * including 401 unauthorized responses.
 */
import { BASE_API_URL } from './config.js';
import { getToken, logoutUser, redirectToLogin } from './auth.js';

/**
 * Makes an API request to the specified endpoint.
 * @param {string} endpoint - The API endpoint (e.g., '/transactions').
 * @param {string} [method='GET'] - The HTTP method (GET, POST, PUT, DELETE, etc.).
 * @param {Object|null} [data=null] - The request payload for POST/PUT requests.
 * @param {boolean} [requiresAuth=true] - Whether the request requires authentication (adds Authorization header).
 * @returns {Promise<Object|null>} A promise that resolves with the JSON response data, or null for 204 responses.
 * @throws {Object} An error object with `status` and `data` (parsed error response) or `message` for network errors.
 */
export async function apiRequest(endpoint, method = 'GET', data = null, requiresAuth = true) {
    const url = BASE_API_URL + endpoint;
    const options = {
        method: method,
        headers: {},
    };

    if (data) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(data);
    }

    if (requiresAuth) {
        const token = getToken();
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        } else {
            // If auth is required and no token is found, redirect to login.
            // This prevents API calls that are doomed to fail.
            console.warn('No token found for authenticated request. Redirecting to login.');
            redirectToLogin(); 
            // Throw an error to stop the current execution flow.
            // The redirection will happen, but this prevents further processing in the calling function.
            throw new Error('Authentication required. Redirecting to login.');
        }
    }

    try {
        const response = await fetch(url, options);

        if (response.status === 401) {
            // Unauthorized: Token might be invalid or expired.
            console.warn('API request unauthorized (401). Logging out user.');
            logoutUser(); // This will redirect to login
            throw new Error('Unauthorized access. Please login again.');
        }

        if (!response.ok) {
            // For other errors (400, 403, 500, etc.)
            let errorData;
            try {
                errorData = await response.json(); // Attempt to parse error response as JSON
            } catch (e) {
                // If error response is not JSON, use statusText or a generic message
                errorData = { message: response.statusText || 'An unknown error occurred' };
            }
            console.error('API request failed:', response.status, errorData);
            throw { status: response.status, data: errorData }; // Throw structured error
        }
        
        // Check content type before parsing JSON for successful responses
        // For 204 No Content, response.json() would error
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return await response.json(); // Parse and return JSON body
        } else if (response.status === 204) {
            return null; // No content to parse, return null
        } else {
            // Handle other content types (e.g., text/plain) if necessary, or assume no body for other cases
            return await response.text(); 
        }

    } catch (error) {
        // Re-throw the error if it's already a structured error from the above block
        if (error.status !== undefined && error.data !== undefined) { // Check for undefined to allow status: null
            throw error;
        }
        // Log and re-throw other network errors or issues from the fetch call itself as a structured error
        console.error('Network error or issue with fetch call:', error);
        throw { status: null, data: { message: error.message || 'Network error' } };
    }
}
