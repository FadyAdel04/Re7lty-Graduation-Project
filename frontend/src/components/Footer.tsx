import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Mail, Globe, Sparkles, MapPin, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { seasonalConfig } from "@/config/seasonalConfig";

const logo = "/assets/logo.png";

const Footer = () => {
  return (
    <footer className={cn("relative border-t border-gray-100 overflow-hidden font-cairo", seasonalConfig.isRamadanTheme ? "bg-[#050E17] border-gold/20" : "bg-white")} dir="rtl">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40">
        <div className={cn("absolute top-[-10%] right-[-5%] w-96 h-96 rounded-full blur-[100px]", seasonalConfig.isRamadanTheme ? "bg-gold/10" : "bg-indigo-50")} />
        <div className={cn("absolute bottom-[-10%] left-[-5%] w-64 h-64 rounded-full blur-[80px]", seasonalConfig.isRamadanTheme ? "bg-gold/5" : "bg-orange-50")} />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Main Footer Content */}
        <div className="pt-20 pb-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">
          
          {/* Brand Column (4 Cols) */}
          <div className="lg:col-span-5 space-y-8">
            <Link to="/" className="inline-block group">
              <img src={logo} alt="رحلتي" className="h-20 w-20 drop-shadow-sm group-hover:scale-105 transition-transform duration-500" />
            </Link>
            <p className={cn("text-lg font-bold leading-relaxed max-w-md", seasonalConfig.isRamadanTheme ? "text-white/80" : "text-gray-500")}>
              اكتشف العالم بعيون المسافرين. رحلتي هي بوصلتك لتخطيط مغامرتك القادمة، ومشاركة تجاربك الملهمة مع مجتمع يعشق الاستكشاف.
            </p>
            
            <div className="flex items-center gap-3">
              {[
                { icon: Facebook, color: "hover:bg-[#1877F2]", link: "#" },
                { icon: Twitter, color: "hover:bg-[#1DA1F2]", link: "#" },
                { icon: Instagram, color: "hover:bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]", link: "#" },
                { icon: Mail, color: "hover:bg-indigo-600", link: "#" },
              ].map((social, i) => (
                <a 
                  key={i} 
                  href={social.link} 
                  className={cn(
                    "w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300 shadow-sm",
                    social.color
                  )}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>


          </div>

          {/* Navigation Links (2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            <h4 className="text-gray-900 font-black text-lg flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-600" />
              روابط سريعة
            </h4>
            <ul className="space-y-4">
              {[
                { name: "الرئيسية", path: "/" },
                { name: "اكتشف الرحلات", path: "/discover" },
                { name: "رحلات الشركات", path: "/templates" },
                { name: "المتصدرين", path: "/leaderboard" },
              ].map((link, i) => (
                <li key={i}>
                  <Link to={link.path} className="text-gray-500 font-bold hover:text-indigo-600 hover:pr-2 transition-all duration-300 flex items-center gap-2 group">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-200 group-hover:bg-indigo-600 transition-colors" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links (2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            <h4 className="text-gray-900 font-black text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-500" />
              مركز الدعم
            </h4>
            <ul className="space-y-4">
              {[
                { name: "الدعم", path: "/support" },
                { name: "مركز المساعدة", path: "/help" },
                { name: "اتصل بنا", path: "/contact" },
                { name: "الشروط والأحكام", path: "/terms" },
                { name: "سياسة الخصوصية", path: "/privacy" },
              ].map((link, i) => (
                <li key={i}>
                  <Link to={link.path} className="text-gray-500 font-bold hover:text-indigo-600 hover:pr-2 transition-all duration-300 flex items-center gap-2 group">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-200 group-hover:bg-indigo-600 transition-colors" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter / Contact (3 Columns) */}
          <div className="lg:col-span-3 space-y-6">
            <h4 className="text-gray-900 font-black text-lg">تواصل معنا</h4>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <p className="text-gray-500 text-sm font-bold leading-relaxed">
                  الاسكندرية، مصر <br />
                  سموحة
                </p>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <p className="text-gray-500 text-sm font-bold leading-relaxed">
                  +20 123 456 7890 <br />
                  9 ص - 6 م (الأحد-الخميس)
                </p>
              </div>
            </div>

            {/* App Badges */}
            <div className="pt-6 space-y-3">
              <p className="text-gray-400 text-xs font-bold">قريباً على الهواتف الذكية</p>
              <div className="flex flex-row flex-wrap gap-3">
                <div className="opacity-40 grayscale cursor-not-allowed select-none">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" 
                    alt="App Store" 
                    className="h-10 w-auto"
                    loading="lazy"
                    width="120"
                    height="40"
                  />
                </div>
                <div className="opacity-40 grayscale cursor-not-allowed select-none">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" 
                    alt="Google Play" 
                    className="h-10 w-auto"
                    loading="lazy"
                    width="135"
                    height="40"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="py-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-sm font-bold">
            © 2025-2026 <span className="text-indigo-600">رحلتي - Triply</span>. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-gray-300 text-xs font-black uppercase tracking-widest flex items-center gap-2">
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

