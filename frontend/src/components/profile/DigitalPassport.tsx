import React from 'react';
import { motion } from 'framer-motion';
import { Award, Globe, MapPin, Sparkles, Star, Calendar, ShieldCheck, Ticket, Bookmark, Layout } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export interface Stamp {
  id: string;
  city: string;
  date: string;
  image: string;
  rarity: 'common' | 'rare' | 'limited';
  season?: 'Winter' | 'Summer' | 'Spring' | 'Fall';
  points: number;
}

export const PassportBadge: React.FC<{ 
  count: number; 
  points: number; 
  className?: string;
  size?: 'sm' | 'md' 
}> = ({ count, points, className, size = 'md' }) => {
  const isSm = size === 'sm';
  return (
    <div className={cn(
      "inline-flex items-center bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg text-white shadow-lg shadow-blue-100 border border-blue-400/30 group cursor-pointer hover:scale-105 transition-transform",
      isSm ? "gap-1 px-1.5 py-0.5" : "gap-1.5 px-2.5 py-1",
      className
    )}>
       <Globe className={cn("text-blue-200 group-hover:rotate-12 transition-transform", isSm ? "w-2.5 h-2.5" : "w-3.5 h-3.5")} />
       <div className="flex flex-col">
          <span className={cn("font-black leading-none", isSm ? "text-[8px]" : "text-[10px]")}>{count} ختم</span>
          <span className={cn("font-bold text-blue-200 leading-none", isSm ? "text-[6px]" : "text-[8px]")}>{points} نقطة</span>
       </div>
    </div>
  );
};

interface DigitalPassportProps {
  stamps: Stamp[];
  userName: string;
}

const DigitalPassport: React.FC<DigitalPassportProps> = ({ stamps, userName }) => {
  const rarityConfig = {
    common: {
      border: 'border-slate-200',
      bg: 'bg-slate-50',
      text: 'text-slate-600',
      label: 'عادي',
      glow: ''
    },
    rare: {
      border: 'border-amber-200',
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      label: 'نادر',
      glow: 'shadow-[0_0_15px_rgba(251,191,36,0.3)]'
    },
    limited: {
      border: 'border-purple-200',
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      label: 'إصدار خاص',
      glow: 'shadow-[0_0_20px_rgba(168,85,247,0.4)] border-2 animate-pulse'
    }
  };

  return (
    <div className="space-y-12 py-6">
      {/* 1. Passport Header Info */}
      <div className="relative overflow-hidden rounded-[3rem] bg-indigo-900 p-8 md:p-12 text-white shadow-2xl">
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/10 rounded-full -ml-32 -mb-32 blur-3xl" />
         
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 text-center md:text-right">
               <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-xs font-bold uppercase tracking-widest text-indigo-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  وثيقة سفر رقمية معتمدة
               </div>
               <h2 className="text-4xl md:text-5xl font-black tracking-tight">
                 باسبور <span className="text-orange-400">{userName}</span>
               </h2>
               <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-indigo-100/70 font-bold">
                  <div className="flex items-center gap-2"><Globe className="w-4 h-4" /> {stamps.length} مدينة مكتشفة</div>
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  <div className="flex items-center gap-2"><Award className="w-4 h-4" /> {stamps.reduce((acc, s) => acc + s.points, 0)} نقطة استكشاف</div>
               </div>
            </div>

            <div className="relative">
               <div className="w-40 h-40 rounded-full border-[8px] border-white/10 flex items-center justify-center bg-white/5 backdrop-blur-xl relative">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-t-2 border-orange-400 rounded-full opacity-40" 
                  />
                  <Globe className="w-20 h-20 text-indigo-200" />
               </div>
               <div className="absolute -bottom-2 -right-2 bg-orange-500 text-white p-3 rounded-2xl shadow-xl rotate-12">
                  <Star className="w-6 h-6 fill-white" />
               </div>
            </div>
         </div>
      </div>

      {/* 2. Stamps Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
         {stamps.map((stamp, idx) => {
            const config = rarityConfig[stamp.rarity];
            return (
              <motion.div
                key={stamp.id}
                initial={{ opacity: 0, scale: 0.8, rotate: idx % 2 === 0 ? -5 : 5 }}
                whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                whileHover={{ scale: 1.05, rotate: idx % 2 === 0 ? 2 : -2 }}
                transition={{ type: "spring", stiffness: 300 }}
                className={cn(
                  "relative aspect-square rounded-[2.5rem] p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer group",
                  config.bg,
                  config.border,
                  config.glow,
                  "border-2"
                )}
              >
                {/* Stamp Outer Ring */}
                <div className="absolute inset-4 border-2 border-dashed opacity-20 border-current rounded-full animate-spin-slow pointer-events-none" />
                
                {/* Rarity Badge */}
                <Badge className={cn(
                  "absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black border-none shadow-sm",
                  stamp.rarity === 'common' ? "bg-slate-200 text-slate-700" :
                  stamp.rarity === 'rare' ? "bg-amber-400 text-white" : "bg-purple-600 text-white"
                )}>
                  {config.label}
                </Badge>

                {/* City Image/Circle */}
                <div className="relative w-24 h-24 mb-4">
                   <div className="absolute inset-0 bg-white rounded-full shadow-inner" />
                   <img 
                      src={stamp.image} 
                      alt={stamp.city} 
                      className="w-full h-full object-cover rounded-full p-1 grayscale group-hover:grayscale-0 transition-all duration-500"
                   />
                   {stamp.rarity === 'limited' && (
                     <div className="absolute -top-2 -right-2 bg-white rounded-full p-1.5 shadow-lg">
                        <Flame className="w-4 h-4 text-red-500" />
                     </div>
                   )}
                </div>

                <div className="space-y-1">
                   <h4 className={cn("text-xl font-black", config.text)}>{stamp.city}</h4>
                   <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-gray-400">
                      <Calendar className="w-3 h-3" />
                      {stamp.date}
                   </div>
                </div>

                {/* Watermark effect */}
                <div className="absolute bottom-6 right-6 opacity-5 pointer-events-none rotate-12">
                   <Award className="w-16 h-16" />
                </div>
                
                {/* Point reveal on hover */}
                <div className="absolute inset-0 bg-indigo-900/90 backdrop-blur-sm rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-6">
                   <Sparkles className="w-8 h-8 text-orange-400 mb-2" />
                   <span className="text-2xl font-black">+{stamp.points}</span>
                   <span className="text-xs font-bold text-indigo-200">نقطة استكشاف</span>
                   <div className="mt-4 flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold">
                      <Ticket className="w-3 h-3" />
                      {stamp.season && `خـتـم ${stamp.season === 'Winter' ? 'شـتـائـي' : stamp.season === 'Summer' ? 'صـيـفـي' : 'ربـيـعـي'}`}
                   </div>
                </div>
              </motion.div>
            );
         })}

         {/* Empty/Locked Slots for FOMO */}
         {stamps.length < 8 && Array.from({ length: 8 - stamps.length }).map((_, i) => (
           <div key={`locked-${i}`} className="aspect-square rounded-[2.5rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-200 group hover:border-indigo-100 transition-colors">
              <MapPin className="w-10 h-10 mb-2 group-hover:text-indigo-100" />
              <span className="text-[10px] font-bold uppercase tracking-widest group-hover:text-indigo-200">خـتـم مـقـفـول</span>
           </div>
         ))}
      </div>
    </div>
  );
};

const Flame = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.21 1.14-3.027"/></svg>
);

export default DigitalPassport;
