import { useState } from "react";
import { Star, MapPin, Building2, Phone, ArrowUpRight, CheckCircle2, Award, Users, BarChart3, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TripCard from "@/components/TripCard";

// Mock Data
const companies = [
  {
    id: 1,
    name: "سفاري ترافيل",
    logo: "ST",
    description: "متخصصون في رحلات السفاري والمغامرات الصحراوية في جميع أنحاء المملكة.",
    rating: 4.8,
    tripsCount: 12,
    tags: ["سفاري", "مغامرات", "تخييم"],
    color: "from-orange-400 to-red-500"
  },
  {
    id: 2,
    name: "بلو ويف للسياحة",
    logo: "BW",
    description: "رحلات بحرية فاخرة، غوص، وأنشطة مائية في البحر الأحمر.",
    rating: 4.9,
    tripsCount: 8,
    tags: ["بحرية", "غوص", "يخوت"],
    color: "from-blue-400 to-cyan-500"
  },
  {
    id: 3,
    name: "قمم الجبال",
    logo: "QM",
    description: "نأخذك إلى أعلى القمم، رحلات هايكنج وتسلق للمحترفين والمبتدئين.",
    rating: 4.7,
    tripsCount: 15,
    tags: ["هايكنج", "تسلق", "طبيعة"],
    color: "from-green-400 to-emerald-600"
  },
  {
    id: 4,
    name: "التراث العريق",
    logo: "TT",
    description: "جولات ثقافية وتاريخية لاستكشاف المعالم الأثرية والأسواق القديمة.",
    rating: 4.6,
    tripsCount: 20,
    tags: ["تراث", "ثقافة", "تاريخ"],
    color: "from-amber-400 to-yellow-600"
  },
  {
    id: 5,
    name: "سكاي تورز",
    logo: "ST",
    description: "حجوزات طيران وفنادق ورحلات VIP لرجال الأعمال والعائلات.",
    rating: 4.5,
    tripsCount: 30,
    tags: ["VIP", "فنادق", "طيران"],
    color: "from-purple-400 to-indigo-600"
  },
  {
    id: 6,
    name: "رحلات النخبة",
    logo: "NE",
    description: "تنظيم رحلات جماعية للشركات والمؤسسات ببرامج مخصصة.",
    rating: 4.9,
    tripsCount: 5,
    tags: ["شركات", "مجموعات", "فعاليات"],
    color: "from-slate-400 to-gray-600"
  }
];

const featuredTrips = [
  {
    id: "trip-c1",
    title: "مخيم النجوم الصحراوي VIP",
    destination: "العلا",
    duration: "3 أيام",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1545199616-5e589098ac4c?auto=format&fit=crop&q=80&w=1000",
    author: "سفاري ترافيل",
    likes: 342,
    price: "2500 ر.س"
  },
  {
    id: "trip-c2",
    title: "رحلة اليخت الفاخر - البحر الأحمر",
    destination: "جدة",
    duration: "يوم كامل",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&q=80&w=1000",
    author: "بلو ويف للسياحة",
    likes: 215,
    price: "1800 ر.س"
  },
  {
    id: "trip-c3",
    title: "قمم السودة - هايكنج المترفين",
    destination: "أبها",
    duration: "يومين",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1000",
    author: "قمم الجبال",
    likes: 189,
    price: "950 ر.س"
  },
  {
    id: "trip-c4",
    title: "جولة الدرعية التاريخية",
    destination: "الرياض",
    duration: "5 ساعات",
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1588661783303-6251b54c8675?auto=format&fit=crop&q=80&w=1000",
    author: "التراث العريق",
    likes: 450,
    price: "350 ر.س"
  }
];

const CorporateTrips = () => {
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
              رحلات <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">الشركات</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              اكتشف رحلات استثنائية مقدمة من أفضل شركات السياحة الموثوقة. تواصل معهم مباشرة واحجز رحلتك القادمة بكل سهولة.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="rounded-full px-8 h-12 text-base bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/20 w-full sm:w-auto" onClick={() => document.getElementById('companies-grid')?.scrollIntoView({ behavior: 'smooth' })}>
                استعرض الشركات
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
          <div className="flex overflow-hidden group space-x-16" dir="ltr"> {/* Force LTR for correct marquee physics/visuals to keep it simple, or manage RTL carefully */}
            {/* First Set */}
            <div className="flex animate-marquee space-x-16 min-w-full shrink-0 items-center justify-around px-8">
              {companies.map((company, index) => (
                <div key={`${company.id}-1`} className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0 cursor-pointer">
                   <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${company.color} flex items-center justify-center text-white font-bold text-xs shadow-sm`}>
                      {company.logo}
                   </div>
                   <span className="font-bold text-lg text-gray-700">{company.name}</span>
                </div>
              ))}
            </div>
            {/* Second Set (Duplicate) */}
            <div className="flex animate-marquee space-x-16 min-w-full shrink-0 items-center justify-around px-8">
              {companies.map((company, index) => (
                <div key={`${company.id}-2`} className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0 cursor-pointer">
                   <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${company.color} flex items-center justify-center text-white font-bold text-xs shadow-sm`}>
                      {company.logo}
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
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             {featuredTrips.map((trip) => (
               <div key={trip.id} className="relative group">
                 <TripCard {...trip} />
                 <div className="absolute top-3 left-3 z-10">
                   <Badge className="bg-orange-500 hover:bg-orange-600 border-0 shadow-lg shadow-orange-500/20 text-white">
                      رحلة شركة
                   </Badge>
                 </div>
               </div>
             ))}
           </div>
        </section>

        {/* 4. Companies Overview Section */}
        <section id="companies-grid" className="py-16 container mx-auto px-4 bg-gray-50/50 rounded-3xl my-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
             <div>
               <h2 className="text-3xl font-bold text-gray-900 mb-2">شركاتنا المميزة</h2>
               <p className="text-gray-500">تصفح الشركات حسب التقييم والتخصص</p>
             </div>
             <div className="flex gap-2">
                {/* Placeholder for future filters */}
                <Button variant="ghost" size="sm" className="text-gray-500">تصفية النتائج</Button>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
              <Card key={company.id} className="group border-gray-100 hover:border-orange-100 hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-300 rounded-[20px] overflow-hidden bg-white">
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${company.color} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                      {company.logo}
                    </div>
                    <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-100 gap-1">
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      {company.rating}
                    </Badge>
                  </div>

                  {/* Info */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                    {company.name}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-4 min-h-[40px]">
                    {company.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {company.tags.map((tag) => (
                      <span key={tag} className="px-2.5 py-1 rounded-lg bg-gray-50 text-xs font-medium text-gray-600 border border-gray-100">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3 mt-auto">
                    <Button variant="outline" className="w-full rounded-xl border-gray-200 hover:bg-gray-50 hover:text-orange-600 hover:border-orange-200 group/btn">
                      عروض رحلاتنا
                      <ArrowUpRight className="h-4 w-4 mr-2 transition-transform group-hover/btn:-translate-y-0.5 group-hover/btn:-translate-x-0.5" />
                    </Button>
                    <Button className="w-full rounded-xl bg-gray-900 text-white hover:bg-orange-600 transition-colors">
                      <Phone className="h-4 w-4 ml-2" />
                      تواصل
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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

        {/* 5. Advertise Your Company Section */}
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

                <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                       <label className="text-sm font-medium text-gray-700">اسم الشركة</label>
                       <Input placeholder="مثال: شركة المسافر" className="rounded-xl border-gray-200 focus-visible:ring-orange-500 h-10" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-medium text-gray-700">البريد الإلكتروني</label>
                       <Input type="email" placeholder="contact@company.com" className="rounded-xl border-gray-200 focus-visible:ring-orange-500 h-10" />
                    </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-sm font-medium text-gray-700">رقم الهاتف / واتساب</label>
                     <Input placeholder="+966 50 000 0000" className="rounded-xl border-gray-200 focus-visible:ring-orange-500 h-10" />
                  </div>

                  <div className="space-y-2">
                     <label className="text-sm font-medium text-gray-700">نوع الرحلات التي تقدمها</label>
                     <Input placeholder="مثال: رحلات بحرية، سفاري، تاريخية..." className="rounded-xl border-gray-200 focus-visible:ring-orange-500 h-10" />
                  </div>

                  <div className="space-y-2">
                     <label className="text-sm font-medium text-gray-700">رسالة قصيرة (اختياري)</label>
                     <Textarea placeholder="أضف أي تفاصيل أخرى تود إخبارنا بها..." className="rounded-xl border-gray-200 focus-visible:ring-orange-500 min-h-[100px]" />
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
