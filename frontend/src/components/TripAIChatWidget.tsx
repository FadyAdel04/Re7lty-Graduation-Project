import { useMemo, useState } from "react";
import { egyptTrips } from "@/lib/trips-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, X, Send, MapPin, Star, Heart } from "lucide-react";
import { Link } from "react-router-dom";

const TRIP_TYPES = ["تاريخية", "ساحلية", "مغامرات", "استرخاء", "غوص"] as const;

type TripType = typeof TRIP_TYPES[number];

const TripAIChatWidget = () => {
  const cities = useMemo(() => Array.from(new Set(egyptTrips.map((t) => t.city))), []);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<number>(0);
  const [city, setCity] = useState<string>("");
  const [days, setDays] = useState<string>("");
  const [tripType, setTripType] = useState<TripType | "">("");
  const [salary, setSalary] = useState<string>("");
  const [suggestions, setSuggestions] = useState<typeof egyptTrips>([]);

  const reset = () => {
    setStep(0);
    setCity("");
    setDays("");
    setTripType("");
    setSalary("");
    setSuggestions([]);
  };

  const computeSuggestions = () => {
    const tripDays = (t: string) => parseInt(t.match(/\d+/)?.[0] || "0");
    const maxBudget = parseInt(salary || "0");

    // crude type keyword mapping
    const typeKeywords: Record<string, string[]> = {
      "تاريخية": ["معبد", "تاريخ", "وادي", "دير"],
      "ساحلية": ["شاطئ", "كورنيش", "جزيرة"],
      "مغامرات": ["سفاري", "تخييم", "جبال"],
      "استرخاء": ["هادئ", "قرية", "منتجع"],
      "غوص": ["غوص", "Blue Hole", "شعاب"],
    };

    const filtered = egyptTrips.filter((t) => {
      const byCity = city ? t.city === city || t.destination === city : true;
      const withinDays = days ? tripDays(t.duration) <= parseInt(days) : true;
      const withinBudget = maxBudget ? parseInt(t.budget.replace(/[^\d]/g, "")) <= maxBudget : true;
      const byType = tripType
        ? typeKeywords[tripType].some((k) => t.title.includes(k) || t.description.includes(k) || t.activities.some((a) => a.name.includes(k)))
        : true;
      return byCity && withinDays && withinBudget && byType;
    })
      .sort((a, b) => b.rating - a.rating || b.likes - a.likes)
      .slice(0, 5);

    setSuggestions(filtered);
    setStep(4);
  };

  const renderStep = () => {
    if (step === 0) {
      return (
        <div className="space-y-2">
          <div className="text-sm">مرحباً! سأساعدك لإيجاد أفضل رحلة. ما المدينة التي ترغب بزيارتها؟</div>
          <Select value={city} onValueChange={(v) => setCity(v)}>
            <SelectTrigger>
              <SelectValue placeholder="اختر المدينة" />
            </SelectTrigger>
            <SelectContent>
              {cities.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex justify-end">
            <Button size="sm" className="rounded-full" disabled={!city} onClick={() => setStep(1)}>
              التالي
            </Button>
          </div>
        </div>
      );
    }

    if (step === 1) {
      return (
        <div className="space-y-2">
          <div className="text-sm">كم عدد الأيام المتاحة لديك؟</div>
          <Input type="number" min={1} value={days} onChange={(e) => setDays(e.target.value)} />
          <div className="flex justify-between">
            <Button variant="ghost" size="sm" onClick={() => setStep(0)}>رجوع</Button>
            <Button size="sm" className="rounded-full" disabled={!days} onClick={() => setStep(2)}>
              التالي
            </Button>
          </div>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="space-y-2">
          <div className="text-sm">ما نوع الرحلة التي تفضلها؟</div>
          <Select value={tripType || undefined} onValueChange={(v) => setTripType(v as TripType)}>
            <SelectTrigger>
              <SelectValue placeholder="اختر النوع" />
            </SelectTrigger>
            <SelectContent>
              {TRIP_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex justify-between">
            <Button variant="ghost" size="sm" onClick={() => setStep(1)}>رجوع</Button>
            <Button size="sm" className="rounded-full" disabled={!tripType} onClick={() => setStep(3)}>
              التالي
            </Button>
          </div>
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className="space-y-2">
          <div className="text-sm">ما ميزانيتك التقريبية بالجنيه المصري؟</div>
          <Input type="number" min={0} value={salary} onChange={(e) => setSalary(e.target.value)} />
          <div className="flex justify-between">
            <Button variant="ghost" size="sm" onClick={() => setStep(2)}>رجوع</Button>
            <Button size="sm" className="rounded-full" onClick={computeSuggestions}>
              اقترح رحلات
            </Button>
          </div>
        </div>
      );
    }

    // step 4 results
    return (
      <div className="space-y-2">
        {suggestions.length === 0 ? (
          <div className="text-sm text-muted-foreground">لم أجد نتائج مطابقة. جرّب تعديل المعايير.</div>
        ) : (
          suggestions.map((trip) => (
            <Link key={trip.id} to={`/trips/${trip.id}`} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50">
              <img src={trip.image} alt={trip.title} className="h-12 w-16 rounded object-cover border" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate">{trip.title}</div>
                <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3 text-secondary" /> {trip.destination}</span>
                  <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-primary text-primary" /> {trip.rating}</span>
                  <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3 text-primary" /> {trip.likes}</span>
                </div>
              </div>
            </Link>
          ))
        )}
        <div className="pt-1 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={reset}>إعادة البدء</Button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {/* Toggle Button */}
      {!open && (
        <Button className="rounded-full shadow-lg" onClick={() => setOpen(true)}>
          <MessageCircle className="h-4 w-4 ml-2" /> مساعد الرحلات
        </Button>
      )}
      {open && (
        <div className="w-[92vw] max-w-sm bg-background border rounded-2xl shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
            <div className="font-bold">مساعد الرحلات الذكي</div>
            <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-4 space-y-3 max-h-[60vh] overflow-auto">
            {renderStep()}
          </div>
          <div className="px-4 py-2 border-t text-xs text-muted-foreground">اختبارات تجريبية - نتائج مبنية على بيانات الرحلات الحالية.</div>
        </div>
      )}
    </div>
  );
};

export default TripAIChatWidget;
