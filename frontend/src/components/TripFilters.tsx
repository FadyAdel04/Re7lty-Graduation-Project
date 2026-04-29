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
import { cn } from "@/lib/utils";

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
    <div className="w-full space-y-4 font-cairo">
      <div className="flex flex-wrap items-center gap-4 bg-card/80 backdrop-blur-md p-2 rounded-[2.5rem] border border-border shadow-xl shadow-black/5">
        {/* Quick Filter: Destination */}
        <div className="flex-1 min-w-[200px]">
          <Select
            value={filters.destination || "all"}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                destination: value === "all" ? undefined : value
              })
            }
          >
            <SelectTrigger className="border-0 bg-transparent focus:ring-0 h-14 hover:bg-muted rounded-[1.5rem] transition-all px-6">
              <div className="flex items-center gap-3 text-foreground font-black">
                <MapPin className="h-5 w-5 text-primary" />
                <SelectValue placeholder="اختر الوجهة" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-[1.5rem] border-border shadow-2xl bg-card">
              <SelectItem value="all" className="font-bold">كل الوجهات</SelectItem>
              {destinations.map((dest) => (
                <SelectItem key={dest} value={dest} className="font-bold">{dest}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-px h-10 bg-border hidden md:block" />

        {/* Quick Filter: Price & Options Toggle */}
        <div className="flex-1 min-w-[200px]">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between px-6 h-14 hover:bg-muted rounded-[1.5rem] transition-all text-foreground"
          >
            <div className="flex items-center gap-3">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              <span className="text-base font-black">السعر والخيارات</span>
            </div>
            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            </motion.div>
          </button>
        </div>

        {/* Action Button */}
        <Button
          variant={hasActiveFilters ? "default" : "outline"}
          onClick={hasActiveFilters ? handleClearFilters : () => setIsExpanded(!isExpanded)}
          className={cn(
            "h-14 px-8 rounded-[1.5rem] font-black transition-all border-border",
            hasActiveFilters ? 'bg-primary text-primary-foreground border-0 shadow-lg shadow-primary/20' : 'text-foreground'
          )}
        >
          {hasActiveFilters ? (
            <div className="flex items-center gap-2">
              <X className="h-5 w-5" />
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
            initial={{ height: 0, opacity: 0, y: -20 }}
            animate={{ height: "auto", opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "circOut" }}
            className="overflow-hidden"
          >
            <Card className="rounded-[3rem] border-border shadow-2xl bg-card/50 backdrop-blur-xl mb-6">
              <CardContent className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                {/* Price Range */}
                <div className="space-y-6">
                  <Label className="text-foreground font-black text-lg flex items-center gap-2">السعر <span className="text-muted-foreground font-bold text-sm">(ج.م)</span></Label>
                  <div className="px-2 pt-4">
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
                  <div className="flex justify-between items-center text-xs font-black text-muted-foreground">
                    <span className="bg-muted px-4 py-2 rounded-xl border border-border">{localPriceRange[0]}</span>
                    <div className="h-px flex-1 bg-border mx-4" />
                    <span className="bg-muted px-4 py-2 rounded-xl border border-border">{localPriceRange[1]}</span>
                  </div>
                </div>

                {/* Duration */}
                <div className="space-y-6">
                  <Label className="text-foreground font-black text-lg">المدة الزمنية</Label>
                  <Select
                    value={filters.duration || "all"}
                    onValueChange={(v) => onFiltersChange({...filters, duration: v === "all" ? undefined : v})}
                  >
                    <SelectTrigger className="h-14 rounded-2xl bg-background border-border font-bold px-6">
                      <SelectValue placeholder="اختر المدة" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl bg-card border-border">
                      <SelectItem value="all" className="font-bold">كل الفترات</SelectItem>
                      {durations.map(d => <SelectItem key={d} value={d} className="font-bold">{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Company */}
                <div className="space-y-6">
                  <Label className="text-foreground font-black text-lg">الشركة المفضلة</Label>
                  <Select
                    value={filters.companyId || "all"}
                    onValueChange={(v) => onFiltersChange({...filters, companyId: v === "all" ? undefined : v})}
                  >
                    <SelectTrigger className="h-14 rounded-2xl bg-background border-border font-bold px-6">
                      <SelectValue placeholder="اختر الشركة" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl bg-card border-border">
                      <SelectItem value="all" className="font-bold">جميع الشركات</SelectItem>
                      {companies.map(c => <SelectItem key={c.id} value={c.id} className="font-bold">{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Season & Rating */}
                <div className="space-y-6">
                  <Label className="text-foreground font-black text-lg">التصنيف والموسم</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      value={filters.season || "all"}
                      onValueChange={(v) => onFiltersChange({...filters, season: v === "all" ? undefined : v})}
                    >
                      <SelectTrigger className="h-14 rounded-2xl bg-background border-border font-bold px-4">
                        <SelectValue placeholder="الموسم" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl bg-card border-border">
                        <SelectItem value="all" className="font-bold">الكل</SelectItem>
                        <SelectItem value="winter" className="font-bold">شتاء</SelectItem>
                        <SelectItem value="summer" className="font-bold">صيف</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={filters.minRating?.toString() || "all"}
                      onValueChange={(v) => onFiltersChange({...filters, minRating: v === "all" ? undefined : parseFloat(v)})}
                    >
                      <SelectTrigger className="h-14 rounded-2xl bg-background border-border font-bold px-4">
                        <SelectValue placeholder="التقييم" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl bg-card border-border">
                        <SelectItem value="all" className="font-bold">الكل</SelectItem>
                        <SelectItem value="4.5" className="font-bold">4.5+</SelectItem>
                        <SelectItem value="4.0" className="font-bold">4.0+</SelectItem>
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
