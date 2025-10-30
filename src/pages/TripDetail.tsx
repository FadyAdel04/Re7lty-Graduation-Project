import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, Calendar, Heart, Share2, Bookmark, Star, Users, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TripComments from "@/components/TripComments";
import { egyptTrips } from "@/lib/trips-data";
import { useToast } from "@/hooks/use-toast";

const TripDetail = () => {
  const { id } = useParams();
  const trip = egyptTrips.find(t => t.id === id);
  const { toast } = useToast();
  
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(trip?.likes || 0);
  const [savesCount, setSavesCount] = useState(trip?.saves || 0);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    toast({
      title: isLiked ? "تم إلغاء الإعجاب" : "تم الإعجاب بالرحلة",
      description: isLiked ? "" : "يمكنك العثور عليها في قائمة المفضلات"
    });
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    setSavesCount(prev => isSaved ? prev - 1 : prev + 1);
    toast({
      title: isSaved ? "تم إلغاء الحفظ" : "تم حفظ الرحلة",
      description: isSaved ? "" : "يمكنك العثور عليها في قائمة المحفوظات"
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: trip?.title,
          text: trip?.description,
          url: url
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(url);
      toast({
        title: "تم نسخ الرابط",
        description: "يمكنك مشاركة الرابط الآن"
      });
    }
  };

  if (!trip) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">الرحلة غير موجودة</h1>
          <Button onClick={() => window.history.back()}>العودة</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pb-20">
        {/* Hero Image */}
        <div className="relative h-[60vh] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background z-10" />
          <img
            src={trip.image}
            alt={trip.title}
            className="w-full h-full object-cover"
          />
          
          {/* Floating Actions */}
          <div className="absolute top-6 left-6 z-20 flex gap-2">
            <Button
              variant="secondary"
              size="icon"
              className={`bg-background/80 backdrop-blur ${isLiked ? 'text-primary' : ''}`}
              onClick={handleLike}
            >
              <Heart className={`h-5 w-5 ${isLiked ? 'fill-primary' : ''}`} />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="bg-background/80 backdrop-blur"
              onClick={handleShare}
            >
              <Share2 className="h-5 w-5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className={`bg-background/80 backdrop-blur ${isSaved ? 'text-secondary' : ''}`}
              onClick={handleSave}
            >
              <Bookmark className={`h-5 w-5 ${isSaved ? 'fill-secondary' : ''}`} />
            </Button>
          </div>

          {/* Stats Badge */}
          <div className="absolute top-6 right-6 z-20 bg-background/80 backdrop-blur rounded-full px-4 py-2">
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Heart className="h-4 w-4 text-primary" />
                {likesCount}
              </span>
              <span className="flex items-center gap-1">
                <Bookmark className="h-4 w-4 text-secondary" />
                {savesCount}
              </span>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 -mt-20 relative z-20 space-y-6">
          <Card className="shadow-float-lg animate-slide-up">
            <CardContent className="p-8">
              {/* Title & Rating */}
              <div className="mb-6">
                <div className="flex items-start justify-between mb-3">
                  <h1 className="text-4xl font-bold text-gradient">{trip.title}</h1>
                  <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
                    <Star className="h-5 w-5 fill-primary text-primary" />
                    <span className="text-xl font-bold">{trip.rating}</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-4 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-secondary" />
                    <span className="font-medium">{trip.destination}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span>{trip.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <span>{trip.budget}</span>
                  </div>
                </div>
              </div>

              {/* Author */}
              <div className="flex items-center gap-4 pb-6 mb-6 border-b border-border">
                <Link
                  to={`/profile/${trip.author.replace(/\s+/g, '-')}`}
                  className="flex items-center gap-4 hover:opacity-80 transition-opacity"
                >
                  <div className="h-12 w-12 rounded-full bg-gradient-hero flex items-center justify-center text-white font-bold">
                    {trip.author.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold">{trip.author}</p>
                    <p className="text-sm text-muted-foreground">
                      {trip.authorFollowers.toLocaleString('ar-EG')} متابع
                    </p>
                  </div>
                </Link>
                <Button variant="outline" className="mr-auto">
                  متابعة
                </Button>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">عن الرحلة</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {trip.description}
                </p>
              </div>

              {/* Activities */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">الأنشطة والمعالم</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {trip.activities.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-4 bg-secondary-light rounded-xl"
                    >
                      <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <span className="font-medium">{activity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Map Preview */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">الموقع</h2>
                <div className="h-64 bg-muted rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-secondary mx-auto mb-2" />
                    <p className="text-muted-foreground">خريطة تفاعلية</p>
                    <Button variant="secondary" className="mt-4">
                      عرض على الخريطة
                    </Button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="flex-1">
                  احجز هذه الرحلة
                </Button>
                <Button size="lg" variant="outline" className="flex-1">
                  حفظ كقالب
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Comments Section */}
          <TripComments comments={trip.comments} />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TripDetail;
