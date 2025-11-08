import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, MapPin, Settings, Shield } from "lucide-react";

const Help = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12 sm:py-16 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">مركز المساعدة</h1>
          <p className="text-muted-foreground text-lg">
            دليل شامل لاستخدام منصة رحلتي
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                البدء مع رحلتي
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">إنشاء حساب جديد</h3>
                <p className="text-muted-foreground">
                  قم بإنشاء حساب جديد من خلال النقر على "تسجيل الدخول" ثم "إنشاء حساب جديد".
                  يمكنك استخدام بريدك الإلكتروني أو حسابك على Google.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">إنشاء رحلة جديدة</h3>
                <p className="text-muted-foreground">
                  بعد تسجيل الدخول، انقر على "أنشئ رحلة" واملأ التفاصيل المطلوبة.
                  يمكنك إضافة صور وفيديوهات لرحلتك لتجعلها أكثر جاذبية.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                استخدام الميزات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">استكشاف الرحلات</h3>
                <p className="text-muted-foreground">
                  تصفح الرحلات المتاحة من الصفحة الرئيسية أو من صفحة "استكشف الرحلات".
                  يمكنك البحث عن رحلات محددة أو تصفيتها حسب المدينة أو المدة أو الميزانية.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">الإعجاب والتفاعل</h3>
                <p className="text-muted-foreground">
                  يمكنك الإعجاب بالرحلات وحفظها للمراجعة لاحقاً. يمكنك أيضاً مشاركة الرحلات مع أصدقائك.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">التعليقات</h3>
                <p className="text-muted-foreground">
                  اترك تعليقات على الرحلات لتبادل الخبرات مع المسافرين الآخرين.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                الملف الشخصي
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">تعديل الملف الشخصي</h3>
                <p className="text-muted-foreground">
                  يمكنك تعديل معلومات ملفك الشخصي وصورة الغلاف من صفحة ملفك الشخصي.
                  انقر على زر "تعديل" لتحديث معلوماتك.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">عرض رحلاتك</h3>
                <p className="text-muted-foreground">
                  جميع رحلاتك المنشورة تظهر في ملفك الشخصي. يمكن للزوار رؤية رحلاتك العامة.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                الإعدادات والأمان
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">تغيير كلمة المرور</h3>
                <p className="text-muted-foreground">
                  يمكنك تغيير كلمة المرور من إعدادات حسابك في Clerk.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">حذف الحساب</h3>
                <p className="text-muted-foreground">
                  يمكنك حذف حسابك من إعدادات Clerk. يرجى ملاحظة أن هذا الإجراء لا يمكن التراجع عنه.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                الخصوصية والأمان
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">معلوماتك الشخصية</h3>
                <p className="text-muted-foreground">
                  نحن نحمي معلوماتك الشخصية ونستخدمها فقط لتحسين تجربتك على المنصة.
                  يمكنك الاطلاع على سياسة الخصوصية لمزيد من التفاصيل.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">الإبلاغ عن محتوى</h3>
                <p className="text-muted-foreground">
                  إذا وجدت محتوى غير مناسب، يمكنك الإبلاغ عنه من خلال صفحة الرحلة.
                  سنقوم بمراجعة البلاغات واتخاذ الإجراءات اللازمة.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Help;

