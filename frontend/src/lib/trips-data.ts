export interface Comment {
  id: string;
  author: string;
  authorId?: string;
  authorAvatar?: string;
  content: string;
  date: string;
  likes: number;
  viewerHasLiked?: boolean;
  createdAt?: string;
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
export interface Hotel {
  name: string;
  image: string;
  rating: number;
  description?: string;
  priceRange?: string;
}
export interface TripDay {
  title: string;
  date?: string;
  activities: number[]; // indexes into activities array
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
  season?: 'winter' | 'summer' | 'fall' | 'spring';
  activities: TripActivity[];
  days: TripDay[];
  foodAndRestaurants: FoodPlace[];
  hotels?: Hotel[];
  comments: Comment[];
  postedAt: string; // ISO date string
}

export const egyptTrips: Trip[] = [
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
      {
        name: "زيارة قلعة قايتباي",
        coordinates: { lat: 31.2135, lng: 29.8851 },
        images: [
          "https://www.maspero.eg/image/750/450/2025/09/17590750830.jpg"
        ],
        day: 1
      },
      {
        name: "مكتبة الإسكندرية",
        coordinates: { lat: 31.2089, lng: 29.9092 },
        images: [
          "https://static.srpcdigital.com/styles/1037xauto/public/2016/02/29/fadaad-290216-2.jpg.webp"
        ],
        day: 1
      },
      {
        name: "كورنيش الإسكندرية",
        coordinates: { lat: 31.2156, lng: 29.9020 },
        images: [
          "https://img.youm7.com/ArticleImgs/2021/10/16/262157-%D8%B3%D9%8A%D9%88%D9%84%D8%A9-%D9%85%D8%B1%D9%88%D8%B1%D9%8A%D8%A9-%D8%B9%D9%84%D9%89-%D9%83%D9%88%D8%B1%D9%86%D9%8A%D8%B4-%D8%A7%D8%B3%D9%83%D9%86%D8%AF%D8%B1%D9%8A%D8%A9-(2).jpeg"
        ],
        day: 2
      },
      {
        name: "المتحف اليوناني الروماني",
        coordinates: { lat: 31.2002, lng: 29.9136 },
        images: [
          "https://www.maspero.eg/image/750/450/2023/10/16970437230.jpg"
        ],
        day: 2
      },
    ],
    days: [
      { title: "اليوم الأول", activities: [0, 1] },
      { title: "اليوم الثاني", activities: [2, 3] }
    ],
    foodAndRestaurants: [
      {
        name: "مطعم محمد أحمد",
        image: "https://www.urtrips.com/wp-content/uploads/2022/12/Mohamed-Ahmed-Restaurant-Alexandria3.png",
        rating: 4.7,
        description: "من أشهر مطاعم الفول والفلافل في الإسكندرية."
      },
      {
        name: "مطعم كبدة الفلاح",
        image: "https://m.gomhuriaonline.com/Upload/News/10-8-2023_03_52_11_GomhuriaOnline_3911691628731.jpeg",
        rating: 4.5,
        description: "كبده الفلاح بمحطة الرمل بالإسكندرية اشهر مطعم كبدة في مصر"
      },
      {
        name: "أسماك قدورة",
        image: "https://media-cdn.tripadvisor.com/media/photo-s/0d/a9/4d/72/photo0jpg.jpg",
        rating: 4.8,
        description: "أفضل المطاعم للأكلات البحرية الطازجة."
      }
    ],
    comments: [
      { id: "c1", author: "سارة أحمد", content: "رحلة رائعة! الإسكندرية مدينة ساحرة فعلاً", date: "منذ يومين", likes: 5 },
      { id: "c2", author: "محمد علي", content: "شكراً على المعلومات القيمة، سأزور الإسكندرية قريباً", date: "منذ ٣ أيام", likes: 3 }
    ],
    postedAt: "2025-10-25T10:00:00Z"
  },
  {
    id: "2",
    title: "الشواطئ الفيروزية في مرسى مطروح",
    destination: "مرسى مطروح",
    city: "مرسى مطروح",
    duration: "٤ أيام",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&h=600&fit=crop",
    author: "سارة المسافرة",
    authorFollowers: 3420,
    likes: 198,
    weeklyLikes: 89,
    saves: 145,
    shares: 56,
    description: "استمتع بأجمل شواطئ مصر وشاهد المياه الفيروزية الصافية",
    budget: "2000 جنيه",
    activities: [
      {
        name: "شاطئ عجيبة",
        coordinates: { lat: 31.3560, lng: 27.2161 },
        images: ["https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop"],
        day: 1
      },
      {
        name: "شاطئ الأبيض",
        coordinates: { lat: 31.4101, lng: 27.0488 },
        images: ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop"],
        day: 2
      },
      {
        name: "كهف رومل",
        coordinates: { lat: 31.3564, lng: 27.2272 },
        images: ["https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=600&fit=crop"],
        day: 2
      },
      {
        name: "جولة بالقوارب",
        coordinates: { lat: 31.3460, lng: 27.2110 },
        images: ["https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800&h=600&fit=crop"],
        day: 3
      },
    ],
    days: [
      { title: "اليوم الأول", activities: [0] },
      { title: "اليوم الثاني", activities: [1, 2] },
      { title: "اليوم الثالث", activities: [3] },
    ],
    foodAndRestaurants: [
      {
        name: "مطعم ابو خالد",
        image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop",
        rating: 4.3,
        description: "أشهر مطاعم الأسماك الطازجة في مرسى مطروح."
      }
    ],
    comments: [
      { id: "c3", author: "أحمد حسن", content: "مياه صافية جداً والمناظر خيالية!", date: "منذ يوم", likes: 12 },
      { id: "c4", author: "نور الدين", content: "أفضل شواطئ زرتها في مصر", date: "منذ ٤ أيام", likes: 8 }
    ],
    postedAt: "2025-10-26T08:30:00Z"
  },
  {
    id: "3",
    title: "رحلة تاريخية في الأقصر",
    destination: "الأقصر",
    city: "الأقصر",
    duration: "٥ أيام",
    rating: 5.0,
    image: "https://al-rahhala.com/wp-content/uploads/2019/10/%D9%85%D8%AA%D8%AD%D9%81-%D8%A7%D9%84%D8%A7%D9%82%D8%B5%D8%B1.jpg",
    author: "محمد الرحال",
    authorFollowers: 5680,
    likes: 256,
    weeklyLikes: 134,
    saves: 234,
    shares: 89,
    description: "اكتشف كنوز الحضارة المصرية القديمة في مدينة المائة باب",
    budget: "3500 جنيه",
    activities: [
      {
        name: "معبد حتشبسوت",
        coordinates: { lat: 25.7376, lng: 32.6065 },
        images: ["https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800&h=600&fit=crop"],
        day: 1
      },
      {
        name: "جولة بالمنطاد",
        coordinates: { lat: 25.7000, lng: 32.6500 },
        images: ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop"],
        day: 2
      },
    ],
    days: [
      { title: "اليوم الأول", activities: [0] },
      { title: "اليوم الثاني", activities: [1] },
    ],
    foodAndRestaurants: [
    ],
    comments: [
      { id: "c5", author: "فاطمة محمود", content: "تجربة لا تنسى! المعابد مذهلة", date: "منذ ساعتين", likes: 15 },
      { id: "c6", author: "خالد عبدالله", content: "جولة المنطاد كانت الأفضل", date: "منذ يوم", likes: 10 }
    ],
    postedAt: "2025-10-24T15:10:00Z"
  },
  {
    id: "4",
    title: "سحر النيل في أسوان",
    destination: "أسوان",
    city: "أسوان",
    duration: "٤ أيام",
    rating: 4.7,
    image: "https://www.civilaviation.gov.eg/cityPhotos/1015c4fb-4575-4694-a655-66974a24fc06/20251006_141148899_6.jpg",
    author: "فاطمة الشمري",
    authorFollowers: 2340,
    likes: 187,
    weeklyLikes: 67,
    saves: 123,
    shares: 45,
    description: "رحلة نوبية ساحرة على ضفاف النيل مع معابد فرعونية عريقة",
    budget: "2800 جنيه",
    activities: [
      {
        name: "معبد فيلة",
        coordinates: { lat: 24.0262, lng: 32.8872 },
        images: ["https://images.unsplash.com/photo-1504851149312-7a075b496cc7?w=800&h=600&fit=crop"],
        day: 1
      },
      {
        name: "السد العالي",
        coordinates: { lat: 23.9702, lng: 32.8776 },
        images: ["https://images.unsplash.com/photo-1576675466969-38eeae4b41f6?w=800&h=600&fit=crop"],
        day: 2
      },
      {
        name: "جزيرة الفنتين",
        coordinates: { lat: 24.0903, lng: 32.8856 },
        images: ["https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800&h=600&fit=crop"],
        day: 3
      },
      {
        name: "القرية النوبية",
        coordinates: { lat: 24.1001, lng: 32.8805 },
        images: ["https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&h=600&fit=crop"],
        day: 4
      },
    ],
    days: [
      { title: "اليوم الأول", activities: [0] },
      { title: "اليوم الثاني", activities: [1] },
      { title: "اليوم الثالث", activities: [2] },
      { title: "اليوم الرابع", activities: [3] },
    ],
    foodAndRestaurants: [

    ],
    comments: [
      { id: "c7", author: "ياسمين سعيد", content: "القرية النوبية رائعة والناس طيبين جداً", date: "منذ ٣ أيام", likes: 7 }
    ],
    postedAt: "2025-10-22T12:45:00Z"
  },
  {
    id: "5",
    title: "الغوص في أعماق الغردقة",
    destination: "الغردقة",
    city: "الغردقة",
    duration: "٥ أيام",
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop",
    author: "عمر الجوال",
    authorFollowers: 4120,
    likes: 212,
    weeklyLikes: 78,
    saves: 178,
    shares: 67,
    description: "استكشف الشعاب المرجانية الساحرة في البحر الأحمر",
    budget: "4000 جنيه",
    activities: [
      {
        name: "الغوص",
        coordinates: { lat: 27.2579, lng: 33.8116 },
        images: ["https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop"],
        day: 1
      },
      {
        name: "جزيرة جفتون",
        coordinates: { lat: 27.2089, lng: 33.9640 },
        images: ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop"],
        day: 2
      },
      {
        name: "رحلة سفاري",
        coordinates: { lat: 27.0132, lng: 33.8361 },
        images: ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop"],
        day: 3
      },
      {
        name: "السباحة مع الدلافين",
        coordinates: { lat: 27.2579, lng: 33.8100 },
        images: ["https://images.unsplash.com/photo-1576675466969-38eeae4b41f6?w=800&h=600&fit=crop"],
        day: 4
      },
    ],
    days: [
      { title: "اليوم الأول", activities: [0] },
      { title: "اليوم الثاني", activities: [1] },
      { title: "اليوم الثالث", activities: [2] },
      { title: "اليوم الرابع", activities: [3] }
    ],
    foodAndRestaurants: [
      {
        name: "مطعم حدوتة بحرية",
        image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop",
        rating: 4.7,
        description: "أفضل مطعم مأكولات بحرية وموقع رائع على البحر."
      }
    ],
    comments: [
      { id: "c8", author: "حسام الدين", content: "الغوص مع الدلافين كان حلم!", date: "منذ ٥ أيام", likes: 9 },
      { id: "c9", author: "ريم خالد", content: "الشعاب المرجانية جميلة جداً", date: "منذ أسبوع", likes: 6 }
    ],
    postedAt: "2025-10-27T09:20:00Z"
  },
  {
    id: "6",
    title: "مغامرات شرم الشيخ",
    destination: "شرم الشيخ",
    city: "شرم الشيخ",
    duration: "٤ أيام",
    rating: 4.8,
    image: "https://i0.wp.com/egy-visa.com/wp-content/uploads/2024/01/%D8%B4%D8%B1%D9%85-%D8%A7%D9%84%D8%B4%D9%8A%D8%AE.jpg?fit=1000%2C667&ssl=1",
    author: "ليلى الرحالة",
    authorFollowers: 6780,
    likes: 243,
    weeklyLikes: 156,
    saves: 267,
    shares: 98,
    description: "بين الجبال والبحر، استمتع بجمال سيناء الساحر",
    budget: "3500 جنيه",
    activities: [
      {
        name: "خليج نعمة",
        coordinates: { lat: 27.9158, lng: 34.3300 },
        images: ["https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop"],
        day: 1
      },
      {
        name: "محمية رأس محمد",
        coordinates: { lat: 27.7236, lng: 34.2491 },
        images: ["https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=600&fit=crop"],
        day: 2
      },
      {
        name: "رحلة سفاري",
        coordinates: { lat: 27.9362, lng: 34.3757 },
        images: ["https://images.unsplash.com/photo-1504851149312-7a075b496cc7?w=800&h=600&fit=crop"],
        day: 3
      },
    ],
    days: [
      { title: "اليوم الأول", activities: [0] },
      { title: "اليوم الثاني", activities: [1] },
      { title: "اليوم الثالث", activities: [2] },

    ],
    foodAndRestaurants: [
    ],
    comments: [
      { id: "c10", author: "طارق مصطفى", content: "محمية رأس محمد من أجمل الأماكن", date: "منذ ساعة", likes: 18 },
      { id: "c11", author: "منى إبراهيم", content: "دير سانت كاترين مكان روحاني جداً", date: "منذ يومين", likes: 11 }
    ],
    postedAt: "2025-10-23T18:05:00Z"
  },
  {
    id: "7",
    title: "الواحات البحرية الخلابة",
    destination: "الواحات البحرية",
    city: "الواحات البحرية",
    duration: "٣ أيام",
    rating: 4.5,
    image: "https://upload.wikimedia.org/wikipedia/commons/a/a9/BahriyaSaltLake.jpg",
    author: "يوسف المغامر",
    authorFollowers: 1890,
    likes: 156,
    weeklyLikes: 54,
    saves: 98,
    shares: 34,
    description: "رحلة صحراوية فريدة مع ينابيع ساخنة وجبال خلابة",
    budget: "2200 جنيه",
    activities: [
      {
        name: "الصحراء البيضاء",
        coordinates: { lat: 27.3800, lng: 28.0800 },
        images: ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop"],
        day: 1
      },
      {
        name: "العيون الساخنة",
        coordinates: { lat: 27.6905, lng: 28.9570 },
        images: ["https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800&h=600&fit=crop"],
        day: 2
      },
      {
        name: "التخييم",
        coordinates: { lat: 27.3905, lng: 28.3920 },
        images: ["https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800&h=600&fit=crop"],
        day: 3
      },
    ],
    days: [
      { title: "اليوم الأول", activities: [0] },
      { title: "اليوم الثاني", activities: [1, 2] },
    ],
    foodAndRestaurants: [
      {
        name: "مطعم الواحة",
        image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop",
        rating: 4.1,
        description: "أفضل مطعم محلي في الواحات البحرية يقدم أطباق البدو."
      }
    ],
    comments: [
      { id: "c12", author: "عبدالرحمن علي", content: "الصحراء البيضاء تجربة فريدة!", date: "منذ ٦ أيام", likes: 4 }
    ],
    postedAt: "2025-10-21T09:00:00Z"
  },
  {
    id: "8",
    title: "سحر دهب وجماله البدوي",
    destination: "دهب",
    city: "دهب",
    duration: "٤ أيام",
    rating: 4.7,
    image: "https://media-cdn.tripadvisor.com/media/photo-s/11/82/18/78/blue-hole.jpg",
    author: "نورا السياحة",
    authorFollowers: 2560,
    likes: 189,
    weeklyLikes: 72,
    saves: 145,
    shares: 52,
    description: "استرخ في أجواء بدوية هادئة مع أجمل مواقع الغوص",
    budget: "1800 جنيه",
    activities: [
      {
        name: "Blue Hole",
        coordinates: { lat: 28.5721, lng: 34.5362 },
        images: ["https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=800&h=600&fit=crop"],
        day: 1
      },
      {
        name: "الكانيون",
        coordinates: { lat: 28.5772, lng: 34.5328 },
        images: ["https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&h=600&fit=crop"],
        day: 2
      },
      {
        name: "جبل موسى",
        coordinates: { lat: 28.5394, lng: 33.9756 },
        images: ["https://images.unsplash.com/photo-1504851149312-7a075b496cc7?w=800&h=600&fit=crop"],
        day: 3
      },
      {
        name: "اليوغا على الشاطئ",
        coordinates: { lat: 28.5094, lng: 34.5089 },
        images: ["https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop"],
        day: 4
      },
    ],
    days: [
      { title: "اليوم الأول", activities: [0] },
      { title: "اليوم الثاني", activities: [1] },
      { title: "اليوم الثالث", activities: [2] },
      { title: "اليوم الرابع", activities: [3] },
    ],
    foodAndRestaurants: [

    ],
    comments: [
      { id: "c13", author: "سلمى حسين", content: "دهب مكان مثالي للاسترخاء", date: "منذ ٣ أيام", likes: 14 },
      { id: "c14", author: "كريم سامي", content: "Blue Hole تجربة غوص رائعة", date: "منذ ٤ أيام", likes: 9 }
    ],
    postedAt: "2025-10-20T14:25:00Z"
  }
];

export const travelTemplates = [
  {
    id: "t1",
    title: "عطلة نهاية أسبوع في الغردقة",
    destination: "الغردقة",
    duration: "يومان",
    budget: "2000 جنيه",
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop",
    uses: 92,
    rating: 4.7
  },
  {
    id: "t2",
    title: "غوص واستجمام في شرم الشيخ",
    destination: "شرم الشيخ",
    duration: "٥ أيام",
    budget: "3500 جنيه",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop",
    uses: 88,
    rating: 4.9
  },
  {
    id: "t3",
    title: "رحلة ثقافية في القاهرة",
    destination: "القاهرة",
    duration: "٤ أيام",
    budget: "2800 جنيه",
    image: "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800&h=600&fit=crop",
    uses: 102,
    rating: 4.8
  }
];
