import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { 
  FileText, 
  ShieldCheck, 
  UserCheck, 
  Scale, 
  AlertCircle, 
  RefreshCcw,
  Zap,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Terms = () => {
  const sections = [
    {
      icon: Zap,
      title: "1. قبول الشروط",
      content: "من خلال الوصول إلى واستخدام منصة رحلتي، فإنك تقبل وتوافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي جزء من هذه الشروط، فيجب عليك عدم استخدام المنصة."
    },
    {
      icon: Scale,
      title: "2. استخدام المنصة",
      content: "يمكنك استخدام منصة رحلتي للأغراض القانونية فقط. أنت توافق على عدم استخدام المنصة لأي غرض غير قانوني، وعدم محاولة الوصول غير المصرح به، واحترام حقوق الملكية الفكرية للآخرين."
    },
    {
      icon: FileText,
      title: "3. ملكية المحتوى",
      content: "أنت تحتفظ بحقوق الملكية الفكرية للمحتوى الذي تنشره. من خلال نشره، فإنك تمنحنا ترخيصاً غير حصري لاستخدامه وعرضه لتمكين ميزات المنصة وتوفير تجربة أفضل للمستخدمين."
    },
    {
      icon: UserCheck,
      title: "4. مسؤولية الحساب",
      content: "أنت مسؤول عن الحفاظ على سرية معلومات حسابك. يجب عليك إبلاغنا فوراً عن أي استخدام غير مصرح به. نحن لسنا مسؤولين عن أي خسارة ناتجة عن عدم التزامك بهذا الالتزام."
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-sm font-black mb-6"
              >
                 <ShieldCheck className="w-4 h-4" />
                 السياسات القانونية
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">الشروط <span className="text-indigo-600">والأحكام</span></h1>
              <p className="text-gray-500 font-bold text-lg max-w-2xl mx-auto">
                 يرجى قراءة هذه الشروط بعناية قبل استخدام المنصة لضمان فهمك الكامل لحقوقك والتزاماتك.
              </p>
              <div className="mt-8 text-gray-400 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
                 <RefreshCcw className="w-3 h-3" />
                 آخر تحديث: 24 يناير 2026
              </div>
           </div>

           {/* Content Sections */}
           <div className="bg-white rounded-[3rem] p-8 md:p-16 shadow-2xl shadow-indigo-100 border border-indigo-50/50 space-y-12">
              <div className="grid grid-cols-1 gap-12">
                 {sections.map((section, idx) => (
                   <motion.section 
                     key={idx}
                     initial={{ opacity: 0, x: -20 }}
                     whileInView={{ opacity: 1, x: 0 }}
                     viewport={{ once: true }}
                     transition={{ delay: idx * 0.1 }}
                   >
                     <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
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

              {/* Legal Note Box */}
              <div className="bg-orange-50/50 rounded-3xl p-8 border border-orange-100 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100/50 rounded-full translate-x-12 -translate-y-12 blur-3xl" />
                 <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                       <AlertCircle className="w-6 h-6 text-orange-600" />
                       <h3 className="font-black text-gray-900 text-xl">تنبيه قانوني هام</h3>
                    </div>
                    <p className="text-orange-900/70 font-bold leading-relaxed">
                       نحن نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إشعارك بأي تغييرات جوهرية من خلال بريدك الإلكتروني أو عبر إخطار على المنصة.
                    </p>
                 </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-12 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-8">
                 <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    <span className="text-gray-500 font-black">أنا أوافق على كافة الشروط المذكورة</span>
                 </div>
                 <Button asChild className="h-14 px-8 rounded-2xl bg-indigo-600 text-white font-black text-lg gap-2">
                    <Link to="/">
                       متابعة الاستخدام
                       <ArrowRight className="w-4 h-4 rotate-180" />
                    </Link>
                 </Button>
              </div>
           </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;

