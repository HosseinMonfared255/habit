
import React, { useState } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, X } from 'lucide-react';
import { Button } from './Button';
import { AIHabitPlan } from '../types';
import { generateHabitBlueprint } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../locales';

interface CreationWizardProps {
  onClose: () => void;
  onSave: (plan: AIHabitPlan) => void;
}

export const CreationWizard: React.FC<CreationWizardProps> = ({ onClose, onSave }) => {
  const { t, language, dir } = useLanguage();
  const [step, setStep] = useState<1 | 2>(1);
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<AIHabitPlan | null>(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!goal.trim()) return;
    setLoading(true);
    setError('');
    try {
      const plan = await generateHabitBlueprint(goal, language);
      setGeneratedPlan(plan);
      setStep(2);
    } catch (err) {
      setError(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (generatedPlan) {
      onSave(generatedPlan);
      onClose();
    }
  };

  // Translate category for display
  const getCategoryLabel = (cat: string) => {
    return translations[language].categories[cat as keyof typeof translations['en']['categories']] || cat;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm" dir={dir}>
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Sparkles className="text-primary-600 dark:text-primary-400" size={20} />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mx-2">{t('wizardTitle')}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {step === 1 ? (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
                {t('wizardGoalLabel')}
              </label>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder={t('wizardPlaceholder')}
                className="w-full h-32 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
              {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
              <div className="flex justify-end">
                <Button 
                  onClick={handleGenerate} 
                  isLoading={loading}
                  disabled={!goal.trim()}
                  icon={<Sparkles size={16} />}
                >
                  {t('wizardButton')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-500/30 rounded-xl p-4">
                <h3 className="text-sm text-primary-600 dark:text-primary-300 uppercase tracking-wide font-semibold mb-1">{t('concept')}</h3>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{generatedPlan?.title}</p>
                <p className="text-slate-600 dark:text-slate-300 mt-2">{generatedPlan?.description}</p>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-500/30 rounded-xl p-4">
                <h3 className="text-sm text-emerald-600 dark:text-emerald-300 uppercase tracking-wide font-semibold mb-1">{t('microStep')}</h3>
                <p className="text-lg text-slate-900 dark:text-white font-medium">{generatedPlan?.microStep}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400/70 mt-1">{t('microStepDesc')}</p>
              </div>

              <div className="flex gap-4 text-sm text-slate-500 dark:text-slate-400">
                <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">{t('categoryLabel')}: {getCategoryLabel(generatedPlan?.category || '')}</span>
                <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">{t('freqLabel')}: {generatedPlan?.frequency}</span>
              </div>

              <div className="flex justify-end space-x-3 rtl:space-x-reverse pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button variant="ghost" onClick={() => setStep(1)}>{t('back')}</Button>
                <Button onClick={handleConfirm} icon={dir === 'rtl' ? <ArrowLeft size={16}/> : <ArrowRight size={16} />}>{t('startHabit')}</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
