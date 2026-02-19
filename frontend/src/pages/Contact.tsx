import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MapPin, Send, Loader2, MessageCircle, Sparkles, Globe } from "lucide-react";
import { complaintsService } from "@/services/complaintsService";
import { useAuth } from "@clerk/clerk-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { seasonalConfig } from "@/config/seasonalConfig";

const Contact = () => {
  const { toast } = useToast();
  const { getToken, isSignedIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSignedIn) {
      toast({
        title: "تنبيه",
        description: "يجب تسجيل الدخول لإرسال رسالة ولتلقي التحديثات والإشعارات.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      await complaintsService.submitComplaint(formData, token || undefined);
      
      toast({
        title: "تم الإرسال بنجاح ✅",
        description: "شكراً لتواصلك معنا. سنرد عليك في أقرب وقت ممكن.",
      });

      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.response?.data?.error || "فشل إرسال الرسالة. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("min-h-screen font-cairo text-right flex flex-col", seasonalConfig.isRamadanTheme ? "bg-navy-deep ramadan-theme-layer" : "bg-[#F8FAFC]")} dir="rtl">
      <Header />
      
      <main className="flex-1 py-20 px-4">
        <div className="container max-w-6xl mx-auto">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* 1. Contact Info Panel (4 cols) */}
            <div className="lg:col-span-4 space-y-8">
               <motion.div
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ duration: 0.6 }}
               >
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 text-orange-600 text-sm font-black mb-6">
                     <MessageCircle className="w-4 h-4" />
                     يسعدنا تواصلك معنا
                  </div>
                  <h1 className="text-4xl font-black text-gray-900 mb-6">دعنا ننتقل <br /> بالتواصل <span className="text-indigo-600">لآفاق جديدة</span></h1>
                  <p className="text-gray-500 font-bold leading-relaxed">
                     سواء كنت تملك فكرة لرحلة جديدة، أو واجهت مشكلة تقنية، فريقنا جاهز للإصغاء والمساعدة في أي وقت.
                  </p>
               </motion.div>

               <div className="space-y-4">
                  {[
                    { icon: Mail, label: "البريد الإلكتروني", value: "contact@re7lty.com", color: "text-blue-600", bg: "bg-blue-50" },
                    { icon: Phone, label: "الدعم الهاتفي", value: "+20 123 456 7890", color: "text-emerald-600", bg: "bg-emerald-50" },
                    { icon: MapPin, label: "المقر الرئيسي", value: "القاهرة، مصر", color: "text-orange-600", bg: "bg-orange-50" },
                  ].map((item, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + (idx * 0.1) }}
                    >
                       <Card className="border-0 shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-all group">
                          <CardContent className="p-6 flex items-center gap-4">
                             <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", item.bg, item.color)}>
                                <item.icon className="w-6 h-6" />
                             </div>
                             <div>
                                <h4 className="text-gray-400 text-xs font-black uppercase mb-1">{item.label}</h4>
                                <p className="text-gray-900 font-black">{item.value}</p>
                             </div>
                          </CardContent>
                       </Card>
                    </motion.div>
                  ))}
               </div>

               {/* Social Proof / Trust Badge */}
               <div className="bg-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full opacity-10">
                     <Sparkles className="absolute top-4 left-4 w-12 h-12" />
                     <Globe className="absolute bottom-[-10%] right-[-10%] w-24 h-24" />
                  </div>
                  <p className="text-indigo-100 font-bold text-sm mb-4 relative z-10">انضم لأكثر من 50,000 مسافر يثقون في منصتنا لاستكشاف العالم.</p>
                  <div className="flex -space-x-4 space-x-reverse relative z-10">
                     {[1,2,3,4].map(i => (
                       <div key={i} className="w-10 h-10 rounded-full border-2 border-indigo-900 bg-gray-200 overflow-hidden">
                          <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" />
                       </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* 2. Message Form Panel (8 cols) */}
            <motion.div 
              className="lg:col-span-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
               <Card className="border-0 shadow-2xl rounded-[3rem] bg-white overflow-hidden">
                  <CardContent className="p-8 md:p-16">
                     <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-3">
                              <Label htmlFor="name" className="text-gray-700 font-black mr-2">الاسم الكامل</Label>
                              <Input
                                 id="name"
                                 value={formData.name}
                                 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                 placeholder="أحمد محمد..."
                                 className="h-14 rounded-2xl bg-gray-50 border-0 focus-visible:ring-indigo-600 font-bold px-6"
                                 required
                              />
                           </div>
                           <div className="space-y-3">
                              <Label htmlFor="email" className="text-gray-700 font-black mr-2">البريد الإلكتروني</Label>
                              <Input
                                 id="email"
                                 type="email"
                                 value={formData.email}
                                 onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                 placeholder="example@re7lty.com"
                                 className="h-14 rounded-2xl bg-gray-50 border-0 focus-visible:ring-indigo-600 font-bold px-6 uppercase tracking-wider"
                                 required
                              />
                           </div>
                        </div>

                        <div className="space-y-3">
                           <Label htmlFor="subject" className="text-gray-700 font-black mr-2">موضوع الرسالة</Label>
                           <Input
                              id="subject"
                              value={formData.subject}
                              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                              placeholder="عن ماذا تود التحدث؟"
                              className="h-14 rounded-2xl bg-gray-50 border-0 focus-visible:ring-indigo-600 font-bold px-6"
                           />
                        </div>

                        <div className="space-y-3">
                           <Label htmlFor="message" className="text-gray-700 font-black mr-2">نص الرسالة</Label>
                           <Textarea
                              id="message"
                              value={formData.message}
                              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                              placeholder="اكتب تفاصيل استفسارك هنا..."
                              className="min-h-[200px] rounded-3xl bg-gray-50 border-0 focus-visible:ring-indigo-600 font-bold p-6 leading-relaxed"
                              required
                           />
                        </div>

                        <div className="pt-4">
                           <Button 
                              type="submit" 
                              className="h-16 px-12 rounded-2xl bg-indigo-600 text-white font-black text-xl gap-3 shadow-xl shadow-indigo-100 hover:scale-[1.02] transition-all w-full md:w-auto" 
                              disabled={loading}
                           >
                              {loading ? (
                                <>
                                   <Loader2 className="h-6 w-6 animate-spin" />
                                   جاري الإرسال...
                                </>
                              ) : (
                                <>
                                   إرسال الرسالة
                                   <Send className="h-5 w-5 rotate-180" />
                                </>
                              )}
                           </Button>
                        </div>

                        <div className="flex items-center gap-2 text-gray-400 text-xs font-bold pt-4 border-t border-gray-50">
                           <p>بالضغط على إرسال، أنت توافق على معالجة بياناتك وفقاً لـ <Link to="/privacy" className="text-indigo-600 hover:underline">سياسة الخصوصية</Link></p>
                        </div>
                     </form>
                  </CardContent>
               </Card>
            </motion.div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;

