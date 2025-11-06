import { seedTrips } from "../data/trips";

export interface Comment {
  id: string;
  author: string;
  authorAvatar?: string;
  content: string;
  date: string;
  likes: number;
}

export interface TripActivity {
  name: string;
  images: string[];
  coordinates: { lat: number; lng: number };
  day: number;
}
export interface FoodPlace {
  name: string;
  image: string;
  rating: number;
  description?: string;
}
export interface TripDay {
  title: string;
  date?: string;
  activities: number[];
}
export interface Trip {
  id: string;
  title: string;
  destination: string;
  city: string;
  duration: string;
  rating: number;
  image: string;
  author: string;
  authorFollowers: number;
  likes: number;
  weeklyLikes: number;
  saves: number;
  shares: number;
  description: string;
  budget: string;
  activities: TripActivity[];
  days: TripDay[];
  foodAndRestaurants: FoodPlace[];
  comments: Comment[];
  postedAt: string;
  ownerId?: string;
}

class TripsStore {
  private trips: Trip[] = [...seedTrips];

  list() { return this.trips; }
  getById(id: string) { return this.trips.find(t => t.id === id); }
  like(id: string) {
    const t = this.getById(id);
    if (!t) return null;
    t.likes += 1;
    t.weeklyLikes += 1;
    return t;
  }
  create(input: Partial<Trip>) {
    const id = (this.trips.length + 1).toString();
    const now = new Date().toISOString();
    const trip: Trip = {
      id,
      title: input.title || "رحلة جديدة",
      destination: input.destination || input.city || "",
      city: input.city || "",
      duration: input.duration || "1 يوم",
      rating: typeof input.rating === 'number' ? input.rating : 4.5,
      image: input.image || "https://placehold.co/800x600",
      author: (input as any).author || "مستخدم",
      authorFollowers: 0,
      likes: 0,
      weeklyLikes: 0,
      saves: 0,
      shares: 0,
      description: input.description || "",
      budget: input.budget || "",
      activities: (input.activities as TripActivity[]) || [],
      days: (input.days as TripDay[]) || [],
      foodAndRestaurants: (input.foodAndRestaurants as FoodPlace[]) || [],
      comments: [],
      postedAt: now,
      ownerId: input.ownerId,
    };
    this.trips.unshift(trip);
    return trip;
  }
}

export const tripsStore = new TripsStore();


