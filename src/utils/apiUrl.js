/**
 * Safely resolves the API base URL.
 * In production (Vercel / custom domain), frontend and backend share the same origin,
 * so all API requests and auth redirects use relative paths or window.location.origin.
 * Legacy hostnames (e.g., railway.app, onrender.com) are strictly filtered out.
 */
export const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl || typeof envUrl !== 'string') return '';
  const trimmed = envUrl.trim();
  if (trimmed.includes('railway.app') || trimmed.includes('onrender.com')) {
    return '';
  }
  return trimmed.replace(/\/+$/, '');
};

export default getApiBaseUrl;
