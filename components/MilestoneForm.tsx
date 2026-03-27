
import React, { useState, useRef, useEffect } from 'react';
import { Pencil, Plus, FolderGit2, Award, BookOpen } from 'lucide-react';
import { Profile, MilestoneDetail, ProjectDetail } from '../types';
import { 
  EXAM_STATUS_OPTIONS,
  CERTIFICATION_STATUS_OPTIONS,
  PROJECT_STATUS_OPTIONS
} from '../constants';

interface Props {
  profile: Profile;
  updateProfile: (updates: Partial<Profile>) => void;
  readOnly?: boolean;
  validationErrors?: Record<string, string>;
}

const AutoTextarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }, [props.value]);

  return (
    <textarea
      {...props}
      ref={ref}
      rows={1}
      className={`w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium outline-none focus:ring-1 focus:ring-[#f58434] min-h-[60px] bg-white disabled:bg-slate-50 resize-none overflow-hidden ${props.className || ''}`}
    />
  );
};

const DeleteButton = ({ onDelete, hasContent }: { onDelete: () => void, hasContent: boolean }) => {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="relative flex items-center">
      {confirming && (
        <div className="absolute bottom-full right-0 mb-3 w-56 p-3 bg-white rounded-xl shadow-xl border border-slate-200 z-20 animate-in fade-in zoom-in-95 duration-200">
          <p className="text-xs font-bold text-slate-700 mb-3 text-center">Are you sure you want to delete this?</p>
          <div className="flex gap-2">
            <button 
              onClick={() => setConfirming(false)} 
              className="flex-1 px-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={onDelete} 
              className="flex-1 px-2 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors"
            >
              Delete
            </button>
          </div>
          <div className="absolute -bottom-1.5 right-8 w-3 h-3 bg-white border-b border-r border-slate-200 transform rotate-45"></div>
        </div>
      )}
      <button
        onClick={() => {
          if (hasContent && !confirming) {
            setConfirming(true);
          } else if (!hasContent) {
            onDelete();
          }
        }}
        className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
          confirming 
            ? 'bg-red-100 text-red-600' 
            : 'text-red-500 bg-red-50 hover:bg-red-100'
        }`}
      >
        Delete
      </button>
    </div>
  );
};

type EntryType = 'project' | 'certification' | 'exam';

interface UnifiedEntry {
  type: EntryType;
  index: number;
  data: ProjectDetail | MilestoneDetail;
}

const MilestoneForm: React.FC<Props> = ({ profile, updateProfile, readOnly, validationErrors = {} as Record<string, string> }) => {
  const getError = (field: string) => validationErrors[field];

  const updateProject = (index: number, updates: Partial<ProjectDetail>) => {
    if (readOnly) return;
    const next = [...profile.projects];
    next[index] = { ...next[index], ...updates };
    updateProfile({ projects: next });
  };

  const addProject = () => {
    if (readOnly) return;
    const next = profile.projects.map(p => ({ ...p, isSaved: true }));
    updateProfile({ projects: [...next, { name: '', status: '', details: '', isSaved: false }] });
  };

  const removeProject = (index: number) => {
    if (readOnly) return;
    const next = [...profile.projects];
    next.splice(index, 1);
    updateProfile({ projects: next });
  };

  const updateExam = (index: number, updates: Partial<MilestoneDetail>) => {
    if (readOnly) return;
    const next = [...profile.exams];
    next[index] = { ...next[index], ...updates };
    updateProfile({ exams: next });
  };

  const addExam = () => {
    if (readOnly) return;
    const next = profile.exams.map(e => ({ ...e, isSaved: true }));
    updateProfile({ exams: [...next, { name: '', status: '', details: '', isSaved: false }] });
  };

  const removeExam = (index: number) => {
    if (readOnly) return;
    const next = [...profile.exams];
    next.splice(index, 1);
    updateProfile({ exams: next });
  };

  const updateCertification = (index: number, updates: Partial<MilestoneDetail>) => {
    if (readOnly) return;
    const next = [...profile.certifications];
    next[index] = { ...next[index], ...updates };
    updateProfile({ certifications: next });
  };

  const addCertification = () => {
    if (readOnly) return;
    const next = profile.certifications.map(c => ({ ...c, isSaved: true }));
    updateProfile({ certifications: [...next, { name: '', status: '', details: '', isSaved: false }] });
  };

  const removeCertification = (index: number) => {
    if (readOnly) return;
    const next = [...profile.certifications];
    next.splice(index, 1);
    updateProfile({ certifications: next });
  };

  const allEntries: UnifiedEntry[] = [
    ...profile.projects.map((p, i) => ({ type: 'project' as const, index: i, data: p })),
    ...profile.certifications.map((c, i) => ({ type: 'certification' as const, index: i, data: c })),
    ...profile.exams.map((e, i) => ({ type: 'exam' as const, index: i, data: e }))
  ];

  const hasAnyError = !!getError('Projects') || !!getError('Exams') || !!getError('Certifications');

  return (
    <div className={`space-y-8 animate-in slide-in-from-right-4 duration-500 pb-20 ${readOnly ? 'opacity-60 pointer-events-none' : ''}`}>
      <div className={`space-y-6 transition-all`}>
        {hasAnyError ? (
          <p className="text-red-600 font-bold text-sm px-4">Please add at least one item to your achievements.</p>
        ) : null}
        
        <div className={`p-6 bg-white rounded-3xl border ${hasAnyError ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-100'} shadow-sm transition-all duration-300`}>
          <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            
            {!readOnly && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                <button
                  onClick={addProject}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-dashed border-blue-300 text-blue-700 bg-blue-50/50 font-black text-xs uppercase tracking-wider hover:bg-blue-50 hover:border-blue-400 transition-all"
                >
                  <FolderGit2 className="w-4 h-4" />
                  Add Project
                </button>
                <button
                  onClick={addCertification}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-dashed border-green-300 text-green-700 bg-green-50/50 font-black text-xs uppercase tracking-wider hover:bg-green-50 hover:border-green-400 transition-all"
                >
                  <Award className="w-4 h-4" />
                  Add Certification
                </button>
                <button
                  onClick={addExam}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-dashed border-purple-300 text-purple-700 bg-purple-50/50 font-black text-xs uppercase tracking-wider hover:bg-purple-50 hover:border-purple-400 transition-all"
                >
                  <BookOpen className="w-4 h-4" />
                  Add Exam
                </button>
              </div>
            )}

            <div className="space-y-4">
              {allEntries.length === 0 && !readOnly && (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-sm text-slate-500 font-medium">No achievements added yet. Click one of the buttons above to start adding your projects, certifications, or exams!</p>
                </div>
              )}

              {allEntries.map((entry, idx) => {
                const { type, index, data } = entry;
                
                let titleLabel = '';
                let titlePlaceholder = '';
                let statusOptions: string[] = [];
                let typeColor = '';
                let typeIcon = null;
                let typeLabel = '';
                
                if (type === 'project') {
                  titleLabel = 'Project Title';
                  titlePlaceholder = 'e.g. Rainfall Prediction Model';
                  statusOptions = PROJECT_STATUS_OPTIONS;
                  typeColor = 'text-blue-700 bg-blue-50 border-blue-200';
                  typeIcon = <FolderGit2 className="w-3.5 h-3.5" />;
                  typeLabel = 'Project';
                } else if (type === 'certification') {
                  titleLabel = 'Certification Name';
                  titlePlaceholder = 'e.g. AWS Certified Solutions Architect';
                  statusOptions = CERTIFICATION_STATUS_OPTIONS;
                  typeColor = 'text-green-700 bg-green-50 border-green-200';
                  typeIcon = <Award className="w-3.5 h-3.5" />;
                  typeLabel = 'Certification';
                } else if (type === 'exam') {
                  titleLabel = 'Exam Name';
                  titlePlaceholder = 'e.g. GRE, GATE, etc.';
                  statusOptions = EXAM_STATUS_OPTIONS;
                  typeColor = 'text-purple-700 bg-purple-50 border-purple-200';
                  typeIcon = <BookOpen className="w-3.5 h-3.5" />;
                  typeLabel = 'Exam';
                }

                const isSaved = data.isSaved;
                const name = data.name || '';
                const status = (data as any).status || '';
                const details = data.details || '';

                const handleUpdate = (updates: any) => {
                  if (type === 'project') updateProject(index, updates);
                  if (type === 'certification') updateCertification(index, updates);
                  if (type === 'exam') updateExam(index, updates);
                };

                const handleRemove = () => {
                  if (type === 'project') removeProject(index);
                  if (type === 'certification') removeCertification(index);
                  if (type === 'exam') removeExam(index);
                };

                return (
                  <div key={`${type}-${index}`} className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4 relative group">
                    {isSaved ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider mb-2 ${typeColor}`}>
                              {typeIcon}
                              {typeLabel}
                            </div>
                            <h4 className="text-base font-bold text-[#2c4869]">{name}</h4>
                            {status && (
                              <span className="inline-block mt-1 px-2 py-1 bg-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider rounded-md">
                                {status}
                              </span>
                            )}
                          </div>
                        </div>
                        {details && <p className="text-sm text-slate-600 whitespace-pre-wrap">{details}</p>}
                      </div>
                    ) : (
                      <>
                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider mb-2 ${typeColor}`}>
                          {typeIcon}
                          {typeLabel}
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-[#2c4869]/60 uppercase tracking-widest">{titleLabel} <span className="text-red-500 ml-1">*</span></label>
                          <input 
                            type="text"
                            value={name}
                            onChange={(e) => handleUpdate({ name: e.target.value })}
                            placeholder={titlePlaceholder}
                            disabled={readOnly}
                            className={`w-full px-3 py-2 rounded-lg border ${getError(`${type}Name_${index}`) ? 'border-red-300 bg-red-50' : 'border-slate-200'} text-sm font-bold outline-none focus:ring-1 focus:ring-[#f58434] bg-white`}
                          />
                          {getError(`${type}Name_${index}`) && <p className="text-red-500 text-xs font-bold mt-1">{getError(`${type}Name_${index}`)}</p>}
                        </div>

                        {name.trim().length > 0 && (
                          <div className="animate-in slide-in-from-top-1 duration-200 space-y-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-[#2c4869]/60 uppercase tracking-widest">Status <span className="text-red-500 ml-1">*</span></label>
                              <select
                                value={status}
                                onChange={(e) => handleUpdate({ status: e.target.value })}
                                disabled={readOnly}
                                className={`w-full px-3 py-2 rounded-lg border ${getError(`${type}Status_${index}`) ? 'border-red-300 bg-red-50' : 'border-slate-200'} text-sm font-bold outline-none focus:ring-1 focus:ring-[#f58434] bg-white`}
                              >
                                <option value="" disabled>Select status</option>
                                {statusOptions.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                              {getError(`${type}Status_${index}`) && <p className="text-red-500 text-xs font-bold mt-1">{getError(`${type}Status_${index}`)}</p>}
                            </div>

                            {status && (
                              <div className="space-y-1 animate-in slide-in-from-top-1 duration-200">
                                <label className="text-[10px] font-black text-[#2c4869]/60 uppercase tracking-widest">Add details (optional)</label>
                                <AutoTextarea 
                                  value={details}
                                  onChange={(e) => handleUpdate({ details: e.target.value })}
                                  placeholder="Year, Score, Additional Notes, etc."
                                  disabled={readOnly}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {!readOnly && (
                      <div className="pt-3 flex justify-end gap-2 border-t border-slate-200/60 mt-4">
                        {!isSaved && (
                          <button
                            onClick={() => {
                              if (name.trim().length === 0 && status.trim().length === 0) {
                                handleRemove();
                              } else {
                                handleUpdate({ isSaved: true });
                              }
                            }}
                            className="px-4 py-2 text-slate-500 bg-slate-100 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                          >
                            Cancel
                          </button>
                        )}
                        {!isSaved && (
                          <button
                            onClick={() => handleUpdate({ isSaved: true })}
                            disabled={name.trim().length === 0 || status.trim().length === 0}
                            className="px-4 py-2 bg-[#f58434] text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-[#f58434]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Save
                          </button>
                        )}
                        {isSaved && (
                          <>
                            <DeleteButton 
                              onDelete={handleRemove} 
                              hasContent={name.trim().length > 0 || status.trim().length > 0 || details.trim().length > 0} 
                            />
                            <button
                              onClick={() => handleUpdate({ isSaved: false })}
                              className="flex items-center gap-1.5 px-4 py-2 bg-white text-[#2c4869] border border-slate-200 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-slate-50 hover:border-[#2c4869]/30 shadow-sm transition-all active:scale-95"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default MilestoneForm;

