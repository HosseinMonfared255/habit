
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Habit } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

interface AnalyticsProps {
  habits: Habit[];
}

export const Analytics: React.FC<AnalyticsProps> = ({ habits }) => {
  const { t } = useLanguage();
  const { colorTheme } = useTheme();
  
  // Calculate completion rate per habit
  const data = habits.map(h => {
    const totalDays = h.logs.length || 1;
    const completedDays = h.logs.filter(l => l.completed).length;
    const rate = Math.round((completedDays / totalDays) * 100);
    
    return {
      name: h.title.length > 10 ? h.title.substring(0, 10) + '...' : h.title,
      rate: rate,
      streak: h.streak,
      color: h.color.replace('bg-', '').replace('-500', '') 
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg shadow-xl text-start">
          <p className="text-slate-900 dark:text-white font-bold">{label}</p>
          <p className="text-primary-600 dark:text-primary-400 text-sm">Consistency: {payload[0].value}%</p>
          <p className="text-emerald-600 dark:text-emerald-400 text-sm">{t('streak')}: {payload[0].payload.streak}</p>
        </div>
      );
    }
    return null;
  };

  // Map theme to hex for Recharts (since it can't read Tailwind classes easily without config)
  const getThemeColor = () => {
     const colors: Record<string, string> = {
       indigo: '#6366f1',
       rose: '#f43f5e',
       emerald: '#10b981',
       amber: '#f59e0b',
       violet: '#8b5cf6',
       sky: '#0ea5e9'
     };
     return colors[colorTheme] || '#6366f1';
  };

  if (habits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <p>{t('noHabitsTitle')}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">{t('consistencyMetrics')}</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#94a3b8', fontSize: 12 }} 
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              tick={{ fill: '#94a3b8', fontSize: 12 }} 
              axisLine={false}
              tickLine={false}
              unit="%"
            />
            <Tooltip content={<CustomTooltip />} cursor={{fill: '#334155', opacity: 0.2}} />
            <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getThemeColor()} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
