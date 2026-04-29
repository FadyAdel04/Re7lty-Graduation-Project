import { useState, useEffect } from "react";
import { 
  Trophy, TrendingUp, Medal, Award, Crown, Gift, Sparkles, Star, 
  ArrowRight, Wallet, PlaneTakeoff, Calendar, ChevronLeft, ChevronRight,
  History, Timer, MapPin, ExternalLink
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Fireworks from "@/components/Fireworks";
import { getCurrentLeaderboard, getLeaderboardHistory, getLeaderboardHistoryDetail } from "@/lib/api";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const Leaderboard = () => {
  const [showFireworks, setShowFireworks] = useState(true);
  const [currentTrips, setCurrentTrips] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'current' | 'archive'>('current');

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFireworks(false);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [currentRes, historyRes] = await Promise.all([
        getCurrentLeaderboard(),
        getLeaderboardHistory()
      ]);
      
      setCurrentTrips(currentRes);
      setHistory(historyRes);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch leaderboard data:', err);
      setError(err.message || 'Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeTrips = viewMode === 'current' 
    ? currentTrips 
    : (selectedHistory?.allTrips || selectedHistory?.winners || []);

  const handleSelectHistory = async (week: any) => {
    try {
      setSelectedHistory(week);
      const details = await getLeaderboardHistoryDetail(week._id);
      setSelectedHistory(details);
    } catch (err) {
      console.error("Failed to fetch history details:", err);
    }
  };

  const PodiumItem = ({ rank, trip }: { rank: number; trip: any }) => {
    const configs = {
      1: {
        height: 'h-64 sm:h-80',
        bg: 'bg-gradient-to-t from-yellow-600/30 via-yellow-500/10 to-transparent',
        border: 'border-yellow-500/40',
        icon: <Crown className={cn("h-10 w-10 text-yellow-500", viewMode === 'current' && "animate-bounce")} />,
        shadow: 'shadow-yellow-500/30',
        label: 'الأول',
        medal: '🥇',
        reward: 'رحلة مجانية كاملة ✈️',
        rewardColor: 'bg-yellow-500'
      },
      2: {
        height: 'h-48 sm:h-60',
        bg: 'bg-gradient-to-t from-gray-400/30 via-gray-300/10 to-transparent',
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
        bg: 'bg-gradient-to-t from-amber-700/30 via-amber-600/10 to-transparent',
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
    const tripId = trip._id || trip.tripId;

    return (
      <motion.div 
        layout
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: rank * 0.1, type: "spring", stiffness: 100 }}
        className={cn(
          "flex-1 flex flex-col items-center group perspective-1000",
          order
        )}
      >
        <div className="mb-6 text-center transform group-hover:-translate-y-4 transition-transform duration-500 w-full relative z-20">
          <Link to={`/trips/${tripId}`} className="relative inline-block">
            <div className={cn(
              "relative w-24 h-24 sm:w-40 sm:h-40 rounded-[2.5rem] overflow-hidden ring-4 transition-all duration-700 shadow-2xl",
              rank === 1 ? "ring-yellow-500 scale-110 shadow-yellow-500/20" : "ring-border/50"
            )}>
              <img src={trip.image || trip.tripImage || '/placeholder-trip.jpg'} alt={trip.title || trip.tripTitle} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="absolute -top-4 -right-4 bg-background w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl border border-border transform rotate-12 group-hover:rotate-0 transition-transform">
               <span className="text-3xl">{config.medal}</span>
            </div>
          </Link>
          <div className="mt-6 space-y-2 px-4">
             <h3 className="font-black text-foreground group-hover:text-primary transition-colors line-clamp-1 max-w-[140px] sm:max-w-[200px] mx-auto text-sm sm:text-2xl tracking-tighter">
               {trip.title || trip.tripTitle}
             </h3>
             <Badge className={cn("text-[10px] sm:text-xs py-1.5 rounded-xl border-0 text-white font-black", config.rewardColor)}>
                {config.reward}
             </Badge>
          </div>
        </div>

        <div className={cn(
          "w-full rounded-t-[3rem] border-t-8 border-x-4 relative overflow-hidden transition-all duration-700 shadow-[0_-20px_50px_rgba(0,0,0,0.1)]",
          config.height,
          config.bg,
          config.border,
          rank === 1 ? "z-10 scale-105" : "z-0"
        )}>
           <div className="absolute inset-0 bg-background/5 backdrop-blur-[8px]" />
           <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
              <span className="text-7xl sm:text-9xl font-black text-foreground/5 select-none">{rank}</span>
              <div className="mt-2 flex flex-col items-center gap-4">
                 <div className="p-5 bg-card/50 rounded-[2rem] backdrop-blur-2xl border border-border shadow-inner group-hover:scale-110 transition-transform">
                    {config.icon}
                 </div>
                 <div className="text-center">
                    <p className="text-foreground/40 text-[10px] sm:text-xs font-black uppercase tracking-widest mb-1">المركز</p>
                    <p className="text-foreground text-xl sm:text-3xl font-black">{config.label}</p>
                 </div>
              </div>
           </div>
           
           <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[1.5s] bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
           </div>
        </div>
      </motion.div>
    );
  };

  if (loading && currentTrips.length === 0) {
    return (
      <div className="min-h-screen bg-background text-right transition-colors duration-500" dir="rtl">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="text-center mt-20">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-gradient-to-br from-primary to-primary/60 mb-8 animate-pulse shadow-2xl shadow-primary/20">
              <Trophy className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-5xl font-black mb-4 font-cairo text-foreground">لوحة المتصدرين</h1>
            <p className="text-xl text-muted-foreground animate-bounce font-black">جاري تحميل أبطال رحلتي...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-cairo text-right transition-colors duration-500" dir="rtl">
      {showFireworks && viewMode === 'current' && <Fireworks />}
      <Header />
      
      <main className="container mx-auto px-4 py-12 pb-24 max-w-7xl">
        
        {/* Hero Section */}
        <section className="relative w-full h-[450px] sm:h-[550px] flex items-center justify-center overflow-hidden mb-20 px-4 -mt-12 rounded-b-[5rem] shadow-2xl">
           <div className="absolute inset-0 z-0">
              <img 
                src={viewMode === 'current' ? "/assets/hero-2.png" : "https://images.unsplash.com/photo-1533105079780-92b9be482077?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"} 
                alt="Hall of Fame" 
                className="w-full h-full object-cover transform scale-110 brightness-[0.4] transition-all duration-[2s]"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-transparent to-background" />
           </div>

           <div className="relative z-10 max-w-5xl text-center space-y-10 animate-in mt-10 fade-in zoom-in duration-1000">
              <div className="inline-flex items-center gap-3 px-8 py-3 rounded-2xl bg-white/5 backdrop-blur-2xl border border-white/10 text-white text-xs font-black shadow-2xl mx-auto uppercase tracking-widest">
                <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
                {viewMode === 'current' ? 'لوحة المتصدرين الحالية' : 'أرشيف الأبطال'}
              </div>

              <div className="space-y-6">
                <h1 className="text-5xl sm:text-8xl md:text-9xl font-black text-white leading-none tracking-tighter">
                  {viewMode === 'current' ? 'أساطير' : 'سجل'} <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-primary to-yellow-600">الرحلة</span>
                </h1>
                <p className="text-white/70 text-lg md:text-3xl font-black italic max-w-3xl mx-auto">
                   {viewMode === 'current' ? 'حيث يخلد المبدعون تجاربهم الاستثنائية' : 'استعرض الفائزين في الأسابيع الماضية'}
                </p>
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center justify-center p-2 bg-white/5 backdrop-blur-xl rounded-[2rem] w-fit mx-auto border border-white/10 shadow-2xl">
                <button 
                  onClick={() => setViewMode('current')}
                  className={cn(
                    "px-8 py-3.5 rounded-[1.5rem] text-sm font-black transition-all duration-500 flex items-center gap-3",
                    viewMode === 'current' ? "bg-white text-gray-900 shadow-xl scale-105" : "text-white hover:bg-white/5"
                  )}
                >
                  <Timer className="w-5 h-5" />
                  الأسبوع الحالي
                </button>
                <button 
                  onClick={() => setViewMode('archive')}
                  className={cn(
                    "px-8 py-3.5 rounded-[1.5rem] text-sm font-black transition-all duration-500 flex items-center gap-3",
                    viewMode === 'archive' ? "bg-white text-gray-900 shadow-xl scale-105" : "text-white hover:bg-white/5"
                  )}
                >
                  <History className="w-5 h-5" />
                  الأرشيف
                </button>
              </div>
           </div>
        </section>

        {/* Dynamic Content based on ViewMode */}
        <AnimatePresence mode="wait">
          {viewMode === 'archive' ? (
            <motion.section 
              key="archive"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-16"
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 border-b border-border pb-12">
                <div className="text-right">
                  <h2 className="text-4xl font-black text-foreground flex items-center justify-center md:justify-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                       <Calendar className="w-7 h-7" />
                    </div>
                    تقويم الفائزين
                  </h2>
                  <p className="text-muted-foreground mt-3 text-lg font-bold">تصفح تاريخ الإبداع في مجتمع رحلتي</p>
                </div>
                
                {history.length > 0 && (
                  <div className="flex items-center gap-6 bg-card p-3 rounded-[2rem] shadow-xl border border-border">
                    <Button variant="ghost" size="icon" className="rounded-xl hover:bg-muted"><ChevronRight /></Button>
                    <span className="font-black text-foreground px-6 text-xl">2026</span>
                    <Button variant="ghost" size="icon" className="rounded-xl hover:bg-muted"><ChevronLeft /></Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {history.length > 0 ? history.map((week) => (
                  <Card 
                    key={week._id}
                    onClick={() => handleSelectHistory(week)}
                    className={cn(
                      "cursor-pointer transition-all duration-700 group overflow-hidden border-0 relative h-[320px] rounded-[3rem] shadow-xl",
                      selectedHistory?._id === week._id 
                        ? "ring-4 ring-primary shadow-2xl scale-[1.05]" 
                        : "hover:shadow-2xl hover:-translate-y-3 bg-card"
                    )}
                  >
                    <div className="absolute inset-0 z-0">
                      <img 
                        src={week.winners?.[0]?.tripImage || '/placeholder-trip.jpg'} 
                        className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-125" 
                        alt="" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                    </div>

                    <div className="relative z-10 p-8 h-full flex flex-col justify-between text-right">
                      <div className="flex items-start justify-between">
                         <Badge className="bg-background/20 backdrop-blur-xl border border-white/20 text-white rounded-xl px-4 py-1.5 font-black">
                            الأسبوع {week.weekNumber}
                         </Badge>
                         <div className="w-12 h-12 rounded-2xl bg-background/10 backdrop-blur-xl border border-white/10 flex items-center justify-center text-yellow-400 group-hover:scale-110 transition-transform">
                            <Star className="w-6 h-6 fill-current" />
                         </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                           <Trophy className="w-5 h-5 text-primary" />
                           <span className="text-white/60 text-[10px] font-black tracking-widest">{week.year}</span>
                        </div>
                        <h4 className="font-black text-3xl text-white line-clamp-1 leading-none">{week.label || `أسبوع ${week.weekNumber}`}</h4>
                        <p className="text-white/60 text-xs font-bold">{format(new Date(week.startDate), 'd MMMM', { locale: ar })} - {format(new Date(week.endDate), 'd MMMM', { locale: ar })}</p>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                          <div className="flex -space-x-3 space-x-reverse">
                            {week.winners?.slice(0, 3).map((w: any, i: number) => (
                              <div key={i} className="w-10 h-10 rounded-2xl border-4 border-background overflow-hidden shadow-2xl">
                                <img src={w.winnerImage || `https://ui-avatars.com/api/?name=${w.winnerName}`} alt="" className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                          <span className="text-[10px] text-primary font-black bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20 uppercase tracking-tighter">
                             مكتمل ✅
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                )) : (
                  <div className="col-span-full py-32 text-center bg-card rounded-[4rem] border-4 border-dashed border-border shadow-inner">
                    <History className="w-24 h-24 text-muted-foreground/20 mx-auto mb-8" />
                    <h3 className="text-3xl font-black text-muted-foreground">لا يوجد أرشيف حالياً</h3>
                    <p className="text-muted-foreground font-bold mt-2">سجل الأبطال سيبدأ من الأسبوع القادم</p>
                  </div>
                )}
              </div>

              {selectedHistory && (
                <motion.div 
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-20 bg-card p-10 sm:p-20 rounded-[4rem] shadow-3xl border border-border relative overflow-hidden"
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
                  
                  <div className="text-center mb-20">
                    <Badge className="mb-6 bg-primary/10 text-primary hover:bg-primary/10 px-6 py-2 rounded-2xl font-black text-sm border border-primary/20">نتائج أسبوع {selectedHistory.weekNumber}</Badge>
                    <h3 className="text-4xl sm:text-6xl font-black text-foreground leading-tight tracking-tighter">أبطال الفوز الماضي</h3>
                    <div className="w-32 h-2 bg-primary mx-auto mt-8 rounded-full shadow-lg shadow-primary/20" />
                  </div>
                  
                  <div className="flex items-end justify-center gap-4 sm:gap-12 max-w-6xl mx-auto px-4 mb-20">
                    {selectedHistory.winners.slice(0, 3).map((trip: any, idx: number) => (
                      <PodiumItem key={trip.tripId} rank={idx + 1} trip={trip} />
                    ))}
                  </div>

                  {activeTrips.length > 3 && (
                    <div className="space-y-6 max-w-4xl mx-auto border-t border-border pt-16">
                      <h4 className="font-black text-muted-foreground mb-8 flex items-center justify-center gap-3 text-xl">
                        <TrendingUp className="w-6 h-6 text-primary" />
                        جميع رحلات الأسبوع
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeTrips.slice(3, 50).map((trip: any, index: number) => (
                          <div 
                            key={trip._id || trip.tripId} 
                            className="flex items-center gap-5 p-5 rounded-[2rem] bg-background group hover:bg-primary/5 border border-border transition-all duration-500 hover:-translate-x-2"
                          >
                            <span className="w-12 h-12 rounded-2xl bg-card shadow-lg flex items-center justify-center font-black text-xl text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all">{index + 4}</span>
                            <div className="w-16 h-16 rounded-2xl border border-border overflow-hidden shadow-md">
                               <img src={trip.image || trip.tripImage || '/placeholder-trip.jpg'} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 text-right">
                              <h5 className="font-black text-foreground group-hover:text-primary transition-colors truncate">{trip.title || trip.tripTitle}</h5>
                              <p className="text-sm font-bold text-muted-foreground">{trip.author || trip.winnerName}</p>
                            </div>
                            <Link to={`/trips/${trip._id || trip.tripId}`}>
                              <Button variant="ghost" size="icon" className="rounded-2xl hover:bg-primary/10 text-primary"><ExternalLink className="w-5 h-5" /></Button>
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.section>
          ) : (
            <motion.div 
              key="current"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
            >
              <section className="mb-40">
                <div className="bg-card rounded-[4rem] p-10 md:p-20 shadow-3xl relative overflow-hidden group border border-border">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/4" />
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-yellow-500/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/4" />

                    <div className="relative z-10 space-y-16">
                        <div className="flex flex-col md:flex-row items-end justify-between gap-8 pb-12 border-b border-border/50">
                          <div className="space-y-4 text-right">
                              <h2 className="text-4xl md:text-7xl font-black text-foreground tracking-tighter">جوائز الأسبوع</h2>
                              <p className="text-muted-foreground text-xl sm:text-2xl font-bold">تنافس على الصدارة واحصل على هديتك الاستثنائية</p>
                          </div>
                          <Link to="/trips/new">
                            <Button size="lg" className="rounded-[2rem] bg-primary hover:bg-primary/90 text-primary-foreground px-10 h-16 text-xl font-black shadow-2xl shadow-primary/30 transition-all hover:scale-105 active:scale-95">
                                ابدأ المشاركة الآن
                                <ArrowRight className="mr-3 w-7 h-7" />
                            </Button>
                          </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                          <Card className="bg-background/50 border-yellow-500/30 backdrop-blur-2xl rounded-[3rem] p-10 hover:bg-card transition-all duration-500 border-2 group/card overflow-hidden relative shadow-xl hover:-translate-y-2">
                              <div className="absolute top-0 right-0 p-6">
                                <Crown className="w-16 h-16 text-yellow-500 opacity-10 group-hover/card:opacity-30 transition-opacity" />
                              </div>
                              <div className="w-20 h-20 bg-yellow-500 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-yellow-500/30 group-hover:scale-110 transition-transform">
                                <PlaneTakeoff className="w-10 h-10 text-white" />
                              </div>
                              <h3 className="text-3xl font-black text-foreground mb-4">المركز الأول</h3>
                              <p className="text-yellow-500 font-black text-xl mb-6">رحلة مجانية بالكامل</p>
                              <p className="text-muted-foreground font-bold text-sm leading-relaxed">
                                سفر وإقامة مدفوعة بالكامل مقدمة من شركائنا الموثقين لأي وجهة من اختيارك داخل مصر.
                              </p>
                          </Card>

                          <Card className="bg-background/50 border-gray-400/30 backdrop-blur-2xl rounded-[3rem] p-10 hover:bg-card transition-all duration-500 border-2 group/card relative shadow-xl hover:-translate-y-2">
                              <div className="w-20 h-20 bg-gray-400 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-gray-400/30 group-hover:scale-110 transition-transform">
                                <Wallet className="w-10 h-10 text-white" />
                              </div>
                              <h3 className="text-3xl font-black text-foreground mb-4">المركز الثاني</h3>
                              <p className="text-gray-400 font-black text-xl mb-6">خصم 50% شامل</p>
                              <p className="text-muted-foreground font-bold text-sm leading-relaxed">
                                قسيمة خصم بقيمة نصف تكلفة أي رحلة تختارها من منصتنا، صالحة لمدة 3 أشهر.
                              </p>
                          </Card>

                          <Card className="bg-background/50 border-amber-700/30 backdrop-blur-2xl rounded-[3rem] p-10 hover:bg-card transition-all duration-500 border-2 group/card relative shadow-xl hover:-translate-y-2">
                              <div className="w-20 h-20 bg-amber-700 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-amber-700/30 group-hover:scale-110 transition-transform">
                                <Gift className="w-10 h-10 text-white" />
                              </div>
                              <h3 className="text-3xl font-black text-foreground mb-4">المركز الثالث</h3>
                              <p className="text-amber-700 font-black text-xl mb-6">خصم 30% شامل</p>
                              <p className="text-muted-foreground font-bold text-sm leading-relaxed">
                                قسيمة خصم مميزة تساعدك في رحلتك القادمة بأي برامج تختارها من شركاتنا المتنوعة.
                              </p>
                          </Card>
                        </div>
                    </div>
                </div>
              </section>

              {activeTrips.length > 0 ? (
                <>
                  <section className="mb-40">
                    <div className="text-center mb-24">
                        <h2 className="text-5xl sm:text-7xl font-black text-foreground flex items-center justify-center gap-6 tracking-tighter">
                          <Trophy className="w-16 h-16 text-primary animate-bounce" />
                          منصة التتويج
                        </h2>
                        <p className="text-muted-foreground text-xl mt-6 font-bold">بناءً على التفاعل الأسبوعي الحقيقي للمسافرين</p>
                        <div className="w-40 h-2 bg-primary/20 mx-auto mt-8 rounded-full" />
                    </div>
                    
                    <div className="flex items-end justify-center gap-4 sm:gap-12 max-w-7xl mx-auto px-4">
                        {activeTrips.slice(0, 3).map((trip, idx) => (
                          <PodiumItem key={trip._id || trip.tripId} rank={idx + 1} trip={trip} />
                        ))}
                    </div>
                  </section>

                  <section className="max-w-5xl mx-auto">
                    <div className="bg-card rounded-[4rem] shadow-3xl border border-border overflow-hidden relative">
                        <div className="p-10 border-b border-border flex flex-col sm:flex-row items-center justify-between bg-muted/30 gap-6">
                          <h3 className="font-black text-3xl flex items-center gap-4">
                              <TrendingUp className="w-9 h-9 text-primary" />
                              باقي المتنافسين
                          </h3>
                          <div className="flex items-center gap-3 bg-background/50 px-6 py-3 rounded-2xl border border-border">
                              <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
                              <span className="text-muted-foreground text-sm font-black uppercase tracking-widest">جميع المشاركات هذا الأسبوع</span>
                          </div>
                        </div>
                        
                        <div className="divide-y divide-border/50">
                          {activeTrips.slice(3, 50).map((trip, index) => (
                            <Link 
                                key={trip._id || trip.id} 
                                to={`/trips/${trip._id || trip.id}`} 
                                className="block p-8 sm:p-10 hover:bg-primary/5 transition-all group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-2 h-full bg-primary transform translate-x-full group-hover:translate-x-0 transition-transform" />

                                <div className="flex items-center gap-8 sm:gap-12">
                                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center font-black text-2xl text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all transform group-hover:rotate-12 group-hover:scale-110 shadow-lg">
                                      {index + 4}
                                  </div>

                                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[2rem] overflow-hidden shadow-xl group-hover:shadow-2xl transition-all border-4 border-transparent group-hover:border-primary/20">
                                      <img src={trip.image || trip.tripImage || '/placeholder-trip.jpg'} alt="" className="w-full h-full object-cover transform group-hover:scale-125 transition-transform duration-[1s]" />
                                  </div>

                                  <div className="flex-1 min-w-0 text-right">
                                      <h4 className="font-black text-foreground truncate text-2xl sm:text-4xl group-hover:text-primary transition-colors tracking-tighter">
                                        {trip.title || trip.tripTitle}
                                      </h4>
                                      <div className="flex items-center gap-3 mt-3 justify-end">
                                        <span className="text-muted-foreground font-black text-base sm:text-lg">{trip.author || trip.winnerName || 'رحالة'}</span>
                                        <div className="w-10 h-10 rounded-xl bg-muted overflow-hidden border-2 border-border shadow-md">
                                            <img src={`https://ui-avatars.com/api/?name=${trip.author || trip.winnerName}&background=random`} alt="" className="w-full h-full object-cover" />
                                        </div>
                                      </div>
                                  </div>

                                  <div className="flex items-center gap-4 sm:gap-8">
                                      <div className="flex flex-col items-center justify-center w-20 h-20 rounded-[2rem] bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-lg border border-primary/20">
                                        <Trophy className="w-6 h-6" />
                                        <span className="text-lg font-black mt-1 leading-none">{trip.weeklyLikes || trip.score || 0}</span>
                                      </div>
                                  </div>
                                </div>
                            </Link>
                          ))}
                        </div>
                    </div>
                  </section>
                </>
              ) : (
                <div className="text-center py-40 bg-card rounded-[5rem] shadow-2xl border border-border">
                    <Trophy className="w-32 h-32 text-muted-foreground/10 mx-auto mb-10" />
                    <h3 className="text-4xl font-black text-muted-foreground tracking-tighter">لا يوجد متصدرون حالياً</h3>
                    <p className="text-muted-foreground font-bold mt-4 text-xl">كن أول من يشارك رحلته ويحصل على الجوائز!</p>
                    <Link to="/trips/new" className="inline-block mt-10">
                       <Button size="lg" className="rounded-2xl px-10 h-14 font-black">ابدأ الآن</Button>
                    </Link>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </main>
      <Footer />
    </div>
  );
};

export default Leaderboard;
