import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, CheckCircle2 } from "lucide-react";
import Podium from "@/components/Podium";
import { listTrips } from "@/lib/api";

const Index = () => {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real data from API (reusing logic from Leaderboard)
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true);
        const response = await listTrips({ sort: 'likes', limit: 50 });
        
        const tripsArray = Array.isArray(response?.items) ? response.items : [];
        
        // Calculate comprehensive engagement score
        // Loves = 1 point, Comments = 2 points, Saves = 1.5 points
        const tripsWithScore = tripsArray.map((trip: any) => {
          const lovesCount = trip.lovedBy?.length || trip.loves || trip.likes || 0;
          const savesCount = trip.savedBy?.length || trip.saves || 0;
          
          return {
            ...trip,
            // Normalize for the Podium component
            id: trip._id,
            image: trip.image || '/placeholder-trip.jpg',
            author: trip.author || 'مسافر',
            loves: lovesCount,
            comments: trip.comments?.length || 0,
            saves: savesCount,
            engagementScore: 
              lovesCount * 1 + 
              (trip.comments?.length || 0) * 2 + 
              savesCount * 1.5
          };
        });
        
        // Sort by engagement score (highest first)
        const sortedTrips = tripsWithScore.sort((a: any, b: any) => b.engagementScore - a.engagementScore);
        
        setTrips(sortedTrips.slice(0, 3)); // Only need top 3
      } catch (err) {
        console.error('Failed to fetch homepage trips:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />

        {/* Weekly Top Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 animate-fade-up">
              <h2 className="text-3xl md:text-4xl font-bold mb-3 text-gray-900">المتصدرين هذا الأسبوع 🏆</h2>
              <p className="text-muted-foreground text-lg">أفضل الرحلات والمسافرين الأكثر نشاطاً في مجتمعنا</p>
            </div>
            
            <div className="mb-16 min-h-[300px] flex items-center justify-center">
               {loading ? (
                 <div className="flex flex-col items-center gap-4">
                   <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                   <p className="text-muted-foreground">جاري تحميل المتصدرين...</p>
                 </div>
               ) : (
                 <Podium trips={trips} />
               )}
            </div>

            <div className="text-center animate-fade-up" style={{ animationDelay: "0.2s" }}>
              <Link to="/leaderboard">
                <Button size="lg" className="rounded-full px-8 h-12 text-base bg-white border-2 border-orange-500 text-orange-600 hover:bg-orange-50 hover:text-orange-700 shadow-sm hover:shadow-md transition-all">
                  عرض لوحة المتصدرين الكاملة
                  <ArrowLeft className="mr-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Corporate Trips Teaser */}
        <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "40px 40px" }}></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-12">
              
              <div className="flex-1 space-y-6 text-center md:text-right">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 text-sm font-medium">
                  <Building2 className="h-4 w-4" />
                  جديد: رحلات الشركات
                </div>
                <h2 className="text-3xl md:text-5xl font-bold leading-tight">
                  هل تبحث عن تجربة <span className="text-orange-400">احترافية ومضمونة</span>؟
                </h2>
                <p className="text-gray-300 text-lg leading-relaxed max-w-xl">
                  اكتشف مجموعة مختارة من الرحلات المنظمة بواسطة أفضل شركات السياحة المعتمدة. جودة عالية، برامج متكاملة، وحجوزات آمنة.
                </p>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm text-gray-400">
                  <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-400" /> شركات موثقة</span>
                  <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-400" /> أسعار تنافسية</span>
                  <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-400" /> دعم متواصل</span>
                </div>
                <div className="pt-4">
                  <Link to="/templates">
                    <Button size="lg" className="h-14 px-8 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg shadow-lg hover:scale-105 transition-transform">
                      استعرض الشركات
                      <ArrowLeft className="mr-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Decorative Visual */}
              <div className="flex-1 w-full max-w-lg">
                <div className="relative">
                  <div className="absolute inset-0 bg-orange-500 blur-[100px] opacity-20 rounded-full"></div>
                  <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-3xl shadow-2xl skew-y-3 transform hover:skew-y-0 transition-transform duration-500 cursor-pointer">
                    <div className="flex items-center gap-4 mb-4 border-b border-white/10 pb-4">
                       <div className="h-12 w-12 bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">ST</div>
                       <div>
                         <div className="text-lg font-bold">سفاري ترافيل</div>
                         <div className="text-xs text-gray-400">شركة معتمدة</div>
                       </div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-32 w-full bg-gray-700/50 rounded-xl overflow-hidden relative">
                         <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">صورة الرحلة</div>
                      </div>
                      <div className="h-4 w-3/4 bg-gray-700/50 rounded-full"></div>
                      <div className="h-4 w-1/2 bg-gray-700/50 rounded-full"></div>
                      <div className="flex justify-between pt-2">
                        <div className="h-8 w-24 bg-orange-500/20 rounded-lg"></div>
                        <div className="h-8 w-24 bg-white/10 rounded-lg"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default Index;
