const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "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";
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
}

// Egyptian cities for pattern matching
const EGYPTIAN_CITIES = [
    'القاهرة', 'الإسكندرية', 'مرسى مطروح', 'الأقصر', 'أسوان',
    'شرم الشيخ', 'دهب', 'الجونة', 'مرسى علم', 'الغردقة',
    'الإسماعيلية', 'بورسعيد', 'السويس', 'طنطا', 'المنصورة',
    'سيوة', 'نويبع', 'طابا', 'رأس سدر', 'العين السخنة'
];

// Fallback AI using pattern matching
function fallbackAI(userMessage: string, previousData: any): AIResponse {
    const message = userMessage.toLowerCase();

    // Check for confirmation keywords
    const confirmationKeywords = ['نعم', 'موافق', 'احفظ', 'تمام', 'أكيد', 'yes'];
    const declineKeywords = ['لا', 'غير', 'no', 'لأ'];

    const isConfirmation = confirmationKeywords.some(keyword => message.includes(keyword));
    const isDecline = declineKeywords.some(keyword => message.includes(keyword));

    // Extract destination
    let destination = previousData?.destination || null;
    for (const city of EGYPTIAN_CITIES) {
        if (message.includes(city.toLowerCase())) {
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

const SYSTEM_PROMPT = `أنت مساعد سفر ذكي يُدعى TripAI.

دورك هو استبدال معالج تخطيط الرحلات التدريجي
(اختيار المدينة، اختيار الأيام، أزرار الميزانية، إلخ.)
بتجربة محادثة كاملة.

سيتفاعل المستخدم فقط من خلال رسائل اللغة الطبيعية.
لا توجد قوائم منسدلة أو أزرار أو خيارات محددة مسبقاً.

━━━━━━━━━━━━━━━━━━━━━━
السلوك الأساسي
━━━━━━━━━━━━━━━━━━━━━━
- تواصل بالعربية فقط.
- كن ودوداً وطبيعياً ومحادثاً.
- تصرف كخبير سفر محترف.
- لا تذكر أبداً عناصر واجهة المستخدم أو الخطوات أو النماذج.
- لا تذكر أبداً نماذج الذكاء الاصطناعي أو واجهات برمجة التطبيقات.

━━━━━━━━━━━━━━━━━━━━━━
البيانات التي يجب استخراجها
━━━━━━━━━━━━━━━━━━━━━━
من المحادثة باللغة الطبيعية، استخرج:

- destination (string) → اسم المدينة أو المكان
- days (number) → مدة الرحلة
- budget (enum) → "low" | "medium" | "high"
- tripType (string) → ترفيهية، شبابية، مغامرة، عائلية، شهر عسل، ثقافية، إلخ.
- season (string | null)

قد يقدم المستخدم هذه المعلومات:
- كلها دفعة واحدة
- تدريجياً عبر رسائل متعددة
- بأي ترتيب

يجب أن تتذكر المعلومات المقدمة مسبقاً.

━━━━━━━━━━━━━━━━━━━━━━
مراحل المحادثة
━━━━━━━━━━━━━━━━━━━━━━

**المرحلة 1: جمع البيانات**
- إذا كانت الوجهة أو الأيام مفقودة:
  - اطرح سؤالاً واحداً واضحاً
  - shouldGeneratePlan = false
  - awaitingConfirmation = false
  - tripPreview = null

**المرحلة 2: عرض المقترحات**
- عندما تكون الوجهة + الأيام + الميزانية معروفة:
  - اعرض قائمة بالأماكن والمطاعم والفنادق المقترحة
  - اكتب رد طويل يتضمن:
    * "رائع! إليك بعض الأماكن المقترحة في [destination]:"
    * قائمة 5-7 معالم سياحية
    * قائمة 3-5 مطاعم
    * قائمة 2-3 فنادق
    * "هل تريد حفظ هذه الرحلة؟"
  - shouldGeneratePlan = false
  - awaitingConfirmation = true
  - tripPreview = { attractions: [...], restaurants: [...], hotels: [...] }

**المرحلة 3: التأكيد**
- إذا رد المستخدم بـ "نعم" أو "موافق" أو "احفظ" أو "تمام":
  - reply = "ممتاز! جاري تجهيز خطة رحلتك الكاملة..."
  - shouldGeneratePlan = true
  - awaitingConfirmation = false

- إذا رد المستخدم بـ "لا" أو "غير":
  - reply = "حسناً، هل تريد تغيير الوجهة أو المدة؟"
  - shouldGeneratePlan = false
  - awaitingConfirmation = false

━━━━━━━━━━━━━━━━━━━━━━
تقدير السعر
━━━━━━━━━━━━━━━━━━━━━━
- عندما تكون الوجهة + الأيام (+ الميزانية إذا كانت متاحة) معروفة:
  - قدّر إجمالي سعر الرحلة بالجنيه المصري.
  - السعر هو تكلفة تقريبية للرحلة الكاملة.
  - لا تشرح الحساب.
  - قم بتضمين القيمة في استجابة JSON.

- إذا كانت البيانات غير كافية:
  - يجب أن يكون estimatedPriceEGP null.

━━━━━━━━━━━━━━━━━━━━━━
تنسيق الاستجابة (صارم)
━━━━━━━━━━━━━━━━━━━━━━
يجب أن ترد باستخدام JSON صالح فقط.
لا markdown. لا نص إضافي. لا تعليقات.

استخدم دائماً هذا الهيكل:

{
  "reply": "الرد بالعربية للمستخدم",
  "extractedData": {
    "destination": string | null,
    "days": number | null,
    "budget": "low" | "medium" | "high" | null,
    "tripType": string | null,
    "season": string | null
  },
  "shouldGeneratePlan": boolean,
  "estimatedPriceEGP": number | null,
  "tripPreview": {
    "attractions": ["اسم المعلم 1", "اسم المعلم 2", ...],
    "restaurants": ["اسم المطعم 1", "اسم المطعم 2", ...],
    "hotels": ["اسم الفندق 1", "اسم الفندق 2", ...]
  } | null,
  "awaitingConfirmation": boolean
}

━━━━━━━━━━━━━━━━━━━━━━
أمثلة
━━━━━━━━━━━━━━━━━━━━━━

**مثال 1: جمع البيانات**
User: "عايز أسافر"
Response:
{
  "reply": "رائع! إلى أين تريد السفر؟",
  "extractedData": {...},
  "shouldGeneratePlan": false,
  "estimatedPriceEGP": null,
  "tripPreview": null,
  "awaitingConfirmation": false
}

**مثال 2: عرض المقترحات**
User: "الأقصر 3 أيام ميزانية متوسطة"
Response:
{
  "reply": "رائع! إليك بعض الأماكن المقترحة في الأقصر:\n\n🏛️ المعالم السياحية:\n• معبد الكرنك\n• وادي الملوك\n• معبد الأقصر\n• معبد حتشبسوت\n• تمثالا ممنون\n\n🍽️ المطاعم:\n• مطعم النيل\n• مطعم الكرنك\n• مطعم الأقصر\n\n🏨 الفنادق:\n• فندق سوفيتيل\n• فندق هيلتون\n\nالسعر المتوقع: 9000 جنيه مصري\n\nهل تريد حفظ هذه الرحلة؟",
  "extractedData": {"destination": "الأقصر", "days": 3, "budget": "medium", ...},
  "shouldGeneratePlan": false,
  "estimatedPriceEGP": 9000,
  "tripPreview": {
    "attractions": ["معبد الكرنك", "وادي الملوك", "معبد الأقصر", "معبد حتشبسوت", "تمثالا ممنون"],
    "restaurants": ["مطعم النيل", "مطعم الكرنك", "مطعم الأقصر"],
    "hotels": ["فندق سوفيتيل", "فندق هيلتون"]
  },
  "awaitingConfirmation": true
}

**مثال 3: التأكيد**
User: "نعم"
Response:
{
  "reply": "ممتاز! جاري تجهيز خطة رحلتك الكاملة...",
  "extractedData": {...},
  "shouldGeneratePlan": true,
  "estimatedPriceEGP": 9000,
  "tripPreview": null,
  "awaitingConfirmation": false
}

━━━━━━━━━━━━━━━━━━━━━━
المحظورات الصارمة
━━━━━━━━━━━━━━━━━━━━━━
- لا إخراج بالإنجليزية
- لا markdown في JSON
- لا تفسيرات
- لا إنشاء خط سير الرحلة
- لا تفاصيل تقنية أو تنفيذية`;

export async function sendMessageToAI(
    userMessage: string,
    conversationHistory: { role: string; content: string }[],
    currentExtractedData?: any
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

        // Build messages array for Groq API
        const messages = [
            { role: "system" as const, content: SYSTEM_PROMPT },
            ...conversationHistory.map(msg => ({
                role: (msg.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
                content: msg.content
            })),
            { role: "user" as const, content: userMessage }
        ];

        // Call Groq API using SDK
        const chatCompletion = await groq.chat.completions.create({
            messages: messages,
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 1024,
        });

        const text = chatCompletion.choices[0]?.message?.content || "";

        // Try to parse JSON response
        try {
            // Remove markdown code blocks if present
            let jsonStr = text.trim();
            if (jsonStr.startsWith("```json")) {
                jsonStr = jsonStr.replace(/```json\n?/g, "").replace(/```\n?/g, "");
            } else if (jsonStr.startsWith("```")) {
                jsonStr = jsonStr.replace(/```\n?/g, "");
            }

            // Try to extract JSON from the response (handle cases where AI adds extra text)
            const jsonStart = jsonStr.indexOf('{');
            const jsonEnd = jsonStr.lastIndexOf('}');

            if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
                jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
            }

            const parsed = JSON.parse(jsonStr);
            return parsed as AIResponse;
        } catch (parseError) {
            console.error("Failed to parse AI response, using fallback:", text);
            return fallbackAI(userMessage, currentExtractedData);
        }
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
