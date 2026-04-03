/**
 * Centralized HTTP client configuration.
 * All API calls go through this module so the base URL is a single source of truth.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/**
 * Builds an absolute API URL.
 * @param {string} path - e.g. '/users' or '/restaurants/123'
 * @returns {string}
 */
export const apiUrl = (path) => `${BASE_URL}${path}`;

/**
 * Resolves a resource image URL returned by the backend.
 * Backend may return relative paths like "uploads/img.jpg".
 * @param {string | null | undefined} url
 * @returns {string | null}
 */
export const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url;
  return `${BASE_URL}/${url}`;
};

/**
 * Performs an authenticated JSON request.
 * @param {string} path
 * @param {RequestInit} [options]
 * @returns {Promise<Response>}
 */
export const apiFetch = (path, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  };

  // Remove Content-Type for FormData (browser sets it with boundary automatically)
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  return fetch(apiUrl(path), { ...options, headers });
};
