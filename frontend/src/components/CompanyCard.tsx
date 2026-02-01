import { Star, Phone, ArrowUpRight, MapPin, Globe, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Company } from "@/types/corporateTrips";
import { motion } from "framer-motion";

interface CompanyCardProps extends Company {
  onViewTrips?: () => void;
  onContact?: () => void;
}

const CompanyCard = ({
  id,
  name,
  logo,
  rating,
  description,
  contactInfo,
  tags,
  color,
  tripsCount,
  onViewTrips,
  onContact
}: CompanyCardProps) => {
  const handleContact = () => {
    if (onContact) onContact();
    else window.open(`https://wa.me/${contactInfo.whatsapp.replace(/[^0-9]/g, '')}`, '_blank');
  };

  const handleViewTrips = () => {
    if (onViewTrips) onViewTrips();
    else document.getElementById(`company-${id}`)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Card className="group relative overflow-hidden border border-zinc-200/60 bg-white hover:bg-zinc-50/30 transition-all duration-700 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:shadow-zinc-200/50">
      {/* Visual Header Decoration */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-[0.03] rounded-bl-[5rem]`} />
      
      <CardContent className="p-8">
        <div className="flex flex-col h-full">
          {/* Top Info Area */}
          <div className="flex items-start justify-between mb-8">
            <div className="relative">
              <div className={`h-20 w-20 rounded-[1.75rem] bg-gradient-to-br ${color} p-0.5 shadow-2xl shadow-zinc-200`}>
                <div className="w-full h-full bg-white rounded-[1.6rem] flex items-center justify-center p-1 overflow-hidden">
                  {logo.startsWith('http') ? (
                    <img src={logo} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-br from-zinc-700 to-black uppercase">{logo}</span>
                  )}
                </div>
              </div>
              <div className="absolute -bottom-1 -left-1 bg-white p-1 rounded-full shadow-md">
                <div className="bg-emerald-500 rounded-full p-0.5">
                  <ShieldCheck className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <Badge variant="outline" className="border-zinc-200 bg-white/50 px-3 py-1 rounded-full font-black text-xs text-zinc-900 shadow-sm flex items-center gap-1.5">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {rating}
              </Badge>
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">موثق من الرحلتى</span>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-2xl font-black text-zinc-900 group-hover:text-orange-600 transition-colors tracking-tight">
                {name}
              </h3>
              <div className="flex items-center gap-2 mt-1.5 text-zinc-400">
                <MapPin className="h-3 w-3" />
                <span className="text-[11px] font-bold uppercase tracking-wider">{contactInfo.address || "القاهرة، مصر"}</span>
              </div>
            </div>

            <p className="text-zinc-500 text-sm leading-relaxed font-medium line-clamp-2">
              {description}
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              {tags.slice(0, 3).map((tag) => (
                <span key={tag} className="px-3 py-1.5 rounded-xl bg-zinc-100/70 text-[10px] font-black text-zinc-600 border border-transparent hover:border-zinc-200 transition-all uppercase tracking-tight">
                  {tag}
                </span>
              ))}
              {tags.length > 3 && <span className="text-[10px] font-black text-zinc-400 self-center">+{tags.length - 3}</span>}
            </div>
          </div>

          {/* Footer Stats & CTA */}
          <div className="mt-8 pt-6 border-t border-zinc-100 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-2xl font-black text-zinc-900">{tripsCount}</span>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">رحلة نشطة</span>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                onClick={handleViewTrips}
                className="h-12 w-12 rounded-2xl bg-zinc-100 hover:bg-orange-600 hover:text-white transition-all p-0 group/btn"
              >
                <ArrowUpRight className="h-5 w-5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
              </Button>
              <Button 
                onClick={handleContact}
                className="h-12 px-6 rounded-2xl bg-zinc-900 text-white font-black hover:bg-orange-600 shadow-xl shadow-zinc-200/50 transition-all"
              >
                تواصل
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompanyCard;
