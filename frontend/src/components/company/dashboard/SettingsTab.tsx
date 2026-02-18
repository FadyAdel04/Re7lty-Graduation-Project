import React from 'react';
import { Save, Building2, Phone, Mail, Globe, Clock, MapPin } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SettingsTabProps {
    data: any;
    setData: (data: any) => void;
    onSave: (e: React.FormEvent) => void;
    saving: boolean;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ 
    data, 
    setData, 
    onSave, 
    saving 
}) => {
    return (
        <div className="p-8 m-0 focus-visible:outline-none">
            <h2 className="text-2xl font-black text-gray-900 mb-8">إعدادات الشركة</h2>
            <form onSubmit={onSave}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Right Column: Basic Info */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">المعلومات الأساسية</h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">اسم الشركة *</Label>
                                    <div className="relative">
                                        <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input 
                                            id="name" 
                                            value={data.name} 
                                            onChange={(e) => setData({...data, name: e.target.value})}
                                            required 
                                            className="h-12 pr-10 rounded-xl"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">وصف الشركة *</Label>
                                    <Textarea 
                                        id="description" 
                                        value={data.description} 
                                        onChange={(e) => setData({...data, description: e.target.value})}
                                        required 
                                        className="min-h-[120px] rounded-xl"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="tags">تصنيفات الرحلات (مفصولة بفاصلة)</Label>
                                    <Input 
                                        id="tags" 
                                        value={data.tags?.join(', ')} 
                                        onChange={(e) => setData({...data, tags: e.target.value.split(',').map((t: string) => t.trim())})}
                                        className="h-12 rounded-xl"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2 mt-8">بيانات التواصل</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">رقم الهاتف</Label>
                                    <div className="relative">
                                        <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input 
                                            id="phone" 
                                            value={data.phone} 
                                            onChange={(e) => setData({...data, phone: e.target.value})}
                                            className="h-12 pr-10 rounded-xl text-left"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">البريد الإلكتروني</Label>
                                    <div className="relative">
                                        <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input 
                                            id="email" 
                                            type="email"
                                            value={data.email} 
                                            onChange={(e) => setData({...data, email: e.target.value})}
                                            className="h-12 pr-10 rounded-xl text-left"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="website">الموقع الإلكتروني</Label>
                                    <div className="relative">
                                        <Globe className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input 
                                            id="website" 
                                            value={data.website} 
                                            onChange={(e) => setData({...data, website: e.target.value})}
                                            className="h-12 pr-10 rounded-xl text-left"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address">العنوان</Label>
                                    <div className="relative">
                                        <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input 
                                            id="address" 
                                            value={data.address} 
                                            onChange={(e) => setData({...data, address: e.target.value})}
                                            className="h-12 pr-10 rounded-xl"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Left Column: Visuals & Links */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">روابط التواصل الاجتماعي</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="facebook">رابط فيسبوك</Label>
                                    <Input 
                                        id="facebook" 
                                        value={data.socialLinks?.facebook} 
                                        onChange={(e) => setData({...data, socialLinks: {...data.socialLinks, facebook: e.target.value}})}
                                        className="h-12 rounded-xl text-left"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="instagram">رابط انستجرام</Label>
                                    <Input 
                                        id="instagram" 
                                        value={data.socialLinks?.instagram} 
                                        onChange={(e) => setData({...data, socialLinks: {...data.socialLinks, instagram: e.target.value}})}
                                        className="h-12 rounded-xl text-left"
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div className="pt-8">
                            <Button 
                                type="submit" 
                                disabled={saving}
                                className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 transition-all hover:scale-[1.02]"
                            >
                                <Save className="w-6 h-6" />
                                {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default SettingsTab;
