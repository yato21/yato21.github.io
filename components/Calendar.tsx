import React, { useMemo, useState, useEffect } from 'react';
import { Check, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
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

  // Parse event range
  // Fallback to current date if data is missing (old events compatibility)
  const eventStart = eventData.startDate 
    ? new Date(eventData.startDate) 
    : new Date(eventData.year || new Date().getFullYear(), eventData.month || 0, 1);
    
  const eventEnd = eventData.endDate 
    ? new Date(eventData.endDate) 
    : new Date(eventData.year || new Date().getFullYear(), (eventData.month || 0) + 1, 0);

  // Normalize times to midnight
  eventStart.setHours(0,0,0,0);
  eventEnd.setHours(0,0,0,0);

  // Initialize view to the start date of the event
  const [viewMonth, setViewMonth] = useState(eventStart.getMonth());
  const [viewYear, setViewYear] = useState(eventStart.getFullYear());

  // Current system date for comparison
  const todayObj = new Date();
  todayObj.setHours(0, 0, 0, 0);

  // Navigation handlers
  const prevMonth = () => {
    let newMonth = viewMonth - 1;
    let newYear = viewYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }
    setViewMonth(newMonth);
    setViewYear(newYear);
  };

  const nextMonth = () => {
    let newMonth = viewMonth + 1;
    let newYear = viewYear;
    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    setViewMonth(newMonth);
    setViewYear(newYear);
  };

  // Logic to disable navigation if outside of event range
  const isPrevDisabled = () => {
    const prevDate = new Date(viewYear, viewMonth - 1, 1);
    // If the end of the previous month is before the start of the event
    const prevMonthEnd = new Date(viewYear, viewMonth, 0);
    return prevMonthEnd < eventStart;
  };

  const isNextDisabled = () => {
    const nextDate = new Date(viewYear, viewMonth + 1, 1);
    // If the start of the next month is after the end of the event
    return nextDate > eventEnd;
  };

  // Helper to format date key
  const getDateKey = (day: number) => {
    return `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  
  // Calculate first day (Monday start)
  const firstDayObj = new Date(viewYear, viewMonth, 1);
  let firstDayOfWeek = firstDayObj.getDay(); 
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

  // Style Generator
  const getDayStyle = (dateKey: string, isSelected: boolean, isDisabled: boolean, isToday: boolean) => {
    const count = voteCounts[dateKey] || 0;
    
    let className = "relative h-14 sm:h-20 w-full border rounded-lg flex flex-col items-center justify-center transition-all duration-200 ";

    if (isDisabled) {
      className += "bg-slate-100 border-slate-100 opacity-40 cursor-not-allowed text-slate-400 ";
      return className; 
    } else {
      className += "cursor-pointer active:scale-95 border-slate-200 ";
    }

    if (isSelected) {
      className += "ring-2 ring-primary ring-offset-1 ";
    } else if (isToday) {
      className += "border-indigo-400 border-2 bg-indigo-50/30 ";
    }

    // Heatmap logic
    if (count === 0) {
      if (!isSelected && !isToday) className += "bg-white hover:bg-slate-50";
      if (isSelected) className += "bg-white";
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
  
  const monthName = new Date(viewYear, viewMonth).toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
  const formattedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  return (
    <div className="w-full select-none">
      
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
        <button 
          onClick={prevMonth} 
          disabled={isPrevDisabled()}
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 disabled:opacity-20 disabled:cursor-not-allowed"
        >
            <ChevronLeft size={24} />
        </button>
        <h2 className="text-lg font-bold text-slate-800">{formattedMonthName}</h2>
        <button 
          onClick={nextMonth} 
          disabled={isNextDisabled()}
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 disabled:opacity-20 disabled:cursor-not-allowed"
        >
            <ChevronRight size={24} />
        </button>
      </div>

      {/* Week Headers */}
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

          // Date Logic
          const cellDate = new Date(viewYear, viewMonth, day);
          cellDate.setHours(0, 0, 0, 0);
          
          const isPast = cellDate.getTime() < todayObj.getTime();
          const isOutsideRange = cellDate.getTime() < eventStart.getTime() || cellDate.getTime() > eventEnd.getTime();
          const isDisabled = isPast || isOutsideRange;
          const isToday = cellDate.getTime() === todayObj.getTime();

          return (
            <div 
              key={dateKey}
              onClick={() => {
                if (!isDisabled) onToggleDate(dateKey);
              }}
              className={getDayStyle(dateKey, isSelected, isDisabled, isToday)}
            >
              <div className="flex flex-col items-center relative z-10">
                <span className={`text-sm sm:text-lg font-bold ${count > maxVotes * 0.5 && !isDisabled ? 'text-white' : ''}`}>
                  {day}
                </span>
                {isToday && !isDisabled && (
                  <span className={`text-[9px] font-bold leading-none mt-0.5 ${count > maxVotes * 0.5 ? 'text-indigo-100' : 'text-indigo-500'}`}>
                    Сегодня
                  </span>
                )}
                {isDisabled && (
                   <div className="hidden sm:block mt-1">
                      {isOutsideRange && !isPast && <div className="w-1 h-1 bg-slate-300 rounded-full"></div>}
                   </div>
                )}
              </div>
              
              {/* Indicators */}
              <div className="absolute bottom-1 right-1 flex space-x-0.5 z-10">
                 {isSelected && (
                    <div className="bg-green-500 rounded-full p-0.5 shadow-sm">
                        <Check size={10} className="text-white" strokeWidth={4} />
                    </div>
                 )}
                 {count > 0 && !isSelected && !isDisabled && (
                     <span className={`text-[10px] font-medium px-1 rounded-full ${count > maxVotes * 0.5 ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        {count}
                     </span>
                 )}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1"><div className="w-3 h-3 border-2 border-indigo-400 bg-indigo-50/30 rounded"></div> Сегодня</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-white border border-slate-300 rounded"></div> Свободно</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-indigo-700 rounded"></div> Популярно</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-slate-100 border border-slate-200 rounded opacity-60"></div> Недоступно</div>
      </div>
    </div>
  );
};

export default Calendar;