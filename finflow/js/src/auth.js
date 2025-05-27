// finflow/js/src/auth.js
const TOKEN_KEY = 'jwtToken';

export function storeToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated() {
    return !!getToken();
}

export function redirectToLogin() {
    // Adjust path relative to where this function is called FROM.
    // If called from index.html (root), path is 'auth/login.html'
    // If called from a script in js/src/ that is itself called from root, path is still 'auth/login.html'
    // If the app structure changes, this might need adjustment.
    if (window.location.pathname.includes('/auth/')) {
        window.location.href = 'login.html'; // Already in auth folder
    } else {
        window.location.href = 'auth/login.html';
    }
}

export function logoutUser() {
    removeToken();
    redirectToLogin();
}

export function checkAuth() {
    if (!isAuthenticated()) {
        redirectToLogin();
    }
}
