import React from 'react';
import { RefreshCcw, Loader2, Map } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TripCardEnhanced from "@/components/TripCardEnhanced";

interface TripsTabProps {
    trips: any[];
    loading: boolean;
    onRefresh: () => void;
    onEditTrip: (trip: any) => void;
    onCreateTrip: () => void;
    onExportTrip: (trip: any) => void;
}

const TripsTab: React.FC<TripsTabProps> = ({ 
    trips, 
    loading, 
    onRefresh, 
    onEditTrip, 
    onCreateTrip, 
    onExportTrip 
}) => {
    return (
        <div className="p-8 m-0 focus-visible:outline-none">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-black text-gray-900">إدارة الرحلات</h2>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={onRefresh} 
                        className="rounded-full hover:bg-gray-100 text-gray-400 hover:text-indigo-600"
                    >
                        <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
                <Badge variant="outline" className="rounded-full px-4 py-1 text-indigo-600 border-indigo-100 bg-indigo-50">
                    {trips.length} رحلة
                </Badge>
            </div>
            
            {loading ? (
                <div className="text-center py-20">
                    <Loader2 className="w-12 h-12 mx-auto animate-spin text-indigo-600" />
                </div>
            ) : trips.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {trips.map(trip => (
                        <TripCardEnhanced 
                            key={trip.id || trip._id} 
                            trip={trip} 
                            onEdit={onEditTrip} 
                            onExport={onExportTrip}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 text-gray-400">
                    <Map className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-bold text-gray-700">لا توجد رحلات حالياً</h3>
                    <p className="mb-6">ابدأ بنشر رحلتك الأولى واستقبل الحجوزات</p>
                    <Button className="bg-indigo-600 text-white rounded-xl" onClick={onCreateTrip}>إضافة رحلة</Button>
                </div>
            )}
        </div>
    );
};

export default TripsTab;
