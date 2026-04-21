import { useState, useEffect } from "react";
import { Cloud, Sun, CloudRain, Snowflake, Wind, CloudLightning, Loader2, MapPin, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { GOVERNORATES_COORDINATES } from "@/lib/egypt-data";

const getWeatherIcon = (code: number, className: string = "h-4 w-4") => {
  if (code === 0) return <Sun className={cn("text-yellow-500", className)} />;
  if (code >= 1 && code <= 3) return <Cloud className={cn("text-gray-400", className)} />;
  if (code >= 45 && code <= 48) return <Wind className={cn("text-gray-400", className)} />;
  if (code >= 51 && code <= 67) return <CloudRain className={cn("text-blue-400", className)} />;
  if (code >= 71 && code <= 77) return <Snowflake className={cn("text-blue-200", className)} />;
  if (code >= 80 && code <= 82) return <CloudRain className={cn("text-blue-500", className)} />;
  if (code >= 85 && code <= 86) return <Snowflake className={cn("text-blue-300", className)} />;
  if (code >= 95 && code <= 99) return <CloudLightning className={cn("text-yellow-600", className)} />;
  return <Sun className={cn("text-yellow-500", className)} />;
};

const getWeatherDescription = (code: number) => {
  if (code === 0) return "سماء صافية";
  if (code >= 1 && code <= 3) return "غائم جزئياً";
  if (code >= 45 && code <= 48) return "ضباب";
  if (code >= 51 && code <= 55) return "رذاذ معدل";
  if (code >= 61 && code <= 65) return "مطر خفيف";
  if (code >= 71 && code <= 75) return "تساقط ثلوج";
  if (code >= 80 && code <= 82) return "زخات أمطار";
  if (code >= 95 && code <= 99) return "عواصف رعدية";
  return "غير محدد";
};

const getTravelAdvice = (code: number, temp: number) => {
  let advice = "";
  if (code === 0) advice = "الجو رائع للتنزه، استمتع بوقتك!";
  else if (code >= 1 && code <= 3) advice = "الجو غائم قليلاً، مناسب جداً للمشي.";
  else if (code >= 45 && code <= 48) advice = "انتبه أثناء التنقل، الرؤية قد تكون ضعيفة بسبب الضباب.";
  else if (code >= 51 && code <= 67 || code >= 80 && code <= 82) advice = "لا تنسَ مظلتك! الجو ممطر اليوم.";
  else if (code >= 71 && code <= 77 || code >= 85 && code <= 86) advice = "ارتدِ ملابس ثقيلة جداً واستعد للثلج.";
  else if (code >= 95 && code <= 99) advice = "يفضل البقاء في الداخل، هناك عواصف رعدية متوقعة.";
  else advice = "استمتع برحلتك اليوم!";

  if (temp > 35) advice += " الجو حار جداً، اشرب الكثير من الماء وارتدِ ملابس خفيفة.";
  else if (temp < 15 && temp >= 5) advice += " الجو بارد، ارتدِ ملابس ثقيلة.";
  else if (temp < 5) advice += " الجو شديد البرودة، احرص على التدفئة جيداً.";

  return advice;
};

interface CityWeatherAdvisorProps {
  cityName: string;
  layout?: 'vertical' | 'horizontal' | 'grid';
}

export default function CityWeatherAdvisor({ cityName, layout = 'vertical' }: CityWeatherAdvisorProps) {
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchWeatherByCity = async () => {
      try {
        setLoading(true);
        let latitude, longitude;

        // Step 1: Check local data first for performance and reliability
        const normalize = (name: string) => name.replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').trim();
        const normalizedInput = normalize(cityName);
        
        let localCity = GOVERNORATES_COORDINATES[cityName];
        if (!localCity) {
          // Try finding it by normalized key
          const foundKey = Object.keys(GOVERNORATES_COORDINATES).find(k => normalize(k) === normalizedInput);
          if (foundKey) localCity = GOVERNORATES_COORDINATES[foundKey];
        }

        if (localCity) {
          latitude = localCity.lat;
          longitude = localCity.lng;
        } else {
          // Step 2: External Geocoding as fallback
          let response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=ar&format=json`);
          let geoData = await response.json();

          if (!geoData.results || geoData.results.length === 0) {
            // Fallback to English if Arabic fails
            response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`);
            geoData = await response.json();
          }

          if (!geoData.results || geoData.results.length === 0) {
            throw new Error("لم نتمكن من العثور على إحداثيات المدينة");
          }
          latitude = geoData.results[0].latitude;
          longitude = geoData.results[0].longitude;
        }

        // Step 2: Weather
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`);
        const data = await weatherRes.json();

        if (mounted) {
          setWeatherData(data);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching city weather:", err);
        if (mounted) {
          setError("تعذر جلب بيانات الطقس لهذه المدينة");
          setLoading(false);
        }
      }
    };

    if (cityName) {
      fetchWeatherByCity();
    }

    return () => { mounted = false; };
  }, [cityName]);

  if (loading) {
    return (
      <div className={cn(
        "bg-sky-50/50 rounded-[2rem] p-8 border border-sky-100 flex flex-col items-center justify-center gap-3",
        layout === 'horizontal' && "p-4 py-8"
      )}>
        <Loader2 className="h-8 w-8 text-sky-500 animate-spin" />
        <p className="text-sm font-black text-sky-600 font-cairo">جاري جلب حالة الطقس لـ {cityName}...</p>
      </div>
    );
  }

  if (error || !weatherData) {
    return null; 
  }

  const items = weatherData.daily.time.slice(0, 7).map((time: string, index: number) => {
    const date = new Date(time);
    const dayName = new Intl.DateTimeFormat('ar-EG', { weekday: 'long' }).format(date);
    const dayDate = new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long' }).format(date);
    const weatherCode = weatherData.daily.weathercode[index];
    const maxTemp = Math.round(weatherData.daily.temperature_2m_max[index]);
    const minTemp = Math.round(weatherData.daily.temperature_2m_min[index]);
    const advice = getTravelAdvice(weatherCode, maxTemp);
    
    return { time, dayName, dayDate, weatherCode, maxTemp, minTemp, advice, isToday: index === 0 };
  });

  if (layout === 'grid') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 font-cairo" dir="rtl">
        {items.map((item, idx) => (
          <motion.div
            key={item.time}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white border-2 border-gray-100 rounded-3xl p-4 md:p-5 hover:border-sky-300 hover:shadow-xl hover:shadow-sky-500/5 transition-all group flex flex-col"
          >
            <div className="flex items-center justify-between mb-3 shrink-0">
               <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center group-hover:bg-sky-100 transition-colors">
                     {getWeatherIcon(item.weatherCode, "h-6 w-6")}
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 text-sm">{item.isToday ? "اليوم" : item.dayName}</h4>
                    <p className="text-[10px] font-bold text-gray-400">{item.dayDate}</p>
                  </div>
               </div>
               <div className="text-right flex items-center gap-1 font-black text-xs" dir="ltr">
                  <span className="text-rose-500">{item.maxTemp}°</span>
                  <span className="text-gray-300">/</span>
                  <span className="text-sky-500">{item.minTemp}°</span>
               </div>
            </div>
            <div className="mt-auto space-y-2">
              <Badge className="bg-sky-50 text-sky-600 hover:bg-sky-100 border-none font-black text-[9px] w-full justify-center">
                {getWeatherDescription(item.weatherCode)}
              </Badge>
              <p className="text-[10px] font-bold text-gray-500 line-clamp-2 bg-gray-50/50 p-2 rounded-lg border border-gray-100/30">
                {item.advice}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (layout === 'horizontal') {
    return (
      <div className="w-full space-y-4 font-cairo" dir="rtl">


        <div className="flex gap-4 overflow-x-auto pb-4 pr-1 snap-x custom-scrollbar">
           {items.map((item, idx) => (
             <motion.div
               key={item.time}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: idx * 0.05 }}
               className="flex-shrink-0 w-[180px] sm:w-[200px] md:w-[240px] snap-start group bg-white border border-gray-100 rounded-[1.5rem] p-4 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-500/5 transition-all"
             >
                <div className="flex items-center justify-between mb-3">
                   <div className="flex items-center gap-2">
                       <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                          {getWeatherIcon(item.weatherCode, "h-5 w-5")}
                       </div>
                       <div>
                          <p className="font-black text-gray-900 text-xs">{item.isToday ? "اليوم" : item.dayName}</p>
                          <p className="text-[9px] font-bold text-gray-400">{item.dayDate}</p>
                       </div>
                   </div>
                   <div className="text-right" dir="ltr">
                      <div className="flex items-center gap-1.5 text-[11px] font-black">
                        <span className="text-rose-500">{item.maxTemp}°</span>
                        <span className="text-gray-300">/</span>
                        <span className="text-sky-500">{item.minTemp}°</span>
                      </div>
                   </div>
                </div>

                <div className="bg-sky-50/50 p-2 rounded-xl border border-sky-100/50 flex items-start gap-2">
                    <Info className="w-3 h-3 text-sky-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[9px] font-black text-sky-700 mb-0.5">{getWeatherDescription(item.weatherCode)}</p>
                      <p className="text-[10px] font-bold text-sky-900 leading-relaxed line-clamp-2">
                        {item.advice}
                      </p>
                    </div>
                </div>
             </motion.div>
           ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-cairo" dir="rtl">
      <div className="flex items-center gap-3 mb-4 px-2">
        <div className="w-10 h-10 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600">
          <Cloud className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xl font-black text-gray-900">حالة الطقس في {cityName}</h3>
          <p className="text-xs font-bold text-gray-500">توقعات دقيقة لكل يوم</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {items.map((item, index) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            key={item.time} 
            className="group bg-white border border-gray-100 rounded-[2rem] p-6 hover:shadow-xl hover:shadow-sky-500/5 transition-all hover:border-sky-200"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 text-right">
              <div className="flex items-center gap-4 shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-sky-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  {getWeatherIcon(item.weatherCode, "h-10 w-10")}
                </div>
                <div>
                  <p className="font-black text-gray-900 text-lg leading-tight">{item.isToday ? "اليوم" : item.dayName}</p>
                  <p className="text-xs font-bold text-gray-400 mb-1">{item.dayDate}</p>
                  <div className="flex items-center gap-2 text-sm font-black" dir="ltr">
                    <span className="text-rose-500">{item.maxTemp}°</span>
                    <span className="text-gray-300">/</span>
                    <span className="text-sky-500">{item.minTemp}°</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-2 w-full">
                 <div className="flex items-center gap-2">
                    <Badge className="bg-sky-100 text-sky-600 hover:bg-sky-100 border-none font-black text-[10px]">{getWeatherDescription(item.weatherCode)}</Badge>
                 </div>
                 <div className="bg-sky-50/50 p-3 rounded-xl border border-sky-100/50 flex items-start gap-3 w-full">
                    <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                    <p className="text-sm font-bold text-sky-900 leading-relaxed text-right">{item.advice}</p>
                 </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}


