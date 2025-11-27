import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { subscribeToEvent, updateParticipantDates, generateId } from '../services/firebase';
import { EventData } from '../types';
import Calendar from '../components/Calendar';
import Results from '../components/Results';
import { Share2, Calendar as CalIcon, BarChart2, User, Loader2 } from 'lucide-react';

const EventPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  
  // State
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'calendar' | 'results'>('calendar');
  
  // Identity
  const [userId, setUserId] = useState<string | null>(localStorage.getItem('df_uid'));
  const [userName, setUserName] = useState<string>(localStorage.getItem('df_name') || '');
  const [showNameModal, setShowNameModal] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to Firebase
  useEffect(() => {
    if (!eventId) return;

    const unsubscribe = subscribeToEvent(eventId, (data) => {
      setEventData(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [eventId]);

  // Check Identity Logic
  useEffect(() => {
    if (!loading && eventData) {
      if (!userId) {
        setShowNameModal(true);
      } else {
        // Если у пользователя есть ID, но его нет в списке участников, можно спросить имя снова
        // или добавить автоматически. Сейчас просто проверяем наличие имени.
        if(!userName) setShowNameModal(true);
      }
    }
  }, [loading, eventData, userId, userName]);

  // Handlers
  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) return;

    const newId = userId || generateId();
    localStorage.setItem('df_uid', newId);
    localStorage.setItem('df_name', userName);
    setUserId(newId);
    setShowNameModal(false);
  };

  const handleDateToggle = async (dateIso: string) => {
    if (!userId || !eventData) return;
    
    // Safely access nested properties
    const participants = eventData.participants || {};
    const participantData = participants[userId];
    const currentDates = participantData?.dates || [];
    
    const exists = currentDates.includes(dateIso);
    
    let newDates;
    if (exists) {
      newDates = currentDates.filter(d => d !== dateIso);
    } else {
      newDates = [...currentDates, dateIso];
    }

    await updateParticipantDates(eventId!, userId, userName, newDates);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Ссылка скопирована!");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-primary">
        <Loader2 className="animate-spin w-10 h-10" />
      </div>
    );
  }

  if (!eventData) {
    return <div className="p-10 text-center">Событие не найдено.</div>;
  }

  const { name } = eventData;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 sm:pb-10">
      
      {/* Header */}
      <header className="bg-white sticky top-0 z-20 border-b border-slate-100 shadow-sm px-4 py-3 flex items-center justify-between gap-4">
         <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-800 leading-tight truncate">{name}</h1>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Голосование</p>
         </div>

         {/* Desktop Tabs (Centered) */}
         <div className="hidden sm:flex bg-slate-100 p-1 rounded-xl items-center shrink-0">
             <button 
               onClick={() => setActiveTab('calendar')}
               className={`px-6 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'calendar' ? 'bg-white text-slate-800 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-700'}`}
             >
               Календарь
             </button>
             <button 
               onClick={() => setActiveTab('results')}
               className={`px-6 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'results' ? 'bg-white text-slate-800 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-700'}`}
             >
               Итоги
             </button>
         </div>

         <div className="flex-1 flex justify-end">
            <button onClick={copyLink} className="p-2 px-3 text-indigo-600 bg-indigo-50 rounded-full hover:bg-indigo-100 transition-colors flex items-center gap-2 group">
                <span className="hidden sm:inline text-sm font-semibold group-hover:text-indigo-700">Пригласить</span>
                <Share2 size={20} className="group-hover:scale-110 transition-transform" />
            </button>
         </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto p-4 sm:p-6 mt-4 sm:mt-8">
        {activeTab === 'calendar' ? (
           <div className="animate-in fade-in zoom-in-95 duration-300">
             <Calendar 
               eventData={eventData} 
               userId={userId || ''} 
               onToggleDate={handleDateToggle} 
             />
           </div>
        ) : (
           <div className="animate-in fade-in zoom-in-95 duration-300">
              <Results eventData={eventData} />
           </div>
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-around items-center z-30 sm:hidden pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'calendar' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
        >
           <CalIcon size={24} strokeWidth={activeTab === 'calendar' ? 2.5 : 2} />
           <span className="text-[10px] font-bold">Календарь</span>
        </button>
        <button 
           onClick={() => setActiveTab('results')}
           className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'results' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
        >
           <BarChart2 size={24} strokeWidth={activeTab === 'results' ? 2.5 : 2} />
           <span className="text-[10px] font-bold">Итоги</span>
        </button>
      </div>

      {/* Name Modal */}
      {showNameModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95 duration-300 scale-100">
             <div className="text-center mb-6">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <User size={28} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Кто вы?</h2>
                <p className="text-slate-500 text-sm mt-2">Представьтесь, чтобы друзья знали ваш выбор.</p>
             </div>
             <form onSubmit={handleNameSubmit}>
                <div className="space-y-4">
                  <input
                    ref={nameInputRef}
                    autoFocus
                    type="text"
                    placeholder="Ваше имя"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full p-4 text-center text-lg bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400 font-medium"
                  />
                  <button 
                    type="submit" 
                    disabled={!userName.trim()}
                    className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none"
                  >
                      Войти
                  </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventPage;