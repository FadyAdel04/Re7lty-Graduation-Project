import React, { useState, useMemo } from 'react';
import { RefreshCcw, Calendar, Bus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import BusSeatLayout from "../BusSeatLayout";

interface SeatsTabProps {
    trips: any[];
    loading: boolean;
    selectedTrip: any;
    onSelectTrip: (trip: any) => void;
    onRefresh: () => void;
    onSaveSeats: (newBookings: any[]) => void;
}

const SeatsTab: React.FC<SeatsTabProps> = ({ 
    trips, 
    loading, 
    selectedTrip, 
    onSelectTrip, 
    onRefresh, 
    onSaveSeats 
}) => {
    const [currentBusIndex, setCurrentBusIndex] = useState(0);

    const transportationUnits = useMemo(() => {
        const list: any[] = [];
        if (!selectedTrip) return list;

        if (selectedTrip.transportations && selectedTrip.transportations.length > 0) {
            selectedTrip.transportations.forEach((t: any) => {
                for (let j = 0; j < (t.count || 1); j++) {
                    list.push({ ...t, unitIndex: list.length });
                }
            });
        } else {
            const capacity = selectedTrip.transportationType === 'minibus-28' ? 28 : selectedTrip.transportationType === 'van-14' ? 14 : 48;
            list.push({ type: selectedTrip.transportationType || 'bus-48', capacity, count: 1, unitIndex: 0 });
        }
        return list;
    }, [selectedTrip]);

    const currentUnit = transportationUnits[currentBusIndex] || transportationUnits[0];

    const currentBookedSeats = useMemo(() => {
        if (!selectedTrip) return [];
        return (selectedTrip.seatBookings || [])
            .filter((sb: any) => (sb.busIndex || 0) === currentBusIndex)
            .map((sb: any) => ({ seatNumber: sb.seatNumber, passengerName: sb.passengerName }));
    }, [selectedTrip, currentBusIndex]);

    const handleSaveSeatsInternal = (newBusBookings: any[]) => {
        if (!selectedTrip) return;
        const otherBusesBookings = (selectedTrip.seatBookings || []).filter((sb: any) => (sb.busIndex || 0) !== currentBusIndex);
        const busBookingsWithIndex = newBusBookings.map(b => ({ ...b, busIndex: currentBusIndex }));
        onSaveSeats([...otherBusesBookings, ...busBookingsWithIndex]);
    };
    return (
        <div className="p-8 m-0 focus-visible:outline-none">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-black text-gray-900">توزيع مقاعد الركاب</h2>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={onRefresh} 
                        className="rounded-full hover:bg-gray-100 text-gray-400 hover:text-indigo-600"
                    >
                        <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
                <p className="text-sm font-bold text-zinc-400">اختر رحلة لتنظيم مقاعدها</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-4">
                    {trips.map(trip => {
                        const totalCap = trip.transportations?.length > 0 
                            ? trip.transportations.reduce((sum: number, t: any) => sum + (t.capacity * (t.count || 1)), 0)
                            : (trip.transportationType === 'van-14' ? 14 : trip.transportationType === 'minibus-28' ? 28 : 48);
                        
                        const isSelected = selectedTrip?.id === trip.id || selectedTrip?._id === trip._id;

                        return (
                            <button 
                                key={trip.id || trip._id}
                                onClick={() => onSelectTrip(trip)}
                                className={`w-full p-4 rounded-2xl text-right transition-all border-2 ${isSelected ? 'border-indigo-600 bg-indigo-50 shadow-lg' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                            >
                                <p className="font-black text-gray-900 mb-1">{trip.title}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(trip.startDate).toLocaleDateString()}
                                    <span className="mx-1">•</span>
                                    <Bus className="w-3 h-3" />
                                    {totalCap} مقعد
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div className="lg:col-span-2">
                    {selectedTrip ? (
                        <Card className="p-8 border-gray-100 rounded-3xl shadow-xl shadow-zinc-200/50 bg-white flex flex-col items-center">
                            <div className="w-full flex items-center justify-between mb-8">
                                <div>
                                <h3 className="text-xl font-black text-gray-900">{selectedTrip.title}</h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">اضغط على المقعد لتسجيل اسم المسافر</p>
                                </div>
                            </div>
                            
                            <div className="w-full mb-6">
                                {transportationUnits.length > 1 && (
                                   <div className="flex gap-2 p-2 bg-gray-50 rounded-2xl border border-gray-100 overflow-x-auto no-scrollbar justify-center">
                                      {transportationUnits.map((unit, idx) => (
                                         <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setCurrentBusIndex(idx)}
                                            className={`
                                               px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all border
                                               ${currentBusIndex === idx 
                                                  ? "bg-indigo-600 text-white border-indigo-700 shadow-lg scale-105" 
                                                  : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"
                                               }
                                            `}
                                         >
                                            {unit.type === 'bus-48' || unit.type === 'bus-50' ? 'حافلة' : unit.type === 'minibus-28' ? 'ميني باص' : 'ميكروباص'} {idx + 1}
                                         </button>
                                      ))}
                                   </div>
                                )}
                            </div>
                            
                            <BusSeatLayout 
                                type={currentUnit.type}
                                bookedSeats={currentBookedSeats}
                                totalBookedPassengers={selectedTrip.bookedCount || 0}
                                isAdmin={true}
                                tripBookings={selectedTrip.rawBookings || []}
                                onSaveSeats={handleSaveSeatsInternal}
                            />
                        </Card>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
                            <Bus className="w-16 h-16 opacity-20 mb-4" />
                            <p className="font-bold">برجاء اختيار رحلة من القائمة الجانبية</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SeatsTab;
