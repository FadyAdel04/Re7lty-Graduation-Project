export interface ContactInfo {
    phone: string;
    whatsapp: string;
    email: string;
    website?: string;
    address?: string;
}

export interface Company {
    id: string;
    name: string;
    logo: string; // URL or initials
    rating: number;
    description: string;
    contactInfo: ContactInfo;
    tags: string[];
    color: string; // Tailwind gradient classes
    tripsCount: number;
}

export interface ItineraryDay {
    day: number;
    title: string;
    description: string;
    activities: string[];
}

export interface Trip {
    id: string; // slug-based
    title: string;
    destination: string;
    duration: string;
    price: string;
    rating: number;
    images: string[];
    shortDescription: string;
    fullDescription: string;
    itinerary: ItineraryDay[];
    includedServices: string[];
    excludedServices: string[];
    meetingLocation: string;
    bookingMethod: {
        whatsapp: boolean;
        phone: boolean;
        website: boolean;
    };
    companyId: string;
    likes?: number;
    maxGroupSize?: number;
    difficulty?: 'سهل' | 'متوسط' | 'صعب';
    season?: string;
}

export interface TripFilters {
    destination?: string;
    priceRange?: {
        min: number;
        max: number;
    };
    duration?: string;
    companyId?: string;
    minRating?: number;
    searchQuery?: string;
    season?: string;
}
