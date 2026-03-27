import React from 'react';
import { Profile, Section } from '../types';
import { Pencil, CheckCircle2 } from 'lucide-react';
import { REFLECTION_PROMPTS } from '../constants';

interface Props {
  section: Section;
  profile: Profile;
  onEdit: () => void;
}

const InfoBlock = ({ label, value }: { label: string, value: string | string[] }) => (
  <div className="mb-3">
    <div className="text-[10px] font-black text-[#2c4869]/40 uppercase tracking-widest mb-1">{label}</div>
    <div className="text-[#2c4869] text-sm font-bold break-words leading-relaxed">
      {Array.isArray(value) 
        ? (value.length > 0 ? value.join(', ') : <span className="text-slate-300 italic text-xs font-medium">Not specified</span>) 
        : (value || <span className="text-slate-300 italic text-xs font-medium">Not specified</span>)}
    </div>
  </div>
);

const SectionSummary: React.FC<Props> = ({ section, profile, onEdit }) => {
  const renderContent = () => {
    switch (section) {
      case Section.BASIC:
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
            <InfoBlock label="Full Name" value={profile.fullName} />
            <InfoBlock label="WhatsApp Number" value={profile.whatsappNumber} />
            <InfoBlock label="Email Address" value={profile.email} />
            <InfoBlock label="Gender & Pronouns" value={[profile.gender, profile.pronouns].filter(Boolean).join(' / ')} />
            <InfoBlock label="Location" value={profile.location} />
          </div>
        );
      case Section.ACADEMIC:
        const displayCategory = profile.specializationCategory === 'Other' 
          ? profile.customCategory || 'Other' 
          : profile.specializationCategory;
          
        const displaySpecialization = profile.specialization === 'Other' 
          ? profile.customSpecialization || 'Other' 
          : profile.specialization;

        const specDisplay = [
          profile.topLevelCategory,
          displayCategory,
          displaySpecialization
        ].filter(Boolean).join(' / ');

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
            <InfoBlock label="Institution" value={profile.collegeName} />
            <InfoBlock label="Degree Path" value={`${profile.degreeType} in ${specDisplay}`} />
            <InfoBlock label="Year of Study" value={profile.yearOfStudy === 'Alumnus' && profile.graduationYear ? `Alumnus (Graduated: ${profile.graduationYear})` : profile.yearOfStudy} />
            <InfoBlock label="CGPA / Percentage" value={profile.cgpa} />
          </div>
        );
      case Section.SKILLS:
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
            <InfoBlock label="Academic Interests" value={profile.interests} />
            <InfoBlock label="Subject Expertise" value={profile.subjectSkills} />
            <InfoBlock label="Technical Tools & IT" value={profile.toolSkills} />
            <InfoBlock label="AI & Data Skills" value={profile.aiSkills} />
            <InfoBlock label="Professional Skills" value={profile.professionalSkills} />
          </div>
        );
      case Section.MILESTONES:
        return (
          <div className="space-y-4">
            <InfoBlock 
              label="Projects" 
              value={profile.projects.map(p => {
                const name = p.name;
                return p.status ? `${name} - ${p.status}${p.details ? ` (${p.details})` : ''}` : name;
              })} 
            />
            <InfoBlock 
              label="Exams" 
              value={profile.exams.map(e => {
                const name = e.name === 'Other Exam' && e.customName ? e.customName : e.name;
                return e.status ? `${name} - ${e.status}${e.details ? ` (${e.details})` : ''}` : name;
              })} 
            />
            <InfoBlock 
              label="Certifications" 
              value={profile.certifications.map(c => {
                const name = c.name === 'Other Certification' && c.customName ? c.customName : c.name;
                return c.status ? `${name} - ${c.status}${c.details ? ` (${c.details})` : ''}` : name;
              })} 
            />
          </div>
        );
      case Section.REFLECTIONS:
        return (
          <div className="space-y-4">
            {REFLECTION_PROMPTS.map(prompt => (
              <div key={prompt.key} className="mb-4">
                <div className="text-[10px] font-black text-[#2c4869]/40 uppercase tracking-widest mb-1">{prompt.label}</div>
                <div className="text-[#2c4869] text-sm font-medium italic border-l-2 border-[#2c4869]/20 pl-3 py-1">
                  {profile.reflections[prompt.key] ? `"${profile.reflections[prompt.key]}"` : <span className="text-slate-300">Not answered yet</span>}
                </div>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <span className="text-xs font-black text-[#2c4869] uppercase tracking-widest">Section Saved</span>
        </div>
        <button 
          onClick={onEdit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-[#2c4869] border border-slate-200 font-black transition-all active:scale-95 text-[10px] uppercase tracking-wider hover:bg-slate-50 hover:border-[#2c4869]/30 shadow-sm"
        >
          <Pencil className="w-3 h-3" />
          <span>Edit</span>
        </button>
      </div>
      <div className="p-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default SectionSummary;
