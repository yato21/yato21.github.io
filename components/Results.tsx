import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { EventData, Participant } from '../types';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Calendar as CalendarIcon, BarChart2 } from 'lucide-react';

interface ResultsProps {
  eventData: EventData;
}

// --- HELPER: COLLAPSIBLE SECTION (Used for Chart only) ---
const Section: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300 mb-4">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors"
      >
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        {isOpen ? <ChevronUp className="text-slate-400" size={20} /> : <ChevronDown className="text-slate-400" size={20} />}
      </button>
      
      {isOpen && (
        <div className="p-4 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
};

// --- MINI CALENDAR COMPONENT ---
const MiniCalendar: React.FC<{ dates: string[], baseMonth: number, baseYear: number }> = ({ dates, baseMonth, baseYear }) => {
  const [viewMonth, setViewMonth] = useState(baseMonth);
  const [viewYear, setViewYear] = useState(baseYear);

  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayObj = new Date(viewYear, viewMonth, 1);
  let firstDayOfWeek = firstDayObj.getDay(); 
  if (firstDayOfWeek === 0) firstDayOfWeek = 7;
  firstDayOfWeek -= 1; 

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfWeek }, (_, i) => i);
  
  const monthName = new Date(viewYear, viewMonth).toLocaleString('ru-RU', { month: 'long' });
  const formattedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  return (
    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mt-2 select-none cursor-default" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-2">
         <button onClick={prevMonth} className="p-1 hover:bg-white rounded text-slate-500 transition-colors"><ChevronLeft size={16}/></button>
         <span className="text-xs font-bold text-slate-700 capitalize">{formattedMonthName} {viewYear}</span>
         <button onClick={nextMonth} className="p-1 hover:bg-white rounded text-slate-500 transition-colors"><ChevronRight size={16}/></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {['П', 'В', 'С', 'Ч', 'П', 'С', 'В'].map(d => <span key={d} className="text-[10px] text-slate-400 font-medium">{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {emptyDays.map((d, i) => <div key={`e-${i}`} />)}
        {daysArray.map(day => {
          const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isSelected = dates.includes(dateKey);
          return (
            <div 
              key={dateKey} 
              className={`h-6 w-full flex items-center justify-center rounded text-xs font-medium transition-all
                ${isSelected ? 'bg-indigo-500 text-white shadow-sm scale-105' : 'text-slate-300'}`}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- PARTICIPANT ROW COMPONENT ---
const ParticipantRow: React.FC<{ participant: Participant, eventData: EventData }> = ({ participant, eventData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dateCount = participant.dates ? participant.dates.length : 0;

  return (
    <div className="bg-white border border-slate-100 rounded-lg overflow-hidden transition-all duration-200 hover:border-indigo-100 hover:shadow-sm">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${isOpen ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            {(participant.name || '?').charAt(0).toUpperCase()}
          </div>
          <span className="font-medium text-slate-700">{participant.name || 'Неизвестный'}</span>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-2.5 py-1 bg-white border border-slate-200 rounded-full text-slate-500 flex items-center gap-1 shadow-sm">
            <CalendarIcon size={12} className="text-indigo-400" />
            {dateCount}
          </span>
          {isOpen ? <ChevronUp className="text-slate-400" size={16} /> : <ChevronDown className="text-slate-400" size={16} />}
        </div>
      </div>

      {isOpen && (
        <div className="p-3 bg-white border-t border-slate-100 animate-in slide-in-from-top-1 duration-200">
          <MiniCalendar 
            dates={participant.dates || []} 
            baseMonth={eventData.month} 
            baseYear={eventData.year} 
          />
        </div>
      )}
    </div>
  );
};

// --- CUSTOM TOOLTIP FOR CHART ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const absentNames = data.absentNames || [];

    return (
      <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-xl text-sm z-50 max-w-[200px]">
        <p className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-1">{label}</p>
        
        <p className="text-indigo-600 font-semibold mb-1">Голосов: {data.count}</p>
        
        <div className="mt-2">
           <div className="flex items-center justify-between mb-1">
             <p className="text-red-500 font-semibold text-xs uppercase tracking-wide">Не могут:</p>
             <span className="text-[10px] bg-red-50 text-red-500 px-1.5 rounded-full font-bold">{absentNames.length}</span>
           </div>
           
           {absentNames.length === 0 ? (
             <p className="text-green-600 font-medium text-xs">Все могут! 🎉</p>
           ) : (
             <ul className="text-slate-600 text-xs space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
               {absentNames.map((name: string, idx: number) => (
                  <li key={idx} className="truncate flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-red-300 rounded-full shrink-0"></span>
                    {name}
                  </li>
               ))}
             </ul>
           )}
        </div>
      </div>
    );
  }
  return null;
};

// --- MAIN COMPONENT ---
const Results: React.FC<ResultsProps> = ({ eventData }) => {
  const participants = eventData.participants || {};
  const participantList = Object.values(participants) as Participant[];
  const allParticipantNames = participantList.map(p => p.name || 'Аноним');

  // Chart Data Preparation
  const dateStats: Record<string, { count: number, names: string[] }> = {};
  
  participantList.forEach(p => {
    if (p.dates) {
      p.dates.forEach(date => {
        if (!dateStats[date]) {
          dateStats[date] = { count: 0, names: [] };
        }
        dateStats[date].count += 1;
        dateStats[date].names.push(p.name || 'Аноним');
      });
    }
  });

  const chartData = Object.entries(dateStats)
    .map(([date, stats]) => {
      const presentSet = new Set(stats.names);
      const absentNames = allParticipantNames.filter(name => !presentSet.has(name));

      return {
        date: new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
        originalDate: date,
        count: stats.count,
        names: stats.names,
        absentNames: absentNames
      };
    })
    .sort((a, b) => b.count - a.count || new Date(a.originalDate).getTime() - new Date(b.originalDate).getTime())
    .slice(0, 10);

  const maxVotes = Math.max(...chartData.map(d => d.count), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* Chart Section - Still Collapsible */}
      <Section title="Лучшие даты">
        {chartData.length > 0 ? (
          <div className="w-full select-none">
            <div className="h-80 w-full mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 10, top: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="date" 
                    type="category" 
                    width={60} 
                    tick={{fontSize: 12, fill: '#64748b', fontWeight: 500}} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: '#f1f5f9', radius: 6}} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={28}>
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.count === maxVotes ? '#6366f1' : '#a5b4fc'} 
                        className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-xs text-slate-400 bg-slate-50 py-2 rounded-lg mx-auto max-w-xs">
              💡 Наведите на полоску графика, чтобы увидеть детали
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
             <BarChart2 size={48} className="text-slate-200 mb-3" />
             <p>Голосов пока нет</p>
          </div>
        )}
      </Section>

      {/* Participants List - ALWAYS OPEN (NOT WRAPPED IN SECTION) */}
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-lg font-bold text-slate-800">
            Участники <span className="ml-1 text-slate-400 font-medium text-base">({participantList.length})</span>
          </h3>
        </div>
        
        <div className="space-y-3">
          {participantList.map((p, idx) => (
            <ParticipantRow key={idx} participant={p} eventData={eventData} />
          ))}
          
          {participantList.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
               <p className="text-slate-400 font-medium">Пока никто не присоединился.</p>
               <p className="text-slate-300 text-sm mt-1">Отправьте ссылку друзьям!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Results;