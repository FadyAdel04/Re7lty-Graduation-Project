import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Cloud, Sun, CloudRain, Snowflake, Wind, CloudLightning, Loader2, MapPin, Info } from "lucide-react";
import { cn } from "@/lib/utils";

// Global cache to avoid refetching on every dropdown mount
let cachedWeatherData: any = null;
let cachedLocationName: string = "";
let cachedError: string = "";

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

  if (temp > 35) advice += " الجو حار جداً، اشرب الكثير من الماء.";
  else if (temp < 15 && temp >= 5) advice += " الجو بارد، ارتدِ ملابس ثقيلة.";
  else if (temp < 5) advice += " الجو شديد البرودة.";

  return advice;
};

export default function WeatherWidget() {
  const [weatherData, setWeatherData] = useState<any>(cachedWeatherData);
  const [locationName, setLocationName] = useState<string>(cachedLocationName);
  const [loading, setLoading] = useState(!cachedWeatherData && !cachedError);
  const [error, setError] = useState(cachedError);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchLocationName = async (lat: number, lon: number) => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`, {
          headers: {
            'Accept-Language': 'ar'
          }
        });
        const data = await res.json();
        const city = data.address.city || data.address.town || data.address.village || data.address.suburb || "موقعك الحالي";
        cachedLocationName = city;
        if (mounted) setLocationName(city);
      } catch (err) {
        console.error("Error fetching location name:", err);
        if (mounted) setLocationName("موقعك الحالي");
      }
    };

    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&forecast_days=10`);
        const data = await res.json();
        cachedWeatherData = data;
        if (mounted) {
          setWeatherData(data);
          setLoading(false);
        }
      } catch (err) {
        cachedError = "Failed to fetch weather";
        if (mounted) {
          setError(cachedError);
          setLoading(false);
        }
      }
    };

    const startGeolocation = () => {
      const DEFAULT_LAT = 30.0444;
      const DEFAULT_LON = 31.2357;

      const useFallback = (reason: string) => {
        console.warn(`Weather: ${reason}. Using Cairo as fallback.`);
        fetchWeather(DEFAULT_LAT, DEFAULT_LON);
        fetchLocationName(DEFAULT_LAT, DEFAULT_LON);
      };

      if (!("geolocation" in navigator)) {
        useFallback("Geolocation not supported");
        return;
      }

      const getPosition = () => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            fetchWeather(latitude, longitude);
            fetchLocationName(latitude, longitude);
          },
          (err) => {
            const isDenied = err.code == 1 || (err.message && err.message.toLowerCase().includes('denied'));
            if (isDenied) {
              cachedError = "Location access denied";
              useFallback("Location access denied");
            } else {
              console.error("Error getting location:", err);
              useFallback("Location lookup failed");
            }
          },
          { timeout: 10000, enableHighAccuracy: false }
        );
      };

      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'geolocation' as PermissionName })
          .then((permissionStatus) => {
            if (permissionStatus.state === 'denied') {
              cachedError = "Location access denied";
              useFallback("Location access denied (blocked by user)");
            } else {
              getPosition();
            }
          })
          .catch(() => getPosition());
      } else {
        getPosition();
      }
    };

    if ((!cachedWeatherData || !cachedLocationName) && !cachedError) {
      startGeolocation();
    }

    return () => { mounted = false; };
  }, []);

  const handleWidgetClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!loading && !error && weatherData) {
      setIsDialogOpen(true);
    }
  };

  return (
    <>
      <div 
        onClick={handleWidgetClick}
        className={cn(
          "flex items-center justify-between p-3 rounded-xl transition-all duration-300 hover:bg-sky-50 cursor-pointer m-1",
          (loading || error) ? "opacity-70 pointer-events-none" : ""
        )}
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-sky-100 text-sky-500">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 
             error ? <Cloud className="h-4 w-4" /> : 
             getWeatherIcon(weatherData.current_weather.weathercode, "h-4 w-4")}
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[10px] font-black text-sky-500 leading-none mb-1">
              {loading ? "جاري التحديد..." : locationName}
            </span>
            <span className="text-xs font-bold text-gray-700 leading-none">
              {loading ? "جاري جلب الطقس..." : 
               error ? "تعذر جلب الطقس" : 
               getWeatherDescription(weatherData.current_weather.weathercode)}
            </span>
          </div>
        </div>
        {!loading && !error && weatherData && (
          <div className="text-sm font-black text-sky-600" dir="ltr">
            {Math.round(weatherData.current_weather.temperature)}°
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-4xl font-cairo overflow-hidden flex flex-col h-[90vh] sm:h-auto" style={{ zIndex: 9999 }}>
          <DialogHeader className="text-right shrink-0">
            <DialogTitle className="flex items-center gap-2 text-xl font-black text-sky-600 justify-end">
              <MapPin className="h-5 w-5" />
              حالة الطقس في {locationName}
            </DialogTitle>
            <DialogDescription className="text-right">
              توقعات الطقس لمدة 9 أيام بناءً على موقعك الحالي.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar mt-4" dir="rtl">
            {weatherData && weatherData.daily && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                {weatherData.daily.time.slice(0, 9).map((time: string, index: number) => {
                  const date = new Date(time);
                  const dayName = new Intl.DateTimeFormat('ar-EG', { weekday: 'long' }).format(date);
                  const dayDate = new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long' }).format(date);
                  const weatherCode = weatherData.daily.weathercode[index];
                  const maxTemp = Math.round(weatherData.daily.temperature_2m_max[index]);
                  const minTemp = Math.round(weatherData.daily.temperature_2m_min[index]);

                  return (
                    <div key={time} className="flex flex-col p-4 rounded-2xl bg-gray-50/80 hover:bg-sky-50 transition-all border border-gray-100 hover:border-sky-200 hover:shadow-md h-full gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                            {getWeatherIcon(weatherCode, "h-6 w-6")}
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-gray-900 text-sm leading-tight truncate">{index === 0 ? "اليوم" : dayName}</p>
                            <p className="text-[10px] text-gray-400 font-bold leading-tight mt-0.5">{dayDate}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-black shrink-0" dir="ltr">
                          <span className="text-rose-500">{maxTemp}°</span>
                          <span className="text-gray-300">/</span>
                          <span className="text-sky-500">{minTemp}°</span>
                        </div>
                      </div>
                      <div className="bg-white/60 p-2.5 rounded-xl border border-sky-100/50 flex items-start gap-2.5 flex-1 min-h-[60px]">
                        <Info className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                           <p className="text-[10px] font-black text-sky-600 mb-0.5">{getWeatherDescription(weatherCode)}</p>
                           <p className="text-[11px] font-bold text-sky-900 leading-relaxed line-clamp-2">
                             {getTravelAdvice(weatherCode, maxTemp)}
                           </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
