import React from 'react';

interface AvatarProgressProps {
  progress: number;
  xpMessage: string | null;
  compact?: boolean;
  small?: boolean;
  avatarEmoji: string;
  stageLabel: string;
  stageSubtitle: string;
  activeState?: 'incomplete' | 'active' | 'completed';
}

const AvatarProgress: React.FC<AvatarProgressProps> = ({
  progress,
  xpMessage,
  compact = false,
  small = false,
  avatarEmoji,
  stageLabel,
  stageSubtitle,
  activeState = 'incomplete',
}) => {
  const clamped = Math.max(0, Math.min(100, progress));

  return (
    <div className="relative flex flex-col items-center justify-center gap-2">
      <div
        className={`${small ? 'w-[86px] h-[86px] text-4xl' : 'w-[110px] h-[110px] text-5xl'} rounded-full border flex items-center justify-center transition-all duration-500 ${
          activeState === 'completed'
            ? 'bg-emerald-50 border-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
            : activeState === 'active'
            ? 'bg-blue-50 border-blue-300 shadow-[0_0_16px_rgba(59,130,246,0.2)]'
            : 'bg-white border-slate-200 shadow-md'
        }`}
      >
        {avatarEmoji}
      </div>
      <p className={`${compact ? 'text-[10px]' : 'text-xs'} font-black text-[#2c4869]`}>{stageLabel}</p>
      {!compact && <p className={`${small ? 'text-[10px]' : 'text-[11px]'} text-[#2c4869]/60 font-semibold text-center`}>{stageSubtitle}</p>}
      {xpMessage && (
        <div className="absolute -bottom-8 rounded-full bg-[#ffcd29] px-3 py-1 text-[10px] font-black text-[#2c4869] shadow-sm animate-pulse">
          {xpMessage}
        </div>
      )}
    </div>
  );
};

export default AvatarProgress;
