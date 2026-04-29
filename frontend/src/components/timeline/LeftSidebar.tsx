import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PlusCircle, MapPin, TrendingUp, Bookmark, Calendar, Globe, Award, Sparkles } from "lucide-react";
import UserBadge, { BadgeTier } from "@/components/UserBadge";
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
  postType?: string;
}

interface LeftSidebarProps {
  filters: TimelineFilters;
  onFiltersChange: (filters: TimelineFilters) => void;
  userStats?: {
    citiesVisited: number;
    storiesShared: number;
    tripsCreated: number;
    points?: number;
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
    <aside className="space-y-6 text-right transition-colors duration-500" dir="rtl">
      {/* Quick Post Button */}
      <Card className="shadow-sm border border-border/50 bg-card rounded-3xl overflow-hidden hover:shadow-md transition-all duration-300">
        <CardContent className="p-4">
          <Link to="/trips/new">
            <Button className="w-full gap-2 h-12 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black shadow-lg shadow-primary/20 transition-transform active:scale-95" size="lg">
              <PlusCircle className="h-5 w-5" />
              شارك مغامرتك
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Timeline Filters */}
      <Card className="shadow-sm border border-border/50 bg-card rounded-3xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between bg-muted/30">
           <MapPin className="h-5 w-5 text-primary" />
           <CardTitle className="text-xl font-black text-foreground">تصفية الرحلات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <div className="flex items-center justify-between group cursor-pointer" onClick={() => handleFilterChange("showMyStories", !filters.showMyStories)}>
            <Label htmlFor="showMyStories" className="text-sm font-black text-muted-foreground cursor-pointer group-hover:text-foreground transition-colors">
              رحلاتي فقط
            </Label>
            <Checkbox
              id="showMyStories"
              checked={filters.showMyStories}
              onCheckedChange={(checked) => handleFilterChange("showMyStories", checked as boolean)}
              className="rounded-full h-5 w-5 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
          </div>

          <div className="flex items-center justify-between group cursor-pointer" onClick={() => handleFilterChange("showFollowed", !filters.showFollowed)}>
            <Label htmlFor="showFollowed" className="text-sm font-black text-muted-foreground cursor-pointer group-hover:text-foreground transition-colors">
              من أتابعهم
            </Label>
            <Checkbox
              id="showFollowed"
              checked={filters.showFollowed}
              onCheckedChange={(checked) => handleFilterChange("showFollowed", checked as boolean)}
              className="rounded-full h-5 w-5 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
          </div>

          <div className="flex items-center justify-between group cursor-pointer" onClick={() => handleFilterChange("showRecommended", !filters.showRecommended)}>
            <Label htmlFor="showRecommended" className="text-sm font-black text-muted-foreground cursor-pointer group-hover:text-foreground transition-colors">
              مقترحات لك
            </Label>
            <Checkbox
              id="showRecommended"
              checked={filters.showRecommended}
              onCheckedChange={(checked) => handleFilterChange("showRecommended", checked as boolean)}
              className="rounded-full h-5 w-5 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
          </div>


          <div className="pt-2">
             <Label className="text-[10px] font-black text-muted-foreground mb-2 block uppercase tracking-wider">فرز حسب الفصل</Label>
             <Select
              value={filters.season || "all"}
              onValueChange={(value) => handleFilterChange("season", value === "all" ? undefined : value)}
            >
              <SelectTrigger className="h-10 rounded-xl bg-muted/50 border-border focus:ring-1 focus:ring-primary font-black text-xs text-foreground transition-all">
                <SelectValue placeholder="كل المواسم" />
              </SelectTrigger>
              <SelectContent className="font-cairo bg-card border-border shadow-xl rounded-2xl">
                <SelectItem value="all" className="font-bold">كل المواسم</SelectItem>
                <SelectItem value="winter" className="font-bold">شتاء ❄️</SelectItem>
                <SelectItem value="summer" className="font-bold">صيف ☀️</SelectItem>
                <SelectItem value="fall" className="font-bold">خريف 🍂</SelectItem>
                <SelectItem value="spring" className="font-bold">ربيع 🌸</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-2 border-t border-border">
             <Label className="text-[10px] font-black text-muted-foreground mb-2 block uppercase tracking-wider">نوع المنشور</Label>
             <Select
              value={filters.postType || "all"}
              onValueChange={(value) => handleFilterChange("postType", value)}
            >
              <SelectTrigger className="h-10 rounded-xl bg-muted/50 border-border focus:ring-1 focus:ring-primary font-black text-xs text-foreground transition-all">
                <SelectValue placeholder="كل الأنواع" />
              </SelectTrigger>
              <SelectContent className="font-cairo bg-card border-border shadow-xl rounded-2xl">
                <SelectItem value="all" className="font-bold">كل الأنواع 🌐</SelectItem>
                <SelectItem value="detailed" className="font-bold">رحلات تفصيلية 📑</SelectItem>
                <SelectItem value="quick" className="font-bold">بوستات سريعة ⚡</SelectItem>
                <SelectItem value="ask" className="font-bold">سؤال واستفسار ❓</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Trip Preview */}
      {upcomingTrip && (
        <Card className="shadow-sm border-0 bg-gradient-to-br from-primary to-primary/80 rounded-3xl text-primary-foreground relative overflow-hidden group transition-all duration-500 hover:shadow-xl hover:shadow-primary/20">
          <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-700">
             <Calendar className="w-24 h-24" />
          </div>
          <CardHeader className="pb-3 relative z-10">
            <CardTitle className="text-lg flex items-center justify-end gap-2 font-black">
              رحلتك القادمة
              <Calendar className="h-5 w-5" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 relative z-10">
            <h3 className="font-black text-xl tracking-tight leading-tight">{upcomingTrip.title}</h3>
            <div className="flex items-center justify-end gap-2 text-sm opacity-90 font-bold">
              {upcomingTrip.destination}
              <MapPin className="h-4 w-4" />
            </div>
            <div className="text-[10px] bg-black/20 backdrop-blur-md rounded-xl p-3 text-center font-black uppercase tracking-widest border border-white/10">
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
        <Card className="shadow-sm border border-border/50 bg-card rounded-3xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between bg-muted/30">
             <TrendingUp className="h-5 w-5 text-primary" />
             <CardTitle className="text-xl font-black text-foreground">نشاطك</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div className="bg-primary rounded-2xl p-5 text-primary-foreground shadow-lg shadow-primary/20 relative overflow-hidden group transition-all duration-500">
               <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 blur-2xl group-hover:scale-150 transition-transform duration-700" />
               <div className="relative z-10 flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2">
                     <Sparkles className="w-5 h-5 text-primary-foreground/60" />
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-foreground/80">سجل الاستكشاف</span>
                  </div>
                  <div className="text-5xl font-black tracking-tighter">{userStats.points || 0}</div>
                  <div className="text-[10px] font-bold text-primary-foreground/60 uppercase tracking-widest opacity-80">نقطة استكشاف دولية</div>
                  
                  <div className="w-full h-px bg-primary-foreground/10 my-1" />
                  
                  <div className="flex justify-between w-full text-[10px] font-black uppercase tracking-wider">
                     <div className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded-lg">
                        <Globe className="w-3.5 h-3.5 text-primary-foreground/70" />
                        <span>{userStats.citiesVisited} أختام</span>
                     </div>
                     <div className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded-lg">
                        <Award className="w-3.5 h-3.5 text-primary-foreground/70" />
                        <span>مستكشف نشط</span>
                     </div>
                  </div>
               </div>
            </div>
          </CardContent>
        </Card>
      )}
    </aside>
  );
};


export default LeftSidebar;
