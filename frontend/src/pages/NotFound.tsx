import { useLocation, useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Home, ArrowRight, Compass, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: Path not found:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col font-cairo text-right text-gray-900 dark:text-slate-100" dir="rtl">
      <Header />
      
      <main className="flex-1 flex items-center justify-center relative overflow-hidden py-20 px-6">
        {/* Cinematic Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80" 
            alt="Travel background" 
            className="w-full h-full object-cover opacity-100 contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#F8FAFC]/80 dark:from-slate-950/90 via-[#F8FAFC]/40 dark:via-slate-950/70 to-[#F8FAFC] dark:to-slate-950" />
        </div>

        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-orange-100/30 blur-[100px] animate-pulse" />
          <div className="absolute bottom-[-5%] left-[-5%] w-[30%] h-[30%] rounded-full bg-indigo-100/30 blur-[80px]" />
        </div>

        <div className="container max-w-5xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center text-center lg:text-right">
            
            {/* 1. Illustration Area */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative order-2 lg:order-1"
            >
              <div className="relative w-full aspect-square max-w-md mx-auto">
                {/* Main 404 Display */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[12rem] md:text-[18rem] font-black text-indigo-50/80 select-none">404</span>
                </div>
                
                {/* Floating Elements */}
                <motion.div 
                  animate={{ y: [0, -20, 0] }} 
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-1/4 right-1/4 w-24 h-24 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex items-center justify-center text-orange-500 border border-orange-50 dark:border-slate-800"
                >
                  <Compass className="w-12 h-12" />
                </motion.div>

                <motion.div 
                  animate={{ y: [0, 15, 0] }} 
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="absolute bottom-1/3 left-1/4 w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl shadow-xl flex items-center justify-center text-indigo-600 border border-indigo-50 dark:border-slate-800"
                >
                  <MapPin className="w-8 h-8" />
                </motion.div>

                <motion.div 
                  animate={{ scale: [1, 1.1, 1] }} 
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-1/2 left-0 w-12 h-12 bg-emerald-500 rounded-full shadow-lg shadow-emerald-200 flex items-center justify-center text-white"
                >
                  <Search className="w-6 h-6" />
                </motion.div>


              </div>
            </motion.div>

            {/* 2. Text Content Area */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-8 order-1 lg:order-2"
            >
              <div>
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="inline-block px-4 py-1.5 bg-orange-100 text-orange-600 rounded-full text-sm font-black mb-4"
                >
                   عذراً، يبدو أنك تهت قليلاً! 🧭
                </motion.span>
                <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white leading-tight mb-6">
                  هذه الوجهة <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-l from-indigo-600 to-purple-600">غير موجودة</span> على خريطتنا
                </h1>
                <p className="text-xl text-gray-500 dark:text-slate-400 font-medium leading-relaxed max-w-lg mx-auto lg:mr-0">
                  ربما الرابط الذي اتبعته قد انتهى، أو الصفحة قد انتقلت إلى مغامرة أخرى. دعنا نساعدك في العودة إلى طريقك الصحيح.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Button 
                  asChild
                  className="h-16 px-8 rounded-2xl bg-indigo-600 text-white font-black text-lg gap-3 shadow-xl shadow-indigo-100 hover:scale-[1.02] transition-all"
                >
                  <Link to="/">
                    <Home className="w-5 h-5" />
                    العودة للرئيسية
                  </Link>
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => navigate(-1)}
                  className="h-16 px-8 rounded-2xl border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 font-black text-lg gap-3 hover:bg-white dark:hover:bg-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all"
                >
                  رجوع للخلف
                </Button>
              </div>

              <div className="pt-8 border-t border-gray-100 dark:border-slate-800 grid grid-cols-2 gap-4">
                 <Link to="/timeline" className="group flex flex-col items-center lg:items-start text-right">
                    <span className="text-indigo-600 font-black flex items-center gap-1 group-hover:gap-2 transition-all">تصفح الرحلات <ArrowRight className="w-4 h-4 rotate-180" /></span>
                    <span className="text-gray-400 dark:text-slate-500 text-xs mt-1">اكتشف مغامرات جديدة</span>
                 </Link>
                 <Link to="/templates" className="group flex flex-col items-center lg:items-start text-right">
                    <span className="text-orange-600 font-black flex items-center gap-1 group-hover:gap-2 transition-all">باقات الشركات <ArrowRight className="w-4 h-4 rotate-180" /></span>
                    <span className="text-gray-400 dark:text-slate-500 text-xs mt-1">رحلات منظمة بالكامل</span>
                 </Link>
              </div>
            </motion.div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;
