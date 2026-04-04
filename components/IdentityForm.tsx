
import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Profile } from '../types';
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

const IDENTITY_TF_STEPS = 6;
const EMAIL_DOMAIN_SUGGESTIONS = ['gmail.com', 'outlook.com', 'yahoo.com'];
const COUNTRY_CODES = ['+91', '+1', '+44', '+61', '+971'];
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
  const [whatsappEditable, setWhatsappEditable] = useState(false);
  const [whatsappTouched, setWhatsappTouched] = useState(false);
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);
  const [countryCode, setCountryCode] = useState('+91');
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | null>(null);

  const fullName = (profile.fullName || '').trim();
  const nameParts = fullName ? fullName.split(/\s+/) : [];
  const firstName = nameParts[0] || '';
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
  const fullNameInvalid = !!validationErrors.fullName;
  const showFirstNameError = fullNameInvalid && (!firstName || firstNameTouched);
  const showLastNameError = fullNameInvalid && (!lastName || lastNameTouched);
  const whatsappDigits = (profile.whatsappNumber || '').replace(/\D/g, '').slice(0, 10);
  const whatsappInvalid = whatsappTouched && whatsappDigits.length > 0 && whatsappDigits.length < 10;
  const canAdvanceWhatsapp = whatsappDigits.length === 10;
  const emailValue = profile.email || '';
  const atIndex = emailValue.indexOf('@');
  const emailPrefix = atIndex >= 0 ? emailValue.slice(0, atIndex) : emailValue;
  const emailQuery = atIndex >= 0 ? emailValue.slice(atIndex + 1).toLowerCase() : '';
  const filteredEmailDomains = EMAIL_DOMAIN_SUGGESTIONS.filter((d) => d.startsWith(emailQuery));
  const hasEmailText = emailValue.trim().length > 0;
  const isEmailValid = STRICT_EMAIL_REGEX.test(emailValue.trim());

  useEffect(() => {
    const loc = (profile.location || '').toLowerCase();
    if (loc.includes('india')) setCountryCode('+91');
    else if (loc.includes('usa') || loc.includes('united states')) setCountryCode('+1');
    else if (loc.includes('uk') || loc.includes('united kingdom')) setCountryCode('+44');
    else if (loc.includes('australia')) setCountryCode('+61');
    else if (loc.includes('uae') || loc.includes('dubai') || loc.includes('abu dhabi')) setCountryCode('+971');
  }, [profile.location]);

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
    if (s === 3) return canAdvanceWhatsapp;
    if (s === 4) return isEmailValid;
    if (s === 5) return profile.location.trim().length > 0;
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
    const emailErr = attemptedNext && step === 4 && !profile.email.trim();
    const locErr = attemptedNext && step === 5 && !profile.location.trim();
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
              {showFirstNameError && <p className="text-red-500 text-sm mt-2">This field is required</p>}
              {attemptedNext && !firstName.trim() && <p className="text-red-500 text-sm mt-2">Please enter your first name</p>}
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
              {showLastNameError && <p className="text-red-500 text-sm mt-2">This field is required</p>}
              {attemptedNext && !lastName.trim() && <p className="text-red-500 text-sm mt-2">Please enter your last name</p>}
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
              <label className={typeformLabelClass}>Your WhatsApp number</label>
              <p className="text-sm text-slate-500 mb-6">Linked from your login — we use it for important updates.</p>
              <div className="flex items-center gap-3 border-b-2 border-slate-200 py-4">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-slate-200 text-sm font-semibold text-[#2c4869] bg-white"
                >
                  {COUNTRY_CODES.map((code) => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </select>
                {whatsappEditable ? (
                  <input
                    ref={inputRef as React.RefObject<HTMLInputElement>}
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={whatsappDigits}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                      updateProfile({ whatsappNumber: digits });
                    }}
                    onBlur={() => setWhatsappTouched(true)}
                    onKeyDown={onKeyDown}
                    placeholder="10-digit number"
                    className="w-full text-xl font-medium text-[#2c4869] bg-transparent outline-none"
                  />
                ) : (
                  <span className="text-xl font-medium text-[#2c4869]">{profile.whatsappNumber || '—'}</span>
                )}
                <button
                  type="button"
                  onClick={() => setWhatsappEditable(true)}
                  className="ml-3 text-xs font-bold text-[#2c4869] underline underline-offset-2"
                >
                  Edit
                </button>
              </div>
              <p className="text-red-500 text-xs mt-2">
                This field is autofilled. If you want to edit, please use the edit button.
              </p>
              {whatsappInvalid && <p className="text-red-500 text-sm mt-1">Please enter a valid 10-digit number</p>}
              {validationErrors.whatsappNumber && (
                <p className="text-red-500 text-sm mt-2">{validationErrors.whatsappNumber}</p>
              )}
              <TypeformNav showBack onBack={goBack} onNext={goNext} nextLabel="Continue" nextDisabled={!canAdvanceWhatsapp} />
            </TypeformSlide>
          )}
          {step === 4 && (
            <TypeformSlide slideKey={4}>
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
              {emailValidationMessage && <p className="text-red-500 text-sm mt-2">{emailValidationMessage}</p>}
              <TypeformNav
                showBack
                onBack={goBack}
                onNext={goNext}
                nextDisabled={!isEmailValid}
                hideNext={!isEmailValid}
              />
            </TypeformSlide>
          )}
          {step === 5 && (
            <TypeformSlide slideKey={5}>
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
                <p className="text-red-500 text-sm mt-2">{validationErrors.location || 'Location is required'}</p>
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
            {showFirstNameError && <p className="text-red-500 text-xs mt-1">This field is required</p>}
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
            {showLastNameError && <p className="text-red-500 text-xs mt-1">This field is required</p>}
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
          <label className="block text-sm font-bold text-[#2c4869] mb-2 tracking-tight">WhatsApp Number <span className="text-red-500 ml-1">*</span></label>
          <div className="relative flex items-center gap-2">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="h-[46px] px-2 rounded-xl border border-slate-200 text-sm font-semibold text-[#2c4869] bg-white"
            >
              {COUNTRY_CODES.map((code) => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
            <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold border-r border-slate-200 pr-3">{countryCode}</span>
            <input 
              type="tel" 
              value={whatsappDigits}
              onChange={(e) => {
                if (!whatsappEditable) return;
                const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                updateProfile({ whatsappNumber: digits });
              }}
              onBlur={() => setWhatsappTouched(true)}
              placeholder="10-digit number"
              readOnly={!whatsappEditable}
              inputMode="numeric"
              pattern="[0-9]*"
              className={`w-full pl-16 pr-20 py-3 rounded-xl border ${validationErrors.whatsappNumber || whatsappInvalid ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-200'} ${whatsappEditable ? 'bg-white text-[#2c4869]' : 'bg-slate-100 text-slate-500'} font-medium`}
            />
            <button
              type="button"
              onClick={() => setWhatsappEditable(true)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-[#2c4869] underline underline-offset-2"
            >
              Edit
            </button>
            </div>
          </div>
          <p className="text-red-500 text-xs mt-1">This field is autofilled. If you want to edit, please use the edit button.</p>
          {whatsappInvalid && <p className="text-red-500 text-xs mt-1">Please enter a valid 10-digit number</p>}
          {validationErrors.whatsappNumber && <p className="text-red-500 text-xs mt-1">{validationErrors.whatsappNumber}</p>}
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
            <p className="text-red-500 text-xs mt-1">Please enter a valid email address (e.g., name@gmail.com)</p>
          )}
          {validationErrors.email && <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>}
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
          {validationErrors.location && <p className="text-red-500 text-xs mt-1">{validationErrors.location}</p>}
        </div>
      </div>
    </div>
  );
};

export default IdentityForm;
