import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ArrowRight, Building2, Map, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

const CompanyHero = () => {
  return (
    <section className="relative w-full overflow-hidden bg-background min-h-[600px] flex items-center font-cairo transition-colors duration-500">
      {/* Abstract Background Elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 -skew-x-12 transform translate-x-20 z-0" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 rounded-full mix-blend-multiply filter blur-3xl opacity-70 z-0" />
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-primary/5 rounded-full mix-blend-multiply filter blur-3xl opacity-70 z-0" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          
          {/* Text Content */}
          <div className="w-full lg:w-1/2 text-right space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-sm text-sm font-black text-primary animate-fade-in-up">
              <span className="relative flex h-2.5 w-2.5">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
              </span>
              منصة الشركات المعتمدة
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-7xl font-black text-foreground leading-[1.2] tracking-tight">
              اكتشف أفضل <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-l from-primary to-primary-hover">
                عروض الشركات
              </span>
              <br />
              في مكان واحد
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl md:ml-auto font-bold">
              تصفح مئات الرحلات المنظمة من قبل شركات سياحية موثقة. قارن الأسعار، اطلع على التقييمات، واحجز رحلتك القادمة بكل ثقة وأمان.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Button 
                onClick={() => document.getElementById('featured-trips')?.scrollIntoView({ behavior: 'smooth' })}
                size="lg" 
                className="rounded-2xl h-14 px-8 text-base bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-1 font-black"
              >
                تصفح العروض
                <ArrowRight className="mr-2 h-5 w-5" />
              </Button>
              
              <Button 
                onClick={() => document.getElementById('register-company')?.scrollIntoView({ behavior: 'smooth' })}
                size="lg" 
                variant="outline" 
                className="rounded-2xl h-14 px-8 text-base border-border bg-card hover:bg-muted hover:text-primary transition-all font-black"
              >
                سجل شركتك
                <Building2 className="mr-2 h-5 w-5" />
              </Button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 pt-6 border-t border-border">
               <div>
                  <h4 className="text-2xl font-black text-foreground">50+</h4>
                  <p className="text-sm text-muted-foreground font-bold">شركة معتمدة</p>
               </div>
               <div className="w-px h-10 bg-border" />
               <div>
                  <h4 className="text-2xl font-black text-foreground">1000+</h4>
                  <p className="text-sm text-muted-foreground font-bold">رحلة ناجحة</p>
               </div>
               <div className="w-px h-10 bg-border" />
               <div className="flex items-center gap-2">
                  <div className="flex -space-x-3 space-x-reverse">
                     {[1,2,3,4].map(i => (
                       <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-muted overflow-hidden">
                          <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                       </div>
                     ))}
                  </div>
                  <p className="text-sm text-muted-foreground flex flex-col">
                    <span className="font-bold">انضم إلينا</span>
                    <span className="font-black text-foreground">مجتمع المسافرين</span>
                  </p>
               </div>
            </div>
          </div>

          {/* Visual Content - Album Effect */}
          <div className="hidden lg:flex w-full lg:w-1/2 relative min-h-[600px] items-center justify-center lg:justify-end perspective-1000">
             
             {/* Decorative Background Elements */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-gradient-to-tr from-primary/10 to-secondary/10 rounded-full blur-3xl animate-pulse-slow -z-10" />

             <div className="relative w-full max-w-[550px] aspect-square grid grid-cols-2 gap-4 p-4">
                
                {/* Alexandria Card - Top Left */}
                <div className="group relative rounded-[2rem] overflow-hidden shadow-xl transform translate-y-4 -rotate-3 hover:rotate-0 hover:z-20 hover:scale-105 transition-all duration-500 bg-card border border-border">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                  <img 
                    src="/assets/egypt-hero-collage.png" 
                    alt="Alexandria Citadel" 
                    className="w-full h-full object-cover object-[50%_5%]"
                  />
                  <div className="absolute bottom-4 right-4 z-20 text-white text-right">
                    <p className="font-black text-lg">الإسكندرية</p>
                    <p className="text-xs text-white/80 font-bold">عروس البحر المتوسط</p>
                  </div>
                </div>

                {/* Dahab Card - Top Right */}
                <div className="group relative rounded-[2rem] overflow-hidden shadow-xl transform -translate-y-4 rotate-2 hover:rotate-0 hover:z-20 hover:scale-105 transition-all duration-500 bg-card border border-border">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                  <img 
                    src="/assets/comp-hero2.jpg" 
                    alt="Dahab Blue Hole" 
                    className="w-full h-full object-cover object-[50%_35%]"
                  />
                  <div className="absolute bottom-4 right-4 z-20 text-white text-right">
                    <p className="font-black text-lg">دهب</p>
                    <p className="text-xs text-white/80 font-bold">سحر الطبيعة</p>
                  </div>
                </div>

                {/* Luxor Card - Bottom Left */}
                <div className="group relative rounded-[2rem] overflow-hidden shadow-xl transform translate-y-2 rotate-1 hover:rotate-0 hover:z-20 hover:scale-105 transition-all duration-500 bg-card border border-border">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                  <img 
                    src="/assets/comp-hero3.jpg" 
                    alt="Luxor Temple" 
                    className="w-full h-full object-cover object-[50%_65%]"
                  />
                  <div className="absolute bottom-4 right-4 z-20 text-white text-right">
                    <p className="font-black text-lg">الأقصر</p>
                    <p className="text-xs text-white/80 font-bold">عراقة التاريخ</p>
                  </div>
                </div>

                {/* Siwa Card - Bottom Right */}
                <div className="group relative rounded-[2rem] overflow-hidden shadow-xl transform -translate-y-2 -rotate-2 hover:rotate-0 hover:z-20 hover:scale-105 transition-all duration-500 bg-card border border-border">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                  <img 
                    src="/assets/comp-hero4.jpg" 
                    alt="Siwa Oasis" 
                    className="w-full h-full object-cover object-[50%_90%]"
                  />
                  <div className="absolute bottom-4 right-4 z-20 text-white text-right">
                    <p className="font-black text-lg">سيوة</p>
                    <p className="text-xs text-white/80 font-bold">جمال الواحات</p>
                  </div>
                </div>
                
                {/* Floating Info Card */}
                <div className="absolute inset-0 m-auto w-32 h-32 bg-background/20 backdrop-blur-md border border-white/20 rounded-full flex flex-col items-center justify-center text-center shadow-2xl z-30 pointer-events-none animate-pulse-soft">
                   <Map className="w-8 h-8 text-primary mb-1" />
                   <p className="text-foreground font-black text-lg leading-tight">وجهات<br/>مصرية</p>
                </div>
             </div>

          </div>

        </div>
      </div>
    </section>
  );
};


export default CompanyHero;
