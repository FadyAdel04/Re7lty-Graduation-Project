import { Button } from "@/components/ui/button";
import { MapPin, Globe, Compass } from "lucide-react";
import { Link } from "react-router-dom";

const DiscoverSection = () => {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      
      {/* Background Map Graphic (Pure CSS/SVG pattern) */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
         <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 0 L100 100 M100 0 L0 100" stroke="currentColor" strokeWidth="0.5" />
         </svg>
         <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] bg-no-repeat bg-center bg-cover opacity-20 grayscale"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
         <div className="bg-slate-900 rounded-3xl p-8 md:p-12 lg:p-16 text-white shadow-2xl relative overflow-hidden">
            
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-orange-500 rounded-full opacity-20 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-blue-500 rounded-full opacity-20 blur-3xl"></div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
               <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-orange-300 text-sm font-medium">
                    <Compass className="h-4 w-4 animate-spin-slow" />
                    <span>خرائط تفاعلية للرحلات</span>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-bold leading-tight">
                    تتبع خط سير رحلتك <br />
                    <span className="text-orange-400">خطوة بخطوة</span>
                  </h2>
                  <p className="text-gray-300 text-lg">
                    لا مزيد من التوهان! استعرض مسار رحلتك بالكامل على الخريطة التفاعلية. شاهد أماكن الزيارة، الفنادق، والمطاعم مرتبة حسب جدولك اليومي.
                  </p>
                  
                  <ul className="space-y-3 text-gray-400">
                     <li className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400"><MapPin className="h-4 w-4" /></div>
                        <span>عرض مسار الرحلة اليومي بوضوح</span>
                     </li>
                     <li className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400"><Globe className="h-4 w-4" /></div>
                        <span>استكشاف الأماكن القريبة من موقعك</span>
                     </li>
                  </ul>
               </div>

               <div className="relative h-[300px] md:h-[400px] bg-slate-800 rounded-2xl border border-white/10 overflow-hidden group shadow-inner">
                  {/* Fake Map UI */}
                  <div className="absolute inset-0 bg-[#1a1d24]">
                     {/* Map Grid Lines */}
                     <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(#2a2e36 1px, transparent 1px), linear-gradient(90deg, #2a2e36 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                     
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
                     <div className="hidden md:block absolute top-6 right-6 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 w-48 shadow-xl">
                        {/* Day 1 */}
                        <div className="text-xs text-gray-400 mb-2">اليوم الأول</div>
                        <div className="flex items-center gap-2 mb-2">
                           <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                           <span className="text-sm font-bold">الوصول للفندق</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                           <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                           <span className="text-sm font-bold">زيارة المتحف</span>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                           <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                           <span className="text-sm text-gray-400">العشاء</span>
                        </div>

                        {/* Day 2 */}
                        <div className="border-t border-white/10 pt-2 mb-2"></div>
                        <div className="text-xs text-gray-400 mb-2">اليوم الثاني</div>
                        <div className="flex items-center gap-2 mb-2">
                           <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                           <span className="text-sm font-bold">جولة بحرية</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                           <span className="text-sm font-bold">الغداء في الجزيرة</span>
                        </div>
                     </div>
                  </div>
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60"></div>
               </div>
            </div>

         </div>
      </div>
    </section>
  );
};


export default DiscoverSection;
