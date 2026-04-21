const fs = require('fs');
const file = 'e:/computer and artificial intilgance/Graduation projects/Re7lty/frontend/src/pages/TripAIChat.tsx';
const txt = fs.readFileSync(file, 'utf8');

const platIdx = txt.indexOf("{chatMode === 'platform' && (");
const destIdx = txt.lastIndexOf("{extractedData.destination && (");

const start = txt.substring(0, platIdx);

const platBlock = `             {chatMode === 'platform' && (
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
          </div>
        </div>

        `;

const end = txt.substring(destIdx);

fs.writeFileSync(file, start + platBlock + end);
console.log('Fixed TripAIChat.tsx!');
