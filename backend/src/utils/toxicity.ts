
import { createNotification } from "./notificationDispatcher";

const DATASET_URL = "https://datasets-server.huggingface.co/rows?dataset=JiangNiaoMiao%2FMLMA_hate_speech&config=default&split=train&offset=0&length=100";

// Fallback blocklist (basic terms - extended via dataset)
// Extended blocklist reference from backend/uploads/words.js
const FALBACK_BLOCKLIST = new Set([
    // Core profanity
    "👉👌", "🖕", "احا", "احه", "اير", "لعين", "واطي", "ابن ال", "ابن المرا", "ابن المرة",
    "ابن النيك", "ابن عاهر", "ابن كلب", "ابو شخة", "ابو شخه", "ابو فص", "اجا معي", "اجري فيك",
    "احلي كث", "احيه", "اخو ال", "اخو القحبه", "افسخك", "اقلب وجهك", "الخرائ", "الزب", "السافل",
    "الساقط", "العايب", "العربان", "العرص", "العمى", "القحبة", "الكحبة", "الكحبه", "الكس",
    "الكلب", "الله ياخ", "انت عبيط", "انت غبي", "انذال", "انذل", "انعل ابو", "انكح", "انيك",
    "انيكك", "اهبل", "اونطة", "اونطه", "اونطي", "ايري ب", "ايري ف", "ايري", "ايور", "بزاز",
    "بعبص", "بعص", "بغاي", "بندوق", "بهيمة", "تافه", "تجليخ", "ترهيط", "تزغيب", "تسد بوزك",
    "تفو", "جلخ", "جلق", "حرامي", "حقير", "حلبتها", "حلبتو", "حلمات", "حمير", "حيوان",
    "خرا", "خراء", "خراي عل", "خراي", "خرة", "خرى", "خري", "خسيس", "خنيث", "خوازيق",
    "خول", "داشر", "داعر", "دعارة", "دلخ", "ديوث", "ديود", "زامل", "زب", "زبار",
    "زبالة", "زباله", "زبر", "زبه", "زبي", "زراط", "زق", "زناة", "زناطير", "ساذج",
    "سارموتا", "سافل", "سربوط", "سرموتا", "سفالة", "سكس", "سكسي", "سيكس", "سيكسي", "شرمها",
    "شرموط", "شرموطة", "شرموطه", "شلقة", "شلكة", "صايع", "صياعة", "ضرب عشرة", "طز في", "طيز",
    "عاهر", "عاهرة", "عايبة", "عبيط", "عديم الشرف", "عرص", "عكروت", "عيال الحرام", "غبي", "غتصب",
    "فاجر", "فاسق", "فجور", "فسختها", "قحاب", "قحب", "قحبة", "قذر", "قضيب كبير", "قضيبي",
    "كحبة", "كذاب", "كس", "كس اختك", "كس امك", "كس عرضك", "كسا", "كسمك", "كسمكم", "كسها",
    "كل خرا", "كل خرة", "كل زق", "كلاب", "كلب", "كلخر", "كلكم اولاد", "كلكم ولاد", "كول خر",
    "لحس", "لعنه", "لقحاب", "لوطي", "مأجور", "مبعوص", "متخوزق", "متناك", "مجنون", "مخانيث",
    "مخنث", "مدلس", "معوهر", "مفسوخ", "مكسكس", "مكوتها", "ملعون", "ممحون", "منايك", "منيك",
    "منيوك", "ناكك", "نجس", "نذل", "نفضك", "نفظك", "نكت اخته", "نكت امه", "نياكة", "نياكه",
    "هاذي اختك", "هاذي امك", "هذي اختك", "هذي امك", "واحد اهبل", "وسخ", "ولد القحبة", "ولد القحبه",
    "يا ابن ال", "يا اخوات ال", "يا خوات ال", "يا رخيص", "يا زنديق", "يا غبي", "يا كافر", "يا هبيلة",
    "يا ولاد ال", "يتناك", "يجيب ضهرو", "يخلع نيعك", "يسود وجه", "يزغب", "يفضح", "يفظح", "يولاد ال",
    "يلعن",

    // Trip/Service specific negativity
    "الرحله خرا", "الرحله زباله", "الرحله زبالة", "الرحله معفنه", "الرحله معفنة", "الرحله زفت",
    "رحله خرا", "رحله زباله", "رحله زبالة", "رحله معفنه", "رحله معفنة", "رحله زفت",
    "رحلة خرا", "رحلة زباله", "رحلة زبالة", "رحلة معفنه", "رحلة معفنة", "رحلة زفت",
    "رحلة خايسه", "رحلة خايسة", "رحله خايسه", "رحله خايسة", "الرحلة خايسه", "الرحلة خايسة",
    "الرحله خايسه", "الرحله خايسة", "رحلة كأنها جحيم", "رحلة جحيم", "رحله جحيم",
    "أسوأ رحلة", "أسوأ رحله", "أسوأ حاجة", "رحلة مقرفة", "رحله مقرفه", "رحلة مقززة",
    "رحله مقززه", "رحلة مقشة", "رحله مقشة", "رحلة مقيطة", "رحله مقيطة", "رحلة عذاب", "رحله عذاب",
    "رحلة تعب", "رحله تعب", "رحلة مضيعة وقت", "رحله مضيعة وقت", "رحلة مضيعة فلوس", "رحله مضيعة فلوس",
    "رحلة خسارة", "رحله خسارة", "رحلة نصب", "رحله نصب", "رحلة سرقة", "رحله سرقة",
    "رحلة غلطة", "رحله غلطة", "رحلة ندم", "رحله ندم", "الخدمة خرا", "الخدمة زباله", "الخدمة معفنه",
    "الخدمة زفت", "خدمة خرا", "خدمة زباله", "خدمة معفنه", "خدمة زفت", "فندق زباله", "فندق زبالة",
    "فندق معفن", "فندق زفت", "الفندق زباله", "الفندق زبالة", "الفندق معفن", "الفندق زفت",
    "الطياره زي الزفت", "الطائرة زي الزفت", "طياره زفت", "طائرة زفت", "الباص خرا", "الباص زباله",
    "الباص معفن", "الباص زفت", "باص خرا", "باص زباله", "باص معفن", "باص زفت",
    "الغرفة وسخة", "الغرفة وسخه", "الغرفة قذرة", "الغرفة قذره", "غرفة وسخة", "غرفة وسخه",
    "غرفة قذرة", "غرفة قذره", "الاكل خرا", "الاكل زباله", "الاكل معفن", "الاكل زفت",
    "أكل خرا", "أكل زباله", "أكل معفن", "أكل زفت", "الموقع خرا", "الموقع زباله", "الموقع معفن",
    "الموقع زفت", "موقع خرا", "موقع زباله", "موقع معفن", "موقع زفت", "مشروع نصابين",
    "شركة نصابة", "شركة نصابين", "بيزنس خرا", "بيزنس زباله", "بيزنس معفن", "تجربة مخيسة",
    "تجربه مخيسه", "تجربة تعيسة", "تجربه تعيسه", "زي الزفت", "مثل الزفت", "خايس", "خايسين",
    "معفن", "معفنين", "زفت", "زفتين", "زباله", "زبالة", "زبالين", "مخيس", "مخيسين",
    "مقرف", "مقرفين", "مقزز", "مقززين", "مقش", "مقشين", "مقيط", "مقيطين", "وسخ", "وسخين",
    "قذر", "قذرين", "سئ", "سيء", "سئين", "مش مستاهل", "مش مستاهلة", "مش ملهاش لازمة",
    "عبيط", "غبي", "اهبل", "فاشل", "فاشلة", "فاشلين", "بائس", "بئيسين", "حقير", "حقيرين",
    "غشيم", "غشيمين", "نصب", "نصابة", "نصبوني", "نصابين", "سرق", "سرقوني", "سراقين", "سارقين",
    "غالين اوي", "غاليين فشخ", "غلاء فاحش", "مكسبين علينا", "خدعونا", "خداع", "مخادعين",
    "خايبين", "خيبانين", "كئيبة", "كئيبين", "مكتئب", "مكتئبين", "شحتة", "شحتين",
    "مقاطيع", "مقاطيعين", "متفه", "متفهين", "تافه", "تافهين", "مغفل", "مغفلين",
    "ساذج", "ساذجين", "حمير", "حميري", "حمار", "حمارة", "حمارين", "كلاب", "كلب", "كلابي",
    "تهريج", "تهريج فاضح", "فضيحة", "فضايح", "كارثه", "كارثة", "مصيبة", "مصائب",
    "انهيار", "مفشوخ", "منهوك", "منهوكين", "متعوب", "متعوبين", "مضروب", "مضروبين",
    "مكسور", "مكسورين", "متشقق", "متشققين", "متهالك", "متهالكين", "قديم", "قديمة",
    "قدام", "عتيق", "عتيقين", "بالية", "بالى", "مهمل", "مهملين", "مهترئ", "مهترئين",
    "مهمش", "مهمشين"
]);

function normalizeArabic(text: string) {
    return text
        .replace(/[أإآ]/g, "ا")
        .replace(/[ًٌٍَُِّْ]/g, "")
        .replace(/[ة]/g, "ه") // Optional: normalize ta-marbuta
        .replace(/[ى]/g, "ي"); // Optional: normalize alef maqsura
}

class ToxicityService {
    // Initialize with normalized versions of the fallback list
    private toxicWords: Set<string> = new Set(
        Array.from(FALBACK_BLOCKLIST).map(w => normalizeArabic(w))
    );
    private isReady: boolean = false;
    private isLoading: boolean = false;

    constructor() {
        this.init();
    }

    private async init() {
        if (this.isLoading) return;
        this.isLoading = true;
        try {
            console.log("[ToxicityService] Fetching dataset from HuggingFace...");
            const response = await fetch(DATASET_URL);
            if (!response.ok) {
                throw new Error(`Failed to fetch dataset: ${response.statusText}`);
            }

            const data = await response.json();
            this.processDataset(data.rows);
            this.isReady = true;
            console.log(`[ToxicityService] Initialized with ${this.toxicWords.size} toxic terms.`);
        } catch (error) {
            console.error("[ToxicityService] Failed to initialize from dataset, using fallback:", error);
            this.isReady = true; // Fallback to basic list
        } finally {
            this.isLoading = false;
        }
    }

    private processDataset(rows: any[]) {
        const toxicCounts: Record<string, number> = {};
        const normalCounts: Record<string, number> = {};
        const totalToxic = new Set<string>();

        rows.forEach((item: any) => {
            const row = item.row;
            const text = row.tweet || "";
            const label = row.sentiment;
            const isToxic = ["hateful_normal", "offensive", "offensive_disrespectful", "hateful"].includes(label);

            const tokens = this.tokenize(text);

            tokens.forEach(token => {
                if (token.length < 3) return; // Skip short words
                if (isToxic) {
                    toxicCounts[token] = (toxicCounts[token] || 0) + 1;
                    totalToxic.add(token);
                } else {
                    normalCounts[token] = (normalCounts[token] || 0) + 1;
                }
            });
        });

        // Identify words that are predominantly toxic
        // Heuristic: Appears in toxic tweets >= 2 times, and Toxic/Total ratio > 0.8
        Object.keys(toxicCounts).forEach(word => {
            const tCount = toxicCounts[word];
            const nCount = normalCounts[word] || 0;
            const total = tCount + nCount;

            if (tCount >= 2 && (tCount / total) > 0.8) {
                this.toxicWords.add(word);
            }
        });

        // Add high confidence words directly if they appear often enough regardless of ratio (e.g. strict slurs)
        // (Skipped to avoid noise, relying on ratio)
    }

    private tokenize(text: string): string[] {
        // Remove special chars, handle normalization, keep Arabic letters
        const normalized = normalizeArabic(text.toLowerCase());
        return normalized
            .replace(/[^\u0600-\u06FF\s]/g, " ") // Keep only Arabic chars and spaces
            .split(/\s+/)
            .filter(w => w.length > 0);
    }

    public async checkText(text: string, userId: string, actorName: string): Promise<{ isToxic: boolean; reason?: string }> {
        if (!this.isReady && !this.isLoading) {
            this.init(); // Retry init if failed previously
        }

        const tokens = this.tokenize(text);
        const badWordsFound = tokens.filter(t => this.toxicWords.has(t));

        if (badWordsFound.length > 0) {
            // Log the deletion/warning attempt
            console.log(`[ToxicityService] Blocked comment from ${userId}. Bad words: ${badWordsFound.join(", ")}`);

            // Send Warning Notification
            try {
                await createNotification({
                    recipientId: userId,
                    actorId: "system", // System ID
                    actorName: "System Warning",
                    actorImage: "", // System icon
                    type: "system",
                    message: `تم حذف تعليقك لأنه يحتوي على محتوى غير لائق (${badWordsFound[0]}...). يرجى الالتزام بمعايير المجتمع لتجنب حظر الحساب.`,
                    metadata: {
                        reason: "toxicity",
                        detectedWords: badWordsFound
                    }
                });
            } catch (err) {
                console.error("[ToxicityService] Failed to send warning notification:", err);
            }

            return { isToxic: true, reason: `Contains forbidden words: ${badWordsFound.join(", ")}` };
        }

        // "Calculate Trip Post Rate and Community"
        // Since this is just a check function, we return OK.
        // The statistics can be updated in the main route.

        return { isToxic: false };
    }

    public async scheduleCheck(
        text: string,
        userId: string,
        authorName: string,
        tripId: any,
        commentId: any
    ) {
        // Run async check after 3 seconds
        setTimeout(async () => {
            try {
                if (!this.isReady && !this.isLoading) {
                    await this.init();
                }

                const tokens = this.tokenize(text);
                const badWordsFound = tokens.filter(t => this.toxicWords.has(t));

                if (badWordsFound.length > 0) {
                    // It is toxic! We must delete it from the DB.
                    console.log(`[ToxicityService] Async check detected toxicity from user ${userId}. Deleting comment ${commentId}...`);

                    // Import inside function to avoid circular dependencies if possible, or assume Trip model is global/imported.
                    // But here we need to delete the comment. Models are in ../models/Trip
                    // It's cleaner to pass a callback or handle deletion here if we import the model.
                    // Let's dynamically import to minimize coupling issues or just importing at top if safe.

                    const { Trip } = await import("../models/Trip");
                    const trip = await Trip.findById(tripId);

                    if (trip) {
                        const comment = trip.comments?.id(commentId);
                        if (comment) {
                            // Delete the comment
                            const updatedComments = trip.comments?.filter((c: any) => String(c._id) !== String(commentId)) || [];
                            trip.set('comments', updatedComments);
                            await trip.save();
                            // Archive the toxic comment
                            const { RemovedComment } = await import("../models/RemovedComment");
                            await RemovedComment.create({
                                originalCommentId: commentId,
                                tripId: tripId,
                                userId: userId,
                                authorName: authorName,
                                content: text,
                                detectedWords: badWordsFound,
                                reason: "toxicity_auto_filter",
                            });

                            // Send Warning Notification
                            await createNotification({
                                recipientId: userId,
                                actorId: "system",
                                actorName: "نظام الحماية",
                                actorImage: "https://cdn-icons-png.flaticon.com/512/10308/10308979.png", // Security Shield Icon
                                type: "system",
                                tripId: tripId,
                                message: `عذراً، تم حذف تعليقك لاحتوائه على كلمات محظورة (${badWordsFound[0]}). يرجى الالتزام بمعايير المجتمع للحفاظ على حسابك.`,
                                metadata: {
                                    reason: "toxicity",
                                    detectedWords: badWordsFound
                                }
                            });
                        }
                    }
                }
            } catch (error) {
                console.error("[ToxicityService] Error in scheduled check:", error);
            }
        }, 3000); // 3 seconds delay
    }
}

export const toxicityService = new ToxicityService();
