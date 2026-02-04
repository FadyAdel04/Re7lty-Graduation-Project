/**
 * API Configuration
 * 
 * This file centralizes the API base URL logic to ensure consistency across all services.
 * In development, it defaults to http://localhost:5000 (proxied by Vite).
 * In production, it should be set via the VITE_API_URL environment variable in Vercel.
 */

// Normalize the API URL: remove trailing slashes to avoid double slashes in concatenated paths
const rawBase = import.meta.env.VITE_API_URL || '';

// In production, if VITE_API_URL is missing, we try to guess or use a sensible fallback.
// However, ERR_NETWORK usually means we're hitting localhost from a public site.
// In development, we use the same hostname as the browser for the backend, assuming it's on port 5000
const devBase = typeof window !== 'undefined' ? `http://${window.location.hostname}:5000` : 'http://127.0.0.1:5000';

export const API_BASE_URL = rawBase ? rawBase.replace(/\/+$/, '') : (import.meta.env.PROD ? '' : devBase);

/**
 * Helper to get authentication headers
 * @param token Clerk token
 */
export const getAuthHeaders = (token?: string) => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
};

console.log(`[API Config] Base URL: ${API_BASE_URL || '(relative)'}`);
if (import.meta.env.PROD && !rawBase) {
    console.warn('[API Config] VITE_API_URL is not set in production. API calls will use relative paths, which might fail if the backend is on a different domain.');
}
