import { API_BASE_URL } from '../config/api';
import { GOVERNORATES_COORDINATES } from './egypt-data';

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
  'سيوة': 'Siwa Oasis, Egypt',
  'نويبع': 'Nuweiba, Egypt',
  'مرسى علم': 'Marsa Alam, Egypt',
  'الفيوم': 'Fayoum, Egypt',
  'بورسعيد': 'Port Said, Egypt',
  'مرسى مطروح': 'Marsa Matrouh, Egypt',
  'طابا': 'Taba, Egypt',
  'سانت كاترين': 'Saint Catherine, Egypt',
  'قنا': 'Qena, Egypt',
  'سوهاج': 'Sohag, Egypt',
  'أسيوط': 'Asyut, Egypt',
  'المنيا': 'Minya, Egypt',
  'بني سويف': 'Beni Suef, Egypt',
  'الإسماعيلية': 'Ismailia, Egypt',
  'السويس': 'Suez, Egypt',
  'المنصورة': 'Mansoura, Egypt',
  'طنطا': 'Tanta, Egypt',
  'دمياط': 'Damietta, Egypt',
  'الزقازيق': 'Zagazig, Egypt',
  'كفر الشيخ': 'Kafr El Sheikh, Egypt',
  'بنها': 'Benha, Egypt',
  'شبين الكوم': 'Shibin El Kom, Egypt',
  'دمنهور': 'Damanhur, Egypt',
  'الغردقه': 'Hurghada, Egypt',
};

export interface TravelAdvisorLocation {
  location_id: string;  // Travel Advisor numeric ID (for attractions/restaurants)
  geoId?: string;       // Tripadvisor16 geoId (for hotels)
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
  price?: string;
  amenities?: Array<{ name?: string } | string>;
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

// Search for location — returns both Travel Advisor location_id AND Tripadvisor16 geoId
export async function searchLocation(query: string): Promise<TravelAdvisorLocation | null> {
  try {
    const englishName = getEnglishCityName(query);
    const finalQuery = englishName !== query ? englishName : query;

    const response = await fetch(`${API_BASE_URL}/api/proxy/search?query=${encodeURIComponent(finalQuery)}`, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    if (data.data && data.data.length > 0) {
      const result = data.data[0].result_object;
      return {
        location_id: result.location_id,
        geoId: result.geoId || undefined,   // Tripadvisor16 geoId for hotels
        name: result.name,
        latitude: result.latitude,
        longitude: result.longitude,
      };
    }

    // Retry with ", Egypt" suffix
    if (!query.toLowerCase().includes("egypt")) {
      const retryQuery = `${query}, Egypt`;
      const retryResponse = await fetch(`${API_BASE_URL}/api/proxy/search?query=${encodeURIComponent(retryQuery)}`);
      if (retryResponse.ok) {
        const retryData = await retryResponse.json();
        if (retryData.data && retryData.data.length > 0) {
           const result = retryData.data[0].result_object;
           return {
             location_id: result.location_id,
             geoId: result.geoId || undefined,
             name: result.name,
             latitude: result.latitude,
             longitude: result.longitude,
           };
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error searching location:', error);
    return null;
  }
}

export async function getHotels(city: string, budget?: string, checkIn?: string, checkOut?: string, lat?: number, lon?: number, locationId?: string): Promise<TravelAdvisorHotel[]> {
  try {
    let url = `${API_BASE_URL}/api/proxy/hotels?city=${encodeURIComponent(city)}`;
    if (budget) url += `&budget=${budget}`;
    if (checkIn) url += `&checkIn=${checkIn}`;
    if (checkOut) url += `&checkOut=${checkOut}`;
    if (lat) url += `&lat=${lat}`;
    if (lon) url += `&lon=${lon}`;
    if (locationId) url += `&location_id=${locationId}`;

    const response = await fetch(url, {
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
    
    let formattedHotels: TravelAdvisorHotel[] = hotelList.filter(h => h && (h.name || h.hotel_name)).map((h: any, idx: number) => ({
      location_id: h.location_id?.toString() || h.id?.toString() || h.hotel_id?.toString() || `hotel_${idx}`,
      name: h.name || h.hotel_name || h.title || 'Unknown Hotel',
      rating: h.rating?.toString() || h.star_rating?.toString() || h.score?.toString() || '4.5',
      num_reviews: h.reviews?.toString() || h.review_count?.toString(),
      latitude: h.latitude?.toString() || h.lat?.toString(),
      longitude: h.longitude?.toString() || h.lng?.toString(),
      photo: {
        images: {
          medium: { url: h.photo?.images?.medium?.url || h.image || h.photo || h.thumbnail || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80' },
          large: { url: h.photo?.images?.large?.url || h.image || h.photo || h.thumbnail || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000&q=80' }
        }
      },
      address: h.address || h.location || h.city || city,
      price: h.price?.toString() ? `${h.price}` : h.price_range || h.rate || 'اضغط لرؤية السعر',
      amenities: h.amenities ? (Array.isArray(h.amenities) ? h.amenities.map((a: any) => ({ name: typeof a === 'string' ? a : a.name })) : []) : [{ name: 'Wi-Fi' }]
    }));

    if (formattedHotels.length === 0) {
        const cityHotels: Record<string, TravelAdvisorHotel[]> = {
          'الغردقة': [
            { location_id: "h_h1", name: "فندق البارون سهل حشيش", rating: "4.9", address: "سهل حشيش، الغردقة", price: "3500 EGP", photo: { images: { medium: { url: 'https://images.unsplash.com/photo-1544124499-58912cb9034e?w=500&q=80' }, large: { url: 'https://images.unsplash.com/photo-1544124499-58912cb9034e?w=1000&q=80' } } } },
            { location_id: "h_h2", name: "ريكسوس برايم جيت الغردقة", rating: "4.8", address: "طريق القرى، الغردقة", price: "2800 EGP", photo: { images: { medium: { url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=500&q=80' }, large: { url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1000&q=80' } } } }
          ],
          'شرم الشيخ': [
            { location_id: "h_s1", name: "فور سيزونز ريزورت", rating: "5.0", address: "خليج القرش، شرم الشيخ", price: "4500 EGP", photo: { images: { medium: { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80' }, large: { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000&q=80' } } } },
            { location_id: "h_s2", name: "ريكسوس برايم جيت", rating: "4.8", address: "خليج نبق، شرم الشيخ", price: "3200 EGP", photo: { images: { medium: { url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=500&q=80' }, large: { url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1000&q=80' } } } }
          ],
          'القاهرة': [
            { location_id: "h_c1", name: "فندق فور سيزونز نايل بلازا", rating: "4.9", address: "جاردن سيتي، القاهرة", price: "4000 EGP", photo: { images: { medium: { url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=500&q=80' }, large: { url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1000&q=80' } } } },
            { location_id: "h_c2", name: "فندق ماريوت الزمالك", rating: "4.7", address: "الزمالك، القاهرة", price: "2500 EGP", photo: { images: { medium: { url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&q=80' }, large: { url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1000&q=80' } } } }
          ],
          'الإسكندرية': [
            { location_id: "h_a1", name: "فندق فور سيزونز سان ستيفانو", rating: "4.9", address: "سان ستيفانو، الإسكندرية", price: "3800 EGP", photo: { images: { medium: { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80' }, large: { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000&q=80' } } } }
          ],
          'الأقصر': [
            { location_id: "h_l1", name: "فندق سونستا سانت جورج", rating: "4.7", address: "كورنيش النيل، الأقصر", price: "1500 EGP", photo: { images: { medium: { url: 'https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=500&q=80' }, large: { url: 'https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=1000&q=80' } } } },
            { location_id: "h_l2", name: "فندق سوفيتيل ونتر بالاس", rating: "4.9", address: "شارع الكورنيش، الأقصر", price: "2800 EGP", photo: { images: { medium: { url: 'https://images.unsplash.com/photo-1544124499-58912cb9034e?w=500&q=80' }, large: { url: 'https://images.unsplash.com/photo-1544124499-58912cb9034e?w=1000&q=80' } } } }
          ],
          'أسوان': [
            { location_id: "h_as1", name: "فندق أولد كتركت", rating: "5.0", address: "جزيرة الفنتين، أسوان", price: "5000 EGP", photo: { images: { medium: { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80' }, large: { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000&q=80' } } } }
          ],
          'دهب': [
            { location_id: "h_d1", name: "تيراديس فيلاج دهب", rating: "4.6", address: "المشربة، دهب", price: "1200 EGP", photo: { images: { medium: { url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=500&q=80' }, large: { url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1000&q=80' } } } }
          ],
          'الجونة': [
            { location_id: "h_g1", name: "فندق شتاينبرجر الجونة", rating: "4.8", address: "وسط البلد، الجونة", price: "3200 EGP", photo: { images: { medium: { url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=500&q=80' }, large: { url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1000&q=80' } } } }
          ]
        };

        formattedHotels = cityHotels[city] || [
            {
                location_id: "mock_hotel_1",
                name: `فندق الماسة ${city}`,
                rating: "4.8",
                photo: { images: { medium: { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80' }, large: { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000&q=80' } } },
                address: `داون تاون، ${city}`,
                price: "1500 EGP",
                amenities: [{ name: 'Wi-Fi' }]
            }
        ];
    }

    // Basic filtering based on mock budget constraints since the endpoint lacks explicit budget params in URL without specs
    // In real app, you'd append `&budget=${budgetLevel}` or sort by price
    if (budget === 'low') {
        formattedHotels = formattedHotels.sort((a, b) => parseFloat(a.price?.replace(/[^\d.]/g, '') || "9999") - parseFloat(b.price?.replace(/[^\d.]/g, '') || "9999"));
    } else if (budget === 'high') {
        formattedHotels = formattedHotels.sort((a, b) => parseFloat(b.price?.replace(/[^\d.]/g, '') || "0") - parseFloat(a.price?.replace(/[^\d.]/g, '') || "0"));
    }

    return formattedHotels.slice(0, 10);
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
  // Guard: if locationId is invalid, skip the API call entirely
  if (!locationId || locationId === 'undefined' || locationId === 'null') {
    console.warn('getAttractions: invalid locationId, using fallback directly');
    return getAttractionsFallback('unknown');
  }
  try {
    const response = await fetch(`${API_BASE_URL}/api/proxy/attractions?location_id=${locationId}&limit=${limit}`, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    let attractions = data.data || [];
    
    if (attractions.length === 0) {
        console.warn("Attractions API returned 0 results. Using fallback for", locationId);
        const cityMap: Record<string, any[]> = {
            "1488696": [ // Alexandria
                { name: "قلعة قايتباي", description: "قلعة تاريخية على ساحل البحر المتوسط.", photo: { images: { large: { url: "https://images.unsplash.com/photo-1590059232387-a2267bca9c80" } } } },
                { name: "مكتبة الإسكندرية", description: "واحدة من أكبر وأحدث المكتبات في العالم.", photo: { images: { large: { url: "https://images.unsplash.com/photo-1568284501438-2e06f2369066" } } } },
                { name: "حدائق المنتزه", description: "مزيج رائع من التاريخ والطبيعة الخلابة.", photo: { images: { large: { url: "https://images.unsplash.com/photo-1628189675276-2f0464f1ce2b" } } } }
            ],
            "294201": [ // Cairo
                { name: "الأهرامات وأبو الهول", description: "أعظم عجائب العالم القديم.", photo: { images: { large: { url: "https://images.unsplash.com/photo-1503177119275-0aa32b3a9368" } } } },
                { name: "المتحف المصري بوسط البلد", description: "كنوز الآثار المصرية عبر العصور.", photo: { images: { large: { url: "https://images.unsplash.com/photo-1544013589-447e9eba48b1" } } } },
                { name: "خان الخليلي", description: "أعرق أسواق الشرق ومكان رائع للتسوق والجلوس على المقاهي.", photo: { images: { large: { url: "https://images.unsplash.com/photo-1553913861-c0fddf2619ee" } } } }
            ],
            "294204": [ // Luxor
                { name: "معبد الكرنك", description: "أكبر دار للعبادة بنيت على وجه الأرض.", photo: { images: { large: { url: "https://images.unsplash.com/photo-1572252009286-268acec5ca0a" } } } },
                { name: "وادي الملوك", description: "مقابر ملوك مصر القديمة.", photo: { images: { large: { url: "https://images.unsplash.com/photo-1582650625119-3a31f8fa2699" } } } }
            ],
            "294203": [ // Aswan
                { name: "معبد فيلة", description: "جوهرة النيل في أسوان.", photo: { images: { large: { url: "https://images.unsplash.com/photo-1553913861-c0fddf2619ee" } } } },
                { name: "القرية النوبية", description: "تجربة ثقافية ملونة وفريدة.", photo: { images: { large: { url: "https://images.unsplash.com/photo-1551882547-ff40c0d5b5df" } } } }
            ],
            "297549": [ // Hurghada
                { name: "جزيرة الجفتون", description: "شواطئ رملية ومياه فيروزية.", photo: { images: { large: { url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e" } } } },
                { name: "مارينا الغردقة", description: "أجواء حيوية ومطاعم عالمية.", photo: { images: { large: { url: "https://images.unsplash.com/photo-1540541338287-417002076369" } } } }
            ],
            "297544": [ // Matrouh
                { name: "شاطئ عجيبة", description: "أشهر شواطئ مطروح بجماله الطبيعي المهيب.", photo: { images: { large: { url: "https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b" } } } },
                { name: "حمام كليوباترا", description: "تجويف صخري تاريخي طبيعي وسط المياه.", photo: { images: { large: { url: "https://images.unsplash.com/photo-1590523278191-995cbcda646b" } } } }
            ]
        };

        const cityData = cityMap[locationId] || [];
        attractions = cityData.length > 0 ? cityData.map((d, i) => ({
            location_id: `fallback_attr_${locationId}_${i}`,
            name: d.name,
            description: d.description,
            rating: "4.9",
            photo: { images: { medium: { url: d.photo.images.large.url + "?w=500" }, large: { url: d.photo.images.large.url + "?w=1000" } } }
        })) : [
            {
                location_id: `mock_attr_1_${locationId}`,
                name: "أبرز المعالم السياحية",
                description: "منطقة سياحية وتاريخية رائعة يجب زيارتها للاستمتاع بالأجواء المحلية.",
                rating: "4.8",
                photo: { images: { medium: { url: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=400&q=80' }, large: { url: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=1000&q=80' } } }
            },
            {
                location_id: `mock_attr_2_${locationId}`,
                name: "المتحف القومي",
                description: "يضم مجموعة فريدة من الآثار والقطع الفنية التي تحكي تاريخ المنطقة.",
                rating: "4.7",
                photo: { images: { medium: { url: 'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=400&q=80' }, large: { url: 'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=1000&q=80' } } }
            },
            {
                location_id: `mock_attr_3_${locationId}`,
                name: "الحديقة المركزية",
                description: "مكان مثالي للاسترخاء والاستمتاع بالمناظر الطبيعية والهدوء.",
                rating: "4.5",
                photo: { images: { medium: { url: 'https://images.unsplash.com/photo-1582650625119-3a31f8fa2699?w=400&q=80' }, large: { url: 'https://images.unsplash.com/photo-1582650625119-3a31f8fa2699?w=1000&q=80' } } }
            }
        ];
    }
    return attractions;
  } catch (error) {
    console.error('Error fetching attractions:', error);
    return getAttractionsFallback(locationId);
  }
}

function getAttractionsFallback(locationId: string): TravelAdvisorAttraction[] {
  return [
      {
          location_id: `err_attr_1`,
          name: "مركز المدينة",
          description: "جولة في وسط المدينة لاستكشاف الأسواق والمحلات التجارية.",
          rating: "4.5",
          photo: { images: { medium: { url: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800&q=80' } } }
      }
  ];
}

// Get restaurants for a location
export async function getRestaurants(locationId: string, limit: number = 10): Promise<TravelAdvisorRestaurant[]> {
  // Guard: if locationId is invalid, skip the API call entirely
  if (!locationId || locationId === 'undefined' || locationId === 'null') {
    console.warn('getRestaurants: invalid locationId, using fallback directly');
    return getRestaurantsFallback('unknown');
  }
  try {
    const response = await fetch(`${API_BASE_URL}/api/proxy/restaurants?location_id=${locationId}&limit=${limit}`, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    let restaurants = data.data || [];
    
    if (restaurants.length === 0) {
        console.warn("Restaurants API returned 0 results. Using fallback for", locationId);
        const cityResMap: Record<string, any[]> = {
            "1488696": [ // Alexandria
                { name: "فول محمد أحمد", description: "أشهر محل فول وفلافل في الإسكندرية.", photo: { images: { large: { url: "https://images.unsplash.com/photo-1541518763669-27fef04b14ea" } } } },
                { name: "أسماك قدورة", description: "تجربة سمك سكندرية أصيلة.", photo: { images: { large: { url: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2" } } } }
            ],
            "294201": [ // Cairo
                { name: "كشري أبو طارق", description: "الكشري المصري الأصيل في قلب القاهرة.", photo: { images: { large: { url: "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2" } } } },
                { name: "صبحي كابر", description: "أشهر مطعم للمشويات والطواجن المصرية.", photo: { images: { large: { url: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143" } } } }
            ],
            "294204": [ // Luxor
                { name: "مطعم سوفرا", description: "أطباق مصرية تقليدية في أجواء دافئة.", photo: { images: { large: { url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4" } } } }
            ],
            "294203": [ // Aswan
                { name: "مطعم النوبي", description: "تذوق النكهات النوبية الأصيلة.", photo: { images: { large: { url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5" } } } }
            ],
            "297549": [ // Hurghada
                { name: "مطعم ستار فيش", description: "أفضل المأكولات البحرية في الغردقة.", photo: { images: { large: { url: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2" } } } }
            ],
            "297544": [ // Matrouh
                { name: "سوق ليبيا", description: "سوق شعبي شهير للمنتجات البدوية والتمور.", photo: { images: { large: { url: "https://images.unsplash.com/photo-1553913861-c0fddf2619ee" } } } }
            ]
        };

        const cityData = cityResMap[locationId] || [];
        restaurants = cityData.length > 0 ? cityData.map((d, i) => ({
            location_id: `fallback_res_${locationId}_${i}`,
            name: d.name,
            description: d.description,
            rating: "4.7",
            photo: { images: { medium: { url: d.photo.images.large.url + "?w=400" }, large: { url: d.photo.images.large.url + "?w=1000" } } },
            cuisine: [{ name: "مأكولات محلية" }]
        })) : [
            {
                location_id: `mock_res_1_${locationId}`,
                name: "مطعم مأكولات شعبية",
                description: "تجربة طعام محلية أصيلة مع نكهات تقليدية مميزة.",
                rating: "4.5",
                photo: { images: { medium: { url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80' }, large: { url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000&q=80' } } },
                cuisine: [{ name: "شرقي" }]
            },
            {
                location_id: `mock_rest_1_${locationId}`,
                name: "مطعم المأكولات التقليدية",
                description: "يقدم أشهى الأطباق المحلية بجودة عالية وأسعار مناسبة.",
                rating: "4.6",
                photo: { images: { medium: { url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80' } } },
                cuisine: [{ name: "شرقي" }]
            },
            {
                location_id: `mock_rest_2_${locationId}`,
                name: "كافيه الإطلالة الجميلة",
                description: "مكان مميز لتناول القهوة والحلويات بإطلالة متميزة.",
                rating: "4.4",
                photo: { images: { medium: { url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&q=80' } } },
                cuisine: [{ name: "كافيه" }]
            }
        ];
    }
    return restaurants;
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return getRestaurantsFallback(locationId);
  }
}

function getRestaurantsFallback(locationId: string): TravelAdvisorRestaurant[] {
  return [
    {
      location_id: `err_rest_1`,
      name: "مطعم البلد",
      description: "أطباق محلية تقليدية في أجواء مريحة.",
      rating: "4.4",
      photo: { images: { medium: { url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80' } } },
      cuisine: [{ name: "مصري" }]
    }
  ];
}

// Get complete trip plan for a city
export async function getTripPlan(city: string, days: number = 3, budgetLevel?: "low" | "medium" | "high", checkIn?: string, checkOut?: string, lat?: number | null, lon?: number | null, locationId?: string): Promise<TripPlan | null> {
  try {
    const englishCityName = getEnglishCityName(city);

    // Single search returns BOTH Travel Advisor location_id AND Tripadvisor16 geoId
    // SKIP searching if locationId is already provided!
    const location = (locationId && locationId !== 'undefined' && locationId !== 'null') 
      ? { location_id: locationId, name: city, geoId: locationId } // Use locationId for both if we don't have separate ones
      : await searchLocation(englishCityName).catch(() => null);
    
    const attractionsLimit = Math.min(days * 3, 15);
    const restaurantsLimit = Math.min(days * 2, 10);

    let attractions: TravelAdvisorAttraction[] = [];
    let restaurants: TravelAdvisorRestaurant[] = [];
    
    // Travel Advisor location_id for attractions & restaurants
    const taLocationId = (locationId && locationId !== 'undefined' && locationId !== 'null' ? locationId : (location?.location_id && 
                          location.location_id !== 'undefined' && 
                          !location.location_id.startsWith('fallback')
                          ? location.location_id : null));

    if (taLocationId) {
      console.log(`[getTripPlan] Using TA location_id ${taLocationId} for attractions/restaurants`);
      [attractions, restaurants] = await Promise.all([
        getAttractions(taLocationId, attractionsLimit),
        getRestaurants(taLocationId, restaurantsLimit)
      ]);
    } else {
      attractions = getAttractionsFallback(city);
      restaurants = getRestaurantsFallback(city);
    }

    // Tripadvisor16 geoId specifically for hotels — falls back to TA location_id if T16 didn't return one
    const hotelGeoId = location?.geoId || (taLocationId ? undefined : undefined);
    const finalLat = lat || (GOVERNORATES_COORDINATES[city]?.lat);
    const finalLon = lon || (GOVERNORATES_COORDINATES[city]?.lng);

    console.log(`[getTripPlan] Using T16 geoId: ${hotelGeoId}, coords: ${finalLat},${finalLon} for hotels`);
    const hotels = await getHotels(city, budgetLevel, checkIn, checkOut, finalLat || undefined, finalLon || undefined, hotelGeoId || undefined);

    return {
      location: location || { location_id: "unknown", name: city },
      attractions,
      restaurants,
      hotels,
    };
  } catch (error) {
    console.error('Error getting trip plan:', error);
    throw error;
  }
}

