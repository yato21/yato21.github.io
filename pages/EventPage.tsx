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
      <header className="bg-white sticky top-0 z-20 border-b border-slate-100 shadow-sm px-4 py-3 flex items-center justify-between">
         <div>
            <h1 className="text-xl font-bold text-slate-800 leading-tight">{name}</h1>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Голосование</p>
         </div>
         <button onClick={copyLink} className="p-2 text-indigo-600 bg-indigo-50 rounded-full hover:bg-indigo-100 transition-colors">
            <Share2 size={20} />
         </button>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto p-4 sm:p-6">
        {activeTab === 'calendar' ? (
           <Calendar 
             eventData={eventData} 
             userId={userId || ''} 
             onToggleDate={handleDateToggle} 
           />
        ) : (
           <Results eventData={eventData} />
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-around items-center z-30 sm:hidden pb-safe">
        <button 
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'calendar' ? 'text-primary' : 'text-slate-400'}`}
        >
           <CalIcon size={24} />
           <span className="text-[10px] font-bold">Календарь</span>
        </button>
        <button 
           onClick={() => setActiveTab('results')}
           className={`flex flex-col items-center gap-1 ${activeTab === 'results' ? 'text-primary' : 'text-slate-400'}`}
        >
           <BarChart2 size={24} />
           <span className="text-[10px] font-bold">Итоги</span>
        </button>
      </div>

      {/* Desktop Tabs (Top Right Floating) */}
      <div className="hidden sm:flex fixed top-4 right-4 z-50 bg-white rounded-full p-1 shadow-md border border-slate-100 gap-1">
         <button 
           onClick={() => setActiveTab('calendar')}
           className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'calendar' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
         >
           Календарь
         </button>
         <button 
           onClick={() => setActiveTab('results')}
           className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'results' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
         >
           Итоги
         </button>
      </div>

      {/* Name Modal */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
             <div className="text-center mb-6">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <User size={24} />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Представьтесь</h2>
                <p className="text-slate-500 text-sm mt-1">Введите имя, чтобы проголосовать.</p>
             </div>
             <form onSubmit={handleNameSubmit}>
                <input
                  ref={nameInputRef}
                  autoFocus
                  type="text"
                  placeholder="Ваше имя"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full p-4 text-center text-lg border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0 outline-none transition-colors mb-4"
                />
                <button 
                  type="submit" 
                  disabled={!userName.trim()}
                  className="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-600 transition-all disabled:opacity-50"
                >
                    Присоединиться
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventPage;