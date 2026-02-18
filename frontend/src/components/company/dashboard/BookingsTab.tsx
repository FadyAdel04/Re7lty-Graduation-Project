import React from 'react';
import { Bell, Activity, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import BookingManagementTable from "../BookingManagementTable";

interface BookingsTabProps {
    bookings: any[];
    loading: boolean;
    onRefresh: () => void;
    onUpdate: () => void;
}

const BookingsTab: React.FC<BookingsTabProps> = ({ 
    bookings, 
    loading, 
    onRefresh, 
    onUpdate 
}) => {
    const pendingBookings = bookings.filter(b => b.status === 'pending');

    return (
        <div className="p-8 m-0 focus-visible:outline-none">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-black text-gray-900">طلبات الحجز</h2>
                    {pendingBookings.length > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-red-100 rounded-full border border-red-200">
                            <Bell className="w-4 h-4 text-red-600" />
                            <span className="text-xs font-bold text-red-700">
                                {pendingBookings.length} طلب جديد
                            </span>
                        </div>
                    )}
                </div>
                <Button 
                    onClick={onRefresh} 
                    variant="ghost" 
                    size="sm" 
                    className="text-indigo-600 hover:bg-indigo-50 gap-2 font-bold"
                >
                    <Activity className="w-4 h-4" /> تحديث البيانات
                </Button>
            </div>
            
            {loading ? (
                <div className="text-center py-20">
                    <Loader2 className="w-12 h-12 mx-auto animate-spin text-indigo-600" />
                </div>
            ) : (
                <>
                    {pendingBookings.length > 0 && (
                        <div className="mb-6 p-6 bg-gradient-to-l from-indigo-50 to-white border border-indigo-100 rounded-3xl flex items-center justify-between shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-1 h-full bg-indigo-500" />
                            <div className="relative z-10">
                                <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-indigo-600" />
                                    ملخص الطلبات الجديدة
                                </h3>
                                <p className="text-sm text-gray-500">لديك <span className="font-bold text-indigo-600">{pendingBookings.length}</span> طلبات حجز قيد الانتظار</p>
                            </div>
                            <div className="relative z-10 text-left">
                                <p className="text-xs text-gray-400 font-bold mb-1">إجمالي القيمة المتوقعة</p>
                                <p className="text-2xl font-black text-gray-900">
                                    {pendingBookings
                                        .reduce((acc, curr) => acc + (curr.totalPrice || 0), 0)
                                        .toLocaleString()} 
                                    <span className="text-sm font-bold text-gray-500 mr-1">ج.م</span>
                                </p>
                            </div>
                        </div>
                    )}
                    <BookingManagementTable bookings={bookings} onUpdate={onUpdate} />
                </>
            )}
        </div>
    );
};

export default BookingsTab;
