import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12 sm:py-16 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">الشروط والأحكام</h1>
          <p className="text-muted-foreground text-lg">
            آخر تحديث: يناير 2025
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-6">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. قبول الشروط</h2>
              <p className="text-muted-foreground leading-relaxed">
                من خلال الوصول إلى واستخدام منصة رحلتي، فإنك تقبل وتوافق على الالتزام بهذه الشروط والأحكام.
                إذا كنت لا توافق على أي جزء من هذه الشروط، فيجب عليك عدم استخدام المنصة.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. استخدام المنصة</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                يمكنك استخدام منصة رحلتي للأغراض القانونية فقط. أنت توافق على:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mr-4">
                <li>عدم استخدام المنصة لأي غرض غير قانوني أو غير مصرح به</li>
                <li>عدم نشر محتوى مسيء أو غير لائق أو مخالف للقوانين</li>
                <li>عدم محاولة الوصول غير المصرح به إلى المنصة أو أنظمتها</li>
                <li>عدم استخدام المنصة لإرسال رسائل غير مرغوب فيها أو بريد عشوائي</li>
                <li>احترام حقوق الملكية الفكرية للآخرين</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. المحتوى</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                أنت تحتفظ بحقوق الملكية الفكرية للمحتوى الذي تنشره على المنصة. من خلال نشر المحتوى، فإنك تمنحنا ترخيصاً غير حصري لاستخدامه وعرضه وتوزيعه على المنصة.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                أنت مسؤول عن المحتوى الذي تنشره وتضمن أن لديك الحق في نشره. نحن نحتفظ بالحق في إزالة أي محتوى نعتقد أنه ينتهك هذه الشروط.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. الحسابات</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                أنت مسؤول عن الحفاظ على سرية معلومات حسابك وكلمة المرور. أنت توافق على:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mr-4">
                <li>عدم مشاركة معلومات حسابك مع أي شخص آخر</li>
                <li>الإبلاغ فوراً عن أي استخدام غير مصرح به لحسابك</li>
                <li>أن تكون مسؤولاً عن جميع الأنشطة التي تحدث تحت حسابك</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. الإنهاء</h2>
              <p className="text-muted-foreground leading-relaxed">
                نحن نحتفظ بالحق في إنهاء أو تعليق حسابك في أي وقت، مع أو بدون إشعار، لأي سبب من الأسباب، بما في ذلك انتهاك هذه الشروط.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. إخلاء المسؤولية</h2>
              <p className="text-muted-foreground leading-relaxed">
                المنصة مقدمة "كما هي" دون أي ضمانات. نحن لا نضمن أن المنصة ستكون متاحة دائماً أو خالية من الأخطاء.
                نحن غير مسؤولين عن أي أضرار قد تنتج عن استخدام المنصة.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. التعديلات</h2>
              <p className="text-muted-foreground leading-relaxed">
                نحن نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إشعارك بأي تغييرات من خلال المنصة.
                استمرارك في استخدام المنصة بعد التعديلات يعني موافقتك على الشروط المحدثة.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. الاتصال</h2>
              <p className="text-muted-foreground leading-relaxed">
                إذا كان لديك أي أسئلة حول هذه الشروط، يرجى الاتصال بنا على:
                <a href="mailto:legal@re7lty.com" className="text-primary hover:underline mr-2">
                  legal@re7lty.com
                </a>
              </p>
            </section>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;

