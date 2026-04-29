import { Button } from "@/components/ui/button";
import { MapPin, Globe, Compass } from "lucide-react";
import { Link } from "react-router-dom";

const DiscoverSection = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      
      {/* Background Map Graphic (Pure CSS/SVG pattern) */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none dark:opacity-[0.07]">
         <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 0 L100 100 M100 0 L0 100" stroke="currentColor" strokeWidth="0.5" />
         </svg>
         <div className="absolute inset-0 bg-[url('/assets/world-map.svg')] bg-no-repeat bg-center bg-cover opacity-20 grayscale"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
         <div className="bg-card rounded-3xl p-8 md:p-12 lg:p-16 text-foreground shadow-2xl relative overflow-hidden border border-border">
            
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-primary rounded-full opacity-20 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-secondary rounded-full opacity-20 blur-3xl"></div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
               <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    <Compass className="h-4 w-4 animate-spin-slow" />
                    <span>خرائط تفاعلية للرحلات</span>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-bold leading-tight">
                    تتبع خط سير رحلتك <br />
                    <span className="text-primary">خطوة بخطوة</span>
                  </h2>
                  <p className="text-muted-foreground text-lg">
                    لا مزيد من التوهان! استعرض مسار رحلتك بالكامل على الخريطة التفاعلية. شاهد أماكن الزيارة، الفنادق، والمطاعم مرتبة حسب جدولك اليومي.
                  </p>
                  
                  <ul className="space-y-3 text-muted-foreground">
                     <li className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary"><MapPin className="h-4 w-4" /></div>
                        <span>عرض مسار الرحلة اليومي بوضوح</span>
                     </li>
                     <li className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary"><Globe className="h-4 w-4" /></div>
                        <span>استكشاف الأماكن القريبة من موقعك</span>
                     </li>
                  </ul>
               </div>

               <div className="relative h-[300px] md:h-[400px] bg-slate-950 rounded-2xl border border-border overflow-hidden group shadow-inner">
                  {/* Fake Map UI */}
                  <div className="absolute inset-0 bg-[#0d0f14]">
                     {/* Map Grid Lines */}
                     <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(#1a1d24 1px, transparent 1px), linear-gradient(90deg, #1a1d24 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                     
                     {/* Route Path (SVG) */}
                     <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        {/* Day 1 Path (Orange) */}
                        <path d="M100 250 Q 150 150 250 100 T 350 200" fill="none" stroke="#f97316" strokeWidth="4" strokeDasharray="8 4" className="animate-pulse" />
                        
                        {/* Day 2 Path (Blue) - Connected to Day 1 end */}
                        <path d="M350 200 Q 400 250 300 300 T 150 320" fill="none" stroke="#3b82f6" strokeWidth="4" strokeDasharray="8 4" className="animate-pulse" style={{ animationDelay: '1s' }} />
                     </svg>

                     {/* Pins along route - Day 1 */}
                     <div className="absolute top-[250px] left-[100px] w-4 h-4 bg-white rounded-full border-4 border-orange-500 shadow-lg transform -translate-x-1/2 -translate-y-1/2 z-10"></div>
                     <div className="absolute top-[100px] left-[250px] w-4 h-4 bg-white rounded-full border-4 border-orange-500 shadow-lg transform -translate-x-1/2 -translate-y-1/2 z-10"></div>
                     <div className="absolute top-[200px] left-[350px]">
                        <MapPin className="h-8 w-8 text-orange-500 -mt-8 -ml-4 drop-shadow-lg" />
                     </div>

                     {/* Pins along route - Day 2 */}
                     <div className="absolute top-[300px] left-[300px] w-4 h-4 bg-white rounded-full border-4 border-blue-500 shadow-lg transform -translate-x-1/2 -translate-y-1/2 z-10"></div>
                     <div className="absolute top-[320px] left-[150px]">
                        <MapPin className="h-8 w-8 text-blue-500 -mt-8 -ml-4 drop-shadow-lg animate-bounce" style={{ animationDelay: '1s' }} />
                     </div>

                     {/* Floating Itinerary Card */}
                     <div className="hidden md:block absolute top-6 right-6 bg-background/40 backdrop-blur-md p-3 rounded-xl border border-border w-48 shadow-xl">
                        {/* Day 1 */}
                        <div className="text-[10px] text-muted-foreground mb-2">اليوم الأول</div>
                        <div className="flex items-center gap-2 mb-2">
                           <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                           <span className="text-xs font-bold">الوصول للفندق</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                           <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                           <span className="text-xs font-bold">زيارة المتحف</span>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                           <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                           <span className="text-xs text-muted-foreground">العشاء</span>
                        </div>

                        {/* Day 2 */}
                        <div className="border-t border-border pt-2 mb-2"></div>
                        <div className="text-[10px] text-muted-foreground mb-2">اليوم الثاني</div>
                        <div className="flex items-center gap-2 mb-2">
                           <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                           <span className="text-xs font-bold">جولة بحرية</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                           <span className="text-xs font-bold">الغداء في الجزيرة</span>
                        </div>
                     </div>
                  </div>
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60"></div>
               </div>
            </div>

         </div>
      </div>
    </section>
  );
};


export default DiscoverSection;
