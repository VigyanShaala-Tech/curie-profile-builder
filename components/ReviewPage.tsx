
import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Pencil } from 'lucide-react';
import { Profile, Section } from '../types';
import { REFLECTION_PROMPTS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface Props {
  profile: Profile;
  completeness: number;
  isReturningUser?: boolean;
  setCurrentSection: (s: Section) => void;
  updateProfile: (updates: Partial<Profile>) => void;
}

const VIGYAN_SHAALA_LOGO = '/images/log.png';
const STORAGE_KEY = 'vs_reflection_profile';
const SYNC_COMPLETE_KEY = 'profile_sync_completed';

const ReviewPage: React.FC<Props> = ({
  profile,
  completeness,
  isReturningUser = false,
  setCurrentSection,
  updateProfile,
}) => {
  const isOutOfSync = useMemo(() => {
    if (!profile.lastSyncedAt || !profile.lastUpdatedAt) return true;
    return new Date(profile.lastUpdatedAt) > new Date(profile.lastSyncedAt);
  }, [profile.lastSyncedAt, profile.lastUpdatedAt]);

  const [isSaved, setIsSaved] = useState(false);
  const [isUpdatingCurie, setIsUpdatingCurie] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [curieSuccess, setCurieSuccess] = useState(profile.lastSyncedAt && !isOutOfSync ? true : false);
  const [showSyncSuccessModal, setShowSyncSuccessModal] = useState(false);
  const [pendingSection, setPendingSection] = useState<Section | null>(null);
  const [syncUserType, setSyncUserType] = useState<'new' | 'returning'>(
    profile.lastSyncedAt ? 'returning' : 'new'
  );
  const [showPreSyncModal, setShowPreSyncModal] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const reviewCardRef = useRef<HTMLDivElement>(null);

  // Update success state if sync status changes
  React.useEffect(() => {
    if (isOutOfSync) {
      setCurieSuccess(false);
    } else if (profile.lastSyncedAt) {
      setCurieSuccess(true);
    }
  }, [isOutOfSync, profile.lastSyncedAt]);

  const confirmEdit = () => {
    if (pendingSection) {
      setCurrentSection(pendingSection);
      setPendingSection(null);
    }
  };

  const formatIST = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return dateStr;
    }
  };

  const incompleteFields = useMemo(() => {
    const missing: { section: Section, label: string, mandatory?: boolean }[] = [];

    // Identity (Mandatory)
    if (!profile.fullName) missing.push({ section: Section.BASIC, label: 'Full Name', mandatory: true });
    if (!profile.whatsappNumber) missing.push({ section: Section.BASIC, label: 'WhatsApp Number', mandatory: true });
    
    // Academic (Mandatory)
    if (!profile.collegeName) missing.push({ section: Section.ACADEMIC, label: 'Institution', mandatory: true });
    if (!profile.degreeType) missing.push({ section: Section.ACADEMIC, label: 'Degree', mandatory: true });
    if (!profile.topLevelCategory) missing.push({ section: Section.ACADEMIC, label: 'Broad STEM Stream', mandatory: true });

    // Expertise Core (At least one required)
    const hasExpertise = 
      profile.subjectSkills.length > 0 || 
      profile.toolSkills.length > 0 || 
      profile.aiSkills.length > 0 || 
      profile.professionalSkills.length > 0 ||
      profile.interests.length > 0;
    
    if (!hasExpertise) missing.push({ section: Section.SKILLS, label: 'At least one Expertise area', mandatory: true });

    // Milestones (At least one required)
    const hasMilestones = 
      profile.projects.length > 0 || 
      profile.exams.length > 0 ||
      profile.certifications.length > 0;

    if (!hasMilestones) missing.push({ section: Section.MILESTONES, label: 'At least one Project/Milestone/Cert', mandatory: true });

    profile.projects.forEach(project => {
      if (!project.name.trim()) missing.push({ section: Section.MILESTONES, label: `Project Title`, mandatory: true });
      if (project.name.trim() && !project.status) missing.push({ section: Section.MILESTONES, label: `Status for ${project.name}`, mandatory: true });
    });
    profile.exams.forEach(exam => {
      if (!exam.name.trim()) missing.push({ section: Section.MILESTONES, label: `Exam Name`, mandatory: true });
      if (exam.name.trim() && !exam.status) missing.push({ section: Section.MILESTONES, label: `Status for ${exam.name}`, mandatory: true });
    });
    profile.certifications.forEach(cert => {
      if (!cert.name.trim()) missing.push({ section: Section.MILESTONES, label: `Certification Name`, mandatory: true });
      if (cert.name.trim() && !cert.status) missing.push({ section: Section.MILESTONES, label: `Status for ${cert.name}`, mandatory: true });
    });

    // Optional fields for completeness tracking (but not mandatory for sync)
    if (!profile.email) missing.push({ section: Section.BASIC, label: 'Email Address' });
    if (!profile.location) missing.push({ section: Section.BASIC, label: 'Current Location' });
    if (!profile.yearOfStudy) missing.push({ section: Section.ACADEMIC, label: 'Year of Study' });
    if (!profile.cgpa) missing.push({ section: Section.ACADEMIC, label: 'CGPA' });

    // Reflections (Optional)
    REFLECTION_PROMPTS.forEach(prompt => {
      if (!profile.reflections[prompt.key] || profile.reflections[prompt.key].trim().length < 5) {
        missing.push({ section: Section.REFLECTIONS, label: prompt.label });
      }
    });

    return missing;
  }, [profile]);

  const hasMandatoryFields = useMemo(() => {
    const hasIdentity = !!profile.fullName && !!profile.whatsappNumber && !!profile.collegeName && !!profile.degreeType && !!profile.topLevelCategory;
    const hasExpertise = 
      profile.subjectSkills.length > 0 || 
      profile.toolSkills.length > 0 || 
      profile.aiSkills.length > 0 || 
      profile.professionalSkills.length > 0 ||
      profile.interests.length > 0;
    const hasMilestones = 
      profile.projects.length > 0 || 
      profile.exams.length > 0 ||
      profile.certifications.length > 0;
    
    const hasValidProjects = profile.projects.every(project => 
      project.name.trim() && project.status
    );
    const hasValidExams = profile.exams.every(exam => 
      exam.name.trim() && exam.status
    );
    const hasValidCerts = profile.certifications.every(cert => 
      cert.name.trim() && cert.status
    );

    return hasIdentity && hasExpertise && hasMilestones && hasValidProjects && hasValidExams && hasValidCerts;
  }, [profile]);

  const isLocked = !hasMandatoryFields;
  const isPdfLocked = isLocked || !profile.lastSyncedAt;

  const nextSectionToComplete = useMemo(() => {
    const firstMissing = incompleteFields.find(f => f.mandatory) || incompleteFields[0];
    return firstMissing ? firstMissing.section : null;
  }, [incompleteFields]);

  const saveLocally = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleUpdateCurie = () => {
    setShowPreSyncModal(true);
  };

  const confirmAndSync = () => {
    setShowPreSyncModal(false);
    executeSync();
  };

  const executeSync = async () => {
    setSyncError(null);
    const now = new Date().toISOString();
    setIsUpdatingCurie(true);
    setCurieSuccess(false);

    try {
      const res = await fetch('/api/profile/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          profile: { ...profile, lastSyncedAt: now },
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        ok?: boolean;
        userType?: string;
        sheetsSkipped?: boolean;
      };

      if (!res.ok) {
        throw new Error(data.error || `Sync failed (${res.status})`);
      }

      if (data.sheetsSkipped) {
        throw new Error(
          'Google Sheets sync was skipped. Please verify server env and restart the backend.'
        );
      }

      const apiUserType =
        data.userType === 'new' || data.userType === 'returning' ? data.userType : null;
      if (!apiUserType) {
        throw new Error(
          'Sync completed but user classification was not returned. Please restart backend and try again.'
        );
      }
      setSyncUserType(apiUserType);

      updateProfile({ lastSyncedAt: now });
      localStorage.setItem(SYNC_COMPLETE_KEY, 'true');
      localStorage.removeItem(STORAGE_KEY);
      setCurieSuccess(true);
      setShowSyncSuccessModal(true);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Sync failed';
      setSyncError(message);
    } finally {
      setIsUpdatingCurie(false);
    }
  };

  const generateAndDownloadPdf = useCallback(async () => {
    const el = reviewCardRef.current;
    if (!el) return;
    setIsGeneratingPdf(true);
    try {
      const noPrintEls = el.querySelectorAll<HTMLElement>('.no-print');
      noPrintEls.forEach((node) => (node.style.display = 'none'));

      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const canvas = await html2canvas(el, {
        scale: isMobile ? 1.5 : 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: Math.max(el.scrollWidth, 900),
      });

      noPrintEls.forEach((node) => (node.style.display = ''));

      const imgWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      const contentWidth = imgWidth - margin * 2;
      const imgHeight = (canvas.height * contentWidth) / canvas.width;

      const pdf = new jsPDF('p', 'mm', 'a4');
      let remaining = imgHeight;

      while (remaining > 0) {
        if (remaining !== imgHeight) pdf.addPage();
        const usable = pageHeight - margin * 2;
        const sourceY = ((imgHeight - remaining) / imgHeight) * canvas.height;
        const sliceH = Math.min(usable, remaining);
        const sourceSliceH = (sliceH / imgHeight) * canvas.height;

        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sourceSliceH;
        const ctx = sliceCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceSliceH, 0, 0, canvas.width, sourceSliceH);
        }
        const sliceData = sliceCanvas.toDataURL('image/png');
        pdf.addImage(sliceData, 'PNG', margin, margin, contentWidth, sliceH);
        remaining -= usable;
      }

      const name = (profile.fullName || 'profile').replace(/\s+/g, '_');
      const fileName = `${name}_STEM_Profile.pdf`;

      if (isMobile) {
        const blob = pdf.output('blob');
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 500);
      } else {
        pdf.save(fileName);
      }
    } catch (err) {
      console.error('PDF generation failed:', err);
      try { window.print(); } catch { /* no-op */ }
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [profile.fullName]);

  const downloadPdf = () => {
    if (isOutOfSync) {
      if (window.confirm("You have unsynced changes. Are you sure you want to download the PDF without syncing?")) {
        generateAndDownloadPdf();
      }
    } else {
      generateAndDownloadPdf();
    }
  };

  const handleRedirect = async () => {
    const url =
      syncUserType === 'new'
        ? 'https://wa.me/919403509920?text=redirectnewprofile'
        : 'https://wa.me/919403509920?text=redirectupdatedprofile';

    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch { /* best-effort */ }

    localStorage.setItem(SYNC_COMPLETE_KEY, 'true');
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.clear();

    window.location.href = url;
  };

  const InfoBlock = ({ label, value }: { label: string, value: string | string[] }) => (
    <div className="mb-4 p-2 -m-2">
      <div className="mb-1">
        <span className="text-[10px] font-black text-[#2c4869]/40 uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-[#2c4869] text-sm font-black break-words leading-relaxed">
        {Array.isArray(value) 
          ? (value.length > 0 ? value.join(', ') : <span className="text-slate-300 italic text-xs font-medium">Not specified</span>) 
          : ((value ?? '') || <span className="text-slate-300 italic text-xs font-medium">Not specified</span>)}
      </div>
    </div>
  );

  const SectionHeader = ({ title, section }: { title: string, section: Section }) => (
    <div className="flex justify-between items-center mb-6 border-b border-[#f58434]/10 pb-2">
      <h3 className="text-xs font-black text-[#f58434] uppercase tracking-widest">{title}</h3>
      <button
        type="button"
        onClick={() => setPendingSection(section)}
        className="flex items-center gap-1.5 text-[10px] font-black text-[#f58434] uppercase no-print hover:text-[#f58434]/80 transition-colors"
      >
        <Pencil size={10} strokeWidth={3} />
        <span>Edit</span>
      </button>
    </div>
  );

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
    <div className="space-y-8 animate-in zoom-in-95 duration-500 pb-20">
      {isReturningUser && (
        <div className="bg-[#2c4869] text-white rounded-2xl px-5 py-4 shadow-lg">
          <p className="text-sm font-black">Welcome back! Your saved profile has been loaded.</p>
          <p className="text-xs font-medium text-white/85 mt-1">
            Review or edit your information below.
          </p>
        </div>
      )}
      <div ref={reviewCardRef} className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-2xl overflow-hidden relative print:shadow-none print:border-none print:p-0">
        <div className="flex justify-end mb-6 print:mb-8">
           <img 
            src={VIGYAN_SHAALA_LOGO} 
            alt="VigyanShaala" 
            className="h-10 object-contain opacity-80"
           />
        </div>

        <section className="mb-10">
          <SectionHeader title="Identity" section={Section.BASIC} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
            <InfoBlock label="Full Name" value={profile.fullName} />
            <InfoBlock label="Gender & Pronouns" value={[profile.gender, profile.pronouns].filter(Boolean).join(' / ')} />
            <InfoBlock label="WhatsApp Number" value={profile.whatsappNumber} />
            <InfoBlock label="Location" value={profile.location} />
          </div>
        </section>

        <section className="mb-10">
          <SectionHeader title="Academics" section={Section.ACADEMIC} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
            <InfoBlock label="Institution" value={profile.collegeName} />
            <InfoBlock label="Degree Path" value={`${profile.degreeType} in ${specDisplay}`} />
            <InfoBlock label="Year of Study" value={profile.yearOfStudy === 'Alumnus' && profile.graduationYear ? `Alumnus (Graduated: ${profile.graduationYear})` : profile.yearOfStudy} />
            <InfoBlock label="CGPA" value={profile.cgpa} />
          </div>
        </section>

        <section className="mb-10">
          <SectionHeader title="Skills & Expertise" section={Section.SKILLS} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
            <InfoBlock label="Academic Interests" value={profile.interests} />
            <InfoBlock label="Subject Expertise" value={profile.subjectSkills} />
            <InfoBlock label="Technical Tools & IT" value={profile.toolSkills} />
            <InfoBlock label="AI & Data Skills" value={profile.aiSkills} />
            <InfoBlock label="Professional Skills" value={profile.professionalSkills} />
          </div>
        </section>

        <section className="mb-10">
          <SectionHeader title="Achievements & Milestones" section={Section.MILESTONES} />
          <div className="space-y-2">
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
                const name = e.name;
                return e.status ? `${name} - ${e.status}${e.details ? ` (${e.details})` : ''}` : name;
              })} 
            />
            <InfoBlock 
              label="Certifications" 
              value={profile.certifications.map(c => {
                const name = c.name;
                return c.status ? `${name} - ${c.status}${c.details ? ` (${c.details})` : ''}` : name;
              })} 
            />
          </div>
        </section>

        <section className="mb-10">
          <SectionHeader title="Your STEM Mindset" section={Section.REFLECTIONS} />
          <div className="space-y-6">
            <InfoBlock label="The Purpose" value={profile.reflections.impactPurpose} />
            <InfoBlock label="Your Superpower" value={profile.reflections.strengths} />
            <InfoBlock label="The Curiosity" value={profile.reflections.curiosity} />
            <InfoBlock label="The Gritty Growth" value={profile.reflections.grittyGrowth} />
            <InfoBlock label="The Spark" value={profile.reflections.spark} />
            <InfoBlock label="The Opportunities" value={profile.reflections.opportunities} />
            <InfoBlock label="The Threats" value={profile.reflections.threats} />
          </div>
        </section>

        {/* Growth Mindset Card */}
        <div className="mb-10 p-6 bg-gradient-to-br from-[#2c4869] to-[#1a2e44] rounded-3xl text-white shadow-xl relative overflow-hidden no-print">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#f58434]/10 rounded-full -ml-12 -mb-12 blur-xl" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#f58434] rounded-xl shadow-lg shadow-[#f58434]/20">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h4 className="text-lg font-black uppercase tracking-tight">Your Professional Home</h4>
            </div>
            <p className="text-sm font-medium text-white/80 leading-relaxed mb-4">
              Think of this as your living record of growth. STEM is dynamic, and so are you. Whenever you hit a milestone, update it here to keep your career path clear.
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {['Track Progress', 'Stay Relevant', 'Refine Goals'].map((tag) => (
                <div key={tag} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/60">
                  <div className="w-1 h-1 bg-[#f58434] rounded-full" />
                  {tag}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6 no-print">
          {isLocked && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-6 animate-in slide-in-from-top-4 duration-500">
              <div className="flex items-start gap-4">
                <div className="bg-amber-500 text-white p-2 rounded-xl">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-black text-[#2c4869] uppercase leading-tight">Complete Level 1 to Continue</h4>
                  <p className="text-sm font-medium text-[#2c4869]/70 mt-1 mb-4">Sync unlocks once all mandatory Level 1 fields are complete.</p>
                  
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-[#2c4869]/40 uppercase tracking-widest">Missing Mandatory Fields:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {incompleteFields.filter(f => f.mandatory).map((field, idx) => (
                        <button 
                          key={idx}
                          onClick={() => setCurrentSection(field.section)}
                          className="flex items-center gap-2 text-left bg-white border-2 border-red-100 px-3 py-2 rounded-xl text-[11px] font-black text-red-500 hover:border-red-200 transition-all"
                        >
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                          {field.label}
                        </button>
                      ))}
                    </div>
                    
                    {nextSectionToComplete && (
                      <div className="mt-4 p-4 bg-[#2c4869]/5 rounded-2xl border border-[#2c4869]/10">
                        <p className="text-[10px] font-black text-[#2c4869]/60 uppercase tracking-widest mb-2">Suggested Next Step:</p>
                        <button 
                          onClick={() => setCurrentSection(nextSectionToComplete)}
                          className="w-full flex items-center justify-between bg-[#2c4869] text-white px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all"
                        >
                          <span>Go to {nextSectionToComplete} Section</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {isOutOfSync && !isLocked && (
              <div className="bg-[#f58434]/5 border border-[#f58434]/20 rounded-2xl p-4 mb-2 animate-pulse">
                <p className="text-[11px] font-black text-[#f58434] uppercase tracking-tight text-center">
                  ⚠️ {profile.lastSyncedAt ? 'New changes detected. Sync to save updates and unlock PDF' : 'Sync your profile to save all changes'}
                </p>
              </div>
            )}

            <button 
              onClick={handleUpdateCurie}
              disabled={isUpdatingCurie || isLocked}
              className={`w-full py-7 rounded-3xl font-black flex flex-col items-center justify-center gap-1 transition-all shadow-2xl active:scale-[0.98] border-2 ${
                isLocked
                ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : curieSuccess
                ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                : 'bg-[#f58434] text-white hover:opacity-95 border-transparent'
              }`}
            >
              {isUpdatingCurie ? (
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="text-xl uppercase tracking-tight">Syncing & Saving...</span>
                </div>
              ) : curieSuccess ? (
                <div className="animate-in fade-in zoom-in duration-700 text-center px-6 py-2">
                  <div className="flex flex-col items-center justify-center gap-2 mb-3">
                    <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-200">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-2xl font-black uppercase tracking-tight">Profile Synced!</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-emerald-700 leading-tight">
                      Curie now has your latest updates.
                    </p>
                    <p className="text-[11px] font-medium text-emerald-600/80 max-w-[280px] mx-auto leading-relaxed italic">
                      "Your STEM journey grows with you. Come back anytime to add new achievements or refine your goals."
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <span className="text-xl uppercase tracking-tight">
                    {profile.lastSyncedAt ? 'Sync Changes' : 'Sync Profile'}
                  </span>
                  {isLocked && <span className="text-[10px] opacity-60">Complete Level 1 mandatory fields to unlock</span>}
                </>
              )}
            </button>

            {syncError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-center">
                <p className="text-xs font-bold text-red-600 break-words">{syncError}</p>
              </div>
            )}

            {profile.lastSyncedAt && (
              <div className="text-center">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                  Last Synced: {formatIST(profile.lastSyncedAt)} (IST)
                </p>
              </div>
            )}

            <div className="text-center flex flex-col items-center pt-4">
              <p className="text-[10px] text-[#2c4869]/40 font-bold italic mb-1">
                Your data is shared only with Curie for personalized support.
              </p>
              <button 
                onClick={() => window.open('https://vigyanshaala.com/privacy-policy/', '_blank')}
                className="text-[10px] text-[#f58434] hover:text-[#f58434]/80 underline underline-offset-2 transition-colors font-bold"
              >
                Click to know more about our Data Privacy Policy
              </button>
              <div className="mt-6 pt-6 border-t border-slate-100 w-full">
                <p className="text-[10px] text-[#2c4869]/60 font-medium leading-relaxed">
                  <span className="text-[#f58434] font-black uppercase tracking-widest mr-1">Pro Tip:</span> 
                  Curie provides the best guidance when your profile is current. Finished a new course? Built a new project? Update it here to keep your momentum going!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Pre-Sync PDF Download Confirmation Modal */}
      <AnimatePresence>
        {showPreSyncModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#2c4869]/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl border border-slate-100"
            >
              <div className="flex flex-col gap-3">
                <button
                  onClick={async () => { setShowPreSyncModal(false); await generateAndDownloadPdf(); executeSync(); }}
                  disabled={isGeneratingPdf}
                  className="w-full py-4 rounded-2xl bg-[#2c4869] text-white font-black uppercase tracking-widest text-xs hover:bg-[#2c4869]/90 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isGeneratingPdf ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download PDF & Sync Profile
                    </>
                  )}
                </button>
                <button
                  onClick={confirmAndSync}
                  className="w-full py-4 rounded-2xl bg-[#f58434] text-white font-black uppercase tracking-widest text-xs hover:opacity-90 transition-all active:scale-[0.98]"
                >
                  Continue Sync
                </button>
                <button
                  onClick={() => setShowPreSyncModal(false)}
                  className="w-full py-4 rounded-2xl bg-white text-[#2c4869]/40 font-black uppercase tracking-widest text-[10px] hover:text-[#2c4869]/60 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Confirmation Modal */}
      <AnimatePresence>
        {pendingSection && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#2c4869]/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl border border-slate-100"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-[#f58434]/20 text-[#f58434] rounded-2xl flex items-center justify-center">
                  <Pencil className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-[#2c4869] uppercase tracking-tight">Edit Section?</h3>
              </div>
              
              <p className="text-sm font-medium text-[#2c4869]/70 leading-relaxed mb-8">
                Are you sure you want to edit the <span className="text-[#2c4869] font-black">{pendingSection}</span> section? 
                You will be navigated away from this review page.
              </p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={confirmEdit}
                  className="w-full py-4 rounded-2xl bg-[#2c4869] text-white font-black uppercase tracking-widest text-xs hover:bg-[#2c4869]/90 transition-all active:scale-[0.98]"
                >
                  Yes, Edit Section
                </button>
                <button 
                  onClick={() => setPendingSection(null)}
                  className="w-full py-4 rounded-2xl bg-white text-[#2c4869]/40 font-black uppercase tracking-widest text-[10px] hover:text-[#2c4869]/60 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSyncSuccessModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#2c4869]/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              className="bg-white rounded-[32px] p-8 max-w-lg w-full shadow-2xl border border-slate-100"
            >
              <h3 className="text-2xl font-black text-[#2c4869] tracking-tight mb-4">
                Profile has been submitted successfully 🎉
              </h3>
              <p className="text-sm font-medium text-[#2c4869]/60 leading-relaxed mb-4">
                You will now be redirected to WhatsApp.
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6">
                <p className="text-xs font-black text-[#2c4869]/50 uppercase tracking-widest mb-2">
                  Please send the following keyword message:
                </p>
                <p className="text-lg font-black text-[#2c4869] tracking-tight select-all">
                  {syncUserType === 'new' ? 'redirectnewprofile' : 'redirectupdatedprofile'}
                </p>
              </div>
              <button
                onClick={handleRedirect}
                className="w-full py-4 rounded-2xl bg-[#2c4869] text-white font-black uppercase tracking-widest text-xs hover:bg-[#2c4869]/90 transition-all active:scale-[0.98] text-center"
              >
                Continue to Chat on WhatsApp
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReviewPage;
