import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, User, ArrowRight, Loader2 } from 'lucide-react';
import { createEvent, generateId } from '../services/firebase';

const CreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const [eventName, setEventName] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Defaults to current month
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim() || !userName.trim()) return;

    setLoading(true);
    try {
      // 1. Generate Local ID for creator
      const userId = generateId();
      localStorage.setItem('df_uid', userId);
      localStorage.setItem('df_name', userName);

      // 2. Create in Firebase
      const eventId = await createEvent(eventName, month, year, userName, userId);

      // 3. Redirect
      navigate(`/event/${eventId}`);
    } catch (error) {
      console.error("Creation failed", error);
      alert("Не удалось создать событие. Проверьте консоль.");
    } finally {
      setLoading(false);
    }
  };

  const months = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", 
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
  ];

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
                <Calendar className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
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

          {/* Month/Year Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Месяц начала</label>
                <div className="relative">
                  <select 
                      value={month}
                      onChange={(e) => setMonth(Number(e.target.value))}
                      className="w-full px-3 py-3 bg-white text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                  >
                      {months.map((m, i) => (
                          <option key={i} value={i}>{m}</option>
                      ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
            </div>
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Год</label>
                <div className="relative">
                  <select
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                      className="w-full px-3 py-3 bg-white text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                  >
                      <option value={today.getFullYear()}>{today.getFullYear()}</option>
                      <option value={today.getFullYear() + 1}>{today.getFullYear() + 1}</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
            </div>
          </div>

          {/* Creator Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Ваше имя</label>
            <div className="relative group">
                <User className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
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