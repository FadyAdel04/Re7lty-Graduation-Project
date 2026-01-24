import { useState, useEffect } from "react";
import { Trophy, TrendingUp, Heart, Medal, Award, Crown, Gift, Sparkles, Star, Users, ArrowRight, Wallet, PlaneTakeoff, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Fireworks from "@/components/Fireworks";
import { listTrips } from "@/lib/api";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const Leaderboard = () => {
  const [showFireworks, setShowFireworks] = useState(true);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFireworks(false);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true);
        const response = await listTrips({ sort: 'likes', limit: 50 });
        const tripsArray = Array.isArray(response?.items) ? response.items : [];
        
        const tripsWithScore = tripsArray.map((trip: any) => {
          const lovesCount = trip.lovedBy?.length || trip.loves || trip.likes || 0;
          const savesCount = trip.savedBy?.length || trip.saves || 0;
          
          return {
            ...trip,
            loves: lovesCount,
            saves: savesCount,
            engagementScore: 
              lovesCount * 1 + 
              (trip.comments?.length || 0) * 2 + 
              savesCount * 1.5
          };
        });
        
        const sortedTrips = tripsWithScore.sort((a: any, b: any) => b.engagementScore - a.engagementScore);
        setTrips(sortedTrips.slice(0, 10));
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch trips:', err);
        setError(err.message || 'Failed to load leaderboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, []);

  const PodiumItem = ({ rank, trip }: { rank: number; trip: any }) => {
    const configs = {
      1: {
        height: 'h-64 sm:h-80',
        bg: 'bg-gradient-to-t from-yellow-600/20 via-yellow-500/10 to-transparent',
        border: 'border-yellow-500/40',
        icon: <Crown className="h-10 w-10 text-yellow-500 animate-bounce" />,
        shadow: 'shadow-yellow-500/30',
        label: 'الأول',
        medal: '🥇',
        reward: 'رحلة مجانية كاملة ✈️',
        rewardColor: 'bg-yellow-500'
      },
      2: {
        height: 'h-48 sm:h-60',
        bg: 'bg-gradient-to-t from-gray-400/20 via-gray-300/10 to-transparent',
        border: 'border-gray-400/40',
        icon: <Medal className="h-8 w-8 text-gray-400" />,
        shadow: 'shadow-gray-400/20',
        label: 'الثاني',
        medal: '🥈',
        reward: 'خصم 50% شامل 🎟️',
        rewardColor: 'bg-gray-500'
      },
      3: {
        height: 'h-40 sm:h-52',
        bg: 'bg-gradient-to-t from-amber-700/20 via-amber-600/10 to-transparent',
        border: 'border-amber-700/40',
        icon: <Award className="h-7 w-7 text-amber-700" />,
        shadow: 'shadow-amber-700/20',
        label: 'الثالث',
        medal: '🥉',
        reward: 'خصم 30% شامل 🎫',
        rewardColor: 'bg-amber-700'
      }
    };

    const config = configs[rank as keyof typeof configs];
    const order = rank === 1 ? 'order-2' : rank === 2 ? 'order-1' : 'order-3';

    return (
      <div className={cn(
        "flex-1 flex flex-col items-center group perspective-1000",
        order
      )}>
        <div className="mb-6 text-center transform group-hover:-translate-y-2 transition-transform duration-500 w-full">
          <Link to={`/trips/${trip._id}`} className="relative inline-block">
            <div className={cn(
              "relative w-24 h-24 sm:w-36 sm:h-36 rounded-[2rem] overflow-hidden ring-4 transition-all duration-500 shadow-2xl",
              rank === 1 ? "ring-yellow-500 scale-110" : "ring-white/50"
            )}>
              <img src={trip.image || '/placeholder-trip.jpg'} alt={trip.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="absolute -top-3 -right-3 bg-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg border border-gray-100 transform rotate-12">
               <span className="text-2xl">{config.medal}</span>
            </div>
          </Link>
          <div className="mt-4 space-y-1">
             <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-1 max-w-[120px] sm:max-w-[180px] mx-auto text-sm sm:text-xl">
               {trip.title}
             </h3>
             <Badge className={cn("text-[10px] sm:text-xs py-1 rounded-lg border-0 text-white", config.rewardColor)}>
                {config.reward}
             </Badge>
          </div>
        </div>

        <div className={cn(
          "w-full rounded-t-[2.5rem] border-t-8 border-x-4 relative overflow-hidden transition-all duration-700 shadow-[0_-20px_50px_rgba(0,0,0,0.1)]",
          config.height,
          config.bg,
          config.border,
          rank === 1 ? "z-10 scale-105" : "z-0"
        )}>
           <div className="absolute inset-0 bg-white/5 backdrop-blur-[4px]" />
           <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
              <span className="text-6xl sm:text-8xl font-black text-white/10 select-none">{rank}</span>
              <div className="mt-2 flex flex-col items-center gap-3">
                 <div className="p-4 bg-white/10 rounded-3xl backdrop-blur-xl border border-white/30 shadow-inner">
                    {config.icon}
                 </div>
                 <div className="text-center">
                    <p className="text-white text-xs sm:text-sm font-bold opacity-80 mb-1">المركز</p>
                    <p className="text-white text-lg sm:text-2xl font-black tracking-widest">{config.label}</p>
                 </div>
              </div>
           </div>
           
           <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12" />
           </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-right" dir="rtl">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 mb-4 animate-pulse">
              <Trophy className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-cairo">لوحة المتصدرين</h1>
            <p className="mt-4 text-muted-foreground animate-bounce font-cairo">جاري تحميل أبطال رحلتي...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-cairo text-right" dir="rtl">
      {showFireworks && <Fireworks />}
      <Header />
      
      <main className="container mx-auto px-4 py-12 pb-24 max-w-7xl">
        
        {/* 1. Page Header - NEW IMMERSIVE DESIGN */}
        <section className="relative w-full h-[500px] flex items-center justify-center overflow-hidden mb-16 px-4 -mt-12 rounded-b-[4rem]">
           {/* Background Image Layer */}
           <div className="absolute inset-0 z-0">
              <img 
                src="/assets/hero-2.png" 
                alt="Hall of Fame" 
                className="w-full h-full object-cover transform scale-105 brightness-[0.3]"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#F8FAFC]/10" />
           </div>

           {/* Content Layer */}
           <div className="relative z-10 max-w-4xl text-center space-y-8 animate-in mt-10 fade-in zoom-in duration-1000">
              <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white text-sm font-bold shadow-2xl mx-auto">
                <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
                قائمة الشرف الذهبية
              </div>

              <div className="space-y-4">
                <h1 className="text-5xl md:text-8xl font-black text-white leading-tight tracking-tighter">
                  أساطير <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-600">الرحلة</span>
                </h1>
                <div className="flex items-center justify-center gap-4">
                   <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/50" />
                   <p className="text-gray-300 text-lg md:text-2xl font-light italic">
                     حيث يخلد المبدعون تجاربهم الاستثنائية
                   </p>
                   <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/50" />
                </div>
              </div>

              <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                هنا نحتفل بأفضل 10 رحالة أثروا مجتمعنا بقصصهم الملهمة وتجاربهم التي لا تُنسى. تنافس، شارك، وتربع على عرش الصدارة.
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                 <div className="flex -space-x-3 space-x-reverse">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-white/20 bg-gray-800 overflow-hidden shadow-lg">
                        <img src={`https://i.pravatar.cc/100?img=${i+30}`} alt="user" />
                      </div>
                    ))}
                 </div>
                 <p className="text-white/80 text-sm">انضم لـ <span className="text-yellow-500 font-bold">+2000</span> رحّال مبدع</p>
              </div>
           </div>

           {/* Decorative floating elements */}
           <div className="absolute top-1/4 left-10 w-20 h-20 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" />
           <div className="absolute bottom-1/4 right-10 w-32 h-32 bg-orange-600/10 rounded-full blur-3xl animate-pulse-slow" />
        </section>

        <section className="mb-32">
           <div className="bg-gray-900 rounded-[3rem] p-8 md:p-16 shadow-3xl relative overflow-hidden group border border-white/5">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
              <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-yellow-400/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />

              <div className="relative z-10 space-y-12">
                 <div className="flex flex-col md:flex-row items-end justify-between gap-6 pb-8 border-b border-white/10">
                    <div className="space-y-3 text-right">
                       <h2 className="text-3xl md:text-6xl font-black text-white">جوائزنا لكل فوز</h2>
                       <p className="text-gray-400 text-lg sm:text-xl">تكريماً لإبداعكم، جهزنا لكم مفاجآت لا تُنسى هذا الأسبوع</p>
                    </div>
                    <Link to="/trips/new">
                    <Button  size="lg" className="rounded-full bg-orange-600 hover:bg-orange-700 text-white px-8 h-14 text-lg">
                       ابدأ المشاركة الآن
                       <ArrowRight className="mr-2 w-6 h-6" />
                    </Button>
                    </Link>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Card className="bg-white/5 border-yellow-500/30 backdrop-blur-xl rounded-[2.5rem] p-8 hover:bg-white/10 transition-colors border-2 group/card overflow-hidden relative">
                       <div className="absolute top-0 right-0 p-4">
                          <Crown className="w-12 h-12 text-yellow-500 opacity-20 group-hover/card:opacity-40 transition-opacity" />
                       </div>
                       <div className="w-16 h-16 bg-yellow-500 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-yellow-500/20">
                          <PlaneTakeoff className="w-8 h-8 text-white" />
                       </div>
                       <h3 className="text-2xl font-black text-white mb-3">المركز الأول</h3>
                       <p className="text-yellow-500 font-bold text-lg mb-4">رحلة مجانية بالكامل</p>
                       <p className="text-gray-400 text-sm leading-relaxed">
                          سفر وإقامة مدفوعة بالكامل مقدمة من شركائنا الموثقين لأي وجهة من اختيارك داخل مصر.
                       </p>
                    </Card>

                    <Card className="bg-white/5 border-gray-400/30 backdrop-blur-xl rounded-[2.5rem] p-8 hover:bg-white/10 transition-colors group/card relative">
                       <div className="w-16 h-16 bg-gray-400 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-gray-400/20">
                          <Wallet className="w-8 h-8 text-white" />
                       </div>
                       <h3 className="text-2xl font-black text-white mb-3">المركز الثاني</h3>
                       <p className="text-gray-300 font-bold text-lg mb-4">خصم 50% شامل</p>
                       <p className="text-gray-400 text-sm leading-relaxed">
                          قسيمة خصم بقيمة نصف تكلفة أي رحلة تختارها من منصتنا، صالحة لمدة 3 أشهر.
                       </p>
                    </Card>

                    <Card className="bg-white/5 border-amber-700/30 backdrop-blur-xl rounded-[2.5rem] p-8 hover:bg-white/10 transition-colors group/card relative">
                       <div className="w-16 h-16 bg-amber-700 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-amber-700/20">
                          <Gift className="w-8 h-8 text-white" />
                       </div>
                       <h3 className="text-2xl font-black text-white mb-3">المركز الثالث</h3>
                       <p className="text-amber-600 font-bold text-lg mb-4">خصم 30% شامل</p>
                       <p className="text-gray-400 text-sm leading-relaxed">
                          قسيمة خصم مميزة تساعدك في رحلتك القادمة بأي برامج تختارها من شركاتنا المتنوعة.
                       </p>
                    </Card>
                 </div>
              </div>
           </div>
        </section>

        {trips.length >= 3 && (
          <section className="mb-32">
             <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-5xl font-black text-gray-900 flex items-center justify-center gap-4">
                   🏆 منصة التتويج
                </h2>
                <p className="text-gray-500 text-lg mt-4">ثلاث رحلات استثنائية خطفت الأنظار هذا الأسبوع</p>
             </div>
             
             <div className="flex items-end justify-center gap-3 sm:gap-8 max-w-6xl mx-auto px-4">
                {trips.slice(0, 3).map((trip, idx) => (
                  <PodiumItem key={trip._id} rank={idx + 1} trip={trip} />
                ))}
             </div>
          </section>
        )}

        <section className="max-w-4xl mx-auto">
           <div className="bg-white rounded-[3rem] shadow-3xl border border-gray-100 overflow-hidden relative">
              <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                 <h3 className="font-black text-2xl flex items-center gap-3">
                    <TrendingUp className="w-7 h-7 text-orange-600" />
                    باقي الرحلات (4-10)
                 </h3>
                 <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
                    <span className="text-gray-400 text-sm font-bold">الافضل فى الأسبوع</span>
                 </div>
              </div>
              
              <div className="divide-y divide-gray-50">
                 {trips.slice(3, 10).map((trip, index) => (
                   <Link 
                     key={trip._id} 
                     to={`/trips/${trip._id}`} 
                     className="block p-6 sm:p-8 hover:bg-orange-50/30 transition-all group relative overflow-hidden"
                   >
                     <div className="absolute top-0 left-0 w-2 h-full bg-orange-600 transform -translate-x-full group-hover:translate-x-0 transition-transform" />

                     <div className="flex items-center gap-6 sm:gap-8">
                        <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center font-black text-xl text-gray-400 group-hover:bg-gray-900 group-hover:text-white transition-all transform group-hover:rotate-6">
                           {index + 4}
                        </div>

                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[1.5rem] overflow-hidden shadow-md group-hover:shadow-xl transition-all">
                           <img src={trip.image || '/placeholder-trip.jpg'} alt="" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                        </div>

                        <div className="flex-1 min-w-0 text-right">
                           <h4 className="font-black text-gray-900 truncate text-lg sm:text-2xl group-hover:text-orange-600 transition-colors">
                              {trip.title}
                           </h4>
                           <div className="flex items-center gap-2 mt-1 justify-end">
                              <span className="text-gray-500 font-medium text-sm sm:text-base">{trip.author || 'رحالة'}</span>
                              <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden">
                                 <img src={`https://ui-avatars.com/api/?name=${trip.author}&background=random`} alt="" />
                              </div>
                           </div>
                        </div>

                        <div className="flex items-center gap-3 sm:gap-6">
                           <div className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-orange-50 text-orange-700">
                              <Heart className="w-5 h-5 fill-orange-500" />
                              <span className="text-sm font-black mt-1">{trip.loves || 0}</span>
                           </div>
                           <div className="hidden sm:flex flex-col items-center justify-center w-20 h-16 rounded-2xl bg-blue-50 text-blue-800">
                              <Gift className="w-5 h-5" />
                              <span className="text-sm font-black mt-1">{(trip.engagementScore || 0).toFixed(0)}</span>
                           </div>
                        </div>
                     </div>
                   </Link>
                 ))}
              </div>
           </div>
        </section>

        {trips.length === 0 && !loading && (
          <div className="text-center py-32">
            <Trophy className="w-24 h-24 text-gray-200 mx-auto mb-6" />
            <h3 className="text-2xl font-black text-gray-400">لا يوجد متصدرون حالياً</h3>
            <p className="text-gray-400 mt-2">كن أول من يشارك رحلته ويحصل على الجوائز!</p>
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
};

export default Leaderboard;
