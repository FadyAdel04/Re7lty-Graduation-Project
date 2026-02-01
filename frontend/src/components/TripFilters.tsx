import { Filter, X, ChevronDown, Check, SlidersHorizontal, MapPin, Calendar, Clock, Star, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { TripFilters } from "@/types/corporateTrips";
import { Company } from "@/types/corporateTrips";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TripFiltersProps {
  filters: TripFilters;
  onFiltersChange: (filters: TripFilters) => void;
  destinations: string[];
  durations: string[];
  companies: Company[];
  priceRange: { min: number; max: number };
}

const TripFiltersComponent = ({
  filters,
  onFiltersChange,
  destinations,
  durations,
  companies,
  priceRange
}: TripFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localPriceRange, setLocalPriceRange] = useState<[number, number]>([
    filters.priceRange?.min ?? priceRange.min,
    filters.priceRange?.max ?? priceRange.max
  ]);

  const handleClearFilters = () => {
    onFiltersChange({});
    setLocalPriceRange([priceRange.min, priceRange.max]);
  };

  const hasActiveFilters = !!(
    filters.destination ||
    filters.priceRange ||
    filters.duration ||
    filters.companyId ||
    filters.minRating ||
    filters.season
  );

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-center gap-4 bg-white/80 backdrop-blur-md p-2 rounded-[2rem] border border-zinc-200/60 shadow-sm">
        {/* Quick Filter: Destination */}
        <div className="flex-1 min-w-[180px]">
          <Select
            value={filters.destination || "all"}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                destination: value === "all" ? undefined : value
              })
            }
          >
            <SelectTrigger className="border-0 bg-transparent focus:ring-0 h-12 hover:bg-zinc-50 rounded-2xl transition-all">
              <div className="flex items-center gap-2 text-zinc-600">
                <MapPin className="h-4 w-4 text-orange-500" />
                <SelectValue placeholder="اختر الوجهة" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-zinc-100 shadow-2xl">
              <SelectItem value="all">كل الوجهات</SelectItem>
              {destinations.map((dest) => (
                <SelectItem key={dest} value={dest}>{dest}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-px h-8 bg-zinc-200 hidden md:block" />

        {/* Quick Filter: Price */}
        <div className="flex-1 min-w-[180px]">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between px-4 h-12 hover:bg-zinc-50 rounded-2xl transition-all text-zinc-600"
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">السعر والخيارات</span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Advanced Toggle */}
        <Button
          variant={hasActiveFilters ? "default" : "outline"}
          onClick={handleClearFilters}
          className={`h-12 px-6 rounded-2xl font-bold transition-all border-zinc-200 ${
            hasActiveFilters ? 'bg-orange-600 text-white border-0' : 'text-zinc-600'
          }`}
        >
          {hasActiveFilters ? (
            <div className="flex items-center gap-2">
              <X className="h-4 w-4" />
              مسح ({Object.keys(filters).length})
            </div>
          ) : (
            "البحث الذكي"
          )}
        </Button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <Card className="rounded-[2.5rem] border-zinc-100 shadow-xl bg-white/50 backdrop-blur-sm">
              <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {/* Price Range */}
                <div className="space-y-4">
                  <Label className="text-zinc-900 font-black flex items-center gap-2">السعر <span className="text-zinc-400 font-medium">(ج.م)</span></Label>
                  <div className="px-2 pt-2">
                    <Slider
                      min={priceRange.min}
                      max={priceRange.max}
                      step={100}
                      value={localPriceRange}
                      onValueChange={(value) => setLocalPriceRange(value as [number, number])}
                      onValueCommit={(value) => onFiltersChange({...filters, priceRange: { min: value[0], max: value[1] }})}
                      className="w-full"
                    />
                  </div>
                  <div className="flex justify-between items-center text-xs font-black text-zinc-500">
                    <span className="bg-zinc-100 px-2 py-1 rounded-lg">{localPriceRange[0]}</span>
                    <div className="h-px flex-1 bg-zinc-100 mx-2" />
                    <span className="bg-zinc-100 px-2 py-1 rounded-lg">{localPriceRange[1]}</span>
                  </div>
                </div>

                {/* Duration */}
                <div className="space-y-4">
                  <Label className="text-zinc-900 font-black">المدة الزمنية</Label>
                  <Select
                    value={filters.duration || "all"}
                    onValueChange={(v) => onFiltersChange({...filters, duration: v === "all" ? undefined : v})}
                  >
                    <SelectTrigger className="rounded-xl bg-white border-zinc-200">
                      <SelectValue placeholder="اختر المدة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل الفترات</SelectItem>
                      {durations.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Company */}
                <div className="space-y-4">
                  <Label className="text-zinc-900 font-black">الشركة المفضلة</Label>
                  <Select
                    value={filters.companyId || "all"}
                    onValueChange={(v) => onFiltersChange({...filters, companyId: v === "all" ? undefined : v})}
                  >
                    <SelectTrigger className="rounded-xl bg-white border-zinc-200">
                      <SelectValue placeholder="اختر الشركة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الشركات</SelectItem>
                      {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Season & Rating */}
                <div className="space-y-4">
                  <Label className="text-zinc-900 font-black">التصنيف والموسم</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={filters.season || "all"}
                      onValueChange={(v) => onFiltersChange({...filters, season: v === "all" ? undefined : v})}
                    >
                      <SelectTrigger className="rounded-xl bg-white border-zinc-200">
                        <SelectValue placeholder="الموسم" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">كل المواسم</SelectItem>
                        <SelectItem value="winter">شتاء</SelectItem>
                        <SelectItem value="summer">صيف</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={filters.minRating?.toString() || "all"}
                      onValueChange={(v) => onFiltersChange({...filters, minRating: v === "all" ? undefined : parseFloat(v)})}
                    >
                      <SelectTrigger className="rounded-xl bg-white border-zinc-200">
                        <SelectValue placeholder="التقييم" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">الكل</SelectItem>
                        <SelectItem value="4.5">4.5+</SelectItem>
                        <SelectItem value="4.0">4.0+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TripFiltersComponent;
