import React, { useState, useEffect } from "react";
import Joyride, { Step, CallBackProps, STATUS } from "react-joyride";
import { useUser } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, ChevronRight, PlayCircle, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";

const AITourGuide = () => {
  const [run, setRun] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();

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
                // If no user, skip user-related steps or go home
                setStepIndex(nextIndex + 2); // Skip stats and memories
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

  return (
    <>

<AnimatePresence>
  {showAssistant && (
    <div className="fixed inset-0 z-[101] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 30 }}
        className="bg-white/95 backdrop-blur-xl rounded-[2rem] sm:rounded-[3rem] shadow-[0_40px_120px_rgba(0,0,0,0.3)] w-full max-w-lg overflow-hidden border border-white/50 font-cairo max-h-[90vh] flex flex-col"
      >
        <div className="p-5 sm:p-8 md:p-10 relative overflow-y-auto custom-scrollbar">
          <button 
            onClick={() => setShowAssistant(false)}
            className="absolute top-3 left-3 sm:top-5 sm:left-5 p-2 sm:p-3 hover:bg-rose-50 rounded-xl sm:rounded-2xl transition-all z-10"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 hover:text-rose-500" />
          </button>

          <div className="flex flex-col items-center">
            <motion.div 
              animate={{ scale: [1, 1.1, 1] }} 
              transition={{ duration: 4, repeat: Infinity }}
              className="w-16 h-16 sm:w-20 md:w-24 sm:h-20 md:h-24 bg-indigo-50 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center mx-auto mb-4 sm:mb-6 md:mb-8"
            >
              <Bot className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-indigo-600" />
            </motion.div>

            <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 mb-2 sm:mb-3 md:mb-4 text-center">أهلاً بك يا رحالة! 👋</h3>
            <p className="text-gray-500 font-bold mb-4 sm:mb-6 md:mb-8 leading-relaxed px-2 sm:px-4 text-sm sm:text-base text-center">
              أنا مساعدك الذكي، سآخذك في جولة ممتعة لاكتشاف خبايا منصة رحلتي وتسهيل مغامرتك القادمة.
            </p>

            <div className="space-y-2 sm:space-y-3 md:space-y-4 w-full mb-5 sm:mb-6 md:mb-8 text-right bg-gray-50/80 p-4 sm:p-5 md:p-6 lg:p-8 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 shadow-inner">
              {[
                { text: "مشاركة تجارب السفر الفريدة", icon: "🌍" },
                { text: "استكشاف رحلات المبدعين الآخرين", icon: "✨" },
                { text: "تخطيط رحلاتك بالذكاء الاصطناعي", icon: "🤖" },
                { text: "حجز أفضل العروض من الشركات", icon: "🎫" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 sm:gap-3 md:gap-4 text-gray-800">
                  <div className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 rounded-xl sm:rounded-[1rem] md:rounded-2xl bg-white shadow-sm flex items-center justify-center text-base sm:text-lg shrink-0">
                    {item.icon}
                  </div>
                  <span className="font-black text-xs sm:text-sm md:text-base break-words">{item.text}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col w-full gap-2 sm:gap-3 md:gap-4 px-0 sm:px-2 md:px-4 sticky bottom-0 bg-white/95 pt-2">
              <Button 
                onClick={startTour}
                className="w-full h-12 sm:h-14 md:h-16 rounded-xl sm:rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm sm:text-base md:text-lg gap-2 sm:gap-3 md:gap-4 shadow-xl"
              >
                <PlayCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                ابدأ مغامرتي الآن
              </Button>
              <Button 
                variant="ghost"
                onClick={() => setShowAssistant(false)}
                className="w-full h-10 sm:h-11 md:h-12 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm text-gray-400 hover:text-indigo-600"
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
            primaryColor: "#4f46e5",
            textColor: "#1f2937",
            backgroundColor: "#ffffff",
            overlayColor: "rgba(0, 0, 0, 0.75)",
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
            padding: "20px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
            width: "320px",
            maxWidth: "100%",
          },
          tooltipTitle: {
            fontSize: "20px",
            fontWeight: "900",
            marginBottom: "12px",
            color: "#1f2937",
          },
          tooltipContent: {
            fontSize: "16px",
            fontWeight: "700",
            lineHeight: "1.7",
            color: "#4b5563",
          },
          buttonNext: {
            borderRadius: "16px",
            backgroundColor: "#4f46e5",
            padding: "12px 28px",
            fontWeight: "900",
            fontSize: "13px",
            marginLeft: "0",
            marginRight: "auto",
            boxShadow: "0 10px 20px rgba(79,70,229,0.2)",
          },
          buttonBack: {
            marginLeft: "0",
            marginRight: "10px",
            fontWeight: "900",
            color: "#9ca3af",
            fontSize: "13px",
          },
          buttonSkip: {
            color: "#f43f5e",
            fontWeight: "900",
            fontSize: "13px",
          },
          spotlight: {
            borderRadius: "20px",
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
