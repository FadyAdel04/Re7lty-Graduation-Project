import React from 'react';
import { RefreshCcw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip as ReTooltip,
    BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

interface ReportsTabProps {
    trips: any[];
    bookings: any[];
    stats: any;
    onRefresh: () => void;
}

const ReportsTab: React.FC<ReportsTabProps> = ({ 
    trips, 
    bookings, 
    stats, 
    onRefresh 
}) => {
    // Booking status distribution data
    const bookingStatusData = [
        { name: 'مقبول', value: bookings.filter(b => b.status === 'accepted').length },
        { name: 'قيد الانتظار', value: bookings.filter(b => b.status === 'pending').length },
        { name: 'مرفوض', value: bookings.filter(b => b.status === 'rejected').length },
        { name: 'ملغي', value: bookings.filter(b => b.status === 'cancelled').length },
    ].filter(d => d.value > 0);

    const STATUS_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6b7280'];

    // Payment summary data
    const paymentSummaryData = [
        { name: 'مدفوع', value: stats?.revenue?.paid || 0 },
        { name: 'مطلوب تحصيله', value: stats?.revenue?.pending || 0 },
        { name: 'مسترجع', value: stats?.revenue?.refunded || 0 },
    ].filter(d => d.value > 0);

    const PAYMENT_COLORS = ['#10b981', '#f59e0b', '#ef4444'];

    // Performance data for chart
    const performanceData = trips.map(trip => ({
        name: trip.title.length > 15 ? trip.title.substring(0, 15) + '...' : trip.title,
        views: trip.views || 0,
        bookings: bookings.filter(b => String(b.tripId) === String(trip._id || trip.id)).length
    }));

    return (
        <div className="p-8 m-0 focus-visible:outline-none">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-gray-900">التقارير والإحصائيات</h2>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={onRefresh} 
                    className="rounded-full hover:bg-gray-100 text-gray-400 hover:text-indigo-600"
                >
                    <RefreshCcw className="w-5 h-5" />
                </Button>
            </div>
            
            <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Bookings Status Distribution */}
                    <Card className="p-6 rounded-3xl border-gray-100 shadow-sm">
                        <CardHeader className="px-0 pt-0">
                            <CardTitle className="text-lg font-bold">توزيع حالات الحجوزات</CardTitle>
                        </CardHeader>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={bookingStatusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {bookingStatusData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <ReTooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* Payment Summary Pie Chart */}
                    <Card className="p-6 rounded-3xl border-gray-100 shadow-sm">
                        <CardHeader className="px-0 pt-0">
                            <CardTitle className="text-lg font-bold">حالة التحصيل المالي</CardTitle>
                        </CardHeader>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={paymentSummaryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {paymentSummaryData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <ReTooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6 rounded-3xl bg-emerald-50 border-0">
                        <div className="text-emerald-600 text-sm font-bold">المحصل فعلياً</div>
                        <div className="text-2xl font-black text-emerald-700">{(stats?.revenue?.paid || 0).toLocaleString()} ج.م</div>
                    </Card>
                    <Card className="p-6 rounded-3xl bg-orange-50 border-0">
                        <div className="text-orange-600 text-sm font-bold">قيد التحصيل</div>
                        <div className="text-2xl font-black text-orange-700">{(stats?.revenue?.pending || 0).toLocaleString()} ج.م</div>
                    </Card>
                    <Card className="p-6 rounded-3xl bg-blue-50 border-0">
                        <div className="text-blue-600 text-sm font-bold">الإجمالي المتوقع</div>
                        <div className="text-2xl font-black text-blue-700">{(stats?.revenue?.total || 0).toLocaleString()} ج.م</div>
                    </Card>
                </div>

                {/* Trip Views vs Bookings */}
                <Card className="p-6 rounded-3xl border-gray-100 shadow-sm">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-lg font-bold">المشاهدات مقابل الحجوزات (لكل رحلة)</CardTitle>
                    </CardHeader>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ReBarChart
                                data={performanceData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <ReTooltip />
                                <Legend />
                                <Bar dataKey="views" name="المشاهدات" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="bookings" name="الحجوزات" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            </ReBarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Detailed Performance Table */}
                <Card className="p-6 rounded-3xl border-gray-100 shadow-sm overflow-hidden">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-lg font-bold">أداء الرحلات التفصيلي</CardTitle>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="pb-4 font-bold text-gray-500">الرحلة</th>
                                    <th className="pb-4 font-bold text-gray-500">المشاهدات</th>
                                    <th className="pb-4 font-bold text-gray-500">الحجوزات</th>
                                    <th className="pb-4 font-bold text-gray-500">معدل التحويل</th>
                                    <th className="pb-4 font-bold text-gray-500">الإيرادات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {trips.map(trip => {
                                    const tripBookings = bookings.filter(b => String(b.tripId) === String(trip._id || trip.id));
                                    const acceptedBookings = tripBookings.filter(b => b.status === 'accepted');
                                    const conversionRate = trip.views ? ((tripBookings.length / trip.views) * 100).toFixed(1) : 0;
                                    const revenue = acceptedBookings.reduce((acc, b) => acc + (b.totalPrice || 0), 0);
                                    
                                    return (
                                        <tr key={trip.id || trip._id}>
                                            <td className="py-4 font-semibold">{trip.title}</td>
                                            <td className="py-4">{trip.views || 0}</td>
                                            <td className="py-4">{tripBookings.length}</td>
                                            <td className="py-4">
                                                <Badge variant="outline" className="text-indigo-600 bg-indigo-50 border-indigo-100">
                                                    {conversionRate}%
                                                </Badge>
                                            </td>
                                            <td className="py-4 font-bold text-emerald-600">{revenue.toLocaleString()} ج.م</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default ReportsTab;
