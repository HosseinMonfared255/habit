
import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Habit } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from './Button';
import { toGregorian, toJalaali, jalaaliMonthLength, jalaliToIso } from '../utils/jalali';
import { translations } from '../locales';

interface HabitDetailProps {
  habit: Habit;
  onBack: () => void;
  onToggleDate: (habitId: string, date: string) => void;
}

export const HabitDetail: React.FC<HabitDetailProps> = ({ habit, onBack, onToggleDate }) => {
  const { t, language, dir } = useLanguage();
  const { colorTheme } = useTheme();

  // Initialize with current Jalali date
  const [currentMonth, setCurrentMonth] = useState(1);
  const [currentYear, setCurrentYear] = useState(1403);

  useEffect(() => {
    const now = new Date();
    const jNow = toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
    setCurrentMonth(jNow.jm);
    setCurrentYear(jNow.jy);
  }, []);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Calculate calendar days
  const daysInMonth = jalaaliMonthLength(currentYear, currentMonth);

  // Find start day of the week (0 = Saturday, 6 = Friday for Persian context)
  // We need to convert the 1st of the Jalali month to Gregorian to get the day of week
  const firstDayGregorian = toGregorian(currentYear, currentMonth, 1);
  const firstDayDate = new Date(firstDayGregorian.gy, firstDayGregorian.gm - 1, firstDayGregorian.gd);

  // JS getDay(): 0=Sun, 1=Mon, ..., 6=Sat
  // We want: 0=Sat, 1=Sun, ..., 6=Fri
  // Map: Sat(6)->0, Sun(0)->1, Mon(1)->2 ... Fri(5)->6
  const jsDay = firstDayDate.getDay();
  const startDayOfWeek = (jsDay + 1) % 7;

  const renderCalendarDays = () => {
    const days = [];

    // Empty cells for offset
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square"></div>);
    }

    // Days of the month
    for (let d = 1; d <= daysInMonth; d++) {
      const isoDate = jalaliToIso(currentYear, currentMonth, d);
      const isCompleted = habit.logs.some(log => log.date === isoDate && log.completed);

      // Check if it's today
      const now = new Date();
      const jNow = toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
      const isToday = jNow.jy === currentYear && jNow.jm === currentMonth && jNow.jd === d;

      days.push(
        <button
          key={d}
          onClick={() => onToggleDate(habit.id, isoDate)}
          className={`aspect-square rounded-xl flex items-center justify-center text-lg font-bold transition-all duration-200 relative
            ${isCompleted
              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30 border-2 border-primary-500'
              : 'bg-slate-50 dark:bg-slate-700/30 text-slate-500 dark:text-slate-400 border-2 border-slate-200 dark:border-slate-600 hover:border-primary-300 dark:hover:border-primary-500/50 hover:bg-white dark:hover:bg-slate-700'
            }
            ${isToday ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-800 ring-primary-500 z-10' : ''}
          `}
        >
          {d}
        </button>
      );
    }
    return days;
  };

  const monthName = translations[language].months[currentMonth - 1] || currentMonth;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="p-2">
          {dir === 'rtl' ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
          <span className="mx-2">{t('back')}</span>
        </Button>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{habit.title}</h2>
        <div className="w-20"></div> {/* Spacer for alignment */}
      </div>

      {/* Calendar Container */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-6">

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={dir === 'rtl' ? handleNextMonth : handlePrevMonth}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400 transition-colors"
          >
            <ChevronRight size={24} />
          </button>

          <div className="text-xl font-bold text-slate-800 dark:text-white">
            {monthName} <span className="text-primary-600 dark:text-primary-400">{currentYear}</span>
          </div>

          <button
            onClick={dir === 'rtl' ? handlePrevMonth : handleNextMonth}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-2 mb-4 text-center">
          {translations[language].weekDays.map((day, idx) => (
            <div key={idx} className="text-sm font-semibold text-slate-400 dark:text-slate-500">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-2 sm:gap-3">
          {renderCalendarDays()}
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center space-x-6 rtl:space-x-reverse text-sm text-slate-500 dark:text-slate-400">
          <div className="flex items-center">
            <div className="w-5 h-5 rounded-lg bg-primary-500 border-2 border-primary-500 me-2 shadow-sm"></div>
            <span>{t('done')}</span>
          </div>
          <div className="flex items-center">
            <div className="w-5 h-5 rounded-lg bg-slate-50 dark:bg-slate-700/30 border-2 border-slate-200 dark:border-slate-600 me-2"></div>
            <span>-</span>
          </div>
        </div>

      </div>
    </div>
  );
};
