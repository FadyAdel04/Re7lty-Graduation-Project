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

const BASE = import.meta.env.VITE_API_URL || ""; // use relative /api by default

export async function createTrip(input: CreateTripInput, token?: string) {
  const res = await fetch(`${BASE}/api/trips`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await res.text());
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


