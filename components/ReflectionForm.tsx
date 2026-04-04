
import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Brain, ChevronDown, ChevronUp } from 'lucide-react';
import { Profile } from '../types';
import { REFLECTION_PROMPTS } from '../constants';
import { TypeformSlide, TypeformNav, typeformLabelClass } from './TypeformSlide';

interface Props {
  profile: Profile;
  updateProfile: (updates: Partial<Profile>) => void;
  readOnly?: boolean;
  validationErrors?: Record<string, string>;
  typeform?: boolean;
  onCompleteSection?: () => void;
  onBackFromFirst?: () => void;
}

const ReflectionForm: React.FC<Props> = ({
  profile,
  updateProfile,
  readOnly,
  validationErrors = {} as Record<string, string>,
  typeform,
  onCompleteSection,
  onBackFromFirst,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showExample, setShowExample] = useState(false);
  const item = REFLECTION_PROMPTS[currentIndex];
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!typeform || readOnly) return;
    const t = requestAnimationFrame(() => taRef.current?.focus());
    return () => cancelAnimationFrame(t);
  }, [currentIndex, typeform, readOnly]);

  const handleNext = () => {
    if (currentIndex < REFLECTION_PROMPTS.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowExample(false);
    } else if (typeform) {
      onCompleteSection?.();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowExample(false);
    } else {
      onBackFromFirst?.();
    }
  };

  if (typeform && !readOnly) {
    return (
      <div className="min-h-[50vh] flex flex-col justify-center px-1 pb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6">
          {currentIndex + 1} / {REFLECTION_PROMPTS.length}
        </p>
        <AnimatePresence mode="wait">
          <TypeformSlide slideKey={item.key}>
            <div className="flex items-center gap-3 mb-6">
              <span className="flex items-center justify-center w-11 h-11 rounded-full bg-[#ffcd29]/90 text-[#2c4869]">
                <Brain size={22} />
              </span>
              <span className="text-sm font-bold text-[#2c4869]/70">{item.label}</span>
            </div>
            <h2 className={`${typeformLabelClass} mb-4`}>{item.description}</h2>
            <p className="text-slate-500 text-base leading-relaxed mb-6">{item.prompt}</p>
            {item.example && (
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => setShowExample(!showExample)}
                  className="flex items-center gap-1 text-sm font-semibold text-[#f58434]"
                >
                  {showExample ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  Examples
                </button>
                {showExample && (
                  <p className="mt-3 text-sm text-slate-500 italic bg-slate-50 p-4 rounded-xl">{item.example}</p>
                )}
              </div>
            )}
            <textarea
              ref={taRef}
              value={profile.reflections[item.key as keyof typeof profile.reflections] || ''}
              onChange={(e) =>
                updateProfile({
                  reflections: { ...profile.reflections, [item.key]: e.target.value },
                })
              }
              placeholder="Write 2–3 sentences…"
              rows={5}
              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 outline-none text-base text-[#2c4869] focus:border-[#f58434] transition-colors"
            />
            {validationErrors[item.key] && (
              <p className="text-red-500 text-sm font-medium mt-2">{validationErrors[item.key]}</p>
            )}
            <TypeformNav
              showBack={currentIndex > 0 || !!onBackFromFirst}
              onBack={handlePrev}
              onNext={handleNext}
              nextLabel={currentIndex === REFLECTION_PROMPTS.length - 1 ? 'Continue' : 'Next'}
            />
          </TypeformSlide>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={`space-y-6 animate-in fade-in duration-500 ${readOnly ? 'opacity-60 pointer-events-none' : ''}`}>
      <div className="text-center text-xs font-black text-[#2c4869]/40 uppercase tracking-widest mb-4">
        Step {currentIndex + 1} of {REFLECTION_PROMPTS.length}
      </div>

      <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[#ffcd29] text-[#2c4869]">
            <Brain size={20} />
          </span>
          <h2 className="text-xl font-black text-[#2c4869] tracking-tight">{item.label}</h2>
        </div>
        
        <p className="text-[#2c4869]/60 text-sm font-medium mb-6">
          {item.prompt}
        </p>

        <h3 className="text-lg font-bold text-[#2c4869] mb-4 leading-relaxed">
          {item.description}
        </h3>

        {item.example && (
          <div className="mb-6">
            <button 
              onClick={() => setShowExample(!showExample)}
              className="flex items-center gap-1 text-xs font-bold text-[#f58434] hover:text-[#f58434]/80"
            >
              {showExample ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              See examples
            </button>
            {showExample && (
              <p className="mt-2 text-xs text-slate-500 italic bg-slate-50 p-3 rounded-lg">
                {item.example}
              </p>
            )}
          </div>
        )}

        <textarea 
          value={profile.reflections[item.key as keyof typeof profile.reflections] || ''}
          onChange={(e) => updateProfile({ 
            reflections: { ...profile.reflections, [item.key]: e.target.value } 
          })}
          placeholder="Type your reflection here..."
          disabled={readOnly}
          className="w-full min-h-[160px] p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none transition-all text-sm leading-relaxed font-medium focus:ring-2 focus:ring-[#f58434] disabled:bg-slate-100"
        />
        <p className="text-xs text-slate-400 mt-2 font-medium">Write 2–3 sentences.</p>
        {validationErrors[item.key] && <p className="text-red-500 text-xs font-bold mt-2">{validationErrors[item.key]}</p>}
      </div>

      <div className="flex justify-between mt-8">
        <button 
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="px-6 py-2.5 rounded-xl font-black text-slate-500 hover:text-slate-700 disabled:opacity-30 transition-all"
        >
          Previous
        </button>
        <button 
          onClick={handleNext}
          disabled={currentIndex === REFLECTION_PROMPTS.length - 1}
          className="px-6 py-2.5 rounded-xl font-black bg-[#2c4869] text-white shadow-lg hover:shadow-xl disabled:opacity-30 transition-all"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ReflectionForm;
