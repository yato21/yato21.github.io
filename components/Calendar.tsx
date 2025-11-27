import React, { useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { EventData, Participant } from '../types';

interface CalendarProps {
  eventData: EventData;
  userId: string;
  onToggleDate: (dateIso: string) => void;
}

const Calendar: React.FC<CalendarProps> = ({ eventData, userId, onToggleDate }) => {
  // Safe access to participants
  const participants = eventData.participants || {};
  const userDates = participants[userId]?.dates || [];

  // State for navigation (independent of event start date)
  const [viewMonth, setViewMonth] = useState(eventData.month);
  const [viewYear, setViewYear] = useState(eventData.year);

  // Navigation handlers
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  // Helper to format date key
  const getDateKey = (day: number) => {
    return `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  
  // Calculate first day (Russia: Mon=0, Sun=6)
  const firstDayObj = new Date(viewYear, viewMonth, 1);
  let firstDayOfWeek = firstDayObj.getDay(); 
  // Convert Sunday (0) to 7, then shift everything by -1 to make Monday 0
  if (firstDayOfWeek === 0) firstDayOfWeek = 7;
  firstDayOfWeek -= 1; 

  // Calculate votes per day for heatmap
  const voteCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(participants).forEach((p: any) => {
      const participant = p as Participant;
      if (participant.dates) {
        participant.dates.forEach(date => {
            counts[date] = (counts[date] || 0) + 1;
        });
      }
    });
    return counts;
  }, [participants]);

  const maxVotes = Math.max(Object.keys(participants).length, 1);

  // Heatmap color generator
  const getDayStyle = (dateKey: string, isSelected: boolean) => {
    const count = voteCounts[dateKey] || 0;
    
    // Base styles
    let className = "relative h-14 sm:h-20 w-full border border-slate-200 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-200 active:scale-95 ";

    if (isSelected) {
      className += "ring-2 ring-primary ring-offset-1 ";
    }

    // Heatmap logic
    if (count === 0) {
      className += isSelected ? "bg-white" : "bg-white hover:bg-slate-50";
    } else {
      const intensity = count / maxVotes;
      if (intensity <= 0.25) className += "bg-indigo-100 text-indigo-900";
      else if (intensity <= 0.5) className += "bg-indigo-300 text-indigo-900";
      else if (intensity <= 0.75) className += "bg-indigo-500 text-white";
      else className += "bg-indigo-700 text-white shadow-md";
    }

    return className;
  };

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfWeek }, (_, i) => i);
  
  // Localized Month Name
  const monthName = new Date(viewYear, viewMonth).toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
  // Capitalize first letter
  const formattedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  return (
    <div className="w-full select-none">
      
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
        <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600">
            <ChevronLeft size={24} />
        </button>
        <h2 className="text-lg font-bold text-slate-800">{formattedMonthName}</h2>
        <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600">
            <ChevronRight size={24} />
        </button>
      </div>

      {/* Week Headers (Monday start) */}
      <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
          <div key={d}>{d}</div>
        ))}
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {emptyDays.map((d) => (
          <div key={`empty-${d}`} className="h-14 sm:h-20" />
        ))}
        
        {daysArray.map((day) => {
          const dateKey = getDateKey(day);
          const isSelected = userDates.includes(dateKey);
          const count = voteCounts[dateKey] || 0;

          return (
            <div 
              key={dateKey}
              onClick={() => onToggleDate(dateKey)}
              className={getDayStyle(dateKey, isSelected)}
            >
              <span className={`text-sm sm:text-lg font-bold ${count > maxVotes * 0.5 ? 'text-white' : 'text-slate-700'}`}>
                {day}
              </span>
              
              {/* Indicators */}
              <div className="absolute bottom-1 right-1 flex space-x-0.5">
                 {isSelected && (
                    <div className="bg-green-500 rounded-full p-0.5 shadow-sm">
                        <Check size={10} className="text-white" strokeWidth={4} />
                    </div>
                 )}
                 {count > 0 && !isSelected && (
                     <span className={`text-[10px] font-medium px-1 rounded-full ${count > maxVotes * 0.5 ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        {count}
                     </span>
                 )}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-white border border-slate-300 rounded"></div> Нет голосов</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-indigo-300 rounded"></div> Мало</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-indigo-700 rounded"></div> Много</div>
      </div>
    </div>
  );
};

export default Calendar;