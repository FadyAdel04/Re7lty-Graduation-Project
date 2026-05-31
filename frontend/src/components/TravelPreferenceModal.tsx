import { motion, AnimatePresence } from "framer-motion";
import { Building2, User, X, Sparkles, ArrowLeft } from "lucide-react";

interface TravelPreferenceModalProps {
  open: boolean;
  onClose: () => void;
  onSelectCompany: () => void;
  onSelectIndependent: () => void;
  destination: string;
  days: number | null;
}

const TravelPreferenceModal = ({
  open,
  onClose,
  onSelectCompany,
  onSelectIndependent,
  destination,
  days,
}: TravelPreferenceModalProps) => {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 40 }}
            transition={{
              type: "spring",
              stiffness: 320,
              damping: 28,
            }}
            className="fixed inset-0 z-[201] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-xl bg-card border border-border rounded-[3rem] shadow-2xl overflow-hidden">
              
              {/* Header */}
              <div className="relative bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-8 text-white text-center overflow-hidden">
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage:
                      "radial-gradient(#fff 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
                  }}
                />

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="
                    absolute
                    top-5
                    left-5
                    w-10
                    h-10
                    rounded-xl
                    bg-white/10
                    hover:bg-white/20
                    border
                    border-white/20
                    backdrop-blur-md
                    flex
                    items-center
                    justify-center
                    transition-all
                    duration-200
                  "
                >
                  <X className="w-4 h-4 text-white" />
                </button>

                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md mx-auto flex items-center justify-center mb-4 border border-white/30 shadow-xl">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>

                  <h2 className="text-2xl font-black leading-tight mb-2">
                    أعجبتك الرحلة؟ 🎉
                  </h2>

                  <p className="text-white/80 font-bold text-sm">
                    كيف تريد أن تسافر إلى{" "}
                    <span className="text-white font-black">
                      {destination}
                    </span>
                    {days && ` لمدة ${days} أيام`}؟
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4" dir="rtl">

                {/* Travel Company Option */}
                <motion.button
                  whileHover={{ scale: 1.02, y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onSelectCompany}
                  className="
                    group
                    relative
                    overflow-hidden
                    w-full
                    flex
                    items-center
                    gap-5
                    p-6
                    rounded-[2rem]
                    border-2
                    border-border
                    bg-gradient-to-l
                    from-indigo-500/5
                    to-background
                    hover:border-indigo-500
                    hover:bg-indigo-500/10
                    transition-all
                    duration-300
                    text-right
                  "
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity rounded-r-full" />

                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 shadow-lg group-hover:rotate-3 transition-transform">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-black text-foreground">
                        احجز مع شركة سياحية
                      </h3>

                      <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                        موصى به
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                      نوصيك بأفضل شركات السياحة المتخصصة لوجهتك.
                      يمكنك إرسال تفاصيل رحلتك مباشرة للحصول على عرض سعر.
                    </p>

                    <div className="flex items-center gap-2 mt-3 text-indigo-500 font-black text-xs">
                      <span>اعرض الشركات المقترحة</span>

                      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    </div>
                  </div>
                </motion.button>

                {/* Independent Travel */}
                <motion.button
                  whileHover={{ scale: 1.02, y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onSelectIndependent}
                  className="
                    group
                    relative
                    overflow-hidden
                    w-full
                    flex
                    items-center
                    gap-5
                    p-6
                    rounded-[2rem]
                    border-2
                    border-border
                    bg-gradient-to-l
                    from-emerald-500/5
                    to-background
                    hover:border-emerald-500
                    hover:bg-emerald-500/10
                    transition-all
                    duration-300
                    text-right
                  "
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-emerald-500 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity rounded-r-full" />

                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-lg group-hover:rotate-3 transition-transform">
                    <User className="w-8 h-8 text-white" />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-black text-foreground mb-2">
                      سافر باستقلالية
                    </h3>

                    <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                      احفظ رحلتك مباشرة وتمتع بحرية التنقل الكاملة.
                      ستحصل على الخطة الكاملة وخرائط الملاحة بعد الحفظ.
                    </p>

                    <div className="flex items-center gap-2 mt-3 text-emerald-500 font-black text-xs">
                      <span>احفظ الرحلة الآن</span>

                      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    </div>
                  </div>
                </motion.button>

                <p className="text-center text-xs text-muted-foreground font-medium pt-2">
                  يمكنك دائماً تغيير قرارك لاحقاً
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TravelPreferenceModal;