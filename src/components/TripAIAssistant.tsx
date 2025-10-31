import { useMemo, useState } from "react";
import { egyptTrips } from "@/lib/trips-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { MapPin, Star, Heart } from "lucide-react";

const TripAIAssistant = () => {
  const cities = useMemo(() => Array.from(new Set(egyptTrips.map(t => t.city))), []);
  const [city, setCity] = useState<string>("");
  const [days, setDays] = useState<string>("3");
  const [budget, setBudget] = useState<string>("2000");
  const [results, setResults] = useState<typeof egyptTrips>([]);
  const [submitted, setSubmitted] = useState(false);

  const handleSuggest = () => {
    setSubmitted(true);
    const tripDays = (t: string) => parseInt(t.match(/\d+/)?.[0] || "0");
    const maxBudget = parseInt(budget || "0");
    const filtered = egyptTrips.filter(t => {
      const byCity = city ? (t.city === city || t.destination === city) : true;
      const withinDays = days ? tripDays(t.duration) <= parseInt(days) : true;
      const tripBudget = parseInt(t.budget.replace(/[^\d]/g, ""));
      const withinBudget = maxBudget ? tripBudget <= maxBudget : true;
      return byCity && withinDays && withinBudget;
    }).sort((a,b) => b.rating - a.rating || b.likes - a.likes).slice(0, 5);
    setResults(filtered);
  };

  return (
    <section className="container mx-auto px-4 py-8 sm:py-12">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold">مساعد الرحلات الذكي</h2>
        <p className="text-muted-foreground mt-1">أخبرنا عن تفضيلاتك لنقترح لك أفضل الرحلات.</p>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <Label>المدينة</Label>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger>
                <SelectValue placeholder="اختر مدينة" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>عدد الأيام</Label>
            <Input type="number" min={1} value={days} onChange={(e) => setDays(e.target.value)} />
          </div>
          <div>
            <Label>الميزانية القصوى (جنيه)</Label>
            <Input type="number" min={0} value={budget} onChange={(e) => setBudget(e.target.value)} />
          </div>
          <div className="md:col-span-3">
            <Button className="rounded-full" onClick={handleSuggest}>اقترح رحلات</Button>
          </div>
        </CardContent>
      </Card>

      {submitted && (
        <div className="space-y-3">
          {results.length === 0 ? (
            <div className="text-center text-muted-foreground">لم نجد نتائج مطابقة، جرّب توسيع المعايير.</div>
          ) : (
            results.map((trip) => (
              <Link key={trip.id} to={`/trips/${trip.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <img src={trip.image} alt={trip.title} className="h-16 w-24 rounded-lg object-cover border" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{trip.title}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-3">
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-secondary" /> {trip.destination}</span>
                    <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-primary text-primary" /> {trip.rating}</span>
                    <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5 text-primary" /> {trip.likes}</span>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground whitespace-nowrap">{trip.budget}</div>
              </Link>
            ))
          )}
        </div>
      )}
    </section>
  );
};

export default TripAIAssistant;
