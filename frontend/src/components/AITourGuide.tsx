import React, { useState, useEffect } from "react";
import Joyride, { Step, CallBackProps, STATUS } from "react-joyride";
import { useUser } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, ChevronRight, PlayCircle, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";

const AITourGuide = () => {
  const [run, setRun] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const { theme } = useTheme();

  useEffect(() => {
    const handleOpenTour = () => setShowAssistant(true);
    window.addEventListener("open-ai-tour", handleOpenTour);
    return () => window.removeEventListener("open-ai-tour", handleOpenTour);
  }, []);

  const steps: Step[] = [
    {
      target: "#nav-home",
      title: "أهلاً بك في رحلتي",
      content: "منصة رحلتي هي رفيقك المتكامل للسفر، تجمع بين التواصل الاجتماعي وحجز الرحلات والتخطيط بالذكاء الاصطناعي. استكشف شريط التنقل لمعرفة أين يمكنك الذهاب.",
      placement: "bottom",
      disableBeacon: true,
      data: { page: "/" }
    },
    {
      target: "#nav-timeline",
      title: "الجدول الزمني للرحلات",
      content: "هنا يشارك المجتمع أحدث مغامراتهم ونصائحهم وأسئلتهم. تصفح المنشورات لترى ما يشاركه المسافرون الآخرون.",
      placement: "bottom",
      data: { page: "/timeline" }
    },
    {
      target: "#timeline-posts",
      title: "تفاعل مع الرحلات",
      content: "يمكنك الإعجاب والتعليق وحفظ الرحلات التي تعجبك. اضغط على أيقونة القلب للتعبير عن إعجابك أو العلامة المرجعية للحفظ لاحقاً.",
      placement: "top",
      data: { page: "/timeline" }
    },
    {
      target: "#nav-discover",
      title: "اكتشف آفاقاً جديدة",
      content: "استخدم صفحة الاكتشاف للبحث عن وجهات محددة أو تصفح الرحلات الرائجة. جرب البحث عن وجهة أحلامك القادمة.",
      placement: "bottom",
      data: { page: "/discover" }
    },
    {
      target: "#live-pulse-map",
      title: "استكشف الخريطة",
      content: "تعرض لك خريطة 'النبض الحي' ما يحدث حول العالم في الوقت الفعلي. اضغط على علامات الخريطة لمشاهدة الرحلات في أماكن محددة.",
      placement: "top",
      data: { page: "/discover" }
    },
    {
      target: "#nav-create-trip",
      title: "ابدأ قصتك",
      content: "جاهز للمشاركة؟ تتيح لك صفحة إنشاء رحلة توثيق رحلتك بالتفصيل. أدخل وجهتك وتواريخ سفرك لتبدأ مسار رحلتك.",
      placement: "bottom",
      data: { page: "/trips/new" }
    },
    {
      target: "#nav-templates",
      title: "احجز رحلات احترافية",
      content: "استكشف رحلات مختارة من وكالات وشركات سفر محترفة. استمتع بسفر خالٍ من القلق مع رحلات مخططة مسبقاً وحجوزات آمنة.",
      placement: "bottom",
      data: { page: "/agency" }
    },
    {
      target: "#trip-itinerary",
      title: "تفاصيل الرحلة",
      content: "اطلع على تفاصيل أي رحلة لمشاهدة المسار الكامل والخريطة والتوصيات. كل التفاصيل التي تحتاجها لمغامرتك التالية.",
      placement: "top",
      data: { page: "/trips/6998e227415440ca3e34b215" } 
    },
    {
      target: "#nav-profile",
      title: "بروفايلك ورسائلك",
      content: "من هنا يمكنك الوصول لرسائلك الخاصة، وإدارة ملفك الشخصي، وتغيير مظهر الموقع، أو بدء هذه الجولة مرة أخرى في أي وقت.",
      placement: "bottom",
      data: { page: "/" }
    },
    {
      target: "#group-chat-announcements",
      title: "دردشة مجموعة الرحلة",
      content: "بمجرد حجز رحلة، ستنضم إلى دردشة جماعية مع المشاركين الآخرين والشركة للحصول على تحديثات وإعلانات فورية.",
      placement: "top",
      data: { page: "/trip-groups" }
    },
    {
      target: "#ai-chat-input",
      title: "تخطيط مدعوم بالذكاء الاصطناعي",
      content: "لست متأكداً أين تذهب؟ دردش مع مساعدنا الذكي للحصول على مقترحات مخصصة بناءً على ميزانيتك. اطلب منه 'خطط لرحلة لمدة 3 أيام لدهب'.",
      placement: "top",
      data: { page: "/trip-assistant" }
    },
    {
      target: "#ai-trip-plan-preview",
      title: "راجع خطة الذكاء الاصطناعي",
      content: "يقوم الذكاء الاصطناعي بإنشاء مسار رحلة مخصص لك. يمكنك مراجعته هنا ثم تصديره إلى قائمة رحلاتك الخاصة.",
      placement: "top",
      data: { page: "/trip-assistant" }
    },
    {
      target: "#trip-ai-widget",
      title: "دائماً هنا للمساعدة",
      content: "مساعدنا الذكي متاح من أي صفحة للإجابة على أسئلتك السريعة. اضغط على الأيقونة العائمة في أي وقت تحتاجه.",
      placement: "top",
    },
    {
      target: "#user-stats",
      title: "ملفك الشخصي للسفر",
      content: "تتبع رحلاتك ومتابعيك وأوسمة السفر الخاصة بك. ملفك الشخصي هو جواز سفرك الرقمي في عالم رحلتي.",
      placement: "top",
      data: { page: "/user/me" }
    },
    {
      target: "#create-memories-btn",
      title: "احفظ ذكرياتك",
      content: "أنشئ عروضاً وقصصاً جميلة من رحلاتك. شاركها مع المجتمع أو قم بتصديرها كمقاطع فيديو.",
      placement: "top",
      data: { page: "/user/me" }
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index, action } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      setRun(false);
      setStepIndex(0);
    } else if (type === "step:after" || type === "error:target_not_found") {
      const isNextAction = action === "next" || type === "error:target_not_found";
      
      if (isNextAction) {
        const nextIndex = index + 1;
        if (nextIndex < steps.length) {
          const nextStep = steps[nextIndex];
          
          if (nextStep.data?.page) {
            let nextPage = nextStep.data.page;
            if (nextPage === "/user/me") {
              if (user?.id) {
                nextPage = `/user/${user.id}`;
              } else {
                setStepIndex(nextIndex + 2);
                return;
              }
            }

            if (location.pathname !== nextPage) {
              setRun(false);
              navigate(nextPage);
              
              const isHeavyPage = nextPage.includes('/trips/') || 
                                nextPage.includes('/trip-groups') || 
                                nextPage.includes('/user/') || 
                                nextPage.includes('/company/');
              
              const delay = isHeavyPage ? 1800 : 1200;
              
              setTimeout(() => {
                setStepIndex(nextIndex);
                setRun(true);
              }, delay);
            } else {
              setStepIndex(nextIndex);
            }
          } else {
            setStepIndex(nextIndex);
          }
        }
      }
    }
  };

  const startTour = () => {
    setShowAssistant(false);
    if (location.pathname !== "/") {
        navigate("/");
        setTimeout(() => setRun(true), 800);
    } else {
        setRun(true);
    }
  };

  const isDark = theme === "dark";

  return (
    <>
      <AnimatePresence>
        {showAssistant && (
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xl" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 30 }}
              className="bg-card/95 backdrop-blur-2xl rounded-[3rem] shadow-[0_40px_120px_rgba(0,0,0,0.5)] w-full max-w-lg overflow-hidden border border-border font-cairo max-h-[90vh] flex flex-col"
            >
              <div className="p-8 sm:p-10 md:p-12 relative overflow-y-auto custom-scrollbar">
                <button 
                  onClick={() => setShowAssistant(false)}
                  className="absolute top-6 left-6 p-3 hover:bg-rose-500/10 rounded-2xl transition-all z-10 group"
                >
                  <X className="w-5 h-5 text-muted-foreground group-hover:text-rose-500" />
                </button>

                <div className="flex flex-col items-center">
                  <motion.div 
                    animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }} 
                    transition={{ duration: 6, repeat: Infinity }}
                    className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/20"
                  >
                    <Bot className="w-12 h-12 text-primary" />
                  </motion.div>

                  <h3 className="text-3xl font-black text-foreground mb-4 text-center tracking-tighter">أهلاً بك يا رحالة! 👋</h3>
                  <p className="text-muted-foreground font-bold mb-8 leading-relaxed px-4 text-base text-center">
                    أنا مساعدك الذكي، سآخذك في جولة ممتعة لاكتشاف خبايا منصة رحلتي وتسهيل مغامرتك القادمة.
                  </p>

                  <div className="space-y-4 w-full mb-10 text-right bg-muted/50 p-8 rounded-[2.5rem] border border-border shadow-inner">
                    {[
                      { text: "مشاركة تجارب السفر الفريدة", icon: "🌍" },
                      { text: "استكشاف رحلات المبدعين الآخرين", icon: "✨" },
                      { text: "تخطيط رحلاتك بالذكاء الاصطناعي", icon: "🤖" },
                      { text: "حجز أفضل العروض من الشركات", icon: "🎫" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-4 text-foreground">
                        <div className="h-10 w-10 rounded-2xl bg-background shadow-lg flex items-center justify-center text-xl shrink-0 border border-border">
                          {item.icon}
                        </div>
                        <span className="font-black text-base break-words">{item.text}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col w-full gap-4 px-4 sticky bottom-0 bg-transparent pt-2">
                    <Button 
                      onClick={startTour}
                      className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-lg gap-4 shadow-2xl shadow-primary/30 active:scale-95 transition-all"
                    >
                      <PlayCircle className="w-6 h-6" />
                      ابدأ مغامرتي الآن
                    </Button>
                    <Button 
                      variant="ghost"
                      onClick={() => setShowAssistant(false)}
                      className="w-full h-12 rounded-2xl font-black text-sm text-muted-foreground hover:text-primary hover:bg-primary/10"
                    >
                      سأتجول بمفردي شكراً
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Joyride
        steps={steps}
        run={run}
        stepIndex={stepIndex}
        continuous
        showProgress
        showSkipButton
        disableScrolling={false}
        scrollOffset={140}
        spotlightPadding={10}
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: "hsl(var(--primary))",
            textColor: isDark ? "#ffffff" : "#1f2937",
            backgroundColor: isDark ? "#1f2937" : "#ffffff",
            overlayColor: "rgba(0, 0, 0, 0.8)",
            zIndex: 1000,
          },
          tooltipContainer: {
            textAlign: "right",
            direction: "rtl",
            borderRadius: "32px",
            padding: "8px",
            fontFamily: "Cairo, sans-serif",
            maxWidth: "95vw",
          },
          tooltip: {
            borderRadius: "32px",
            padding: "24px",
            boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
            width: "360px",
            maxWidth: "100%",
            backgroundColor: isDark ? "#1f2937" : "#ffffff",
            border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.05)",
          },
          tooltipTitle: {
            fontSize: "22px",
            fontWeight: "900",
            marginBottom: "16px",
            color: isDark ? "#ffffff" : "#1f2937",
            letterSpacing: "-0.02em",
          },
          tooltipContent: {
            fontSize: "17px",
            fontWeight: "700",
            lineHeight: "1.8",
            color: isDark ? "#cbd5e1" : "#4b5563",
          },
          buttonNext: {
            borderRadius: "18px",
            backgroundColor: "hsl(var(--primary))",
            padding: "14px 32px",
            fontWeight: "900",
            fontSize: "14px",
            marginLeft: "0",
            marginRight: "auto",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            color: "hsl(var(--primary-foreground))",
          },
          buttonBack: {
            marginLeft: "0",
            marginRight: "15px",
            fontWeight: "900",
            color: "#9ca3af",
            fontSize: "14px",
          },
          buttonSkip: {
            color: "#f43f5e",
            fontWeight: "900",
            fontSize: "14px",
          },
          spotlight: {
            borderRadius: "24px",
          }
        }}
        locale={{
          back: "السابق",
          close: "إغلاق",
          last: "فهمت النقطة!",
          next: "الخطوة التالية",
          skip: "تخطي الجولة"
        }}
      />
    </>
  );
};

export default AITourGuide;
