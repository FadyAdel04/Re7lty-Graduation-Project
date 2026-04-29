import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Mail, Globe, Sparkles, MapPin, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

const logo = "/assets/logo.webp";
import googlePlayBadge from "@/assets/googleplaybadge.png";
import appStoreBadge from "@/assets/appleStore.png";

const Footer = () => {
  return (
    <footer 
      className="relative border-t border-border overflow-hidden font-cairo bg-background transition-colors duration-500" 
      dir="rtl"
    >
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 rounded-full blur-[100px] bg-primary/10" />
        <div className="absolute bottom-[-10%] left-[-5%] w-64 h-64 rounded-full blur-[80px] bg-secondary/10" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Main Footer Content */}
        <div className="pt-20 pb-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">
          
          {/* Brand Column (4 Cols) */}
          <div className="lg:col-span-5 space-y-8">
            <Link to="/" className="inline-block group">
              <img src={logo} alt="رحلتي" className="h-20 w-20 drop-shadow-sm group-hover:scale-105 transition-transform duration-500" />
            </Link>
            <p className="text-lg font-bold leading-relaxed max-w-md text-muted-foreground">
              اكتشف العالم بعيون المسافرين. رحلتي هي بوصلتك لتخطيط مغامرتك القادمة، ومشاركة تجاربك الملهمة مع مجتمع يعشق الاستكشاف.
            </p>
            
            <div className="flex items-center gap-3">
              {[
                { icon: Facebook, color: "hover:bg-[#1877F2]", link: "#", name: "تواصل معنا عبر فيسبوك" },
                { icon: Twitter, color: "hover:bg-[#1DA1F2]", link: "#", name: "تواصل معنا عبر تويتر" },
                { icon: Instagram, color: "hover:bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]", link: "#", name: "تواصل معنا عبر انستجرام" },
                { icon: Mail, color: "hover:bg-primary", link: "#", name: "ارسل لنا بريد إلكتروني" },
              ].map((social, i) => (
                <a 
                  key={i} 
                  href={social.link} 
                  aria-label={social.name}
                  className="w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-white transition-all duration-300 shadow-sm"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>


          </div>

          {/* Navigation Links (2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-foreground font-black text-lg flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              روابط سريعة
            </h3>
            <ul className="space-y-4">
              {[
                { name: "الرئيسية", path: "/" },
                { name: "اكتشف الرحلات", path: "/discover" },
                { name: "رحلات الشركات", path: "/templates" },
                { name: "المتصدرين", path: "/leaderboard" },
              ].map((link, i) => (
                <li key={i}>
                  <Link to={link.path} className="text-muted-foreground font-bold hover:text-primary hover:pr-2 transition-all duration-300 flex items-center gap-2 group">
                    <div className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-primary transition-colors" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links (2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-foreground font-black text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-500" />
              مركز الدعم
            </h3>
            <ul className="space-y-4">
              {[
                { name: "الدعم", path: "/support" },
                { name: "التحقق من الحجز", path: "/verify-booking" },
                { name: "مركز المساعدة", path: "/help" },
                { name: "اتصل بنا", path: "/contact" },
                { name: "الشروط والأحكام", path: "/terms" },
                { name: "سياسة الخصوصية", path: "/privacy" },
              ].map((link, i) => (
                <li key={i}>
                  <Link to={link.path} className="text-muted-foreground font-bold hover:text-primary hover:pr-2 transition-all duration-300 flex items-center gap-2 group">
                    <div className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-primary transition-colors" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter / Contact (3 Columns) */}
          <div className="lg:col-span-3 space-y-6">
            <h3 className="text-foreground font-black text-lg">تواصل معنا</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <p className="text-muted-foreground text-sm font-bold leading-relaxed">
                  الاسكندرية، مصر <br />
                  سموحة
                </p>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <p className="text-muted-foreground text-sm font-bold leading-relaxed">
                  +20 123 456 7890 <br />
                  9 ص - 6 م (الأحد-الخميس)
                </p>
              </div>
            </div>

{/* App Badges - Fixed dimensions version */}
<div className="pt-6 space-y-3">
  <p className="text-muted-foreground text-xs font-bold">قريباً على الهواتف الذكية</p>
  <div className="grid grid-cols-2 gap-3">
    <div className="opacity-40 grayscale cursor-not-allowed select-none">
      <img 
        src={appStoreBadge}
        alt="App Store" 
        className="h-12 w-full object-contain"
        loading="lazy"
      />
    </div>
    <div className="opacity-40 grayscale cursor-not-allowed select-none">
      <img 
        src={googlePlayBadge} 
        alt="Google Play" 
        className="h-12 w-full object-contain"
        loading="lazy"
      />
    </div>
  </div>
</div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="py-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm font-bold">
            © 2025-2026 <span className="text-primary">رحلتي - Triply</span>. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-muted-foreground text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              كافة الأنظمة تعمل بشكل مثالي
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

