import { Star, Building2, Phone, Send, CheckCircle2, Award, Users, BarChart3, Sparkles, ShieldCheck, Banknote, Headphones, Gem, LayoutDashboard, Wallet, CalendarCheck, FilePieChart, ArrowUpRight, ImageIcon, Clock, MapPin, Timer, X } from "lucide-react";
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
import { validatePhone, validateEmail } from "@/lib/validators";
import { cn } from "@/lib/utils";

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
    <div className="min-h-screen bg-background font-cairo transition-colors duration-500" dir="rtl">
      <Header />
      
      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[10%] right-[5%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[20%] left-[5%] w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px]" />
      </div>

      <main className="relative z-0">
        {/* 1. Hero Section */}
        <CompanyHero />

        {/* 2. Brand Slider Section */}
        <motion.section 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          className="py-16 bg-card/30 backdrop-blur-xl border-y border-border overflow-hidden relative"
        >
          <div className="container mx-auto px-4 mb-10 text-center">
            <Badge variant="outline" className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-4 border-primary/20 px-4 py-1.5 rounded-full">نـشرك النجاح والـثقة</Badge>
            <div className="h-1 w-16 bg-primary mx-auto rounded-full shadow-lg shadow-primary/20" />
          </div>
          
          <div className="flex overflow-hidden group space-x-12" dir="ltr">
            {/* First Set */}
            <div className="flex animate-marquee space-x-16 min-w-full shrink-0 items-center justify-around px-8">
              {companies.map((company) => (
                <Link 
                  key={`${company.id}-1`} 
                  to={`/companies/${company.id}`}
                  className="flex items-center gap-5 group/logo cursor-pointer opacity-50 hover:opacity-100 transition-all duration-500 grayscale hover:grayscale-0"
                >
                   <div className={cn("h-14 w-14 rounded-2xl bg-gradient-to-br p-0.5 shadow-xl transition-all duration-500 group-hover/logo:scale-110 group-hover/logo:shadow-primary/20", company.color)}>
                     <div className="w-full h-full bg-background rounded-[14px] flex items-center justify-center overflow-hidden">
                        {company.logo.startsWith('http') ? (
                          <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl font-black text-foreground">{company.logo}</span>
                        )}
                     </div>
                   </div>
                   <span className="font-black text-2xl text-foreground tracking-tighter group-hover/logo:text-primary transition-colors uppercase">{company.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </motion.section>

        {/* 3. Features Section */}
        <section className="py-32 relative overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-24 space-y-6">
              <Badge className="bg-primary/10 text-primary border-primary/20 font-black uppercase tracking-[0.2em] px-6 py-2 rounded-2xl text-xs">نحن نعتني بتفاصيلك</Badge>
              <h2 className="text-5xl md:text-7xl font-black text-foreground tracking-tighter leading-tight">لماذا تختار <span className="text-primary">الرحلتى</span>؟</h2>
              <p className="text-xl text-muted-foreground font-bold">نحن نوفر لك منصة آمنة تجمع خبراء السفر لضمان رحلة مثالية.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
              {[
                { 
                  icon: ShieldCheck, 
                  title: "شركات موثقة", 
                  desc: "نطبق معايير صارمة في اختيار الشركاء لضمان جودة الخدمة والأمان.",
                  color: "bg-blue-500",
                  shadow: "shadow-blue-500/20"
                },
                { 
                  icon: Banknote, 
                  title: "أفضل الأسعار", 
                  desc: "نضمن لك الحصول على السعر الحقيقي مباشرة من الشركة دون أي تكاليف خفية.",
                  color: "bg-emerald-500",
                  shadow: "shadow-emerald-500/20"
                },
                { 
                  icon: Headphones, 
                  title: "دعم 24/7", 
                  desc: "فريقنا متواجد دائماً لمساعدتك في أي استفسار أو مشكلة تواجهك.",
                  color: "bg-amber-500",
                  shadow: "shadow-amber-500/20"
                },
                { 
                  icon: Gem, 
                  title: "باقات حصرية", 
                  desc: "عروض ومنتجات سياحية مصممة خصيصاً لمستخدمي منصة الرحلتى.",
                  color: "bg-purple-500",
                  shadow: "shadow-purple-500/20"
                }
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1, duration: 0.6 }}
                  viewport={{ once: true }}
                  className="group relative p-10 rounded-[3rem] bg-card border border-border shadow-xl hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/30 transition-all duration-500 overflow-hidden"
                >
                  <div className={cn("h-16 w-16 rounded-2xl text-white flex items-center justify-center mb-10 shadow-2xl transition-transform duration-500 group-hover:scale-110", item.color, item.shadow)}>
                    <item.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-3xl font-black text-foreground mb-6 tracking-tighter">{item.title}</h3>
                  <p className="text-muted-foreground text-base font-bold leading-relaxed">{item.desc}</p>
                  
                  <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-tr from-primary/10 to-transparent rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                </motion.div>
              ))}
            </div>

            {/* Visual Callout */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="mt-32 relative h-[500px] rounded-[4rem] overflow-hidden shadow-3xl group border border-border"
            >
              <img 
                src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80" 
                alt="Adventure" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[3s]"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent" />
              <div className="absolute inset-y-0 right-0 w-full lg:w-3/5 flex flex-col justify-center p-16 text-right space-y-8">
                <h3 className="text-5xl md:text-6xl font-black text-white leading-none tracking-tighter">استعد لتجربة سفر <br /> <span className="text-primary">تحبس الأنفاس</span></h3>
                <p className="text-white/70 text-xl font-bold max-w-lg">انضم إلى آلاف المسافرين الذين اكتشفوا جمال مصر من خلال خبرائنا الموثوقين.</p>
                <div className="flex gap-6">
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 px-8 py-6 rounded-[2rem] shadow-2xl">
                    <span className="block text-4xl font-black text-primary">100%</span>
                    <span className="text-xs font-black text-white/60 uppercase tracking-widest">شركات معتمدة</span>
                  </div>
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 px-8 py-6 rounded-[2rem] shadow-2xl">
                    <span className="block text-4xl font-black text-primary">24/7</span>
                    <span className="text-xs font-black text-white/60 uppercase tracking-widest">دعم فني مباشر</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 4. Featured Trips Section */}
        <motion.section 
          id="featured-trips" 
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative py-32 container mx-auto px-4"
        >
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-20">
             <div className="space-y-6">
               <div className="flex items-center gap-5">
                 <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-2xl shadow-primary/30 animate-bounce">
                    <Sparkles className="w-8 h-8" />
                 </div>
                 <h2 className="text-5xl md:text-6xl font-black text-foreground tracking-tighter">أحدث العروض الحصرية</h2>
               </div>
               <p className="text-xl text-muted-foreground max-w-xl font-bold">رحلات ومنتجات سياحية تم اختيارها بعناية من أفضل الشركات لتجربة لا تُنسى.</p>
             </div>
             <Badge className="bg-primary text-primary-foreground border-0 px-8 py-3 rounded-2xl text-sm font-black shadow-2xl shadow-primary/30 uppercase tracking-widest">باقات VIP حصرية</Badge>
           </div>
           
           {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
               {[1, 2, 3, 4].map((i) => (
                 <TripCardSkeleton key={i} />
               ))}
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
               {featuredTrips.map((trip, idx) => {
                 const company = getCompanyById(trip.companyId);
                 return (
                   <motion.div 
                     key={trip.id} 
                     initial={{ opacity: 0, scale: 0.9 }}
                     whileInView={{ opacity: 1, scale: 1 }}
                     transition={{ delay: idx * 0.1, duration: 0.5 }}
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

        {/* 5. Search and Filter Section */}
        <section id="trips-section" className="py-32 relative border-t border-border bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="flex flex-col gap-12 mb-20">
              <div className="max-w-3xl space-y-4">
                <h2 className="text-5xl md:text-7xl font-black text-foreground tracking-tighter">استكشف جميع الرحلات</h2>
                <p className="text-xl text-muted-foreground font-bold">استخدم البحث المتقدم والفلاتر الذكية للوصول إلى وجهتك المثالية بكل سهولة.</p>
              </div>

              <div className="flex flex-col lg:flex-row items-center gap-6">
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

              <div className="flex items-center justify-between border-b border-border pb-8">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                  <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">
                    تم العثور على <span className="text-primary text-xl mx-2">{filteredTrips.length}</span> رحلة متميزة
                  </p>
                </div>
                {(searchQuery || Object.keys(filters).length > 0) && (
                  <Button 
                    variant="ghost" 
                    onClick={() => { setSearchQuery(""); setFilters({}); }}
                    className="text-primary hover:bg-primary/10 font-black text-sm uppercase tracking-widest px-6 rounded-xl"
                  >
                    إلغاء جميع الفلاتر
                    <X className="mr-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="space-y-24">
                {[1, 2].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-12 bg-muted rounded-2xl w-1/4 mb-12" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                      {[1, 2, 3].map((j) => (
                        <TripCardSkeleton key={j} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredTrips.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-40 bg-card rounded-[4rem] border-4 border-dashed border-border shadow-inner"
              >
                <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-primary/5 mb-10">
                  <Sparkles className="h-16 w-16 text-primary/40" />
                </div>
                <h3 className="text-4xl font-black text-foreground mb-6 tracking-tighter">لم نجد ما تبحث عنه بالضبط</h3>
                <p className="text-muted-foreground mb-12 max-w-lg mx-auto text-lg font-bold">جرب تعديل بعض الكلمات في البحث أو استخدام فلاتر مختلفة لاكتشاف وجهات جديدة.</p>
                <Button
                  onClick={() => { setSearchQuery(""); setFilters({}); }}
                  className="rounded-2xl h-16 px-12 bg-primary hover:bg-primary/90 transition-all font-black shadow-2xl shadow-primary/20 text-lg"
                >
                  تصفح جميع الرحلات
                </Button>
              </motion.div>
            ) : (
              <div className="space-y-12">
                {companies.map((company) => {
                  const companyTrips = getTripsByCompany(company.id);
                  if (companyTrips.length === 0) return null;
                  
                  return (
                    <motion.div
                      key={company.id}
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8 }}
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

        {/* 6. Partner with Us - Business Section */}
        <section className="py-32 relative bg-slate-950 overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-px bg-white/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent -z-10" />
          
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-16 mb-24">
              <div className="space-y-6 max-w-3xl text-right">
                <Badge className="bg-white/5 text-primary border-white/10 font-black uppercase tracking-[0.2em] px-6 py-2 rounded-2xl text-xs">هل أنت صاحب شركة؟</Badge>
                <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-tight">
                  ادر أعمالك <span className="text-primary">بذكاء واحترافية</span>
                </h2>
                <p className="text-xl text-slate-400 font-bold max-w-xl">
                  نظام متكامل لإدارة رحلاتك، عملائك، وأرباحك في مكان واحد وبسهولة تامة وبأعلى معايير الأمان.
                </p>
              </div>
              <Button size="lg" className="h-20 px-12 rounded-[2rem] bg-primary hover:bg-primary/90 text-white font-black shadow-2xl shadow-primary/30 transition-all hover:-translate-y-2 text-xl">
                انضم إلينا الآن
                <ArrowUpRight className="mr-3 h-8 w-8" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
              {[
                { icon: LayoutDashboard, title: "لوحة تحكم ذكية", desc: "إحصائيات مباشرة لأداء رحلاتك، عدد المشاهدات، ومعدلات الحجز.", color: "text-blue-400" },
                { icon: CalendarCheck, title: "إدارة الحجوزات", desc: "نظام متكامل لتأكيد أو إلغاء الحجوزات، ومتابعة قوائم المسافرين.", color: "text-emerald-400" },
                { icon: Wallet, title: "المحفظة المالية", desc: "تابع أرباحك، التحويلات البنكية، والمبالغ المستحقة بكل شفافية.", color: "text-purple-400" },
                { icon: FilePieChart, title: "تقارير تحليلية", desc: "تقارير يومية وأسبوعية مفصلة تساعدك على تطوير خطط أعمالك.", color: "text-amber-400" },
              ].map((item, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white/5 backdrop-blur-xl p-10 rounded-[3rem] border border-white/10 hover:border-primary/50 hover:bg-white/[0.08] transition-all duration-500 group"
                >
                  <div className={cn("h-20 w-20 rounded-[1.5rem] bg-white/5 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-2xl", item.color)}>
                    <item.icon className="h-10 w-10" />
                  </div>
                  <h4 className="text-3xl font-black text-white mb-6 tracking-tighter leading-none">{item.title}</h4>
                  <p className="text-slate-400 font-bold leading-relaxed text-base">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. Registration Section */}
        <motion.section 
          id="register-company" 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="py-32 bg-card relative overflow-hidden rounded-[5rem] mx-4 my-32 border border-border"
        >
          {/* Decorative Orbs */}
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] -z-0" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[120px] -z-0" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-7xl mx-auto flex flex-col xl:flex-row gap-24 lg:items-center">
              
              {/* Left Content */}
              <div className="w-full xl:w-2/5 text-right space-y-12">
                <div className="space-y-8">
                  <Badge className="bg-primary/10 text-primary border-primary/20 px-6 py-2 rounded-2xl text-sm font-black tracking-widest">نمو أعمالك يبدأ هنا</Badge>
                  <h2 className="text-6xl lg:text-8xl font-black text-foreground leading-[1.1] tracking-tighter">اضاعف حجوزات <br/><span className="text-primary">شركتك</span> اليوم</h2>
                  <p className="text-2xl text-muted-foreground leading-relaxed max-w-xl font-bold">
                    انضم إلى أكبر تجمع للشركات السياحية في مصر. نحن نوفر لك كل الأدوات التقنية والتسويقية التي تحتاجها للوصول لعملائك.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6">
                  {[
                    "توثيق حسابك الرسمي",
                    "نظام إدارة متطور",
                    "تقارير أداء لحظية",
                    "دعم فني مخصص",
                    "أولوية في البحث",
                    "أدوات تسويقية"
                  ].map((benefit, i) => (
                    <div key={i} className="flex items-center gap-4 text-foreground font-black bg-muted/50 p-6 rounded-[1.5rem] border border-border hover:border-primary/40 transition-all hover:-translate-x-2">
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <span className="text-lg tracking-tight">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Side: Form */}
              <div className="w-full xl:w-3/5">
                <motion.div 
                  initial={{ x: 50, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  className="bg-background p-12 lg:p-20 rounded-[4rem] shadow-3xl relative overflow-hidden border border-border"
                >
                  <div className="absolute top-0 right-0 w-full h-3 bg-primary" />
                  
                  <div className="mb-16 text-center space-y-4">
                    <h3 className="text-4xl font-black text-foreground tracking-tighter">سجل اهتمامك الآن</h3>
                    <p className="text-xl text-muted-foreground font-bold">خطوات بسيطة وسنتواصل معك لتفعيل حسابك الرسمي.</p>
                  </div>

                  <form className="grid grid-cols-1 md:grid-cols-2 gap-8" onSubmit={async (e) => {
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
                    submitBtn.innerHTML = '<span class="animate-spin inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full mr-2"></span> جاري المعالجة...';

                    const data = {
                      companyName: formData.get('companyName') as string,
                      email: formData.get('email') as string,
                      phone: formData.get('phone') as string,
                      whatsapp: formData.get('whatsapp') as string,
                      tripTypes: formData.get('tripTypes') as string,
                      message: formData.get('message') as string
                    };

                    const phoneCheck = validatePhone(data.phone || "");
                    if (!phoneCheck.valid) { toast({ title: "رقم الهاتف غير صحيح", description: phoneCheck.message, variant: "destructive" }); submitBtn.disabled = false; submitBtn.innerHTML = originalBtnText; return; }
                    const whatsappCheck = validatePhone(data.whatsapp || "");
                    if (!whatsappCheck.valid) { toast({ title: "رقم الواتساب غير صحيح", description: whatsappCheck.message, variant: "destructive" }); submitBtn.disabled = false; submitBtn.innerHTML = originalBtnText; return; }
                    const emailCheck = validateEmail(data.email || "");
                    if (!emailCheck.valid) { toast({ title: "البريد الإلكتروني غير صحيح", description: emailCheck.message, variant: "destructive" }); submitBtn.disabled = false; submitBtn.innerHTML = originalBtnText; return; }

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
                    <div className="space-y-3">
                       <label className="text-base font-black text-foreground mr-3">اسم شركتك المعتمد</label>
                       <Input name="companyName" required placeholder="مثال: شركة المسافر الدولي" className="rounded-2xl border-border bg-muted/50 focus-visible:ring-4 focus-visible:ring-primary/10 h-16 px-8 text-lg font-bold" />
                    </div>
                    <div className="space-y-3">
                       <label className="text-base font-black text-foreground mr-3">البريد الإلكتروني للعمل</label>
                       <Input name="email" type="email" required placeholder="business@company.com" className="rounded-2xl border-border bg-muted/50 focus-visible:ring-4 focus-visible:ring-primary/10 h-16 px-8 text-lg font-bold" dir="ltr" />
                    </div>
                    <div className="space-y-3">
                       <label className="text-base font-black text-foreground mr-3">رقم هاتف التواصل</label>
                       <Input name="phone" required placeholder="01x xxxx xxxx" className="rounded-2xl border-border bg-muted/50 focus-visible:ring-4 focus-visible:ring-primary/10 h-16 px-8 text-lg font-bold" dir="ltr" />
                    </div>
                    <div className="space-y-3">
                       <label className="text-base font-black text-foreground mr-3">واتساب الشركة</label>
                       <Input name="whatsapp" required placeholder="01x xxxx xxxx" className="rounded-2xl border-border bg-muted/50 focus-visible:ring-4 focus-visible:ring-primary/10 h-16 px-8 text-lg font-bold" dir="ltr" />
                    </div>
                    <div className="space-y-3 md:col-span-2">
                       <label className="text-base font-black text-foreground mr-3">تخصصات الرحلات</label>
                       <Input name="tripTypes" required placeholder="سفاري، رحلات بحرية، السياحة الدينية..." className="rounded-2xl border-border bg-muted/50 focus-visible:ring-4 focus-visible:ring-primary/10 h-16 px-8 text-lg font-bold" />
                    </div>
                    <div className="space-y-3 md:col-span-2">
                       <label className="text-base font-black text-foreground mr-3">ملاحظات إضافية (اختياري)</label>
                       <Textarea name="message" placeholder="أخبرنا المزيد عن خدماتك أو عدد الفروع..." className="rounded-[2.5rem] border-border bg-muted/50 focus-visible:ring-4 focus-visible:ring-primary/10 min-h-[160px] p-8 text-lg font-bold" />
                    </div>

                    <div className="md:col-span-2 pt-10">
                      <Button type="submit" className="w-full h-20 rounded-[2.5rem] bg-primary hover:bg-primary/90 text-primary-foreground font-black text-2xl shadow-3xl shadow-primary/30 transition-all active:scale-95 group">
                         <Send className="h-8 w-8 ml-4 group-hover:translate-x-[-6px] transition-transform" />
                         إرسال طلب الانضمام
                      </Button>
                      <p className="text-center text-sm text-muted-foreground mt-6 font-bold">بإرسالك الطلب فأنت توافق على شروط الاستخدام الخاصة بالشركاء.</p>
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
