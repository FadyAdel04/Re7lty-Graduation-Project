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
  Gem
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
        <TooltipContent className="font-cairo p-4 min-w-[240px] border-0 shadow-2xl bg-gray-900 text-white rounded-2xl">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <p className="font-black text-sm text-yellow-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                {config.label}
              </p>
              <p className="text-xs text-gray-300 leading-relaxed">
                {config.description}
              </p>
            </div>

            {progression && progression.pointsNeeded > 0 && (
              <div className="pt-3 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400">الترقية القادمة</span>
                  <span className="text-[10px] font-black text-indigo-400">{progression.nextTierLabel}</span>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                   <div className="flex items-center justify-between bg-white/5 p-2 rounded-xl">
                      <span className="text-[10px] text-gray-400">نقاط متبقية</span>
                      <span className="text-sm font-black text-orange-500">+{progression.pointsNeeded}</span>
                   </div>
                   
                   <p className="text-[10px] text-gray-500 text-center font-bold">يمكنك تحقيق ذلك عبر:</p>
                   
                   <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white/5 p-2 rounded-xl text-center">
                         <p className="text-[10px] text-gray-400">رحلات</p>
                         <p className="text-sm font-black text-white">{progression.tripsNeeded}</p>
                      </div>
                      <div className="bg-white/5 p-2 rounded-xl text-center">
                         <p className="text-[10px] text-gray-400">قصص</p>
                         <p className="text-sm font-black text-white">{progression.storiesNeeded}</p>
                      </div>
                   </div>
                </div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default UserBadge;
