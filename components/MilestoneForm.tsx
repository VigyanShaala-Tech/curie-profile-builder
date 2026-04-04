
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { AnimatePresence } from 'motion/react';
import { Pencil, FolderGit2, Award, BookOpen } from 'lucide-react';
import { TypeformSlide, TypeformNav, TypeformToggleGroup, typeformInputClass, typeformLabelClass } from './TypeformSlide';
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
  typeform?: boolean;
  /** When user opened this section via "Edit" on a completed summary — toggles require explicit Next. */
  typeformResumeEdit?: boolean;
  onCompleteSection?: () => void;
  onBackFromFirst?: () => void;
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

type DraftPointer = { type: EntryType; index: number } | null;

const findFirstUnsaved = (profile: Profile): DraftPointer => {
  const pi = profile.projects.findIndex(p => p.isSaved !== true);
  if (pi >= 0) return { type: 'project', index: pi };
  const ci = profile.certifications.findIndex(c => c.isSaved !== true);
  if (ci >= 0) return { type: 'certification', index: ci };
  const ei = profile.exams.findIndex(e => e.isSaved !== true);
  if (ei >= 0) return { type: 'exam', index: ei };
  return null;
};

const milestoneMandatoryOk = (profile: Profile) => {
  const hasAny =
    profile.projects.length > 0 || profile.exams.length > 0 || profile.certifications.length > 0;
  if (!hasAny) return false;
  const projectsOk = profile.projects.every(
    p => !p.name.trim() || (p.name.trim() && !!p.status)
  );
  const examsOk = profile.exams.every(e => !e.name.trim() || (e.name.trim() && !!e.status));
  const certsOk = profile.certifications.every(c => !c.name.trim() || (c.name.trim() && !!c.status));
  return projectsOk && examsOk && certsOk;
};

const MilestoneForm: React.FC<Props> = ({
  profile,
  updateProfile,
  readOnly,
  validationErrors = {} as Record<string, string>,
  typeform,
  typeformResumeEdit = false,
  onCompleteSection,
  onBackFromFirst,
}) => {
  const getError = (field: string) => validationErrors[field];

  const updateProject = (index: number, updates: Partial<ProjectDetail>) => {
    if (readOnly) return;
    const next = [...profile.projects];
    next[index] = { ...next[index], ...updates };
    updateProfile({ projects: next });
  };

  const addProject = () => {
    if (readOnly) return;
    setMilestoneStatusShowNext(false);
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
    setMilestoneStatusShowNext(false);
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
    setMilestoneStatusShowNext(false);
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

  const [msStep, setMsStep] = useState(0);
  const [attemptedNext, setAttemptedNext] = useState(false);
  /** True after user taps Edit on a saved row; false when starting a new entry via Add buttons. */
  const [milestoneStatusShowNext, setMilestoneStatusShowNext] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | null>(null);

  const goNextMsRef = useRef<() => void>(() => {});

  const draftPtr = useMemo(() => findFirstUnsaved(profile), [profile.projects, profile.exams, profile.certifications]);

  useEffect(() => {
    if (!typeform || readOnly) return;
    const t = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(t);
  }, [msStep, typeform, readOnly, draftPtr]);

  useEffect(() => {
    if (!typeform || readOnly) return;
    if (msStep >= 1 && msStep <= 3 && !draftPtr) setMsStep(0);
  }, [draftPtr, msStep, typeform, readOnly]);

  const handleMilestoneStep0Next = useCallback(() => {
    if (milestoneMandatoryOk(profile)) setMsStep(4);
    else setAttemptedNext(true);
  }, [profile]);

  useEffect(() => {
    if (!typeform || readOnly) return;
    if (msStep !== 0 && msStep !== 4) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.repeat) return;
      const el = e.target as HTMLElement;
      if (el.closest('button, a[href], [role="button"]')) return;
      e.preventDefault();
      if (msStep === 0) handleMilestoneStep0Next();
      else onCompleteSection?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [typeform, readOnly, msStep, handleMilestoneStep0Next, onCompleteSection]);

  if (typeform && !readOnly) {
    const getDraftEntry = (): UnifiedEntry | null => {
      if (!draftPtr) return null;
      if (draftPtr.type === 'project') {
        const data = profile.projects[draftPtr.index];
        return data ? { type: 'project', index: draftPtr.index, data } : null;
      }
      if (draftPtr.type === 'certification') {
        const data = profile.certifications[draftPtr.index];
        return data ? { type: 'certification', index: draftPtr.index, data } : null;
      }
      const data = profile.exams[draftPtr.index];
      return data ? { type: 'exam', index: draftPtr.index, data } : null;
    };

    const updateDraft = (updates: Partial<ProjectDetail> & Partial<MilestoneDetail>) => {
      if (!draftPtr) return;
      if (draftPtr.type === 'project') updateProject(draftPtr.index, updates);
      else if (draftPtr.type === 'certification') updateCertification(draftPtr.index, updates);
      else updateExam(draftPtr.index, updates);
    };

    const goBackMs = () => {
      setAttemptedNext(false);
      if (msStep > 0) setMsStep(msStep - 1);
      else onBackFromFirst?.();
    };

    const goNextMs = () => {
      if (msStep === 1) {
        setAttemptedNext(true);
        const e = getDraftEntry();
        if (!e || !e.data.name.trim()) return;
        setAttemptedNext(false);
        setMsStep(2);
        return;
      }
      if (msStep === 2) {
        setAttemptedNext(true);
        const e = getDraftEntry();
        if (!e || !(e.data as MilestoneDetail).status) return;
        setAttemptedNext(false);
        setMsStep(3);
        return;
      }
      if (msStep === 3) {
        const e = getDraftEntry();
        if (e) updateDraft({ isSaved: true });
        setAttemptedNext(false);
        setMsStep(0);
        return;
      }
      if (msStep === 4) {
        onCompleteSection?.();
      }
    };

    goNextMsRef.current = goNextMs;

    const entry = getDraftEntry();
    const savedProjects = profile.projects
      .map((p, i) => ({ ...p, index: i }))
      .filter((p: any) => p?.name?.trim() && p.isSaved !== false);
    const savedCertifications = profile.certifications
      .map((c, i) => ({ ...c, index: i }))
      .filter((c: any) => c?.name?.trim() && c.isSaved !== false);
    const savedExams = profile.exams
      .map((e, i) => ({ ...e, index: i }))
      .filter((e: any) => e?.name?.trim() && e.isSaved !== false);

    const editSpecificEntry = (type: EntryType, index: number) => {
      setAttemptedNext(false);
      setMilestoneStatusShowNext(true);
      if (type === 'project') {
        updateProfile({
          projects: profile.projects.map((p: any, i: number) => ({ ...p, isSaved: i !== index })),
          certifications: profile.certifications.map((c: any) => ({ ...c, isSaved: true })),
          exams: profile.exams.map((e: any) => ({ ...e, isSaved: true })),
        });
      } else if (type === 'certification') {
        updateProfile({
          projects: profile.projects.map((p: any) => ({ ...p, isSaved: true })),
          certifications: profile.certifications.map((c: any, i: number) => ({ ...c, isSaved: i !== index })),
          exams: profile.exams.map((e: any) => ({ ...e, isSaved: true })),
        });
      } else {
        updateProfile({
          projects: profile.projects.map((p: any) => ({ ...p, isSaved: true })),
          certifications: profile.certifications.map((c: any) => ({ ...c, isSaved: true })),
          exams: profile.exams.map((e: any, i: number) => ({ ...e, isSaved: i !== index })),
        });
      }
      setTimeout(() => setMsStep(1), 120);
    };

    let titleLabel = '';
    let titlePlaceholder = '';
    let statusOptions: string[] = [];
    let typeLabel = '';
    if (entry) {
      if (entry.type === 'project') {
        titleLabel = 'Project title';
        titlePlaceholder = 'e.g. Rainfall prediction model';
        statusOptions = PROJECT_STATUS_OPTIONS;
        typeLabel = 'Project';
      } else if (entry.type === 'certification') {
        titleLabel = 'Certification name';
        titlePlaceholder = 'e.g. AWS Solutions Architect';
        statusOptions = CERTIFICATION_STATUS_OPTIONS;
        typeLabel = 'Certification';
      } else {
        titleLabel = 'Exam name';
        titlePlaceholder = 'e.g. GATE, GRE';
        statusOptions = EXAM_STATUS_OPTIONS;
        typeLabel = 'Exam';
      }
    }

    return (
      <div className="min-h-[50vh] flex flex-col justify-center px-1 pb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6">
          {msStep === 4 ? 'Done' : `Step ${msStep + 1}`}
        </p>
        <AnimatePresence mode="wait">
          {msStep === 0 && (
            <TypeformSlide slideKey="ms0">
              <label className={typeformLabelClass}>Add a project, certification, or exam</label>
              <p className="text-sm text-slate-500 mb-8">Pick one to start. You can add more later.</p>
              {hasAnyError && <p className="text-red-500 text-sm mb-4">Add at least one achievement to continue</p>}
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => {
                    addProject();
                    setMsStep(1);
                    setAttemptedNext(false);
                  }}
                  className="flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-blue-200 bg-blue-50/50 text-blue-800 font-bold hover:bg-blue-50"
                >
                  <FolderGit2 className="w-5 h-5" />
                  Add project
                </button>
                <button
                  type="button"
                  onClick={() => {
                    addCertification();
                    setMsStep(1);
                    setAttemptedNext(false);
                  }}
                  className="flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 text-emerald-800 font-bold hover:bg-emerald-50"
                >
                  <Award className="w-5 h-5" />
                  Add certification
                </button>
                <button
                  type="button"
                  onClick={() => {
                    addExam();
                    setMsStep(1);
                    setAttemptedNext(false);
                  }}
                  className="flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-violet-200 bg-violet-50/50 text-violet-800 font-bold hover:bg-violet-50"
                >
                  <BookOpen className="w-5 h-5" />
                  Add exam
                </button>
              </div>
              <div className="mt-5 space-y-4">
                <div className="space-y-2">
                  {savedProjects.map((p: any) => (
                    <div key={`proj-${p.index}`} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#2c4869] truncate">Project Title: {p.name}</p>
                        <p className="text-xs text-slate-600">Status: {p.status || '—'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => editSpecificEntry('project', p.index)}
                        className="ml-3 text-xs font-bold text-[#2c4869] underline underline-offset-2"
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {savedCertifications.map((c: any) => (
                    <div key={`cert-${c.index}`} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#2c4869] truncate">Certification Name: {c.name}</p>
                        <p className="text-xs text-slate-600">Status / Completion: {c.status || '—'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => editSpecificEntry('certification', c.index)}
                        className="ml-3 text-xs font-bold text-[#2c4869] underline underline-offset-2"
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {savedExams.map((e: any) => (
                    <div key={`exam-${e.index}`} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#2c4869] truncate">Exam Name: {e.name}</p>
                        <p className="text-xs text-slate-600">Score / Status: {e.status || '—'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => editSpecificEntry('exam', e.index)}
                        className="ml-3 text-xs font-bold text-[#2c4869] underline underline-offset-2"
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <TypeformNav
                showBack={!!onBackFromFirst}
                onBack={goBackMs}
                onNext={handleMilestoneStep0Next}
                nextLabel={milestoneMandatoryOk(profile) ? 'Continue' : 'Next'}
              />
              {attemptedNext && msStep === 0 && !milestoneMandatoryOk(profile) && (
                <p className="text-red-500 text-sm mt-2">Choose a type above or finish a draft entry</p>
              )}
            </TypeformSlide>
          )}

          {msStep === 1 && entry && (
            <TypeformSlide slideKey="ms1">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">{typeLabel}</p>
              <label className={typeformLabelClass}>
                {titleLabel} <span className="text-red-500">*</span>
              </label>
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type="text"
                value={entry.data.name || ''}
                onChange={(e) => updateDraft({ name: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return;
                  e.preventDefault();
                  goNextMs();
                }}
                placeholder={titlePlaceholder}
                className={typeformInputClass(attemptedNext && !entry.data.name.trim())}
              />
              {attemptedNext && !entry.data.name.trim() && (
                <p className="text-red-500 text-sm mt-2">Name is required</p>
              )}
              <TypeformNav showBack onBack={goBackMs} onNext={goNextMs} nextDisabled={!entry.data.name.trim()} />
            </TypeformSlide>
          )}

          {msStep === 2 && entry && (
            <TypeformSlide slideKey="ms2">
              <label className={typeformLabelClass}>
                Status for “{entry.data.name.trim() || 'this entry'}” <span className="text-red-500">*</span>
              </label>
              <TypeformToggleGroup
                value={(entry.data as MilestoneDetail).status || ''}
                onSelect={(value) => {
                  updateDraft({ status: value });
                  setAttemptedNext(false);
                  if (!typeformResumeEdit) setTimeout(() => setMsStep(3), 120);
                }}
                options={statusOptions.map((opt) => ({ label: opt, value: opt }))}
              />
              {attemptedNext && !(entry.data as MilestoneDetail).status && (
                <p className="text-red-500 text-sm mt-2">Please select a status</p>
              )}
              <TypeformNav
                showBack
                onBack={goBackMs}
                onNext={goNextMs}
                hideNext={!(typeformResumeEdit || milestoneStatusShowNext)}
                nextDisabled={!(entry.data as MilestoneDetail).status}
              />
            </TypeformSlide>
          )}

          {msStep === 3 && entry && (
            <TypeformSlide slideKey="ms3">
              <label className={typeformLabelClass}>Any extra details? (optional)</label>
              <p className="text-sm text-slate-500 mb-6">Scores, dates, links — whatever helps.</p>
              <textarea
                value={entry.data.details || ''}
                onChange={(e) => updateDraft({ details: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    goNextMs();
                  }
                }}
                placeholder="Optional notes"
                rows={4}
                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 text-[#2c4869] outline-none focus:border-[#f58434] text-base"
              />
              <TypeformNav showBack onBack={goBackMs} onNext={goNextMs} nextLabel="Save entry" />
            </TypeformSlide>
          )}

          {msStep === 4 && (
            <TypeformSlide slideKey="ms4">
              <label className={typeformLabelClass}>Ready for the next section?</label>
              <p className="text-sm text-slate-500 mb-8">You can edit milestones anytime from the section list.</p>
              <TypeformNav showBack onBack={() => setMsStep(0)} onNext={goNextMs} nextLabel="Continue" />
            </TypeformSlide>
          )}
        </AnimatePresence>

        
      </div>
    );
  }

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

