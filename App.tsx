
import React, { useState, useEffect } from 'react';
import { Plus, LayoutDashboard, BarChart2, Settings, Globe, Sun, Moon, Palette } from 'lucide-react';
import { Habit, AIHabitPlan, HabitLog } from './types';
import { HabitCard } from './components/HabitCard';
import { CreationWizard } from './components/CreationWizard';
import { Analytics } from './components/Analytics';
import { HabitDetail } from './components/HabitDetail';
import { getHabitCoaching } from './services/geminiService';
import { useLanguage } from './contexts/LanguageContext';
import { useTheme, ColorTheme } from './contexts/ThemeContext';

const STORAGE_KEY = 'habit-inception-data';

// Helper to assign random gradients/colors
const getRandomColor = () => {
  const colors = [
    'bg-rose-500', 'bg-orange-500', 'bg-amber-500', 
    'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 
    'bg-indigo-500', 'bg-violet-500', 'bg-fuchsia-500'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const App: React.FC = () => {
  const { language, setLanguage, t, dir } = useLanguage();
  const { mode, setMode, colorTheme, setColorTheme } = useTheme();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'settings'>('dashboard');
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setHabits(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load habits", e);
      }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  }, [habits]);

  const handleAddHabit = (plan: AIHabitPlan) => {
    const newHabit: Habit = {
      id: crypto.randomUUID(),
      title: plan.title,
      description: plan.microStep, 
      category: plan.category,
      startDate: new Date().toISOString(),
      targetFrequency: plan.frequency,
      streak: 0,
      logs: [],
      color: getRandomColor(),
    };
    setHabits(prev => [newHabit, ...prev]);
  };

  const updateHabitLogs = (habit: Habit, date: string) => {
      const existingLogIndex = habit.logs.findIndex(l => l.date === date);
      let newLogs = [...habit.logs];
      
      if (existingLogIndex >= 0) {
        // Toggle existing
        newLogs[existingLogIndex] = {
          ...newLogs[existingLogIndex],
          completed: !newLogs[existingLogIndex].completed
        };
      } else {
        // Add new
        newLogs.push({ date: date, completed: true });
      }

      // Recalculate streak
      let streak = 0;
      const sortedLogs = [...newLogs]
        .filter(l => l.completed)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
      if (sortedLogs.length > 0) {
          // Use local time logic for consistency
          const now = new Date();
          const todayStr = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
          const todayDate = new Date(todayStr);
          const lastLogDate = new Date(sortedLogs[0].date);
          
          const diffTime = Math.abs(todayDate.getTime() - lastLogDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

          if (diffDays <= 1) {
             streak = 1;
             for(let i = 0; i < sortedLogs.length - 1; i++) {
                const curr = new Date(sortedLogs[i].date);
                const next = new Date(sortedLogs[i+1].date);
                const dayDiff = Math.ceil((curr.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));
                if (dayDiff === 1) streak++;
                else break;
             }
          }
      }

      return { ...habit, logs: newLogs, streak };
  };

  const handleToggleToday = (id: string) => {
    const now = new Date();
    const today = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    
    setHabits(prev => prev.map(h => {
      if (h.id !== id) return h;
      return updateHabitLogs(h, today);
    }));
  };

  const handleToggleDate = (id: string, date: string) => {
    setHabits(prev => prev.map(h => {
      if (h.id !== id) return h;
      return updateHabitLogs(h, date);
    }));
  };

  const handleGetInsight = async (id: string) => {
    const habit = habits.find(h => h.id === id);
    if (!habit) return;

    setAnalyzingId(id);
    try {
      const insight = await getHabitCoaching(habit, language);
      setHabits(prev => prev.map(h => {
        if (h.id === id) {
          return {
            ...h,
            aiMotivation: `${insight.message} ${t('tip')}: ${insight.actionableTip}`
          };
        }
        return h;
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzingId(null);
    }
  };

  const themeColors: {id: ColorTheme, bg: string}[] = [
    { id: 'indigo', bg: 'bg-indigo-500' },
    { id: 'rose', bg: 'bg-rose-500' },
    { id: 'emerald', bg: 'bg-emerald-500' },
    { id: 'amber', bg: 'bg-amber-500' },
    { id: 'violet', bg: 'bg-violet-500' },
    { id: 'sky', bg: 'bg-sky-500' },
  ];

  const selectedHabit = habits.find(h => h.id === selectedHabitId);

  return (
    <div 
      className={`min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 pb-20 md:pb-0 transition-all duration-300 ${language === 'fa' ? 'font-persian' : 'font-sans'}`} 
      dir={dir}
    >
      
      {/* Mobile Nav */}
      {!selectedHabitId && (
        <nav className="md:hidden fixed bottom-0 start-0 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur border-t border-slate-200 dark:border-slate-800 p-4 flex justify-around z-40">
          <button onClick={() => setActiveTab('dashboard')} className={`${activeTab === 'dashboard' ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500'}`}>
            <LayoutDashboard size={24} />
          </button>
          <button onClick={() => setActiveTab('analytics')} className={`${activeTab === 'analytics' ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500'}`}>
            <BarChart2 size={24} />
          </button>
          <button onClick={() => setActiveTab('settings')} className={`${activeTab === 'settings' ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500'}`}>
            <Settings size={24} />
          </button>
          <button onClick={() => setShowWizard(true)} className="bg-primary-600 text-white p-3 rounded-full -mt-8 shadow-lg shadow-primary-500/40 border-4 border-slate-50 dark:border-slate-900">
            <Plus size={24} />
          </button>
        </nav>
      )}

      {/* Desktop Sidebar */}
      <nav className="hidden md:flex fixed top-0 start-0 h-full w-20 flex-col items-center py-8 bg-white dark:bg-slate-900 border-e border-slate-200 dark:border-slate-800 z-40 transition-colors duration-300">
        <button 
           onClick={() => { setActiveTab('settings'); setSelectedHabitId(null); }}
           className={`mb-10 p-2 rounded-lg transition-all ${activeTab === 'settings' && !selectedHabitId ? 'bg-primary-600 shadow-lg shadow-primary-500/30 text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'}`}
           title={t('settings')}
        >
           <Settings size={24} />
        </button>
        
        <div className="flex flex-col space-y-8 flex-1">
          <button 
            onClick={() => { setActiveTab('dashboard'); setSelectedHabitId(null); }}
            className={`p-3 rounded-xl transition-all ${activeTab === 'dashboard' && !selectedHabitId ? 'bg-primary-500/10 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            title={t('dashboard')}
          >
            <LayoutDashboard size={24} />
          </button>
          <button 
             onClick={() => { setActiveTab('analytics'); setSelectedHabitId(null); }}
             className={`p-3 rounded-xl transition-all ${activeTab === 'analytics' && !selectedHabitId ? 'bg-primary-500/10 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
             title={t('analytics')}
          >
            <BarChart2 size={24} />
          </button>
        </div>

        <button 
          onClick={() => setShowWizard(true)} 
          className="mt-auto mb-4 p-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl shadow-lg shadow-primary-500/20 transition-all transform hover:scale-110"
          title={t('newHabit')}
        >
          <Plus size={24} />
        </button>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-6 md:p-12 md:ps-32">
        {!selectedHabitId && (
          <header className="mb-10 flex justify-between items-end">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-600 to-cyan-600 dark:from-primary-400 dark:to-cyan-400 bg-clip-text text-transparent">
                {t('appTitle')}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2">{t('appSubtitle')}</p>
            </div>
            <div className="hidden md:block">
              <span className="text-sm text-slate-400 dark:text-slate-500 font-mono">
                {language === 'fa' 
                  ? new Date().toLocaleDateString('fa-IR') 
                  : new Date().toDateString()}
              </span>
            </div>
          </header>
        )}

        {selectedHabitId && selectedHabit ? (
          <HabitDetail 
            habit={selectedHabit} 
            onBack={() => setSelectedHabitId(null)}
            onToggleDate={handleToggleDate}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {habits.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl">
                    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4 text-slate-400 dark:text-slate-500">
                      <Plus size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-600 dark:text-slate-300 mb-2">{t('noHabitsTitle')}</h3>
                    <p className="text-slate-500 dark:text-slate-500 max-w-md mx-auto mb-6">{t('noHabitsDesc')}</p>
                    <button 
                      onClick={() => setShowWizard(true)}
                      className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-500 transition-colors"
                    >
                      {t('createFirst')}
                    </button>
                  </div>
                ) : (
                  habits.map(habit => (
                    <HabitCard 
                      key={habit.id} 
                      habit={habit} 
                      onToggleToday={handleToggleToday} 
                      onGetInsight={handleGetInsight}
                      loadingInsight={analyzingId === habit.id}
                      onClick={(h) => setSelectedHabitId(h.id)}
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <Analytics habits={habits} />
                
                {/* Simple Log Table for detailed view */}
                <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-6 mt-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{t('historyLog')}</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-start text-slate-500 dark:text-slate-400">
                      <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800">
                        <tr>
                          <th className="px-6 py-3 text-start">{t('habit')}</th>
                          <th className="px-6 py-3 text-start">{t('totalDays')}</th>
                          <th className="px-6 py-3 text-start">{t('currentStreak')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {habits.map(h => (
                          <tr key={h.id} className="border-b border-slate-100 dark:border-slate-700">
                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{h.title}</td>
                            <td className="px-6 py-4">{h.logs.filter(l => l.completed).length}</td>
                            <td className="px-6 py-4 text-orange-500 dark:text-orange-400">{h.streak} 🔥</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-8 shadow-sm animate-fade-in">
                 <div className="flex items-center space-x-3 rtl:space-x-reverse mb-8 pb-4 border-b border-slate-200 dark:border-slate-700">
                    <Settings className="text-primary-600 dark:text-primary-400" size={28} />
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('settings')}</h2>
                 </div>

                 <div className="space-y-8">
                    {/* Language Section */}
                    <div className="space-y-4">
                       <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                         {t('language')}
                       </label>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <button 
                            onClick={() => setLanguage('en')}
                            className={`flex items-center p-4 rounded-xl border-2 transition-all ${
                              language === 'en' 
                              ? 'border-primary-500 bg-primary-500/10 text-primary-700 dark:text-white' 
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                          >
                            <div className="p-2 bg-primary-100 dark:bg-primary-500/20 rounded-lg me-3">
                               <span className="text-lg">🇺🇸</span>
                            </div>
                            <span className="font-medium">{t('english')}</span>
                            {language === 'en' && <div className="ms-auto w-3 h-3 bg-primary-500 rounded-full shadow-[0_0_8px_rgba(var(--color-primary-500),0.6)]" />}
                          </button>

                          <button 
                            onClick={() => setLanguage('fa')}
                            className={`flex items-center p-4 rounded-xl border-2 transition-all ${
                              language === 'fa' 
                              ? 'border-primary-500 bg-primary-500/10 text-primary-700 dark:text-white' 
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                          >
                            <div className="p-2 bg-primary-100 dark:bg-primary-500/20 rounded-lg me-3">
                               <span className="text-lg">🇮🇷</span>
                            </div>
                            <span className="font-medium">{t('persian')}</span>
                            {language === 'fa' && <div className="ms-auto w-3 h-3 bg-primary-500 rounded-full shadow-[0_0_8px_rgba(var(--color-primary-500),0.6)]" />}
                          </button>
                       </div>
                    </div>

                    {/* Appearance Section */}
                    <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                       <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                         {t('appearance')}
                       </label>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <button 
                            onClick={() => setMode('light')}
                            className={`flex items-center p-4 rounded-xl border-2 transition-all ${
                              mode === 'light' 
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-white' 
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                          >
                            <div className="p-2 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg me-3">
                               <Sun size={20} />
                            </div>
                            <span className="font-medium">{t('light')}</span>
                            {mode === 'light' && <div className="ms-auto w-3 h-3 bg-primary-500 rounded-full shadow-[0_0_8px_rgba(var(--color-primary-500),0.6)]" />}
                          </button>

                          <button 
                            onClick={() => setMode('dark')}
                            className={`flex items-center p-4 rounded-xl border-2 transition-all ${
                              mode === 'dark' 
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-white' 
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                          >
                            <div className="p-2 bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 rounded-lg me-3">
                               <Moon size={20} />
                            </div>
                            <span className="font-medium">{t('dark')}</span>
                            {mode === 'dark' && <div className="ms-auto w-3 h-3 bg-primary-500 rounded-full shadow-[0_0_8px_rgba(var(--color-primary-500),0.6)]" />}
                          </button>
                       </div>
                    </div>

                    {/* Color Theme Section */}
                    <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                       <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                         {t('colorTheme')}
                       </label>
                       <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                          {themeColors.map((theme) => (
                            <button 
                              key={theme.id}
                              onClick={() => setColorTheme(theme.id)}
                              className={`flex flex-col items-center p-2 rounded-xl border-2 transition-all ${
                                colorTheme === theme.id
                                ? 'border-slate-400 dark:border-white bg-slate-100 dark:bg-slate-700' 
                                : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-full ${theme.bg} mb-2 shadow-md`}></div>
                              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{t(theme.id)}</span>
                            </button>
                          ))}
                       </div>
                    </div>

                 </div>
              </div>
            )}
          </>
        )}
      </main>

      {showWizard && (
        <CreationWizard 
          onClose={() => setShowWizard(false)} 
          onSave={handleAddHabit} 
        />
      )}
    </div>
  );
};

export default App;
