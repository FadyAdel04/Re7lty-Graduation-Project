import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, CheckCircle2 } from "lucide-react";
import { lazy, Suspense } from "react";

// Lazy load below-the-fold sections
const AISection = lazy(() => import("@/components/home/AISection"));
const DiscoverSection = lazy(() => import("@/components/home/DiscoverSection"));
const HowItWorksSection = lazy(() => import("@/components/home/HowItWorksSection"));
const DiscoverUsersTripsSection = lazy(() => import("@/components/home/DiscoverUsersTripsSection"));
const SeasonTripsSection = lazy(() => import("@/components/home/SeasonTripsSection"));

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-right transition-colors duration-500" dir="rtl">
      <Header />
      <main>
        <Hero />

        <Suspense fallback={<div className="h-40" />}>
          {/* How It Works Section */}
          <HowItWorksSection />

          {/* AI Showcase Section */}
          <AISection />

          {/* Discover Users Trips Section */}
          <div id="featured-trips-section">
            <DiscoverUsersTripsSection />
          </div>

          {/* Seasonal Trips Section */}
          <SeasonTripsSection />
        </Suspense>

        {/* Corporate Trips Teaser */}
        <section id="corporate-trips-section" className="py-24 bg-card text-foreground relative overflow-hidden border-y border-border">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)", backgroundSize: "40px 40px" }}></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-12">
              
              <div className="flex-1 space-y-6 text-center md:text-right">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-bold">
                  <Building2 className="h-4 w-4" />
                  جديد: رحلات الشركات
                </div>
                <h2 className="text-3xl md:text-5xl font-black leading-tight text-foreground">
                  هل تبحث عن تجربة <span className="text-primary">احترافية ومضمونة</span>؟
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed max-w-xl font-medium">
                  اكتشف مجموعة مختارة من الرحلات المنظمة بواسطة أفضل شركات السياحة المعتمدة. جودة عالية، برامج متكاملة، وحجوزات آمنة.
                </p>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm text-muted-foreground font-bold">
                  <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> شركات موثقة</span>
                  <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> أسعار تنافسية</span>
                  <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> دعم متواصل</span>
                </div>
                <div className="pt-4">
                  <Link to="/templates">
                    <Button size="lg" className="h-14 px-8 rounded-full bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                      استعرض الشركات
                      <ArrowLeft className="mr-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Decorative Visual */}
              <div className="flex-1 w-full max-w-lg">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary blur-[100px] opacity-10 rounded-full"></div>
                  <div className="relative bg-background/50 backdrop-blur-md border border-border p-8 rounded-[2.5rem] shadow-2xl transition-all duration-500 hover:shadow-primary/5">
                    <div className="flex items-center gap-4 mb-6 border-b border-border pb-6">
                       <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary/20">ST</div>
                       <div>
                         <div className="text-lg font-black text-foreground">سفاري ترافيل</div>
                         <div className="text-xs font-bold text-muted-foreground">شركة معتمدة</div>
                       </div>
                    </div>
                    <div className="space-y-4">
                      <div className="h-32 w-full bg-muted rounded-2xl overflow-hidden relative border border-border">
                         <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40 text-sm font-bold">صورة الرحلة</div>
                      </div>
                      <div className="h-4 w-3/4 bg-muted rounded-full"></div>
                      <div className="h-4 w-1/2 bg-muted rounded-full"></div>
                      <div className="flex justify-between pt-4">
                        <div className="h-10 w-24 bg-primary/10 rounded-xl border border-primary/20"></div>
                        <div className="h-10 w-24 bg-muted rounded-xl"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Discovery Map Teaser */}
        <DiscoverSection />

      </main>
      <Footer />
    </div>
  );
};


export default Index;
