import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, MessageSquare, Mail, Phone } from "lucide-react";

const Support = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12 sm:py-16 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">الدعم</h1>
          <p className="text-muted-foreground text-lg">
            نحن هنا لمساعدتك في أي استفسار أو مشكلة تواجهها
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                مركز المساعدة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                ابحث عن إجابات لأسئلتك الشائعة في مركز المساعدة
              </p>
              <a href="/help" className="text-primary hover:underline">
                زيارة مركز المساعدة →
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                الدردشة المباشرة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                تحدث مع فريق الدعم مباشرة للحصول على مساعدة فورية
              </p>
              <p className="text-sm text-muted-foreground">
                متاح من الساعة 9 صباحاً حتى 6 مساءً
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                البريد الإلكتروني
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-2">
                أرسل لنا بريداً إلكترونياً وسنرد عليك في أقرب وقت
              </p>
              <a href="mailto:support@re7lty.com" className="text-primary hover:underline">
                support@re7lty.com
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                الهاتف
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-2">
                اتصل بنا مباشرة على الرقم التالي
              </p>
              <a href="tel:+201234567890" className="text-primary hover:underline">
                +20 123 456 7890
              </a>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>أسئلة شائعة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">كيف يمكنني إنشاء رحلة جديدة؟</h3>
              <p className="text-muted-foreground">
                يمكنك إنشاء رحلة جديدة من خلال النقر على زر "أنشئ رحلة" في الصفحة الرئيسية أو من القائمة العلوية.
                ستحتاج إلى تسجيل الدخول أولاً.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">كيف يمكنني تعديل رحلتي؟</h3>
              <p className="text-muted-foreground">
                يمكنك تعديل رحلتك من خلال زيارة صفحة الرحلة والنقر على زر "تعديل" إذا كنت صاحب الرحلة.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">كيف يمكنني حذف رحلتي؟</h3>
              <p className="text-muted-foreground">
                يمكنك حذف رحلتك من صفحة تعديل الرحلة. يرجى ملاحظة أن هذا الإجراء لا يمكن التراجع عنه.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Support;

