// Travel Advisor API service using RapidAPI
const RAPIDAPI_KEY = '8887399421msh0d6d70328fb0fa5p1da174jsn2a02cf1627bc';
const RAPIDAPI_HOST = 'travel-advisor.p.rapidapi.com';
const BASE_URL = 'https://travel-advisor.p.rapidapi.com';

// Map Arabic city names to English for API
const cityNameMap: Record<string, string> = {
  'القاهرة': 'Cairo, Egypt',
  'الإسكندرية': 'Alexandria, Egypt',
  'الأقصر': 'Luxor, Egypt',
  'أسوان': 'Aswan, Egypt',
  'شرم الشيخ': 'Sharm El Sheikh, Egypt',
  'دهب': 'Dahab, Egypt',
  'الجونة': 'El Gouna, Egypt',
  'الغردقة': 'Hurghada, Egypt',
};

export interface TravelAdvisorLocation {
  location_id: string;
  name: string;
  latitude?: string;
  longitude?: string;
}

export interface TravelAdvisorAttraction {
  location_id: string;
  name: string;
  description?: string;
  rating?: string;
  num_reviews?: string;
  photo?: {
    images?: {
      medium?: {
        url?: string;
      };
      large?: {
        url?: string;
      };
    };
  };
  address?: string;
  website?: string;
  phone?: string;
  price_level?: string;
  ranking?: string;
  category?: {
    key?: string;
    name?: string;
  };
}

export interface TravelAdvisorRestaurant {
  location_id: string;
  name: string;
  description?: string;
  rating?: string;
  num_reviews?: string;
  photo?: {
    images?: {
      medium?: {
        url?: string;
      };
      large?: {
        url?: string;
      };
    };
  };
  address?: string;
  cuisine?: Array<{ name?: string }>;
  price_level?: string;
  phone?: string;
  website?: string;
}

export interface TravelAdvisorHotel {
  location_id: string;
  name: string;
  rating?: string;
  num_reviews?: string;
  photo?: {
    images?: {
      medium?: {
        url?: string;
      };
      large?: {
        url?: string;
      };
    };
  };
  address?: string;
  price?: string;
  amenities?: Array<{ name?: string }>;
  website?: string;
  phone?: string;
}

export interface TripPlan {
  location: TravelAdvisorLocation;
  attractions: TravelAdvisorAttraction[];
  restaurants: TravelAdvisorRestaurant[];
  hotels: TravelAdvisorHotel[];
}

// Helper function to get English city name
function getEnglishCityName(arabicCity: string): string {
  return cityNameMap[arabicCity] || arabicCity;
}

// Search for location
export async function searchLocation(query: string): Promise<TravelAdvisorLocation | null> {
  try {
    const response = await fetch(`${BASE_URL}/locations/search?query=${encodeURIComponent(query)}&limit=1&offset=0&units=km&currency=USD&sort=relevance&lang=en_US`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    if (data.data && data.data.length > 0) {
      const result = data.data[0].result_object;
      return {
        location_id: result.location_id,
        name: result.name,
        latitude: result.latitude,
        longitude: result.longitude,
      };
    }
    return null;
  } catch (error) {
    console.error('Error searching location:', error);
    throw error;
  }
}

// Get attractions for a location
export async function getAttractions(locationId: string, limit: number = 10): Promise<TravelAdvisorAttraction[]> {
  try {
    const response = await fetch(`${BASE_URL}/attractions/list?location_id=${locationId}&currency=USD&lang=en_US&lunit=km&limit=${limit}&sort=recommended`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching attractions:', error);
    return [];
  }
}

// Get restaurants for a location
export async function getRestaurants(locationId: string, limit: number = 10): Promise<TravelAdvisorRestaurant[]> {
  try {
    const response = await fetch(`${BASE_URL}/restaurants/list?location_id=${locationId}&currency=USD&lang=en_US&lunit=km&limit=${limit}&sort=recommended`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return [];
  }
}

// Get hotels for a location
export async function getHotels(locationId: string, limit: number = 10): Promise<TravelAdvisorHotel[]> {
  try {
    const response = await fetch(`${BASE_URL}/hotels/list?location_id=${locationId}&currency=USD&lang=en_US&lunit=km&limit=${limit}&sort=recommended`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching hotels:', error);
    return [];
  }
}

// Get complete trip plan for a city
export async function getTripPlan(city: string, days: number = 3): Promise<TripPlan | null> {
  try {
    const englishCityName = getEnglishCityName(city);
    
    // Search for location
    const location = await searchLocation(englishCityName);
    if (!location) {
      throw new Error(`Location not found for: ${city}`);
    }

    // Calculate limits based on number of days
    const attractionsLimit = Math.min(days * 3, 15);
    const restaurantsLimit = Math.min(days * 2, 10);
    const hotelsLimit = 5;

    // Fetch all data in parallel
    const [attractions, restaurants, hotels] = await Promise.all([
      getAttractions(location.location_id, attractionsLimit),
      getRestaurants(location.location_id, restaurantsLimit),
      getHotels(location.location_id, hotelsLimit),
    ]);

    return {
      location,
      attractions,
      restaurants,
      hotels,
    };
  } catch (error) {
    console.error('Error getting trip plan:', error);
    throw error;
  }
}

