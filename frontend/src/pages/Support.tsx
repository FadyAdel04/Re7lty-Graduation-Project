import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { 
  HelpCircle, 
  MessageSquare, 
  Mail, 
  Phone, 
  ShieldCheck, 
  FileText, 
  ChevronRight, 
  LifeBuoy,
  Globe,
  Sparkles,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { seasonalConfig } from "@/config/seasonalConfig";

const Support = () => {
  const categories = [
    {
      title: "مركز المساعدة",
      desc: "دليل كامل لاستخدام المنصة وإجابات للأسئلة الشائعة",
      icon: LifeBuoy,
      link: "/help",
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      title: "اتصل بنا",
      desc: "تواصل مع فريقنا مباشرة للحصول على مساعدة شخصية",
      icon: MessageSquare,
      link: "/contact",
      color: "text-orange-600",
      bg: "bg-orange-50"
    },
    {
      title: "الشروط والأحكام",
      desc: "القواعد والسياسات التي تحكم استخدامك لخدماتنا",
      icon: FileText,
      link: "/terms",
      color: "text-indigo-600",
      bg: "bg-indigo-50"
    },
    {
      title: "سياسة الخصوصية",
      desc: "كيف نحمي بياناتك ونحافظ على سرية معلوماتك",
      icon: ShieldCheck,
      link: "/privacy",
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-cairo text-right flex flex-col" dir="rtl">
      <Header />
      
      <main className={cn("flex-1", seasonalConfig.isRamadanTheme && "ramadan-golden-frame m-4 md:m-8")}>
        {/* 1. Cinematic Hero Header */}
        <section className="relative h-[400px] w-full overflow-hidden bg-indigo-900">
           <div className="absolute inset-0 z-0">
              <img 
                src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&q=80" 
                alt="Travel Support" 
                className="w-full h-full object-cover opacity-30 mix-blend-overlay scale-110" 
              />
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/40 via-indigo-900/80 to-[#F8FAFC]" />
           </div>
           
           <div className="container mx-auto px-4 relative z-10 h-full flex flex-col items-center justify-center text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-indigo-100 text-sm font-black mb-6 border border-white/10">
                   <Sparkles className="w-4 h-4 text-orange-400" />
                   مركز دعم رحلتي
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
                   كيف يمكننا <span className="text-orange-500">مساعدتك</span> اليوم؟
                </h1>
                <p className="text-indigo-100 text-xl font-bold max-w-2xl mx-auto opacity-90">
                   نحن هنا لضمان أن تكون رحلتك القادمة سلسة وممتعة. ابحث عن الإجابات أو تواصل معنا مباشرة.
                </p>
              </motion.div>
           </div>
        </section>

        {/* 2. Quick Links Grid */}
        <section className="container mx-auto px-4 -mt-20 relative z-20 pb-20">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((cat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                >
                  <Link to={cat.link}>
                    <Card className="border-0 shadow-2xl rounded-[2.5rem] bg-white hover:shadow-indigo-100 hover:-translate-y-2 transition-all duration-500 group overflow-hidden h-full">
                       <CardContent className="p-8 flex flex-col h-full">
                          <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center mb-6 transition-colors duration-500", cat.bg, cat.color)}>
                             <cat.icon className="w-8 h-8" />
                          </div>
                          <h3 className="text-xl font-black text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">{cat.title}</h3>
                          <p className="text-gray-500 font-bold text-sm leading-relaxed flex-1">
                             {cat.desc}
                          </p>
                          <div className="mt-6 flex items-center text-indigo-600 font-black text-sm gap-1 group-hover:gap-2 transition-all">
                             اكتشف المزيد
                             <ArrowLeft className="w-4 h-4" />
                          </div>
                       </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
           </div>

           {/* 3. Contact Methods Section */}
           <div className="mt-24">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
                 <div>
                    <h2 className="text-3xl font-black text-gray-900 mb-2">طرق تواصل إضافية</h2>
                    <p className="text-gray-500 font-bold">فريقنا متواجد دائماً للرد على استفساراتك</p>
                 </div>
                 <Button asChild className="h-14 px-8 rounded-2xl bg-indigo-600 text-white font-black text-lg gap-2 shadow-xl shadow-indigo-100">
                    <Link to="/contact">تواصل معنا الآن</Link>
                 </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 {[
                   { icon: Mail, title: "البريد الإلكتروني", value: "support@re7lty.com", detail: "رد خلال 24 ساعة", color: "text-blue-500" },
                   { icon: Phone, title: "الدعم الهاتفي", value: "+20 123 456 7890", detail: "9 ص - 6 م (الأحد-الخميس)", color: "text-emerald-500" },
                   { icon: Globe, title: "المقر الرئيسي", value: " الاسكندرية , مصر", detail: " سموحة", color: "text-orange-500" },
                 ].map((item, i) => (
                   <Card key={i} className="border-0 shadow-lg rounded-3xl bg-white p-6 hover:bg-indigo-50/30 transition-colors">
                      <CardContent className="p-0 flex items-start gap-6">
                         <div className={cn("w-14 h-14 rounded-2xl bg-white shadow-md flex items-center justify-center shrink-0", item.color)}>
                            <item.icon className="w-6 h-6" />
                         </div>
                         <div className="space-y-1">
                            <h4 className="text-gray-400 text-xs font-black uppercase">{item.title}</h4>
                            <p className="text-lg font-black text-gray-900">{item.value}</p>
                            <p className="text-gray-500 text-sm font-bold">{item.detail}</p>
                         </div>
                      </CardContent>
                   </Card>
                 ))}
              </div>
           </div>

           {/* 4. FAQ Snippet */}
           <div className="mt-24 bg-white rounded-[3rem] p-10 md:p-20 shadow-xl border border-gray-100 overflow-hidden relative">
              <div className="absolute top-[-20%] left-[-10%] w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50" />
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                 <div>
                    <span className="text-orange-600 font-black text-sm uppercase tracking-widest mb-4 block">الأسئلة الشائعة</span>
                    <h2 className="text-4xl font-black text-gray-900 mb-8 leading-tight">لديك سؤال سريع؟ <br /> اطلع على <span className="text-indigo-600">الأجوبة</span></h2>
                    
                    <div className="space-y-6">
                       {[
                         { q: "كيف يمكنني البدء في إنشاء رحلتي الأولى؟", a: "الأمر بسيط! انقر على زر 'أنشئ رحلة' في القائمة العلوية واتبع الخطوات السهلة لإضافة تفاصيل مغامرتك." },
                         { q: "هل بياناتي الشخصية آمنة على رحلتي؟", a: "بالتأكيد، نحن نستخدم أحدث تقنيات التشفير ونتبع معايير أمان صارمة لحماية معلوماتك وخصوصيتك." },
                         { q: "كيف يمكنني تعديل رحلة قمت بنشرها بالفعل؟", a: "من صفحة 'رحلاتي' أو صفحة الرحلة نفسها، انقر على زر 'تعديل' وستتمكن من إضافة أو حذف أي معلومة." }
                       ].map((faq, i) => (
                         <div key={i} className="space-y-2 group">
                            <h4 className="text-lg font-black text-gray-900 flex items-center gap-3">
                               <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
                               {faq.q}
                            </h4>
                            <p className="text-gray-500 font-bold leading-relaxed pr-5">{faq.a}</p>
                         </div>
                       ))}
                    </div>

                    <div className="mt-10">
                       <Button variant="link" asChild className="text-indigo-600 font-black p-0 h-auto text-lg gap-2 group">
                          <Link to="/help">
                             عرض كل الأسئلة الشائعة 
                             <ArrowLeft className="w-5 h-5 group-hover:gap-3 transition-all" />
                          </Link>
                       </Button>
                    </div>
                 </div>
                 
                 <div className="hidden lg:block relative">
                    <img 
                      src="https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80" 
                      className="rounded-[3rem] shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-700" 
                      alt="Travelers chatting" 
                    />
                    <div className="absolute bottom-[-20px] right-[-20px] bg-white p-6 rounded-3xl shadow-2xl border border-gray-100 max-w-xs">
                       <div className="flex items-center gap-4 mb-3">
                          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-black">؟</div>
                          <span className="font-black text-gray-900">نحن هنا دائماً</span>
                       </div>
                       <p className="text-gray-500 text-xs font-bold leading-relaxed">فريق الدعم متاح للرد على أي استفسارات تقنية أو عامة تواجهها أثناء استخدامك للمنصة.</p>
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

export default Support;

