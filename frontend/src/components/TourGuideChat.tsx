import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Bot, User, MapPin, Sparkles, RotateCcw, Globe2, ChevronRight, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

/* ─────────────────────────────────────────────
   TYPES
   ───────────────────────────────────────────── */

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface TourGuideChatProps {
  onBack: () => void;
}

/* ─────────────────────────────────────────────
   GROQ DIRECT CALL (no backend needed)
   ───────────────────────────────────────────── */

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const TOUR_GUIDE_SYSTEM_PROMPT = `أنت "رحّال" - مرشد سياحي خبير ومتحمس على منصة Re7lty (رحلتي). تتحدث بالعربية الفصحى المبسطة مع لمسات من العامية المصرية الودودة.

🎯 مهمتك الرئيسية:
أنت خبير سياحي عالمي مع تخصص عميق في مصر وعواصم العالم. عندما يسألك المستخدم عن أي مكان أو مدينة، قدم له معلومات شاملة ومفصلة تشمل:

📍 معلومات الوجهة:
- نظرة عامة تاريخية وثقافية شاملة
- أفضل الأماكن السياحية مع وصف تفصيلي لكل منها
- أفضل المطاعم والأطباق المحلية التي يجب تجربتها
- أفضل الفنادق لكل ميزانية (اقتصادية، متوسطة، فاخرة)
- أفضل وقت للزيارة والطقس المتوقع
- نصائح عملية للمسافر (العادات، اللباس، العملة، التنقل)
- التكاليف التقديرية بالجنيه المصري
- تجارب فريدة ولا تُنسى في الوجهة

🌐 معلومات منصة Re7lty:
إذا سألك المستخدم عن المنصة، اشرح:
- Re7lty هي منصة سياحية مصرية تربط المسافرين بأفضل تجارب السفر
- تتيح لك تصفح ومشاركة تجارب الرحلات الحقيقية
- توفر مخططاً ذكياً بالذكاء الاصطناعي لتصميم رحلتك المثالية
- تربطك بشركات سياحة معتمدة وموثوقة
- تحتوي على مجتمع من المسافرين العرب
- يمكنك حجز رحلات منظمة أو تخطيط رحلة مستقلة
- تتضمن خاصية "البحث الذكي" لإيجاد أفضل رحلة تناسب ميزانيتك ووجهتك

🎨 أسلوب الرد:
- استخدم الإيموجي بذكاء لتنظيم المعلومات
- قدم المعلومات في نقاط منظمة وواضحة
- كن متحمساً ومشجعاً للسفر
- أضف نصائح شخصية ومفيدة من "خبرتك"
- اختم دائماً بسؤال يشجع المستخدم على الاستفسار أكثر أو اقتراح وجهة أخرى
- الرد يجب أن يكون مفصلاً وشاملاً وليس قصيراً

⚠️ قواعد مهمة:
- لا تخترع معلومات غير حقيقية عن أماكن
- إذا لم تعرف شيئاً، قل ذلك بصراحة واقترح بديلاً
- اهتم بالمعلومات العملية التي يحتاجها المسافر فعلاً
- تذكر دائماً أنك تتحدث باسم منصة Re7lty السياحية`;

async function callTourGuideAI(
  userMessage: string,
  history: { role: string; content: string }[]
): Promise<string> {
  if (!GROQ_API_KEY) {
    return getFallbackResponse(userMessage);
  }

  try {
    const messages = [
      { role: "system", content: TOUR_GUIDE_SYSTEM_PROMPT },
      ...history.slice(-10),
      { role: "user", content: userMessage },
    ];

    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        temperature: 0.8,
        max_tokens: 2048,
      }),
    });

    if (!res.ok) {
      throw new Error(`Groq API Error: ${res.status}`);
    }

    const data = await res.json();
    return data.choices[0].message.content;
  } catch (e) {
    console.error("Tour Guide AI Error:", e);
    return getFallbackResponse(userMessage);
  }
}

function getFallbackResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("شرم") || lower.includes("sharm")) {
    return `🌊 شرم الشيخ - جوهرة البحر الأحمر!\n\nشرم الشيخ هي واحدة من أجمل المدن الساحلية في العالم، تقع في جنوب سيناء على البحر الأحمر.\n\n🏖️ أبرز المعالم:\n• شاطئ نعمة باي - قلب المدينة وأكثرها نشاطاً\n• محميّة رأس محمد الطبيعية - من أجمل مناطق الغطس في العالم\n• جزيرة تيران - مثالية لرياضات الغطس والسنوركل\n\n💰 التكاليف:\n• الإقامة: من 500 إلى 5000 جنيه في الليلة\n• الغداء في مطعم جيد: من 200 إلى 500 جنيه\n\nهل تريد المزيد من التفاصيل عن شرم الشيخ؟ 🤿`;
  }
  if (lower.includes("قاهرة") || lower.includes("cairo")) {
    return `🏛️ القاهرة - أم الدنيا!\n\nالقاهرة عاصمة مصر وإحدى أكبر مدن العالم وأكثرها حيوية وتاريخاً.\n\n🗿 أبرز المعالم:\n• الأهرامات وأبو الهول - سابع عجائب الدنيا\n• متحف مصر المصري - أغنى متحف أثري في العالم\n• خان الخليلي - سوق تاريخي رائع\n• القلعة ومسجد محمد علي\n\nهل تريد معرفة المزيد عن القاهرة أو مدينة أخرى؟ 🌟`;
  }
  return `مرحباً! أنا رحّال، مرشدك السياحي الذكي على منصة Re7lty! 🌍\n\nيبدو أن هناك مشكلة في الاتصال بخادم الذكاء الاصطناعي حالياً. يرجى التأكد من توفر مفتاح API في إعدادات المشروع.\n\nفي الوقت الحالي، يمكنني مساعدتك بمعلومات أساسية عن:\n• القاهرة 🏛️\n• شرم الشيخ 🌊\n• الإسكندرية 🌊\n\nما الوجهة التي تريد معرفة المزيد عنها؟`;
}

/* ─────────────────────────────────────────────
   QUICK SUGGESTIONS
   ───────────────────────────────────────────── */

const QUICK_SUGGESTIONS = [
  { label: "🏛️ الأهرامات والقاهرة", prompt: "أخبرني عن القاهرة والأهرامات بشكل مفصل" },
  { label: "🌊 شرم الشيخ", prompt: "ما هي أفضل الأماكن في شرم الشيخ وكيف أخطط لرحلتي إليها؟" },
  { label: "🕌 الإسكندرية", prompt: "أعطني دليل سياحي شامل عن مدينة الإسكندرية" },
  { label: "🤿 دهب والغطس", prompt: "ما هي تجربة الغطس في دهب وأفضل الأماكن بها؟" },
  { label: "⛵ أسوان والأقصر", prompt: "أخبرني عن رحلة النيل بين أسوان والأقصر" },
  { label: "❓ عن منصة Re7lty", prompt: "ما هي منصة Re7lty وكيف أستخدمها؟" },
];

/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */

export default function TourGuideChat({ onBack }: TourGuideChatProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `أهلاً وسهلاً! أنا **رحّال** 🗺️ مرشدك السياحي الخبير على منصة Re7lty!\n\nأنا هنا لأساعدك في كل ما يتعلق بالسياحة والسفر:\n\n🌍 **اسألني عن أي وجهة سياحية** - سواء في مصر أو حول العالم، وسأعطيك معلومات شاملة عن المعالم، المطاعم، الفنادق، والتكاليف.\n\n🏛️ **أخبرني عن مدينة** تودّ زيارتها وسأحوّل خبرتي إلى دليل سياحي مفصّل لك.\n\n❓ **اسأل عن Re7lty** وكيفية استخدام المنصة بأفضل طريقة.\n\nما الذي يشغل بالك اليوم؟ 🌟`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [messages]);

  const buildHistory = useCallback((): { role: string; content: string }[] => {
    return messages
      .filter((m) => m.id !== "welcome")
      .map((m) => ({ role: m.role, content: m.content }));
  }, [messages]);

  const handleSend = useCallback(async (text?: string) => {
    const userText = (text || input).trim();
    if (!userText || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const history = buildHistory();
      const response = await callTourGuideAI(userText, history);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى. 🙏",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [input, isLoading, buildHistory]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReset = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `أهلاً من جديد! أنا **رحّال** 🗺️، مرشدك السياحي الخبير.\n\nكيف يمكنني مساعدتك اليوم؟ اسألني عن أي وجهة أو مدينة وسأكون سعيداً بمساعدتك! 🌍`,
        timestamp: new Date(),
      },
    ]);
    setInput("");
  };

  /* ─── RENDER MESSAGE CONTENT ─── */
  const renderContent = (content: string) => {
    // Process **bold**, bullet points, numbered lists
    const lines = content.split("\n");
    const elements: JSX.Element[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      if (!line.trim()) {
        elements.push(<div key={`space-${i}`} className="h-1.5" />);
        i++;
        continue;
      }

      // Headings (lines starting with emoji + bold)
      if (line.match(/^[🌍🏛️🌊🤿⛵🕌🗿🌟💰🏖️⚠️🎯🌐🎨📍❓💡🔹✅🎭🌺]/)) {
        const formatted = line.replace(/\*\*(.*?)\*\*/g, (_, t) => `<strong>${t}</strong>`);
        elements.push(
          <p key={`emoji-${i}`} className="font-black text-foreground text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />
        );
        i++;
        continue;
      }

      // Bullet list item
      if (line.startsWith("• ") || line.startsWith("- ")) {
        const txt = line.replace(/^[•\-]\s/, "").replace(/\*\*(.*?)\*\*/g, (_, t) => `<strong>${t}</strong>`);
        elements.push(
          <div key={`bullet-${i}`} className="flex items-start gap-2 text-sm">
            <span className="text-indigo-500 mt-0.5 shrink-0 text-xs">▸</span>
            <span className="text-foreground/90 leading-relaxed" dangerouslySetInnerHTML={{ __html: txt }} />
          </div>
        );
        i++;
        continue;
      }

      // Regular paragraph with bold support
      const formatted = line.replace(/\*\*(.*?)\*\*/g, (_, t) => `<strong>${t}</strong>`);
      elements.push(
        <p key={`p-${i}`} className="text-sm text-foreground/90 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />
      );
      i++;
    }

    return <div className="space-y-1.5">{elements}</div>;
  };

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden" dir="rtl">
      {/* ── Header ── */}
      <div className={cn(
        "flex items-center justify-between px-5 py-4 border-b border-border shrink-0",
        isDark ? "bg-slate-900/80" : "bg-gradient-to-r from-emerald-50/80 to-teal-50/80"
      )}>
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center transition-colors font-black text-sm",
              isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-white/80 text-gray-600 hover:bg-white"
            )}
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-md",
                "bg-gradient-to-br from-emerald-500 to-teal-600"
              )}>
                🗺️
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-background animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-foreground text-sm leading-none">رحّال - المرشد السياحي</h3>
              <p className="text-[10px] text-emerald-600 font-bold mt-0.5">متاح الآن • يعرف كل الوجهات</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center transition-colors",
              isDark ? "bg-white/10 text-white/70 hover:bg-white/20" : "bg-white/80 text-gray-500 hover:bg-white"
            )}
            title="محادثة جديدة"
          >
            <RotateCcw className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* ── Messages ── */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-4 pb-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
              >
                {/* Avatar */}
                <div className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm",
                  msg.role === "assistant"
                    ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
                    : "bg-gradient-to-br from-indigo-500 to-violet-600 text-white"
                )}>
                  {msg.role === "assistant" ? (
                    <span className="text-sm">🗺️</span>
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>

                {/* Bubble */}
                <div className={cn(
                  "group max-w-[82%] flex flex-col",
                  msg.role === "user" ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "px-4 py-3.5 rounded-2xl shadow-sm relative",
                    msg.role === "assistant"
                      ? isDark
                        ? "bg-slate-800/90 border border-white/10 rounded-tr-sm"
                        : "bg-white border border-gray-100 rounded-tr-sm"
                      : "bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-tl-sm"
                  )}>
                    {msg.role === "user" ? (
                      <p className="text-sm font-medium text-white leading-relaxed">{msg.content}</p>
                    ) : (
                      renderContent(msg.content)
                    )}

                    {/* Copy button for assistant messages */}
                    {msg.role === "assistant" && (
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-lg bg-black/10 hover:bg-black/20 flex items-center justify-center"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3 text-gray-500" />
                        )}
                      </button>
                    )}
                  </div>

                  <span className="text-[10px] text-muted-foreground mt-1 px-1">
                    {msg.timestamp.toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex gap-3 items-start"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-sm shadow-sm">
                  🗺️
                </div>
                <div className={cn(
                  "px-4 py-3.5 rounded-2xl rounded-tr-sm shadow-sm",
                  isDark ? "bg-slate-800/90 border border-white/10" : "bg-white border border-gray-100"
                )}>
                  <div className="flex gap-1.5 items-center h-4">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                    <span className="text-xs text-muted-foreground mr-2 font-medium">رحّال يفكر...</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* ── Quick Suggestions (visible only at start) ── */}
      <AnimatePresence>
        {messages.length <= 1 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border shrink-0"
          >
            <div className="p-3 overflow-x-auto">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 px-1">
                اقتراحات سريعة
              </p>
              <div className="flex gap-2 flex-wrap">
                {QUICK_SUGGESTIONS.map((s) => (
                  <motion.button
                    key={s.label}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSend(s.prompt)}
                    disabled={isLoading}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                      isDark
                        ? "bg-white/10 text-white/80 hover:bg-white/20 border border-white/10"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100"
                    )}
                  >
                    {s.label}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Input Bar ── */}
      <div className={cn(
        "p-3 border-t border-border shrink-0",
        isDark ? "bg-slate-900/60" : "bg-gray-50/80"
      )}>
        <div className={cn(
          "flex items-center gap-2 rounded-2xl px-4 py-2 shadow-sm border transition-all",
          isDark
            ? "bg-slate-800 border-white/10 focus-within:border-emerald-500/50"
            : "bg-white border-gray-200 focus-within:border-emerald-400 focus-within:shadow-emerald-100"
        )}>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اسأل عن أي وجهة أو مدينة... 🌍"
            disabled={isLoading}
            className="flex-1 bg-transparent outline-none text-sm font-medium text-foreground placeholder:text-muted-foreground/60 min-w-0"
            dir="rtl"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all",
              input.trim() && !isLoading
                ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-200"
                : "bg-gray-100 text-gray-300 dark:bg-white/10 dark:text-white/20"
            )}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" style={{ transform: "scaleX(-1)" }} />
            )}
          </motion.button>
        </div>
        <p className="text-center text-[9px] text-muted-foreground mt-2 font-medium">
          مدعوم بذكاء اصطناعي • Re7lty Tour Guide AI 🤖
        </p>
      </div>
    </div>
  );
}
