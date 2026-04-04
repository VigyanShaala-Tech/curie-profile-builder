import React from 'react';
import { Section } from '../types';

interface VerticalProgressProps {
  steps: Section[];
  unlockedCount: number;
  activeSection: Section | null;
  completed: Record<Section, boolean>;
  className?: string;
  totalHeightPx?: number;
  completedHeightPx?: number;
  stepPositions?: Record<Section, number>;
}

const labelMap: Record<Section, string> = {
  [Section.BASIC]: 'Identity',
  [Section.ACADEMIC]: 'Academics',
  [Section.SKILLS]: 'Expertise',
  [Section.MILESTONES]: 'Milestones',
  [Section.REFLECTIONS]: 'Reflections',
  [Section.REVIEW]: 'Review',
};

const VerticalProgress: React.FC<VerticalProgressProps> = ({
  steps,
  unlockedCount,
  activeSection,
  completed,
  className = '',
  totalHeightPx,
  completedHeightPx,
  stepPositions,
}) => {
  const safeTotal = Math.max(420, Math.round(totalHeightPx || 560));
  const safeCompleted = Math.max(0, Math.min(safeTotal, Math.round(completedHeightPx || 0)));

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-3 shadow-sm ${className}`}>
      <p className="text-[9px] font-black uppercase tracking-widest text-[#2c4869]/60">Journey Tracker</p>
      <div className="mt-2 relative" style={{ height: `${safeTotal}px` }}>
        <div className="absolute left-2.5 top-0 bottom-0 w-[2px] bg-white border border-slate-200 rounded-full" />
        <div
          className="absolute left-2.5 top-0 w-[2px] bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.35)] transition-all duration-700 ease-in-out rounded-full"
          style={{ height: `${safeCompleted}px` }}
        />
        <div className="absolute inset-0">
          {steps.map((step) => {
            const isCompleted = completed[step];
            const isUnlocked = steps.indexOf(step) < unlockedCount;
            const isActive = activeSection === step;
            const stateIcon = isCompleted ? '✅' : isActive ? '🔵' : isUnlocked ? '🟢' : '🔒';
            const topPercent = stepPositions?.[step];
            const top = typeof topPercent === 'number' ? `${topPercent}%` : undefined;
            return (
              <div key={step} className="absolute left-0 -translate-y-1/2 pl-6" style={top ? { top } : {}}>
                <div
                  className={`absolute -left-1 top-0.5 w-5 h-5 rounded-full border flex items-center justify-center text-[9px] transition-all duration-500 ${
                    isCompleted
                      ? 'bg-emerald-50 border-emerald-300'
                      : isActive
                      ? 'bg-blue-50 border-blue-300'
                      : isUnlocked
                      ? 'bg-white border-slate-300'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  {stateIcon}
                </div>
                <p className={`text-xs font-bold ${isActive ? 'text-[#2c4869]' : 'text-[#2c4869]/70'}`}>{labelMap[step]}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VerticalProgress;
