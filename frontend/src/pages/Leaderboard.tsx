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
      setSelectedHistory(week); // Show immediate UI state
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
        bg: 'bg-gradient-to-t from-yellow-600/20 via-yellow-500/10 to-transparent',
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
    const tripId = trip._id || trip.tripId;

    return (
      <motion.div 
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: rank * 0.1 }}
        className={cn(
          "flex-1 flex flex-col items-center group perspective-1000",
          order
        )}
      >
        <div className="mb-6 text-center transform group-hover:-translate-y-2 transition-transform duration-500 w-full">
          <Link to={`/trips/${tripId}`} className="relative inline-block">
            <div className={cn(
              "relative w-24 h-24 sm:w-36 sm:h-36 rounded-[2rem] overflow-hidden ring-4 transition-all duration-500 shadow-2xl",
              rank === 1 ? "ring-yellow-500 scale-110" : "ring-white/50"
            )}>
              <img src={trip.image || trip.tripImage || '/placeholder-trip.jpg'} alt={trip.title || trip.tripTitle} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="absolute -top-3 -right-3 bg-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg border border-gray-100 transform rotate-12">
               <span className="text-2xl">{config.medal}</span>
            </div>
          </Link>
          <div className="mt-4 space-y-1 px-4">
             <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-1 max-w-[120px] sm:max-w-[180px] mx-auto text-sm sm:text-xl">
               {trip.title || trip.tripTitle}
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
      </motion.div>
    );
  };

  if (loading && currentTrips.length === 0) {
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
      {showFireworks && viewMode === 'current' && <Fireworks />}
      <Header />
      
      <main className="container mx-auto px-4 py-12 pb-24 max-w-7xl">
        
        {/* Hero Section */}
        <section className="relative w-full h-[400px] sm:h-[500px] flex items-center justify-center overflow-hidden mb-16 px-4 -mt-12 rounded-b-[4rem]">
           <div className="absolute inset-0 z-0">
              <img 
                src={viewMode === 'current' ? "/assets/hero-2.png" : "https://images.unsplash.com/photo-1533105079780-92b9be482077?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"} 
                alt="Hall of Fame" 
                className="w-full h-full object-cover transform scale-105 brightness-[0.3]"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#F8FAFC]/10" />
           </div>

           <div className="relative z-10 max-w-4xl text-center space-y-8 animate-in mt-10 fade-in zoom-in duration-1000">
              <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white text-sm font-bold shadow-2xl mx-auto">
                <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
                {viewMode === 'current' ? 'لوحة المتصدرين الحالية' : 'أرشيف الأبطال'}
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl sm:text-7xl md:text-8xl font-black text-white leading-tight tracking-tighter">
                  {viewMode === 'current' ? 'أساطير' : 'سجل'} <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-600">الرحلة</span>
                </h1>
                <p className="text-gray-300 text-lg md:text-2xl font-light italic">
                   {viewMode === 'current' ? 'حيث يخلد المبدعون تجاربهم الاستثنائية' : 'استعرض الفائزين في الأسابيع الماضية'}
                </p>
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center justify-center p-1.5 bg-white/10 backdrop-blur-md rounded-2xl w-fit mx-auto border border-white/20">
                <button 
                  onClick={() => setViewMode('current')}
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2",
                    viewMode === 'current' ? "bg-white text-gray-900 shadow-xl" : "text-white hover:bg-white/5"
                  )}
                >
                  <Timer className="w-4 h-4" />
                  الأسبوع الحالي
                </button>
                <button 
                  onClick={() => setViewMode('archive')}
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2",
                    viewMode === 'archive' ? "bg-white text-gray-900 shadow-xl" : "text-white hover:bg-white/5"
                  )}
                >
                  <History className="w-4 h-4" />
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
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              {/* Archive Header */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-gray-200 pb-8">
                <div>
                  <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                    <Calendar className="w-8 h-8 text-orange-600" />
                    تقويم الفائزين
                  </h2>
                  <p className="text-gray-500 mt-2">تصفح تاريخ الإبداع في مجتمع رحلتي</p>
                </div>
                
                {history.length > 0 && (
                  <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                    <Button variant="ghost" size="icon" className="rounded-xl"><ChevronRight /></Button>
                    <span className="font-bold text-gray-900 px-4">2024</span>
                    <Button variant="ghost" size="icon" className="rounded-xl"><ChevronLeft /></Button>
                  </div>
                )}
              </div>

              {/* History Horizontal Scroll or Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {history.length > 0 ? history.map((week) => (
                  <Card 
                    key={week._id}
                    onClick={() => handleSelectHistory(week)}
                    className={cn(
                      "cursor-pointer transition-all duration-500 group overflow-hidden border-0 relative h-[280px] rounded-[2.5rem]",
                      selectedHistory?._id === week._id 
                        ? "ring-4 ring-orange-500 shadow-2xl scale-[1.02]" 
                        : "hover:shadow-2xl hover:-translate-y-2 bg-white"
                    )}
                  >
                    {/* Visual Background (Winner's Trip) */}
                    <div className="absolute inset-0 z-0">
                      <img 
                        src={week.winners?.[0]?.tripImage || '/placeholder-trip.jpg'} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        alt="" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    </div>

                    <div className="relative z-10 p-6 h-full flex flex-col justify-between text-right">
                      <div className="flex items-start justify-between">
                         <Badge className="bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-xl">
                            الأسبوع {week.weekNumber}
                         </Badge>
                         <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                            <Star className="w-5 h-5 text-yellow-400" />
                         </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                           <Trophy className="w-5 h-5 text-yellow-500" />
                           <span className="text-white/60 text-xs font-bold">{week.year}</span>
                        </div>
                        <h4 className="font-black text-2xl text-white line-clamp-1">{week.label || `فائزو الأسبوع ${week.weekNumber}`}</h4>
                        <p className="text-white/60 text-sm">{format(new Date(week.startDate), 'd MMMM', { locale: ar })} - {format(new Date(week.endDate), 'd MMMM', { locale: ar })}</p>
                        
                        <div className="flex items-center justify-between pt-2 border-t border-white/10">
                          <div className="flex -space-x-2 space-x-reverse">
                            {week.winners?.slice(0, 3).map((w: any, i: number) => (
                              <div key={i} className="w-8 h-8 rounded-full border-2 border-white ring-2 ring-white/10 overflow-hidden">
                                <img src={w.winnerImage || `https://ui-avatars.com/api/?name=${w.winnerName}`} alt="" />
                              </div>
                            ))}
                          </div>
                          <span className="text-[10px] text-yellow-500 font-bold bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-500/20">
                             مكتمل ✅
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                )) : (
                  <div className="col-span-full py-20 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                    <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-400">لا يوجد أرشيف حالياً</h3>
                    <p className="text-gray-400">سجل الأبطال سيبدأ من الأسبوع القادم</p>
                  </div>
                )}
              </div>

              {/* Selected Week winners Showdown */}
              {selectedHistory && (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-16 bg-white p-8 sm:p-12 rounded-[3.5rem] shadow-3xl border border-gray-100"
                >
                  <div className="text-center mb-16">
                    <Badge className="mb-4 bg-orange-100 text-orange-700 hover:bg-orange-100 px-4 py-1">نتائج أسبوع {selectedHistory.weekNumber}</Badge>
                    <h3 className="text-3xl sm:text-5xl font-black text-gray-900">أبطال الفوز الماضي</h3>
                    <div className="w-24 h-1.5 bg-orange-600 mx-auto mt-6 rounded-full" />
                  </div>
                  
                  <div className="flex items-end justify-center gap-3 sm:gap-8 max-w-6xl mx-auto px-4 mb-16">
                    {selectedHistory.winners.slice(0, 3).map((trip: any, idx: number) => (
                      <PodiumItem key={trip.tripId} rank={idx + 1} trip={trip} />
                    ))}
                  </div>

                  {/* List for the rest of archive */}
                  {activeTrips.length > 3 && (
                    <div className="space-y-4 max-w-3xl mx-auto border-t border-gray-100 pt-12">
                      <h4 className="font-bold text-gray-400 mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        جميع رحلات الأسبوع
                      </h4>
                      {activeTrips.slice(3, 50).map((trip: any, index: number) => (
                        <div 
                          key={trip._id || trip.tripId} 
                          className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 group hover:bg-orange-50 transition-colors"
                        >
                          <span className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center font-black text-gray-400 group-hover:text-orange-600">{index + 4}</span>
                          <div className="w-12 h-12 rounded-xl border border-gray-200 overflow-hidden">
                             <img src={trip.image || trip.tripImage || '/placeholder-trip.jpg'} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 text-right">
                            <h5 className="font-bold text-gray-900">{trip.title || trip.tripTitle}</h5>
                            <p className="text-sm text-gray-500">{trip.author || trip.winnerName}</p>
                          </div>
                          <Link to={`/trips/${trip._id || trip.tripId}`}>
                            <Button variant="ghost" size="sm" className="rounded-xl"><ExternalLink className="w-4 h-4" /></Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </motion.section>
          ) : (
            <motion.div 
              key="current"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* CURRENT WEEK VIEW */}
              <section className="mb-32">
                <div className="bg-gray-900 rounded-[3rem] p-8 md:p-16 shadow-3xl relative overflow-hidden group border border-white/5">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-yellow-400/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />

                    <div className="relative z-10 space-y-12">
                        <div className="flex flex-col md:flex-row items-end justify-between gap-6 pb-8 border-b border-white/10">
                          <div className="space-y-3 text-right">
                              <h2 className="text-3xl md:text-6xl font-black text-white">جوائز الأسبوع</h2>
                              <p className="text-gray-400 text-lg sm:text-xl">تنافس على الصدارة واحصل على هديتك الاستثنائية</p>
                          </div>
                          <Link to="/trips/new">
                            <Button size="lg" className="rounded-full bg-orange-600 hover:bg-orange-700 text-white px-8 h-14 text-lg">
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

              {activeTrips.length > 0 ? (
                <>
                  <section className="mb-32">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-5xl font-black text-gray-900 flex items-center justify-center gap-4">
                          🏆 منصة التتويج
                        </h2>
                        <p className="text-gray-500 text-lg mt-4">بناءً على التفاعل الأسبوعي الحقيقي</p>
                    </div>
                    
                    <div className="flex items-end justify-center gap-3 sm:gap-8 max-w-6xl mx-auto px-4">
                        {activeTrips.slice(0, 3).map((trip, idx) => (
                          <PodiumItem key={trip._id || trip.tripId} rank={idx + 1} trip={trip} />
                        ))}
                    </div>
                  </section>

                  <section className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-[3rem] shadow-3xl border border-gray-100 overflow-hidden relative">
                        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                          <h3 className="font-black text-2xl flex items-center gap-3">
                              <TrendingUp className="w-7 h-7 text-orange-600" />
                              باقي المتنافسين
                          </h3>
                          <div className="flex items-center gap-2">
                              <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
                              <span className="text-gray-400 text-sm font-bold">جميع المشاركات هذا الأسبوع</span>
                          </div>
                        </div>
                        
                        <div className="divide-y divide-gray-50">
                          {activeTrips.slice(3, 50).map((trip, index) => (
                            <Link 
                                key={trip._id || trip.tripId} 
                                to={`/trips/${trip._id || trip.tripId}`} 
                                className="block p-6 sm:p-8 hover:bg-orange-50/30 transition-all group relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-2 h-full bg-orange-600 transform -translate-x-full group-hover:translate-x-0 transition-transform" />

                                <div className="flex items-center gap-6 sm:gap-8">
                                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center font-black text-xl text-gray-400 group-hover:bg-gray-900 group-hover:text-white transition-all transform group-hover:rotate-6">
                                      {index + 4}
                                  </div>

                                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[1.5rem] overflow-hidden shadow-md group-hover:shadow-xl transition-all">
                                      <img src={trip.image || trip.tripImage || '/placeholder-trip.jpg'} alt="" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                                  </div>

                                  <div className="flex-1 min-w-0 text-right">
                                      <h4 className="font-black text-gray-900 truncate text-lg sm:text-2xl group-hover:text-orange-600 transition-colors">
                                        {trip.title || trip.tripTitle}
                                      </h4>
                                      <div className="flex items-center gap-2 mt-1 justify-end">
                                        <span className="text-gray-500 font-medium text-sm sm:text-base">{trip.author || trip.winnerName || 'رحالة'}</span>
                                        <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden">
                                            <img src={`https://ui-avatars.com/api/?name=${trip.author || trip.winnerName}&background=random`} alt="" />
                                        </div>
                                      </div>
                                  </div>

                                  <div className="flex items-center gap-3 sm:gap-6">
                                      <div className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-orange-50 text-orange-700">
                                        <Trophy className="w-5 h-5 text-orange-500" />
                                        <span className="text-sm font-black mt-1">{trip.weeklyLikes || trip.score || 0}</span>
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
                <div className="text-center py-32 bg-white rounded-[3rem] shadow-sm border border-gray-100">
                    <Trophy className="w-24 h-24 text-gray-200 mx-auto mb-6" />
                    <h3 className="text-2xl font-black text-gray-400">لا يوجد متصدرون حالياً</h3>
                    <p className="text-gray-400 mt-2">كن أول من يشارك رحلته ويحصل على الجوائز!</p>
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
