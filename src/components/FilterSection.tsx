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

const FilterSection = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Filter className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold">تصفية النتائج</h3>
        </div>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="h-4 w-4 ml-2" />
              خيارات متقدمة
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
                <Select>
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
                  </SelectContent>
                </Select>
              </div>

              {/* المدة */}
              <div className="space-y-2">
                <Label>مدة الرحلة</Label>
                <Select>
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
                  defaultValue={[5000]}
                  max={10000}
                  step={500}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>٠</span>
                  <span>١٠٬٠٠٠</span>
                </div>
              </div>

              {/* التقييم */}
              <div className="space-y-2">
                <Label>التقييم الأدنى</Label>
                <Select>
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

              <Button className="w-full" size="lg">
                تطبيق الفلاتر
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2 mt-4">
        <Button variant="outline" size="sm" className="rounded-full">
          ساحلية
        </Button>
        <Button variant="outline" size="sm" className="rounded-full">
          تاريخية
        </Button>
        <Button variant="outline" size="sm" className="rounded-full">
          مغامرات
        </Button>
        <Button variant="outline" size="sm" className="rounded-full">
          استرخاء
        </Button>
        <Button variant="outline" size="sm" className="rounded-full">
          غوص
        </Button>
      </div>
    </div>
  );
};

export default FilterSection;
