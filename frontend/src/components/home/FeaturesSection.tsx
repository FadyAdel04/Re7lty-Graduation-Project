import { Bot, Share2, Building2, CheckCircle2 } from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: Bot,
      title: "خطط بذكاء AI",
      description: "صمم رحلة أحلامك في ثوانٍ باستخدام مساعدنا الذكي الذي يقترح عليك أفضل الأماكن والأنشطة.",
      color: "bg-blue-100 text-blue-600",
      delay: "0",
    },
    {
      icon: Share2,
      title: "شارك واربح",
      description: "وثق رحلاتك وشاركها مع المجتمع لتنافس في لوحة المتصدرين وتربح رحلات مجانية.",
      color: "bg-orange-100 text-orange-600",
      delay: "100",
    },
    {
      icon: Building2,
      title: "احجز مع المحترفين",
      description: "تصفح عروض شركات السياحة المعتمدة واحجز باقات متكاملة بأسعار تنافسية ومضمونة.",
      color: "bg-green-100 text-green-600",
      delay: "200",
    },
  ];

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-sm font-medium mb-4">
            <CheckCircle2 className="h-4 w-4" />
            <span>لماذا تختار رحلتي؟</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            منصة واحدة.. كل ما تحتاجه للسفر
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            نجمع لك بين التخطيط الذكي، مجتمع المسافرين النشط، وأفضل عروض الشركات في مكان واحد.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="p-8 rounded-3xl border border-gray-100 bg-white shadow-lg shadow-gray-200/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-fade-up"
              style={{ animationDelay: `${feature.delay}ms` }}
            >
              <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-6`}>
                <feature.icon className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-500 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
