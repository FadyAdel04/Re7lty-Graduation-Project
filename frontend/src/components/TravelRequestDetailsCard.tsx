import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MapPin, Calendar, Users, Wallet, Hotel, Landmark, UtensilsCrossed, Sparkles, ChevronDown } from "lucide-react";
import { useState } from "react";

export interface TravelRequestDetails {
  destination?: string;
  travelDates?: { checkIn?: string; checkOut?: string };
  numberOfTravelers?: number;
  budget?: string;
  tripDetails?: {
    days?: number;
    attractionsCount?: number;
    restaurantsCount?: number;
    startCity?: string;
    hotelNeeded?: boolean | null;
    estimatedCost?: number;
  };
  message?: string;
  status?: string;
  quotedPrice?: number;
  companyNotes?: string;
}

function formatBudget(budget?: string) {
  if (budget === "low") return "اقتصادية";
  if (budget === "high") return "فاخرة";
  return budget || "متوسطة";
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: "قيد المراجعة", className: "bg-amber-100 text-amber-800" },
  viewed: { label: "تمت المشاهدة", className: "bg-blue-100 text-blue-800" },
  responded: { label: "تم الرد", className: "bg-indigo-100 text-indigo-800" },
  confirmed: { label: "مؤكد", className: "bg-emerald-100 text-emerald-800" },
  declined: { label: "مرفوض", className: "bg-rose-100 text-rose-800" },
};

interface TravelRequestDetailsCardProps {
  request: TravelRequestDetails;
  compact?: boolean;
  className?: string;
  /** When true, shows a toggle; defaults collapsed in compact chat */
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export function TravelRequestDetailsCard({
  request,
  compact,
  className,
  collapsible,
  defaultExpanded,
}: TravelRequestDetailsCardProps) {
  const [expanded, setExpanded] = useState(
    defaultExpanded ?? (collapsible ? false : true)
  );
  const details = request.tripDetails || {};
  const statusInfo = request.status ? STATUS_LABELS[request.status] : null;

  const items = [
    { icon: MapPin, label: "الوجهة", value: request.destination },
    { icon: Calendar, label: "المدة", value: details.days != null ? `${details.days} أيام` : null },
    { icon: Wallet, label: "الميزانية", value: formatBudget(request.budget) },
    { icon: Users, label: "المسافرون", value: `${request.numberOfTravelers || 1}` },
    { icon: MapPin, label: "مدينة الانطلاق", value: details.startCity },
    { icon: Landmark, label: "المعالم", value: details.attractionsCount != null ? `${details.attractionsCount} مكان` : null },
    { icon: UtensilsCrossed, label: "المطاعم", value: details.restaurantsCount != null ? `${details.restaurantsCount} مطعم` : null },
    { icon: Hotel, label: "الإقامة", value: details.hotelNeeded ? "مطلوبة" : details.hotelNeeded === false ? "غير مطلوبة" : null },
    {
      icon: Sparkles,
      label: "التكلفة التقديرية",
      value: details.estimatedCost != null ? `${Number(details.estimatedCost).toLocaleString()} ج.م` : null,
    },
    {
      icon: Calendar,
      label: "تاريخ الوصول",
      value: request.travelDates?.checkIn || null,
    },
    {
      icon: Calendar,
      label: "تاريخ المغادرة",
      value: request.travelDates?.checkOut || null,
    },
  ].filter((i) => i.value);

  const summaryLine = [
    request.destination,
    details.days != null ? `${details.days} أيام` : null,
    formatBudget(request.budget),
  ]
    .filter(Boolean)
    .join(" · ");

  if (collapsible && !expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className={cn(
          "w-full flex items-center justify-between gap-2 rounded-2xl border border-indigo-100 dark:border-indigo-500/20",
          "bg-indigo-50/80 dark:bg-indigo-950/20 px-3 py-2.5 text-right transition-colors hover:bg-indigo-100/80",
          className
        )}
      >
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black text-indigo-600">تفاصيل طلب الرحلة</p>
          <p className="text-xs font-bold text-foreground truncate">{summaryLine}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {statusInfo && (
            <Badge className={cn("text-[10px] font-black", statusInfo.className)}>{statusInfo.label}</Badge>
          )}
          <ChevronDown className="w-4 h-4 text-indigo-500" />
        </div>
      </button>
    );
  }

  return (
    <div
      className={cn(
        "bg-indigo-50/80 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl",
        compact ? "p-3" : "p-4",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <p className={cn("font-black text-indigo-700 dark:text-indigo-300", compact ? "text-xs" : "text-sm")}>
          تفاصيل طلب الرحلة
        </p>
        <div className="flex items-center gap-2">
          {statusInfo && (
            <Badge className={cn("text-[10px] font-black", statusInfo.className)}>{statusInfo.label}</Badge>
          )}
          {collapsible && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[10px] font-black text-indigo-600"
              onClick={() => setExpanded(false)}
            >
              إخفاء
            </Button>
          )}
        </div>
      </div>

      <div className={cn("grid gap-2", compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3")}>
        {items.map((item) => (
          <div key={item.label} className="flex items-start gap-2 text-xs font-bold">
            <item.icon className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-muted-foreground block text-[10px]">{item.label}</span>
              <span className="text-foreground">{item.value}</span>
            </div>
          </div>
        ))}
      </div>

      {request.message && !compact && (
        <p className="mt-3 text-xs font-bold text-muted-foreground border-t border-indigo-100 dark:border-indigo-500/20 pt-3">
          {request.message}
        </p>
      )}

      {request.quotedPrice != null && (
        <p className="mt-2 text-xs font-black text-emerald-700">
          السعر المعتمد: {Number(request.quotedPrice).toLocaleString()} ج.م
        </p>
      )}

      {request.companyNotes && (
        <p className="mt-1 text-xs font-bold text-muted-foreground">ملاحظات الشركة: {request.companyNotes}</p>
      )}
    </div>
  );
}
