import { Button } from "@/components/ui/button";
import { Sparkles, Bot, ArrowRight, MessageSquare, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const AISection = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-gray-900 to-black text-white overflow-hidden relative">
      {/* Abstract Background Elements */}
      <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-10 right-10 w-72 h-72 bg-primary rounded-full mix-blend-screen filter blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-secondary rounded-full mix-blend-screen filter blur-[100px] animate-pulse" style={{ animationDelay: "2s" }}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          {/* Text Content */}
          <div className="flex-1 space-y-8 text-center lg:text-right">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-orange-200 text-sm font-medium animate-fade-in">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>مدعوم بالذكاء الاصطناعي</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              خطط لرحلة أحلامك <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">في ثوانٍ معدودة</span>
            </h2>
            
            <p className="text-gray-400 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto lg:mx-0">
              مساعدنا الذكي "رحلتي AI" جاهز لتصميم جدول سياحي متكامل خصيصاً لك. فقط أخبره بوجهتك وميزانيتك، واترك الباقي عليه.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/trip-assistant">
                <Button size="lg" className="h-14 px-8 rounded-full bg-gradient-to-r from-primary to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white font-bold text-lg shadow-[0_0_20px_rgba(249,115,22,0.5)] hover:shadow-[0_0_30px_rgba(249,115,22,0.7)] transition-all">
                  <Bot className="ml-2 h-5 w-5" />
                  جرب المساعد الذكي
                </Button>
              </Link>
              <Link to="/templates">
                 <Button variant="outline" size="lg" className="h-14 px-8 rounded-full border-white/20 text-white bg-white/10 hover:text-white backdrop-blur-sm">
                   استكشف النماذج الجاهزة
                 </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-white/10">
               <div className="flex flex-col items-center lg:items-start gap-2">
                 <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                   <MessageSquare className="h-6 w-6 text-secondary" />
                 </div>
                 <h3 className="font-semibold text-lg">محادثة طبيعية</h3>
                 <p className="text-sm text-gray-500">تحدث وكأنك مع خبير سياحي</p>
               </div>
               <div className="flex flex-col items-center lg:items-start gap-2">
                 <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                   <Zap className="h-6 w-6 text-primary" />
                 </div>
                 <h3 className="font-semibold text-lg">سرعة فائقة</h3>
                 <p className="text-sm text-gray-500">خطة كاملة في أقل من دقيقة</p>
               </div>
               <div className="flex flex-col items-center lg:items-start gap-2">
                 <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                   <Sparkles className="h-6 w-6 text-orange-400" />
                 </div>
                 <h3 className="font-semibold text-lg">تخصيص كامل</h3>
                 <p className="text-sm text-gray-500">يناسب ميزانيتك واهتماماتك</p>
               </div>
            </div>
          </div>

          {/* Visual Showcase */}
          <div className="flex-1 w-full max-w-lg lg:max-w-xl relative">
             <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                   {/* Chat UI Mockup */}
                   <div className="space-y-4">
                      <div className="flex items-start gap-3">
                         <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-white" />
                         </div>
                         <div className="bg-white/10 text-gray-200 rounded-2xl rounded-tr-none p-4 max-w-[85%] text-sm">
                            مرحباً! أنا مساعدك السياحي. كيف يمكنني مساعدتك اليوم؟ 🌍✈️
                         </div>
                      </div>

                      <div className="flex items-start gap-3 flex-row-reverse">
                         <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                            <span className="text-xs">You</span>
                         </div>
                         <div className="bg-secondary text-white rounded-2xl rounded-tl-none p-4 max-w-[85%] text-sm shadow-md">
                            أريد خطة لرحلة إلى دهب لمدة 3 أيام، ميزانية متوسطة، وأحب الغوص.
                         </div>
                      </div>

                      <div className="flex items-start gap-3">
                         <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center">
                           <div className="animate-pulse w-2 h-2 bg-white rounded-full"></div>
                         </div>
                         <div className="bg-white/10 text-gray-200 rounded-2xl rounded-tr-none p-4 max-w-[85%] text-sm">
                            <p className="mb-2">رائع! دهب وجهة ممتازة للغوص. إليك مقترح مبدئي:</p>
                            <ul className="list-disc list-inside space-y-1 text-gray-300">
                               <li><span className="text-secondary">اليوم 1:</span> الوصول + جولة في الممشى</li>
                               <li><span className="text-secondary">اليوم 2:</span> بلو هول (Blue Hole) 🤿</li>
                               <li><span className="text-secondary">اليوم 3:</span> ثري بولز + سفاري</li>
                            </ul>
                            <div className="mt-3 flex gap-2">
                               <span className="inline-block px-2 py-1 bg-white/10 rounded text-xs">#دهب</span>
                               <span className="inline-block px-2 py-1 bg-white/10 rounded text-xs">#غوص</span>
                               <span className="inline-block px-2 py-1 bg-white/10 rounded text-xs">#مغامرة</span>
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Floating Elements */}
                   <div className="absolute -top-6 -right-6 p-4 bg-gray-900 rounded-xl border border-white/10 shadow-xl animate-bounce" style={{ animationDuration: '3s' }}>
                      <div className="flex items-center gap-2">
                         <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                         <span className="text-xs font-bold text-white">متاح 24/7</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default AISection;
