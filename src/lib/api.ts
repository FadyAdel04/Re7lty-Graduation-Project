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
};

// Use relative URLs in development (proxied by Vite) or VITE_API_URL if set
// In development, empty string means relative URLs which triggers Vite proxy
// In production, you can set VITE_API_URL to your backend URL
const BASE = import.meta.env.VITE_API_URL || ""; // Empty = relative URLs (uses Vite proxy)

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
  const res = await fetch(`${BASE}/api/trips?${query.toString()}`);
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function getTrip(id: string) {
  const res = await fetch(`${BASE}/api/trips/${id}`);
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

export async function getUserById(clerkId: string) {
  const res = await fetch(`${BASE}/api/users/${clerkId}`);
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
    const errorText = await res.text();
    throw new Error(errorText || 'Failed to update profile');
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


