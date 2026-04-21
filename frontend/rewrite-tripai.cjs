const fs = require('fs');
const file = 'e:/computer and artificial intilgance/Graduation projects/Re7lty/frontend/src/pages/TripAIChat.tsx';
let content = fs.readFileSync(file, 'utf8');

const startStr = '             <ScrollArea className="flex-1 min-h-0 p-4 sm:p-6">';
const endStr = '        {extractedData.destination && (';

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr);

if (startIdx === -1 || endIdx === -1) {
  console.log('Markers not found!');
  process.exit(1);
}

const replacement = `             {chatMode === 'ai' ? (
                <ScrollArea className="flex-1 min-h-0 p-4 sm:p-6">
                   <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-sm mx-auto pt-4 pb-12">
                      <div className="flex items-center justify-between mb-8">
                         {[1, 2, 3, 4, 5].map(step => (
                            <div key={step} className="flex flex-col items-center gap-2">
                               <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-black text-sm transition-all", currentStep === step ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : currentStep > step ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400")}>{currentStep > step ? <CheckCircle2 className="w-5 h-5"/> : step}</div>
                            </div>
                         ))}
                      </div>

                      {currentStep === 1 && (
                         <div className="space-y-6">
                            <h3 className="text-xl font-black text-gray-900 text-center">عايز تسافر فين؟ 🌍</h3>
                            <div className="grid grid-cols-2 gap-3">
                               {['شرم الشيخ', 'الإسكندرية', 'دهب', 'الغردقة', 'القاهرة', 'أسوان', 'الأقصر', 'مرسى علم'].map(city => (
                                  <Button key={city} variant={extractedData.destination === city ? "default" : "outline"} className={cn("h-12 rounded-xl font-bold", extractedData.destination === city && "bg-indigo-600")} onClick={() => setExtractedData(prev => ({...prev, destination: city}))}>{city}</Button>
                               ))}
                            </div>
                            <Input placeholder="أو اكتب اسم مدينة تانية..." className="h-12 rounded-xl text-center font-bold" value={extractedData.destination || ''} onChange={e => setExtractedData(prev => ({...prev, destination: e.target.value}))} />
                            <Button className="w-full h-12 rounded-xl bg-indigo-600 text-white font-black mt-4 shadow-lg shadow-indigo-200 gap-2" disabled={!extractedData.destination} onClick={() => {
                               const coords = GOVERNORATES_COORDINATES[extractedData.destination];
                               if(coords) setExtractedData(prev => ({...prev, lat: coords.lat, lng: coords.lng}));
                               setCurrentStep(2);
                            }}>التالي</Button>
                         </div>
                      )}

                      {currentStep === 2 && (
                         <div className="space-y-6">
                            <h3 className="text-xl font-black text-gray-900 text-center">هتتحرك منين؟ 🚌</h3>
                            <div className="grid grid-cols-2 gap-3">
                               {['القاهرة', 'الإسكندرية', 'الجيزة', 'المنصورة'].map(city => (
                                  <Button key={city} variant={extractedData.transportOrigin === city ? "default" : "outline"} className={cn("h-12 rounded-xl font-bold", extractedData.transportOrigin === city && "bg-indigo-600")} onClick={() => setExtractedData(prev => ({...prev, transportOrigin: city}))}>{city}</Button>
                               ))}
                            </div>
                            <Input placeholder="أو اكتب محافظتك..." className="h-12 rounded-xl text-center font-bold" value={extractedData.transportOrigin || ''} onChange={e => setExtractedData(prev => ({...prev, transportOrigin: e.target.value}))} />
                            <div className="flex gap-3 mt-4">
                               <Button variant="outline" className="flex-1 h-12 rounded-xl font-black text-gray-500" onClick={() => setCurrentStep(1)}>رجوع</Button>
                               <Button className="flex-[2] h-12 rounded-xl bg-indigo-600 text-white font-black shadow-lg shadow-indigo-200" disabled={!extractedData.transportOrigin} onClick={() => setCurrentStep(3)}>التالي</Button>
                            </div>
                         </div>
                      )}

                      {currentStep === 3 && (
                         <div className="space-y-6">
                            <h3 className="text-xl font-black text-gray-900 text-center">كام يوم والميزانية؟ 📅</h3>
                            <div className="space-y-3">
                              <label className="text-[10px] font-black text-gray-400 uppercase text-center block">مدة الرحلة (بالأيام)</label>
                              <div className="flex gap-2">
                                 {[3, 5, 7].map(d => (
                                    <Button key={d} variant={extractedData.days === d ? "default" : "outline"} className={cn("flex-1 h-12 rounded-xl font-bold", extractedData.days === d && "bg-indigo-600")} onClick={() => setExtractedData(prev => ({...prev, days: d}))}>{d} أيام</Button>
                                 ))}
                                 <Input type="number" placeholder="أخرى" className="flex-1 h-12 rounded-xl text-center font-bold" value={extractedData.days || ''} onChange={e => setExtractedData(prev => ({...prev, days: parseInt(e.target.value) || 0}))} />
                              </div>
                            </div>
                            <div className="space-y-3 pt-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase text-center block">ميزانية الإقامة والأنشطة (يومياً)</label>
                              <div className="flex gap-2">
                                 {[{k: 'low', v: 'اقتصادية'}, {k: 'medium', v: 'متوسطة'}, {k: 'high', v: 'فاخرة'}].map(b => (
                                    <Button key={b.k} variant={extractedData.budget === b.k ? "default" : "outline"} className={cn("flex-1 h-12 rounded-xl font-bold", extractedData.budget === b.k && "bg-indigo-600")} onClick={() => setExtractedData(prev => ({...prev, budget: b.k}))}>{b.v}</Button>
                                 ))}
                              </div>
                            </div>
                            <div className="flex gap-3 mt-4">
                               <Button variant="outline" className="flex-1 h-12 rounded-xl font-black text-gray-500" onClick={() => setCurrentStep(2)}>رجوع</Button>
                               <Button className="flex-[2] h-12 rounded-xl bg-indigo-600 text-white font-black shadow-lg shadow-indigo-200" disabled={!extractedData.days || !extractedData.budget} onClick={() => setCurrentStep(4)}>التالي</Button>
                            </div>
                         </div>
                      )}

                      {currentStep === 4 && (
                         <div className="space-y-6">
                            <h3 className="text-xl font-black text-gray-900 text-center">تحب أدور لك على فنادق؟ 🏨</h3>
                            <div className="flex gap-3">
                               <Button variant={extractedData.wantsHotels === true ? "default" : "outline"} className={cn("flex-1 h-16 rounded-xl font-black text-lg", extractedData.wantsHotels === true && "bg-indigo-600")} onClick={() => setExtractedData(prev => ({...prev, wantsHotels: true}))}>نعم 👍</Button>
                               <Button variant={extractedData.wantsHotels === false ? "default" : "outline"} className={cn("flex-1 h-16 rounded-xl font-black text-lg", extractedData.wantsHotels === false && "bg-rose-500 text-white hover:bg-rose-600 border-none")} onClick={() => setExtractedData(prev => ({...prev, wantsHotels: false, checkIn: null, checkOut: null}))}>لا شكراً 👎</Button>
                            </div>
                            
                            {extractedData.wantsHotels && (
                               <div className="grid grid-cols-2 gap-4 mt-6 animate-in zoom-in-95 duration-300">
                                 <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase">تاريخ الوصول</label>
                                    <Input type="date" className="h-12 rounded-xl font-bold border-gray-200 focus:border-indigo-400" value={extractedData.checkIn || ''} onChange={e => setExtractedData(prev => ({...prev, checkIn: e.target.value}))} />
                                 </div>
                                 <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase">تاريخ المغادرة</label>
                                    <Input type="date" className="h-12 rounded-xl font-bold border-gray-200 focus:border-indigo-400" value={extractedData.checkOut || ''} onChange={e => setExtractedData(prev => ({...prev, checkOut: e.target.value}))} />
                                 </div>
                               </div>
                            )}

                            <div className="flex gap-3 mt-4">
                               <Button variant="outline" className="flex-1 h-12 rounded-xl font-black text-gray-500" onClick={() => setCurrentStep(3)}>رجوع</Button>
                               <Button className="flex-[2] h-12 rounded-xl bg-indigo-600 text-white font-black shadow-lg shadow-indigo-200" disabled={extractedData.wantsHotels === undefined || extractedData.wantsHotels === null || (extractedData.wantsHotels && (!extractedData.checkIn || !extractedData.checkOut))} onClick={() => {
                                  handleCalculateCost(extractedData);
                                  setCurrentStep(5);
                               }}>التالي والمراجعة</Button>
                            </div>
                         </div>
                      )}

                      {currentStep === 5 && (
                         <div className="space-y-6">
                            <h3 className="text-xl font-black text-gray-900 text-center">راجع تفاصيل رحلتك ✅</h3>
                            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 space-y-4 shadow-inner">
                               <div className="flex justify-between items-center"><span className="text-xs font-black text-indigo-400 uppercase">الوجهة</span><span className="font-black text-indigo-900 text-sm">{extractedData.destination} 📍</span></div>
                               <div className="flex justify-between items-center"><span className="text-xs font-black text-indigo-400 uppercase">الانطلاق من</span><span className="font-black text-indigo-900 text-sm">{extractedData.transportOrigin} 🚌</span></div>
                               <div className="flex justify-between items-center"><span className="text-xs font-black text-indigo-400 uppercase">المدة</span><span className="font-black text-indigo-900 text-sm">{extractedData.days} أيام 📅</span></div>
                               {extractedData.wantsHotels && (
                                  <div className="flex justify-between items-center"><span className="text-xs font-black text-indigo-400 uppercase">التواريخ</span><span className="font-black text-indigo-900 text-sm w-32 text-left">{extractedData.checkIn} ➔ {extractedData.checkOut} 🏨</span></div>
                               )}
                               {estimatedPrice && (
                                  <div className="flex items-center justify-between pt-4 border-t border-indigo-200/60">
                                     <div>
                                        <span className="text-[10px] font-black text-indigo-600 uppercase block mb-1 tracking-widest">الميزانية التقديرية (تقريباً)</span>
                                        <span className="text-[9px] font-bold text-indigo-400 bg-white/60 px-1.5 py-0.5 rounded-md">مواصلات + إقامة ومزارات</span>
                                     </div>
                                     <span className="font-black text-emerald-600 text-xl">{estimatedPrice.toLocaleString()} ج.م</span>
                                  </div>
                               )}
                            </div>
                            <div className="flex gap-3 mt-6">
                               <Button variant="outline" className="flex-1 h-14 rounded-xl font-black text-gray-500" onClick={() => setCurrentStep(4)}>تعديل</Button>
                               <Button className="flex-[2] h-14 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm gap-2 shadow-xl shadow-indigo-200 transition-all" disabled={isGeneratingPlan || (aiQuota !== null && aiQuota.remaining <= 0)} onClick={async () => {
                                  if (extractedData.wantsHotels && (!extractedData.checkIn || !extractedData.checkOut)) {
                                     toast({ title: "تنبيه", description: "برجاء توفير تواريخ الإقامة", variant: "destructive" });
                                     return;
                                  }
                                  setIsGeneratingPlan(true);
                                  try {
                                     await confirmAndGeneratePlan();
                                  } catch (error) {
                                     console.error(error);
                                  } finally {
                                     setIsGeneratingPlan(false);
                                  }
                               }}>
                                  {isGeneratingPlan ? <Loader2 className="w-5 h-5 animate-spin"/> : <Sparkles className="w-5 h-5" />} {aiQuota !== null && aiQuota.remaining <= 0 ? 'نفد رصيد الرحلات' : 'تأكيد الخطة'}
                               </Button>
                            </div>
                         </div>
                      )}
                   </div>
                </ScrollArea>
             ) : (
                <ScrollArea className="flex-1 min-h-0 p-4 sm:p-6">
                   <div className="space-y-6">
                      <AnimatePresence>
                         {messages.map((m) => (
                           <motion.div key={m.id} initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} className={cn("flex flex-col max-w-[85%]", m.type === 'user' ? "mr-auto items-end" : "ml-auto")}>
                              <div className={cn("px-5 py-3.5 rounded-[1.5rem] shadow-sm text-sm font-bold leading-relaxed", m.type === 'user' ? "bg-indigo-600 text-white rounded-br-sm" : "bg-gray-100 text-gray-800 rounded-bl-sm")}>{m.text}</div>
                              
                              {/* Suggested Platform Trips */}
                              {m.suggestedPlatformTrips && m.suggestedPlatformTrips.length > 0 && (
                                  <div className="mt-4 space-y-3 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                                      <div className="flex items-center gap-2 mb-1 px-1"><LayoutGrid className="w-3 h-3 text-indigo-500" /><p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">رحلات مقترحة من المنصة</p></div>
                                      {m.suggestedPlatformTrips.map(trip => (
                                          <div key={trip.id} className="bg-white border border-gray-100 rounded-[1.5rem] overflow-hidden shadow-md hover:shadow-xl hover:border-indigo-200 transition-all duration-300 cursor-pointer group" onClick={() => window.open(\`/trips/\${trip.id}\`, '_blank')}>
                                              <div className="flex flex-col">
                                                  {trip.image ? (
                                                      <div className="w-full h-32 overflow-hidden relative"><img src={trip.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={trip.title} /><div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />{trip.price && <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-md text-[#10b981] text-[10px] font-black px-2.5 py-1 rounded-lg shadow-sm">{trip.price}</div>}</div>
                                                  ) : (
                                                      <div className="w-full h-2 bg-indigo-500" />
                                                  )}
                                                  <div className="p-4">
                                                      <div className="flex justify-between items-start gap-2 mb-1"><h4 className="text-sm font-black text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{trip.title}</h4><ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" /></div>
                                                       <p className="text-[11px] text-gray-500 font-medium line-clamp-2 leading-relaxed mb-2">{trip.matchReason}</p>
                                                       {!trip.image && trip.price && <div className="flex items-center gap-2"><span className="text-[10px] font-black text-[#10b981] bg-emerald-50 px-2 py-0.5 rounded-md">{trip.price}</span></div>}
                                                       <div className="flex items-center gap-1 text-[10px] font-black text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"><span>عرض التفاصيل</span><ArrowUpRight className="w-3 h-3" /></div>
                                                  </div>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              )}

                              <span className="text-[8px] font-black text-gray-300 uppercase mt-1.5 tracking-tighter">{m.timestamp.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                           </motion.div>
                         ))}
                         {isLoading && (
                            <div className="flex gap-2 p-3 bg-gray-50 rounded-2xl w-max ml-auto text-xs font-black text-gray-400"><Loader2 className="w-3.5 h-3.5 animate-spin" />جاري البحث...</div>
                         )}
                      </AnimatePresence>
                      <div ref={scrollRef} />
                   </div>
                </ScrollArea>
             )}

             {chatMode === 'platform' && (
                <div id="ai-chat-input" className="p-6 bg-gray-50/50 border-t border-gray-100">
                   {!isSignedIn && <div className="flex items-center justify-center gap-2 py-2 px-3 mb-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 text-xs font-bold">للاستمتاع بجميع ميزات الذكاء الاصطناعي يرجى تسجيل الدخول<SignInButton mode="modal"><Button variant="outline" size="sm" className="h-7 rounded-lg border-amber-200 text-amber-700 hover:bg-amber-100">تسجيل الدخول</Button></SignInButton></div>}
                   {!userInput && !isLoading && !isGeneratingPlan && (
                     <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide no-scrollbar">
                       {[{ text: \`ما هي أفضل الأماكن لزيارتها في مصر في \${getCurrentSeason()}؟\`, icon: <Star className="w-3 h-3" /> }, { text: "أين أجد أرخص الرحلات في دهب؟", icon: <Zap className="w-3 h-3" /> }, { text: "اقترح لي رحلة لمكان مناسب للتصوير", icon: <Camera className="w-3 h-3" /> }].map((s, idx) => (<button key={idx} onClick={() => { setUserInput(s.text); inputRef.current?.focus(); }} className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-indigo-100 text-[10px] font-black text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-sm">{s.icon}{s.text}</button>))}
                     </div>
                   )}
                   <div className="flex gap-3">
                      <div className="relative flex-1 group"><Input ref={inputRef} value={userInput} onChange={(e) => setUserInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="اسأل المساعد الذكي عن الرحلات..." className="h-12 rounded-2xl border-gray-200 focus:border-indigo-400 focus:ring-indigo-400 font-bold bg-white relative z-10" disabled={isLoading || isGeneratingPlan} /></div>
                      <Button onClick={() => handleSendMessage()} disabled={(!userInput.trim() && !isAwaitingConfirmation) || isLoading || isGeneratingPlan} className="h-12 w-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 disabled:opacity-50 transition-all shrink-0"><Send className="h-5 w-5" /></Button>
                   </div>
                </div>
             )}
`;

const newContent = content.substring(0, startIdx) + replacement + '\n' + content.substring(endIdx);
fs.writeFileSync(file, newContent, 'utf8');
console.log('Successfully updated TripAIChat.tsx with Stepper UI!');
