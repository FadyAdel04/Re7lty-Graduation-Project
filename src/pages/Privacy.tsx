import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12 sm:py-16 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">سياسة الخصوصية</h1>
          <p className="text-muted-foreground text-lg">
            آخر تحديث: يناير 2025
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-6">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. مقدمة</h2>
              <p className="text-muted-foreground leading-relaxed">
                نحن في رحلتي نلتزم بحماية خصوصيتك. توضح سياسة الخصوصية هذه كيفية جمع واستخدام وحماية معلوماتك الشخصية عند استخدام منصتنا.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. المعلومات التي نجمعها</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                نجمع المعلومات التالية:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mr-4">
                <li>معلومات الحساب: الاسم، البريد الإلكتروني، صورة الملف الشخصي</li>
                <li>معلومات الرحلة: الرحلات التي تنشئها، الصور، الفيديوهات، والوصف</li>
                <li>معلومات الاستخدام: كيفية استخدامك للمنصة، الصفحات التي تزورها</li>
                <li>معلومات الجهاز: نوع المتصفح، عنوان IP، معلومات الجهاز</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. كيفية استخدام المعلومات</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                نستخدم معلوماتك للأغراض التالية:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mr-4">
                <li>توفير وتحسين خدمات المنصة</li>
                <li>معالجة طلباتك والتفاعل معك</li>
                <li>إرسال إشعارات مهمة حول خدماتنا</li>
                <li>تحليل استخدام المنصة لتحسين تجربتك</li>
                <li>حماية أمن المنصة ومنع الاحتيال</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. مشاركة المعلومات</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                نحن لا نبيع معلوماتك الشخصية. قد نشارك معلوماتك في الحالات التالية:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mr-4">
                <li>مع موفري الخدمات الذين يساعدوننا في تشغيل المنصة (مثل Clerk للمصادقة)</li>
                <li>عندما يكون ذلك مطلوباً بموجب القانون أو لحماية حقوقنا</li>
                <li>مع موافقتك الصريحة</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. أمان المعلومات</h2>
              <p className="text-muted-foreground leading-relaxed">
                نتخذ إجراءات أمنية معقولة لحماية معلوماتك من الوصول غير المصرح به أو التغيير أو الكشف أو التدمير.
                ومع ذلك، لا يمكن ضمان الأمان الكامل لأي معلومات عبر الإنترنت.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. ملفات تعريف الارتباط</h2>
              <p className="text-muted-foreground leading-relaxed">
                نستخدم ملفات تعريف الارتباط (Cookies) لتحسين تجربتك على المنصة. يمكنك تعطيل ملفات تعريف الارتباط من إعدادات المتصفح،
                ولكن قد يؤثر ذلك على وظائف المنصة.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. حقوقك</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                لديك الحق في:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mr-4">
                <li>الوصول إلى معلوماتك الشخصية</li>
                <li>تصحيح معلوماتك الشخصية</li>
                <li>حذف معلوماتك الشخصية</li>
                <li>الاعتراض على معالجة معلوماتك</li>
                <li>سحب موافقتك في أي وقت</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. التغييرات على سياسة الخصوصية</h2>
              <p className="text-muted-foreground leading-relaxed">
                قد نحدث سياسة الخصوصية هذه من وقت لآخر. سنقوم بإشعارك بأي تغييرات من خلال المنصة.
                استمرارك في استخدام المنصة بعد التغييرات يعني موافقتك على السياسة المحدثة.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">9. الاتصال بنا</h2>
              <p className="text-muted-foreground leading-relaxed">
                إذا كان لديك أي أسئلة حول سياسة الخصوصية هذه، يرجى الاتصال بنا على:
                <a href="mailto:privacy@re7lty.com" className="text-primary hover:underline mr-2">
                  privacy@re7lty.com
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

export default Privacy;

