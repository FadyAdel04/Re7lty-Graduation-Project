import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { couponService, Coupon } from "@/services/couponService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { 
    Tag, 
    Plus, 
    Trash2, 
    Calendar, 
    Loader2,
    Ticket
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const CouponManagement = () => {
    const { getToken } = useAuth();
    const { toast } = useToast();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        code: "",
        discountType: "percentage" as "percentage" | "fixed",
        discountValue: 0,
        expiryDate: "",
        usageLimit: ""
    });

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const data = await couponService.getMyCoupons(token || undefined);
            setCoupons(data);
        } catch (error) {
            console.error(error);
            toast({ title: "خطأ", description: "فشل تحميل الكوبونات", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            const token = await getToken();
            await couponService.createCoupon({
                ...formData,
                usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined
            }, token || undefined);
            
            toast({ title: "تم بنجاح", description: "تم إنشاء الكوبون بنجاح" });
            setFormData({ code: "", discountType: "percentage", discountValue: 0, expiryDate: "", usageLimit: "" });
            fetchCoupons();
        } catch (error: any) {
            toast({ 
                title: "خطأ", 
                description: error.response?.data?.error || "فشل إنشاء الكوبون", 
                variant: "destructive" 
            });
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const token = await getToken();
            await couponService.deleteCoupon(id, token || undefined);
            toast({ title: "تم بنجاح", description: "تم حذف الكوبون" });
            fetchCoupons();
        } catch (error) {
            toast({ title: "خطأ", description: "فشل حذف الكوبون", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-8">
            <Card className="rounded-[2rem] border-0 shadow-sm overflow-hidden">
                <CardHeader className="bg-indigo-600 text-white p-6">
                    <CardTitle className="flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        إنشاء كوبون جديد
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label className="font-bold">كود الخصم (مثل: RAMADAN20)</Label>
                            <Input 
                                value={formData.code}
                                onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                                placeholder="ادخل الكود..."
                                className="rounded-xl h-11"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold">نوع الخصم</Label>
                            <select 
                                value={formData.discountType}
                                onChange={e => setFormData({...formData, discountType: e.target.value as any})}
                                className="w-full rounded-xl h-11 border border-gray-200 px-3 bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                            >
                                <option value="percentage">نسبة مئوية (%)</option>
                                <option value="fixed">مبلغ ثابت (ج.م)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold">قيمة الخصم</Label>
                            <Input 
                                type="number"
                                value={formData.discountValue}
                                onChange={e => setFormData({...formData, discountValue: parseFloat(e.target.value)})}
                                className="rounded-xl h-11"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold">تاريخ الانتهاء</Label>
                            <Input 
                                type="date"
                                value={formData.expiryDate}
                                onChange={e => setFormData({...formData, expiryDate: e.target.value})}
                                className="rounded-xl h-11"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold">حد الاستخدام (اختياري)</Label>
                            <Input 
                                type="number"
                                value={formData.usageLimit}
                                onChange={e => setFormData({...formData, usageLimit: e.target.value})}
                                placeholder="مثلاً: 100 مرة"
                                className="rounded-xl h-11"
                            />
                        </div>
                        <div className="flex items-end">
                            <Button 
                                type="submit" 
                                disabled={isCreating}
                                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold gap-2"
                            >
                                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
                                إنشاء الكوبون
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 text-center">
                        <Loader2 className="w-12 h-12 mx-auto animate-spin text-indigo-600" />
                    </div>
                ) : coupons.length > 0 ? (
                    coupons.map(coupon => (
                        <Card key={coupon._id} className="rounded-[2rem] border-0 shadow-sm hover:shadow-md transition-all group">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                        <Ticket className="w-6 h-6" />
                                    </div>
                                    <Button 
                                        onClick={() => handleDelete(coupon._id)}
                                        variant="ghost" 
                                        size="icon" 
                                        className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                                
                                <h3 className="text-xl font-black text-gray-900 mb-2">{coupon.code}</h3>
                                
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500 font-bold">الخصم:</span>
                                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-0 rounded-lg">
                                            {coupon.discountValue}{coupon.discountType === 'percentage' ? '%' : ' ج.م'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500 font-bold">تاريخ الانتهاء:</span>
                                        <span className="text-gray-900 font-black flex items-center gap-1">
                                            <Calendar className="w-3 h-3 text-indigo-400" />
                                            {format(new Date(coupon.expiryDate), 'dd MMM yyyy', { locale: ar })}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500 font-bold">الاستخدام:</span>
                                        <span className="text-gray-900 font-black">
                                            {coupon.usageCount} {coupon.usageLimit ? `/ ${coupon.usageLimit}` : 'مرة'}
                                        </span>
                                    </div>
                                    {coupon.usageLimit && (
                                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-1">
                                            <div 
                                                className="bg-indigo-500 h-full transition-all" 
                                                style={{ width: `${Math.min((coupon.usageCount / coupon.usageLimit) * 100, 100)}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
                        <Tag className="w-16 h-16 mx-auto mb-4 opacity-10" />
                        <h3 className="text-xl font-bold text-gray-400">لا توجد كوبونات خصم حالياً</h3>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CouponManagement;
