import { useState } from "react";
import { Filter, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface FilterSectionProps {
  onFilterChange?: (filters: any) => void;
}

const FilterSection = ({ onFilterChange }: FilterSectionProps) => {
  const [city, setCity] = useState("all");
  const [duration, setDuration] = useState("all");
  const [rating, setRating] = useState("all");
  const [budget, setBudget] = useState([5000]);
  const [quickFilter, setQuickFilter] = useState("");

  const applyFilters = () => {
    onFilterChange?.({
      city,
      duration,
      rating,
      budget: budget[0],
      quickFilter
    });
  };

  const handleQuickFilter = (filter: string) => {
    const newFilter = quickFilter === filter ? "" : filter;
    setQuickFilter(newFilter);
    onFilterChange?.({
      city,
      duration,
      rating,
      budget: budget[0],
      quickFilter: newFilter
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Filter className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-xl font-bold">استكشف الرحلات</h3>
        </div>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-full">
              <SlidersHorizontal className="h-4 w-4 ml-2" />
              فلاتر
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[400px] sm:w-[540px]">
            <SheetHeader>
              <SheetTitle>تصفية الرحلات</SheetTitle>
              <SheetDescription>
                اختر المعايير المناسبة لإيجاد رحلتك المثالية
              </SheetDescription>
            </SheetHeader>
            
            <div className="space-y-6 mt-6">
              {/* المدينة */}
              <div className="space-y-2">
                <Label>المدينة</Label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المدينة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المدن</SelectItem>
                    <SelectItem value="alexandria">الإسكندرية</SelectItem>
                    <SelectItem value="matrouh">مرسى مطروح</SelectItem>
                    <SelectItem value="luxor">الأقصر</SelectItem>
                    <SelectItem value="aswan">أسوان</SelectItem>
                    <SelectItem value="hurghada">الغردقة</SelectItem>
                    <SelectItem value="sharm">شرم الشيخ</SelectItem>
                    <SelectItem value="dahab">دهب</SelectItem>
                    <SelectItem value="bahariya">الواحات البحرية</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* المدة */}
              <div className="space-y-2">
                <Label>مدة الرحلة</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المدة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">أي مدة</SelectItem>
                    <SelectItem value="1-3">١-٣ أيام</SelectItem>
                    <SelectItem value="4-6">٤-٦ أيام</SelectItem>
                    <SelectItem value="7+">أسبوع فأكثر</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* الميزانية */}
              <div className="space-y-3">
                <Label>الميزانية (جنيه مصري)</Label>
                <Slider
                  value={budget}
                  onValueChange={setBudget}
                  max={10000}
                  step={500}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>٠</span>
                  <span className="font-bold text-primary">{budget[0].toLocaleString('ar-EG')}</span>
                  <span>١٠٬٠٠٠</span>
                </div>
              </div>

              {/* التقييم */}
              <div className="space-y-2">
                <Label>التقييم الأدنى</Label>
                <Select value={rating} onValueChange={setRating}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر التقييم" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">أي تقييم</SelectItem>
                    <SelectItem value="4.5">٤.٥ نجوم فأكثر</SelectItem>
                    <SelectItem value="4.0">٤ نجوم فأكثر</SelectItem>
                    <SelectItem value="3.5">٣.٥ نجوم فأكثر</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={applyFilters} className="w-full rounded-full" size="lg">
                تطبيق الفلاتر
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={quickFilter === "coastal" ? "default" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => handleQuickFilter("coastal")}
        >
          🏖️ ساحلية
        </Button>
        <Button
          variant={quickFilter === "historical" ? "default" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => handleQuickFilter("historical")}
        >
          🏛️ تاريخية
        </Button>
        <Button
          variant={quickFilter === "adventure" ? "secondary" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => handleQuickFilter("adventure")}
        >
          🏔️ مغامرات
        </Button>
        <Button
          variant={quickFilter === "relaxation" ? "secondary" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => handleQuickFilter("relaxation")}
        >
          🧘 استرخاء
        </Button>
        <Button
          variant={quickFilter === "diving" ? "secondary" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => handleQuickFilter("diving")}
        >
          🤿 غوص
        </Button>
      </div>
    </div>
  );
};

export default FilterSection;
