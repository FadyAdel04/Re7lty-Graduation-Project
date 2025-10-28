import { Plane, Compass, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-secondary-light to-background py-20 md:py-32">
      {/* Decorative Elements */}
      <div className="absolute top-10 right-10 opacity-10 animate-float">
        <Plane className="h-24 w-24 text-primary" />
      </div>
      <div className="absolute bottom-20 left-10 opacity-10 animate-float" style={{ animationDelay: '1s' }}>
        <Compass className="h-32 w-32 text-secondary" />
      </div>

      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center animate-slide-up">
          <h1 className="mb-6 text-4xl font-bold leading-tight md:text-6xl">
            اكتشف العالم مع
            <span className="text-gradient"> رحلتي</span>
          </h1>
          
          <p className="mb-8 text-lg text-muted-foreground md:text-xl">
            شارك تجارب سفرك، اكتشف وجهات جديدة، وخطط لرحلتك القادمة مع مجتمع المسافرين
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button variant="default" size="lg" className="min-w-[200px]">
              ابدأ رحلتك الآن
            </Button>
            <Button variant="outline" size="lg" className="min-w-[200px]">
              استكشف الرحلات
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16">
            <div className="p-6 bg-card rounded-2xl shadow-float">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-gradient mb-1">10K+</div>
              <div className="text-sm text-muted-foreground">مسافر نشط</div>
            </div>
            
            <div className="p-6 bg-card rounded-2xl shadow-float">
              <div className="flex items-center justify-center mb-2">
                <Compass className="h-8 w-8 text-secondary" />
              </div>
              <div className="text-3xl font-bold text-gradient mb-1">500+</div>
              <div className="text-sm text-muted-foreground">وجهة سياحية</div>
            </div>
            
            <div className="p-6 bg-card rounded-2xl shadow-float">
              <div className="flex items-center justify-center mb-2">
                <Plane className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-gradient mb-1">2K+</div>
              <div className="text-sm text-muted-foreground">رحلة مشتركة</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
