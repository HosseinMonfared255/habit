
import React from 'react';
import { Habit } from '../types';
import { Check, Flame, BrainCircuit } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../locales';

interface HabitCardProps {
  habit: Habit;
  onToggleToday: (id: string) => void;
  onGetInsight: (id: string) => void;
  onClick: (habit: Habit) => void;
  loadingInsight: boolean;
}

export const HabitCard: React.FC<HabitCardProps> = ({ habit, onToggleToday, onGetInsight, onClick, loadingInsight }) => {
  const { t, language } = useLanguage();
  
  // Use local date for comparison
  const now = new Date();
  const today = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  
  const isCompletedToday = habit.logs.some(log => log.date === today && log.completed);

  // Translate category if available
  const categoryLabel = translations[language].categories[habit.category as keyof typeof translations['en']['categories']] || habit.category;

  return (
    <div 
      onClick={() => onClick(habit)}
      className="relative group overflow-hidden bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-5 transition-all duration-300 hover:border-primary-500/50 hover:shadow-xl hover:shadow-primary-500/10 cursor-pointer"
    >
      <div className="absolute top-0 start-0 w-1 h-full" style={{ backgroundColor: habit.color.replace('bg-', '').replace('-500', '') }}></div>
      <div className={`absolute top-0 start-0 w-1 h-full ${habit.color}`}></div>
      
      <div className="flex justify-between items-start mb-4">
        <div className="ps-3">
          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 mb-2">
            {categoryLabel}
          </span>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{habit.title}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{habit.description}</p>
        </div>
        <div className="flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
           <button
            onClick={() => onToggleToday(habit.id)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
              isCompletedToday 
                ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-105' 
                : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            <Check size={24} strokeWidth={3} />
          </button>
          <span className="text-xs mt-2 text-slate-500 font-medium">
            {isCompletedToday ? t('done') : t('mark')}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50 ps-3">
        <div className="flex items-center space-x-2 space-x-reverse text-orange-500 dark:text-orange-400">
          <Flame size={18} />
          <span className="font-bold text-lg mx-1">{habit.streak}</span>
          <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{t('streak')}</span>
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); onGetInsight(habit.id); }}
          disabled={loadingInsight}
          className="flex items-center space-x-2 rtl:space-x-reverse text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 transition-colors text-sm disabled:opacity-50"
        >
          <BrainCircuit size={16} />
          <span className="mx-1">{loadingInsight ? t('analyzing') : t('coach')}</span>
        </button>
      </div>

      {habit.aiMotivation && (
        <div className="mt-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-500/20 rounded-lg p-3 animate-fade-in ps-3">
          <div className="flex items-start space-x-2 rtl:space-x-reverse">
            <BrainCircuit size={16} className="text-primary-500 dark:text-primary-400 mt-1 flex-shrink-0" />
            <p className="text-sm text-primary-700 dark:text-primary-200 italic mx-2">"{habit.aiMotivation}"</p>
          </div>
        </div>
      )}
    </div>
  );
};
