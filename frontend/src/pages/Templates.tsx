import { Star, Building2, Phone, Send, CheckCircle2, Award, Users, BarChart3, Sparkles, ShieldCheck, Banknote, Headphones, Gem, LayoutDashboard, Wallet, CalendarCheck, FilePieChart, ArrowUpRight } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CompanyCard from "@/components/CompanyCard";
import CompanyTripsSection from "@/components/CompanyTripsSection";
import TripCardEnhanced from "@/components/TripCardEnhanced";
import TripSearchBar from "@/components/TripSearchBar";
import TripFilters from "@/components/TripFilters";
import TripCardSkeleton from "@/components/TripCardSkeleton";
import { Company, Trip, TripFilters as TripFiltersType } from "@/types/corporateTrips";
import { corporateTripsService } from "@/services/corporateTripsService";
import CompanyHero from "@/components/CompanyHero";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useLoading } from "@/contexts/LoadingContext";

const CorporateTrips = () => {
  const { getToken, isSignedIn } = useAuth();
  const { toast } = useToast();
  const { startLoading, stopLoading } = useLoading();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);
  const [featuredTrips, setFeaturedTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<TripFiltersType>({});

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      startLoading();
      try {
        const [companiesData, tripsData, featuredData] = await Promise.all([
          corporateTripsService.getAllCompanies(),
          corporateTripsService.getAllTrips(),
          corporateTripsService.getFeaturedTrips(4)
        ]);
        
        setCompanies(companiesData);
        setAllTrips(tripsData);
        setFilteredTrips(tripsData);
        setFeaturedTrips(featuredData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
        stopLoading();
      }
    };

    fetchData();
  }, []);

  // Apply filters and search
  useEffect(() => {
    const applyFilters = async () => {
      const combinedFilters: TripFiltersType = {
        ...filters,
        searchQuery: searchQuery || undefined
      };

      const filtered = await corporateTripsService.filterTrips(combinedFilters);
      setFilteredTrips(filtered);
    };

    applyFilters();
  }, [filters, searchQuery]);

  // Get trips by company
  const getTripsByCompany = (companyId: string): Trip[] => {
    return filteredTrips.filter(trip => trip.companyId === companyId);
  };

  // Get company by ID
  const getCompanyById = (companyId: string): Company | undefined => {
    return companies.find(c => c.id === companyId);
  };

  // Dynamic Filter Data
  const destinations = [...new Set(allTrips.map(trip => trip.destination).filter(Boolean))];
  const durations = [...new Set(allTrips.map(trip => trip.duration).filter(Boolean))];
  
  const prices = allTrips.map(trip => parseInt(trip.price.replace(/[^0-9]/g, '')) || 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 10000;
  
  const priceRange = { min: minPrice, max: maxPrice };

  return (
    <div className="min-h-screen bg-[#FDFEFF] font-cairo" dir="rtl">
      <Header />
      
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[10%] right-[5%] w-[400px] h-[400px] bg-orange-100/30 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[20%] left-[5%] w-[300px] h-[300px] bg-indigo-100/30 rounded-full blur-[80px]" />
        <div className="absolute top-[40%] left-[20%] w-[500px] h-[500px] bg-amber-50/20 rounded-full blur-[120px]" />
      </div>

      <main className="relative z-0">
        {/* 1. Hero Section */}
        <CompanyHero />

        {/* 2. Logo Slider Section */}
        <motion.section 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="py-12 bg-white/50 backdrop-blur-sm border-y border-gray-100/50 overflow-hidden relative"
        >
          <div className="container mx-auto px-4 mb-8 text-center">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] mb-2">نـشرك النجاح والـثقة</h3>
            <div className="h-1 w-12 bg-orange-400 mx-auto rounded-full opacity-50" />
          </div>
          
          <div className="flex overflow-hidden group space-x-12" dir="ltr">
            {/* First Set */}
            <div className="flex animate-marquee space-x-12 min-w-full shrink-0 items-center justify-around px-8">
              {companies.map((company) => (
                <Link 
                  key={`${company.id}-1`} 
                  to={`/companies/${company.id}`}
                  className="flex items-center gap-4 group/logo cursor-pointer opacity-70 hover:opacity-100 transition-all duration-300 no-underline"
                >
                   <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${company.color} p-0.5 shadow-lg group-hover/logo:scale-110 transition-transform duration-500`}>
                     <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center overflow-hidden">
                        {company.logo.startsWith('http') ? (
                          <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-br from-gray-700 to-gray-900">{company.logo}</span>
                        )}
                     </div>
                   </div>
                   <span className="font-black text-xl text-gray-800 tracking-tight group-hover/logo:text-orange-600 transition-colors uppercase">{company.name}</span>
                </Link>
              ))}
            </div>
            {/* Second Set (Duplicate) */}
            <div className="flex animate-marquee space-x-12 min-w-full shrink-0 items-center justify-around px-8">
              {companies.map((company) => (
                <Link 
                  key={`${company.id}-2`} 
                  to={`/companies/${company.id}`}
                  className="flex items-center gap-4 group/logo cursor-pointer opacity-70 hover:opacity-100 transition-all duration-300 no-underline"
                >
                   <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${company.color} p-0.5 shadow-lg group-hover/logo:scale-110 transition-transform duration-500`}>
                     <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center overflow-hidden">
                        {company.logo.startsWith('http') ? (
                          <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-br from-gray-700 to-gray-900">{company.logo}</span>
                        )}
                     </div>
                   </div>
                   <span className="font-black text-xl text-gray-800 tracking-tight group-hover/logo:text-orange-600 transition-colors uppercase">{company.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Why Travel With Us - Premium Redesign */}
        <section className="py-20 relative overflow-hidden bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <Badge className="bg-orange-50 text-orange-600 border-orange-100 font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full text-[10px]">نحن نعتني بتفاصيلك</Badge>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">لماذا تختار <span className="text-orange-600">الرحلتى</span> للسياحة؟</h2>
              <p className="text-lg text-gray-500 font-medium">نحن نوفر لك منصة آمنة تجمع خبراء السفر لضمان رحلة مثالية.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { 
                  icon: ShieldCheck, 
                  title: "شركات موثقة", 
                  desc: "نطبق معايير صارمة في اختيار الشركاء لضمان جودة الخدمة والأمان.",
                  color: "bg-blue-500",
                  shadow: "shadow-blue-200"
                },
                { 
                  icon: Banknote, 
                  title: "أفضل الأسعار", 
                  desc: "نضمن لك الحصول على السعر الحقيقي مباشرة من الشركة دون أي تكاليف خفية.",
                  color: "bg-emerald-500",
                  shadow: "shadow-emerald-200"
                },
                { 
                  icon: Headphones, 
                  title: "دعم 24/7", 
                  desc: "فريقنا متواجد دائماً لمساعدتك في أي استفسار أو مشكلة تواجهك.",
                  color: "text-orange-500",
                  bg: "bg-orange-50",
                  shadow: "shadow-orange-100"
                },
                { 
                  icon: Gem, 
                  title: "باقات حصرية", 
                  desc: "عروض ومنتجات سياحية مصممة خصيصاً لمستخدمي منصة الرحلتى.",
                  color: "text-purple-500",
                  bg: "bg-purple-50",
                  shadow: "shadow-purple-100"
                }
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="group relative p-8 rounded-[2.5rem] bg-zinc-50 border border-zinc-100/50 hover:bg-white hover:shadow-2xl hover:shadow-zinc-200/50 transition-all duration-500 overflow-hidden"
                >
                  <div className={`h-14 w-14 rounded-2xl ${item.bg || 'bg-white'} ${item.color} flex items-center justify-center mb-8 shadow-lg ${item.shadow} group-hover:scale-110 transition-transform duration-500`}>
                    <item.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">{item.title}</h3>
                  <p className="text-gray-500 text-sm font-medium leading-relaxed">{item.desc}</p>
                  
                  {/* Decorative Gradient Orb */}
                  <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-tr from-zinc-200/20 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                </motion.div>
              ))}
            </div>

            {/* Visual Callout */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="mt-16 relative h-[300px] rounded-[3.5rem] overflow-hidden shadow-2xl group"
            >
              <img 
                src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80" 
                alt="Adventure" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s]"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
              <div className="absolute inset-y-0 right-0 w-full lg:w-1/2 flex flex-col justify-center p-12 text-right">
                <h3 className="text-3xl font-black text-white mb-4 leading-tight">استعد لتجربة سفر <br /> تحبس الأنفاس</h3>
                <p className="text-white/70 text-lg font-medium max-w-sm mb-8">انضم إلى آلاف المسافرين الذين اكتشفوا جمال مصر من خلال خبرائنا.</p>
                <div className="flex gap-4">
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-2xl">
                    <span className="block text-2xl font-bold text-white">100%</span>
                    <span className="text-xs font-medium text-white/60">شركات معتمدة</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-2xl">
                    <span className="block text-2xl font-bold text-white">24/7</span>
                    <span className="text-xs font-medium text-white/60">دعم فني</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 3. Featured Trips Section */}
        <motion.section 
          id="featured-trips" 
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="relative py-12 container mx-auto px-4"
        >
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
             <div className="space-y-2">
               <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-2xl bg-orange-600 flex items-center justify-center text-white shadow-xl shadow-orange-200">
                    <Sparkles className="w-6 h-6" />
                 </div>
                 <h2 className="text-4xl font-black text-gray-900 tracking-tight">أحدث العروض الحصرية</h2>
               </div>
               <p className="text-gray-500 mr-13 max-w-lg">رحلات ومنتجات سياحية تم اختيارها بعناية من أفضل الشركات لتجربة لا تُنسى.</p>
             </div>
             <Badge className="w-fit bg-gradient-to-r from-orange-600 to-amber-500 text-white border-0 px-6 py-2 rounded-full text-sm font-black shadow-lg shadow-orange-100">باقات حصرية</Badge>
           </div>
           
           {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
               {[1, 2, 3, 4].map((i) => (
                 <TripCardSkeleton key={i} />
               ))}
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
               {featuredTrips.map((trip, idx) => {
                 const company = getCompanyById(trip.companyId);
                 return (
                   <motion.div 
                     key={trip.id} 
                     initial={{ opacity: 0, scale: 0.95 }}
                     whileInView={{ opacity: 1, scale: 1 }}
                     transition={{ delay: idx * 0.1 }}
                     viewport={{ once: true }}
                     className="relative group h-full"
                   >
                     <TripCardEnhanced trip={trip} companyName={company?.name} companyLogo={company?.logo} showCompanyBadge={true} />
                   </motion.div>
                 );
               })}
             </div>
           )}
        </motion.section>

        {/* 4. Search and Filter Section */}
        <section id="trips-section" className="py-12 relative border-t border-zinc-100/50">
          <div className="container mx-auto px-4">
            <div className="flex flex-col gap-6 mb-8">
              <div className="max-w-2xl">
                <h2 className="text-5xl font-black text-gray-900 tracking-tight mb-4">استكشف جميع الرحلات</h2>
                <p className="text-xl text-gray-500 font-medium">استخدم البحث المتقدم والفلاتر الذكية للوصول إلى وجهتك المثالية.</p>
              </div>

              <div className="flex flex-col lg:flex-row items-center gap-4">
                <div className="w-full lg:flex-1">
                  <TripSearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                  />
                </div>
                <div className="w-full lg:w-auto">
                  <TripFilters
                    filters={filters}
                    onFiltersChange={setFilters}
                    destinations={destinations}
                    durations={durations}
                    companies={companies}
                    priceRange={priceRange}
                  />
                </div>
              </div>

              {/* Results Count & Clear */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">
                  تم العثور على <span className="text-orange-600 text-sm mx-1">{filteredTrips.length}</span> رحلة متميزة
                </p>
                {(searchQuery || Object.keys(filters).length > 0) && (
                  <Button 
                    variant="link" 
                    size="sm"
                    onClick={() => { setSearchQuery(""); setFilters({}); }}
                    className="text-orange-600 hover:text-orange-700 font-black text-xs uppercase tracking-widest p-0 h-auto"
                  >
                    إلغاء جميع الفلاتر
                  </Button>
                )}
              </div>
            </div>

            {/* Company Trips Sections */}
            {loading ? (
              <div className="space-y-16">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-10 bg-gray-200 rounded-2xl w-1/3 mb-10" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {[1, 2, 3].map((j) => (
                        <TripCardSkeleton key={j} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredTrips.length === 0 ? (
              // Empty State
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-32 bg-gray-50/50 rounded-[3rem] border border-dashed border-gray-200"
              >
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-orange-50 mb-8">
                  <Sparkles className="h-12 w-12 text-orange-400" />
                </div>
                <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">لم نجد ما تبحث عنه بالضبط</h3>
                <p className="text-gray-500 mb-10 max-w-md mx-auto leading-relaxed">جرب تعديل بعض الكلمات في البحث أو استخدام فلاتر مختلفة لاكتشاف وجهات جديدة.</p>
                <Button
                  variant="default"
                  className="rounded-2xl h-14 px-10 bg-gray-900 hover:bg-orange-600 transition-all font-bold shadow-xl shadow-gray-200"
                  onClick={() => {
                    setSearchQuery("");
                    setFilters({});
                  }}
                >
                  تصفح جميع الرحلات
                </Button>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {companies.map((company) => {
                  const companyTrips = getTripsByCompany(company.id);
                  if (companyTrips.length === 0) return null;
                  
                  return (
                    <motion.div
                      key={company.id}
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6 }}
                    >
                      <CompanyTripsSection
                        company={company}
                        trips={companyTrips}
                      />
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>



        {/* 6. Partner with Us - Compact Business Redesign */}
        <section className="py-20 relative bg-zinc-900 overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-px bg-white/10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent -z-10" />
          
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-12 mb-16">
              <div className="space-y-4 max-w-2xl text-right">
                <Badge className="bg-white/10 text-indigo-400 border-white/20 font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-xl text-xs">هل أنت صاحب شركة؟</Badge>
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                  ادر أعمالك <span className="text-transparent bg-clip-text bg-gradient-to-l from-indigo-400 to-purple-400">بذكاء واحترافية</span>
                </h2>
                <p className="text-lg text-zinc-400 font-medium max-w-lg">
                  نظام متكامل لإدارة رحلاتك، عملائك، وأرباحك في مكان واحد وبسهولة تامة.
                </p>
              </div>
              <Button size="lg" className="h-14 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black shadow-xl">
                انضم إلينا الآن
                <ArrowUpRight className="mr-2 h-5 w-5" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { 
                  icon: LayoutDashboard, 
                  title: "لوحة تحكم ذكية", 
                  desc: "إحصائيات مباشرة لأداء رحلاتك، عدد المشاهدات، ومعدلات الحجز.", 
                  color: "text-blue-400" 
                },
                { 
                  icon: CalendarCheck, 
                  title: "إدارة الحجوزات", 
                  desc: "نظام متكامل لتأكيد أو إلغاء الحجوزات، ومتابعة قوائم المسافرين.", 
                  color: "text-emerald-400" 
                },
                { 
                  icon: Wallet, 
                  title: "المحفظة المالية", 
                  desc: "تابع أرباحك، التحويلات البنكية، والمبالغ المستحقة بكل شفافية.", 
                  color: "text-purple-400" 
                },
                { 
                  icon: FilePieChart, 
                  title: "تقارير تحليلية", 
                  desc: "تقارير يومية وأسبوعية مفصلة تساعدك على تطوير خطط أعمالك.", 
                  color: "text-orange-400" 
                },
              ].map((item, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white/5 backdrop-blur-sm p-8 rounded-[2.5rem] border border-white/10 hover:border-indigo-500/50 hover:bg-white/[0.08] transition-all duration-500 group"
                >
                  <div className={`h-16 w-16 rounded-[1.5rem] bg-white/5 ${item.color} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500 shadow-xl`}>
                    <item.icon className="h-8 w-8" />
                  </div>
                  <h4 className="text-2xl font-black text-white mb-4 tracking-tight leading-none">{item.title}</h4>
                  <p className="text-zinc-400 font-medium leading-relaxed text-sm">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <br />
        <br />

        {/* 7. Advertise Your Company Section */}
        <motion.section 
          id="register-company" 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="py-20 bg-gray-900 relative overflow-hidden rounded-[3rem] mx-4 mb-16"
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-600/20 rounded-full blur-[120px] -z-0" />
          <div className="absolute bottom-[-100px] left-[-100px] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px] -z-0" />
          <div className="absolute top-1/4 left-1/4 w-px h-px shadow-[0_0_100px_50px_rgba(255,255,255,0.05)]" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-6xl mx-auto flex flex-col xl:flex-row gap-16 lg:items-center">
              
              {/* Left Content */}
              <div className="w-full xl:w-2/5 text-right space-y-10">
                <div className="space-y-6">
                  <Badge className="bg-orange-600/20 text-orange-400 border-0 hover:bg-orange-600/30 px-4 py-1.5 rounded-full text-sm font-bold tracking-wide">نمو أعمالك يبدأ هنا</Badge>
                  <h2 className="text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight">اضاعف حجوزات <br/><span className="text-orange-500 underline decoration-orange-500/30 decoration-8 underline-offset-8">شركتك</span> اليوم</h2>
                  <p className="text-xl text-gray-400 leading-relaxed max-w-lg">
                    انضم إلى أكبر تجمع للشركات السياحية في مصر. نحن نوفر لك كل الأدوات التقنية والتسويقية التي تحتاجها للوصول لعملائك المستهدفين وزيادة مبيعاتك بشكل حقيقي.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                  {[
                    "توثيق حسابك الرسمي",
                    "نظام إدارة حجوزات متطور",
                    "تقارير أداء ومبيعات لحظية",
                    "دعم فني مخصص للشركات",
                    "أولوية الظهور في البحث",
                    "أدوات تسويق عبر البريد"
                  ].map((benefit, i) => (
                    <div key={i} className="flex items-center gap-3 text-gray-300 font-bold bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-orange-500/30 transition-all">
                      <div className="h-6 w-6 rounded-full bg-orange-600 flex items-center justify-center text-white">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <span className="text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Side: Sleek Glass Form */}
              <div className="w-full xl:w-3/5">
                <motion.div 
                  initial={{ x: 50, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  className="bg-white p-8 lg:p-12 rounded-[3.5rem] shadow-3xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-full h-2 bg-gradient-to-l from-orange-500 to-amber-400" />
                  
                  <div className="mb-10 text-center">
                    <h3 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">سجل اهتمامك الآن</h3>
                    <p className="text-gray-500 font-medium">خطوات بسيطة وسنتواصل معك لتفعيل حسابك الرسمي.</p>
                  </div>

                  <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={async (e) => {
                    e.preventDefault();
                    if (!isSignedIn) {
                      toast({ title: "تنبيه", description: "يجب تسجيل الدخول لإرسال الطلب.", variant: "destructive" });
                      return;
                    }

                    const form = e.currentTarget;
                    const formData = new FormData(form);
                    const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
                    const originalBtnText = submitBtn.innerHTML;
                    
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<span class="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></span> جاري المعالجة...';

                    const data = {
                      companyName: formData.get('companyName') as string,
                      email: formData.get('email') as string,
                      phone: formData.get('phone') as string,
                      whatsapp: formData.get('whatsapp') as string,
                      tripTypes: formData.get('tripTypes') as string,
                      message: formData.get('message') as string
                    };

                    try {
                      const token = await getToken();
                      await corporateTripsService.submitCompanyRegistration(data, token || undefined);
                      toast({ title: "تم الإرسال بنجاح", description: "سنتواصل معك في أقرب وقت ممكن." });
                      form.reset();
                    } catch (error) {
                      toast({ title: "خطأ", description: "حدث خطأ أثناء الإرسال. يرجى المحاولة لاحقاً.", variant: "destructive" });
                    } finally {
                      submitBtn.disabled = false;
                      submitBtn.innerHTML = originalBtnText;
                    }
                  }}>
                    <div className="space-y-2">
                       <label className="text-sm font-black text-gray-700 mr-2">اسم شركتك المعتمد</label>
                       <Input name="companyName" required placeholder="مثال: شركة المسافر الدولي" className="rounded-2xl border-gray-100 bg-gray-50/50 focus-visible:ring-orange-500 h-14 px-6 text-lg" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-black text-gray-700 mr-2">البريد الإلكتروني للعمل</label>
                       <Input name="email" type="email" required placeholder="business@company.com" className="rounded-2xl border-gray-100 bg-gray-50/50 focus-visible:ring-orange-500 h-14 px-6 text-lg" dir="ltr" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-black text-gray-700 mr-2">رقم هاتف التواصل</label>
                       <Input name="phone" required placeholder="01xxxxxxxxx" className="rounded-2xl border-gray-100 bg-gray-50/50 focus-visible:ring-orange-500 h-14 px-6 text-lg" dir="ltr" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-black text-gray-700 mr-2">واتساب الشركة</label>
                       <Input name="whatsapp" required placeholder="01xxxxxxxxx" className="rounded-2xl border-gray-100 bg-gray-50/50 focus-visible:ring-orange-500 h-14 px-6 text-lg" dir="ltr" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                       <label className="text-sm font-black text-gray-700 mr-2">تخصصات الرحلات</label>
                       <Input name="tripTypes" required placeholder="سفاري، رحلات بحرية، السياحة الدينية..." className="rounded-2xl border-gray-100 bg-gray-50/50 focus-visible:ring-orange-500 h-14 px-6 text-lg" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                       <label className="text-sm font-black text-gray-700 mr-2">ملاحظات إضافية (اختياري)</label>
                       <Textarea name="message" placeholder="أخبرنا المزيد عن خدماتك أو عدد الفروع..." className="rounded-[2rem] border-gray-100 bg-gray-50/50 focus-visible:ring-orange-500 min-h-[120px] p-6 text-lg" />
                    </div>

                    <div className="md:col-span-2 pt-6">
                      <Button type="submit" className="w-full h-16 rounded-[2rem] bg-orange-600 hover:bg-gray-900 text-white font-black text-xl shadow-2xl shadow-orange-200 transition-all active:scale-95 group">
                         <Send className="h-6 w-6 ml-3 group-hover:translate-x-[-4px] transition-transform" />
                         إرسال طلب الانضمام
                      </Button>
                      <p className="text-center text-xs text-gray-400 mt-4">بإرسالك الطلب فأنت توافق على شروط الاستخدام وسياسة الخصوصية الخاصة بالشركاء.</p>
                    </div>
                  </form>
                </motion.div>
              </div>

            </div>
          </div>
        </motion.section>

      </main>
      <Footer />
    </div>
  );
};

export default CorporateTrips;
