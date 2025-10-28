import TripCard from "./TripCard";

const FeaturedTrips = () => {
  // Mock data - في التطبيق الحقيقي، ستأتي من API
  const trips = [
    {
      id: "1",
      title: "جولة في باريس الساحرة",
      destination: "باريس، فرنسا",
      duration: "٧ أيام",
      rating: 4.8,
      image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=600&fit=crop",
      author: "أحمد السفار",
      likes: 124
    },
    {
      id: "2",
      title: "مغامرة في جبال سويسرا",
      destination: "زيورخ، سويسرا",
      duration: "٥ أيام",
      rating: 4.9,
      image: "https://images.unsplash.com/photo-1527004013197-933c4bb611b3?w=800&h=600&fit=crop",
      author: "سارة المسافرة",
      likes: 98
    },
    {
      id: "3",
      title: "رحلة إلى طوكيو المستقبلية",
      destination: "طوكيو، اليابان",
      duration: "١٠ أيام",
      rating: 5.0,
      image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=600&fit=crop",
      author: "محمد الرحال",
      likes: 156
    },
    {
      id: "4",
      title: "استكشاف دبي الحديثة",
      destination: "دبي، الإمارات",
      duration: "٤ أيام",
      rating: 4.7,
      image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=600&fit=crop",
      author: "فاطمة الشمري",
      likes: 87
    },
    {
      id: "5",
      title: "سحر إسطنبول القديمة",
      destination: "إسطنبول، تركيا",
      duration: "٦ أيام",
      rating: 4.6,
      image: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&h=600&fit=crop",
      author: "عمر الجوال",
      likes: 112
    },
    {
      id: "6",
      title: "رحلة إلى نيويورك النابضة",
      destination: "نيويورك، أمريكا",
      duration: "٨ أيام",
      rating: 4.8,
      image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=600&fit=crop",
      author: "ليلى الرحالة",
      likes: 143
    }
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            رحلات <span className="text-gradient">مميزة</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            اكتشف أفضل الرحلات التي شاركها مسافرون من حول العالم
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip, index) => (
            <div 
              key={trip.id} 
              style={{ 
                animationDelay: `${index * 0.1}s` 
              }}
            >
              <TripCard {...trip} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedTrips;
