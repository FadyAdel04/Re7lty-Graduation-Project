const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Disable fallback mode when using Groq API (it's fast and reliable)
const USE_FALLBACK_MODE = false;

export interface AIResponse {
    reply: string;
    extractedData: {
        destination: string | null;
        days: number | null;
        budget: "low" | "medium" | "high" | null;
        tripType: string | null;
        season: string | null;
    };
    shouldGeneratePlan: boolean;
    estimatedPriceEGP: number | null;
    tripPreview?: {
        attractions: string[];
        restaurants: string[];
        hotels: string[];
    } | null;
    awaitingConfirmation?: boolean;
    suggestedPlatformTrips?: { id: string; title: string; matchReason: string; image?: string; price?: string }[];
}

// Egyptian cities for pattern matching
const EGYPTIAN_CITIES = [
    'القاهرة', 'الإسكندرية', 'مرسى مطروح', 'الأقصر', 'أسوان',
    'شرم الشيخ', 'دهب', 'الجونة', 'مرسى علم', 'الغردقة',
    'الإسماعيلية', 'بورسعيد', 'السويس', 'طنطا', 'المنصورة',
    'سيوة', 'نويبع', 'طابا', 'رأس سدر', 'العين السخنة'
];

// Helper to normalize text (handles Arabic hamzas, ta-marbuta, and English case)
function normalizeText(text: string): string {
    if (!text) return "";
    return text
        .toLowerCase()
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .trim();
}

// Fallback AI using pattern matching
function fallbackAI(userMessage: string, previousData: any): AIResponse {
    const message = normalizeText(userMessage);

    // Check for confirmation keywords
    const confirmationKeywords = ['نعم', 'موافق', 'احفظ', 'تمام', 'أكيد', 'yes', 'ok'];
    const declineKeywords = ['لا', 'غير', 'no', 'لأ', 'مش'];

    const isConfirmation = confirmationKeywords.some(keyword => message.includes(normalizeText(keyword)));
    const isDecline = declineKeywords.some(keyword => message.includes(normalizeText(keyword)));

    // Extract destination
    let destination = previousData?.destination || null;
    for (const city of EGYPTIAN_CITIES) {
        if (message.includes(normalizeText(city))) {
            destination = city;
            break;
        }
    }

    // Extract days
    let days = previousData?.days || null;
    const dayPatterns = [
        /(\d+)\s*(يوم|أيام|يومين)/,
        /(يوم|يومين|ثلاثة أيام|أربعة أيام|خمسة أيام|ستة أيام|سبعة أيام|أسبوع|اسبوع)/,
    ];

    for (const pattern of dayPatterns) {
        const match = message.match(pattern);
        if (match) {
            if (match[0].includes('يومين')) days = 2;
            else if (match[0].includes('ثلاثة') || match[0].includes('3')) days = 3;
            else if (match[0].includes('أربعة') || match[0].includes('4')) days = 4;
            else if (match[0].includes('خمسة') || match[0].includes('5')) days = 5;
            else if (match[0].includes('ستة') || match[0].includes('6')) days = 6;
            else if (match[0].includes('سبعة') || match[0].includes('7') || match[0].includes('أسبوع') || match[0].includes('اسبوع')) days = 7;
            else if (match[1] && !isNaN(parseInt(match[1]))) days = parseInt(match[1]);
            break;
        }
    }

    // Extract budget
    let budget: "low" | "medium" | "high" | null = previousData?.budget || null;
    if (message.includes('رخيص') || message.includes('اقتصادي') || message.includes('محدود')) budget = 'low';
    else if (message.includes('متوسط') || message.includes('معقول')) budget = 'medium';
    else if (message.includes('فاخر') || message.includes('غالي') || message.includes('مرتفع')) budget = 'high';

    // Extract trip type
    let tripType = previousData?.tripType || null;
    if (message.includes('مغامر') || message.includes('مغامرة')) tripType = 'مغامرة';
    else if (message.includes('استرخاء') || message.includes('راحة')) tripType = 'استرخاء';
    else if (message.includes('عائل') || message.includes('عيال')) tripType = 'عائلية';
    else if (message.includes('شباب') || message.includes('شبابي')) tripType = 'شبابية';
    else if (message.includes('ثقاف') || message.includes('تاريخ')) tripType = 'ثقافية';
    else if (message.includes('شهر عسل') || message.includes('رومانسي')) tripType = 'شهر عسل';

    // Estimate price
    let estimatedPrice = null;
    if (destination && days) {
        const basePrice = budget === 'low' ? 1500 : budget === 'high' ? 5000 : 3000;
        estimatedPrice = Math.round(basePrice * days);
    }

    // Check if user is confirming after seeing preview
    if (isConfirmation && previousData?.awaitingConfirmation) {
        return {
            reply: 'ممتاز! جاري تجهيز خطة رحلتك الكاملة...',
            extractedData: {
                destination,
                days,
                budget,
                tripType,
                season: null
            },
            shouldGeneratePlan: true,
            estimatedPriceEGP: estimatedPrice,
            tripPreview: null,
            awaitingConfirmation: false
        };
    }

    // Check if user is declining
    if (isDecline && previousData?.awaitingConfirmation) {
        return {
            reply: 'حسناً، هل تريد تغيير الوجهة أو المدة أو الميزانية؟',
            extractedData: {
                destination,
                days,
                budget,
                tripType,
                season: null
            },
            shouldGeneratePlan: false,
            estimatedPriceEGP: estimatedPrice,
            tripPreview: null,
            awaitingConfirmation: false
        };
    }

    // Determine conversation phase
    let reply = '';
    let shouldGenerate = false;
    let tripPreview = null;
    let awaitingConfirmation = false;

    if (!destination) {
        reply = 'رائع! إلى أين تريد السفر؟ يمكنك الاختيار من المدن المصرية الجميلة مثل شرم الشيخ، دهب، الأقصر، أسوان، الإسكندرية، أو أي مدينة أخرى.';
    } else if (!days) {
        reply = `اختيار ممتاز! ${destination} وجهة رائعة. كم يوماً تخطط للبقاء هناك؟`;
    } else if (!budget) {
        reply = `رائع! ${days} ${days === 1 ? 'يوم' : 'أيام'} في ${destination}. ما هي ميزانيتك المتوقعة؟ (اقتصادية، متوسطة، أو فاخرة)`;
    } else {
        // All data collected - show preview
        const attractions = getAttractionSuggestions(destination);
        const restaurants = getRestaurantSuggestions(destination);
        const hotels = getHotelSuggestions(destination);

        tripPreview = { attractions, restaurants, hotels };
        awaitingConfirmation = true;

        reply = `رائع! إليك بعض الأماكن المقترحة في ${destination}:

🏛️ المعالم السياحية:
${attractions.map(a => `• ${a}`).join('\n')}

🍽️ المطاعم:
${restaurants.map(r => `• ${r}`).join('\n')}

🏨 الفنادق:
${hotels.map(h => `• ${h}`).join('\n')}

السعر المتوقع: ${estimatedPrice?.toLocaleString()} جنيه مصري

هل تريد حفظ هذه الرحلة؟`;
    }

    return {
        reply,
        extractedData: {
            destination,
            days,
            budget,
            tripType,
            season: null
        },
        shouldGeneratePlan: shouldGenerate,
        estimatedPriceEGP: estimatedPrice,
        tripPreview,
        awaitingConfirmation
    };
}

// Helper functions to generate suggestions (fallback only - API should provide real data)
function getAttractionSuggestions(city: string): string[] {
    // Return generic suggestions - real data should come from API
    return [
        'معالم سياحية',
        'أماكن تاريخية',
        'مناظر طبيعية',
        'أسواق محلية',
        'متاحف'
    ];
}

function getRestaurantSuggestions(city: string): string[] {
    // Return generic suggestions - real data should come from API
    return [
        'مطاعم محلية',
        'مطاعم عالمية',
        'مطاعم شعبية'
    ];
}

function getHotelSuggestions(city: string): string[] {
    // Return generic suggestions - real data should come from API
    return [
        'فنادق متنوعة',
        'خيارات إقامة مختلفة'
    ];
}

const SYSTEM_PROMPT = `أنت TripAI - مستشار سفر احترافي لمنصة "رحلتي" (Re7lty).

🎯 دورك: تخطيط رحلات، اقتراح رحلات المنصة، الإجابة عن أسئلة السفر والمنصة.

━━━━━━━━━━━━━━━━━━━━━━
📚 معرفة المنصة (للإجابة على الأسئلة)
━━━━━━━━━━━━━━━━━━━━━━
• المنصة: منصة مصرية تجمع التواصل الاجتماعي + تخطيط الرحلات بالذكاء الاصطناعي + حجز رحلات الشركات
• إضافة رحلة: من القائمة → "Add New Trip" → ملء البيانات (عنوان، وجهة، أيام، نوع، ميزانية) → النشر
• حجز رحلة: البحث في "Templates" أو "Discover" → اختيار الرحلة → "Book Now" → انتظار موافقة الشركة
• نظام النقاط: +50 لإضافة رحلة، +5 لـLike، +3 لـComment، +10 لـSave
• المستويات: Explorer (0-100)، Adventurer (100-500)، Traveler (500-1000)، Legend (1000+)

━━━━━━━━━━━━━━━━━━━━━━
⚙️ قواعد السلوك
━━━━━━━━━━━━━━━━━━━━━━
1. ✅ لا تكرر الأسئلة: راجع extractedData أولاً. إذا ذُكرت الوجهة/الأيام/الميزانية → لا تسأل مرة أخرى
2. ✅ الأولوية لرحلات المنصة: ابحث في "Available Platform Trips" أولاً. إذا وجدت مطابقة 70%+ → اقترحها في suggestedPlatformTrips
3. ✅ استخرج البيانات بدقة:
   - أيام: "3 أيام"→3، "يومين"→2، "أسبوع"→7، "5 days"→5
   - وجهة: اسم المدينة (عربي/إنجليزي)
   - ميزانية: low/medium/high
4. ✅ تعامل مع الأسماء بذكاء (Case-insensitive، تجاهل أخطاء إملائية بسيطة)
5. ✅ كن مباشراً واحترافياً، لغة عربية واضحة

━━━━━━━━━━━━━━━━━━━━━━
🤖 مراحل العمل
━━━━━━━━━━━━━━━━━━━━━━
المرحلة 1: تحليل نية المستخدم
• سؤال عن المنصة؟ → أجب من المعرفة أعلاه
• سؤال عن مكان سياحي؟ → أجب ثم اسأل عن التخطيط
• طلب تخطيط؟ → انتقل للمرحلة 2

المرحلة 2: البحث في رحلات المنصة
• ابحث في "Available Platform Trips"
• مطابقة؟ → ضعها في suggestedPlatformTrips مع matchReason واضح
• لا مطابقة؟ → انتقل للمرحلة 3

المرحلة 3: جمع البيانات
• راجع extractedData
• اسأل عن الناقص فقط: وجهة، أيام، ميزانية

المرحلة 4: عرض المعاينة
• البيانات مكتملة؟ → اقترح معالم/فنادق/مطاعم + سعر تقديري
• اطلب التأكيد: awaitingConfirmation: true

المرحلة 5: التأكيد
• موافقة؟ → shouldGeneratePlan: true
• رفض؟ → ارجع للمرحلة 3

━━━━━━━━━━━━━━━━━━━━━━
� JSON Response Format
━━━━━━━━━━━━━━━━━━━━━━
{
  "reply": "ردك بالعربية",
  "extractedData": {
    "destination": "المدينة أو null",
    "days": رقم_أو_null,
    "budget": "low"|"medium"|"high"|null,
    "tripType": "النوع أو null",
    "season": null
  },
  "shouldGeneratePlan": false,
  "estimatedPriceEGP": رقم_أو_null,
  "tripPreview": {"attractions":[],"restaurants":[],"hotels":[]} | null,
  "awaitingConfirmation": false,
  "suggestedPlatformTrips": [{"id":"","title":"","matchReason":"","image":"","price":""}]
}

⚠️ أرجع JSON فقط. لا markdown، لا نص إضافي.
`;

export async function sendMessageToAI(
    userMessage: string,
    conversationHistory: { role: string; content: string }[],
    currentExtractedData?: any,
    availableTrips: any[] = []
): Promise<AIResponse> {
    // If fallback mode is enabled, use pattern matching
    if (USE_FALLBACK_MODE) {
        console.log('Using fallback AI mode (pattern matching)');
        return fallbackAI(userMessage, currentExtractedData);
    }

    try {
        // Initialize Groq client
        const Groq = (await import('groq-sdk')).default;
        const groq = new Groq({
            apiKey: GROQ_API_KEY,
            dangerouslyAllowBrowser: true // Required for browser usage
        });

        // Prepare context about available trips (truncated to stay within Groq token limits)
        let tripsContext = "";
        if (availableTrips && availableTrips.length > 0) {
            const limitedTrips = availableTrips.slice(0, 15);
            const tripsSummary = limitedTrips.map(t => ({
                id: t._id || t.id,
                title: (t.title || "").slice(0, 50),
                destination: t.destination || t.city,
                budget: t.budget,
                price: t.price || (t.estimatedPrice ? `${t.estimatedPrice} EGP` : "")
            }));
            tripsContext = `\n\nPlatform Trips:\n${JSON.stringify(tripsSummary)}`;
        }

        // Build messages array for Groq API
        // Limit conversation history to last 3 exchanges and truncate long messages
        const MAX_MSG_LEN = 400;
        const recentHistory = conversationHistory.slice(-6).map(msg => ({
            role: msg.role,
            content: msg.content.length > MAX_MSG_LEN ? msg.content.slice(0, MAX_MSG_LEN) + "…" : msg.content
        }));

        const messages = [
            { role: "system" as const, content: SYSTEM_PROMPT + tripsContext },
            ...recentHistory.map(msg => ({
                role: (msg.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
                content: msg.content
            })),
            { role: "user" as const, content: userMessage }
        ];

        // Call Groq API using SDK (keep payload small to avoid 400 "reduce length")
        const chatCompletion = await groq.chat.completions.create({
            messages: messages,
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 600,
        });

        const text = chatCompletion.choices[0]?.message?.content || "";

        // Try to parse JSON response with multiple strategies
        const parseAIResponse = (str: string): AIResponse | null => {
            let jsonStr = str.trim().replace(/\ufeff/g, "");
            if (jsonStr.startsWith("```json")) {
                jsonStr = jsonStr.replace(/^```json\s*/i, "").replace(/\s*```\s*$/g, "");
            } else if (jsonStr.startsWith("```")) {
                jsonStr = jsonStr.replace(/^```\s*/, "").replace(/\s*```\s*$/g, "");
            }
            const attempts: string[] = [];
            const jsonStart = jsonStr.indexOf('{');
            const jsonEnd = jsonStr.lastIndexOf('}');
            if (jsonStart !== -1 && jsonEnd > jsonStart) {
                attempts.push(jsonStr.substring(jsonStart, jsonEnd + 1));
                const lastOpen = jsonStr.lastIndexOf('{');
                if (lastOpen !== jsonStart && lastOpen < jsonEnd) {
                    attempts.push(jsonStr.substring(lastOpen, jsonEnd + 1));
                }
            }
            for (const candidate of attempts.length ? attempts : [jsonStr]) {
                const toTry = [
                    candidate,
                    candidate.replace(/,(\s*[}\]])/g, "$1"),
                ];
                for (const s of toTry) {
                    try {
                        const out = JSON.parse(s) as AIResponse;
                        if (out && typeof out.reply === "string" && out.extractedData) return out;
                    } catch {
                        continue;
                    }
                }
            }
            return null;
        };

        const parsed = parseAIResponse(text);
        if (parsed) return parsed;

        console.warn("Failed to parse AI response, using fallback");
        return fallbackAI(userMessage, currentExtractedData);
    } catch (error: any) {
        console.error("Groq API Error, using fallback:", error);

        // Handle specific error types that should still throw, otherwise fallback
        if (error.message?.includes('402')) {
            throw error; // Re-throw 402 specific error
        } else if (error.message?.includes('429')) {
            throw error; // Re-throw 429 specific error
        } else if (error.message?.includes('401')) {
            throw error; // Re-throw 401 specific error
        } else {
            return fallbackAI(userMessage, currentExtractedData);
        }
    }
}

export interface ItineraryDay {
    dayNum: number;
    title: string;
    activities: {
        name: string;
        type: 'attraction' | 'restaurant';
        coordinates?: { lat: number; lng: number };
        color?: string;
        time?: string;
        note?: string;
    }[];
    color: string;
}

const ITINERARY_COLORS = [
    "#4F46E5", // Indigo
    "#E11D48", // Rose
    "#059669", // Emerald
    "#D97706", // Amber
    "#7C3AED", // Violet
    "#2563EB", // Blue
    "#DB2777", // Pink
    "#0891B2", // Cyan
];

export interface GeneratedItineraryResponse {
    title?: string;
    description?: string;
    days: ItineraryDay[];
}

export async function generateItinerary(
    destination: string,
    days: number,
    selectedPlaces: { name: string; type: 'attraction' | 'restaurant'; lat?: number; lng?: number }[]
): Promise<GeneratedItineraryResponse> {
    try {
        const Groq = (await import('groq-sdk')).default;
        const groq = new Groq({
            apiKey: GROQ_API_KEY,
            dangerouslyAllowBrowser: true
        });

        const prompt = `أنت خبير تخطيط رحلات. قم بتنظيم الأماكن التالية في برنامج سياحي لمدة ${days} أيام في ${destination}.
الأماكن المختارة:
${selectedPlaces.map(p => `- ${p.name} (${p.type}) [Coords: ${p.lat}, ${p.lng}]`).join('\n')}

المطلوب:
1. توزيع الأماكن على الأيام بشكل جغرافي ذكي جداً لتقليل مسافات التنقل وتجنب إضاعة الوقت في المواصلات (استخدم الإحداثيات المذكورة لتجميع الأماكن القريبة في نفس اليوم).
2. ترتيب الأنشطة داخل كل يوم بشكل منطقي يسهل التحرك بينهم سيراً أو بمسافات قصيرة.
3. إضافة وقت مقترح لكل نشاط.
4. إضافة ملاحظة بسيطة (نصيحة) لكل مكان بالعربية تتضمن أفضل طريق للوصول إذا أمكن.
5. اجعل البرنامج ممتعاً ومنوعاً بين المعالم والمطاعم.

أرجع النتيجة بصيغة JSON فقط ككائن يحتوي على 3 حقول:
1. "title": اسم مبتكر وجذاب للرحلة (مثلاً: "لآلئ النيل: سحر التاريخ في القاهرة").
2. "description": نص تسويقي وإبداعي جذاب يصف الرحلة وجمالها (بدون ذكر أرقام مجردة، ركز على الشعور والمغامرة).
3. "days": قائمة الأيام.

مثال للـ JSON المطلوب:
{
  "title": "سحر الإسكندرية: عروس البحر المتوسط",
  "description": "استعد لرحلة تأخذك بين أحضان الطبيعة الساحرة وعبق التاريخ، حيث تمتزج ألوان المغامرة بمتعة الاسترخاء...",
  "days": [
    {
      "dayNum": 1,
      "title": "عنوان اليوم (مثلاً: قلب المدينة النابض)",
      "activities": [
        {
          "name": "اسم المكان",
          "type": "attraction" | "restaurant",
          "time": "الوقت (مثلاً: 10:00 صباحاً)",
          "note": "نصيحة سريعة ومفيدة"
        }
      ]
    }
  ]
}

لا تضف أي نص خارج الـ JSON.`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "أنت خبير تخطيط رحلات محترف أرجع JSON فقط." },
                { role: "user", content: prompt }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.3,
            max_tokens: 2000,
        });

        const text = chatCompletion.choices[0]?.message?.content || "";
        let jsonStr = text.trim();
        if (jsonStr.startsWith("```json")) {
            jsonStr = jsonStr.replace(/^```json\s*/i, "").replace(/\s*```\s*$/g, "");
        } else if (jsonStr.startsWith("```")) {
            jsonStr = jsonStr.replace(/^```\s*/, "").replace(/\s*```\s*$/g, "");
        }
        let parsedData: any;
        try {
            parsedData = JSON.parse(jsonStr);
        } catch (e) {
            console.error("Failed to parse itinerary JSON", jsonStr);
            throw e;
        }

        let itineraryDays: any[] = [];
        let description = "";
        let title = "";

        if (Array.isArray(parsedData)) {
            itineraryDays = parsedData;
        } else if (parsedData && Array.isArray(parsedData.days)) {
            itineraryDays = parsedData.days;
            description = parsedData.description || "";
            title = parsedData.title || "";
        } else {
            throw new Error("Invalid itinerary JSON structure");
        }
        
        // Map colors and coordinates back for days
        const formattedDays = itineraryDays.map((day, idx) => ({
            ...day,
            dayNum: day.dayNum || idx + 1,
            title: day.title || `اليوم ${idx + 1}`,
            color: ITINERARY_COLORS[idx % ITINERARY_COLORS.length],
            activities: Array.isArray(day.activities) ? day.activities.map((act: any) => {
                const original = selectedPlaces.find(p => p.name === act.name);
                return {
                    ...act,
                    coordinates: original ? { lat: original.lat, lng: original.lng } : undefined,
                    color: ITINERARY_COLORS[idx % ITINERARY_COLORS.length]
                };
            }) : []
        }));

        return {
            title,
            description,
            days: formattedDays
        };

    } catch (error) {
        console.error("Error generating itinerary:", error);
        // Fallback: simple distribution if AI fails
        const fallbackDays = Array.from({ length: days }, (_, i) => ({
            dayNum: i + 1,
            title: `اليوم ${i + 1}`,
            color: ITINERARY_COLORS[i % ITINERARY_COLORS.length],
            activities: selectedPlaces
                .filter((_, idx) => Math.floor(idx / 3) === i)
                .map(p => ({
                    ...p,
                    time: "10:00 صباحاً",
                    note: "رحلة سعيدة!",
                    color: ITINERARY_COLORS[i % ITINERARY_COLORS.length]
                }))
        }));

        return {
            title: `رحلة استكشاف ${destination}`,
            description: "رحلة ممتعة لاستكشاف أفضل المعالم السياحية والمطاعم الرائعة.",
            days: fallbackDays
        };
    }
}

export async function getCompletion(
    userInput: string,
    conversationHistory: { role: string; content: string }[]
): Promise<string> {
    if (!userInput || userInput.trim().length < 3) return "";

    try {
        const Groq = (await import('groq-sdk')).default;
        const groq = new Groq({
            apiKey: GROQ_API_KEY,
            dangerouslyAllowBrowser: true
        });

        const messages = [
            {
                role: "system" as const,
                content: "أنت مساعد إكمال جمل لمستشار سفر محترف. أكمل جملة المستخدم بشكل طبيعي ومهني ومختصر جداً (بحد أقصى 3 كلمات). أرجع التكملة فقط بدون علامات تنصيص. لا تكرر ما كتبه المستخدم. أكمل من حيث انتهى. الامامن بتاعت الرحلات الوزيايرات داخل مصر فقط"
            },
            ...conversationHistory.slice(-2).map(msg => ({
                role: (msg.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
                content: msg.content
            })),
            { role: "user" as const, content: userInput }
        ];

        const chatCompletion = await groq.chat.completions.create({
            messages: messages,
            model: "llama-3.1-8b-instant",
            temperature: 0.1,
            max_tokens: 10,
        });

        return chatCompletion.choices[0]?.message?.content?.trim() || "";
    } catch (e) {
        return "";
    }
}
