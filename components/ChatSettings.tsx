import React from 'react';
import { MessageSquareText, Settings2 } from 'lucide-react';
import { ChatPreferences } from '../types';

interface Props {
  preferences: ChatPreferences;
  updatePreferences: (updates: Partial<ChatPreferences>) => void;
}

const ChatSettings: React.FC<Props> = ({ preferences, updatePreferences }) => {
  return (
    <div className="relative overflow-hidden p-6 bg-gradient-to-br from-[#2c4869]/5 to-indigo-50/30 rounded-3xl border border-[#2c4869]/10 shadow-inner group">
      {/* Decorative background element */}
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#2c4869]/5 rounded-full blur-2xl group-hover:bg-[#2c4869]/10 transition-colors duration-500" />
      
      <div className="relative flex items-center gap-3 mb-6">
        <div className="p-2 bg-[#2c4869] text-white rounded-xl shadow-lg shadow-[#2c4869]/20">
          <MessageSquareText size={18} strokeWidth={2.5} />
        </div>
        <div>
          <h3 className="text-sm font-black text-[#2c4869] uppercase tracking-wider leading-none mb-1">Chat Customization</h3>
          <p className="text-[10px] font-bold text-[#2c4869]/40 uppercase tracking-widest">Personalize Curie's responses</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Settings2 size={12} className="text-[#2c4869]/60" />
            <label className="text-[10px] font-black text-[#2c4869]/60 uppercase tracking-widest">Response Length</label>
          </div>
          <div className="relative">
            <select 
              value={preferences.responseLength}
              onChange={(e) => updatePreferences({ responseLength: e.target.value as any })}
              className="w-full p-3 pr-10 rounded-xl border-2 border-white bg-white/80 backdrop-blur-sm text-sm font-bold text-[#2c4869] shadow-sm focus:border-[#2c4869]/20 focus:ring-0 transition-all appearance-none cursor-pointer"
            >
              <option value="" disabled>Select length</option>
              <option value="short">Short, to the point</option>
              <option value="short-examples">Short, with examples</option>
              <option value="detailed">Detailed explanation</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#2c4869]/40">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Settings2 size={12} className="text-[#2c4869]/60" />
            <label className="text-[10px] font-black text-[#2c4869]/60 uppercase tracking-widest">Response Format</label>
          </div>
          <div className="relative">
            <select 
              value={preferences.responseFormat}
              onChange={(e) => updatePreferences({ responseFormat: e.target.value as any })}
              className="w-full p-3 pr-10 rounded-xl border-2 border-white bg-white/80 backdrop-blur-sm text-sm font-bold text-[#2c4869] shadow-sm focus:border-[#2c4869]/20 focus:ring-0 transition-all appearance-none cursor-pointer"
            >
              <option value="" disabled>Select format</option>
              <option value="bullets">Bulleted list</option>
              <option value="paragraphs">Paragraphs</option>
              <option value="mix">A mix of both</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#2c4869]/40">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-[#2c4869]/5">
        <p className="text-[9px] font-bold text-[#2c4869]/30 italic leading-tight">
          These settings help Curie tailor her guidance to your preferred learning style and pace.
        </p>
      </div>
    </div>
  );
};

export default ChatSettings;
