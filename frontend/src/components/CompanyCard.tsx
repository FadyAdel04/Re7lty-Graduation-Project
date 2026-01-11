import { Star, Phone, ArrowUpRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Company } from "@/types/corporateTrips";

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
    if (onContact) {
      onContact();
    } else {
      // Default: Open WhatsApp
      window.open(`https://wa.me/${contactInfo.whatsapp.replace(/[^0-9]/g, '')}`, '_blank');
    }
  };

  const handleViewTrips = () => {
    if (onViewTrips) {
      onViewTrips();
    } else {
      // Default: Scroll to company section
      document.getElementById(`company-${id}`)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Card className="group border-gray-100 hover:border-orange-100 hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-300 rounded-[20px] overflow-hidden bg-white">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold text-xl shadow-lg overflow-hidden`}>
            {logo.startsWith('http') ? (
              <img src={logo} alt={name} className="w-full h-full object-cover" />
            ) : (
              logo
            )}
          </div>
          <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-100 gap-1">
            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
            {rating}
          </Badge>
        </div>

        {/* Info */}
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
          {name}
        </h3>
        <p className="text-gray-500 text-sm leading-relaxed mb-4 min-h-[40px]">
          {description}
        </p>

        {/* Contact Info Preview */}
        {contactInfo.address && (
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
            <MapPin className="h-3 w-3" />
            <span>{contactInfo.address}</span>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tags.map((tag) => (
            <span key={tag} className="px-2.5 py-1 rounded-lg bg-gray-50 text-xs font-medium text-gray-600 border border-gray-100">
              {tag}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="mb-4 text-sm text-gray-500">
          <span className="font-semibold text-gray-700">{tripsCount}</span> رحلة متاحة
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 mt-auto">
          <Button 
            variant="outline" 
            className="w-full rounded-xl border-gray-200 hover:bg-gray-50 hover:text-orange-600 hover:border-orange-200 group/btn"
            onClick={handleViewTrips}
          >
            عرض الرحلات
            <ArrowUpRight className="h-4 w-4 mr-2 transition-transform group-hover/btn:-translate-y-0.5 group-hover/btn:-translate-x-0.5" />
          </Button>
          <Button 
            className="w-full rounded-xl bg-gray-900 text-white hover:bg-orange-600 transition-colors"
            onClick={handleContact}
          >
            <Phone className="h-4 w-4 ml-2" />
            تواصل
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompanyCard;
