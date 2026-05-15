
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useRegisterUiBack } from '../hooks/useRegisterUiBack';
import { pushAppHistoryState } from '../utils/browserBack';
import { AnimatePresence } from 'motion/react';
import { Pencil, FolderGit2, Award, BookOpen, Trash2 } from 'lucide-react';
import { TypeformSlide, TypeformNav, TypeformToggleGroup, typeformInputClass, typeformLabelClass, formFieldErrorClass } from './TypeformSlide';
import { Profile, MilestoneDetail, ProjectDetail } from '../types';
import {
  EXAM_STATUS_OPTIONS,
  CERTIFICATION_STATUS_OPTIONS,
  PROJECT_STATUS_OPTIONS,
  normalizeMilestoneStatus,
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

/** Only `isSaved === false` is an active draft. `undefined` means legacy/saved data (must not shadow a new exam/cert row). */
const findFirstUnsaved = (profile: Profile): DraftPointer => {
  const pi = profile.projects.findIndex((p) => p.isSaved === false);
  if (pi >= 0) return { type: 'project', index: pi };
  const ci = profile.certifications.findIndex((c) => c.isSaved === false);
  if (ci >= 0) return { type: 'certification', index: ci };
  const ei = profile.exams.findIndex((e) => e.isSaved === false);
  if (ei >= 0) return { type: 'exam', index: ei };
  return null;
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
    updateProfile({
      projects: [...profile.projects.map((p) => ({ ...p, isSaved: true })), { name: '', status: '', details: '', isSaved: false }],
      certifications: profile.certifications.map((c) => ({ ...c, isSaved: true })),
      exams: profile.exams.map((e) => ({ ...e, isSaved: true })),
    });
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
    updateProfile({
      exams: [...profile.exams.map((e) => ({ ...e, isSaved: true })), { name: '', status: '', details: '', isSaved: false }],
      projects: profile.projects.map((p) => ({ ...p, isSaved: true })),
      certifications: profile.certifications.map((c) => ({ ...c, isSaved: true })),
    });
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
    updateProfile({
      certifications: [
        ...profile.certifications.map((c) => ({ ...c, isSaved: true })),
        { name: '', status: '', details: '', isSaved: false },
      ],
      projects: profile.projects.map((p) => ({ ...p, isSaved: true })),
      exams: profile.exams.map((e) => ({ ...e, isSaved: true })),
    });
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
  /** Step 0: distinguish missing project vs other milestone validation. */
  const [milestoneStep0Kind, setMilestoneStep0Kind] = useState<'project' | 'mandatory' | null>(null);
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

  /** Any row with a title (project, certification, or exam) — enough to continue to the next section. */
  const savedMilestoneCount = useMemo(
    () =>
      profile.projects.filter((p) => (p?.name || '').trim().length > 0).length +
      profile.certifications.filter((c) => (c?.name || '').trim().length > 0).length +
      profile.exams.filter((e) => (e?.name || '').trim().length > 0).length,
    [profile.projects, profile.certifications, profile.exams]
  );

  const handleMilestoneStep0Next = useCallback(() => {
    if (savedMilestoneCount < 1) {
      setAttemptedNext(true);
      setMilestoneStep0Kind('mandatory');
      return;
    }
    setMilestoneStep0Kind(null);
    setAttemptedNext(false);
    onCompleteSection?.();
  }, [savedMilestoneCount, onCompleteSection]);

  useEffect(() => {
    if (!typeform || readOnly) return;
    if (msStep !== 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.repeat) return;
      const el = e.target as HTMLElement;
      if (el.closest('button, a[href], [role="button"]')) return;
      e.preventDefault();
      handleMilestoneStep0Next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [typeform, readOnly, msStep, handleMilestoneStep0Next]);

  useEffect(() => {
    if (savedMilestoneCount >= 1 && milestoneStep0Kind !== null) {
      setMilestoneStep0Kind(null);
      setAttemptedNext(false);
    }
  }, [savedMilestoneCount, milestoneStep0Kind]);

  const goBackMs = useCallback(() => {
    if (!typeform || readOnly) return;
    setAttemptedNext(false);
    if (msStep > 0) setMsStep(msStep - 1);
    else onBackFromFirst?.();
  }, [typeform, readOnly, msStep, onBackFromFirst]);

  useRegisterUiBack(goBackMs, [goBackMs]);

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

    const entry = getDraftEntry();
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

    const advanceFromStatusSelect = (statusValue: string) => {
      updateDraft({ status: statusValue });
      setAttemptedNext(false);
      const st = normalizeMilestoneStatus(statusValue, statusOptions);
      if (!st.trim() || !statusOptions.includes(st)) {
        setAttemptedNext(true);
        return;
      }
      setMsStep(3);
      pushAppHistoryState({ section: 'milestones', step: 3 });
    };

    const goNextMs = () => {
      if (msStep === 1) {
        setAttemptedNext(true);
        const e = getDraftEntry();
        if (!e || !e.data.name.trim()) return;
        setAttemptedNext(false);
        setMsStep(2);
        pushAppHistoryState({ section: 'milestones', step: 2 });
        return;
      }
      if (msStep === 2) {
        const e = getDraftEntry();
        if (!e) return;
        advanceFromStatusSelect((e.data as MilestoneDetail).status);
        return;
      }
      if (msStep === 3) {
        const e = getDraftEntry();
        if (e) updateDraft({ isSaved: true });
        setAttemptedNext(false);
        setMsStep(0);
        pushAppHistoryState({ section: 'milestones', step: 0 });
        return;
      }
    };

    goNextMsRef.current = goNextMs;

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

    const typeformStatusNormalized = entry
      ? normalizeMilestoneStatus((entry.data as MilestoneDetail).status, statusOptions)
      : '';
    const typeformStatusComplete = !!entry && statusOptions.length > 0 && statusOptions.includes(typeformStatusNormalized);

    return (
      <div className="min-h-[50vh] flex flex-col justify-center px-1 pb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6">
          Step {msStep + 1}
        </p>
        <AnimatePresence mode="wait">
          {msStep === 0 && (
            <TypeformSlide slideKey="ms0">
              <label className={typeformLabelClass}>Add a project, certification, or exam</label>
              <p className="text-sm text-slate-500 mb-8">Pick one to start. You can add more later.</p>
              {hasAnyError && <p className={`${formFieldErrorClass} mb-4`}>Add at least one achievement to continue</p>}
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => {
                    addProject();
                    setMsStep(1);
                    setAttemptedNext(false);
                    setMilestoneStep0Kind(null);
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
                    setMilestoneStep0Kind(null);
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
                    setMilestoneStep0Kind(null);
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
                    <div key={`proj-${p.index}`} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#2c4869] truncate">Project Title: {p.name}</p>
                        <p className="text-xs text-slate-600">Status: {p.status || '—'}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => editSpecificEntry('project', p.index)}
                          className="text-xs font-bold text-[#2c4869] underline underline-offset-2 px-1 py-1"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Remove this project from your profile?')) removeProject(p.index);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          aria-label="Delete project"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {savedCertifications.map((c: any) => (
                    <div key={`cert-${c.index}`} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#2c4869] truncate">Certification Name: {c.name}</p>
                        <p className="text-xs text-slate-600">Status / Completion: {c.status || '—'}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => editSpecificEntry('certification', c.index)}
                          className="text-xs font-bold text-[#2c4869] underline underline-offset-2 px-1 py-1"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Remove this certification from your profile?')) removeCertification(c.index);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          aria-label="Delete certification"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {savedExams.map((e: any) => (
                    <div key={`exam-${e.index}`} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#2c4869] truncate">Exam Name: {e.name}</p>
                        <p className="text-xs text-slate-600">Score / Status: {e.status || '—'}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => editSpecificEntry('exam', e.index)}
                          className="text-xs font-bold text-[#2c4869] underline underline-offset-2 px-1 py-1"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Remove this exam from your profile?')) removeExam(e.index);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          aria-label="Delete exam"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <TypeformNav
                showBack={!!onBackFromFirst}
                onBack={goBackMs}
                onNext={handleMilestoneStep0Next}
                nextLabel={savedMilestoneCount >= 1 ? 'Continue' : 'Next'}
              />
              {attemptedNext && msStep === 0 && milestoneStep0Kind === 'mandatory' && (
                <p className={formFieldErrorClass}>
                  Please add at least one project, certification, or exam (enter a title) to continue.
                </p>
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
                <p className={formFieldErrorClass}>Name is required</p>
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
                value={normalizeMilestoneStatus((entry.data as MilestoneDetail).status, statusOptions)}
                onSelect={(value) => advanceFromStatusSelect(value)}
                options={statusOptions.map((opt) => ({ label: opt, value: opt }))}
              />
              {attemptedNext && !typeformStatusComplete && (
                <p className={formFieldErrorClass}>Please choose a status to continue</p>
              )}
              <TypeformNav
                showBack
                onBack={goBackMs}
                onNext={goNextMs}
                hideNext={!typeformStatusComplete}
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

        </AnimatePresence>

        
      </div>
    );
  }

  return (
    <div className={`space-y-8 animate-in slide-in-from-right-4 duration-500 pb-20 ${readOnly ? 'opacity-60 pointer-events-none' : ''}`}>
      <div className={`space-y-6 transition-all`}>
        {hasAnyError ? (
          <p className={`${formFieldErrorClass} px-4`}>Please add at least one item to your achievements.</p>
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
                const statusRaw = (data as any).status || '';
                const status = normalizeMilestoneStatus(statusRaw, statusOptions);
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
                          {getError(`${type}Name_${index}`) && <p className={formFieldErrorClass}>{getError(`${type}Name_${index}`)}</p>}
                        </div>

                        {name.trim().length > 0 && (
                          <div className="animate-in slide-in-from-top-1 duration-200 space-y-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-[#2c4869]/60 uppercase tracking-widest">Status <span className="text-red-500 ml-0.5">*</span></label>
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
                              {getError(`${type}Status_${index}`) && <p className={formFieldErrorClass}>{getError(`${type}Status_${index}`)}</p>}
                            </div>

                            {name.trim().length > 0 && (
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
                            disabled={name.trim().length === 0 || !statusOptions.includes(status)}
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

