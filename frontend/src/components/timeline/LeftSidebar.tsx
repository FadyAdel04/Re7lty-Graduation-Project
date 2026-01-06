import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PlusCircle, MapPin, TrendingUp, Bookmark, Calendar } from "lucide-react";

export interface TimelineFilters {
  showMyStories: boolean;
  showFollowed: boolean;
  showRecommended: boolean;
  onlyTrips: boolean;
  onlyTips: boolean;
}

interface LeftSidebarProps {
  filters: TimelineFilters;
  onFiltersChange: (filters: TimelineFilters) => void;
  userStats?: {
    countriesVisited: number;
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
  const handleFilterChange = (key: keyof TimelineFilters, value: boolean) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <aside className="space-y-4">
      {/* Quick Post Button */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <Link to="/trips/new">
            <Button className="w-full gap-2" size="lg">
              <PlusCircle className="h-5 w-5" />
              شارك لحظة
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Timeline Filters */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">تصفية الرحلات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Checkbox
              id="showMyStories"
              checked={filters.showMyStories}
              onCheckedChange={(checked) => handleFilterChange("showMyStories", checked as boolean)}
            />
            <Label htmlFor="showMyStories" className="text-sm font-normal cursor-pointer">
              رحلاتي فقط
            </Label>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <Checkbox
              id="showFollowed"
              checked={filters.showFollowed}
              onCheckedChange={(checked) => handleFilterChange("showFollowed", checked as boolean)}
            />
            <Label htmlFor="showFollowed" className="text-sm font-normal cursor-pointer">
              رحلات من أتابعهم
            </Label>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <Checkbox
              id="showRecommended"
              checked={filters.showRecommended}
              onCheckedChange={(checked) => handleFilterChange("showRecommended", checked as boolean)}
            />
            <Label htmlFor="showRecommended" className="text-sm font-normal cursor-pointer">
              رحلات مقترحة
            </Label>
          </div>

          <div className="border-t pt-3 mt-3 space-y-3">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id="onlyTrips"
                checked={filters.onlyTrips}
                onCheckedChange={(checked) => handleFilterChange("onlyTrips", checked as boolean)}
              />
              <Label htmlFor="onlyTrips" className="text-sm font-normal cursor-pointer">
                رحلات فقط
              </Label>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id="onlyTips"
                checked={filters.onlyTips}
                onCheckedChange={(checked) => handleFilterChange("onlyTips", checked as boolean)}
              />
              <Label htmlFor="onlyTips" className="text-sm font-normal cursor-pointer">
                نصائح فقط
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Trip Preview */}
      {upcomingTrip && (
        <Card className="shadow-sm bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              رحلتك القادمة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <h3 className="font-semibold">{upcomingTrip.title}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {upcomingTrip.destination}
            </div>
            <div className="text-sm text-muted-foreground">
              {new Date(upcomingTrip.date).toLocaleDateString('ar-EG', {
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
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              إحصائياتك
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">دول زرتها</span>
              <span className="text-2xl font-bold text-primary">{userStats.countriesVisited}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">قصص شاركتها</span>
              <span className="text-2xl font-bold text-secondary">{userStats.storiesShared}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">رحلات أنشأتها</span>
              <span className="text-2xl font-bold">{userStats.tripsCreated}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </aside>
  );
};

export default LeftSidebar;
