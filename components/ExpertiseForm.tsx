
import React, { useState } from 'react';
import { Profile, MilestoneDetail } from '../types';
import { 
  COMPETITIVE_EXAMS, 
  EXAM_STATUS_OPTIONS, 
  CERTIFICATION_OPTIONS, 
  CERTIFICATION_STATUS_OPTIONS 
} from '../constants';

interface Props {
  profile: Profile;
  updateProfile: (updates: Partial<Profile>) => void;
  readOnly?: boolean;
  validationErrors?: Record<string, string>;
}

const InputRow = ({ value, onChange, onAdd, placeholder, disabled }: any) => (
  <div className="flex gap-2 mb-4">
    <input 
      type="text" 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyPress={(e) => e.key === 'Enter' && onAdd()}
      placeholder={placeholder}
      disabled={disabled}
      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#f58434] transition-all text-sm font-medium disabled:bg-slate-50"
    />
    {!disabled && <button onClick={onAdd} className="px-5 py-3 bg-[#f58434] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#f58434]/90 transition-all shadow-md">Add</button>}
  </div>
);

const DeleteCross = ({ onDelete }: { onDelete: () => void }) => {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="relative flex items-center">
      {confirming && (
        <div className="absolute bottom-full right-0 mb-3 w-48 p-3 bg-white rounded-xl shadow-xl border border-slate-200 z-20 animate-in fade-in zoom-in-95 duration-200">
          <p className="text-xs font-bold text-slate-700 mb-3 text-center">Are you sure you want to delete this?</p>
          <div className="flex gap-2">
            <button 
              onClick={() => setConfirming(false)} 
              className="flex-1 px-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                setConfirming(false);
                onDelete();
              }} 
              className="flex-1 px-2 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors"
            >
              Delete
            </button>
          </div>
          <div className="absolute -bottom-1.5 right-2 w-3 h-3 bg-white border-b border-r border-slate-200 transform rotate-45"></div>
        </div>
      )}
      <button 
        onClick={() => setConfirming(true)} 
        className={`hover:text-red-500 text-lg leading-none p-1 -m-1 transition-colors ${confirming ? 'text-red-500' : ''}`}
      >
        &times;
      </button>
    </div>
  );
};

const TagCloud = ({ items, field, color = "vs-orange", onRemove, readOnly }: { items: string[], field: string, color?: string, onRemove: (field: any, value: string) => void, readOnly?: boolean }) => {
  const safeItems = items || [];
  const colorStyles: Record<string, string> = {
    'vs-orange': 'bg-[#f58434]/10 text-[#f58434] border-[#f58434]/20',
    'vs-yellow': 'bg-[#ffcd29]/10 text-[#b58e00] border-[#ffcd29]/20',
    'vs-blue': 'bg-[#2c4869]/10 text-[#2c4869] border-[#2c4869]/20'
  };

  return (
    <div className={`flex flex-wrap gap-2.5 min-h-[40px]`}>
      {safeItems.length > 0 ? safeItems.map(item => (
        <span key={item} className={`px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 border font-black shadow-sm animate-in zoom-in-90 duration-300 ${colorStyles[color] || colorStyles['vs-orange']}`}>
          {item}
          {!readOnly && <DeleteCross onDelete={() => onRemove(field, item)} />}
        </span>
      )) : <span className="text-xs text-slate-300 italic font-medium py-2">No entries yet...</span>}
    </div>
  );
};

const SkillSection = ({ title, description, examples, value, onChange, onAdd, placeholder, items, field, color, icon, onRemove, readOnly, errorMessage, required }: any) => (
  <div className={`p-6 bg-white rounded-3xl border ${errorMessage ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-100'} shadow-sm transition-all duration-300`}>
    <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color === 'vs-orange' ? 'bg-[#f58434]/10 text-[#f58434]' : color === 'vs-yellow' ? 'bg-[#ffcd29]/10 text-[#b58e00]' : 'bg-[#2c4869]/10 text-[#2c4869]'}`}>
          {icon}
        </div>
        <div>
          <h3 className={`text-sm font-black uppercase tracking-wider ${color === 'vs-orange' ? 'text-[#f58434]' : color === 'vs-yellow' ? 'text-[#b58e00]' : 'text-[#2c4869]'}`}>
            {title}
            {required && <span className="text-red-500 ml-1">*</span>}
          </h3>
        </div>
      </div>
      <div className="mb-4">
        <p className="text-xs font-bold text-[#2c4869] mb-1">{description}</p>
        <p className="text-[10px] text-slate-400 italic">Examples: {examples}</p>
        {errorMessage && <p className="text-red-500 text-[10px] font-bold mt-1">{errorMessage}</p>}
      </div>
      <InputRow value={value} onChange={onChange} onAdd={onAdd} placeholder={placeholder} disabled={readOnly} />
      <TagCloud items={items} field={field} color={color} onRemove={onRemove} readOnly={readOnly} />
    </section>
  </div>
);

const ExpertiseForm: React.FC<Props> = ({ profile, updateProfile, readOnly, validationErrors = {} as Record<string, string> }) => {
  const getError = (field: string) => validationErrors[field];

  const [inputs, setInputs] = useState({
    subject: '',
    tool: '',
    ai: '',
    professional: '',
    interest: ''
  });

  const addToList = (field: keyof Profile, value: string, inputKey: keyof typeof inputs) => {
    if (readOnly) return;
    const trimmed = value.trim();
    const currentList = (profile[field] as string[]) || [];
    if (trimmed && !currentList.includes(trimmed)) {
      updateProfile({ [field]: [...currentList, trimmed] });
      setInputs(prev => ({ ...prev, [inputKey]: '' }));
    }
  };

  const removeFromList = (field: keyof Profile, value: string) => {
    if (readOnly) return;
    const currentList = (profile[field] as string[]) || [];
    updateProfile({ [field]: currentList.filter(x => x !== value) });
  };

  return (
    <div className={`space-y-8 animate-in slide-in-from-right-4 duration-500 pb-20 ${readOnly ? 'opacity-60 pointer-events-none' : ''}`}>
      <div className={`space-y-6 transition-all`}>
        {!!getError('Subject Expertise') || !!getError('Technical Tools') || !!getError('AI & Data Skills') || !!getError('Professional Skills') || !!getError('Academic Interests') ? (
          <p className="text-red-600 font-bold text-sm px-4">Please add at least one item to any of the following expertise areas:</p>
        ) : null}
        {/* 1. Subject Knowledge */}
        <SkillSection 
          title="1. Subject Knowledge"
          description="What scientific or engineering concepts are you becoming comfortable with? (Include everything from basic lab techniques to advanced analysis)."
          examples="Circuit Design, Thermodynamics Analysis, Molecular Biology Techniques, Structural Analysis, Control Systems, Embedded Systems, Materials Characterization, Signal Processing, etc."
          value={inputs.subject}
          onChange={(v: string) => setInputs(p => ({ ...p, subject: v }))}
          onAdd={() => addToList('subjectSkills', inputs.subject, 'subject')}
          placeholder="Add a subject skill"
          items={profile.subjectSkills}
          field="subjectSkills"
          color="vs-orange"
          onRemove={removeFromList}
          readOnly={readOnly}
          errorMessage={getError('Subject Expertise')}
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.082.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
        />

        {/* 2. Technical Tools & IT Skills */}
        <SkillSection 
          title="2. Technical Tools & IT Skills"
          description="What software, programming languages, or technical tools have you worked with?"
          examples="Python, MATLAB, SolidWorks, AutoCAD, Arduino, Git / GitHub, Linux, Excel / Advanced Spreadsheets, Cloud Platforms (AWS, GCP)"
          value={inputs.tool}
          onChange={(v: string) => setInputs(p => ({ ...p, tool: v }))}
          onAdd={() => addToList('toolSkills', inputs.tool, 'tool')}
          placeholder="Add a tool or IT skill"
          items={profile.toolSkills}
          field="toolSkills"
          color="vs-orange"
          onRemove={removeFromList}
          readOnly={readOnly}
          errorMessage={getError('Technical Tools')}
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>}
        />

        {/* 3. AI & Data Skills */}
        <SkillSection 
          title="3. AI & Data Skills"
          description="Have you explored artificial intelligence, machine learning, or data-related tools and methods?"
          examples="Machine Learning, Deep Learning, Prompt Engineering, Data Analysis, Computer Vision, Natural Language Processing, TensorFlow / PyTorch, Data Visualization"
          value={inputs.ai}
          onChange={(v: string) => setInputs(p => ({ ...p, ai: v }))}
          onAdd={() => addToList('aiSkills', inputs.ai, 'ai')}
          placeholder="Add an AI or data skill"
          items={profile.aiSkills}
          field="aiSkills"
          color="vs-orange"
          onRemove={removeFromList}
          readOnly={readOnly}
          errorMessage={getError('AI & Data Skills')}
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 11h-1M4 11H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}
        />

        {/* 4. Professional & Transferable Skills */}
        <SkillSection 
          title="4. Professional & Transferable Skills"
          description="These are skills that help you collaborate, communicate ideas, and work effectively in teams."
          examples="Scientific Communication, Team Collaboration, Project Management, Leadership, Problem Solving, Critical Thinking, Time Management, Public Speaking"
          value={inputs.professional}
          onChange={(v: string) => setInputs(p => ({ ...p, professional: v }))}
          onAdd={() => addToList('professionalSkills', inputs.professional, 'professional')}
          placeholder="Add a professional skill"
          items={profile.professionalSkills}
          field="professionalSkills"
          color="vs-yellow"
          onRemove={removeFromList}
          readOnly={readOnly}
          errorMessage={getError('Professional Skills')}
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
        />

        {/* 5. Academic Interests */}
        <SkillSection 
          title="5. Academic Interests"
          description="What specific topics or areas in STEM fascinate you the most?"
          examples="Quantum Mechanics, Astrophysics, Robotics, Genetics, Sustainable Energy, Number Theory, etc."
          value={inputs.interest}
          onChange={(v: string) => setInputs(p => ({ ...p, interest: v }))}
          onAdd={() => addToList('interests', inputs.interest, 'interest')}
          placeholder="Add an interest"
          items={profile.interests}
          field="interests"
          color="vs-blue"
          onRemove={removeFromList}
          readOnly={readOnly}
          errorMessage={getError('Academic Interests')}
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
        />
      </div>
    </div>
  );
};

export default ExpertiseForm;
