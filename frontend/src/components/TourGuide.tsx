import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Check, ArrowRight, ArrowLeft, MapPin, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/clerk-react';
import { cn } from '@/lib/utils';
import { useLocation, useNavigate } from 'react-router-dom';
import tourGuideAvatar from '@/assets/tour_guide.png';

interface TourStep {
  targetId: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  path?: string;
}

const NORMAL_USER_STEPS: TourStep[] = [
  {
    targetId: 'welcome-center',
    title: 'مرحباً بك في رحلتي! 👋',
    description: 'دعني آخذك في جولة سريعة لاستكشاف المنصة ومساعدتك في العثور على رحلتك القادمة.',
    position: 'center',
  },
  {
    targetId: 'nav-home',
    title: 'الرئيسية 🏠',
    description: 'هنا تجد أحدث الرحلات والمغامرات المختارة لك.',
    position: 'bottom',
    path: '/'
  },
  {
    targetId: 'trip-ai-widget',
    title: 'مساعد الذكاء الاصطناعي 🤖',
    description: 'هل تحتاج لمساعدة في التخطيط؟ تحدث مع مساعدنا الذكي ليصمم لك رحلة أحلامك.',
    position: 'top',
  },
  {
    targetId: 'featured-trips-section',
    title: 'رحلات مميزة 🔥',
    description: 'استكشف أفضل الرحلات التي يشاركها مجتمعنا ونالت إعجاب الجميع.',
    position: 'top',
    path: '/'
  },
  {
    targetId: 'corporate-trips-section',
    title: 'رحلات الشركات 🏢',
    description: 'خدمة جديدة! استعرض عروض شركات السياحة الموثقة والمضمونة لرحلات احترافية.',
    position: 'top',
    path: '/'
  },
  {
    targetId: 'nav-discover',
    title: 'اكتشف 🔍',
    description: 'ابحث عن وجهات جديدة وتجارب فريدة من نوعها.',
    position: 'bottom',
    path: '/discover'
  },
  {
    targetId: 'nav-timeline',
    title: 'يوميات الرحلات 📸',
    description: 'شاهد قصص وتجارب المسافرين الآخرين وشارك لحظاتك.',
    position: 'bottom',
    path: '/timeline'
  },
  {
    targetId: 'nav-create-trip',
    title: 'أنشئ رحلتك ✈️',
    description: 'هل تخطط لرحلة خاصة؟ ابدأ من هنا وادعُ أصدقاءك.',
    position: 'bottom',
  },
  {
    targetId: 'nav-leaderboard',
    title: 'المتصدرين 🏆',
    description: 'تنافس مع المسافرين الآخرين واجمع النقاط لتصبح من النخبة.',
    position: 'bottom',
    path: '/leaderboard'
  },
];

const COMPANY_USER_STEPS: TourStep[] = [
  {
    targetId: 'welcome-center',
    title: 'مرحباً بشريكنا! 🤝',
    description: 'سعيدون بانضمام شركتكم. دعني أوضح لك كيفية إدارة رحلاتكم والوصول لعملائكم.',
    position: 'center',
  },
  {
    targetId: 'trip-ai-widget',
    title: 'مساعدك الذكي 🤖',
    description: 'استخدم الذكاء الاصطناعي لتحليل السوق والحصول على اقتراحات لتحسين رحلاتك.',
    position: 'top',
  },
  {
    targetId: 'nav-company-dashboard',
    title: 'لوحة التحكم 📊',
    description: 'مركز عملياتك. تابع الحجوزات، الإحصائيات، وأداء رحلاتك من هنا.',
    position: 'bottom',
    path: '/company/dashboard'
  },
  {
    targetId: 'nav-templates',
    title: 'شركات السياحة 🏢',
    description: 'تصفح الشركات الأخرى واستفد من الشراكات المحتملة.',
    position: 'bottom',
    path: '/templates'
  },
  {
    targetId: 'nav-timeline',
    title: 'يوميات الرحلات 📸',
    description: 'شاهد تفاعل العملاء مع رحلاتكم وشارك أجمل اللقطات.',
    position: 'bottom',
    path: '/timeline'
  },
];

export function TourGuide() {
  const { user, isLoaded } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const userRole = user?.publicMetadata?.role as string;
  const isCompany = userRole === 'company_owner' || userRole === 'company_pending' || userRole === 'company_approved';
  
  const steps = isCompany ? COMPANY_USER_STEPS : NORMAL_USER_STEPS;
  const currentStep = steps[currentStepIndex];
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if tour has been seen
    if (isLoaded && user) {
      const hasSeenTour = localStorage.getItem(`tour_seen_${user.id}`);
      if (!hasSeenTour) {
        // Wait a bit for page to load
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [isLoaded, user]);

  useEffect(() => {
    if (!isOpen) return;

    // Handle Navigation if step requires specific path
    if (currentStep.path && location.pathname !== currentStep.path) {
      navigate(currentStep.path);
      // Let the next render cycle handle the finding of target after nav
      return;
    }

    const findTarget = () => {
      if (currentStep.targetId === 'welcome-center') {
        setTargetRect(null); // Center positioning
        return;
      }

      const element = document.getElementById(currentStep.targetId);
      if (element) {
        const rect = element.getBoundingClientRect();
        // Check if element is visible/has dimensions
        if (rect.width === 0 && rect.height === 0) {
          setTargetRect(null);
        } else {
          setTargetRect(rect);
          // Scroll to element if needed
          element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }
      } else {
        setTargetRect(null); 
      }
    };

    // Need a small delay to ensure rendering and scroll
    // If we just navigated, might need more time
    const delay = currentStep.path ? 500 : 100;
    const timer = setTimeout(findTarget, delay);
    
    window.addEventListener('resize', findTarget);
    window.addEventListener('scroll', findTarget);

    return () => {
      window.removeEventListener('resize', findTarget);
      window.removeEventListener('scroll', findTarget);
      clearTimeout(timer);
    };
  }, [currentStepIndex, isOpen, currentStep, location.pathname, navigate]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const handleFinish = () => {
    setIsOpen(false);
    if (user) {
      localStorage.setItem(`tour_seen_${user.id}`, 'true');
    }
  };

  if (!isOpen) return null;

  // Calculate position styles
  const getPopoverStyles = () => {
    if (!targetRect || currentStep.position === 'center') {
      return {
        top: '50%',
        left: '50%',
        x: '-50%',
        y: '-50%',
      };
    }

    const gap = 20; // Space between target and popover
    const popoverWidth = 320; // Estimated width

    let top = 0;
    let left = 0;
    let x = '0%';
    let y = '0%';

    // Default to bottom if position is bottom or fallback
    if (currentStep.position === 'bottom') {
       top = targetRect.bottom + gap;
       left = targetRect.left + (targetRect.width / 2);
       x = '-50%';
       y = '0';
    } else if (currentStep.position === 'top') {
       top = targetRect.top - gap;
       left = targetRect.left + (targetRect.width / 2);
       x = '-50%';
       y = '-100%';
    }

    // Boundary checks to prevent going off-screen
    const screenWidth = window.innerWidth;
    
    // If popover goes too far left
    if (left < popoverWidth / 2) {
      // Adjust to align left edge with some padding
      // left remains, but we change translation or offset
    }

    // Ideally use a specialized library like floating-ui, but for now simple clamp
    // Since we use x: -50%, left is the center. 
    // If left < 160 (half width), it will clip.
    // We can't easily change `x` dynamically without state or ref logic in render.
    // Just keep it simple.

    return { top, left, x, y };
  };

  const styles = getPopoverStyles();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] pointer-events-none font-cairo" dir="rtl">
        {/* Backdrop / Overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        />

        {/* The Guide Avatar & Bubble */}
        <motion.div
          className="absolute pointer-events-auto"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            top: styles.top,
            left: styles.left,
            translateX: styles.x,
            translateY: styles.y
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="relative flex flex-col items-center">
            
             <div className="relative z-20 mb-4">
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl shadow-indigo-500/30 border-4 border-white overflow-hidden"
                >
                  <img src={tourGuideAvatar} alt="Tour Guide" className="w-full h-full object-cover" />
                </motion.div>
               {/* Sparkles */}
               <motion.div 
                 animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                 transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                 className="absolute -top-1 -right-1"
               >
                 <Sparkles className="w-6 h-6 text-yellow-400 fill-yellow-400" />
               </motion.div>
            </div>

            {/* Speech Bubble */}
            <div className="bg-white rounded-3xl p-6 shadow-2xl w-[320px] relative z-10 border border-indigo-100">
               {/* Close Button */}
               <button 
                 onClick={handleSkip}
                 className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
               >
                 <X className="w-5 h-5" />
               </button>

               {/* Triangle pointer */}
               {currentStep.position !== 'center' && targetRect && (
                 <div className="absolute w-4 h-4 bg-white rotate-45 -top-2 left-1/2 -translate-x-1/2 border-t border-l border-indigo-100" />
               )}

               <div className="mb-4">
                 <h3 className="text-xl font-black text-gray-800 mb-2">{currentStep.title}</h3>
                 <p className="text-gray-500 text-sm leading-relaxed font-bold">{currentStep.description}</p>
               </div>

               <div className="flex items-center justify-between mt-6">
                 <div className="flex gap-1">
                   {steps.map((_, idx) => (
                     <div 
                       key={idx} 
                       className={cn(
                         "w-2 h-2 rounded-full transition-all duration-300",
                         idx === currentStepIndex ? "w-6 bg-indigo-600" : "bg-gray-200"
                       )} 
                     />
                   ))}
                 </div>
                 
                 <div className="flex items-center gap-2">
                   {currentStepIndex < steps.length - 1 ? (
                     <>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={handleSkip}
                          className="text-gray-400 hover:text-gray-600 font-bold"
                        >
                          تخطي
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={handleNext}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-2 font-bold px-6"
                        >
                          التالي
                          <ArrowLeft className="w-4 h-4" />
                        </Button>
                     </>
                   ) : (
                     <Button 
                       size="sm" 
                       onClick={handleFinish}
                       className="bg-green-600 hover:bg-green-700 text-white rounded-xl gap-2 font-bold px-6"
                     >
                       ابدأ الآن
                       <Check className="w-4 h-4" />
                     </Button>
                   )}
                 </div>
               </div>
            </div>

          </div>
        </motion.div>

      </div>
    </AnimatePresence>
  );
}
