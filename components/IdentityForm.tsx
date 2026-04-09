
import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Profile } from '../types';
import { TypeformSlide, TypeformNav, TypeformToggleGroup, typeformInputClass, typeformLabelClass, formFieldErrorClass } from './TypeformSlide';

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

const IDENTITY_TF_STEPS = 5;
const EMAIL_DOMAIN_SUGGESTIONS = ['gmail.com', 'outlook.com', 'yahoo.com'];
const STRICT_EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@(gmail\.com|yahoo\.com|outlook\.com)$/i;

const IdentityForm: React.FC<Props> = ({
  profile,
  updateProfile,
  readOnly,
  validationErrors = {} as Record<string, string>,
  typeform,
  typeformResumeEdit = false,
  onCompleteSection,
  onBackFromFirst,
}) => {
  const [firstNameTouched, setFirstNameTouched] = useState(false);
  const [lastNameTouched, setLastNameTouched] = useState(false);
  const [step, setStep] = useState(0);
  const [attemptedNext, setAttemptedNext] = useState(false);
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | null>(null);

  const fullName = (profile.fullName || '').trim();
  const nameParts = fullName ? fullName.split(/\s+/) : [];
  const firstName = nameParts[0] || '';
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
  const fullNameInvalid = !!validationErrors.fullName;
  const showFirstNameError = fullNameInvalid && (!firstName || firstNameTouched);
  const showLastNameError = fullNameInvalid && (!lastName || lastNameTouched);
  const emailValue = profile.email || '';
  const atIndex = emailValue.indexOf('@');
  const emailPrefix = atIndex >= 0 ? emailValue.slice(0, atIndex) : emailValue;
  const emailQuery = atIndex >= 0 ? emailValue.slice(atIndex + 1).toLowerCase() : '';
  const filteredEmailDomains = EMAIL_DOMAIN_SUGGESTIONS.filter((d) => d.startsWith(emailQuery));
  const hasEmailText = emailValue.trim().length > 0;
  const isEmailValid = STRICT_EMAIL_REGEX.test(emailValue.trim());

  const updateName = (nextFirst: string, nextLast: string) => {
    updateProfile({ fullName: `${nextFirst} ${nextLast}`.trim() });
  };

  useEffect(() => {
    if (!typeform || readOnly) return;
    const t = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(t);
  }, [step, typeform, readOnly]);

  const canAdvance = (s: number): boolean => {
    setAttemptedNext(true);
    if (s === 0) return firstName.trim().length > 0;
    if (s === 1) return lastName.trim().length > 0;
    if (s === 2) return true;
    if (s === 3) return isEmailValid;
    if (s === 4) return profile.location.trim().length > 0;
    return true;
  };

  const goNext = () => {
    if (!canAdvance(step)) return;
    setAttemptedNext(false);
    if (step < IDENTITY_TF_STEPS - 1) setStep(step + 1);
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
    const emailErr = attemptedNext && step === 3 && !profile.email.trim();
    const locErr = attemptedNext && step === 4 && !profile.location.trim();
    const emailValidationMessage =
      validationErrors.email ||
      (emailErr ? 'Email is required' : null) ||
      (hasEmailText && !isEmailValid ? 'Please enter a valid email address (e.g., name@gmail.com)' : null);

    return (
      <div className="min-h-[50vh] flex flex-col justify-center px-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6">
          {step + 1} / {IDENTITY_TF_STEPS}
        </p>
        <AnimatePresence mode="wait">
          {step === 0 && (
            <TypeformSlide slideKey={0}>
              <label className={typeformLabelClass}>
                What&apos;s your first name? <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-slate-500 mb-6">We&apos;ll use this across your STEM profile.</p>
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type="text"
                value={firstName}
                onChange={(e) => updateName(e.target.value, lastName)}
                onBlur={() => setFirstNameTouched(true)}
                onKeyDown={onKeyDown}
                placeholder="Type your answer…"
                className={typeformInputClass(!!showFirstNameError)}
              />
              {showFirstNameError && <p className={formFieldErrorClass}>This field is required</p>}
              {attemptedNext && !firstName.trim() && <p className={formFieldErrorClass}>Please enter your first name</p>}
              <TypeformNav showBack={step > 0} onBack={goBack} onNext={goNext} nextDisabled={!firstName.trim()} />
            </TypeformSlide>
          )}
          {step === 1 && (
            <TypeformSlide slideKey={1}>
              <label className={typeformLabelClass}>
                And your last name? <span className="text-red-500">*</span>
              </label>
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type="text"
                value={lastName}
                onChange={(e) => updateName(firstName, e.target.value)}
                onBlur={() => setLastNameTouched(true)}
                onKeyDown={onKeyDown}
                placeholder="Type your answer…"
                className={typeformInputClass(!!showLastNameError)}
              />
              {showLastNameError && <p className={formFieldErrorClass}>This field is required</p>}
              {attemptedNext && !lastName.trim() && <p className={formFieldErrorClass}>Please enter your last name</p>}
              <TypeformNav showBack onBack={goBack} onNext={goNext} nextDisabled={!lastName.trim()} />
            </TypeformSlide>
          )}
          {step === 2 && (
            <TypeformSlide slideKey={2}>
              <label className={typeformLabelClass}>How do you identify?</label>
              <p className="text-sm text-slate-500 mb-6">Optional — helps us address you respectfully.</p>
              <TypeformToggleGroup
                columns={2}
                value={profile.gender}
                onSelect={(value) => {
                  updateProfile({ gender: value });
                  if (!typeformResumeEdit) setTimeout(() => setStep(3), 120);
                }}
                options={[
                  { label: 'Male', value: 'Male' },
                  { label: 'Female', value: 'Female' },
                  { label: 'Other', value: 'Other' },
                ]}
              />
              <TypeformNav
                showBack
                onBack={goBack}
                onNext={goNext}
                hideNext={!typeformResumeEdit}
              />
            </TypeformSlide>
          )}
          {step === 3 && (
            <TypeformSlide slideKey={3}>
              <label className={typeformLabelClass}>
                What&apos;s your email? <span className="text-red-500">*</span>
              </label>
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type="email"
                value={profile.email}
                onChange={(e) => {
                  updateProfile({ email: e.target.value });
                  setShowEmailSuggestions(e.target.value.includes('@'));
                }}
                onKeyDown={onKeyDown}
                onFocus={() => setShowEmailSuggestions(emailValue.includes('@'))}
                placeholder="name@gmail.com"
                className={typeformInputClass(!!validationErrors.email || emailErr)}
              />
              {showEmailSuggestions && filteredEmailDomains.length > 0 && emailPrefix.trim().length > 0 && (
                <div className="mt-2 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  {filteredEmailDomains.map((domain) => (
                    <button
                      key={domain}
                      type="button"
                      onClick={() => {
                        updateProfile({ email: `${emailPrefix}@${domain}` });
                        setShowEmailSuggestions(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-[#2c4869] hover:bg-slate-50"
                    >
                      {emailPrefix}@{domain}
                    </button>
                  ))}
                </div>
              )}
              {emailValidationMessage && <p className={formFieldErrorClass}>{emailValidationMessage}</p>}
              <TypeformNav
                showBack
                onBack={goBack}
                onNext={goNext}
                nextDisabled={!isEmailValid}
                hideNext={!isEmailValid}
              />
            </TypeformSlide>
          )}
          {step === 4 && (
            <TypeformSlide slideKey={4}>
              <label className={typeformLabelClass}>
                Where are you based? <span className="text-red-500">*</span>
              </label>
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type="text"
                value={profile.location}
                onChange={(e) => updateProfile({ location: e.target.value })}
                onKeyDown={onKeyDown}
                placeholder="City, state or region"
                className={typeformInputClass(!!validationErrors.location || locErr)}
              />
              {(validationErrors.location || locErr) && (
                <p className={formFieldErrorClass}>{validationErrors.location || 'Location is required'}</p>
              )}
              <TypeformNav showBack onBack={goBack} onNext={goNext} nextLabel="Continue" nextDisabled={!profile.location.trim()} />
            </TypeformSlide>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={`space-y-6 animate-in fade-in duration-500 ${readOnly ? 'opacity-60 pointer-events-none' : ''}`}>
      <div className="space-y-6 transition-all duration-300">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-[#2c4869] mb-2 tracking-tight">First Name <span className="text-red-500 ml-1">*</span></label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => updateName(e.target.value, lastName)}
              onBlur={() => setFirstNameTouched(true)}
              placeholder="e.g. Ananya"
              disabled={readOnly}
              className={`w-full px-4 py-3 rounded-xl border ${validationErrors.fullName ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-200 focus:ring-2 focus:ring-[#f58434]'} focus:border-transparent outline-none transition-all disabled:bg-slate-50 font-medium`}
            />
            {showFirstNameError && <p className={formFieldErrorClass}>This field is required</p>}
          </div>
          <div>
            <label className="block text-sm font-bold text-[#2c4869] mb-2 tracking-tight">Last Name <span className="text-red-500 ml-1">*</span></label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => updateName(firstName, e.target.value)}
              onBlur={() => setLastNameTouched(true)}
              placeholder="e.g. Iyer"
              disabled={readOnly}
              className={`w-full px-4 py-3 rounded-xl border ${validationErrors.fullName ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-200 focus:ring-2 focus:ring-[#f58434]'} focus:border-transparent outline-none transition-all disabled:bg-slate-50 font-medium`}
            />
            {showLastNameError && <p className={formFieldErrorClass}>This field is required</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(!readOnly || profile.gender) && (
            <div>
              <label className="block text-sm font-bold text-[#2c4869] mb-2 tracking-tight">Gender Identity</label>
              <select 
                value={profile.gender}
                onChange={(e) => updateProfile({ gender: e.target.value })}
                disabled={readOnly}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#f58434] focus:border-transparent outline-none transition-all disabled:bg-slate-50 font-medium text-sm"
              >
                <option value="">Select Gender</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Transgender">Transgender</option>
                <option value="Prefer not to say">Prefer not to say</option>
                <option value="Other">Other</option>
              </select>
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-bold text-[#2c4869] mb-2 tracking-tight">Email address</label>
          <input 
            type="email" 
            value={profile.email}
            onChange={(e) => updateProfile({ email: e.target.value })}
            placeholder="e.g. name@university.edu"
            disabled={readOnly}
            className={`w-full px-4 py-3 rounded-xl border ${validationErrors.email ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-200 focus:ring-2 focus:ring-[#f58434]'} focus:border-transparent outline-none transition-all disabled:bg-slate-50 font-medium`}
          />
          {profile.email.trim().length > 0 && !STRICT_EMAIL_REGEX.test(profile.email.trim()) && (
            <p className={formFieldErrorClass}>Please enter a valid email address (e.g., name@gmail.com)</p>
          )}
          {validationErrors.email && <p className={formFieldErrorClass}>{validationErrors.email}</p>}
        </div>
        <div>
          <label className="block text-sm font-bold text-[#2c4869] mb-2 tracking-tight">Current location</label>
          <input 
            type="text" 
            value={profile.location}
            onChange={(e) => updateProfile({ location: e.target.value })}
            placeholder="e.g. Pune, Maharashtra"
            disabled={readOnly}
            className={`w-full px-4 py-3 rounded-xl border ${validationErrors.location ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-200 focus:ring-2 focus:ring-[#f58434]'} focus:border-transparent outline-none transition-all disabled:bg-slate-50 font-medium`}
          />
          {validationErrors.location && <p className={formFieldErrorClass}>{validationErrors.location}</p>}
        </div>
      </div>
    </div>
  );
};

export default IdentityForm;
