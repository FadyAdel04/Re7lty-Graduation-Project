import { Copy, Users, Star, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { travelTemplates } from "@/lib/trips-data";

const Templates = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="py-12">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-secondary-light to-background py-16 mb-12">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              قوالب <span className="text-gradient">الرحلات</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              استخدم قوالب جاهزة من رحلات ناجحة واحفظ وقتك في التخطيط
            </p>
          </div>
        </section>

        {/* Templates Grid */}
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {travelTemplates.map((template, index) => (
              <Card
                key={template.id}
                className="group overflow-hidden shadow-float hover:shadow-float-lg transition-all duration-300 animate-slide-up border-0"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative h-48 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-card z-10" />
                  <img
                    src={template.image}
                    alt={template.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <Badge className="absolute top-3 right-3 z-20 bg-primary text-white">
                    قالب جاهز
                  </Badge>
                </div>

                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-3">{template.title}</h3>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        {template.duration}
                      </span>
                      <span className="font-bold text-primary">{template.budget}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Users className="h-4 w-4 text-secondary" />
                        {template.uses} استخدام
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-primary text-primary" />
                        {template.rating}
                      </span>
                    </div>
                  </div>

                  <Button className="w-full">
                    <Copy className="h-4 w-4 ml-2" />
                    استخدم هذا القالب
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Create Custom Template */}
          <Card className="bg-gradient-hero text-white shadow-orange">
            <CardContent className="p-8 text-center">
              <h2 className="text-3xl font-bold mb-4">أنشئ قالبك الخاص</h2>
              <p className="text-white/90 mb-6 max-w-2xl mx-auto">
                شارك رحلتك كقالب يمكن للآخرين استخدامه وساعد المسافرين في التخطيط لرحلاتهم
              </p>
              <Button variant="secondary" size="lg">
                ابدأ الإنشاء
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Templates;
