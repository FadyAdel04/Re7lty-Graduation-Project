import { Filter, X } from "lucide-react";
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

interface TripFiltersProps {
  filters: TripFilters;
  onFiltersChange: (filters: TripFilters) => void;
  destinations: string[];
  companies: Company[];
  priceRange: { min: number; max: number };
}

const TripFiltersComponent = ({
  filters,
  onFiltersChange,
  destinations,
  companies,
  priceRange
}: TripFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
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
    filters.minRating
  );

  return (
    <div className="relative">
      <Button
        variant="outline"
        className="gap-2 rounded-xl"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Filter className="h-4 w-4" />
        تصفية النتائج
        {hasActiveFilters && (
          <span className="h-2 w-2 rounded-full bg-orange-500" />
        )}
      </Button>

      {isOpen && (
        <Card className="absolute left-0 top-full mt-2 w-80 z-50 shadow-xl border-gray-200">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">الفلاتر</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Destination Filter */}
            <div className="space-y-2">
              <Label>الوجهة</Label>
              <Select
                value={filters.destination || "all"}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    destination: value === "all" ? undefined : value
                  })
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="جميع الوجهات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الوجهات</SelectItem>
                  {destinations.map((dest) => (
                    <SelectItem key={dest} value={dest}>
                      {dest}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Company Filter */}
            <div className="space-y-2">
              <Label>الشركة</Label>
              <Select
                value={filters.companyId || "all"}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    companyId: value === "all" ? undefined : value
                  })
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="جميع الشركات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الشركات</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Duration Filter */}
            <div className="space-y-2">
              <Label>المدة</Label>
              <Select
                value={filters.duration || "all"}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    duration: value === "all" ? undefined : value
                  })
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="جميع المدد" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المدد</SelectItem>
                  <SelectItem value="يوم">يوم واحد</SelectItem>
                  <SelectItem value="يومين">يومين</SelectItem>
                  <SelectItem value="3">3 أيام</SelectItem>
                  <SelectItem value="4">4 أيام</SelectItem>
                  <SelectItem value="5">5 أيام أو أكثر</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price Range Filter */}
            <div className="space-y-3">
              <Label>نطاق السعر</Label>
              <div className="px-2">
                <Slider
                  min={priceRange.min}
                  max={priceRange.max}
                  step={50}
                  value={localPriceRange}
                  onValueChange={(value) => setLocalPriceRange(value as [number, number])}
                  onValueCommit={(value) => {
                    const [min, max] = value;
                    onFiltersChange({
                      ...filters,
                      priceRange: { min, max }
                    });
                  }}
                  className="w-full"
                />
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{localPriceRange[0]} ر.س</span>
                <span>{localPriceRange[1]} ر.س</span>
              </div>
            </div>

            {/* Rating Filter */}
            <div className="space-y-2">
              <Label>التقييم الأدنى</Label>
              <Select
                value={filters.minRating?.toString() || "all"}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    minRating: value === "all" ? undefined : parseFloat(value)
                  })
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="جميع التقييمات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع التقييمات</SelectItem>
                  <SelectItem value="4.5">4.5+ نجوم</SelectItem>
                  <SelectItem value="4.0">4.0+ نجوم</SelectItem>
                  <SelectItem value="3.5">3.5+ نجوم</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                className="w-full rounded-xl"
                onClick={handleClearFilters}
              >
                مسح جميع الفلاتر
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TripFiltersComponent;
