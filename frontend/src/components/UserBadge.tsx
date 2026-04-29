import React from "react";
import { cn } from "@/lib/utils";
import { 
  Sparkles, 
  Map, 
  Star, 
  Crown, 
  Zap, 
  Award,
  ShieldCheck,
  Gem,
  Badge
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type BadgeTier = "none" | "bronze" | "silver" | "gold" | "diamond" | "legend";

export interface UserBadgeProgression {
  pointsNeeded: number;
  tripsNeeded: number;
  storiesNeeded: number;
  nextTierLabel: string;
}

interface UserBadgeProps {
  tier: BadgeTier;
  showLabel?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  progression?: UserBadgeProgression;
}

const badgeConfigs = {
  none: {
    label: "مستكشف جديد",
    icon: Sparkles,
    color: "from-slate-400 to-slate-500",
    textColor: "text-white",
    description: "بداية رحلة استكشاف جديدة في عالم رحلتي",
  },
  bronze: {
    label: "مكتشف ناشئ",
    icon: Map,
    color: "from-orange-700 to-orange-900",
    textColor: "text-white",
    description: "بدأ في وضع بصمته على خريطة الرحلات",
  },
  silver: {
    label: "رحالة متمرس",
    icon: Award,
    color: "from-slate-300 to-slate-500",
    textColor: "text-slate-900",
    description: "رحالة يمتلك خبرة جيدة ومشاركات قيمة",
  },
  gold: {
    label: "خبير استكشاف",
    icon: Star,
    color: "from-amber-400 to-orange-600",
    textColor: "text-white",
    description: "خبير في مجال الاستكشاف وموثوق به في المجتمع",
  },
  diamond: {
    label: "نخبة الرحالة",
    icon: Gem,
    color: "from-cyan-400 to-indigo-600",
    textColor: "text-white",
    description: "من أفضل المساهمين الذين يقدمون محتوى استثنائي",
  },
  legend: {
    label: "أسطورة رحلتي",
    icon: Zap,
    color: "from-purple-600 via-pink-600 to-orange-500",
    textColor: "text-white",
    description: "أسطورة حقيقية ترك أثراً لا يمحى في تاريخ المنصة",
    animate: "animate-pulse shadow-[0_0_15px_rgba(168,85,247,0.5)]",
  },
};

const UserBadgeChildren = ({ tier, showLabel, size }: { tier: BadgeTier, showLabel?: boolean, size: "sm" | "md" | "lg" }) => {
  const config = badgeConfigs[tier] || badgeConfigs.none;
  const Icon = config.icon;

  const sizeClasses = {
    sm: "h-5 w-5 p-0.5",
    md: "h-7 w-7 p-1",
    lg: "h-10 w-10 p-2",
  };

  const labelClasses = {
    sm: "text-[10px] px-1.5 py-0.5",
    md: "text-xs px-2.5 py-1",
    lg: "text-sm px-4 py-1.5",
  };

  return (
    <div className={cn(
      "flex items-center gap-1.5 rounded-full transition-all duration-500",
      tier === 'legend' && "animate-in zoom-in duration-700",
    )}>
      <div className={cn(
        "flex items-center justify-center rounded-xl bg-gradient-to-br shadow-sm ring-1 ring-white/20",
        config.color,
        sizeClasses[size],
        tier === 'legend' && "animate-pulse"
      )}>
        <Icon className={cn("text-white", size === 'lg' ? "w-5 h-5" : "w-3 h-3")} />
      </div>
      
      {showLabel && (
        <span className={cn(
          "font-black tracking-tight rounded-lg bg-white/10 backdrop-blur-md border border-white/20 shadow-sm",
          config.textColor === 'text-white' ? "text-gray-900" : config.textColor,
          labelClasses[size]
        )}>
          {config.label}
        </span>
      )}
    </div>
  );
};

export const UserBadge: React.FC<UserBadgeProps> = ({ 
  tier, 
  showLabel = false, 
  className,
  size = "md",
  progression
}) => {
  const config = badgeConfigs[tier] || badgeConfigs.none;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("cursor-help inline-block", className)}>
            <UserBadgeChildren tier={tier} showLabel={showLabel} size={size} />
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="top"
          className="font-cairo p-5 min-w-[280px] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-gray-900/95 backdrop-blur-2xl text-white rounded-[2rem] overflow-hidden animate-in fade-in zoom-in duration-300"
        >
          {/* Animated Background Sparkle */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl" />
          
          <div className="space-y-5 relative z-10">
            <div className="flex items-center gap-4">
               <div className={cn("p-2.5 rounded-2xl bg-gradient-to-br shadow-lg", config.color)}>
                  <config.icon className="w-5 h-5 text-white" />
               </div>
               <div className="space-y-1">
                  <p className="font-black text-base text-white tracking-tight">
                    {config.label}
                  </p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3 text-indigo-400" />
                    مستوى الحساب الموثق
                  </p>
               </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed font-medium bg-white/5 p-3 rounded-2xl border border-white/5">
              {config.description}
            </p>

            {progression && progression.pointsNeeded > 0 && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-bold text-gray-400">الترقية القادمة</span>
                  <Badge className="text-[9px] font-black border-indigo-500/30 text-indigo-400 bg-indigo-500/5 px-2 py-0.5 rounded-full">
                    {progression.nextTierLabel}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                   <div className="bg-gradient-to-br from-white/10 to-white/5 p-3 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-1">
                      <p className="text-[9px] text-gray-500 font-bold">نقاط متبقية</p>
                      <p className="text-sm font-black text-orange-500">+{progression.pointsNeeded}</p>
                   </div>
                   <div className="bg-gradient-to-br from-white/10 to-white/5 p-3 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-1">
                      <p className="text-[9px] text-gray-500 font-bold">رحلات مطلوبة</p>
                      <p className="text-sm font-black text-white">{progression.tripsNeeded}</p>
                   </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-white/10 space-y-3">
               <p className="text-[10px] font-bold text-gray-500 text-center uppercase tracking-widest">تسلسل المستويات</p>
               <div className="grid grid-cols-1 gap-1">
                 {Object.entries(badgeConfigs).map(([key, badge]: [string, any]) => {
                    const isCurrent = tier === key;
                    const reqPoints = key === 'none' ? '0' : key === 'bronze' ? '30' : key === 'silver' ? '100' : key === 'gold' ? '350' : key === 'diamond' ? '800' : '2000';
                    
                    return (
                      <div key={key} className={cn(
                        "flex items-center justify-between p-2 rounded-xl transition-all",
                        isCurrent ? "bg-white/10 ring-1 ring-white/10 shadow-lg scale-[1.02]" : "opacity-40"
                      )}>
                         <div className="flex items-center gap-2.5">
                            <div className={cn("p-1.5 rounded-lg bg-gradient-to-br shadow-sm", badge.color)}>
                               <badge.icon className="w-2.5 h-2.5 text-white" />
                            </div>
                            <span className={cn("text-[11px] font-bold", isCurrent ? "text-white" : "text-gray-400")}>{badge.label}</span>
                         </div>
                         <div className="flex items-center gap-1.5">
                            <span className={cn("text-[10px] font-mono", isCurrent ? "text-indigo-400 font-black" : "text-gray-600")}>
                              {reqPoints}
                            </span>
                            {isCurrent && <Sparkles className="w-3 h-3 text-yellow-500 fill-yellow-500 animate-pulse" />}
                         </div>
                      </div>
                    );
                 })}
               </div>
            </div>
            
            <p className="text-[9px] text-gray-500 text-center leading-relaxed px-2">
               انشر رحلاتك وقصصك لرفع مستواك والحصول على مميزات حصرية في المجتمع.
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default UserBadge;
