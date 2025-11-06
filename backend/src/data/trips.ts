// Minimal seed copied from frontend static data (can be extended)
import type { Trip } from "../store/tripsStore";

export const seedTrips: Trip[] = [
  {
    id: "1",
    title: "جولة ساحلية في الإسكندرية العريقة",
    destination: "الإسكندرية",
    city: "الإسكندرية",
    duration: "٣ أيام",
    rating: 4.8,
    image: "https://safaryti.com/blogs/1723451488gmy1VAITt1",
    author: "أحمد السفار",
    authorFollowers: 1250,
    likes: 124,
    weeklyLikes: 45,
    saves: 67,
    shares: 23,
    description: "استكشف جمال عروس البحر المتوسط من قلعة قايتباي إلى مكتبة الإسكندرية",
    budget: "1500 جنيه",
    activities: [
      { name: "زيارة قلعة قايتباي", coordinates: { lat: 31.2135, lng: 29.8851 }, images: ["https://www.maspero.eg/image/750/450/2025/09/17590750830.jpg"], day: 1 },
      { name: "مكتبة الإسكندرية", coordinates: { lat: 31.2089, lng: 29.9092 }, images: ["https://static.srpcdigital.com/styles/1037xauto/public/2016/02/29/fadaad-290216-2.jpg.webp"], day: 1 },
    ],
    days: [ { title: "اليوم الأول", activities: [0, 1] } ],
    foodAndRestaurants: [ { name: "مطعم محمد أحمد", image: "https://www.urtrips.com/wp-content/uploads/2022/12/Mohamed-Ahmed-Restaurant-Alexandria3.png", rating: 4.7 } ],
    comments: [ { id: "c1", author: "سارة أحمد", content: "رحلة رائعة!", date: "منذ يومين", likes: 5 } ],
    postedAt: "2025-10-25T10:00:00Z"
  }
];


