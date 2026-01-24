import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PlusCircle, MapPin, TrendingUp, Bookmark, Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface TimelineFilters {
  showMyStories: boolean;
  showFollowed: boolean;
  showRecommended: boolean;
  onlyTrips: boolean;
  onlyTips: boolean;
  season?: string;
}

interface LeftSidebarProps {
  filters: TimelineFilters;
  onFiltersChange: (filters: TimelineFilters) => void;
  userStats?: {
    citiesVisited: number;
    storiesShared: number;
    tripsCreated: number;
  };
  upcomingTrip?: {
    title: string;
    destination: string;
    date: string;
  } | null;
}

const LeftSidebar = ({ filters, onFiltersChange, userStats, upcomingTrip }: LeftSidebarProps) => {
  const handleFilterChange = (key: keyof TimelineFilters, value: boolean | string | undefined) => {
    onFiltersChange({ ...filters, [key]: value } as TimelineFilters);
  };

  return (
    <aside className="space-y-6 text-right" dir="rtl">
      {/* Quick Post Button */}
      <Card className="shadow-sm border-0 bg-white rounded-3xl overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <Link to="/trips/new">
            <Button className="w-full gap-2 h-12 rounded-2xl bg-gray-900 hover:bg-black text-white font-bold" size="lg">
              <PlusCircle className="h-5 w-5" />
              شارك مغامرتك
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Timeline Filters */}
      <Card className="shadow-sm border-0 bg-white rounded-3xl">
        <CardHeader className="pb-3 border-b border-gray-50 flex flex-row items-center justify-between">
           <MapPin className="h-5 w-5 text-orange-500" />
           <CardTitle className="text-xl font-black">تصفية التغذية</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <div className="flex items-center justify-between group cursor-pointer" onClick={() => handleFilterChange("showMyStories", !filters.showMyStories)}>
            <Label htmlFor="showMyStories" className="text-sm font-bold text-gray-700 cursor-pointer">
              رحلاتي فقط
            </Label>
            <Checkbox
              id="showMyStories"
              checked={filters.showMyStories}
              onCheckedChange={(checked) => handleFilterChange("showMyStories", checked as boolean)}
              className="rounded-full h-5 w-5"
            />
          </div>

          <div className="flex items-center justify-between group cursor-pointer" onClick={() => handleFilterChange("showFollowed", !filters.showFollowed)}>
            <Label htmlFor="showFollowed" className="text-sm font-bold text-gray-700 cursor-pointer">
              من أتابعهم
            </Label>
            <Checkbox
              id="showFollowed"
              checked={filters.showFollowed}
              onCheckedChange={(checked) => handleFilterChange("showFollowed", checked as boolean)}
              className="rounded-full h-5 w-5"
            />
          </div>

          <div className="flex items-center justify-between group cursor-pointer" onClick={() => handleFilterChange("showRecommended", !filters.showRecommended)}>
            <Label htmlFor="showRecommended" className="text-sm font-bold text-gray-700 cursor-pointer">
              مقترحات لك
            </Label>
            <Checkbox
              id="showRecommended"
              checked={filters.showRecommended}
              onCheckedChange={(checked) => handleFilterChange("showRecommended", checked as boolean)}
              className="rounded-full h-5 w-5"
            />
          </div>

          <div className="border-t border-gray-50 pt-4 mt-2 space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="onlyTrips" className="text-sm font-bold text-gray-700">
                قصص الرحلات
              </Label>
              <Checkbox
                id="onlyTrips"
                checked={filters.onlyTrips}
                onCheckedChange={(checked) => handleFilterChange("onlyTrips", checked as boolean)}
                className="rounded-lg h-5 w-5"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="onlyTips" className="text-sm font-bold text-gray-700">
                نصائح السفر
              </Label>
              <Checkbox
                id="onlyTips"
                checked={filters.onlyTips}
                onCheckedChange={(checked) => handleFilterChange("onlyTips", checked as boolean)}
                className="rounded-lg h-5 w-5"
              />
            </div>
          </div>

          <div className="pt-2">
             <Label className="text-xs font-bold text-gray-400 mb-3 block">فرز حسب الفصل</Label>
             <Select
              value={filters.season || "all"}
              onValueChange={(value) => handleFilterChange("season", value === "all" ? undefined : value)}
            >
              <SelectTrigger className="h-10 rounded-xl bg-gray-50 border-0 focus:ring-1 focus:ring-orange-500 font-bold text-xs">
                <SelectValue placeholder="كل المواسم" />
              </SelectTrigger>
              <SelectContent className="font-cairo">
                <SelectItem value="all">كل المواسم</SelectItem>
                <SelectItem value="winter">شتاء</SelectItem>
                <SelectItem value="summer">صيف</SelectItem>
                <SelectItem value="fall">خريف</SelectItem>
                <SelectItem value="spring">ربيع</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Trip Preview */}
      {upcomingTrip && (
        <Card className="shadow-sm border-0 bg-gradient-to-br from-orange-600 to-orange-500 rounded-3xl text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4">
             <Calendar className="w-24 h-24" />
          </div>
          <CardHeader className="pb-3 relative z-10">
            <CardTitle className="text-lg flex items-center justify-end gap-2">
              رحلتك القادمة
              <Calendar className="h-5 w-5" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 relative z-10">
            <h3 className="font-black text-xl">{upcomingTrip.title}</h3>
            <div className="flex items-center justify-end gap-2 text-sm opacity-90 font-bold">
              {upcomingTrip.destination}
              <MapPin className="h-4 w-4" />
            </div>
            <div className="text-xs bg-black/20 backdrop-blur-md rounded-lg p-2 text-center font-bold">
              تبدأ فى {new Date(upcomingTrip.date).toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Personal Stats */}
      {userStats && (
        <Card className="shadow-sm border-0 bg-white rounded-3xl">
          <CardHeader className="pb-3 border-b border-gray-50 flex flex-row items-center justify-between">
             <TrendingUp className="h-5 w-5 text-emerald-500" />
             <CardTitle className="text-xl font-black">نشاطك</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div className="bg-gray-50 rounded-2xl p-4 flex justify-between items-center group hover:bg-orange-50 transition-colors">
               <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                  <span className="text-xl font-black text-orange-600">{userStats.citiesVisited}</span>
               </div>
               <span className="text-sm font-bold text-gray-600">مدينة زرتها</span>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 flex justify-between items-center group hover:bg-emerald-50 transition-colors">
               <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                  <span className="text-xl font-black text-emerald-600">{userStats.storiesShared}</span>
               </div>
               <span className="text-sm font-bold text-gray-600">قصة شاركتها</span>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 flex justify-between items-center group hover:bg-blue-50 transition-colors">
               <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                  <span className="text-xl font-black text-blue-600">{userStats.tripsCreated}</span>
               </div>
               <span className="text-sm font-bold text-gray-600">رحلة أنشأتها</span>
            </div>
          </CardContent>
        </Card>
      )}
    </aside>
  );
};

export default LeftSidebar;
