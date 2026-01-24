import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  Database, 
  UserCircle, 
  Share2, 
  Settings2,
  RefreshCcw,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Privacy = () => {
  const sections = [
    {
      icon: Lock,
      title: "1. حماية بياناتك",
      content: "نحن نستخدم بروتوكولات تشفير (SSL) ومعايير أمان عالمية لحماية معلوماتك الشخصية من الوصول غير المصرح به. بياناتك مشفرة ومخزنة في خوادم آمنة."
    },
    {
      icon: Eye,
      title: "2. المعلومات التي نجمعها",
      content: "نجمع فقط المعلومات الضرورية لتجربتك: الاسم، البريد الإلكتروني، وتفاصيل الرحلات التي تشاركها. لا نجمع أي بيانات حساسة دون موافقتك الصريحة."
    },
    {
      icon: Database,
      title: "3. استخدام المعلومات",
      content: "تُستخدم بياناتك لتحسين اقتراحات الرحلات، وتخصيص تجربتك على المنصة، وللتواصل معك بخصوص تحديثات حسابك أو محتوى يهمك."
    },
    {
      icon: Share2,
      title: "4. مشاركة البيانات",
      content: "نحن لا نبيع بياناتك لأي طرف ثالث. قد نشارك معلومات محدودة مع شركاء الخدمة (مثل خدمات الخرائط) لتمكين وظائف المنصة الأساسية فقط."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-cairo text-right flex flex-col" dir="rtl">
      <Header />
      
      <main className="flex-1 py-20 px-4">
        <div className="container max-w-4xl mx-auto">
           {/* Header Area */}
           <div className="text-center mb-16">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-sm font-black mb-6"
              >
                 <ShieldCheck className="w-4 h-4" />
                 التزامنا بالخصوصية
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">سياسة <span className="text-emerald-600">الخصوصية</span></h1>
              <p className="text-gray-500 font-bold text-lg max-w-2xl mx-auto">
                 خصوصيتك هي أولويتنا القصوى. تعرف على كيفية تعاملنا مع بياناتك بكل شفافية وأمان.
              </p>
              <div className="mt-8 text-gray-400 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
                 <RefreshCcw className="w-3 h-3" />
                 آخر تحديث: 24 يناير 2026
              </div>
           </div>

           {/* Content Sections */}
           <div className="bg-white rounded-[3rem] p-8 md:p-16 shadow-2xl shadow-emerald-100/50 border border-emerald-50/50 space-y-12">
              <div className="grid grid-cols-1 gap-12">
                 {sections.map((section, idx) => (
                   <motion.section 
                     key={idx}
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     viewport={{ once: true }}
                     transition={{ delay: idx * 0.1 }}
                   >
                     <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
                           <section.icon className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900">{section.title}</h2>
                     </div>
                     <p className="text-gray-600 font-bold leading-relaxed text-lg pr-16 bg-gradient-to-l from-[#F8FAFC] to-transparent p-6 rounded-3xl">
                        {section.content}
                     </p>
                   </motion.section>
                 ))}
              </div>

              {/* Action Box */}
              <div className="bg-indigo-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-full opacity-10">
                    <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white rounded-full blur-3xl" />
                 </div>
                 <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-3">
                       <h3 className="text-2xl font-black">تحتاج لتفاصيل أكثر؟</h3>
                       <p className="text-indigo-100 font-bold opacity-80">يمكنك دائماً طلب نسخة من بياناتك أو طلب حذفها بالكامل.</p>
                    </div>
                    <Button asChild className="h-14 px-8 rounded-2xl bg-white text-indigo-900 hover:bg-indigo-50 font-black text-lg gap-2">
                       <Link to="/contact">تواصل مع مسؤول الأمان</Link>
                    </Button>
                 </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-12 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-8">
                 <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    <span className="text-gray-500 font-black">نحن نلتزم بحماية خصوصيتك دائماً</span>
                 </div>
                 <Button variant="ghost" asChild className="text-gray-400 font-black hover:bg-gray-50 hover:text-indigo-600">
                    <Link to="/">العودة للرئيسية</Link>
                 </Button>
              </div>
           </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;

