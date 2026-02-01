import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, User, Building2, ArrowRight } from "lucide-react";
import axios from "axios";
import { API_BASE_URL, getAuthHeaders } from "@/config/api";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const UserRoleSelection = () => {
    const { getToken } = useAuth();
    const { user } = useUser();
    const navigate = useNavigate();
    const [loading, setLoading] = useState<'user' | 'company' | null>(null);

    const handleSelectUser = async () => {
        setLoading('user');
        try {
            const token = await getToken();
            await axios.post(`${API_BASE_URL}/api/users/onboarding`, 
                { role: 'user' }, 
                { headers: getAuthHeaders(token) }
            );
            // Force reload to update auth state
            window.location.href = '/';
        } catch (error) {
            console.error(error);
            alert("حدث خطأ، يرجى المحاولة مرة أخرى");
            setLoading(null);
        }
    };

    const handleSelectCompany = () => {
        navigate('/onboarding/company-apply');
    };

    return (
        <>
        <Header/>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full">
                <div className="text-center mb-12">
                     <h1 className="text-4xl font-black text-gray-900 mb-4 font-cairo">كيف تود استخدام رحلتي؟</h1>
                     <p className="text-gray-500 text-lg">اختر نوع الحساب الذي يناسب احتياجاتك للبدء في استكشاف العالم</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* User Card */}
                    <Card 
                        className={`group relative overflow-hidden border-2 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 rounded-[2rem] ${loading === 'user' ? 'opacity-80' : 'hover:border-indigo-500 border-transparent'}`}
                        onClick={() => !loading && handleSelectUser()}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardContent className="p-10 relative z-10 flex flex-col items-center text-center h-full">
                            <div className="w-24 h-24 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-8 border-4 border-white shadow-xl group-hover:scale-110 transition-transform duration-500">
                                <User className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-3">مسافر</h3>
                            <p className="text-gray-500 mb-8 leading-relaxed">
                                استكشف رحلات مميزة، شارك تجاربك مع الآخرين، وتابع أصدقاءك في مغامراتهم.
                            </p>
                            
                            <div className="mt-auto space-y-3 w-full">
                                <div className="flex items-center gap-2 text-sm text-gray-600 font-bold bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    تصفح الرحلات والقصص
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600 font-bold bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    حجز الرحلات السياحية
                                </div>
                            </div>
                            
                            <Button className="w-full mt-8 rounded-xl h-12 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200" disabled={loading === 'user'}>
                                {loading === 'user' ? 'جاري الإعداد...' : 'استمرار كمسافر'}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Company Card */}
                    <Card 
                        className="group relative overflow-hidden border-2 border-transparent hover:border-orange-500 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 rounded-[2rem]"
                        onClick={handleSelectCompany}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardContent className="p-10 relative z-10 flex flex-col items-center text-center h-full">
                            <div className="w-24 h-24 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-8 border-4 border-white shadow-xl group-hover:scale-110 transition-transform duration-500">
                                <Building2 className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-3">شركة سياحة</h3>
                            <p className="text-gray-500 mb-8 leading-relaxed">
                                اعرض رحلاتك لآلاف المسافرين، أدر حجوزاتك، وضاعف مبيعاتك معنا.
                            </p>
                            
                            <div className="mt-auto space-y-3 w-full">
                                <div className="flex items-center gap-2 text-sm text-gray-600 font-bold bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    لوحة تحكم خاصة
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600 font-bold bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    أدوات تسويق متقدمة
                                </div>
                            </div>

                            <Button variant="outline" className="w-full mt-8 rounded-xl h-12 text-lg font-bold border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700">
                                تسجيل كشركة
                                <ArrowRight className="w-4 h-4 mr-2" />
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
        <Footer/>
        </>
    );
};

export default UserRoleSelection;
