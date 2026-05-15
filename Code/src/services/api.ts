// API Service for Django Backend Integration

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://ai-backend.timelessjump.com/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'An error occurred' }));
    // Check for the specific key your backend sends ("error in generation")
    const errorMessage = error["error in generation"] || error.error || error.detail || `HTTP error! status: ${response.status}`;
    
    // Include status code in error for 401 detection
    if (response.status === 401) {
      throw new Error(`401: ${errorMessage}`);
    }
    
    throw new Error(errorMessage);
  }
  return response.json();
};

// Logout function
const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_id');
  localStorage.removeItem('username');
  localStorage.removeItem('email');
  localStorage.removeItem('is_superuser');
};

// Refresh token function
const refreshToken = async () => {
  const token = localStorage.getItem('refresh_token');
  if (!token) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: token }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('access_token', data.access);
      // Some implementations also rotate refresh tokens
      if (data.refresh) {
        localStorage.setItem('refresh_token', data.refresh);
      }
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};

interface ExtendedRequestInit extends RequestInit {
  timeout?: number;
}

// Internal helper for authenticated requests with retry logic and timeout support
const fetchWithAuth = async (url: string, options: ExtendedRequestInit = {}) => {
  const { timeout = 300000, ...fetchOptions } = options; // Default timeout 5 minutes

  const fetchWithTimeout = async (requestUrl: string, requestOptions: RequestInit) => {
    const controller = new AbortController();
    let id: ReturnType<typeof setTimeout> | undefined;

    // Only set a timeout if it's greater than 0. If 0, we wait indefinitely.
    if (timeout > 0) {
      id = setTimeout(() => controller.abort(), timeout);
    }

    try {
      const response = await fetch(requestUrl, {
        ...requestOptions,
        signal: timeout > 0 ? controller.signal : undefined,
      });
      if (id) clearTimeout(id);
      return response;
    } catch (error: any) {
      if (id) clearTimeout(id);
      if (error.name === 'AbortError') {
         throw new Error('Request timed out. The server took too long to respond.');
      }
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
         throw new Error('Network error. The server is unreachable, or the response (often a 500 error) was blocked by CORS.');
      }
      throw error;
    }
  };

  // First attempt
  let response = await fetchWithTimeout(url, fetchOptions);

  // If 401, try to refresh token
  if (response.status === 401) {
    try {
      const refreshed = await refreshToken();
      if (refreshed) {
        // Retry with new token
        const newHeaders = {
          ...fetchOptions.headers,
          ...getAuthHeaders(), // Get the new token from storage
        };
        response = await fetchWithTimeout(url, { ...fetchOptions, headers: newHeaders });
      } else {
        // Refresh failed, logout
        logout();
        window.location.href = '/login'; // Force redirect
        throw new Error('Session expired. Please login again.');
      }
    } catch (error) {
      logout();
      window.location.href = '/login';
      throw error;
    }
  }

  return handleResponse(response);
};


export const api = {
  // ============ AUTHENTICATION ============
  
  async register(username: string, email: string, password: string, isSuperuser: boolean = false) {
    const response = await fetch(`${API_BASE_URL}/register-user/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_name: username,
        email,
        password,
        is_superuser: isSuperuser,
      }),
    });
    return handleResponse(response);
  },

  async login(username: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await handleResponse(response);
    
    // Store tokens and user data
    if (data.access) {
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('user_id', data.user_id);
      localStorage.setItem('username', username); // Store username
      localStorage.setItem('email', data.email);
      localStorage.setItem('is_superuser', data.is_superuser);
    }
    
    return data;
  },

  logout,
  refreshToken,

  // ============ CHAT ROOM ============
  
  async createChatRoom(userId: string) {
    return fetchWithAuth(`${API_BASE_URL}/chat-room-creation/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ user_id: userId }),
    });
  },

  // ============ IMAGE GENERATION ============
  
  async generateSingleImage(
    chatroomId: string,
    imagePath: string,
    prompt: string,
    aspectRatios: string[],
    resolution: string,
    selectedColor?: string,
    temperature: number = 1.0
  ) {
    return fetchWithAuth(`${API_BASE_URL}/image_generator/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        chatroom_id: chatroomId,
        image_path: imagePath,
        prompt,
        aspect_ratios: aspectRatios,
        resolution,
        selected_color: selectedColor,
        temperature,
      }),
      timeout: 300000, // 5 minutes
    });
  },

  async generateMultipleImages(
    chatroomId: string,
    imagePath: string,
    prompt: string,
    aspectRatios: string[],
    resolution: string,
    selectedColor?: string,
    temperature: number = 1.0
  ) {
    return fetchWithAuth(`${API_BASE_URL}/multi-image_generator/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        chatroom_id: chatroomId,
        image_path: imagePath,
        prompt,
        aspect_ratios: aspectRatios,
        resolution,
        selected_color: selectedColor,
        temperature,
      }),
      timeout: 300000, // 5 minutes
    });
  },

  async generateBatchImages(
    chatroomId: string,
    prompt: string,
    selectedImages: string[],
    aspectRatios: string[],
    resolution: string,
    temperature: number = 1.0
  ) {
    return fetchWithAuth(`${API_BASE_URL}/generate-batch-image/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        chatroom_id: chatroomId,
        prompt,
        selected_images: selectedImages,
        aspect_ratios: aspectRatios,
        resolution,
        temperature,
      }),
      timeout: 300000, // 5 minutes
    });
  },

   // ============ SKETCH IMAGE GENERATION ============

  async generateSketchImage(
    chatroomId: string,
    prompt: string,
    imageBase64: string,
    aspectRatio: string
  ) {
    return fetchWithAuth(`${API_BASE_URL}/sketch-image-generator/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        chatroom_id: chatroomId,
        prompt,
        image: imageBase64,
        aspect_ratio: aspectRatio,
      }),
      timeout: 300000,
    });
  },


  // ============ IMAGE EDITING ============
  
  async editImage(
    chatroomId: string,
    imageId: string,
    editPrompt: string
  ) {
    return fetchWithAuth(`${API_BASE_URL}/image-editing/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        chatroom_id: chatroomId,
        image_id: imageId,
        edit_prompt: editPrompt,
      }),
    });
  },

  async updateImageStatus(imageId: string, goodStatus: boolean) {
    return fetchWithAuth(`${API_BASE_URL}/image-editing/`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        image_id: imageId,
        good_status: goodStatus,
      }),
    });
  },

  async generateSingleImageFluxKlein(
    chatroomId: string,
    imageLocation: string,
    userPrompt: string,
    aspectRatio: string,
    selectedColor?: string
  ) {
    return fetchWithAuth(`${API_BASE_URL}/generate-image-using-flux-klein-distilled/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        chatroom_id: chatroomId,
        image_location: imageLocation,
        user_prompt: userPrompt,
        aspect_ratio: aspectRatio,
        selected_color: selectedColor,
      }),
      timeout: 300000, // 5 minutes
    });
  },

  async generateMultipleImagesFluxKlein(
    chatroomId: string,
    imageLocation: string,
    userPrompt: string,
    aspectRatios: string[],
    selectedColor?: string
  ) {
    return fetchWithAuth(`${API_BASE_URL}/generate-multiple-images-using-flux-klein-distilled/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        chatroom_id: chatroomId,
        image_location: imageLocation,
        user_prompt: userPrompt,
        aspect_ratios: aspectRatios,
        selected_color: selectedColor,
      }),
      timeout: 300000, // 5 minutes
    });
  },

  async generateAdsImage(
    chatroomId: string,
    prompt: string,
    imageBase64: string,
    aspectRatios: string,
    resolution: string,
    temperature: number = 1.0
  ) {
    return fetchWithAuth(`${API_BASE_URL}/Ads-image-generator/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        chatroom_id: chatroomId,
        prompt,
        image: imageBase64,
        aspect_ratios: aspectRatios,
        resolution: resolution,
        temperature: temperature,
      }),
      timeout: 300000,
    });
  },
 // ============ RENDER STUDIO ============

  async generateRender(
    chatroomId: string,
    imageBase64: string,
    aspectRatio: string,
    resolution: string,
    temperature: number = 1.0
  ) {
    return fetchWithAuth(`${API_BASE_URL}/render-generator`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        chatroom_id: chatroomId,
        image: imageBase64,
        aspect_ratios: aspectRatio,
        resolution: resolution,
        temperature: temperature,
      }),
      timeout: 300000,
    });
  },
  
  // ============ VIDEO GENERATION ============
  
  async generateVideo(
    prompt: string,
    imagePath: string,
    aspectRatio: string
  ) {
    return fetchWithAuth(`${API_BASE_URL}/video-gen/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        user_prompt: prompt,
        img_location: imagePath,
        aspect_ratio: aspectRatio,
      }),
      timeout: 0, // Unlimited wait time
    });
  },


  // ============ SESSIONS ============
  
  async listSessions(userId: string) {
    return fetchWithAuth(`${API_BASE_URL}/list-sessions/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
  },

  async getSessionDetails(chatroomId: string) {
    return fetchWithAuth(`${API_BASE_URL}/list-sessions/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ chatroom_id: chatroomId }),
    });
  },

  // ============ SAVED IMAGES ============
  
  async getSavedImages() {
    return fetchWithAuth(`${API_BASE_URL}/list-good-images/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
  },

      async getModelUsage(modelName: string) {
    return fetchWithAuth(`${API_BASE_URL}/get-generated-image/?model_name=${encodeURIComponent(modelName)}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
  },

  // ============ ADMIN - USER MANAGEMENT ============
  
  async getAllUsers() {
    const response = await fetch(`${API_BASE_URL}/list-users/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getUserSessions(userId: string) {
    const response = await fetch(`${API_BASE_URL}/list-user-sessions/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body : JSON.stringify({user_id : userId})
    });
    return handleResponse(response);
  },


  async getUserGoodImages(userId: string) {
    const response = await fetch(`${API_BASE_URL}/list-user-images/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body : JSON.stringify({user_id : userId})
    });
    return handleResponse(response);
  },
};

// Export helper to check if user is authenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem('access_token');
};

// Export helper to check if user is superuser
export const isSuperUser = () => {
  return localStorage.getItem('is_superuser') === 'true';
};

// Export helper to get current user ID
export const getCurrentUserId = () => {
  return localStorage.getItem('user_id');
};