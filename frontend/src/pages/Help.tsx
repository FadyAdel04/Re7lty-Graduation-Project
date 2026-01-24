import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  Users, 
  MapPin, 
  Settings, 
  Shield, 
  Search, 
  ChevronDown, 
  PlayCircle,
  HelpCircle,
  ArrowRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const Help = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("getting-started");
  const observerRef = useRef<IntersectionObserver | null>(null);

  const sections = [
    {
      id: "getting-started",
      title: "البدء مع رحلتي",
      icon: MapPin,
      color: "text-blue-600",
      bg: "bg-blue-50",
      items: [
        { q: "كيف أقوم بإنشاء حساب جديد؟", a: "الأمر سهل للغاية! اضغط على 'تسجيل الدخول' في أعلى الصفحة، ثم اختر 'إنشاء حساب'. يمكنك استخدام بريدك الإلكتروني أو حساب Google لتسريع العملية." },
        { q: "كيف أبدأ في إضافة رحلتي الأولى؟", a: "بمجرد تسجيل الدخول، ستجد زر 'أنشئ رحلة' في القائمة العلوية. ابدأ بإضافة عنوان جذاب، صور رائعة، وخط سير رحلتك يوماً بيوم." }
      ]
    },
    {
      id: "features",
      title: "استخدام ميزات المنصة",
      icon: BookOpen,
      color: "text-orange-600",
      bg: "bg-orange-50",
      items: [
        { q: "كيف يمكنني تفعيل ميزة الذكاء الاصطناعي؟", a: "في صفحة إنشاء أو تعديل الرحلة، ستجد أيقونة 'مساعد الذكاء الاصطناعي'. يمكنه مساعدتك في اقتراح أنشطة أو تحسين وصف رحلتك." },
        { q: "ما هي القصص (Stories) وكيف أضيفها؟", a: "القصص هي طريقتنا لمشاركة اللحظات السريعة. يمكنك رفع صور أو فيديوهات قصيرة تظهر للمتابعين لمدة 24 ساعة فقط." }
      ]
    },
    {
      id: "profile",
      title: "إدارة الملف الشخصي",
      icon: Users,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      items: [
        { q: "كيف يمكنني الحصول على شارة الموثوقية؟", a: "شارات الموثوقية تمنح للأعضاء النشطين الذين نالت رحلاتهم تقييمات إيجابية مستمرة من خلال المجتمع." },
        { q: "هل يمكنني جعل رحلتي خاصة؟", a: "نعم، عند حفظ الرحلة يمكنك اختيار حالتها 'عامة' ليراها الجميع أو 'مسودة' لتبقى مرئية لك فقط حتى تقرر نشرها." }
      ]
    },
    {
      id: "privacy",
      title: "الخصوصية والأمان",
      icon: Shield,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      items: [
        { q: "كيف تحمون بياناتي الشخصية؟", a: "نحن نستخدم بروتوكولات تشفير متقدمة ولا نشارك بياناتك الحساسة مع أي جهات خارجية. يمكنك قراءة 'سياسة الخصوصية' لمزيد من التفاصيل." },
        { q: "كيف يمكنني الإبلاغ عن محتوى غير لائق؟", a: "في كل صفحة رحلة أو ملف شخصي، ستجد أيقونة 'إبلاغ'. فريقنا يراجع كافة البلاغات خلال 24 ساعة." }
      ]
    }
  ];

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: "-20% 0px -70% 0px",
      threshold: 0
    };

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    observerRef.current = new IntersectionObserver(handleIntersect, options);

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) {
        observerRef.current?.observe(element);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const filteredSections = sections.map(section => {
    const filteredItems = section.items.filter(item => 
      item.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.a.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return { ...section, items: filteredItems };
  }).filter(section => section.items.length > 0 || section.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-cairo text-right flex flex-col" dir="rtl">
      <Header />
      
      <main className="flex-1 pb-24">
        {/* 1. Interactive Help Hero */}
        <section className="bg-indigo-900 pt-24 pb-24 relative overflow-hidden">
           {/* Background Image */}
           <div className="absolute inset-0 z-0">
              <img 
                src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80" 
                alt="Help background" 
                className="w-full h-full object-cover opacity-20"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/60 to-indigo-900" />
           </div>

           <div className="absolute inset-0 z-1 pointer-events-none">
              <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-white/5 rounded-full blur-[120px]" />
              <div className="absolute bottom-[-10%] left-[-5%] w-64 h-64 bg-orange-400/10 rounded-full blur-[100px]" />
           </div>

           <div className="container mx-auto px-4 relative z-10 text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="text-4xl md:text-5xl font-black text-white mb-6">مركز <span className="text-orange-500">المساعدة</span></h1>
                <p className="text-indigo-100 text-lg font-bold max-w-2xl mx-auto mb-10 opacity-80">
                   ابحث عن إجابات سريعة لأسئلتك أو تصفح الأدلة التعليمية لاستخدام المنصة بأفضل شكل ممكن.
                </p>

                <div className="max-w-2xl mx-auto relative group">
                   <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none transition-colors group-focus-within:text-orange-500">
                      <Search className="w-6 h-6 text-gray-400" />
                   </div>
                   <Input 
                      className="h-16 pr-16 rounded-[2rem] bg-white border-0 shadow-2xl text-xl font-bold focus-visible:ring-orange-500 transition-all text-right"
                      placeholder="كيف يمكنني..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                   />
                </div>
              </motion.div>
           </div>
        </section>

        {/* 2. Categorized Help Sections */}
        <section className="container mx-auto px-4 pt-12 relative z-20">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              
              {/* Sidebar Navigation (Desktop) */}
              <div className="hidden lg:block lg:col-span-3 space-y-2 sticky top-24 h-fit">
                 <h3 className="text-gray-400 font-black text-xs uppercase px-4 mb-4">الأقسام</h3>
                 {sections.map((s) => (
                   <a 
                     key={s.id} 
                     href={`#${s.id}`}
                     className={cn(
                       "flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all group",
                       activeSection === s.id 
                         ? "bg-white text-indigo-600 shadow-md translate-x-1" 
                         : "text-gray-600 hover:bg-white hover:text-indigo-600 hover:shadow-md"
                     )}
                   >
                     <s.icon className={cn("w-5 h-5", s.color)} />
                     {s.title}
                   </a>
                 ))}
                 
                 <div className="mt-8 p-6 bg-orange-50 rounded-[2rem] border border-orange-100">
                    <HelpCircle className="w-8 h-8 text-orange-600 mb-4" />
                    <h4 className="font-black text-gray-900 mb-2">ما زلت بحاجة للمساعدة؟</h4>
                    <p className="text-gray-500 text-xs font-bold leading-relaxed mb-4">فريقنا متاح دائماً للرد على أسئلتك الأكثر تخصصاً.</p>
                    <a href="/contact" className="text-orange-600 font-black text-xs flex items-center gap-1 hover:gap-2 transition-all">
                       تواصل معنا
                       <ArrowRight className="w-3 h-3 rotate-180" />
                    </a>
                 </div>
              </div>

              {/* Main Content Areas */}
              <div className="lg:col-span-9 space-y-16">
                 {filteredSections.length > 0 ? filteredSections.map((section, sIdx) => (
                   <div key={section.id} id={section.id} className="scroll-mt-24">
                      <div className="flex items-center gap-4 mb-8">
                         <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg", section.bg, section.color)}>
                            <section.icon className="w-7 h-7" />
                         </div>
                         <h2 className="text-2xl font-black text-gray-900">{section.title}</h2>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                         {section.items.map((item, iIdx) => (
                           <Card key={iIdx} className="border-0 shadow-lg rounded-[2rem] overflow-hidden group hover:shadow-indigo-100 transition-all duration-500">
                              <CardContent className="p-0">
                                 <details className="w-full group" open={searchQuery.length > 0}>
                                    <summary className="list-none cursor-pointer p-8 flex items-center justify-between gap-4">
                                       <h4 className="text-lg font-black text-gray-800 group-open:text-indigo-600 transition-colors">{item.q}</h4>
                                       <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                                          <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
                                       </div>
                                    </summary>
                                    <div className="px-8 pb-8 pt-0 border-t border-gray-50">
                                       <p className="text-gray-500 font-bold leading-relaxed mt-6">
                                          {item.a}
                                       </p>
                                       <div className="mt-8 flex gap-4">
                                          <button className="text-xs font-black text-gray-400 hover:text-emerald-500 flex items-center gap-1 transition-colors">
                                             <span className="text-lg">👍</span> هل كان ذلك مفيداً؟
                                          </button>
                                       </div>
                                    </div>
                                 </details>
                              </CardContent>
                           </Card>
                         ))}
                      </div>
                   </div>
                 )) : (
                   <div className="text-center py-20">
                     <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                     <h3 className="text-xl font-black text-gray-900">لا توجد نتائج بحث تطابق استفسارك</h3>
                     <p className="text-gray-500 font-bold">حاول استخدام كلمات مفتاحية أخرى أو تصفح الأقسام.</p>
                   </div>
                 )}

                 {/* Video Guides Section */}
                 {!searchQuery && (
                   <div className="pt-8">
                      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[3rem] p-10 md:p-16 text-white relative overflow-hidden">
                         <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/2 translate-x-1/2 blur-3xl" />
                         
                         <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                            <div className="flex-1 space-y-6">
                               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-black uppercase">دروس تعليمية</div>
                               <h2 className="text-3xl md:text-5xl font-black leading-tight">شاهد كيف تبدأ <br /> <span className="text-orange-400">رحلتك الأولى</span></h2>
                               <p className="text-indigo-100 font-bold opacity-80">فيديوهات قصيرة تشرح لك كل ميزة في المنصة خطوة بخطوة.</p>
                               <button className="flex items-center gap-3 font-black text-lg group">
                                  <PlayCircle className="w-12 h-12 group-hover:scale-110 transition-transform" />
                                  مشاهدة الدليل الكامل
                               </button>
                            </div>
                            <div className="w-full md:w-1/2 aspect-video bg-black/20 backdrop-blur-xl rounded-3xl border border-white/10 flex items-center justify-center group cursor-pointer hover:bg-black/30 transition-all">
                               <PlayCircle className="w-20 h-20 text-white/50 group-hover:text-white transition-colors" />
                            </div>
                         </div>
                      </div>
                   </div>
                 )}
              </div>
           </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Help;

