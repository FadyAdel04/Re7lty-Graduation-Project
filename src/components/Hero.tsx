import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { MapPin, Globe } from "lucide-react";

const Hero = () => {
  return (
    <section
      className="relative py-16 sm:py-24 lg:py-32 px-4 bg-cover bg-center"
      style={{ backgroundImage: `url('/assets/background.jpg')` }}
    >
      {/* Subtle Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-secondary-light/30 via-background to-background -z-10" />
      
      <div className="container mx-auto max-w-7xl">
        <div className="text-center space-y-8 animate-slide-up">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
              اكتشف جمال
              <span className="text-secondary block mt-2">مصر الساحر</span>
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              شارك رحلاتك، استلهم من تجارب الآخرين، وخطط لمغامرتك القادمة
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4">
            <Link to="/trips/new">
              <Button size="lg" className="w-full sm:w-auto min-w-[200px] rounded-full">
                <MapPin className="ml-2 h-5 w-5" />
                شارك رحلتك
              </Button>
            </Link>
            <Link to="/templates">
              <Button size="lg" variant="outline" className="w-full sm:w-auto min-w-[200px] rounded-full">
                <Globe className="ml-2 h-5 w-5" />
                استعرض الوجهات
              </Button>
            </Link>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 max-w-4xl mx-auto pt-12 sm:pt-16">
            <div className="space-y-1 p-4 rounded-2xl bg-background/50 backdrop-blur-sm border border-border/50">
              <div className="text-3xl sm:text-4xl font-bold text-primary">2,500+</div>
              <div className="text-xs sm:text-sm text-muted-foreground">مسافر</div>
            </div>
            <div className="space-y-1 p-4 rounded-2xl bg-background/50 backdrop-blur-sm border border-border/50">
              <div className="text-3xl sm:text-4xl font-bold text-secondary">8</div>
              <div className="text-xs sm:text-sm text-muted-foreground">وجهات</div>
            </div>
            <div className="space-y-1 p-4 rounded-2xl bg-background/50 backdrop-blur-sm border border-border/50">
              <div className="text-3xl sm:text-4xl font-bold text-primary">5,000+</div>
              <div className="text-xs sm:text-sm text-muted-foreground">رحلة</div>
            </div>
            <div className="space-y-1 p-4 rounded-2xl bg-background/50 backdrop-blur-sm border border-border/50">
              <div className="text-3xl sm:text-4xl font-bold text-secondary">98%</div>
              <div className="text-xs sm:text-sm text-muted-foreground">رضا</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
