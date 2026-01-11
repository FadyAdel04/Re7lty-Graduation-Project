import { Phone, MessageCircle, Globe, Star, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trip, Company } from "@/types/corporateTrips";
import { Separator } from "@/components/ui/separator";

interface BookingCardProps {
  trip: Trip;
  company: Company;
  sticky?: boolean;
}

const BookingCard = ({ trip, company, sticky = false }: BookingCardProps) => {
  const handleWhatsAppBooking = () => {
    const message = `مرحباً، أود حجز رحلة "${trip.title}" إلى ${trip.destination}`;
    const phoneNumber = company.contactInfo.whatsapp.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handlePhoneCall = () => {
    window.location.href = `tel:${company.contactInfo.phone}`;
  };

  const handleWebsiteBooking = () => {
    if (company.contactInfo.website) {
      window.open(company.contactInfo.website, '_blank');
    }
  };

  return (
    <Card className={`border-gray-200 shadow-xl ${sticky ? 'sticky top-24' : ''}`}>
      <CardContent className="p-6 space-y-6">
        {/* Price Section */}
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {trip.price} <span className="text-2xl text-gray-500">ج.م</span>
          </div>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{trip.duration}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
              <span className="font-semibold">{trip.rating}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Booking Methods */}
        <div className="space-y-3">
          <h4 className="font-bold text-gray-900 text-center mb-4">احجز الآن</h4>
          
          {trip.bookingMethod.whatsapp && (
            <Button
              className="w-full h-12 rounded-xl bg-[#25D366] hover:bg-[#20BA5A] text-white gap-2"
              onClick={handleWhatsAppBooking}
            >
              <MessageCircle className="h-5 w-5" />
              حجز عبر واتساب
            </Button>
          )}

          {trip.bookingMethod.phone && (
            <Button
              variant="outline"
              className="w-full h-12 rounded-xl border-gray-300 hover:bg-gray-50 gap-2"
              onClick={handlePhoneCall}
            >
              <Phone className="h-5 w-5" />
              اتصل الآن
            </Button>
          )}

          {trip.bookingMethod.website && company.contactInfo.website && (
            <Button
              variant="outline"
              className="w-full h-12 rounded-xl border-gray-300 hover:bg-gray-50 gap-2"
              onClick={handleWebsiteBooking}
            >
              <Globe className="h-5 w-5" />
              احجز من الموقع
            </Button>
          )}
        </div>

        <Separator />

        {/* Company Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${company.color} flex items-center justify-center text-white font-bold shadow-md overflow-hidden`}>
              {company.logo.startsWith('http') ? (
                <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
              ) : (
                company.logo
              )}
            </div>
            <div>
              <p className="font-bold text-gray-900">{company.name}</p>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                <span className="text-sm text-gray-600">{company.rating} تقييم</span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-orange-50 rounded-xl p-4 text-sm text-gray-700">
          <p className="text-center">
            💡 <span className="font-semibold">نصيحة:</span> احجز مبكراً لضمان توفر المقاعد
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookingCard;
