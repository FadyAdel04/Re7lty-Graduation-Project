import { Share2, Trophy, Gift, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HowItWorksSection = () => {
  const steps = [
    {
      id: "01",
      title: "شارك رحلتك",
      description: "هل قمت برحلة مميزة؟ وثق تجربتك، أضف صورك، وانشر خطة رحلتك لتفيد الآخرين.",
      icon: Share2,
      gradient: "from-blue-500 to-cyan-400",
      actionText: "ابدأ المشاركة الآن",
      actionUrl: "/trips/new",
      buttonVariant: "default" as const
    },
    {
      id: "02",
      title: "نافس وتصدر",
      description: "كل تفاعل (إعجاب، تعليق، حفظ) يرفع نقاطك. اجعل رحلتك تتصدر القائمة الأسبوعية.",
      icon: Trophy,
      gradient: "from-yellow-500 to-orange-400",
      actionText: "شاهد المتصدرين",
      actionUrl: "/leaderboard",
      buttonVariant: "outline" as const
    },
    {
      id: "03",
      title: "اربح الجوائز",
      description: "الرحلة صاحبة المركز الأول تفوز بجائزة مجانية مقدمة من شركائنا. سافر مجاناً!",
      icon: Gift,
      gradient: "from-purple-500 to-pink-400",
      actionText: "تصفح الجوائز",
      actionUrl: "/leaderboard", // Assuming this route or similar, or just generic
      buttonVariant: "ghost" as const
    },
  ];

  return (
    <section className="py-24 bg-slate-50 relative overflow-hidden">
       {/* Background Elements */}
       <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
       <div className="absolute -left-10 top-1/2 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl"></div>
       <div className="absolute -right-10 bottom-10 w-40 h-40 bg-orange-500/5 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        <div className="text-center mb-16">
          <div className="inline-block px-3 py-1 mb-4 text-xs font-semibold tracking-wider text-orange-600 uppercase bg-orange-100 rounded-full">
            خطوات بسيطة
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            رحلتك القادمة.. <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">علينا!</span> 
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            شارك تجاربك السياحية، نافس مع مجتمع المسافرين، واحصل على فرصة للفوز برحلات مدفوعة التكاليف بالكامل.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-[60px] left-0 w-full h-0.5 bg-gray-200 -z-10"></div>

          {steps.map((step, index) => (
            <div
              key={step.id}
              className="group relative flex flex-col bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
            >
              <div className="absolute top-6 left-6 text-4xl font-black text-gray-100 select-none group-hover:text-gray-50 transition-colors">
                {step.id}
              </div>

              {/* Icon */}
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300`}
              >
                <step.icon className="w-8 h-8 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-500 leading-relaxed mb-8 min-h-[80px]">
                  {step.description}
                </p>
              </div>

              {/* Action */}
              <div className="pt-4 border-t border-gray-50">
                <Link to={step.actionUrl}>
                   <Button 
                      variant={step.buttonVariant === 'outline' ? 'outline' : step.buttonVariant === 'ghost' ? 'ghost' : 'default'}
                      className={`w-full group-hover:bg-gray-900 group-hover:text-white transition-colors duration-300 ${step.buttonVariant === 'default' ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
                    >
                      {step.actionText}
                      <ArrowRight className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                   </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
