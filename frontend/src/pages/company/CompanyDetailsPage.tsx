import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TripCardEnhanced from "@/components/TripCardEnhanced";
import TripCardSkeleton from "@/components/TripCardSkeleton";
import { Company, Trip } from "@/types/corporateTrips";
import { corporateTripsService } from "@/services/corporateTripsService";
import { Globe, Mail, MapPin, Phone, MessageSquare, ArrowRight, Share2, Building2, Info, Star, Award, ShieldCheck, TrendingUp, Users, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const CompanyDetailsPage = () => {
    const { id } = useParams<{ id: string }>();
    const { toast } = useToast();
    const [company, setCompany] = useState<Company | null>(null);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const companyData = await corporateTripsService.getCompanyById(id);
                if (!companyData) {
                    throw new Error("Company not found");
                }
                setCompany(companyData);

                const tripsData = await corporateTripsService.getTripsByCompany(id);
                setTrips(tripsData);
            } catch (error) {
                console.error("Error fetching company details:", error);
                toast({
                    title: "حدث خطأ",
                    description: "فشل تحميل بيانات الشركة",
                    variant: "destructive"
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, toast]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Header />
                <div className="flex-1 container mx-auto px-4 py-8 space-y-12">
                    <div className="h-80 bg-muted rounded-[3rem] animate-pulse" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       {[1, 2, 3].map(i => <TripCardSkeleton key={i} />)}
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (!company) {
        return (
            <div className="min-h-screen bg-background font-cairo" dir="rtl">
                <Header />
                <div className="flex-1 flex flex-col items-center justify-center text-center p-20">
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-32 h-32 bg-muted rounded-[2.5rem] flex items-center justify-center mb-8 border border-border shadow-2xl"
                    >
                        <Building2 className="w-16 h-16 text-muted-foreground/40" />
                    </motion.div>
                    <h2 className="text-4xl font-black text-foreground mb-4">الشركة غير موجودة</h2>
                    <p className="text-muted-foreground mb-10 text-lg font-bold">عذراً، لم نتمكن من العثور على الشركة المطلوبة.</p>
                    <Button asChild className="h-14 px-10 rounded-2xl font-black text-lg shadow-xl shadow-primary/20">
                        <Link to="/agency">العودة لوكالات السفر</Link>
                    </Button>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background font-cairo" dir="rtl">
            <Header />
            
            <main className="pb-24">
                {/* 1. Immersive Hero Section */}
                <div className="relative h-[450px] md:h-[550px] overflow-hidden group">
                    {/* Dynamic Background */}
                    <div className={cn(
                        "absolute inset-0 bg-gradient-to-br transition-all duration-700",
                        company.color || 'from-primary to-indigo-900'
                    )} />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)]" />
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
                    
                    {/* Floating Particles Overlay (Conceptual) */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white rounded-full blur-[120px]" />
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary rounded-full blur-[150px]" />
                    </div>

                    <div className="container mx-auto px-4 h-full relative z-10 flex flex-col justify-end pb-16">
                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="flex flex-col md:flex-row items-end md:items-center gap-8 md:gap-12"
                        >
                            {/* Premium Logo Wrapper */}
                            <div className="relative group">
                                <motion.div 
                                    whileHover={{ scale: 1.05, rotate: 2 }}
                                    className="h-32 w-32 md:h-48 md:w-48 rounded-[2.5rem] bg-white p-1.5 shadow-[0_40px_100px_rgba(0,0,0,0.5)] border-4 border-white/20 overflow-hidden relative"
                                >
                                    <div className="w-full h-full rounded-[2.2rem] overflow-hidden bg-background flex items-center justify-center">
                                       {company.logo && company.logo !== "undefined" ? (
                                          <img src={company.logo} alt={company.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                       ) : (
                                          <Building2 className="w-20 h-20 text-muted-foreground/20" />
                                       )}
                                    </div>
                                </motion.div>
                                <Badge className="absolute -bottom-3 -right-3 bg-emerald-500 text-white border-4 border-background h-10 w-10 flex items-center justify-center rounded-2xl shadow-xl">
                                    <ShieldCheck className="w-5 h-5" />
                                </Badge>
                            </div>
                            
                            <div className="flex-1 space-y-6">
                                <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-md px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest">وكالة معتمدة</Badge>
                                        <div className="flex items-center gap-1.5 bg-yellow-500/20 text-yellow-400 px-4 py-1.5 rounded-full border border-yellow-500/30">
                                            <Star className="w-4 h-4 fill-current" />
                                            <span className="text-sm font-black">{company.rating} / 5</span>
                                        </div>
                                    </div>
                                    <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter drop-shadow-2xl">
                                        {company.name}
                                    </h1>
                                </div>
                                
                                <div className="flex flex-wrap gap-4 text-white/90">
                                    {company.contactInfo?.address && (
                                        <div className="flex items-center gap-2 bg-black/20 px-5 py-2.5 rounded-2xl backdrop-blur-md border border-white/10 font-bold text-base">
                                            <MapPin className="w-5 h-5 text-primary" />
                                            <span>{company.contactInfo.address}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 bg-black/20 px-5 py-2.5 rounded-2xl backdrop-blur-md border border-white/10 font-bold text-base">
                                        <Users className="w-5 h-5 text-emerald-400" />
                                        <span>{trips.length}+ رحلة نشطة</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 md:flex-col lg:flex-row pb-2">
                                <Button className="bg-white text-foreground hover:bg-primary hover:text-primary-foreground h-14 px-8 rounded-2xl font-black text-lg gap-3 transition-all shadow-2xl">
                                    <Share2 className="w-5 h-5" />
                                    مشاركة الملف
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* 2. Interactive Content Grid */}
                <div className="container mx-auto px-4 mt-16">
                   <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                       
                       {/* Sidebar (4 Columns) */}
                       <aside className="lg:col-span-4 space-y-8">
                            {/* Contact Card */}
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-card rounded-[3rem] p-10 border border-border shadow-2xl relative overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:scale-125 transition-transform">
                                    <Info className="w-48 h-48" />
                                </div>
                                
                                <h3 className="text-2xl font-black text-foreground mb-10 flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    معلومات التواصل
                                </h3>

                                <div className="space-y-6">
                                    {[
                                        { 
                                            icon: Phone, 
                                            label: "رقم الهاتف", 
                                            val: company.contactInfo?.phone, 
                                            href: `tel:${company.contactInfo?.phone}`,
                                            color: "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                        },
                                        { 
                                            icon: MessageSquare, 
                                            label: "واتساب مباشر", 
                                            val: company.contactInfo?.whatsapp, 
                                            href: `https://wa.me/${company.contactInfo?.whatsapp}`,
                                            color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                        },
                                        { 
                                            icon: Mail, 
                                            label: "البريد الرسمي", 
                                            val: company.contactInfo?.email, 
                                            href: `mailto:${company.contactInfo?.email}`,
                                            color: "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                        },
                                        { 
                                            icon: Globe, 
                                            label: "الموقع الإلكتروني", 
                                            val: "زيارة الموقع الرسمي", 
                                            href: company.contactInfo?.website?.startsWith('http') ? company.contactInfo.website : `https://${company.contactInfo?.website}`,
                                            color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
                                        }
                                    ].map((item, i) => item.val && (
                                        <a key={i} href={item.href} target={item.href.startsWith('http') ? "_blank" : undefined} rel="noreferrer" className="flex items-center gap-5 p-4 rounded-2xl hover:bg-muted transition-all group/link border border-transparent hover:border-border shadow-sm hover:shadow-lg">
                                            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover/link:scale-110 border", item.color)}>
                                                <item.icon className="w-6 h-6" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{item.label}</p>
                                                <p className="text-foreground font-black truncate text-lg" dir="ltr">{item.val}</p>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </motion.div>

                            {/* About / Description Card */}
                            <div className="bg-card rounded-[3rem] p-10 border border-border shadow-2xl space-y-6">
                                <h3 className="text-2xl font-black text-foreground flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                        <Info className="w-5 h-5" />
                                    </div>
                                    عن الوكالة
                                </h3>
                                <p className="text-muted-foreground font-bold text-lg leading-relaxed">
                                    {company.description}
                                </p>
                                <div className="flex flex-wrap gap-2 pt-4">
                                    {company.tags?.map((tag, idx) => (
                                        <Badge key={idx} variant="outline" className="bg-muted text-foreground border-border px-4 py-1.5 rounded-xl font-bold">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                       </aside>

                       {/* Main Content (8 Columns) */}
                       <div className="lg:col-span-8 space-y-12">
                           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/50 p-8 rounded-[3rem] border border-border shadow-xl">
                               <div className="space-y-1">
                                   <h2 className="text-4xl font-black text-foreground tracking-tight">رحلات {company.name}</h2>
                                   <p className="text-muted-foreground font-bold text-lg">استكشف {trips.length} عرض متاح حالياً من الوكالة</p>
                               </div>
                               <div className="flex items-center gap-4">
                                   <div className="bg-primary/10 px-6 py-3 rounded-2xl border border-primary/20 text-primary font-black text-lg">
                                       الأكثر رواجاً
                                   </div>
                               </div>
                           </div>

                           {trips.length === 0 ? (
                               <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-32 bg-card rounded-[4rem] border border-dashed border-border shadow-inner"
                               >
                                   <div className="w-24 h-24 bg-muted rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-muted-foreground/20 border border-border">
                                       <Calendar className="w-12 h-12" />
                                   </div>
                                   <h3 className="text-3xl font-black text-foreground mb-4">لا توجد رحلات نشطة</h3>
                                   <p className="text-muted-foreground font-bold text-xl max-w-md mx-auto">لم تقم الشركة بنشر أي رحلات في الوقت الحالي. يرجى مراجعة الملف لاحقاً.</p>
                               </motion.div>
                           ) : (
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                   {trips.map((trip, i) => (
                                       <motion.div 
                                        key={trip.id}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                       >
                                          <TripCardEnhanced trip={trip} showCompanyBadge={false} />
                                       </motion.div>
                                   ))}
                               </div>
                           )}

                           {/* Features / Why Choose Us */}
                           <div className="bg-primary/5 rounded-[4rem] p-12 border border-primary/10 grid grid-cols-1 md:grid-cols-3 gap-8">
                                {[
                                    { icon: Award, title: "جودة مضمونة", desc: "أفضل المعايير السياحية في كل رحلة" },
                                    { icon: ShieldCheck, title: "حجز آمن", desc: "نظام دفع مشفر وحماية كاملة لبياناتك" },
                                    { icon: TrendingUp, title: "أسعار تنافسية", desc: "أقوى العروض الحصرية من الوكالات مباشرة" },
                                ].map((feature, i) => (
                                    <div key={i} className="text-center space-y-4 group">
                                        <div className="w-16 h-16 bg-background rounded-2xl flex items-center justify-center mx-auto shadow-xl border border-border group-hover:scale-110 transition-transform">
                                            <feature.icon className="w-8 h-8 text-primary" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="font-black text-lg text-foreground">{feature.title}</h4>
                                            <p className="text-sm text-muted-foreground font-bold px-4">{feature.desc}</p>
                                        </div>
                                    </div>
                                ))}
                           </div>
                       </div>
                   </div>
                </div>
            </main>
            
            <Footer />
            
            {/* Contextual Support */}
            {company && (
                <ChatWidget 
                    companyId={company._id || company.id}
                    companyName={company.name}
                    companyLogo={company.logo}
                />
            )}
        </div>
    );
};

export default CompanyDetailsPage;
