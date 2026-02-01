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
import { Globe, Mail, MapPin, Phone, MessageSquare, ArrowRight, Share2, Building2, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
                // Fetch company details
                const companyData = await corporateTripsService.getCompanyById(id);
                if (!companyData) {
                    throw new Error("Company not found");
                }
                setCompany(companyData);

                // Fetch company trips
                // Note: corporateTripsService.getTripsByCompany returns trips for this company specifically
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
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Header />
                <div className="flex-1 container mx-auto px-4 py-8">
                    <div className="h-64 bg-gray-200 rounded-3xl animate-pulse mb-8" />
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
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Header />
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <Building2 className="w-20 h-20 text-gray-300 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-700 mb-2">الشركة غير موجودة</h2>
                    <Button asChild variant="outline">
                        <Link to="/corporate-trips">العودة للرحلات</Link>
                    </Button>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-cairo" dir="rtl">
            <Header />
            
            <main className="pb-16">
                {/* Hero Section */}
                <div className={`bg-gradient-to-br ${company.color || 'from-blue-600 to-indigo-700'} text-white relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="container mx-auto px-4 py-16 relative z-10">
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                            <div className="h-32 w-32 md:h-40 md:w-40 rounded-3xl bg-white p-2 shadow-2xl shrink-0">
                                <div className={`w-full h-full rounded-2xl overflow-hidden flex items-center justify-center bg-gray-50`}>
                                   {company.logo && company.logo !== "undefined" ? (
                                      <img src={company.logo} alt={company.name} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                   ) : (
                                      <Building2 className="w-16 h-16 text-gray-300" />
                                   )}
                                </div>
                            </div>
                            
                            <div className="flex-1 space-y-4">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h1 className="text-3xl md:text-5xl font-black mb-2">{company.name}</h1>
                                        <div className="flex flex-wrap gap-2 text-white/80">
                                            {company.contactInfo?.address && (
                                                <div className="flex items-center gap-1.5 text-sm">
                                                    <MapPin className="w-4 h-4" />
                                                    <span>{company.contactInfo.address}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-md gap-2" size="sm">
                                            <Share2 className="w-4 h-4" />
                                            مشاركة
                                        </Button>
                                    </div>
                                </div>
                                
                                <p className="text-lg text-white/90 max-w-3xl leading-relaxed">
                                    {company.description}
                                </p>

                                <div className="flex flex-wrap gap-3 pt-2">
                                    {company.tags?.map((tag, idx) => (
                                        <Badge key={idx} variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-md px-3 py-1">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="container mx-auto px-4 py-12">
                   <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                       
                       {/* Sidebar: Contact Info & Stats */}
                       <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <Info className="w-5 h-5 text-indigo-600" />
                                    معلومات التواصل
                                </h3>
                                <div className="space-y-4">
                                    {company.contactInfo?.phone && (
                                        <a href={`tel:${company.contactInfo.phone}`} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                                            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                                <Phone className="w-5 h-5" />
                                            </div>
                                            <div dir="ltr" className="text-right">
                                                <p className="text-xs text-gray-500 font-bold mb-0.5">رقم الهاتف</p>
                                                <p className="text-gray-900 font-semibold">{company.contactInfo.phone}</p>
                                            </div>
                                        </a>
                                    )}
                                    {company.contactInfo?.whatsapp && (
                                        <a href={`https://wa.me/${company.contactInfo.whatsapp}`} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                                            <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                                                <MessageSquare className="w-5 h-5" />
                                            </div>
                                            <div dir="ltr" className="text-right">
                                                <p className="text-xs text-gray-500 font-bold mb-0.5">واتساب</p>
                                                <p className="text-gray-900 font-semibold">{company.contactInfo.whatsapp}</p>
                                            </div>
                                        </a>
                                    )}
                                    {company.contactInfo?.email && (
                                        <a href={`mailto:${company.contactInfo.email}`} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                                            <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                                                <Mail className="w-5 h-5" />
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-xs text-gray-500 font-bold mb-0.5">البريد الإلكتروني</p>
                                                <p className="text-gray-900 font-semibold truncate text-sm" dir="ltr">{company.contactInfo.email}</p>
                                            </div>
                                        </a>
                                    )}
                                    {company.contactInfo?.website && (
                                        <a href={company.contactInfo.website.startsWith('http') ? company.contactInfo.website : `https://${company.contactInfo.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                                            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                                                <Globe className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 font-bold mb-0.5">الموقع الإلكتروني</p>
                                                <p className="text-gray-900 font-semibold text-sm">زيارة الموقع</p>
                                            </div>
                                        </a>
                                    )}
                                </div>
                            </div>
                       </div>

                       {/* Main Content: Trips List */}
                       <div className="lg:col-span-3">
                           <div className="flex items-center justify-between mb-8">
                               <div>
                                   <h2 className="text-2xl font-black text-gray-900">رحلات الشركة</h2>
                                   <p className="text-gray-500 mt-1">تصفح أحدث العروض والرحلات المتاحة</p>
                               </div>
                               <Badge variant="outline" className="h-8 px-3 rounded-lg border-gray-200 text-gray-600">
                                   {trips.length} رحلة
                               </Badge>
                           </div>

                           {trips.length === 0 ? (
                               <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-200">
                                   <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                       <MapPin className="w-8 h-8 opacity-50" />
                                   </div>
                                   <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد رحلات حالياً</h3>
                                   <p className="text-gray-500">لم تقم الشركة بنشر أي رحلات حتى الآن.</p>
                               </div>
                           ) : (
                               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                   {trips.map((trip) => (
                                       <TripCardEnhanced key={trip.id} trip={trip} showCompanyBadge={false} />
                                   ))}
                               </div>
                           )}
                       </div>
                   </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default CompanyDetailsPage;
