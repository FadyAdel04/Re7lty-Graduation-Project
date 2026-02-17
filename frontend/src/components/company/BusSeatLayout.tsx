import { useState, useMemo, useEffect } from "react";
import { User, Lock, DoorClosed, Disc, Monitor as WindowIcon, Circle, CheckCircle2, Users, Coffee, GripVertical, Armchair, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Seat {
  id: string;
  type: 'seat' | 'aisle' | 'door' | 'driver' | 'wc' | 'guide';
  label?: string;
  isBooked?: boolean;
  passengerName?: string;
}

interface BusSeatLayoutProps {
  type: 'bus-48' | 'minibus-28' | 'van-14' | 'bus-50';
  bookedSeats: { seatNumber: string; passengerName: string }[];
  onSaveSeats?: (newBookings: { seatNumber: string; passengerName: string }[]) => void;
  onSelectSeats?: (selected: string[]) => void;
  isAdmin?: boolean;
  totalBookedPassengers?: number;
  tripBookings?: any[];
  maxSelection?: number;
  initialSelectedSeats?: string[];
}

const BusSeatLayout = ({ 
    type, 
    bookedSeats, 
    onSaveSeats, 
    onSelectSeats,
    isAdmin = false, 
    totalBookedPassengers = 0, 
    tripBookings = [],
    maxSelection,
    initialSelectedSeats = []
}: BusSeatLayoutProps) => {
  const [selectedSeats, setSelectedSeats] = useState<string[]>(initialSelectedSeats);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [showConfirmDrop, setShowConfirmDrop] = useState(false);
  const [draggedPassenger, setDraggedPassenger] = useState<string | null>(null);
  const [targetSeat, setTargetSeat] = useState<string | null>(null);
  const [passengerName, setPassengerName] = useState("");
  const [localBookings, setLocalBookings] = useState(bookedSeats);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setLocalBookings(bookedSeats);
  }, [bookedSeats]);

  // Sync selectedSeats if initialSelectedSeats changes
  useEffect(() => {
    if (initialSelectedSeats.length > 0 && selectedSeats.length === 0) {
      setSelectedSeats(initialSelectedSeats);
    }
  }, [initialSelectedSeats]);

  // Sync selection if maxSelection changes (e.g. user changes number of people)
  useEffect(() => {
    if (!isAdmin && maxSelection !== undefined && selectedSeats.length > maxSelection) {
      const truncated = selectedSeats.slice(0, maxSelection);
      setSelectedSeats(truncated);
      onSelectSeats?.(truncated);
    }
  }, [maxSelection, isAdmin, selectedSeats.length, onSelectSeats]);

  // Inform parent of selection changes (Live update)
  useEffect(() => {
    if (!isAdmin && onSelectSeats) {
        onSelectSeats(selectedSeats); 
    }
  }, [selectedSeats, onSelectSeats, isAdmin]);

  const handleSeatClick = (seatId: string) => {
    const isBooked = localBookings.some(b => b.seatNumber === seatId);
    
    if (isAdmin) {
        const existing = localBookings.find(b => b.seatNumber === seatId);
        if (existing && selectedSeats.length === 0) {
            setSelectedSeats([seatId]);
            setPassengerName(existing.passengerName);
            setShowBookingDialog(true);
            return;
        }

        setSelectedSeats(prev => 
            prev.includes(seatId) 
                ? prev.filter(id => id !== seatId) 
                : [...prev, seatId]
        );
    } else if (onSelectSeats) {
        // User Selection Mode (e.g. Booking Form)
        if (isBooked) return;

        setSelectedSeats(prev => {
            const isSelected = prev.includes(seatId);
            // Allow deselecting even if at max
            if (!isSelected && maxSelection !== undefined && prev.length >= maxSelection) {
                // If trying to select more than allowed, don't do anything
                return prev;
            }
            
            const next = isSelected 
                ? prev.filter(id => id !== seatId) 
                : [...prev, seatId];
            
            return next;
        });
    }
    // If not admin and no onSelectSeats provided, seat is read-only (Trip Details Page)
  };

  const handleBookSelected = () => {
    if (selectedSeats.length === 0) return;
    setPassengerName("");
    setShowBookingDialog(true);
  };

  const saveBooking = () => {
    if (selectedSeats.length === 0) return;
    
    let newList = [...localBookings];
    if (passengerName.trim() === "") {
        newList = newList.filter(b => !selectedSeats.includes(b.seatNumber));
    } else {
        selectedSeats.forEach(seatId => {
            const idx = newList.findIndex(b => b.seatNumber === seatId);
            if (idx > -1) {
                newList[idx] = { seatNumber: seatId, passengerName };
            } else {
                newList.push({ seatNumber: seatId, passengerName });
            }
        });
    }
    
    setLocalBookings(newList);
    onSaveSeats?.(newList);
    setSelectedSeats([]);
    setShowBookingDialog(false);
  };

  const handleDragStart = (e: React.DragEvent, name: string) => {
    e.dataTransfer.setData("passengerName", name);
    setDraggedPassenger(name);
  };

  const handleDrop = (e: React.DragEvent, seatId: string) => {
    e.preventDefault();
    const name = e.dataTransfer.getData("passengerName") || draggedPassenger;
    if (!name) return;

    setTargetSeat(seatId);
    setDraggedPassenger(name);
    setShowConfirmDrop(true);
  };

  const confirmAssignment = () => {
    if (!targetSeat || !draggedPassenger) return;

    let newList = [...localBookings];
    const idx = newList.findIndex(b => b.seatNumber === targetSeat);
    if (idx > -1) {
        newList[idx] = { seatNumber: targetSeat, passengerName: draggedPassenger };
    } else {
        newList.push({ seatNumber: targetSeat, passengerName: draggedPassenger });
    }

    setLocalBookings(newList);
    onSaveSeats?.(newList);
    setShowConfirmDrop(false);
    setTargetSeat(null);
    setDraggedPassenger(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const layout = useMemo(() => {
    const columns: Seat[][] = [];
    
    const getSeatStatus = (id: string) => {
        const booking = localBookings.find(b => b.seatNumber === id);
        return { isBooked: !!booking, passengerName: booking?.passengerName };
    };

    if (type === 'bus-48' || (type as string) === 'bus-50') {
      columns.push([
        { id: 'driver', type: 'driver', label: 'السائق' },
        { id: 'aisle-0', type: 'aisle' },
        { id: 'guide', type: 'guide', label: 'المرافق' }
      ]);

      let seatCounter = 1;
      for (let c = 1; c <= 13; c++) {
        const col: Seat[] = [];
        col.push({ id: seatCounter.toString(), type: 'seat', label: seatCounter.toString(), ...getSeatStatus(seatCounter.toString()) });
        seatCounter++;
        col.push({ id: seatCounter.toString(), type: 'seat', label: seatCounter.toString(), ...getSeatStatus(seatCounter.toString()) });
        seatCounter++;

        if (c === 13) {
            col.push({ id: seatCounter.toString(), type: 'seat', label: seatCounter.toString(), ...getSeatStatus(seatCounter.toString()) });
            seatCounter++;
        } else {
            col.push({ id: `aisle-${c}`, type: 'aisle' });
        }

        if (c === 6) {
          col.push({ id: 'wc', type: 'wc', label: 'WC' });
        } else if (c === 7) {
          col.push({ id: 'door-mid', type: 'door', label: 'المدخل' });
        } else {
          col.push({ id: seatCounter.toString(), type: 'seat', label: seatCounter.toString(), ...getSeatStatus(seatCounter.toString()) });
          seatCounter++;
          col.push({ id: seatCounter.toString(), type: 'seat', label: seatCounter.toString(), ...getSeatStatus(seatCounter.toString()) });
          seatCounter++;
        }
        columns.push(col);
      }
    } else if (type === 'minibus-28') {
      for (let c = 0; c < 7; c++) {
        const col: Seat[] = [];
        const base = c * 4 + 1;
        col.push({ id: base.toString(), type: 'seat', label: base.toString(), ...getSeatStatus(base.toString()) });
        col.push({ id: (base+1).toString(), type: 'seat', label: (base+1).toString(), ...getSeatStatus((base+1).toString()) });
        col.push({ id: `aisle-${c}`, type: 'aisle' });
        col.push({ id: (base+2).toString(), type: 'seat', label: (base+2).toString(), ...getSeatStatus((base+2).toString()) });
        col.push({ id: (base+3).toString(), type: 'seat', label: (base+3).toString(), ...getSeatStatus((base+3).toString()) });
        columns.push(col);
      }
    } else {
      columns.push([
        { id: 'driver', type: 'driver', label: 'السائق' },
        { id: 'aisle-0', type: 'aisle' },
        { id: '1', type: 'seat', label: '1', ...getSeatStatus('1') },
        { id: '2', type: 'seat', label: '2', ...getSeatStatus('2') }
      ]);
      
      for (let c = 1; c <= 4; c++) {
        const base = (c-1) * 3 + 3;
        columns.push([
          { id: base.toString(), type: 'seat', label: base.toString(), ...getSeatStatus(base.toString()) },
          { id: `aisle-${c}`, type: 'aisle' },
          { id: (base+1).toString(), type: 'seat', label: (base+1).toString(), ...getSeatStatus((base+1).toString()) },
          { id: (base+2).toString(), type: 'seat', label: (base+2).toString(), ...getSeatStatus((base+2).toString()) }
        ]);
      }
    }
    return columns;
  }, [type, localBookings]);

  const stats = useMemo(() => {
    let total = 48;
    if (type === 'minibus-28') total = 28;
    else if (type === 'van-14') total = 14;
    const booked = localBookings.length;
    return { total, booked, available: total - booked };
  }, [type, localBookings]);

  const filteredBookings = useMemo(() => {
    return tripBookings.filter(b => 
      b.userName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tripBookings, searchQuery]);

  return (
    <div className="flex flex-col w-full font-cairo" dir="rtl">
      {/* Legend & Stats */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
         <div className="flex flex-wrap gap-4 items-center justify-center md:justify-start">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-white border border-zinc-200" />
                <span className="text-[10px] font-bold text-zinc-500">متاح</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-indigo-600" />
                <span className="text-[10px] font-bold text-zinc-500">محجوز</span>
            </div>
            {isAdmin && (
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-orange-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-zinc-500">محدد</span>
                </div>
            )}
         </div>

         <div className="bg-white px-4 py-2 rounded-2xl border border-zinc-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-[10px] font-black text-zinc-400">الحجوزات: <span className="text-zinc-900">{totalBookedPassengers}</span></span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black">
                <span className="text-emerald-600">{stats.available} متاح</span>
                <span className="text-indigo-600">{stats.booked} محجوز</span>
            </div>
         </div>
      </div>

      <div className="w-full space-y-8">
        {/* Top Section: Passenger List (Admin Only) */}
        {isAdmin && (
          <div className="space-y-4">
             <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                      <Users className="w-5 h-5" />
                   </div>
                   <div>
                      <h3 className="text-lg font-black text-gray-900">توزيع المقاعد</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">اسحب اسم المسافر إلى المقعد المخصص له</p>
                   </div>
                </div>
                
                <div className="relative w-full md:w-64">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <Input 
                      placeholder="ابحث عن مسافر..." 
                      className="pr-10 h-10 rounded-xl border-zinc-100 bg-white shadow-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
             </div>
             
             <Card className="rounded-[2.5rem] border-zinc-100 shadow-xl overflow-hidden bg-white/50 backdrop-blur-sm p-4">
                <ScrollArea className="w-full pb-2" dir="rtl">
                   <div className="flex gap-3 min-w-max pb-2 px-1">
                      {filteredBookings.length > 0 ? (
                        filteredBookings.map((booking) => {
                          const isAssigned = localBookings.some(b => b.passengerName === booking.userName);
                          const assignedSeat = localBookings.find(b => b.passengerName === booking.userName)?.seatNumber;

                          return (
                            <div 
                              key={booking._id} 
                              draggable
                              onDragStart={(e) => handleDragStart(e, booking.userName)}
                              className={cn(
                                "p-3 rounded-2xl border transition-all cursor-grab active:cursor-grabbing flex items-center gap-3 w-48 shrink-0 group",
                                isAssigned 
                                  ? "bg-emerald-50 border-emerald-100" 
                                  : "bg-white border-zinc-100 hover:border-indigo-400 hover:shadow-md"
                              )}
                            >
                               <div className="w-8 h-8 rounded-xl bg-zinc-50 flex items-center justify-center shrink-0 border border-zinc-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                                  <GripVertical className="w-4 h-4 text-zinc-300 group-hover:text-indigo-400" />
                               </div>
                               <div className="min-w-0 flex-1">
                                  <p className="text-[11px] font-black text-zinc-900 truncate leading-none mb-1">{booking.userName}</p>
                                  {isAssigned ? (
                                    <Badge className="bg-emerald-600 text-white text-[8px] border-0 h-4 px-1.5 font-black uppercase">مقعد {assignedSeat}</Badge>
                                  ) : (
                                    <p className="text-[9px] font-bold text-zinc-400">غير مخصص</p>
                                  )}
                               </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="w-full py-4 text-center opacity-40">
                            <p className="text-[10px] font-bold">لا يوجد مسافرين مطابقين</p>
                        </div>
                      )}
                   </div>
                </ScrollArea>
             </Card>
          </div>
        )}

        {/* Bus Layout Section */}
        <div className="w-full">
          <div className="flex flex-col items-center gap-6">
            {isAdmin && selectedSeats.length > 0 && (
              <div className="animate-in fade-in slide-in-from-top-2">
                  <Button 
                      onClick={handleBookSelected}
                      className="bg-orange-600 hover:bg-orange-700 text-white font-black px-8 h-12 rounded-full shadow-xl border-4 border-white gap-2 transition-all hover:scale-105"
                  >
                      تأكيد حجز {selectedSeats.length} مقاعد
                  </Button>
              </div>
            )}

            {!isAdmin && onSelectSeats && selectedSeats.length > 0 && (
              <div className="animate-in fade-in slide-in-from-top-2">
                  <Button 
                      onClick={() => {
                        onSelectSeats(selectedSeats);
                        // Optional alert or toast could be added here
                      }}
                      type="button"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 h-12 rounded-full shadow-xl border-4 border-white gap-2 transition-all hover:scale-105 flex items-center"
                  >
                      تأكيد اختيار المقاعد ({selectedSeats.length})
                      <CheckCircle2 className="w-5 h-5 ml-2" />
                  </Button>
              </div>
            )}

            <div className="relative w-full py-2 flex justify-center">
              <Card className="inline-flex p-6 md:p-8 bg-zinc-50/50 border-zinc-200 rounded-[3rem] shadow-inner relative">
                  {/* Visual Decoration - Side Walls of the Bus */}
                  <div className="absolute left-0 top-10 bottom-10 w-1 bg-zinc-200/50 rounded-full" />
                  <div className="absolute right-0 top-10 bottom-10 w-1 bg-zinc-200/50 rounded-full" />
                  
                  <div className="flex flex-col gap-3">
                      {layout.map((row, rIdx) => (
                          <div key={rIdx} className="flex flex-row gap-3 items-center justify-center">
                              {row.map((seat, sIdx) => {
                                  if (seat.type === 'aisle') {
                                      return <div key={sIdx} className="w-10 h-10 md:w-12 md:h-12" />;
                                  }
                                  
                                  if (seat.type === 'wc' || seat.type === 'door' || seat.type === 'driver' || seat.type === 'guide') {
                                      return (
                                          <div key={sIdx} className={cn(`
                                              w-10 h-10 md:w-12 md:h-12 rounded-xl flex flex-col items-center justify-center border-b-4 text-[9px] font-black text-center p-1 shadow-sm
                                          `, 
                                            seat.type === 'driver' ? 'bg-zinc-800 border-zinc-950 text-white' : 
                                            seat.type === 'guide' ? 'bg-zinc-200 border-zinc-300 text-zinc-600' :
                                            'bg-orange-100 border-orange-200 text-orange-600'
                                          )}>
                                              {seat.type === 'driver' && <Disc className="w-5 h-5 mb-0.5" />}
                                              {seat.type === 'wc' && <Coffee className="w-5 h-5 mb-0.5 text-orange-500" />}
                                              {seat.type === 'door' && <DoorClosed className="w-5 h-5 mb-0.5" />}
                                              <span className="truncate w-full">{seat.label}</span>
                                          </div>
                                      );
                                  }
 
                                  const isSelected = selectedSeats.includes(seat.id);
 
                                  return (
                                      <TooltipProvider key={sIdx}>
                                          <Tooltip>
                                              <TooltipTrigger asChild>
                                                  <button
                                                      type="button"
                                                      onClick={() => handleSeatClick(seat.id)}
                                                      onDragOver={handleDragOver}
                                                      onDrop={(e) => handleDrop(e, seat.id)}
                                                      disabled={!isAdmin && seat.isBooked}
                                                      className={cn(`
                                                          w-10 h-10 md:w-12 md:h-12 rounded-xl font-black text-[11px] transition-all relative flex flex-col items-center justify-center border-b-4 group shadow-sm
                                                      `, 
                                                        seat.isBooked 
                                                            ? "bg-indigo-600 border-indigo-800 text-white shadow-indigo-200" 
                                                            : isSelected
                                                                ? "bg-orange-500 border-orange-700 text-white scale-110 shadow-xl z-20"
                                                                : "bg-white border-zinc-200 text-zinc-600 hover:border-indigo-400 hover:shadow-md"
                                                      )}
                                                  >
                                                      {seat.isBooked ? (
                                                        <div className="flex flex-col items-center">
                                                           {seat.passengerName ? (
                                                              <span className="text-[7px] leading-none mb-1 opacity-80 line-clamp-1 px-1">{seat.passengerName}</span>
                                                           ) : null}
                                                           <span>{seat.label}</span>
                                                        </div>
                                                      ) : seat.label}
                                                  </button>
                                              </TooltipTrigger>
                                              <TooltipContent className="bg-zinc-900 text-white border-0 rounded-xl p-3 text-[10px] shadow-2xl">
                                                  <div className="text-center space-y-1">
                                                      {seat.isBooked ? (
                                                          <>
                                                              <p className="opacity-50 text-[9px] font-bold">المسافر:</p>
                                                              <p className="font-black text-indigo-400 text-xs">{seat.passengerName}</p>
                                                              <div className="h-px bg-white/10 my-2" />
                                                              <p className="text-[9px]">رقم المقعد: {seat.label}</p>
                                                          </>
                                                      ) : (
                                                        <>
                                                          <p className="font-black">مقعد متاح ({seat.label})</p>
                                                          {isAdmin && <p className="text-[9px] opacity-60">اسحب اسم المسافر إلى هنا</p>}
                                                        </>
                                                      )}
                                                  </div>
                                              </TooltipContent>
                                          </Tooltip>
                                      </TooltipProvider>
                                  );
                              })}
                          </div>
                      ))}
                  </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
         <DialogContent className="font-cairo rounded-[2rem] max-w-sm">
            <DialogHeader>
                <DialogTitle className="text-xl font-black text-center flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-2">
                       <Armchair className="w-6 h-6" />
                    </div>
                    تخصيص الحجز
                </DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <div className="flex flex-wrap gap-1.5 justify-center">
                    {selectedSeats.map(id => (
                        <Badge key={id} variant="secondary" className="bg-zinc-100 text-zinc-600 border-0 h-6 px-3 rounded-full text-[10px] font-black">مقعد {id}</Badge>
                    ))}
                </div>
                <div className="space-y-2">
                    <Label className="text-xs font-black mr-1 text-zinc-500 uppercase">اسم المسافر</Label>
                    <Input 
                        value={passengerName} 
                        onChange={(e) => setPassengerName(e.target.value)}
                        placeholder="الاسم بالكامل..."
                        className="h-14 rounded-2xl border-zinc-100 bg-zinc-50 font-black text-center text-lg focus:ring-indigo-500/20"
                    />
                </div>
            </div>
            <DialogFooter className="flex flex-col gap-2">
                <Button onClick={saveBooking} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 font-black text-lg shadow-xl shadow-indigo-100">
                    حـفـظ الـحـجـز
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                      variant="outline"
                      onClick={() => {
                          let newList = [...localBookings].filter(b => !selectedSeats.includes(b.seatNumber));
                          setLocalBookings(newList);
                          onSaveSeats?.(newList);
                          setSelectedSeats([]);
                          setShowBookingDialog(false);
                      }}
                      className="rounded-2xl h-12 border-rose-100 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold"
                  >
                      حذف الحجز
                  </Button>
                  <Button 
                      variant="ghost" 
                      onClick={() => setShowBookingDialog(false)} 
                      className="rounded-2xl h-12 text-zinc-400 font-bold"
                  >
                      إلغاء التحديد
                  </Button>
                </div>
            </DialogFooter>
         </DialogContent>
      </Dialog>
      {/* Confirm Assignment Dialog */}
      <Dialog open={showConfirmDrop} onOpenChange={setShowConfirmDrop}>
        <DialogContent className="sm:max-w-[400px] rounded-[2rem] font-cairo" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                تأكيد تخصيص المقعد
            </DialogTitle>
            <DialogDescription className="text-gray-500 font-bold py-4">
                هل أنت متأكد من رغبتك في تخصيص المقعد رقم <span className="text-indigo-600 font-black">{targetSeat}</span> للمسافر <span className="text-indigo-600 font-black">{draggedPassenger}</span>؟
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
             <Button 
               variant="outline" 
               className="flex-1 h-12 rounded-2xl font-black border-zinc-100"
               onClick={() => setShowConfirmDrop(false)}
             >
               إلغاء
             </Button>
             <Button 
               className="flex-1 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-lg shadow-indigo-100"
               onClick={confirmAssignment}
             >
               تأكيد الآن
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BusSeatLayout;
