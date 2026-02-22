import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
const logo = "/assets/logo.png";
import { Link, Navigate, useLocation } from "react-router-dom";
import { SignIn, SignUp } from "@clerk/clerk-react";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Bot, MessageSquare, Map, Brain, Zap, Shield, Star, UserPlus, LogIn } from "lucide-react";

/**
 * Utility for joining class names
 */
const cn = (...classes: any[]) => classes.filter(Boolean).join(" ");

const Auth = () => {
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";
  const [authMode, setAuthMode] = useState<'sign-in' | 'sign-up'>('sign-in');

  return (
    <>
      <SignedIn>
        <Navigate to={from} replace />
      </SignedIn>
      <SignedOut>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
          {/* AI Themed Background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)',
              backgroundSize: '50px 50px'
            }} />
            
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-20 -right-20 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl"
            />
            <motion.div 
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-20 left-20 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl"
            />

            <motion.div
              animate={{ y: [0, -20, 0], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity }}
              className="absolute top-40 right-40 opacity-20"
            >
              <Brain className="h-32 w-32 text-white" />
            </motion.div>
            
            <motion.div
              animate={{ y: [0, 20, 0], rotate: [0, -10, 10, 0] }}
              transition={{ duration: 7, repeat: Infinity, delay: 1 }}
              className="absolute bottom-40 left-40 opacity-20"
            >
              <Bot className="h-32 w-32 text-white" />
            </motion.div>
          </div>

          <div className="w-full max-w-6xl relative z-10 grid lg:grid-cols-2 gap-12 items-center py-10">
            {/* Left Side - AI Trip Planner Features */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="text-white"
            >
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-xl px-5 py-2.5 rounded-full mb-8 border border-white/20 shadow-2xl"
              >
                <div className="relative">
                  <Sparkles className="h-5 w-5 text-orange-400 animate-pulse" />
                  <div className="absolute inset-0 bg-orange-400/20 blur-lg rounded-full" />
                </div>
                <span className="text-xs font-black tracking-[0.2em] bg-gradient-to-r from-orange-400 via-amber-200 to-white bg-clip-text text-transparent uppercase">
                  RE7LTY AI ASSISTANT
                </span>
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-5xl lg:text-7xl font-black mb-8 leading-[1.1]"
              >
                خطط لرحلتك بذكاء <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 block">
                  خارق للعادة
                </span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-white/70 text-lg mb-8 leading-relaxed max-w-lg font-medium"
              >
                استخدم قوة الذكاء الاصطناعي لإنشاء خطط سفر مخصصة تناسب ميزانيتك واهتماماتك. 
                احصل على توصيات ذكية للفنادق والمطاعم والأنشطة في ثوانٍ.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-6"
              >
                {[
                  { icon: Bot, text: 'محادثة ذكية فورية', color: 'orange', desc: 'تفاعل طبيعي وكامل' },
                  { icon: Brain, text: 'تحليل دقيق للأداء', color: 'sky', desc: 'توصيات بناءً على اهتماماتك' },
                  { icon: Zap, text: 'خطة في ثوانٍ', color: 'amber', desc: 'توفير أيام من البحث' },
                  { icon: Map, text: 'تغطية شاملة لمصر', color: 'emerald', desc: 'أفضل المواقع والمخفي منها' },
                ].map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="flex items-start gap-4 p-4 rounded-3xl bg-white/5 hover:bg-white/10 transition-colors group cursor-default">
                      <div className={`h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur group-hover:scale-110 transition-transform`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-black text-white text-base">{feature.text}</p>
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">{feature.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-8 mt-10"
              >
                <div>
                  <div className="text-2xl font-black text-white">+10,000</div>
                  <div className="text-sm text-white/60">خطة تم إنشاؤها</div>
                </div>
                <div className="h-12 w-px bg-white/20" />
                <div>
                  <div className="text-2xl font-black text-white">98%</div>
                  <div className="text-sm text-white/60">رضا المستخدمين</div>
                </div>
                <div className="h-12 w-px bg-white/20" />
                <div>
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 text-yellow-300 fill-yellow-300" />
                    <Star className="h-5 w-5 text-yellow-300 fill-yellow-300" />
                    <Star className="h-5 w-5 text-yellow-300 fill-yellow-300" />
                    <Star className="h-5 w-5 text-yellow-300 fill-yellow-300" />
                    <Star className="h-5 w-5 text-yellow-300 fill-yellow-300" />
                  </div>
                  <div className="text-sm text-white/60">تقييم 5 نجوم</div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mt-8 p-4 bg-white/10 backdrop-blur rounded-2xl flex items-start gap-3"
              >
                <MessageSquare className="h-5 w-5 text-yellow-300 shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-bold mb-1">مطلوب تسجيل الدخول</p>
                  <p className="text-white/60 text-sm">
                    للوصول إلى مساعد السفر بالذكاء الاصطناعي، يرجى إنشاء حساب أو تسجيل الدخول. 
                  </p>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Side - Auth Forms */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full flex flex-col items-center"
            >
              {/* Logo for mobile */}
              <div className="text-center lg:hidden mb-8">
                <Link to="/" className="inline-block">
                  <img src={logo} alt="رحلتي" className="h-16 w-auto brightness-0 invert" />
                </Link>
                <p className="text-white/70 mt-2">خطط لرحلتك بالذكاء الاصطناعي</p>
              </div>

              {/* Toggle Switch */}
              <div className="bg-white/5 backdrop-blur-3xl p-1.5 rounded-2xl mb-8 flex gap-1 w-full max-w-[400px] shadow-2xl relative z-20">
                <button 
                  onClick={() => setAuthMode('sign-in')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm transition-all duration-300",
                    authMode === 'sign-in' ? "bg-white text-indigo-900 shadow-xl" : "text-white/60 hover:text-white"
                  )}
                >
                  <LogIn className="w-4 h-4" />
                  تسجيل دخول
                </button>
                <button 
                  onClick={() => setAuthMode('sign-up')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm transition-all duration-300",
                    authMode === 'sign-up' ? "bg-white text-indigo-900 shadow-xl" : "text-white/60 hover:text-white"
                  )}
                >
                  <UserPlus className="w-4 h-4" />
                  إنشاء حساب
                </button>
              </div>

              {/* Form Container - REMOVED ALL BORDERS */}
              <div className="bg-white/10 backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden w-full max-w-[500px] relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={authMode}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="p-8"
                  >
                    <div className="text-center mb-6">
                      <h2 className="text-3xl font-black text-white mb-2">
                        {authMode === 'sign-in' ? "أهلاً بك مجدداً" : "ابدأ رحلتك اليوم"}
                      </h2>
                      <p className="text-white/60">
                        {authMode === 'sign-in' ? "سجل دخولك لتكمل مغامرتك" : "سجل الآن لتبحر في خطط السفر الذكية"}
                      </p>
                    </div>

                    {authMode === 'sign-in' ? (
                      <SignIn 
                        appearance={{
                          elements: {
                            rootBox: "w-full",
                            card: "bg-transparent shadow-none p-0",
                            header: "hidden",
                            headerTitle: "hidden",
                            headerSubtitle: "hidden",
                            socialButtons: "flex flex-col gap-3",
                            socialButtonsBlockButton: cn(
                              "w-full bg-white/5 hover:bg-white/10",
                              "rounded-2xl h-12 font-bold text-white",
                              "transition-all mb-2 flex items-center justify-center gap-3"
                            ),
                            socialButtonsBlockButtonText: "text-white font-bold text-sm",
                            socialButtonsBlockButtonArrow: "hidden",
                            divider: "my-4",
                            dividerLine: "bg-white/20",
                            dividerText: "text-white/40 text-sm font-bold px-4",
                            form: "space-y-4",
                            formField: "space-y-1",
                            formFieldLabel: "text-white/80 text-sm font-bold mb-1 block",
                            formFieldInput: cn(
                              "w-full rounded-xl bg-white/5 text-white h-12 px-4",
                              "focus:bg-white/10 focus:outline-none",
                              "transition-all placeholder:text-white/30"
                            ),
                            formFieldInputShowPasswordButton: "text-white/60 hover:text-white",
                            formButtonPrimary: cn(
                              "w-full bg-gradient-to-r from-purple-600 to-indigo-600",
                              "hover:from-purple-700 hover:to-indigo-700",
                              "rounded-2xl h-12 font-bold text-base",
                              "shadow-lg shadow-purple-500/30",
                              "transition-all mt-2"
                            ),
                            footer: "hidden",
                            footerAction: "hidden",
                            identityPreview: "bg-white/5 rounded-xl p-4",
                            identityPreviewText: "text-white",
                            identityPreviewEditButton: "text-purple-300 font-bold hover:text-purple-200",
                            formFieldAction: "text-purple-300 font-bold text-xs",
                            alert: "rounded-xl bg-red-500/20 text-red-200 p-3 text-sm",
                            alertText: "text-red-200",
                            formFieldSuccessText: "text-green-300 text-xs",
                          }
                        }}
                        routing="hash"
                      />
                    ) : (
                      <SignUp 
                        appearance={{
                          elements: {
                            rootBox: "w-full",
                            card: "bg-transparent shadow-none p-0",
                            header: "hidden",
                            headerTitle: "hidden",
                            headerSubtitle: "hidden",
                            socialButtons: "flex flex-col gap-3",
                            socialButtonsBlockButton: cn(
                              "w-full bg-white/5 hover:bg-white/10",
                              "rounded-2xl h-12 font-bold text-white",
                              "transition-all mb-2 flex items-center justify-center gap-3"
                            ),
                            socialButtonsBlockButtonText: "text-white font-bold text-sm",
                            socialButtonsBlockButtonArrow: "hidden",
                            divider: "my-4",
                            dividerLine: "bg-white/20",
                            dividerText: "text-white/40 text-sm font-bold px-4",
                            form: "space-y-4",
                            formField: "space-y-1",
                            formFieldLabel: "text-white/80 text-sm font-bold mb-1 block",
                            formFieldInput: cn(
                              "w-full rounded-xl bg-white/5 text-white h-12 px-4",
                              "focus:bg-white/10 focus:outline-none",
                              "transition-all placeholder:text-white/30"
                            ),
                            formFieldInputShowPasswordButton: "text-white/60 hover:text-white",
                            formButtonPrimary: cn(
                              "w-full bg-gradient-to-r from-orange-600 to-amber-600",
                              "hover:from-orange-700 hover:to-amber-700",
                              "rounded-2xl h-12 font-bold text-base",
                              "shadow-lg shadow-orange-500/30",
                              "transition-all mt-2"
                            ),
                            footer: "hidden",
                            footerAction: "hidden",
                            identityPreview: "bg-white/5 rounded-xl p-4",
                            identityPreviewText: "text-white",
                            identityPreviewEditButton: "text-orange-300 font-bold hover:text-orange-200",
                            formFieldAction: "text-orange-300 font-bold text-xs",
                            alert: "rounded-xl bg-red-500/20 text-red-200 p-3 text-sm",
                            alertText: "text-red-200",
                            formFieldSuccessText: "text-green-300 text-xs",
                          }
                        }}
                        routing="hash"
                      />
                    )}

                    {/* Custom Footer Links */}
                    <div className="mt-6 text-center">
                      <p className="text-white/40 text-xs">
                        {authMode === 'sign-in' ? (
                          <>
                            ليس لديك حساب؟{" "}
                            <button 
                              onClick={() => setAuthMode('sign-up')}
                              className="text-purple-300 font-bold hover:text-purple-200 transition-colors"
                            >
                              سجل الآن
                            </button>
                          </>
                        ) : (
                          <>
                            لديك حساب بالفعل؟{" "}
                            <button 
                              onClick={() => setAuthMode('sign-in')}
                              className="text-orange-300 font-bold hover:text-orange-200 transition-colors"
                            >
                              سجل دخول
                            </button>
                          </>
                        )}
                      </p>
                    </div>

                    {/* Development Mode Badge */}
                    <div className="mt-4 text-center">
                      <span className="text-[10px] text-white/20 font-bold tracking-wider">
                        Secured by Clerk • Development mode
                      </span>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Trust Badges */}
              <div className="mt-8 flex items-center justify-center gap-8 text-xs font-black">
                <div className="flex items-center gap-2 text-white/50">
                  <Shield className="h-5 w-5" />
                  <span>بيانات مشفرة</span>
                </div>
                <div className="flex items-center gap-2 text-white/50">
                  <Zap className="h-5 w-5" />
                  <span>تخطيط فوري</span>
                </div>
                <div className="flex items-center gap-2 text-white/50">
                  <Sparkles className="h-5 w-5" />
                  <span>مزايا حصرية</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        <Footer />
      </SignedOut>
    </>
  );
};

export default Auth;