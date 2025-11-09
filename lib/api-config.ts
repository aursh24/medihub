// Backend API configuration
// In production, NEXT_PUBLIC_BACKEND_API_URL should be set to your Render backend URL
// If not set, the app will use local API routes (same origin)

// Helper function to get the full API URL
export function getApiUrl(endpoint: string): string {
  // Get backend URL from environment variable (available in browser via NEXT_PUBLIC_ prefix)
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || '';
  
  if (backendUrl) {
    // Remove leading slash from endpoint if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    // Remove trailing slash from backend URL if present
    const cleanBackendUrl = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;
    return `${cleanBackendUrl}/${cleanEndpoint}`;
  }
  // Use local API routes (same origin) - for development
  return endpoint;
}

