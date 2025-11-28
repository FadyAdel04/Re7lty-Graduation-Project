export type CreateTripInput = {
  title: string;
  destination: string;
  city: string;
  duration: string;
  rating: number;
  image?: string;
  author?: string;
  description: string;
  budget: string;
  activities: any[];
  days: any[];
  foodAndRestaurants: any[];
  isAIGenerated?: boolean;
};

// Use relative URLs in development (proxied by Vite) or VITE_API_URL if set
// In development, empty string means relative URLs which triggers Vite proxy
// In production, you can set VITE_API_URL to your backend URL
// Normalize BASE URL: remove trailing slashes to avoid double slashes in URLs
const rawBase = import.meta.env.VITE_API_URL || "";
const BASE = rawBase ? rawBase.replace(/\/+$/, "") : ""; // Remove trailing slashes, empty = relative URLs (uses Vite proxy)

export async function createTrip(input: CreateTripInput, token?: string) {
  const res = await fetch(`${BASE}/api/trips`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(input),
  });
  
  if (!res.ok) {
    let errorMessage = 'Failed to create trip';
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
      // If it's a database error, provide more helpful message
      if (res.status === 503 && errorData.error === 'Database not connected') {
        errorMessage = 'Database connection failed. Please check MongoDB connection settings.';
      }
    } catch {
      // If response is not JSON, try to get text
      const text = await res.text();
      errorMessage = text || errorMessage;
    }
    throw new Error(errorMessage);
  }
  
  return await res.json();
}

export async function listTrips(params?: { page?: number; limit?: number; sort?: 'recent' | 'likes'; q?: string; city?: string; }) {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.sort) query.set('sort', params.sort);
  if (params?.q) query.set('q', params.q);
  if (params?.city) query.set('city', params.city);
  
  const url = `${BASE}/api/trips?${query.toString()}`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || `Failed to fetch trips: ${res.status} ${res.statusText}`);
    }
    
    return await res.json();
  } catch (error: any) {
    // Provide more helpful error messages for common issues
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      const apiUrl = BASE || 'the backend server';
      throw new Error(`Network error: Unable to connect to ${apiUrl}. Please check if the backend is running and CORS is properly configured.`);
    }
    throw error;
  }
}

export async function getTrip(id: string, token?: string) {
  const res = await fetch(`${BASE}/api/trips/${id}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('Trip not found');
    }
    const errorText = await res.text();
    throw new Error(errorText || 'Failed to fetch trip');
  }
  return await res.json();
}

export async function getUserTrips(token?: string) {
  const res = await fetch(`${BASE}/api/users/me/trips`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Unauthorized');
    }
    const errorText = await res.text();
    throw new Error(errorText || 'Failed to fetch user trips');
  }
  return await res.json();
}

export async function getUserById(clerkId: string, token?: string) {
  const res = await fetch(`${BASE}/api/users/${clerkId}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('User not found');
    }
    const errorText = await res.text();
    throw new Error(errorText || 'Failed to fetch user');
  }
  return await res.json();
}

export async function getUserTripsById(clerkId: string) {
  const res = await fetch(`${BASE}/api/users/${clerkId}/trips`);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Failed to fetch user trips');
  }
  return await res.json();
}

export async function toggleTripLove(id: string, token: string) {
  const res = await fetch(`${BASE}/api/trips/${id}/love`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Failed to update love state');
  }
  return await res.json();
}

export async function toggleTripSave(id: string, token: string) {
  const res = await fetch(`${BASE}/api/trips/${id}/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Failed to update save state');
  }
  return await res.json();
}

export async function addTripComment(id: string, content: string, token: string) {
  const res = await fetch(`${BASE}/api/trips/${id}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Failed to add comment');
  }
  return await res.json();
}

export async function toggleTripCommentLove(tripId: string, commentId: string, token: string) {
  const res = await fetch(`${BASE}/api/trips/${tripId}/comments/${commentId}/love`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Failed to update comment love');
  }
  return await res.json();
}

export async function toggleFollowUser(clerkId: string, token: string) {
  const res = await fetch(`${BASE}/api/users/${clerkId}/follow`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Failed to update follow state');
  }
  return await res.json();
}

export async function deleteTripComment(tripId: string, commentId: string, token: string) {
  const res = await fetch(`${BASE}/api/trips/${tripId}/comments/${commentId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Failed to delete comment');
  }
  return await res.json();
}

export async function getNotifications(limit: number = 30, token?: string) {
  const url = `${BASE}/api/notifications?limit=${limit}`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || `Failed to fetch notifications: ${res.status} ${res.statusText}`);
    }
    
    return await res.json();
  } catch (error: any) {
    // Provide more helpful error messages for common issues
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      const apiUrl = BASE || 'the backend server';
      throw new Error(`Network error: Unable to connect to ${apiUrl}. Please check if the backend is running and CORS is properly configured.`);
    }
    throw error;
  }
}

export async function markNotificationRead(id: string, token?: string) {
  const res = await fetch(`${BASE}/api/notifications/${id}/read`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Failed to mark notification read');
  }
  return await res.json();
}

export async function markAllNotificationsRead(token?: string) {
  const res = await fetch(`${BASE}/api/notifications/read-all`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Failed to mark notifications read');
  }
  return await res.json();
}

async function fetchUserTripCollection(path: string, token?: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Failed to fetch trips');
  }
  return await res.json();
}

export async function getUserSavedTrips(token?: string) {
  return fetchUserTripCollection('/api/users/me/saves', token);
}

export async function getUserLovedTrips(token?: string) {
  return fetchUserTripCollection('/api/users/me/loves', token);
}

export async function getUserSavedTripsById(clerkId: string) {
  return fetchUserTripCollection(`/api/users/${clerkId}/saves`);
}

export async function getUserLovedTripsById(clerkId: string) {
  return fetchUserTripCollection(`/api/users/${clerkId}/loves`);
}

export async function getUserAITrips(token?: string) {
  return fetchUserTripCollection('/api/users/me/ai-trips', token);
}

export async function updateUserProfile(
  data: { bio?: string; location?: string; coverImage?: string; fullName?: string; imageUrl?: string },
  token?: string
) {
  const res = await fetch(`${BASE}/api/users/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Unauthorized');
    }
    if (res.status === 422) {
      let errorMessage = 'Invalid data provided';
      try {
        const errorData = await res.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        const text = await res.text();
        errorMessage = text || errorMessage;
      }
      throw new Error(errorMessage);
    }
    let errorMessage = 'Failed to update profile';
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      const text = await res.text();
      errorMessage = text || errorMessage;
    }
    throw new Error(errorMessage);
  }
  return await res.json();
}

export async function updateTrip(id: string, input: CreateTripInput, token?: string) {
  const res = await fetch(`${BASE}/api/trips/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(input),
  });
  
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Unauthorized');
    }
    if (res.status === 403) {
      throw new Error('You can only edit your own trips');
    }
    if (res.status === 404) {
      throw new Error('Trip not found');
    }
    let errorMessage = 'Failed to update trip';
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      const text = await res.text();
      errorMessage = text || errorMessage;
    }
    throw new Error(errorMessage);
  }
  
  return await res.json();
}

export async function search(query: string, limit: number = 10) {
  const res = await fetch(`${BASE}/api/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Failed to search');
  }
  return await res.json();
}

export async function deleteTrip(id: string, token?: string) {
  const res = await fetch(`${BASE}/api/trips/${id}`, {
    method: 'DELETE',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Unauthorized');
    }
    if (res.status === 403) {
      throw new Error('You can only delete your own trips');
    }
    if (res.status === 404) {
      throw new Error('Trip not found');
    }
    let errorMessage = 'Failed to delete trip';
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      const text = await res.text();
      errorMessage = text || errorMessage;
    }
    throw new Error(errorMessage);
  }
  
  return await res.json();
}


