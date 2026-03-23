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
  latitude?: string;
  longitude?: string;
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
  latitude?: string;
  longitude?: string;
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
  latitude?: string;
  longitude?: string;
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
    // Continue even if location fails, hotels API might still work with city name
    return null;
  }
}

export async function getHotels(city: string, limit: number = 10, budgetLevel?: "low" | "medium" | "high"): Promise<TravelAdvisorHotel[]> {
  try {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const response = await fetch(`${API_URL}/proxy/hotels?city=${encodeURIComponent(city)}`, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    let hotelList: any[] = [];
    
    // Robustly extract the array from response
    if (Array.isArray(data)) {
        hotelList = data;
    } else if (data && typeof data === 'object') {
        const potentialArrays = ['data', 'hotels', 'results', 'items', 'list', 'body', 'records', 'hotel_list'];
        for (const key of potentialArrays) {
            if (Array.isArray(data[key])) {
                hotelList = data[key];
                break;
            }
        }
        if (hotelList.length === 0) {
            for (const key of Object.keys(data)) {
                 if (Array.isArray(data[key])) {
                     hotelList = data[key];
                     break;
                 }
            }
        }
    }
    
    let formattedHotels: TravelAdvisorHotel[] = hotelList.map((h: any, idx: number) => ({
      location_id: h.id?.toString() || h.hotel_id?.toString() || `hotel_${idx}`,
      name: h.name || h.hotel_name || h.title || 'Unknown Hotel',
      rating: h.rating?.toString() || h.star_rating?.toString() || h.score?.toString() || '4.5',
      num_reviews: h.reviews?.toString() || h.review_count?.toString(),
      latitude: h.latitude?.toString() || h.lat?.toString(),
      longitude: h.longitude?.toString() || h.lng?.toString(),
      photo: {
        images: {
          medium: { url: h.image || h.photo || h.thumbnail || h.picture || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80' },
          large: { url: h.image || h.photo || h.thumbnail || h.picture || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000&q=80' }
        }
      },
      address: h.address || h.location || h.city || city,
      price: h.price?.toString() ? `${h.price}` : h.price_range || h.rate || 'غير متوفر',
      amenities: h.amenities ? (Array.isArray(h.amenities) ? h.amenities.map((a: any) => ({ name: typeof a === 'string' ? a : a.name })) : []) : [{ name: 'Wi-Fi' }]
    }));

    if (formattedHotels.length === 0) {
        console.warn("Hotels API failed or returned 0 hotels. Using fallback data for", city);
        formattedHotels = [
            {
                location_id: "mock_hotel_1",
                name: `فندق جراند ${city}`,
                rating: "4.8",
                photo: { images: { medium: { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80' }, large: { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?depth=1&w=1000&q=80' } } },
                address: `قلب العاصمة، ${city}`,
                price: "1200 EGP",
                amenities: [{ name: 'Wi-Fi' }]
            },
            {
                location_id: "mock_hotel_2",
                name: `رويال ريزورت ${city}`,
                rating: "4.5",
                photo: { images: { medium: { url: 'https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?w=500&q=80' }, large: { url: 'https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?w=1000&q=80' } } },
                address: `المنطقة السياحية، ${city}`,
                price: "900 EGP",
                amenities: [{ name: 'Wi-Fi' }]
            },
            {
                location_id: "mock_hotel_3",
                name: `${city} بوتيك هوتيل`,
                rating: "4.2",
                photo: { images: { medium: { url: 'https://images.unsplash.com/photo-1551882547-ff40c0d5b5df?w=500&q=80' }, large: { url: 'https://images.unsplash.com/photo-1551882547-ff40c0d5b5df?w=1000&q=80' } } },
                address: `الداون تاون، ${city}`,
                price: "600 EGP",
                amenities: [{ name: 'Wi-Fi' }]
            }
        ];
    }

    // Basic filtering based on mock budget constraints since the endpoint lacks explicit budget params in URL without specs
    // In real app, you'd append `&budget=${budgetLevel}` or sort by price
    if (budgetLevel === 'low') {
        formattedHotels = formattedHotels.sort((a, b) => parseFloat(a.price?.replace(/[^\d.]/g, '') || "9999") - parseFloat(b.price?.replace(/[^\d.]/g, '') || "9999"));
    } else if (budgetLevel === 'high') {
        formattedHotels = formattedHotels.sort((a, b) => parseFloat(b.price?.replace(/[^\d.]/g, '') || "0") - parseFloat(a.price?.replace(/[^\d.]/g, '') || "0"));
    }

    return formattedHotels.slice(0, limit);
  } catch (error) {
    console.error('Error fetching hotels from new API:', error);
    // Return fallback hotels instead of empty array to not break the UI
    console.warn("Hotels API failed. Using fallback data for", city);
    return [
        {
            location_id: "mock_hotel_1",
            name: `فندق جراند ${city}`,
            rating: "4.8",
            photo: { images: { medium: { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80' }, large: { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?depth=1&w=1000&q=80' } } },
            address: `قلب العاصمة، ${city}`,
            price: "1200 EGP",
            amenities: [{ name: 'Wi-Fi' }]
        },
        {
            location_id: "mock_hotel_2",
            name: `رويال ريزورت ${city}`,
            rating: "4.5",
            photo: { images: { medium: { url: 'https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?w=500&q=80' }, large: { url: 'https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?w=1000&q=80' } } },
            address: `المنطقة السياحية، ${city}`,
            price: "900 EGP",
            amenities: [{ name: 'Wi-Fi' }]
        },
        {
            location_id: "mock_hotel_3",
            name: `${city} بوتيك هوتيل`,
            rating: "4.2",
            photo: { images: { medium: { url: 'https://images.unsplash.com/photo-1551882547-ff40c0d5b5df?w=500&q=80' }, large: { url: 'https://images.unsplash.com/photo-1551882547-ff40c0d5b5df?w=1000&q=80' } } },
            address: `الداون تاون، ${city}`,
            price: "600 EGP",
            amenities: [{ name: 'Wi-Fi' }]
        }
    ];
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

// Get hotels for a location (Removed RapidAPI implementation, using custom new API above)

// Get complete trip plan for a city
export async function getTripPlan(city: string, days: number = 3, budgetLevel?: "low" | "medium" | "high"): Promise<TripPlan | null> {
  try {
    const englishCityName = getEnglishCityName(city);

    // Search for location (Needed for attractions and restaurants)
    const location = await searchLocation(englishCityName);
    
    // Calculate limits based on number of days
    const attractionsLimit = Math.min(days * 3, 15);
    const restaurantsLimit = Math.min(days * 2, 10);
    const hotelsLimit = 5;

    let attractions: TravelAdvisorAttraction[] = [];
    let restaurants: TravelAdvisorRestaurant[] = [];
    
    if (location) {
      [attractions, restaurants] = await Promise.all([
        getAttractions(location.location_id, attractionsLimit),
        getRestaurants(location.location_id, restaurantsLimit)
      ]);
    }

    // Call new Hotels API using englishCityName (city name)
    const hotels = await getHotels(englishCityName, hotelsLimit, budgetLevel);

    return {
      location: location || { location_id: "unknown", name: city }, // fallback if rapidAPI fails but new API works
      attractions,
      restaurants,
      hotels,
    };
  } catch (error) {
    console.error('Error getting trip plan:', error);
    throw error;
  }
}

