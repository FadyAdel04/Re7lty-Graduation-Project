// Travel Advisor API service using RapidAPI
const RAPIDAPI_KEY = '8887399421msh0d6d70328fb0fa5p1da174jsn2a02cf1627bc';
const RAPIDAPI_HOST = 'travel-advisor.p.rapidapi.com';
const BASE_URL = 'https://travel-advisor.p.rapidapi.com';

// Map Arabic city names to English for API
const cityNameMap: Record<string, string[]> = {
  'القاهرة': ['Cairo, Egypt', 'Cairo'],
  'الإسكندرية': ['Alexandria, Egypt', 'Alexandria'],
  'الأقصر': ['Luxor, Egypt', 'Luxor'],
  'أسوان': ['Aswan, Egypt', 'Aswan'],
  'شرم الشيخ': ['Sharm El Sheikh, Egypt', 'Sharm El Sheikh'],
  'دهب': ['Dahab, Egypt', 'Dahab'],
  'الجونة': ['El Gouna, Egypt', 'El Gouna'],
  'الغردقة': ['Hurghada, Egypt', 'Hurghada'],
  'مرسى مطروح': ['Marsa Matrouh, Egypt', 'Marsa Matrouh', 'Matrouh, Egypt', 'Matrouh'],
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
  location_id?: string;
  name?: string;
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
      original?: {
        url?: string;
      };
    };
  };
  address?: string;
  price?: string;
  price_level?: string;
  amenities?: Array<{ name?: string }>;
  website?: string;
  phone?: string;
  description?: string;
  latitude?: string;
  longitude?: string;
  // Additional fields that might be in the response
  [key: string]: any;
}

export interface TripPlan {
  location: TravelAdvisorLocation;
  attractions: TravelAdvisorAttraction[];
  restaurants: TravelAdvisorRestaurant[];
  hotels: TravelAdvisorHotel[];
}

// Helper function to get English city name (returns first variation, search will try all)
function getEnglishCityName(arabicCity: string): string {
  const variations = cityNameMap[arabicCity] || [arabicCity];
  return variations[0];
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

// Get hotels for a location using v2 POST endpoint
export async function getHotels(locationId: string, limit: number = 10): Promise<TravelAdvisorHotel[]> {
  try {
    const response = await fetch(`${BASE_URL}/hotels/v2/list`, {
      method: 'POST',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        location_id: locationId,
        currency: 'USD',
        lang: 'en_US',
        lunit: 'km',
        limit: limit,
        sort: 'recommended',
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const hotels = data.data || [];
    
    // Log to debug structure
    if (hotels.length > 0) {
      console.log('Sample hotel data:', hotels[0]);
    }
    
    // Map the response to our interface, handling different possible structures
    return hotels.map((hotel: any) => {
      // Handle different possible response structures
      const result = hotel.result_object || hotel;
      return {
        location_id: result.location_id || result.locationId || String(result.location_id),
        name: result.name || result.hotel_name || 'Unknown Hotel',
        rating: result.rating || result.rating_string || result.rating_value,
        num_reviews: result.num_reviews || result.review_count || result.reviewCount,
        photo: result.photo || result.images || result.primary_photo,
        address: result.address || result.address_obj?.address_string || result.location_string,
        price: result.price || result.price_tag || result.price_range,
        price_level: result.price_level || result.price_tag,
        amenities: result.amenities || result.amenity_list || [],
        website: result.website || result.web_url,
        phone: result.phone || result.phone_number,
        description: result.description || result.overview,
        latitude: result.latitude || result.lat,
        longitude: result.longitude || result.lng,
      };
    });
  } catch (error) {
    console.error('Error fetching hotels:', error);
    return [];
  }
}

// Get photos for a location using v2 POST endpoint
export async function getPhotos(locationId: string, limit: number = 10): Promise<any[]> {
  try {
    const response = await fetch(`${BASE_URL}/photos/v2/list`, {
      method: 'POST',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        location_id: locationId,
        limit: limit,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching photos:', error);
    return [];
  }
}

// Get reviews for a location using v2 POST endpoint
export async function getReviews(locationId: string, limit: number = 10): Promise<any[]> {
  try {
    const response = await fetch(`${BASE_URL}/reviews/v2/list`, {
      method: 'POST',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        location_id: locationId,
        limit: limit,
        lang: 'en_US',
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
}

// Get complete trip plan for a city
export async function getTripPlan(city: string, days: number = 3): Promise<TripPlan | null> {
  try {
    // Get all possible name variations for the city
    const variations = cityNameMap[city] || [city];
    
    // Try each variation until one works
    let location = null;
    for (const variation of variations) {
      try {
        location = await searchLocation(variation);
        if (location) {
          console.log(`Found location for ${city} using: ${variation}`);
          break;
        }
      } catch (error) {
        console.log(`Failed to find location for ${city} using: ${variation}`);
        continue;
      }
    }
    
    if (!location) {
      throw new Error(`Location not found for: ${city}. Tried variations: ${variations.join(', ')}`);
    }

    // Calculate limits based on number of days
    const attractionsLimit = Math.min(days * 3, 15);
    const restaurantsLimit = Math.min(days * 2, 10);
    const hotelsLimit = 10; // Increased limit for better hotel selection

    // Fetch all data in parallel
    const [attractions, restaurants, hotels] = await Promise.all([
      getAttractions(location.location_id, attractionsLimit),
      getRestaurants(location.location_id, restaurantsLimit),
      getHotels(location.location_id, hotelsLimit),
    ]);

    // Fetch photos and reviews for hotels to enrich the data
    const hotelsWithDetails = await Promise.all(
      hotels.slice(0, hotelsLimit).map(async (hotel) => {
        if (!hotel.location_id) return hotel;
        
        try {
          const [photos, reviews] = await Promise.all([
            getPhotos(hotel.location_id, 5),
            getReviews(hotel.location_id, 3),
          ]);
          
          return {
            ...hotel,
            photos: photos,
            reviews: reviews,
            // Use first photo from photos endpoint if no photo in hotel data
            photo: hotel.photo || (photos.length > 0 && photos[0]?.images ? photos[0] : undefined),
          };
        } catch (error) {
          console.error(`Error fetching details for hotel ${hotel.location_id}:`, error);
          return hotel;
        }
      })
    );

    return {
      location,
      attractions,
      restaurants,
      hotels: hotelsWithDetails,
    };
  } catch (error) {
    console.error('Error getting trip plan:', error);
    throw error;
  }
}

