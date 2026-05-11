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
  /** When true, Reflections is not gated behind Level 1 completion (returning-user flow). */
  isReturningSession?: boolean;
  onSelectStep: (sec: Section) => void;
  onReflectionLockedAttempt: () => void;
}

const JourneyHorizontalTracker: React.FC<JourneyHorizontalTrackerProps> = ({
  journeySteps,
  completedMap,
  editingSection,
  currentSectionIndex,
  level1Complete,
  isReturningSession = false,
  onSelectStep,
  onReflectionLockedAttempt,
}) => {
  return (
    <div className="w-full px-1 sm:px-0">
      <div className="w-full pb-1">
        <div className="flex w-full items-start justify-between gap-0 sm:gap-1">
          {journeySteps.map((sec, idx) => {
            const isCompleted = completedMap[sec];
            const isActive = editingSection === sec;
            const isUnlocked = idx <= currentSectionIndex;
            const isReflectionLocked =
              sec === Section.REFLECTIONS && !level1Complete && !isReturningSession;
            const isLocked = !isUnlocked || isReflectionLocked;
            const isFutureVisual = !isCompleted && !isActive;

            const leftSegmentFilled = idx > 0 && completedMap[journeySteps[idx - 1]];
            const rightSegmentFilled = idx < journeySteps.length - 1 && completedMap[sec];

            const visualWrapClass = isFutureVisual ? 'opacity-40' : 'opacity-100';

            const circleBase =
              'relative rounded-full border-2 flex items-center justify-center bg-white transition-all duration-500 ease-out w-9 h-9 sm:w-14 sm:h-14 text-base sm:text-2xl leading-none';

            const circleState = isCompleted
              ? 'border-emerald-400 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]'
              : isActive
              ? 'border-blue-400 shadow-[0_0_14px_rgba(59,130,246,0.35)] ring-2 ring-blue-300/50'
              : isLocked
              ? 'border-slate-200'
              : 'border-slate-300';

            const segmentClass = (filled: boolean) =>
              `h-0.5 sm:h-1 w-full rounded-full transition-all duration-700 ease-in-out ${
                filled ? 'bg-emerald-500' : 'bg-slate-200'
              } ${filled ? 'opacity-100' : 'opacity-40'}`;

            return (
              <div
                key={`journey-track-${sec}`}
                className="flex flex-col items-center flex-1 min-w-0"
              >
                <div className="flex flex-col items-center w-full">
                  <div className="flex items-center w-full">
                    <div className="flex-1 flex justify-end items-center">
                      {idx > 0 && (
                        <div className={segmentClass(!!leftSegmentFilled)} aria-hidden />
                      )}
                    </div>

                    <div className="w-10 sm:w-14 flex justify-center shrink-0 items-center">
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
                            <span className="text-xs sm:text-lg" aria-hidden>
                              🔒
                            </span>
                          ) : (
                            <>
                              <span className="select-none pointer-events-none">{STEP_AVATAR[sec]}</span>
                              {isCompleted && (
                                <span
                                  className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm"
                                  aria-hidden
                                >
                                  <Check className="w-2 h-2 sm:w-3 sm:h-3" strokeWidth={3} />
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

                  <span className="mt-1.5 sm:mt-2 w-full text-center text-[9px] sm:text-sm font-bold uppercase tracking-wide text-slate-700 leading-tight truncate px-0.5">
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
