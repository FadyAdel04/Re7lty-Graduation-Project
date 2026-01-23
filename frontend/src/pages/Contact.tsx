import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MapPin, Send, Loader2 } from "lucide-react";
import { complaintsService } from "@/services/complaintsService";
// import { useAuth } from "@clerk/clerk-react"; // Moved to next block for safer replacement

import { useAuth } from "@clerk/clerk-react";

const Contact = () => {
  const { toast } = useToast();
  const { getToken, isSignedIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSignedIn) {
      toast({
        title: "تنبيه",
        description: "يجب تسجيل الدخول لإرسال رسالة ولتلقي التحديثات والإشعارات.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      await complaintsService.submitComplaint(formData, token || undefined);
      
      toast({
        title: "تم الإرسال",
        description: "شكراً لتواصلك معنا. سنرد عليك في أقرب وقت ممكن.",
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.response?.data?.error || "فشل إرسال الرسالة. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12 sm:py-16 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">اتصل بنا</h1>
          <p className="text-muted-foreground text-lg">
            نحن هنا للإجابة على جميع استفساراتك
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                البريد الإلكتروني
              </CardTitle>
            </CardHeader>
            <CardContent>
              <a href="mailto:contact@re7lty.com" className="text-primary hover:underline">
                contact@re7lty.com
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
              <a href="tel:+201234567890" className="text-primary hover:underline">
                +20 123 456 7890
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                العنوان
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                القاهرة، مصر
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>أرسل لنا رسالة</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">الاسم *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="اسمك الكامل"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="example@email.com"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">الموضوع</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="موضوع رسالتك"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">الرسالة *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="اكتب رسالتك هنا..."
                  rows={6}
                  required
                />
              </div>
              <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 ml-2" />
                    إرسال الرسالة
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;

