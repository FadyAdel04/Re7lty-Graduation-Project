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
  activities: TripActivity[];
  days: TripDay[];
  foodAndRestaurants: FoodPlace[];
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
    image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop",
    author: "سارة المسافرة",
    authorFollowers: 3420,
    likes: 198,
    weeklyLikes: 89,
    saves: 145,
    shares: 56,
    description: "استمتع بأجمل شواطئ مصر وشاهد المياه الفيروزية الصافية",
    budget: "2000 جنيه",
    activities: [
      { name: "شاطئ عجيبة", coordinates: { lat: 31.3560, lng: 27.2161 }, images: ["https://visitmatrouh.com/assets/img/beaches/ageeba.jpg"], day: 1 },
      { name: "شاطئ الأبيض", coordinates: { lat: 31.4101, lng: 27.0488 }, images: ["https://marsamatrouh.com/wp-content/uploads/2020/04/White-Beach-1.jpg"], day: 2 },
      { name: "كهف رومل", coordinates: { lat: 31.3564, lng: 27.2272 }, images: ["https://marsamatrouh.com/wp-content/uploads/2020/04/Rommel-Cave-2.jpg"], day: 2 },
      { name: "جولة بالقوارب", coordinates: { lat: 31.3460, lng: 27.2110 }, images: ["https://media.istockphoto.com/id/1272075929/photo/fishing-boats-in-the-harbor-in-marsa-matrouh.jpg"], day: 3 },
    ],
    days: [
      { title: "اليوم الأول", activities: [0] },
      { title: "اليوم الثاني", activities: [1,2] },
      { title: "اليوم الثالث", activities: [3] },
    ],
    foodAndRestaurants: [
      { name: "مطعم ابو خالد", image: "https://img.3ain.net/medium/9201814194781581.jpg", rating: 4.3, description: "أشهر مطاعم الأسماك الطازجة في مرسى مطروح." }
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
    image: "https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=800&h=600&fit=crop",
    author: "محمد الرحال",
    authorFollowers: 5680,
    likes: 256,
    weeklyLikes: 134,
    saves: 234,
    shares: 89,
    description: "اكتشف كنوز الحضارة المصرية القديمة في مدينة المائة باب",
    budget: "3500 جنيه",
    activities: [
      { name: "معبد الكرنك", coordinates: { lat: 25.7188, lng: 32.6573 }, images: ["https://www.egypttoday.com/siteimages/Larg/20210113083802873.jpg"], day: 1 },
      { name: "وادي الملوك", coordinates: { lat: 25.7402, lng: 32.6014 }, images: ["https://images.memphistours.com/large/5e3cbaa1be30c_wadi_el_muluk.jpg"], day: 2 },
      { name: "معبد حتشبسوت", coordinates: { lat: 25.7376, lng: 32.6065 }, images: ["https://media.istockphoto.com/id/944071082/photo/hatshepsut-temple-egypt.jpg"], day: 3 },
      { name: "جولة بالمنطاد", coordinates: { lat: 25.7000, lng: 32.6500 }, images: ["https://images.memphistours.com/large/5e3ddafea32d8_Hot%20Air%20Balloon%20Luxor.jpg"], day: 4 },
    ],
    days: [
      { title: "اليوم الأول", activities: [0] },
      { title: "اليوم الثاني", activities: [1] },
      { title: "اليوم الثالث", activities: [2] },
      { title: "اليوم الرابع", activities: [3] }
    ],
    foodAndRestaurants: [
      { name: "مطعم الكشري السعيدي", image: "https://img.youm7.com/ArticleImgs/2023/5/16/270752-%D9%83%D8%B4%D8%B1%D9%89-%D8%A7%D9%84%D8%B3%D8%B9%D9%8A%D8%AF%D9%89--%281%29.jpg", rating: 4.5, description: "مطعم شعبي شهير في الأقصر يقدم ألذ كشري في الصعيد." }
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
    image: "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800&h=600&fit=crop",
    author: "فاطمة الشمري",
    authorFollowers: 2340,
    likes: 187,
    weeklyLikes: 67,
    saves: 123,
    shares: 45,
    description: "رحلة نوبية ساحرة على ضفاف النيل مع معابد فرعونية عريقة",
    budget: "2800 جنيه",
    activities: [
      { name: "معبد فيلة", coordinates: { lat: 24.0262, lng: 32.8872 }, images: ["https://egyptopia.com/upload/Philae-Temple-in-Aswan-Egypt-Thumb.jpg"], day: 1 },
      { name: "السد العالي", coordinates: { lat: 23.9702, lng: 32.8776 }, images: ["https://www.egypton.com/sites/default/files/styles/large/public/2019-02/nasser-dam.jpg"], day: 2 },
      { name: "جزيرة الفنتين", coordinates: { lat: 24.0903, lng: 32.8856 }, images: ["https://mediaaws.almasryalyoum.com/news/large/2020/08/15/1260662_0.jpg"], day: 3 },
      { name: "القرية النوبية", coordinates: { lat: 24.1001, lng: 32.8805 }, images: ["https://www.almrsal.com/wp-content/uploads/2020/03/10-6.jpg"], day: 4 },
    ],
    days: [
      { title: "اليوم الأول", activities: [0] },
      { title: "اليوم الثاني", activities: [1] },
      { title: "اليوم الثالث", activities: [2] },
      { title: "اليوم الرابع", activities: [3] },
    ],
    foodAndRestaurants: [
      { name: "مطعم الجندي النوبي", image: "https://mediaaws.almasryalyoum.com/news/large/2023/10/07/2199833_0.jpg", rating: 4.7, description: "يقدم الأكلات النوبية والمأكولات البحرية في أسوان." }
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
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQprGJgM5n7j-XDgwjQ8jYhPdfpDH-jyugYlA&s",
    author: "عمر الجوال",
    authorFollowers: 4120,
    likes: 212,
    weeklyLikes: 78,
    saves: 178,
    shares: 67,
    description: "استكشف الشعاب المرجانية الساحرة في البحر الأحمر",
    budget: "4000 جنيه",
    activities: [
      { name: "الغوص", coordinates: { lat: 27.2579, lng: 33.8116 }, images: ["https://www.redsea.gov.eg/Images/Inner/Scuba-diving-2.jpg"], day: 1 },
      { name: "جزيرة جفتون", coordinates: { lat: 27.2089, lng: 33.9640 }, images: ["https://lp-cms-production.imgix.net/image_browser/GiftonIsland-1.jpg"], day: 2 },
      { name: "رحلة سفاري", coordinates: { lat: 27.0132, lng: 33.8361 }, images: ["https://www.redsea.gov.eg/Images/Inner/safari.jpg"], day: 3 },
      { name: "السباحة مع الدلافين", coordinates: { lat: 27.2579, lng: 33.8100 }, images: ["https://upload.wikimedia.org/wikipedia/commons/0/04/Fortune_dolphins.jpg"], day: 4 },
    ],
    days: [
      { title: "اليوم الأول", activities: [0] },
      { title: "اليوم الثاني", activities: [1] },
      { title: "اليوم الثالث", activities: [2] },
      { title: "اليوم الرابع", activities: [3] }
    ],
    foodAndRestaurants: [
      { name: "مطعم حدوتة بحرية", image: "https://media-cdn.tripadvisor.com/media/photo-s/14/d1/38/a4/caption.jpg", rating: 4.7, description: "أفضل مطعم مأكولات بحرية وموقع رائع على البحر." }
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
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop",
    author: "ليلى الرحالة",
    authorFollowers: 6780,
    likes: 243,
    weeklyLikes: 156,
    saves: 267,
    shares: 98,
    description: "بين الجبال والبحر، استمتع بجمال سيناء الساحر",
    budget: "3500 جنيه",
    activities: [
      { name: "خليج نعمة", coordinates: { lat: 27.9158, lng: 34.3300 }, images: ["https://www.memphistours.com/blog/content/images/2020/12/neama-bay-sharm-elsheikh.jpg"], day: 1 },
      { name: "محمية رأس محمد", coordinates: { lat: 27.7236, lng: 34.2491 }, images: ["https://media.istockphoto.com/id/477996446/photo/ras-mohammed-national-park.jpg"], day: 2 },
      { name: "دير سانت كاترين", coordinates: { lat: 28.5556, lng: 33.9761 }, images: ["https://www.tripsinegypt.com/wp-content/uploads/2018/08/St.-Catherine-Monastery-Egypt-Trips-In-Egypt.jpg"], day: 3 },
      { name: "رحلة سفاري", coordinates: { lat: 27.9362, lng: 34.3757 }, images: ["https://sharm-club.com/files/thingstodo/safari2.jpg"], day: 4 },
    ],
    days: [
      { title: "اليوم الأول", activities: [0] },
      { title: "اليوم الثاني", activities: [1] },
      { title: "اليوم الثالث", activities: [2] },
      { title: "اليوم الرابع", activities: [3] }
    ],
    foodAndRestaurants: [
      { name: "مطعم فارس", image: "https://media-cdn.tripadvisor.com/media/photo-s/06/bd/c2/20/farsha-cafe.jpg", rating: 4.6, description: "مطعم مأكولات بحرية وشاطئية فخم في شرم الشيخ." }
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
    image: "https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=800&h=600&fit=crop",
    author: "يوسف المغامر",
    authorFollowers: 1890,
    likes: 156,
    weeklyLikes: 54,
    saves: 98,
    shares: 34,
    description: "رحلة صحراوية فريدة مع ينابيع ساخنة وجبال خلابة",
    budget: "2200 جنيه",
    activities: [
      { name: "الصحراء البيضاء", coordinates: { lat: 27.3800, lng: 28.0800 }, images: ["https://egyptimages.co.uk/wp-content/gallery/white-desert/white-desert-camping-egypt-19.jpg"], day: 1 },
      { name: "الصحراء السوداء", coordinates: { lat: 27.6470, lng: 28.3485 }, images: ["https://www.egypttoursportal.com/images/2018/12/Black-Desert-Egypt-Tours-Portal.jpg"], day: 2 },
      { name: "العيون الساخنة", coordinates: { lat: 27.6905, lng: 28.9570 }, images: ["https://www.egypttoday.com/siteimages/Larg/201902/c8d49c50-6337-4e50-800e-41e9ac998b52.jpg"], day: 2 },
      { name: "التخييم", coordinates: { lat: 27.3905, lng: 28.3920 }, images: ["https://www.egyptoffbeattravel.com/wp-content/gallery/egypt-desert-camping/egypt-white-desert-camp-13.jpg"], day: 3 },
    ],
    days: [
      { title: "اليوم الأول", activities: [0] },
      { title: "اليوم الثاني", activities: [1,2] },
      { title: "اليوم الثالث", activities: [3] },
    ],
    foodAndRestaurants: [
      { name: "مطعم الواحة", image: "https://media-cdn.tripadvisor.com/media/photo-s/04/ab/6b/18/restaurant.jpg", rating: 4.1, description: "أفضل مطعم محلي في الواحات البحرية يقدم أطباق البدو." }
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
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop",
    author: "نورا السياحة",
    authorFollowers: 2560,
    likes: 189,
    weeklyLikes: 72,
    saves: 145,
    shares: 52,
    description: "استرخ في أجواء بدوية هادئة مع أجمل مواقع الغوص",
    budget: "1800 جنيه",
    activities: [
      { name: "Blue Hole", coordinates: { lat: 28.5721, lng: 34.5362 }, images: ["https://upload.wikimedia.org/wikipedia/commons/4/4b/Blue_Hole_%28Dahab%29_02.jpg"], day: 1 },
      { name: "الكانيون", coordinates: { lat: 28.5772, lng: 34.5328 }, images: ["https://dynamic-media-cdn.tripadvisor.com/media/photo-o/0d/30/dc/46/canyon-dahab.jpg"], day: 2 },
      { name: "جبل موسى", coordinates: { lat: 28.5394, lng: 33.9756 }, images: ["https://www.earthtrekkers.com/wp-content/uploads/2020/05/Mount-Sinai-Hike-Egypt.jpg"], day: 3 },
      { name: "اليوغا على الشاطئ", coordinates: { lat: 28.5094, lng: 34.5089 }, images: ["https://www.memphistours.com/blog/content/images/wordpress/2019/02/yoga-retreat.jpg"], day: 4 },
    ],
    days: [
      { title: "اليوم الأول", activities: [0] },
      { title: "اليوم الثاني", activities: [1] },
      { title: "اليوم الثالث", activities: [2] },
      { title: "اليوم الرابع", activities: [3] },
    ],
    foodAndRestaurants: [
      { name: "مطعم علي بابا", image: "https://media-cdn.tripadvisor.com/media/photo-s/04/e1/05/f1/photo0jpg.jpg", rating: 4.5, description: "من أفضل الأماكن لتجربة أكلات البحر الأحمر والمأكولات البدوية." }
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
    title: "خطة رحلة ٣ أيام في الإسكندرية",
    destination: "الإسكندرية",
    duration: "٣ أيام",
    budget: "1500 جنيه",
    image: "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800&h=600&fit=crop",
    uses: 45,
    rating: 4.8
  },
  {
    id: "t2",
    title: "أسبوع كامل في الأقصر وأسوان",
    destination: "الأقصر وأسوان",
    duration: "٧ أيام",
    budget: "5000 جنيه",
    image: "https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=800&h=600&fit=crop",
    uses: 78,
    rating: 4.9
  },
  {
    id: "t3",
    title: "عطلة نهاية أسبوع في الغردقة",
    destination: "الغردقة",
    duration: "يومان",
    budget: "2000 جنيه",
    image: "https://images.unsplash.com/photo-1583797227936-5bbe7b45a0b3?w=800&h=600&fit=crop",
    uses: 92,
    rating: 4.7
  }
];
