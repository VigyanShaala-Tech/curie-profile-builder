import React from 'react';
import { motion } from 'motion/react';

type TypeformSlideProps = {
  slideKey: string | number;
  children: React.ReactNode;
  className?: string;
};

export const TypeformSlide: React.FC<TypeformSlideProps> = ({ slideKey, children, className = '' }) => (
  <motion.div
    key={String(slideKey)}
    initial={{ opacity: 0, x: 28 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
    className={`w-full ${className}`.trim()}
  >
    {children}
  </motion.div>
);

export const typeformInputClass = (hasError: boolean) =>
  `w-full px-0 py-4 text-xl sm:text-2xl font-medium text-[#2c4869] bg-transparent border-0 border-b-2 outline-none transition-colors placeholder:text-[#2c4869]/40 ${
    hasError ? 'border-red-400 focus:border-red-500' : 'border-[#2c4869]/30 focus:border-[#f58434]'
  }`;

export const typeformLabelClass = 'block text-lg sm:text-xl md:text-2xl font-semibold text-[#2c4869] leading-snug tracking-tight mb-2';

/** Inline validation / field errors — bold red, below inputs */
export const formFieldErrorClass = 'text-red-500 font-bold text-xs mt-1';

type ToggleOption = {
  label: string;
  value: string;
};

type TypeformToggleGroupProps = {
  options: ToggleOption[];
  value: string;
  onSelect: (value: string) => void;
  columns?: 1 | 2;
};

export const TypeformToggleGroup: React.FC<TypeformToggleGroupProps> = ({
  options,
  value,
  onSelect,
  columns = 1,
}) => (
  <div className={`grid gap-2 ${columns === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
    {options.map((option) => {
      const active = value === option.value;
      return (
        <button
          key={option.value}
          type="button"
          onClick={() => onSelect(option.value)}
          className={`w-full text-left px-4 py-3 rounded-2xl border-2 font-semibold text-sm transition-all ${
            active
              ? 'border-[#f58434] bg-[#f58434] text-white shadow-sm'
              : 'border-slate-200 text-[#2c4869] hover:border-[#f58434]/40 hover:bg-[#f58434]/10'
          }`}
        >
          {option.label}
        </button>
      );
    })}
  </div>
);

type TypeformNavProps = {
  showBack: boolean;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  hideNext?: boolean;
};

export const TypeformNav: React.FC<TypeformNavProps> = ({
  showBack,
  onBack,
  onNext,
  nextLabel = 'Next',
  nextDisabled = false,
  hideNext = false,
}) => (
  <div className="flex items-center justify-between gap-4 mt-12 pt-6">
    <button
      type="button"
      onClick={onBack}
      disabled={!showBack}
      className={`text-sm font-semibold transition-colors ${
        showBack ? 'text-slate-500 hover:text-[#2c4869]' : 'text-slate-200 cursor-not-allowed'
      }`}
    >
      Back
    </button>
    {hideNext ? <span /> : (
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className={`px-8 py-3 rounded-full text-sm font-bold tracking-wide transition-all ${
          nextDisabled
            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
            : 'bg-[#2c4869] text-white shadow-md hover:shadow-lg hover:bg-[#2c4869]/95'
        }`}
      >
        {nextLabel}
      </button>
    )}
  </div>
);
