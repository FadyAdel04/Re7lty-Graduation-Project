export interface Trip {
  id: string;
  title: string;
  destination: string;
  city: string;
  duration: string;
  rating: number;
  image: string;
  author: string;
  likes: number;
  description: string;
  budget: string;
  activities: string[];
  coordinates: { lat: number; lng: number };
}

export const egyptTrips: Trip[] = [
  {
    id: "1",
    title: "جولة ساحلية في الإسكندرية العريقة",
    destination: "الإسكندرية",
    city: "الإسكندرية",
    duration: "٣ أيام",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800&h=600&fit=crop",
    author: "أحمد السفار",
    likes: 124,
    description: "استكشف جمال عروس البحر المتوسط من قلعة قايتباي إلى مكتبة الإسكندرية",
    budget: "1500 جنيه",
    activities: ["زيارة قلعة قايتباي", "مكتبة الإسكندرية", "كورنيش الإسكندرية", "المتحف اليوناني الروماني"],
    coordinates: { lat: 31.2001, lng: 29.9187 }
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
    likes: 198,
    description: "استمتع بأجمل شواطئ مصر وشاهد المياه الفيروزية الصافية",
    budget: "2000 جنيه",
    activities: ["شاطئ عجيبة", "شاطئ الأبيض", "كهف رومل", "جولة بالقوارب"],
    coordinates: { lat: 31.3543, lng: 27.2373 }
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
    likes: 256,
    description: "اكتشف كنوز الحضارة المصرية القديمة في مدينة المائة باب",
    budget: "3500 جنيه",
    activities: ["معبد الكرنك", "وادي الملوك", "معبد حتشبسوت", "جولة بالمنطاد"],
    coordinates: { lat: 25.6872, lng: 32.6396 }
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
    likes: 187,
    description: "رحلة نوبية ساحرة على ضفاف النيل مع معابد فرعونية عريقة",
    budget: "2800 جنيه",
    activities: ["معبد فيلة", "السد العالي", "جزيرة الفنتين", "القرية النوبية"],
    coordinates: { lat: 24.0889, lng: 32.8998 }
  },
  {
    id: "5",
    title: "الغوص في أعماق الغردقة",
    destination: "الغردقة",
    city: "الغردقة",
    duration: "٥ أيام",
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1583797227936-5bbe7b45a0b3?w=800&h=600&fit=crop",
    author: "عمر الجوال",
    likes: 212,
    description: "استكشف الشعاب المرجانية الساحرة في البحر الأحمر",
    budget: "4000 جنيه",
    activities: ["الغوص", "جزيرة جفتون", "رحلة سفاري", "السباحة مع الدلافين"],
    coordinates: { lat: 27.2579, lng: 33.8116 }
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
    likes: 243,
    description: "بين الجبال والبحر، استمتع بجمال سيناء الساحر",
    budget: "3500 جنيه",
    activities: ["خليج نعمة", "محمية رأس محمد", "دير سانت كاترين", "رحلة سفاري"],
    coordinates: { lat: 27.9158, lng: 34.3300 }
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
    likes: 156,
    description: "رحلة صحراوية فريدة مع ينابيع ساخنة وجبال خلابة",
    budget: "2200 جنيه",
    activities: ["الصحراء البيضاء", "الصحراء السوداء", "العيون الساخنة", "التخييم"],
    coordinates: { lat: 27.8739, lng: 28.8503 }
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
    likes: 189,
    description: "استرخ في أجواء بدوية هادئة مع أجمل مواقع الغوص",
    budget: "1800 جنيه",
    activities: ["Blue Hole", "الكانيون", "جبل موسى", "اليوغا على الشاطئ"],
    coordinates: { lat: 28.5094, lng: 34.5089 }
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
