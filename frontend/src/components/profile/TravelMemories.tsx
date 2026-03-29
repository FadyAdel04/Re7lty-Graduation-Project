import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, X, Music, Volume2, VolumeX, Calendar, MapPin, Share2, Check, Plus, Trash2, ChevronRight, ChevronLeft, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/clerk-react";
import { Checkbox } from "@/components/ui/checkbox";

// Local Music Imports
import track1 from '@/assets/travel music/1.mp3';
import track2 from '@/assets/travel music/2.mp3';
import track3 from '@/assets/travel music/3.mp3';
import track4 from '@/assets/travel music/4.mp3';
import track5 from '@/assets/travel music/5.mp3';

const localTracks = [track1, track2, track3, track4, track5];

interface TravelMemoriesProps {
  trips: any[];
  isOwner?: boolean;
  userId?: string;
}

export default function TravelMemories({ trips, isOwner, userId }: TravelMemoriesProps) {
  // Memories UI State
  const [activeMemory, setActiveMemory] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const [showShareOverlay, setShowShareOverlay] = useState(false);
  
  // Backend & Persistence State
  const [backendMemories, setBackendMemories] = useState<any[]>([]);
  const [isLoadingMemories, setIsLoadingMemories] = useState(true);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  
  // Creation Flow State
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2>(1);
  const [selectedMonthLabel, setSelectedMonthLabel] = useState<string>('');
  const [selectedTripIds, setSelectedTripIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  
  // Audio Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const shutterRef = useRef<HTMLAudioElement | null>(null);
  
  const { toast } = useToast();
  const { getToken } = useAuth();
  const videoDuration = 15; 

  // --- 1. Data Processing ---

  // All possible memories based on raw user trips (used as source for creation)
  const availableMemoriesFromTrips = useMemo(() => {
    if (!trips || !Array.isArray(trips)) return [];

    const grouped: Record<string, { monthDate: Date, label: string, trips: any[] }> = {};

    trips.forEach(trip => {
      const tripDate = new Date(trip.postedAt || trip.createdAt || Date.now());
      const monthKey = `${tripDate.getFullYear()}-${tripDate.getMonth()}`;
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = {
          monthDate: tripDate,
          label: tripDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' }),
          trips: []
        };
      }
      grouped[monthKey].trips.push(trip);
    });

    return Object.values(grouped).sort((a, b) => b.monthDate.getTime() - a.monthDate.getTime());
  }, [trips]);

  // --- 2. API Interactions ---

  const fetchMemories = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/memories/${userId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setBackendMemories(data);
      }
    } catch (e) {
      console.error("Failed to fetch memories", e);
    } finally {
      setIsLoadingMemories(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, [userId]);

  const handleDeleteMemory = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!isOwner) return;
    
    setIsDeletingId(id);
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/memories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        toast({ title: "تم الحذف", description: "تم حذف الذكرى بنجاح" });
        setBackendMemories(prev => prev.filter(m => m._id !== id));
      } else {
        const err = await res.json();
        toast({ variant: 'destructive', title: "خطأ", description: err.error || "فشل حذف الذكرى" });
      }
    } catch (e) {
      toast({ variant: 'destructive', title: "خطأ", description: "حدث خطأ أثناء الحذف" });
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleSaveMemory = async () => {
    if (!selectedMonthLabel || selectedTripIds.size === 0) return;
    
    setIsSaving(true);
    try {
      const token = await getToken();
      const monthData = availableMemoriesFromTrips.find(m => m.label === selectedMonthLabel);
      if (!monthData) return;

      // Extract images from selected trips
      let allMedia: any[] = [];
      monthData.trips.filter(t => selectedTripIds.has(t._id || t.id)).forEach(trip => {
          let mediaList: string[] = [];
          if (trip.image) mediaList.push(trip.image);
          if (Array.isArray(trip.activities)) {
            trip.activities.forEach((act: any) => {
              if (Array.isArray(act.images)) mediaList.push(...act.images);
            });
          }
          mediaList = Array.from(new Set(mediaList.filter(Boolean)));
          
          mediaList.forEach(m => {
            allMedia.push({
              url: m,
              tripTitle: trip.title || 'رحلة',
              destination: trip.destination || trip.city || 'وجهة غير معروفة'
            });
          });
      });

      if (allMedia.length < 2) {
         toast({ variant: 'destructive', title: "بيانات غير كافية", description: "يرجى اختيار المزيد من الرحلات (نحتاج لصورتين على الأقل)" });
         setIsSaving(false);
         return;
      }

      // Final items for the reel
      const items = allMedia.sort(() => 0.5 - Math.random()).slice(0, 10);
      
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/memories`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
           monthLabel: selectedMonthLabel,
           items: items,
           trackIndex: Math.floor(Math.random() * localTracks.length)
        })
      });

      if (res.ok) {
        toast({ title: "تم إنشاء الذكرى!", description: "ستظهر الآن في ملفك الشخصي" });
        setIsCreateDialogOpen(false);
        fetchMemories();
      } else {
        const data = await res.json();
        toast({ variant: 'destructive', title: "عذراً", description: data.error });
      }
    } catch (e) {
      toast({ variant: 'destructive', title: "خطأ", description: "فشل حفظ الذكرى" });
    } finally {
      setIsSaving(false);
    }
  };

  // --- 3. Playing Logic ---

  const activeGroup = useMemo(() => {
    if (!activeMemory) return null;
    return backendMemories.find(m => m.monthLabel === activeMemory);
  }, [activeMemory, backendMemories]);

  useEffect(() => {
    if (audioRef.current) {
       if (activeMemory && isPlaying && !showShareOverlay) {
          audioRef.current.play().catch(() => {});
       } else {
          audioRef.current.pause();
       }
    }
  }, [isPlaying, activeMemory, showShareOverlay]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeGroup && isPlaying && !showShareOverlay) {
      const itemsCount = activeGroup.items.length;
      const slideDuration = (videoDuration * 1000) / itemsCount;

      timer = setInterval(() => {
        setCurrentSlide(prev => {
          const next = prev + 1;
          if (next >= itemsCount) {
             closeMemory();
             return 0;
          }
          if (shutterRef.current && !isMuted) {
             shutterRef.current.currentTime = 0;
             shutterRef.current.play().catch(() => {});
          }
          return next;
        });
      }, slideDuration);
      return () => clearInterval(timer);
    }
  }, [activeGroup, isPlaying, isMuted, showShareOverlay]);

  useEffect(() => {
    if (activeGroup && isPlaying && !showShareOverlay) {
      const totalMs = videoDuration * 1000;
      const interval = 50; 
      const step = (100 / (totalMs / interval));
      const pTimer = setInterval(() => {
         setProgress(p => Math.min(100, p + step));
      }, interval);
      return () => clearInterval(pTimer);
    }
  }, [activeGroup, isPlaying, showShareOverlay]);

  const openMemory = (label: string) => {
    const memory = backendMemories.find(m => m.monthLabel === label);
    if (!memory) return;

    setActiveMemory(label);
    setCurrentSlide(0);
    setProgress(0);
    setIsPlaying(true);
    setShowShareOverlay(false);
    
    if (audioRef.current) {
       audioRef.current.src = localTracks[memory.trackIndex || 0];
       audioRef.current.volume = isMuted ? 0 : 0.4;
       audioRef.current.play().catch(() => {});
    }

    if (shutterRef.current && !isMuted) {
      shutterRef.current.currentTime = 0;
      shutterRef.current.play().catch(() => {});
    }
  };

  const closeMemory = () => {
    setActiveMemory(null);
    setIsPlaying(false);
    setProgress(0);
    setShowShareOverlay(false);
    if (audioRef.current) audioRef.current.pause();
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
    if (audioRef.current) audioRef.current.volume = !isMuted ? 0 : 0.4;
    if (shutterRef.current) shutterRef.current.volume = !isMuted ? 0 : 0.5;
  };

  // --- Deep Link Logic ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mem = params.get('memory');
    if (mem && backendMemories.length > 0) {
       const found = backendMemories.find(m => m.monthLabel === mem);
       if (found) openMemory(found.monthLabel);
    }
  }, [backendMemories]);

  // --- Privacy Check ---
  const sharedLabel = new URLSearchParams(window.location.search).get('memory');
  const isViewingSpecificShared = !!sharedLabel && !isOwner;
  
  if (isLoadingMemories) return null;
  if (!isOwner && backendMemories.length === 0 && !sharedLabel) return null;

  // Filter display list for shared users
  const memoriesToDisplay = isViewingSpecificShared 
    ? backendMemories.filter(m => m.monthLabel === sharedLabel)
    : backendMemories;

  if (memoriesToDisplay.length === 0 && !isOwner) return null;

  return (
    <div className="w-full mb-8 text-right px-2">
      <h3 className="text-xl font-black mb-4 flex items-center justify-end gap-2 text-gray-900">
         <Play className="w-5 h-5 text-indigo-600 fill-indigo-600" />
         {isOwner ? "ذكرياتك المسجلة (3 بحد أقصى)" : "ذكريات السفر"}
      </h3>
      
      <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-4 flex-row-reverse" dir="ltr">
        
        {/* Create Button (Only for owner and < 3) */}
        {isOwner && backendMemories.length < 3 && (
          <div onClick={() => { setIsCreateDialogOpen(true); setCreateStep(1); setSelectedTripIds(new Set()); }} className="flex flex-col items-center gap-2 cursor-pointer group shrink-0" dir="rtl">
             <div className="w-20 h-20 rounded-full p-1 bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 group-hover:border-indigo-400 group-hover:text-indigo-400 transition-all">
                <Plus className="w-8 h-8" />
             </div>
             <span className="text-[10px] font-black text-gray-500">إنشاء ذكرى</span>
          </div>
        )}

        {/* Existing Memories */}
        {memoriesToDisplay.map((group, idx) => (
            <div key={idx} onClick={() => openMemory(group.monthLabel)} className="flex flex-col items-center gap-2 cursor-pointer group shrink-0 relative" dir="rtl">
                <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-indigo-500 via-purple-500 to-orange-500 relative transition-transform group-hover:scale-105 shadow-xl shadow-indigo-100">
                  <div className="w-full h-full rounded-full border-4 border-white overflow-hidden bg-gray-100 shrink-0">
                      <img src={group.items[0]?.url} className="w-full h-full object-cover" alt="Cover" />
                  </div>
                  
                  {isOwner && (
                    <button 
                      onClick={(e) => handleDeleteMemory(e, group._id)}
                      disabled={isDeletingId === group._id}
                      className="absolute -top-1 -left-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white hover:scale-110 transition-all z-20"
                    >
                       {isDeletingId === group._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    </button>
                  )}

                  {sharedLabel === group.monthLabel && (
                    <div className="absolute -top-1 -right-1 bg-emerald-600 text-white rounded-full p-1 border-2 border-white animate-bounce z-20">
                        <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-black text-gray-600 text-center w-full truncate">{group.monthLabel}</span>
            </div>
        ))}
      </div>

      <audio ref={audioRef} loop />
      <audio ref={shutterRef} src="https://assets.mixkit.co/sfx/preview/mixkit-camera-shutter-click-1133.mp3" />

      {/* --- CREATE MEMORY DIALOG --- */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-[500px] p-0 overflow-hidden bg-white border-none rounded-[2.5rem] font-cairo shadow-2xl">
           <DialogHeader className="bg-indigo-600 p-8 text-white relative">
              <DialogTitle className="text-2xl font-black text-right">إنشاء ذكرى جديدة ✨</DialogTitle>
              <DialogDescription className="text-indigo-100 text-right font-medium">حول رحلات الشهر إلى فيديو تذكاري رائع</DialogDescription>
              <div className="absolute top-8 left-8 bg-white/10 backdrop-blur-md rounded-2xl p-2 px-4 text-xs font-black">
                {backendMemories.length}/3 ذكريات
              </div>
           </DialogHeader>

           <div className="p-8">
              {createStep === 1 ? (
                <div className="space-y-6">
                   <h4 className="font-bold text-gray-900 text-right">اختر الشهر الذي تود استخدامه</h4>
                   <div className="grid grid-cols-2 gap-3 pb-4 max-h-[300px] overflow-y-auto no-scrollbar" dir="rtl">
                      {availableMemoriesFromTrips.map(month => {
                        const isChosen = backendMemories.some(bm => bm.monthLabel === month.label);
                        return (
                          <button 
                            key={month.label}
                            disabled={isChosen}
                            onClick={() => { setSelectedMonthLabel(month.label); setCreateStep(2); }}
                            className={cn(
                              "p-4 rounded-2xl text-right transition-all border-2 group",
                              isChosen ? "bg-gray-50 border-gray-100 opacity-50 cursor-not-allowed" : "bg-white border-gray-100 hover:border-indigo-500 hover:bg-indigo-50 shadow-sm"
                            )}
                          >
                             <Calendar className={cn("w-5 h-5 mb-2", isChosen ? "text-gray-300" : "text-indigo-500")} />
                             <p className="font-black text-sm">{month.label}</p>
                             <p className="text-[10px] text-gray-400">{month.trips.length} رحلة مدرجة</p>
                             {isChosen && <span className="text-[9px] text-indigo-500 font-black">موجود بالفعل</span>}
                          </button>
                        );
                      })}
                   </div>
                </div>
              ) : (
                <div className="space-y-6 animate-in slide-in-from-left duration-300" dir="rtl">
                   <div className="flex items-center justify-between">
                      <h4 className="font-bold text-gray-900">اختر الرحلات للذكرى ({selectedTripIds.size})</h4>
                      <Button variant="ghost" size="sm" onClick={() => setCreateStep(1)} className="text-indigo-600 font-black">تغيير الشهر</Button>
                   </div>
                   <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar pb-2">
                      {availableMemoriesFromTrips.find(m => m.label === selectedMonthLabel)?.trips.map(trip => (
                         <div key={trip._id || trip.id} onClick={() => {
                            const next = new Set(selectedTripIds);
                            if (next.has(trip._id || trip.id)) next.delete(trip._id || trip.id);
                            else next.add(trip._id || trip.id);
                            setSelectedTripIds(next);
                         }} className={cn(
                           "flex items-center gap-4 p-3 rounded-[1.5rem] border-2 cursor-pointer transition-all",
                           selectedTripIds.has(trip._id || trip.id) ? "border-indigo-600 bg-indigo-50/50" : "border-gray-50 hover:bg-gray-50 bg-white"
                         )}>
                            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 shrink-0">
                               <img src={trip.image || "/placeholder.svg"} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 text-right">
                               <p className="font-black text-sm text-gray-900">{trip.title}</p>
                               <p className="text-[10px] text-gray-400">{trip.destination}</p>
                            </div>
                            <Checkbox 
                              checked={selectedTripIds.has(trip._id || trip.id)} 
                              onCheckedChange={() => {}} 
                              className="rounded-full w-5 h-5"
                            />
                         </div>
                      ))}
                   </div>
                </div>
              )}
           </div>

           <DialogFooter className="p-8 pt-0 flex-row-reverse gap-3" dir="rtl">
              <Button 
                onClick={handleSaveMemory} 
                className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-xl shadow-indigo-100"
                disabled={selectedTripIds.size === 0 || isSaving || createStep === 1}
              >
                 {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5 ml-2" /> إتمام وإنشاء</>}
              </Button>
              <Button variant="ghost" onClick={() => setIsCreateDialogOpen(false)} className="px-6 h-14 rounded-2xl font-bold">إلغاء</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- REEL VIEWER DIALOG --- */}
      <Dialog open={!!activeGroup} onOpenChange={(open) => !open && closeMemory()}>
        <DialogContent className="max-w-[400px] p-0 overflow-hidden bg-black border-none rounded-[2rem] h-[80vh] font-cairo shadow-2xl">
           <DialogHeader className="hidden"><DialogTitle>Re7lty Memory</DialogTitle></DialogHeader>
           {activeGroup && (
             <div className="relative w-full h-full flex items-center justify-center bg-black" onClick={() => setIsPlaying(p => !p)}>
                {activeGroup.items.map((item: any, idx: number) => (
                   <img 
                      key={idx}
                      src={item.url}
                      className={cn(
                        "absolute inset-0 w-full h-full object-cover transition-transform ease-linear",
                        currentSlide === idx ? "opacity-100 animate-slow-zoom z-10" : "opacity-0 z-0",
                        "duration-1000"
                      )}
                      style={{ animationDuration: `${activeGroup.items.length > 0 ? (videoDuration / activeGroup.items.length) + 1 : 3}s` }}
                   />
                ))}

                <div className="absolute top-0 inset-x-0 bg-gradient-to-b from-black/80 to-transparent p-4 z-50 flex flex-col gap-3">
                   <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden backdrop-blur-md">
                      <div className="h-full bg-white rounded-full transition-all duration-50 linear" style={{ width: `${progress}%` }} />
                   </div>
                   
                   <div className="flex justify-between items-center text-white" dir="rtl">
                      <div className="flex items-center gap-2">
                         <div className="bg-indigo-600 rounded-lg p-1.5 shadow-lg shadow-indigo-600/30 font-bold text-[10px]">Re7lty</div>
                         <div className="flex flex-col text-right">
                           <span className="font-bold text-sm leading-tight">{activeGroup.monthLabel}</span>
                           <span className="text-[10px] text-white/80">{activeGroup.items.length} لقطات مميزة</span>
                         </div>
                      </div>
                      <div className="flex items-center gap-3">
                         <button onClick={(e) => { e.stopPropagation(); setIsPlaying(false); setShowShareOverlay(true); }} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all">
                              <Share2 className="w-4 h-4" />
                         </button>
                         <button onClick={toggleMute} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm hover:bg-white/30">
                            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                         </button>
                         <button onClick={closeMemory} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm hover:bg-white/30">
                            <X className="w-4 h-4" />
                         </button>
                      </div>
                   </div>
                </div>

                {showShareOverlay && (
                  <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
                      <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-[320px] shadow-2xl relative text-center text-gray-900 border border-gray-100">
                         <div className="w-20 h-20 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 mx-auto mb-6 shadow-xl shadow-orange-100 rotate-3"><Share2 className="w-10 h-10" /></div>
                         <h3 className="text-2xl font-black mb-2 text-gray-900">شارك ذكرياتك</h3>
                         <p className="text-sm text-gray-500 mb-8 font-medium">شارك الرابط مع أصدقائك ليشاهدوا هذه الذكرى فقط</p>
                         <div className="grid grid-cols-1 gap-3">
                            <Button className="rounded-2xl h-14 gap-3 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-100 text-lg font-black" onClick={() => {
                                  const url = new URL(window.location.origin + window.location.pathname);
                                  url.searchParams.set('memory', activeMemory || '');
                                  window.open(`https://wa.me/?text=${encodeURIComponent("شاهد ذكرياتي الرائعة على رحلتي: " + url.toString())}`, '_blank');
                            }}>واتساب</Button>
                            <Button variant="outline" className={cn("rounded-2xl h-14 gap-3 border-gray-100 hover:bg-gray-50 text-gray-700 font-bold", isCopied ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "")} onClick={() => {
                                  const url = new URL(window.location.origin + window.location.pathname);
                                  url.searchParams.set('memory', activeMemory || '');
                                  navigator.clipboard.writeText(url.toString());
                                  setIsCopied(true);
                                  toast({ title: "تم النسخ!", description: "رابط الذكرى جاهز للمشاركة." });
                                  setTimeout(() => setIsCopied(false), 2000);
                               }}>{isCopied ? <Check className="w-5 h-5" /> : <Share2 className="w-4 h-4" />}{isCopied ? "تم النسخ" : "نسخ الرابط"}</Button>
                         </div>
                         <button onClick={() => { setShowShareOverlay(false); setIsPlaying(true); }} className="mt-6 text-sm font-black text-indigo-600 hover:scale-105 transition-transform">إغلاق</button>
                      </div>
                  </div>
                )}

                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/60 to-transparent p-6 pt-24 z-50 text-right" dir="rtl">
                   <div className="flex flex-col gap-2">
                       <div className="flex items-center justify-end gap-3 mb-1">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 bg-indigo-900/40 w-fit px-2 py-1 rounded-full border border-indigo-400/40 flex items-center gap-1.5 backdrop-blur-md">
                            <Music className="w-3 h-3" /> Soundtrack - Re7lty
                          </span>
                          {isPlaying && !isMuted && !showShareOverlay && (
                            <div className="flex items-center gap-0.5 h-3">
                               {[1, 2, 3, 4].map(bar => <div key={bar} className="w-0.5 bg-indigo-400 animate-music-bar" style={{ animationDelay: `${bar * 0.1}s`, height: '100%' }} />)}
                            </div>
                          )}
                       </div>
                       {currentSlide < activeGroup.items.length && (
                         <div className="animate-in slide-in-from-right fade-in duration-500">
                           <h2 className="text-2xl font-black text-white drop-shadow-md leading-tight">{activeGroup.items[currentSlide].tripTitle}</h2>
                           <p className="text-sm font-bold text-gray-300 drop-shadow-md flex items-center gap-1 mt-1"><MapPin className="w-3.5 h-3.5 text-orange-400" />{activeGroup.items[currentSlide].destination}</p>
                         </div>
                       )}
                   </div>
                </div>

                {!isPlaying && !showShareOverlay && (
                  <div className="absolute inset-0 z-40 flex justify-center items-center pointer-events-none">
                     <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center animate-pulse"><Play className="w-8 h-8 text-white fill-current ml-1" /></div>
                  </div>
                )}
             </div>
           )}
        </DialogContent>
      </Dialog>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slowZoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.1); }
        }
        @keyframes musicBar {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
        .animate-slow-zoom { animation: slowZoom linear ease-in-out forwards; }
        .animate-music-bar { animation: musicBar 0.6s ease-in-out infinite; transform-origin: bottom; }
      `}} />
    </div>
  );
}
