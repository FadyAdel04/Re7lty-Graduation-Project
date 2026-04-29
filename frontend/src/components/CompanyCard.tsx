import { Star, Phone, ArrowUpRight, MapPin, Globe, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Company } from "@/types/corporateTrips";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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
    <Card className="group relative overflow-hidden border border-border bg-card hover:bg-muted/30 transition-all duration-700 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:shadow-primary/5 font-cairo">
      {/* Visual Header Decoration */}
      <div className={cn(
        "absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-[0.05] rounded-bl-[5rem]",
        color
      )} />
      
      <CardContent className="p-8">
        <div className="flex flex-col h-full">
          {/* Top Info Area */}
          <div className="flex items-start justify-between mb-8">
            <div className="relative">
              <div className={cn(
                "h-20 w-20 rounded-[1.75rem] bg-gradient-to-br p-0.5 shadow-2xl shadow-black/5",
                color
              )}>
                <div className="w-full h-full bg-background rounded-[1.6rem] flex items-center justify-center p-1 overflow-hidden">
                  {logo.startsWith('http') ? (
                    <img src={logo} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70 uppercase">{logo}</span>
                  )}
                </div>
              </div>
              <div className="absolute -bottom-1 -left-1 bg-background p-1 rounded-full shadow-md">
                <div className="bg-emerald-500 rounded-full p-0.5">
                  <ShieldCheck className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <Badge variant="outline" className="border-border bg-background/50 px-3 py-1 rounded-full font-black text-xs text-foreground shadow-sm flex items-center gap-1.5">
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                {rating}
              </Badge>
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">موثق من الرحلتى</span>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 space-y-4 text-right">
            <div>
              <h3 className="text-2xl font-black text-foreground group-hover:text-primary transition-colors tracking-tight">
                {name}
              </h3>
              <div className="flex items-center gap-2 mt-1.5 text-muted-foreground justify-end">
                <span className="text-[11px] font-bold uppercase tracking-wider">{contactInfo.address || "القاهرة، مصر"}</span>
                <MapPin className="h-3.5 w-3.5 text-primary" />
              </div>
            </div>

            <p className="text-muted-foreground text-sm leading-relaxed font-bold line-clamp-2">
              {description}
            </p>

            <div className="flex flex-wrap gap-2 pt-2 justify-end">
              {tags.slice(0, 3).map((tag) => (
                <span key={tag} className="px-3 py-1.5 rounded-xl bg-muted text-[10px] font-black text-foreground border border-transparent hover:border-border transition-all uppercase tracking-tight">
                  {tag}
                </span>
              ))}
              {tags.length > 3 && <span className="text-[10px] font-black text-muted-foreground self-center">+{tags.length - 3}</span>}
            </div>
          </div>

          {/* Footer Stats & CTA */}
          <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
            <div className="flex flex-col items-start">
              <span className="text-2xl font-black text-foreground leading-none">{tripsCount}</span>
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mt-1">رحلة نشطة</span>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                onClick={handleViewTrips}
                className="h-12 w-12 rounded-2xl bg-muted hover:bg-primary hover:text-primary-foreground transition-all p-0 group/btn"
              >
                <ArrowUpRight className="h-5 w-5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
              </Button>
              <Button 
                onClick={handleContact}
                className="h-12 px-8 rounded-2xl bg-primary text-primary-foreground font-black hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all"
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
