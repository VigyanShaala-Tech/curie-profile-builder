
import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Profile } from '../types';
import { DEGREE_OPTIONS, STEM_HIERARCHY } from '../constants';
import { TypeformSlide, TypeformNav, TypeformToggleGroup, typeformInputClass, typeformLabelClass } from './TypeformSlide';

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

const ACADEMIC_TF_STEPS = 8;

const AcademicForm: React.FC<Props> = ({
  profile,
  updateProfile,
  readOnly,
  validationErrors = {} as Record<string, string>,
  typeform,
  typeformResumeEdit = false,
  onCompleteSection,
  onBackFromFirst,
}) => {
  const resumeEdit = typeformResumeEdit;
  const topLevels = Object.keys(STEM_HIERARCHY);
  const categories = profile.topLevelCategory ? [...Object.keys(STEM_HIERARCHY[profile.topLevelCategory]), 'Other'] : [];
  const subFields = (profile.topLevelCategory && profile.specializationCategory && profile.specializationCategory !== 'Other') 
    ? [...STEM_HIERARCHY[profile.topLevelCategory][profile.specializationCategory], 'Other'] 
    : (profile.specializationCategory ? ['Other'] : []);

  const [step, setStep] = useState(0);
  const [attemptedNext, setAttemptedNext] = useState(false);
  const [currentCgpa, setCurrentCgpa] = useState('');
  const [currentPercentage, setCurrentPercentage] = useState('');
  const [cgpaInputError, setCgpaInputError] = useState('');
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | null>(null);

  useEffect(() => {
    const raw = (profile.cgpa || '').trim();
    const cgpaMatch = raw.match(/CGPA:\s*([0-9]+(?:\.[0-9]+)?)/i);
    const pctMatch = raw.match(/Percentage:\s*([0-9]+(?:\.[0-9]+)?)/i);
    if (cgpaMatch || pctMatch) {
      setCurrentCgpa(cgpaMatch?.[1] || '');
      setCurrentPercentage(pctMatch?.[1] || '');
      return;
    }
    if (raw) {
      const num = Number(raw.replace('%', ''));
      if (!Number.isNaN(num) && num <= 10) {
        setCurrentCgpa(String(num));
        setCurrentPercentage('');
      } else if (!Number.isNaN(num) && num <= 100) {
        setCurrentPercentage(String(num));
        setCurrentCgpa('');
      }
    }
  }, []);

  const syncCgpaPercentage = (nextCgpa: string, nextPercentage: string) => {
    const safeCgpa = nextCgpa.trim();
    const safePct = nextPercentage.trim();
    if (!safeCgpa && !safePct) {
      updateProfile({ cgpa: '' });
      return;
    }
    if (safeCgpa && safePct) {
      updateProfile({ cgpa: `CGPA: ${safeCgpa} | Percentage: ${safePct}` });
      return;
    }
    if (safeCgpa) {
      updateProfile({ cgpa: `CGPA: ${safeCgpa}` });
      return;
    }
    updateProfile({ cgpa: `Percentage: ${safePct}` });
  };

  useEffect(() => {
    if (!typeform || readOnly) return;
    const t = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(t);
  }, [step, typeform, readOnly]);

  const validateCurrent = (): boolean => {
    setAttemptedNext(true);
    switch (step) {
      case 0:
        return !!profile.academicStatus;
      case 1:
        return profile.collegeName.trim().length > 0;
      case 2:
        return !!profile.degreeType;
      case 3:
        if (profile.academicStatus === 'studying') return !!profile.yearOfStudy;
        if (profile.academicStatus === 'graduated') return (profile.graduationYear || '').trim().length > 0;
        return false;
      case 4:
        return (currentCgpa.trim().length > 0 || currentPercentage.trim().length > 0) && !cgpaInputError;
      case 5:
        return !!profile.topLevelCategory;
      case 6:
        if (!profile.specializationCategory) return false;
        if (profile.specializationCategory === 'Other') return profile.customCategory.trim().length > 0;
        return true;
      case 7:
        if (!profile.specialization) return false;
        if (profile.specialization === 'Other') return profile.customSpecialization.trim().length > 0;
        return true;
      default:
        return true;
    }
  };

  const goNext = () => {
    if (!validateCurrent()) return;
    setAttemptedNext(false);
    if (step < ACADEMIC_TF_STEPS - 1) setStep(step + 1);
    else onCompleteSection?.();
  };

  const goBack = () => {
    setAttemptedNext(false);
    if (step > 0) setStep(step - 1);
    else onBackFromFirst?.();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      goNext();
    }
  };

  if (typeform && !readOnly) {
    return (
      <div className="min-h-[50vh] flex flex-col justify-center px-1 pb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6">
          {step + 1} / {ACADEMIC_TF_STEPS}
        </p>
        <AnimatePresence mode="wait">
          {step === 0 && (
            <TypeformSlide slideKey={0}>
              <label className={typeformLabelClass}>
                What&apos;s your academic status? <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-slate-500 mb-8">Choose the option that fits you best.</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => {
                    updateProfile({ academicStatus: 'studying', yearOfStudy: profile.yearOfStudy === 'Alumnus' ? '' : profile.yearOfStudy });
                    setAttemptedNext(false);
                    if (!resumeEdit) setTimeout(() => setStep(1), 120);
                  }}
                  className={`flex-1 py-4 rounded-2xl border-2 font-bold text-base transition-all ${
                    profile.academicStatus === 'studying'
                      ? 'border-[#2c4869] bg-[#2c4869] text-white shadow-md'
                      : 'border-slate-200 text-[#2c4869] hover:border-[#2c4869]/40'
                  }`}
                >
                  Currently studying
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateProfile({ academicStatus: 'graduated', yearOfStudy: 'Alumnus' });
                    setAttemptedNext(false);
                    if (!resumeEdit) setTimeout(() => setStep(1), 120);
                  }}
                  className={`flex-1 py-4 rounded-2xl border-2 font-bold text-base transition-all ${
                    profile.academicStatus === 'graduated'
                      ? 'border-[#2c4869] bg-[#2c4869] text-white shadow-md'
                      : 'border-slate-200 text-[#2c4869] hover:border-[#2c4869]/40'
                  }`}
                >
                  Graduated / Alumni
                </button>
              </div>
              {attemptedNext && !profile.academicStatus && (
                <p className="text-red-500 text-sm mt-4">Please select one option</p>
              )}
              {validationErrors.academicStatus && (
                <p className="text-red-500 text-sm mt-2">{validationErrors.academicStatus}</p>
              )}
              <TypeformNav
                showBack={!!onBackFromFirst}
                onBack={goBack}
                onNext={goNext}
                hideNext={!resumeEdit}
                nextDisabled={!profile.academicStatus}
              />
            </TypeformSlide>
          )}

          {step === 1 && (
            <TypeformSlide slideKey={1}>
              <label className={typeformLabelClass}>
                {profile.academicStatus === 'studying' ? 'Which college or university?' : 'Where did you graduate from?'}{' '}
                <span className="text-red-500">*</span>
              </label>
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type="text"
                value={profile.collegeName}
                onChange={(e) => updateProfile({ collegeName: e.target.value })}
                onKeyDown={onKeyDown}
                placeholder="Institution name"
                className={typeformInputClass(!!validationErrors.collegeName || (attemptedNext && !profile.collegeName.trim()))}
              />
              {(validationErrors.collegeName || (attemptedNext && !profile.collegeName.trim())) && (
                <p className="text-red-500 text-sm mt-2">{validationErrors.collegeName || 'Required'}</p>
              )}
              <TypeformNav showBack onBack={goBack} onNext={goNext} nextDisabled={!profile.collegeName.trim()} />
            </TypeformSlide>
          )}

          {step === 2 && (
            <TypeformSlide slideKey={2}>
              <label className={typeformLabelClass}>
                {profile.academicStatus === 'studying' ? 'Degree you’re pursuing' : 'Highest degree completed'}{' '}
                <span className="text-red-500">*</span>
              </label>
              <TypeformToggleGroup
                columns={2}
                value={profile.degreeType}
                onSelect={(value) => {
                  updateProfile({ degreeType: value });
                  setAttemptedNext(false);
                  setTimeout(() => setStep(3), 120);
                }}
                options={DEGREE_OPTIONS.map((opt) => ({ label: opt, value: opt }))}
              />
              {(validationErrors.degreeType || (attemptedNext && !profile.degreeType)) && (
                <p className="text-red-500 text-sm mt-2">{validationErrors.degreeType || 'Required'}</p>
              )}
              <TypeformNav
                showBack
                onBack={goBack}
                onNext={goNext}
                hideNext={!resumeEdit}
                nextDisabled={!profile.degreeType}
              />
            </TypeformSlide>
          )}

          {step === 3 && (
            <TypeformSlide slideKey={3}>
              {profile.academicStatus === 'studying' ? (
                <>
                  <label className={typeformLabelClass}>
                    Current year of study <span className="text-red-500">*</span>
                  </label>
                  <TypeformToggleGroup
                    columns={2}
                    value={profile.yearOfStudy}
                    onSelect={(value) => {
                      updateProfile({ yearOfStudy: value });
                      setAttemptedNext(false);
                      if (!resumeEdit) setTimeout(() => setStep(4), 120);
                    }}
                    options={[1, 2, 3, 4, 5].map((y) => ({
                      label: `${y}${y === 1 ? 'st' : y === 2 ? 'nd' : y === 3 ? 'rd' : 'th'} Year`,
                      value: `${y}${y === 1 ? 'st' : y === 2 ? 'nd' : y === 3 ? 'rd' : 'th'} Year`,
                    }))}
                  />
                  {(validationErrors.yearOfStudy || (attemptedNext && !profile.yearOfStudy)) && (
                    <p className="text-red-500 text-sm mt-2">{validationErrors.yearOfStudy || 'Required'}</p>
                  )}
                </>
              ) : (
                <>
                  <label className={typeformLabelClass}>
                    Year of graduation <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={inputRef as React.RefObject<HTMLInputElement>}
                    type="text"
                    value={profile.graduationYear || ''}
                    onChange={(e) => updateProfile({ graduationYear: e.target.value })}
                    onKeyDown={onKeyDown}
                    placeholder="e.g. 2023"
                    className={typeformInputClass(!!validationErrors.graduationYear || (attemptedNext && !(profile.graduationYear || '').trim()))}
                  />
                  {(validationErrors.graduationYear || (attemptedNext && !(profile.graduationYear || '').trim())) && (
                    <p className="text-red-500 text-sm mt-2">{validationErrors.graduationYear || 'Required'}</p>
                  )}
                </>
              )}
              <TypeformNav
                showBack
                onBack={goBack}
                onNext={goNext}
                nextDisabled={
                  profile.academicStatus === 'graduated'
                    ? !(profile.graduationYear || '').trim()
                    : resumeEdit
                    ? !profile.yearOfStudy
                    : false
                }
                nextLabel={profile.academicStatus === 'studying' ? 'Continue' : 'Next'}
                hideNext={profile.academicStatus === 'studying' && !resumeEdit}
              />
            </TypeformSlide>
          )}

          {step === 4 && (
            <TypeformSlide slideKey={4}>
              <label className={typeformLabelClass}>
                {profile.academicStatus === 'studying' ? 'Current CGPA / Percentage' : 'Final CGPA / Percentage'} <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-slate-500 mb-4">Please provide either your CGPA or Percentage.</p>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-[#2c4869]">Current CGPA (0–10)</label>
                    <input
                      type="text"
                      value={currentCgpa}
                      onChange={(e) => {
                        const value = e.target.value.trim();
                        if (value === '') {
                          setCurrentCgpa('');
                          setCgpaInputError('');
                          syncCgpaPercentage('', currentPercentage);
                          return;
                        }
                        if (!/^\d*\.?\d*$/.test(value)) {
                          setCgpaInputError('Enter a valid CGPA between 0 and 10');
                          return;
                        }
                        const num = Number(value);
                        if (Number.isNaN(num) || num < 0 || num > 10) {
                          setCgpaInputError('Enter a valid CGPA between 0 and 10');
                          return;
                        }
                        setCgpaInputError('');
                        setCurrentCgpa(value);
                        syncCgpaPercentage(value, currentPercentage);
                      }}
                      onBlur={() => {
                        if (!currentCgpa.trim()) return;
                        const fixed = Number(currentCgpa).toFixed(1);
                        setCurrentCgpa(fixed);
                        syncCgpaPercentage(fixed, currentPercentage);
                      }}
                      onKeyDown={onKeyDown}
                      inputMode="decimal"
                      placeholder="0.0"
                      className="w-20 text-right text-sm font-bold text-[#f58434] bg-transparent border border-[#f58434]/30 rounded-md px-2 py-1 outline-none focus:border-[#f58434]"
                    />
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={0.1}
                    value={currentCgpa || '0'}
                    onChange={(e) => {
                      const value = Number(e.target.value).toFixed(1);
                      setCgpaInputError('');
                      setCurrentCgpa(value);
                      syncCgpaPercentage(value, currentPercentage);
                    }}
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter') return;
                      e.preventDefault();
                      goNext();
                    }}
                    className="w-full accent-[#f58434] h-2 rounded-lg cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-[#2c4869]">Current Percentage (0–100)</label>
                  <input
                    ref={inputRef as React.RefObject<HTMLInputElement>}
                    type="text"
                    value={currentPercentage}
                    onChange={(e) => {
                      const sanitized = e.target.value.replace(/[^\d.]/g, '');
                      const num = Number(sanitized);
                      if (sanitized === '' || (!Number.isNaN(num) && num <= 100)) {
                        setCurrentPercentage(sanitized);
                        syncCgpaPercentage(currentCgpa, sanitized);
                      }
                    }}
                    onKeyDown={onKeyDown}
                    placeholder="e.g. 78"
                    className={`${typeformInputClass(!!validationErrors.cgpa || (attemptedNext && !(currentCgpa.trim() || currentPercentage.trim())))} mt-1`}
                  />
                </div>
              </div>
              {cgpaInputError && (
                <p className="text-red-500 text-sm mt-2">{cgpaInputError}</p>
              )}
              {(validationErrors.cgpa || (attemptedNext && !(currentCgpa.trim() || currentPercentage.trim()))) && (
                <p className="text-red-500 text-sm mt-2">{validationErrors.cgpa || 'Please provide either your CGPA or Percentage.'}</p>
              )}
              <TypeformNav
                showBack
                onBack={goBack}
                onNext={goNext}
                nextDisabled={!(currentCgpa.trim() || currentPercentage.trim()) || !!cgpaInputError}
              />
            </TypeformSlide>
          )}

          {step === 5 && (
            <TypeformSlide slideKey={5}>
              <label className={typeformLabelClass}>
                Broad STEM stream <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-slate-500 mb-6">Pick the family of subjects closest to yours.</p>
              <div className="flex flex-col gap-3">
                {topLevels.map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => {
                      updateProfile({
                        topLevelCategory: level,
                        specializationCategory: '',
                        specialization: '',
                        customCategory: '',
                        customSpecialization: '',
                      });
                      setAttemptedNext(false);
                      if (!resumeEdit) setTimeout(() => setStep(6), 120);
                    }}
                    className={`w-full py-4 rounded-2xl border-2 text-left px-5 font-bold transition-all ${
                      profile.topLevelCategory === level
                        ? 'border-[#f58434] bg-[#f58434]/10 text-[#2c4869]'
                        : 'border-slate-200 text-[#2c4869] hover:border-[#f58434]/40'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              {attemptedNext && !profile.topLevelCategory && (
                <p className="text-red-500 text-sm mt-4">Please choose a stream</p>
              )}
              {validationErrors.topLevelCategory && (
                <p className="text-red-500 text-sm mt-2">{validationErrors.topLevelCategory}</p>
              )}
              <TypeformNav
                showBack
                onBack={goBack}
                onNext={goNext}
                hideNext={!resumeEdit}
                nextDisabled={!profile.topLevelCategory}
              />
            </TypeformSlide>
          )}

          {step === 6 && (
            <TypeformSlide slideKey={6}>
              <label className={typeformLabelClass}>
                Subject area <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-slate-500 mb-4">
                {profile.academicStatus === 'studying'
                  ? 'The area you’re most interested in.'
                  : 'The area you specialized in.'}
              </p>
              <TypeformToggleGroup
                columns={2}
                value={profile.specializationCategory}
                onSelect={(value) => {
                  updateProfile({ specializationCategory: value, specialization: '', customCategory: '', customSpecialization: '' });
                  setAttemptedNext(false);
                  if (value !== 'Other' && !resumeEdit) {
                    setTimeout(() => setStep(7), 120);
                  }
                }}
                options={categories.map((cat) => ({ label: cat, value: cat }))}
              />
              {profile.specializationCategory === 'Other' && (
                <input
                  type="text"
                  value={profile.customCategory}
                  onChange={(e) => updateProfile({ customCategory: e.target.value })}
                  onKeyDown={onKeyDown}
                  placeholder="Describe your subject area"
                  className={`${typeformInputClass(!!(attemptedNext && !profile.customCategory.trim()))} mt-6`}
                />
              )}
              {(validationErrors.specializationCategory || (attemptedNext && !profile.specializationCategory)) && (
                <p className="text-red-500 text-sm mt-2">{validationErrors.specializationCategory || 'Required'}</p>
              )}
              {attemptedNext && profile.specializationCategory === 'Other' && !profile.customCategory.trim() && (
                <p className="text-red-500 text-sm mt-2">Please specify your subject area</p>
              )}
              <TypeformNav
                showBack
                onBack={goBack}
                onNext={goNext}
                nextLabel={profile.specializationCategory === 'Other' ? 'Next' : 'Next'}
                nextDisabled={
                  profile.specializationCategory === 'Other'
                    ? !profile.customCategory.trim()
                    : resumeEdit
                    ? !profile.specializationCategory
                    : false
                }
                hideNext={profile.specializationCategory !== 'Other' && !resumeEdit}
              />
            </TypeformSlide>
          )}

          {step === 7 && (
            <TypeformSlide slideKey={7}>
              <label className={typeformLabelClass}>
                Specialization <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-slate-500 mb-4">
                {profile.academicStatus === 'studying'
                  ? 'What you’re pursuing or exploring in depth.'
                  : 'What you specialized in.'}
              </p>
              <TypeformToggleGroup
                columns={2}
                value={profile.specialization}
                onSelect={(value) => {
                  updateProfile({ specialization: value, customSpecialization: '' });
                  setAttemptedNext(false);
                  if (value !== 'Other' && !resumeEdit) {
                    setTimeout(() => onCompleteSection?.(), 120);
                  }
                }}
                options={subFields.map((sub) => ({ label: sub, value: sub }))}
              />
              {profile.specialization === 'Other' && (
                <input
                  type="text"
                  value={profile.customSpecialization}
                  onChange={(e) => updateProfile({ customSpecialization: e.target.value })}
                  onKeyDown={onKeyDown}
                  placeholder="Describe your specialization"
                  className={`${typeformInputClass(!!(attemptedNext && !profile.customSpecialization.trim()))} mt-6`}
                />
              )}
              {(validationErrors.specialization || (attemptedNext && !profile.specialization)) && (
                <p className="text-red-500 text-sm mt-2">{validationErrors.specialization || 'Required'}</p>
              )}
              {attemptedNext && profile.specialization === 'Other' && !profile.customSpecialization.trim() && (
                <p className="text-red-500 text-sm mt-2">Please specify your specialization</p>
              )}
              <TypeformNav
                showBack
                onBack={goBack}
                onNext={goNext}
                nextLabel="Continue"
                nextDisabled={
                  profile.specialization === 'Other'
                    ? !profile.customSpecialization.trim()
                    : resumeEdit
                    ? !profile.specialization
                    : false
                }
                hideNext={profile.specialization !== 'Other' && !resumeEdit}
              />
            </TypeformSlide>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={`space-y-6 animate-in slide-in-from-right-4 duration-500 pb-10 ${readOnly ? 'opacity-60 pointer-events-none' : ''}`}>
      <div className="space-y-6 transition-all duration-300">
        
        <div>
          <label className="block text-sm font-bold text-[#2c4869] mb-2 tracking-tight">What is your current academic status? <span className="text-red-500 ml-1">*</span></label>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={readOnly}
              onClick={() => updateProfile({ academicStatus: 'studying', yearOfStudy: profile.yearOfStudy === 'Alumnus' ? '' : profile.yearOfStudy })}
              className={`flex-1 py-3 rounded-xl border font-black text-sm transition-all ${
                profile.academicStatus === 'studying' 
                ? 'bg-[#2c4869] border-[#2c4869] text-white shadow-md' 
                : 'bg-white border-slate-200 text-[#2c4869] hover:border-[#2c4869]/30'
              }`}
            >
              Currently Studying
            </button>
            <button
              type="button"
              disabled={readOnly}
              onClick={() => updateProfile({ academicStatus: 'graduated', yearOfStudy: 'Alumnus' })}
              className={`flex-1 py-3 rounded-xl border font-black text-sm transition-all ${
                profile.academicStatus === 'graduated' 
                ? 'bg-[#2c4869] border-[#2c4869] text-white shadow-md' 
                : 'bg-white border-slate-200 text-[#2c4869] hover:border-[#2c4869]/30'
              }`}
            >
              Graduated / Alumni
            </button>
          </div>
          {validationErrors.academicStatus && <p className="text-red-500 text-xs mt-1">{validationErrors.academicStatus}</p>}
        </div>

        {profile.academicStatus && (
          <>
            <div>
              <label className="block text-sm font-bold text-[#2c4869] mb-2 tracking-tight">
                {profile.academicStatus === 'studying' ? 'Current College or University' : 'College or University you graduated from'} <span className="text-red-500 ml-1">*</span>
              </label>
              <input 
                type="text" 
                value={profile.collegeName}
                onChange={(e) => updateProfile({ collegeName: e.target.value })}
                placeholder="e.g. Lucknow University, IIT K, or your Institution"
                disabled={readOnly}
                className={`w-full px-4 py-3 rounded-xl border ${validationErrors.collegeName ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-200 focus:ring-2 focus:ring-[#f58434]'} outline-none transition-all font-medium`}
              />
              {validationErrors.collegeName && <p className="text-red-500 text-xs mt-1">{validationErrors.collegeName}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-[#2c4869] mb-2 tracking-tight">
                  {profile.academicStatus === 'studying' ? 'Degree being pursued' : 'Highest degree completed'} <span className="text-red-500 ml-1">*</span>
                </label>
                <select 
                  value={profile.degreeType}
                  onChange={(e) => updateProfile({ degreeType: e.target.value })}
                  disabled={readOnly}
                  className={`w-full px-4 py-3 rounded-xl border ${validationErrors.degreeType ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-200 focus:ring-2 focus:ring-[#f58434]'} outline-none transition-all text-sm font-medium`}
                >
                  <option value="">Select Degree</option>
                  {DEGREE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                {validationErrors.degreeType && <p className="text-red-500 text-xs mt-1">{validationErrors.degreeType}</p>}
              </div>
              
              {profile.academicStatus === 'studying' && (!readOnly || profile.yearOfStudy) && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-bold text-[#2c4869] mb-2 tracking-tight">Current year of study</label>
                  <select 
                    value={profile.yearOfStudy}
                    onChange={(e) => updateProfile({ yearOfStudy: e.target.value })}
                    disabled={readOnly}
                    className={`w-full px-4 py-3 rounded-xl border ${validationErrors.yearOfStudy ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-200 focus:ring-2 focus:ring-[#f58434]'} outline-none transition-all text-sm font-medium`}
                  >
                    <option value="">Select Year</option>
                    {[1, 2, 3, 4, 5].map(y => (
                      <option key={y} value={`${y}${y === 1 ? 'st' : y === 2 ? 'nd' : y === 3 ? 'rd' : 'th'} Year`}>
                        {y}{y === 1 ? 'st' : y === 2 ? 'nd' : y === 3 ? 'rd' : 'th'} Year
                      </option>
                    ))}
                  </select>
                  {validationErrors.yearOfStudy && <p className="text-red-500 text-xs mt-1">{validationErrors.yearOfStudy}</p>}
                </div>
              )}

              {profile.academicStatus === 'graduated' && (!readOnly || profile.graduationYear) && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-bold text-[#2c4869] mb-2 tracking-tight">Year of graduation</label>
                  <input 
                    type="text" 
                    value={profile.graduationYear || ''}
                    onChange={(e) => updateProfile({ graduationYear: e.target.value })}
                    placeholder="e.g. 2023"
                    disabled={readOnly}
                    className={`w-full px-4 py-3 rounded-xl border ${validationErrors.graduationYear ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-200 focus:ring-2 focus:ring-[#f58434]'} outline-none transition-all font-medium`}
                  />
                  {validationErrors.graduationYear && <p className="text-red-500 text-xs mt-1">{validationErrors.graduationYear}</p>}
                </div>
              )}
            </div>

            {(!readOnly || profile.cgpa) && (
              <div>
                <label className="block text-sm font-bold text-[#2c4869] mb-2 tracking-tight">
                  {profile.academicStatus === 'studying' ? 'Current CGPA / Percentage' : 'Final CGPA / Percentage'}
                </label>
                <p className="text-xs text-slate-500 mb-2">Please provide either your CGPA or Percentage.</p>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-[#2c4869]">Current CGPA (0–10)</label>
                      <span className="text-xs font-bold text-[#f58434]">{currentCgpa || '0.0'}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      step={0.1}
                      value={currentCgpa || '0'}
                      disabled={readOnly}
                      onChange={(e) => {
                        const value = Number(e.target.value).toFixed(1);
                        setCurrentCgpa(value);
                        syncCgpaPercentage(value, currentPercentage);
                      }}
                      className="w-full accent-[#f58434] h-2 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#2c4869] mb-1">Current Percentage (0–100)</label>
                    <input
                      type="text"
                      value={currentPercentage}
                      onChange={(e) => {
                        const sanitized = e.target.value.replace(/[^\d.]/g, '');
                        const num = Number(sanitized);
                        if (sanitized === '' || (!Number.isNaN(num) && num <= 100)) {
                          setCurrentPercentage(sanitized);
                          syncCgpaPercentage(currentCgpa, sanitized);
                        }
                      }}
                      placeholder="e.g. 78"
                      disabled={readOnly}
                      className={`w-full px-4 py-3 rounded-xl border ${validationErrors.cgpa ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-200 focus:ring-2 focus:ring-[#f58434]'} outline-none transition-all font-medium`}
                    />
                  </div>
                </div>
                {validationErrors.cgpa && <p className="text-red-500 text-xs mt-1">{validationErrors.cgpa}</p>}
              </div>
            )}

            <div className={`p-5 bg-white rounded-2xl border ${validationErrors.topLevelCategory ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-100'} shadow-sm space-y-5 transition-all`}>
              <div>
                <label className={`block text-xs font-black uppercase tracking-widest mb-3 ${validationErrors.topLevelCategory ? 'text-red-500' : 'text-[#2c4869]/40'}`}>Broad STEM Stream <span className="text-red-500 ml-1">*</span></label>
                <div className="flex gap-3">
                  {topLevels.map(level => (
                    <button
                      key={level}
                      type="button"
                      disabled={readOnly}
                      onClick={() => updateProfile({ 
                        topLevelCategory: level, 
                        specializationCategory: '', 
                        specialization: '',
                        customCategory: '',
                        customSpecialization: ''
                      })}
                      className={`flex-1 py-3 rounded-xl border font-black text-sm transition-all ${
                        profile.topLevelCategory === level 
                        ? 'bg-[#f58434] border-[#f58434] text-white shadow-md' 
                        : 'bg-white border-slate-200 text-[#2c4869] hover:border-[#f58434]/30'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                {validationErrors.topLevelCategory && <p className="text-red-500 text-xs mt-1">{validationErrors.topLevelCategory}</p>}
              </div>
              
              {profile.topLevelCategory && (
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-[#2c4869] mb-2 tracking-tight">
                    Subject area
                    <span className="block text-[10px] font-semibold text-[#2c4869]/60 normal-case tracking-normal mt-0.5">
                      {profile.academicStatus === 'studying' ? "The one you're most interested in" : "The one you specialized in"}
                    </span>
                  </label>
                  <select 
                    value={profile.specializationCategory}
                    onChange={(e) => updateProfile({ specializationCategory: e.target.value, specialization: '', customCategory: '', customSpecialization: '' })}
                    disabled={readOnly}
                    className={`w-full px-4 py-3 rounded-xl border ${validationErrors.specializationCategory ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-200 focus:ring-2 focus:ring-[#f58434]'} outline-none transition-all text-sm font-medium`}
                  >
                    <option value="">Select Area</option>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  {validationErrors.specializationCategory && <p className="text-red-500 text-xs mt-1">{validationErrors.specializationCategory}</p>}

                  {profile.specializationCategory === 'Other' && (
                    <div className="animate-in slide-in-from-top-2 duration-300">
                      <label className="block text-[10px] font-black text-[#f58434] uppercase tracking-widest mb-1.5 ml-1">Please specify your subject area</label>
                      <input 
                        type="text" 
                        value={profile.customCategory}
                        onChange={(e) => updateProfile({ customCategory: e.target.value })}
                        placeholder="e.g. Quantum Computing, Ethnobotany..."
                        disabled={readOnly}
                        className="w-full px-4 py-3 rounded-xl border border-[#f58434]/30 bg-[#f58434]/5 focus:ring-2 focus:ring-[#f58434] outline-none transition-all font-medium text-sm"
                      />
                    </div>
                  )}
                </div>
              )}

              {profile.specializationCategory && (
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-[#2c4869] mb-2 tracking-tight">
                    Specialization
                    <span className="block text-[10px] font-semibold text-[#2c4869]/60 normal-case tracking-normal mt-0.5">
                      {profile.academicStatus === 'studying' ? "The one you would like to pursue or you are currently pursuing" : "The one you specialized in"}
                    </span>
                  </label>
                  <select 
                    value={profile.specialization}
                    onChange={(e) => updateProfile({ specialization: e.target.value, customSpecialization: '' })}
                    disabled={readOnly}
                    className={`w-full px-4 py-3 rounded-xl border ${validationErrors.specialization ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-200 focus:ring-2 focus:ring-[#f58434]'} outline-none transition-all text-sm font-medium`}
                  >
                    <option value="">Select Specialization</option>
                    {subFields.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                  </select>
                  {validationErrors.specialization && <p className="text-red-500 text-xs mt-1">{validationErrors.specialization}</p>}

                  {profile.specialization === 'Other' && (
                    <div className="animate-in slide-in-from-top-2 duration-300">
                      <label className="block text-[10px] font-black text-[#f58434] uppercase tracking-widest mb-1.5 ml-1">Please specify your specialization</label>
                      <input 
                        type="text" 
                        value={profile.customSpecialization}
                        onChange={(e) => updateProfile({ customSpecialization: e.target.value })}
                        placeholder="e.g. Deep Learning for Healthcare, Polymer Chemistry..."
                        disabled={readOnly}
                        className="w-full px-4 py-3 rounded-xl border border-[#f58434]/30 bg-[#f58434]/5 focus:ring-2 focus:ring-[#f58434] outline-none transition-all font-medium text-sm"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AcademicForm;
