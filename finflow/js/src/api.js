// finflow/js/src/api.js
import { BASE_API_URL } from './config.js';
import { getToken, logoutUser, redirectToLogin } from './auth.js';

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
                errorData = await response.json();
            } catch (e) {
                errorData = { message: response.statusText || 'An unknown error occurred' };
            }
            console.error('API request failed:', response.status, errorData);
            throw { status: response.status, data: errorData };
        }
        
        // Check content type before parsing JSON
        // For 204 No Content, response.json() would error
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return await response.json();
        } else if (response.status === 204) {
            return null; // Or an empty object/array, depending on expected response
        } else {
            return await response.text(); // Or handle as blob, etc. if needed
        }

    } catch (error) {
        // Re-throw the error to be caught by the calling function if it's already structured
        if (error.status && error.data) {
            throw error;
        }
        // Log and re-throw other network errors or issues from the fetch itself
        console.error('Network error or issue with fetch call:', error);
        throw { status: null, data: { message: error.message || 'Network error' } };
    }
}
