import { Button } from "@/components/ui/button";
import { ArrowLeft, Send, MapPin, User } from "lucide-react";
import { Link } from "react-router-dom";

import image1 from "../../assets/best1.webp";
import image2 from "../../assets/best2.jpg";
import image3 from "../../assets/best3.jpg";

const DiscoverUsersTripsSection = () => {
  // Mock data for the visual collage
  const collageItems = [
    { id: 1, image: image1, title: "غروب الاقصر ", user: "علي", color: "bg-orange-500", rotation: "-rotate-6" },
    { id: 2, image: image2, title: "سحر الاسكندرية", user: "نور", color: "bg-blue-500", rotation: "rotate-3" },
    { id: 3, image: image3, title: "جمال دهب", user: "كريم", color: "bg-teal-500", rotation: "-rotate-3" },
  ];

  return (
    <section className="py-16 md:py-24 bg-white relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-60 h-60 md:w-80 md:h-80 rounded-full bg-orange-100 blur-3xl opacity-60"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-60 h-60 md:w-80 md:h-80 rounded-full bg-blue-100 blur-3xl opacity-60"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          
          {/* Content Side */}
          <div className="flex-1 text-center lg:text-right space-y-6 md:space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 text-orange-600 border border-orange-100 text-sm font-bold">
              <Send className="h-4 w-4 transform -rotate-45 mb-1" />
              <span>مجتمع المسافرين النشط</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-gray-900 leading-tight">
              عيش التجربة <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-l from-orange-600 to-amber-500">
                بعيون الآخرين
              </span>
            </h2>
            
            <p className="text-gray-500 text-base md:text-xl leading-relaxed max-w-lg mx-auto lg:mx-0">
              تصفح يوميات وتجارب آلاف المسافرين الحقيقية. استكشف الوجهات الخفية، اقرأ النصائح الصادقة، وشاركنا مغامرتك الخاصة.
            </p>

            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
               <Link to="/timeline">
                 <Button className="h-12 md:h-14 px-6 md:px-8 rounded-full bg-gray-900 text-white hover:bg-black shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-base md:text-lg">
                   تصفح يوميات السفر
                   <ArrowLeft className="mr-2 h-5 w-5" />
                 </Button>
               </Link>
            </div>
            
            <div className="pt-8 border-t border-gray-100 flex items-center justify-center lg:justify-start gap-8">
               <div className="text-center">
                 <div className="text-2xl md:text-3xl font-black text-gray-900">+5000</div>
                 <div className="text-sm text-gray-500">رحلة موثقة</div>
               </div>
               <div className="w-px h-12 bg-gray-200"></div>
               <div className="text-center">
                 <div className="text-2xl md:text-3xl font-black text-gray-900">+10K</div>
                 <div className="text-sm text-gray-500">صورة ومقطع</div>
               </div>
            </div>
          </div>

          {/* Visual Collage Side */}
          <div className="flex-1 w-full relative h-[400px] md:h-[500px] flex items-center justify-center mt-8 lg:mt-0">
            {/* The "Orbit" Effect Canvas - Scaled down on mobile */}
            <div className="relative w-full h-full max-w-[500px] transform scale-75 sm:scale-90 md:scale-100 transition-transform duration-300">
               {collageItems.map((item, index) => (
                 <div 
                    key={item.id}
                    className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 md:w-72 bg-white p-3 rounded-2xl shadow-xl transition-all duration-500 hover:z-50 hover:scale-105 cursor-pointer border border-gray-100 ${item.rotation}`}
                    style={{ 
                      marginTop: index === 0 ? '-100px' : index === 1 ? '50px' : '120px',
                      marginLeft: index === 0 ? '-100px' : index === 1 ? '80px' : '-80px',
                      zIndex: index
                    }}
                 >
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-3 group">
                       <img 
                        src={item.image} 
                        alt={item.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        loading="lazy"
                        width="300"
                        height="225"
                        decoding="async"
                       />
                       <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> مصر
                       </div>
                    </div>
                    <div className="flex items-center justify-between">
                       <div>
                          <h4 className="font-bold text-gray-900 text-sm">{item.title}</h4>
                          <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><User className="h-3 w-3" /> {item.user}</span>
                       </div>
                       <div className={`w-8 h-8 rounded-full ${item.color} flex items-center justify-center text-white`}>
                          <ArrowLeft className="h-4 w-4" />
                       </div>
                    </div>
                 </div>
               ))}
               
               {/* Decorative Background Elements behind cards */}
               <div className="absolute inset-0 border-2 border-dashed border-gray-200 rounded-full animate-spin-slow opacity-70 pointer-events-none" style={{ animationDuration: '30s' }}></div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default DiscoverUsersTripsSection;
