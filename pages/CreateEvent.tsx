import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, User, ArrowRight, Loader2, CalendarRange } from 'lucide-react';
import { createEvent, generateId } from '../services/firebase';

const CreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const [eventName, setEventName] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Refs for programmatic access to inputs
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);
  
  // Date Range State
  // Default: Today and Today + 7 days
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);

  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(formatDate(today));
  const [endDate, setEndDate] = useState(formatDate(nextWeek));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim() || !userName.trim()) return;
    
    // Validation
    if (startDate > endDate) {
        alert("Дата начала не может быть позже даты окончания!");
        return;
    }

    setLoading(true);
    try {
      // 1. Generate Local ID for creator
      const userId = generateId();
      localStorage.setItem('df_uid', userId);
      localStorage.setItem('df_name', userName);

      // 2. Create in Firebase
      const eventId = await createEvent(eventName, startDate, endDate, userName, userId);

      // 3. Redirect
      navigate(`/event/${eventId}`);
    } catch (error) {
      console.error("Creation failed", error);
      alert("Не удалось создать событие. Проверьте консоль.");
    } finally {
      setLoading(false);
    }
  };

  const openDatePicker = (ref: React.RefObject<HTMLInputElement>) => {
    const element = ref.current;
    if (element) {
        try {
            // Modern browsers support showing the picker programmatically
            // Use type casting and typeof check to avoid TS narrowing issues (e.g. dead code detection)
            if (typeof (element as any).showPicker === 'function') {
                (element as any).showPicker();
            } else {
                element.focus();
            }
        } catch (error) {
            console.log(error);
            element.focus();
        }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-primary p-8 text-center">
            <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">DateFinder</h1>
            <p className="text-indigo-100 font-medium">Планируйте встречи с друзьями легко</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          {/* Event Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Название встречи</label>
            <div className="relative group">
                <Calendar className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none" size={20} />
                <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="Например: Шашлыки"
                    className="w-full pl-10 pr-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                    required
                />
            </div>
          </div>

          {/* Date Range Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Начало</label>
                <div 
                    className="relative group cursor-pointer"
                    onClick={() => openDatePicker(startDateRef)}
                >
                  <CalendarRange className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none" size={18} />
                  <input 
                      ref={startDateRef}
                      type="date"
                      value={startDate}
                      min={formatDate(new Date())}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full pl-9 pr-2 py-3 bg-white text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm cursor-pointer"
                      required
                  />
                </div>
            </div>
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Конец</label>
                <div 
                    className="relative group cursor-pointer"
                    onClick={() => openDatePicker(endDateRef)}
                >
                  <CalendarRange className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none" size={18} />
                  <input
                      ref={endDateRef}
                      type="date"
                      value={endDate}
                      min={startDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full pl-9 pr-2 py-3 bg-white text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm cursor-pointer"
                      required
                  />
                </div>
            </div>
          </div>

          {/* Creator Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Ваше имя</label>
            <div className="relative group">
                <User className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none" size={20} />
                <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Иван Иванов"
                    className="w-full pl-10 pr-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                    required
                />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 mt-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Создать встречу <ArrowRight size={20} /></>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateEvent;