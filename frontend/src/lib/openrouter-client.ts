import { GOVERNORATES_COORDINATES, TRANSPORT_PRICES } from "./egypt-data";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DISTANCE_API_KEY = "vPh4fSouXiKX5Ew7d8a9c2b1"; // Example key, should be in env
const DISTANCE_API_URL = "https://api.distancematrix.ai/maps/api/distancematrix/json";

const USE_FALLBACK_MODE = !GROQ_API_KEY;

export interface TransportOption {
    type: 'microbus' | 'bus' | 'vip';
    price: number;
    label: string;
}

export interface AIResponse {
    reply: string;
    extractedData: {
        destination: string | null;
        days: number | null;
        budget: "low" | "medium" | "high" | null;
        tripType: string | null;
        season: string | null;
        checkIn?: string | null;
        checkOut?: string | null;
        wantsHotels?: boolean;
        transportOrigin?: string | null;
        transportDestination?: string | null;
        latitude?: number | null;
        longitude?: number | null;
    };
    shouldGeneratePlan: boolean;
    estimatedPriceEGP: number | null;
    transportOptions?: TransportOption[];
    suggestedPlatformTrips?: { id: string; title: string; matchReason: string; image?: string; price?: string }[];
    awaitingConfirmation: boolean;
    showDatePicker?: boolean;
}

export interface ItineraryDay {
    dayNum: number;
    title: string;
    activities: ItineraryActivity[];
    color: string;
}

export interface ItineraryActivity {
    name: string;
    time: string;
    note: string;
    type: 'attraction' | 'restaurant';
    coordinates?: { lat: number; lng: number };
}

export interface GeneratedItineraryResponse {
    title: string;
    description: string;
    days: ItineraryDay[];
}

function normalizeText(text: string): string {
    return text.toLowerCase().trim()
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/\s+/g, ' ');
}

const EGYPTIAN_CITIES = Object.keys(GOVERNORATES_COORDINATES).filter(c => c.match(/[\u0600-\u06FF]/));

async function fetchRealDistance(origin: string, destination: string): Promise<number | null> {
    try {
        const originCoords = GOVERNORATES_COORDINATES[origin];
        const destCoords = GOVERNORATES_COORDINATES[destination];
        
        if (!originCoords || !destCoords) return null;

        const url = `${DISTANCE_API_URL}?origins=${originCoords.lat},${originCoords.lng}&destinations=${destCoords.lat},${destCoords.lng}&key=${DISTANCE_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.status === 'OK' && data.rows[0].elements[0].status === 'OK') {
            return Math.round(data.rows[0].elements[0].distance.value / 1000); // meters to KM
        }
    } catch (e) {
        console.error("Distance Matrix API Error:", e);
    }
    return null;
}

// Fallback AI using pattern matching
function fallbackAI(userMessage: string, previousData: any): AIResponse {
    const message = normalizeText(userMessage);

    // Extraction logic (Minimal)
    let destination = previousData?.destination || null;
    for (const city of EGYPTIAN_CITIES) {
        if (message.includes(normalizeText(city))) {
            destination = city;
            break;
        }
    }

    const response: AIResponse = {
        reply: "عذراً، أنا أعمل حالياً في الوضع المحدود. يرجى المحاولة مرة أخرى لاحقاً أو كتابة رسالة أكثر وضوحاً.",
        extractedData: {
            destination,
            days: previousData?.days || null,
            budget: previousData?.budget || null,
            tripType: previousData?.tripType || null,
            season: null,
            transportOrigin: previousData?.transportOrigin || null,
            transportDestination: previousData?.transportDestination || null
        },
        shouldGeneratePlan: false,
        estimatedPriceEGP: null,
        suggestedPlatformTrips: [],
        awaitingConfirmation: false
    };

    // Add pricing logic even in fallback
    const origin = response.extractedData.transportOrigin;
    const dest = response.extractedData.transportDestination;

    if (origin && dest) {
        const distance = calculateManualDistance(origin, dest) || 250;
        const fuelFactor = TRANSPORT_PRICES.FUEL_PRICE / 15;
        const basePrice = Math.round(distance * TRANSPORT_PRICES.BASE_PRICES.microbus * fuelFactor);
        
        response.transportOptions = [
            { type: 'microbus', price: basePrice, label: "ميكروباص" },
            { type: 'bus', price: Math.round(distance * TRANSPORT_PRICES.BASE_PRICES.bus * fuelFactor), label: "أتوبيس" },
            { type: 'vip', price: Math.round(distance * TRANSPORT_PRICES.BASE_PRICES.vip * fuelFactor), label: "VIP / ليموزين" }
        ];
        
        const days = response.extractedData.days || 3;
        const budget = response.extractedData.budget || 'medium';
        const dailyRate = budget === 'low' ? 600 : budget === 'high' ? 3500 : 1400;
        response.estimatedPriceEGP = (days * dailyRate) + basePrice;
    }

    return response;
}

const SYSTEM_PROMPT = `أنت TripAI - مساعد تخطيط رحلات ذكي لمنصة "رحلتي" (Re7lty). تتحدث بالعربي المصري البسيط والودود. هدفك مساعدة المستخدمين على تخطيط رحلتهم خطوة بخطوة بطريقة تفاعلية.

━━━━━━━━━━━━━━━━━━━━━━
🧠 قواعد المحادثة (اتبعها بالترتيب بدون انحراف):

في كل مرحلة، يجب عليك عرض خيارات بسيطة للمستخدم ليختار منها بسهولة، أو تشجيعه على كتابة ما يريد. لا تنتقل للمرحلة التالية إلا بعد إجابة المستخدم على المرحلة الحالية.

المرحلة 1 - الوجهة: اطلب من المستخدم تحديد وجهة السفر.
مثال: "يا أهلاً بك! 🌍 عايز تسافر فين؟ (ممكن تختار: شرم الشيخ، دهب، الإسكندرية، الغردقة، أو اكتب أي مكان تاني في بالك)"

المرحلة 2 - مدينة الانطلاق: اسأله من أين سيبدأ رحلته.
مثال: "جميل جداً! طيب هتسافر منين؟ (ممكن تختار: القاهرة، الجيزة، الإسكندرية، المنصورة، أو اكتب محافظتك 🚌)"

المرحلة 3 - عدد الأيام: اسأله عن مدة الرحلة بالأيام.
مثال: "رحلتك دي كام يوم؟ (مثلاً: 3 أيام، 5 أيام، أسبوع 📅)"

المرحلة 4 - الفنادق: اسأل إن كان يريد البحث عن فنادق في الوجهة.
مثال: "تحب أدورلك على أفضل الفنادق للإقامة في [الوجهة]؟ (اختر: نعم 👍 / لا 👎)"

المرحلة 5أ - (لو نعم للفنادق) أطلب منه التواريخ: خليه يحدد وقت والسفر واعمل showDatePicker: true فقط مرة واحدة.
المرحلة 5ب - (لو لا للفنادق) اكمل لمرحلة التأكيد 6 مباشرة.

المرحلة 6 - التأكيد وعرض النتائج: اعرض ملخص كامل للرحلة واطلب منه التأكيد النهائي. ولا تنس تفعيل awaitingConfirmation: true.
📋 ملخص التأكيد يجب أن يكون كالتالي:
"✅ تمام جداً! خلينا نراجع ونأكد تفاصيل رحلتك:
📍 الوجهة: [الوجهة]
🏠 الانطلاق من: [مدينة الانطلاق]
📅 المدة: [الأيام] أيام
🏨 عرض الفنادق: [نعم/لا]
[📅 التواريخ: من [checkIn] إلى [checkOut]]
💰 التكلفة التقديرية المبدئية: [السعر] ج.م
👇 اضغط 'تأكيد الرحلة' علشان ابدأ أجمع لك النتائج وأرتب لك البرنامج"

المرحلة 7 - التنفيذ (فقط بعد الضغط على زر التأكيد من قبل المستخدم): قم بتفعيل shouldGeneratePlan: true.

━━━━━━━━━━━━━━━━━━━━━━
⚠️ قواعد صارمة جداً:
- اسأل سؤال واحد فقط في كل رد لتجنب إرباك المستخدم.
- قدّم دائماً خيارات أو أمثلة بسيطة بين أقواس في سؤالك.
- لا تطلب أبداً معلومات ذكرها المستخدم أو اختارها مسبقاً.
- النموذج يجب أن يحافظ على كل البيانات في المستخرجة extractedData بين الردود (لا تمسح أي حقل).
- shouldGeneratePlan يكون true فقط وفقط بعد تأكيد المستخدم النهائي في المرحلة 6.
- awaitingConfirmation يكون true فقط في مرحلة التأكيد والمراجعة.

━━━━━━━━━━━━━━━━━━━━━━
💰 حساب التكلفة استرشادياً:
- مواصلات/كيلو: ميكروباص (\${TRANSPORT_PRICES.BASE_PRICES.microbus})، أتوبيس (\${TRANSPORT_PRICES.BASE_PRICES.bus})، VIP ليموزين (\${TRANSPORT_PRICES.BASE_PRICES.vip}).
- النفقات اليومية: اقتصادي (600)، متوسط (1400)، فاخر (3500).

━━━━━━━━━━━━━━━━━━━━━━
📦 تنسيق الرد (JSON ONLY - يجب أن يكون الرد كود JSON صالح تماماً، لا تضف أي نص خارجه):
{
  "reply": "نص الرد بالمصري مع عرض الخيارات كأمثلة",
  "extractedData": {
    "destination": null,
    "days": null,
    "budget": null,
    "wantsHotels": null,
    "transportOrigin": null,
    "transportDestination": null,
    "checkIn": null,
    "checkOut": null,
    "tripType": null,
    "season": null
  },
  "showDatePicker": false,
  "shouldGeneratePlan": false,
  "estimatedPriceEGP": null,
  "awaitingConfirmation": false
}
`;

// Helper for distance fallback
function calculateManualDistance(city1: string, city2: string): number | null {
    const c1 = GOVERNORATES_COORDINATES[city1];
    const c2 = GOVERNORATES_COORDINATES[city2];
    if (!c1 || !c2) return null;

    // Haversine formula
    const R = 6371; // Radius of the Earth in km
    const dLat = (c2.lat - c1.lat) * Math.PI / 180;
    const dLon = (c2.lng - c1.lng) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(c1.lat * Math.PI / 180) * Math.cos(c2.lat * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c;
    
    // Add 25% road curvature factor to mimic real road distance
    return Math.round(d * 1.25);
}

export async function sendMessageToAI(
    userMessage: string,
    conversationHistory: { role: string; content: string }[],
    currentExtractedData?: any,
    availableTrips: any[] = [],
    chatMode: 'platform' | 'ai' = 'platform'
): Promise<AIResponse> {
    if (USE_FALLBACK_MODE) return fallbackAI(userMessage, currentExtractedData);

    try {
        let transportContext = "";
        let detectedOrigin = currentExtractedData?.transportOrigin || null;
        let detectedDest = currentExtractedData?.transportDestination || null;

        const normalizedMsg = normalizeText(userMessage);
        for (const city of EGYPTIAN_CITIES) {
            if (normalizedMsg.includes(normalizeText(city))) {
                if (!detectedOrigin) detectedOrigin = city;
                else if (!detectedDest && city !== detectedOrigin) detectedDest = city;
            }
        }

        if (detectedOrigin && detectedDest) {
            let distance = await fetchRealDistance(detectedOrigin, detectedDest);
            
            if (!distance) {
                distance = calculateManualDistance(detectedOrigin, detectedDest);
                if (distance) {
                    console.log(`Fallback distance used for ${detectedOrigin} to ${detectedDest}: ${distance}km`);
                }
            }

            if (distance) {
                transportContext = `\n\n[IMPORTANT TRANSPORT DATA] Current Trip: From ${detectedOrigin} to ${detectedDest}.
- Real Distance: ${distance} km.
- IMPORTANT: Show this distance (${distance} km) in your reply.
- Calculation: Use ONE-WAY distance for pricing.
- Fuel Coefficient: ${TRANSPORT_PRICES.FUEL_PRICE / 20}
- Base per KM: Microbus: ${TRANSPORT_PRICES.BASE_PRICES.microbus}, Bus: ${TRANSPORT_PRICES.BASE_PRICES.bus}, VIP: ${TRANSPORT_PRICES.BASE_PRICES.vip}.
- Return ONLY JSON as per formatting rules.
- Add Disclaimer in reply: "جميع الأسعار تقديرية وقد تختلف بناءً على أسعار الوقود وتوقيت السفر."`;
            }
        }

        const stateContext = currentExtractedData 
            ? `\n\n[MANDATORY CURRENT STATE - DO NOT OMIT FIELDS]: ${JSON.stringify(currentExtractedData)}\nInstruction: You must include all fields from this state in your response json unless explicitly changed by user.` 
            : "";

        const messages = [
            { role: "system", content: SYSTEM_PROMPT + transportContext + stateContext },
            ...conversationHistory.filter(m => m.role === 'user' || m.role === 'assistant').slice(-8),
            { role: "user", content: userMessage }
        ];

        const res = await fetch(GROQ_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages,
                temperature: 0.7,
                response_format: { type: "json_object" }
            })
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            console.error("Groq API Detail Error:", errorData);
            throw new Error(`Groq API Error: ${errorData.error?.message || res.statusText}`);
        }

        const data = await res.json();
        const response: AIResponse = JSON.parse(data.choices[0].message.content);

        // --- MANUALLY CALCULATE TRANSPORT & TOTALS FOR 1000% ACCURACY ---
        if (detectedOrigin && detectedDest) {
            const distance = calculateManualDistance(detectedOrigin, detectedDest) || 0;
            if (distance > 0) {
                const fuelFactor = TRANSPORT_PRICES.FUEL_PRICE / 15; // Normalized factor
                
                const options: TransportOption[] = [
                    { type: 'microbus', price: Math.round(distance * TRANSPORT_PRICES.BASE_PRICES.microbus * fuelFactor), label: "ميكروباص" },
                    { type: 'bus', price: Math.round(distance * TRANSPORT_PRICES.BASE_PRICES.bus * fuelFactor), label: "أتوبيس" },
                    { type: 'vip', price: Math.round(distance * TRANSPORT_PRICES.BASE_PRICES.vip * fuelFactor), label: "VIP / ليموزين" }
                ];
                
                response.transportOptions = options;
                
                // Estimate total trip cost if days and budget are known
                const days = response.extractedData.days || currentExtractedData?.days || 0;
                const budget = response.extractedData.budget || currentExtractedData?.budget || 'medium';
                
                if (days > 0) {
                    const dailyRate = budget === 'low' ? 600 : budget === 'high' ? 3500 : 1400;
                    const accommodationCost = days * dailyRate;
                    const transportCost = options[0].price; // Use cheapest as base
                    response.estimatedPriceEGP = accommodationCost + transportCost;
                }
            }
        }

        // Map back detected cities if AI extraction was slightly different
        if (detectedOrigin && !response.extractedData.transportOrigin) response.extractedData.transportOrigin = detectedOrigin;
        if (detectedDest && !response.extractedData.transportDestination) response.extractedData.transportDestination = detectedDest;

        return response;
    } catch (e) {
        console.error("AI Assistant Error:", e);
        return fallbackAI(userMessage, currentExtractedData);
    }
}

export async function generateItinerary(
    destination: string,
    days: number,
    selectedItems: any[],
    budget?: string | null
): Promise<GeneratedItineraryResponse> {
     // Build rich item descriptions with coordinates
     const itemDescriptions = selectedItems.map((item, idx) => {
       const latLng = item.lat && item.lng ? `(${item.lat.toFixed(4)}, ${item.lng.toFixed(4)})` : '';
       const dur = item.estimatedDuration ? `~${item.estimatedDuration} دقيقة` : '';
       const cost = item.costLevel || '';
       return `${idx + 1}. ${item.name} [${item.type}] ${latLng} ${dur} ${cost}`;
     }).join('\n');

     const budgetContext = budget
       ? `\nالميزانية: ${budget === 'low' ? 'اقتصادية - ركز على الأماكن المجانية والرخيصة' : budget === 'high' ? 'فاخرة - اقترح تجارب مميزة' : 'متوسطة'}`
       : '';

     const prompt = `أنت خبير تنظيم رحلات سياحية في مصر. نظّم الأماكن التالية في جدول رحلة لمدة ${days} أيام في ${destination}.
${budgetContext}

قواعد مهمة:
1. جمّع الأماكن القريبة جغرافياً في نفس اليوم (استخدم الإحداثيات)
2. حد أقصى 5 أماكن في اليوم و 8 ساعات أنشطة
3. رتب كل يوم: الصباح → معالم سياحية، الظهر → غداء، العصر → أنشطة، المساء → عشاء/استرخاء
4. أضف وقت تنقل واقعي بين الأماكن (15-30 دقيقة)
5. كل يوم يبدأ 9:00 AM وينتهي قبل 9:00 PM
6. اعطِ كل يوم عنوان جذاب واسم منطقة

الأماكن المختارة:
${itemDescriptions}

أرجع النتيجة بصيغة JSON فقط:
{
  "title": "عنوان جذاب للرحلة بالعربي",
  "description": "وصف شيق للرحلة في 2 سطر",
  "days": [
    {
      "dayNum": 1,
      "title": "عنوان جذاب لليوم",
      "area": "اسم المنطقة/الحي",
      "color": "#HEX_COLOR",
      "activities": [
         {
           "name": "اسم المكان كما هو",
           "time": "10:00 AM",
           "endTime": "12:00 PM",
           "duration": 120,
           "note": "وصف قصير أو نصيحة",
           "type": "attraction أو restaurant",
           "coordinates": {"lat": 30.0444, "lng": 31.2357}
         }
      ]
    }
  ]
}`;

    try {
        const res = await fetch(GROQ_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" }
            })
        });

        if (!res.ok) throw new Error("Groq API Error");
        const data = await res.json();
        return JSON.parse(data.choices[0].message.content);
    } catch (e) {
        throw new Error("فشل تنظيم الرحلة ذكياً.");
    }
}
