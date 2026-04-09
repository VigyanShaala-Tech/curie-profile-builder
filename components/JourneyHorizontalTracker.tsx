import React from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { Section } from '../types';

const STEP_AVATAR: Record<Section, string> = {
  [Section.BASIC]: '👩',
  [Section.ACADEMIC]: '👩‍🎓',
  [Section.SKILLS]: '👩‍💻',
  [Section.MILESTONES]: '👩‍🔬',
  [Section.REFLECTIONS]: '🧘‍♀️',
  [Section.REVIEW]: '👩',
};

const STEP_LABEL: Record<Section, string> = {
  [Section.BASIC]: 'Identity',
  [Section.ACADEMIC]: 'Academics',
  [Section.SKILLS]: 'Expertise',
  [Section.MILESTONES]: 'Milestones',
  [Section.REFLECTIONS]: 'Reflections',
  [Section.REVIEW]: 'Review',
};

export interface JourneyHorizontalTrackerProps {
  journeySteps: readonly Section[];
  completedMap: Record<Section, boolean>;
  editingSection: Section | null;
  currentSectionIndex: number;
  level1Complete: boolean;
  onSelectStep: (sec: Section) => void;
  onReflectionLockedAttempt: () => void;
}

const JourneyHorizontalTracker: React.FC<JourneyHorizontalTrackerProps> = ({
  journeySteps,
  completedMap,
  editingSection,
  currentSectionIndex,
  level1Complete,
  onSelectStep,
  onReflectionLockedAttempt,
}) => {
  return (
    <div className="w-full px-0">
      <div className="overflow-x-auto no-scrollbar pb-1 w-full">
        <div className="flex min-w-max sm:min-w-0 sm:w-full items-start justify-center sm:justify-between gap-4 sm:gap-1">
          {journeySteps.map((sec, idx) => {
            const isCompleted = completedMap[sec];
            const isActive = editingSection === sec;
            const isUnlocked = idx <= currentSectionIndex;
            const isReflectionLocked = sec === Section.REFLECTIONS && !level1Complete;
            const isLocked = !isUnlocked || isReflectionLocked;
            const isFutureVisual = !isCompleted && !isActive;

            const leftSegmentFilled = idx > 0 && completedMap[journeySteps[idx - 1]];
            const rightSegmentFilled = idx < journeySteps.length - 1 && completedMap[sec];

            const visualWrapClass = isFutureVisual ? 'opacity-40' : 'opacity-100';

            const circleBase =
              'relative rounded-full border-2 flex items-center justify-center bg-white transition-all duration-500 ease-out w-10 h-10 sm:w-14 sm:h-14 text-lg sm:text-2xl leading-none';

            const circleState = isCompleted
              ? 'border-emerald-400 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]'
              : isActive
              ? 'border-blue-400 shadow-[0_0_14px_rgba(59,130,246,0.35)] ring-2 ring-blue-300/50'
              : isLocked
              ? 'border-slate-200'
              : 'border-slate-300';

            const segmentClass = (filled: boolean) =>
              `h-1 w-full max-w-[40px] rounded-full transition-all duration-700 ease-in-out ${
                filled ? 'bg-emerald-500' : 'bg-slate-200'
              } ${filled ? 'opacity-100' : 'opacity-40'}`;

            return (
              <div
                key={`journey-track-${sec}`}
                className="flex flex-col items-center w-full min-w-[5.5rem] sm:flex-1 sm:min-w-0 shrink-0"
              >
                <div className="flex flex-col items-center w-full">
                  <div className="flex items-center w-full">
                    <div className="flex-1 flex justify-end items-center">
                      {idx > 0 && (
                        <div className={segmentClass(!!leftSegmentFilled)} aria-hidden />
                      )}
                    </div>

                    <div className="w-14 flex justify-center shrink-0 items-center">
                      <div className={`transition-opacity duration-500 ${visualWrapClass}`}>
                        <motion.button
                          type="button"
                          disabled={isLocked}
                          onClick={() => {
                            if (isReflectionLocked) {
                              onReflectionLockedAttempt();
                              return;
                            }
                            onSelectStep(sec);
                          }}
                          className={`${circleBase} ${circleState} ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer hover:border-blue-300/80'}`}
                          animate={
                            isActive
                              ? { scale: 1.06 }
                              : { scale: 1 }
                          }
                          transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                          aria-current={isActive ? 'step' : undefined}
                          aria-label={STEP_LABEL[sec]}
                        >
                          {isLocked ? (
                            <span className="text-sm sm:text-lg" aria-hidden>
                              🔒
                            </span>
                          ) : (
                            <>
                              <span className="select-none pointer-events-none">{STEP_AVATAR[sec]}</span>
                              {isCompleted && (
                                <span
                                  className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm"
                                  aria-hidden
                                >
                                  <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" strokeWidth={3} />
                                </span>
                              )}
                            </>
                          )}
                        </motion.button>
                      </div>
                    </div>

                    <div className="flex-1 flex justify-start items-center">
                      {idx < journeySteps.length - 1 && (
                        <div className={segmentClass(!!rightSegmentFilled)} aria-hidden />
                      )}
                    </div>
                  </div>

                  <span className="mt-2 w-full text-center text-xs sm:text-sm font-bold uppercase tracking-wide text-slate-700 leading-tight">
                    {STEP_LABEL[sec]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default JourneyHorizontalTracker;
