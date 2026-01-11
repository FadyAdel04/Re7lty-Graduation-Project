import { useState, useEffect } from "react";
import { Star, Building2, Phone, Send, CheckCircle2, Award, Users, BarChart3, Sparkles } from "lucide-react";
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

const CorporateTrips = () => {
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

  const destinations = corporateTripsService.getDestinations();
  const priceRange = corporateTripsService.getPriceRange();

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header />
      
      <main>
        {/* 1. Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/50 via-white to-white pt-24 pb-20">
          <div className="container mx-auto px-4 text-center relative z-10">
            <Badge variant="outline" className="mb-4 px-4 py-1.5 text-orange-600 border-orange-200 bg-orange-50 rounded-full text-sm font-medium">
              شراكات موثوقة 🤝
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900 leading-tight">
              باقات <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">الشركات</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              اكتشف رحلات استثنائية مقدمة من أفضل شركات السياحة الموثوقة. تواصل معهم مباشرة واحجز رحلتك القادمة بكل سهولة.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="rounded-full px-8 h-12 text-base bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/20 w-full sm:w-auto" onClick={() => document.getElementById('trips-section')?.scrollIntoView({ behavior: 'smooth' })}>
                استعرض الرحلات
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8 h-12 text-base border-gray-200 hover:bg-gray-50 text-gray-700 w-full sm:w-auto" onClick={() => document.getElementById('register-company')?.scrollIntoView({ behavior: 'smooth' })}>
                سجل شركتك معنا
              </Button>
            </div>
          </div>
          
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-orange-50/50 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-1/3 h-full bg-gradient-to-r from-blue-50/50 to-transparent pointer-events-none" />
        </section>

        {/* 2. Logo Slider Section */}
        <section className="py-10 bg-white border-y border-gray-100 overflow-hidden">
          <div className="container mx-auto px-4 mb-6 text-center">
            <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">شركاء النجاح</p>
          </div>
          <div className="flex overflow-hidden group space-x-16" dir="ltr">
            {/* First Set */}
            <div className="flex animate-marquee space-x-16 min-w-full shrink-0 items-center justify-around px-8">
              {companies.map((company) => (
                <div key={`${company.id}-1`} className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0 cursor-pointer">
                   <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${company.color} flex items-center justify-center text-white font-bold text-xs shadow-sm overflow-hidden`}>
                     {company.logo.startsWith('http') ? (
                       <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
                     ) : (
                       company.logo
                     )}
                   </div>
                   <span className="font-bold text-lg text-gray-700">{company.name}</span>
                </div>
              ))}
            </div>
            {/* Second Set (Duplicate) */}
            <div className="flex animate-marquee space-x-16 min-w-full shrink-0 items-center justify-around px-8">
              {companies.map((company) => (
                <div key={`${company.id}-2`} className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0 cursor-pointer">
                   <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${company.color} flex items-center justify-center text-white font-bold text-xs shadow-sm overflow-hidden`}>
                     {company.logo.startsWith('http') ? (
                       <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
                     ) : (
                       company.logo
                     )}
                   </div>
                   <span className="font-bold text-lg text-gray-700">{company.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. Featured Trips Section */}
        <section className="py-16 container mx-auto px-4">
           <div className="flex items-center gap-2 mb-8">
             <div className="h-8 w-1 bg-orange-500 rounded-full" />
             <h2 className="text-3xl font-bold text-gray-900">أحدث العروض الحصرية</h2>
             <Badge className="mr-2 bg-orange-100 text-orange-700 hover:bg-orange-200 border-0">مميز</Badge>
           </div>
           
           {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {[1, 2, 3, 4].map((i) => (
                 <TripCardSkeleton key={i} />
               ))}
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {featuredTrips.map((trip) => {
                 const company = getCompanyById(trip.companyId);
                 return (
                   <div key={trip.id} className="relative group">
                     <TripCardEnhanced trip={trip} companyName={company?.name} showCompanyBadge={true} />
                   </div>
                 );
               })}
             </div>
           )}
        </section>

        {/* 4. Search and Filter Section */}
        <section id="trips-section" className="py-16 bg-gray-50/50">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="flex-1">
                <TripSearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                />
              </div>
              <TripFilters
                filters={filters}
                onFiltersChange={setFilters}
                destinations={destinations}
                companies={companies}
                priceRange={priceRange}
              />
            </div>

            {/* Results Count */}
            <div className="mb-6">
              <p className="text-gray-600">
                تم العثور على <span className="font-bold text-gray-900">{filteredTrips.length}</span> رحلة
              </p>
            </div>

            {/* Company Trips Sections */}
            {loading ? (
              <div className="space-y-12">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-6" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[1, 2, 3].map((j) => (
                        <TripCardSkeleton key={j} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredTrips.length === 0 ? (
              // Empty State
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
                  <Sparkles className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">لا توجد نتائج</h3>
                <p className="text-gray-600 mb-6">جرب تعديل الفلاتر أو البحث بكلمات مختلفة</p>
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => {
                    setSearchQuery("");
                    setFilters({});
                  }}
                >
                  مسح الفلاتر
                </Button>
              </div>
            ) : (
              <div className="space-y-12">
                {companies.map((company) => {
                  const companyTrips = getTripsByCompany(company.id);
                  if (companyTrips.length === 0) return null;
                  
                  return (
                    <CompanyTripsSection
                      key={company.id}
                      company={company}
                      trips={companyTrips}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* 5. Companies Overview Section */}
        <section id="companies-grid" className="py-16 container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
             <div>
               <h2 className="text-3xl font-bold text-gray-900 mb-2">شركاتنا المميزة</h2>
               <p className="text-gray-500">تصفح الشركات حسب التقييم والتخصص</p>
             </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse rounded-[20px]">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="h-16 w-16 bg-gray-200 rounded-2xl" />
                      <div className="h-6 w-16 bg-gray-200 rounded" />
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="flex gap-2">
                      <div className="h-6 w-16 bg-gray-200 rounded-lg" />
                      <div className="h-6 w-16 bg-gray-200 rounded-lg" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="h-10 bg-gray-200 rounded-xl" />
                      <div className="h-10 bg-gray-200 rounded-xl" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {companies.map((company) => (
                <CompanyCard key={company.id} {...company} />
              ))}
            </div>
          )}
        </section>

        {/* 6. Trust & Benefits Section */}
        <section className="py-16 bg-white border-y border-gray-100">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { icon: Users, title: "وصول لأكبر عدد", desc: "أكثر من 50 ألف مسافر شهرياً" },
                { icon: CheckCircle2, title: "شراكات موثوقة", desc: "نضمن جودة الشركات والخدمات" },
                { icon: BarChart3, title: "لوحة تحكم", desc: "إدارة حجوزاتك بسهولة تامة" },
                { icon: Award, title: "تسويق مجاني", desc: "نبرز خدماتك للمهتمين فقط" },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center text-center p-4">
                  <div className="h-12 w-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 mb-4">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. Advertise Your Company Section */}
        <section id="register-company" className="py-20 bg-[#F8FAFC]">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto bg-white rounded-[32px] shadow-2xl shadow-gray-200/50 overflow-hidden border border-gray-100 flex flex-col md:flex-row">
              
              {/* Left Side: Gradient Decoration */}
              <div className="hidden md:flex w-1/3 bg-gradient-to-br from-orange-400 to-orange-600 p-8 flex-col justify-between text-white relative overflow-hidden">
                <div className="relative z-10">
                   <div className="h-12 w-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
                     <Building2 className="h-6 w-6 text-white" />
                   </div>
                   <h3 className="text-2xl font-bold mb-2">هل أنت شركة سياحية؟</h3>
                   <p className="text-orange-100 leading-relaxed">
                     انضم إلينا اليوم واعرض رحلاتك لآلاف المسافرين الباحثين عن تجارب مميزة.
                   </p>
                </div>
                <div className="relative z-10 space-y-4">
                   <div className="flex items-center gap-3 text-sm font-medium text-orange-50">
                     <CheckCircle2 className="h-5 w-5" /> زيادة مبيعاتك
                   </div>
                   <div className="flex items-center gap-3 text-sm font-medium text-orange-50">
                     <CheckCircle2 className="h-5 w-5" /> سهولة التسجيل
                   </div>
                   <div className="flex items-center gap-3 text-sm font-medium text-orange-50">
                     <CheckCircle2 className="h-5 w-5" /> دعم فني متواصل
                   </div>
                </div>
                {/* Circles */}
                <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute bottom-[-20px] left-[-20px] w-32 h-32 bg-orange-300/20 rounded-full blur-2xl" />
              </div>

              {/* Right Side: Form */}
              <div className="flex-1 p-8 md:p-12">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">سجل اهتمامك الآن</h3>
                  <p className="text-gray-500">املأ النموذج وسنتواصل معك في أقرب وقت لتوثيق حسابك.</p>
                </div>

                <form className="space-y-5" onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const formData = new FormData(form);
                  const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
                  
                  // Simple loading state
                  const originalBtnText = submitBtn.innerHTML;
                  submitBtn.disabled = true;
                  submitBtn.innerHTML = '<span class="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></span> جاري الإرسال...';

                  const data = {
                    companyName: formData.get('companyName') as string,
                    email: formData.get('email') as string,
                    phone: formData.get('phone') as string,
                    whatsapp: formData.get('whatsapp') as string,
                    tripTypes: formData.get('tripTypes') as string,
                    message: formData.get('message') as string
                  };

                  try {
                    await corporateTripsService.submitCompanyRegistration(data);
                    alert('تم إرسال طلبك بنجاح! سنتواصل معك قريباً.');
                    form.reset();
                  } catch (error) {
                    console.error(error);
                    alert('حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.');
                  } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                  }
                }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                       <label className="text-sm font-medium text-gray-700">اسم الشركة</label>
                       <Input name="companyName" required placeholder="مثال: شركة المسافر" className="rounded-xl border-gray-200 focus-visible:ring-orange-500 h-10" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-medium text-gray-700">البريد الإلكتروني</label>
                       <Input name="email" type="email" required placeholder="contact@company.com" className="rounded-xl border-gray-200 focus-visible:ring-orange-500 h-10" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                       <label className="text-sm font-medium text-gray-700">رقم الهاتف</label>
                       <Input name="phone" required placeholder="01xxxxxxxxx" className="rounded-xl border-gray-200 focus-visible:ring-orange-500 h-10" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-medium text-gray-700">رقم الواتساب</label>
                       <Input name="whatsapp" required placeholder="01xxxxxxxxx" className="rounded-xl border-gray-200 focus-visible:ring-orange-500 h-10" />
                    </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-sm font-medium text-gray-700">نوع الرحلات التي تقدمها</label>
                     <Input name="tripTypes" required placeholder="مثال: رحلات بحرية، سفاري، تاريخية..." className="rounded-xl border-gray-200 focus-visible:ring-orange-500 h-10" />
                  </div>

                  <div className="space-y-2">
                     <label className="text-sm font-medium text-gray-700">رسالة قصيرة (اختياري)</label>
                     <Textarea name="message" placeholder="أضف أي تفاصيل أخرى تود إخبارنا بها..." className="rounded-xl border-gray-200 focus-visible:ring-orange-500 min-h-[100px]" />
                  </div>

                  <Button type="submit" className="w-full h-12 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-base shadow-lg shadow-orange-500/20 transition-all">
                     <Send className="h-4 w-4 ml-2" />
                     إرسال الطلب
                  </Button>
                </form>
              </div>

            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default CorporateTrips;
