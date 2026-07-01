
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Section, Profile, INITIAL_PROFILE } from './types';
import {
  REFLECTION_PROMPTS,
  SECTION_LEVELS,
  getExpertiseAnsweredCount,
  MIN_EXPERTISE_QUESTIONS,
  PROJECT_STATUS_OPTIONS,
  EXAM_STATUS_OPTIONS,
  CERTIFICATION_STATUS_OPTIONS,
  normalizeMilestoneStatus,
  getMilestoneStatusValidationError,
} from './constants';
import { useProfile } from './context/ProfileContext';
import IdentityForm from './components/IdentityForm';
import AcademicForm from './components/AcademicForm';
import ExpertiseForm from './components/ExpertiseForm';
import MilestoneForm from './components/MilestoneForm';
import ReflectionForm from './components/ReflectionForm';
import ReviewPage from './components/ReviewPage';
import SectionSummary from './components/SectionSummary';
import EmojiBurst from './components/EmojiBurst';
import ChatSettings from './components/ChatSettings';
import { Auth } from './components/Auth';
import JourneyHorizontalTracker from './components/JourneyHorizontalTracker';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { initBrowserBackListener, pushAppHistoryState, replaceAppHistoryState, setUiBackHandler } from './utils/browserBack';

const VIGYAN_SHAALA_LOGO = '/images/log.png';
const STORAGE_KEY = 'vs_reflection_profile';
const SYNC_COMPLETE_KEY = 'profile_sync_completed';
const STRICT_EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@(gmail\.com|yahoo\.com|outlook\.com)$/i;
const LEVEL_1_SECTIONS: Section[] = [Section.BASIC, Section.ACADEMIC, Section.SKILLS, Section.MILESTONES];
const LEVEL_2_SECTIONS: Section[] = [Section.REFLECTIONS, Section.REVIEW];
const JOURNEY_STEPS: Section[] = [Section.BASIC, Section.ACADEMIC, Section.SKILLS, Section.MILESTONES, Section.REFLECTIONS];
const ALL_MAIN_SECTIONS: Section[] = [
  Section.BASIC,
  Section.ACADEMIC,
  Section.SKILLS,
  Section.MILESTONES,
  Section.REFLECTIONS,
  Section.REVIEW,
];

const MILESTONE_EMOJIS: Record<string, string[]> = {
  [Section.BASIC]: ['👤', '✨', '👋', '✅'],
  [Section.ACADEMIC]: ['🎓', '📚', '🧪', '🌟'],
  [Section.SKILLS]: ['🛠️', '💻', '🚀', '🔥'],
  [Section.MILESTONES]: ['🏆', '🏗️', '📜', '✨'],
  [Section.REFLECTIONS]: ['🧠', '💡', '💎', '🌈'],
  [Section.REVIEW]: ['🏁', '🏆', '🎊', '✨']
};

const mergeProfileWithDefaults = (data: any): Profile => {
  if (!data) return INITIAL_PROFILE;
  return {
    ...INITIAL_PROFILE,
    ...data,
    aspirations: { 
      ...INITIAL_PROFILE.aspirations, 
      ...(data.aspirations || {}) 
    },
    reflections: { 
      ...INITIAL_PROFILE.reflections, 
      ...(data.reflections || {}) 
    },
    subjectSkills: Array.isArray(data.subjectSkills) ? data.subjectSkills : [],
    toolSkills: Array.isArray(data.toolSkills) ? data.toolSkills : [],
    aiSkills: Array.isArray(data.aiSkills) ? data.aiSkills : [],
    professionalSkills: Array.isArray(data.professionalSkills) ? data.professionalSkills : [],
        projects: Array.isArray(data.projects)
      ? data.projects.map((p: any) => {
          if (typeof p === 'string') return { name: p, status: '', details: '', isSaved: true };
          return {
            name: p.name || '',
            status: normalizeMilestoneStatus(p.status, PROJECT_STATUS_OPTIONS),
            details: p.details || '',
            isSaved: typeof p.isSaved === 'boolean' ? p.isSaved : true,
          };
        })
      : [],
    exams: Array.isArray(data.exams) 
      ? data.exams.map((e: any) => {
          if (typeof e === 'string') return { name: e, status: '', details: '' };
          return {
            name: e.name || '',
            status: normalizeMilestoneStatus(e.status, EXAM_STATUS_OPTIONS),
            details: e.details || '',
            customName: e.customName || ''
          };
        }) 
      : [],
    certifications: Array.isArray(data.certifications)
      ? data.certifications.map((c: any) => ({
          name: c.name || '',
          status: normalizeMilestoneStatus(c.status, CERTIFICATION_STATUS_OPTIONS),
          details: c.details || '',
          customName: c.customName || ''
        }))
      : [],
    internships: Array.isArray(data.internships) ? data.internships : [],
    volunteering: Array.isArray(data.volunteering) ? data.volunteering : [],
    interests: Array.isArray(data.interests) ? data.interests : [],
  };
};


const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);

  const { profile, setProfile } = useProfile();
  const [visibleSections, setVisibleSections] = useState<Section[]>([Section.BASIC]);
  const [isStarted, setIsStarted] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(false);
  const [savedSections, setSavedSections] = useState<Section[]>([]);
  const [showMilestoneBurst, setShowMilestoneBurst] = useState(false);
  const [currentBurstEmojis, setCurrentBurstEmojis] = useState<string[]>(['✨']);
  const [validationErrors, setValidationErrors] = useState<{ section: Section; fields: Record<string, string> } | null>(null);
  const [skipMessage, setSkipMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<{ message: string; section: Section } | null>(null);
  const [editingSection, setEditingSection] = useState<Section | null>(Section.BASIC);
  const [draftProfile, setDraftProfile] = useState<Profile | null>(null);
  const [reflectionsFocusPulse, setReflectionsFocusPulse] = useState(false);
  const [journeyMessage, setJourneyMessage] = useState<string | null>(null);
  const [xpMessage, setXpMessage] = useState<string | null>(null);
  const [avatarGrowthToast, setAvatarGrowthToast] = useState<string | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [resumeSectionEdit, setResumeSectionEdit] = useState<Section | null>(null);
  const [isReturningSession, setIsReturningSession] = useState(false);
  
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const previousUnlockedCountRef = useRef(1);
  const previousAvatarStageRef = useRef(1);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // If a previous session completed sync, wipe its profile so the
        // next user on this device starts fresh.
        if (localStorage.getItem(SYNC_COMPLETE_KEY) === 'true') {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(SYNC_COMPLETE_KEY);
        }

        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();

          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
            setUser(data.user);
            setIsAuthenticated(true);
            // This is a returning user resuming an existing session on reload;
            // flag it so the Level 2 (Review) group isn't locked.
            setIsReturningSession(true);
            try {
              const parsed = JSON.parse(saved);
              handleStart(parsed);
            } catch (e) {
              handleStart();
            }
          } else {
            // No local profile data — force re-login so the returning-user
            // hydration flow runs properly via the onLogin callback.
            await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
          }
        }
      } catch (err) {
        console.error('Auth check failed:', err);
      } finally {
        setAuthChecking(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (user && user.phone && (!profile.whatsappNumber || profile.whatsappNumber === '9999999999')) {
      setProfile(prev => ({ ...prev, whatsappNumber: user.phone }));
    }
  }, [user, profile.whatsappNumber, setProfile]);

  useEffect(() => {
    if (isStarted) {
      window.scrollTo(0, 0);
    }
  }, [isStarted]);

  useEffect(() => {
    if (isStarted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    }
  }, [profile, isStarted]);

  useEffect(() => {
    if (editingSection) {
      const draft = { ...profile };
      if (editingSection === Section.MILESTONES) {
        draft.projects = draft.projects.map(p => ({ ...p, isSaved: true }));
        draft.exams = draft.exams.map(e => ({ ...e, isSaved: true }));
        draft.certifications = draft.certifications.map(c => ({ ...c, isSaved: true }));
      }
      setDraftProfile(draft);
    } else {
      setDraftProfile(null);
    }
  }, [editingSection, profile]);

  const updateProfile = (updates: Partial<Profile>) => {
    const now = new Date().toISOString();
    setProfile(prev => ({ ...prev, ...updates, lastUpdatedAt: now }));
    // Clear errors when user types
    if (validationErrors) setValidationErrors(null);
  };

  const updateDraftProfile = (updates: Partial<Profile>) => {
    setDraftProfile(prev => prev ? ({ ...prev, ...updates }) : null);
    // Clear errors when user types
    if (validationErrors) setValidationErrors(null);
  };

  const handleCancel = () => {
    setDraftProfile(null);
    setEditingSection(null);
    setValidationErrors(null);
    setResumeSectionEdit(null);
  };

  const handleSkip = (section: Section) => {
    // Logic to skip the section
    if (!savedSections.includes(section)) {
      setSavedSections(prev => [...prev, section]);
    }
    setEditingSection(null);
    setValidationErrors(null);
    
    // Auto scroll to next section
    const allSections = [
      ...SECTION_LEVELS.BASELINE,
      ...SECTION_LEVELS.DEEP,
      ...SECTION_LEVELS.REVIEW
    ];
    const currentIndex = allSections.indexOf(section);
    if (currentIndex < allSections.length - 1) {
      const nextSection = allSections[currentIndex + 1];
      if (!visibleSections.includes(nextSection)) {
        setVisibleSections(prev => [...prev, nextSection]);
      }
      setEditingSection(nextSection);
      const nextJourneyIndex = JOURNEY_STEPS.indexOf(nextSection);
      if (nextJourneyIndex >= 0) {
        setCurrentSectionIndex(prev => Math.max(prev, nextJourneyIndex));
      }
      setTimeout(() => {
        sectionRefs.current[nextSection]?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    }
  };

  const handleSave = (section: Section) => {
    if (!draftProfile) return;

    const mandatoryMissing = getMandatoryMissingFields(section, draftProfile);
    if (Object.keys(mandatoryMissing).length > 0) {
      setValidationErrors({ section, fields: mandatoryMissing });
      return;
    }

    setProfile(draftProfile);
    setDraftProfile(null);

    if (!savedSections.includes(section)) {
      setSavedSections(prev => [...prev, section]);
    }
    setResumeSectionEdit(prev => (prev === section ? null : prev));
    setEditingSection(null);
    setValidationErrors(null);
    const sectionToastMessages: Record<Section, string> = {
      [Section.BASIC]: '🎉 Great job! Moving to Academics section…',
      [Section.ACADEMIC]: '🎉 Awesome! Let’s continue to Expertise…',
      [Section.SKILLS]: '🎉 Nice progress! Moving to Milestones…',
      [Section.MILESTONES]: '🎉 Achievement unlocked! Welcome to Reflections…',
      [Section.REFLECTIONS]: '🎉 Fantastic! Moving to Review…',
      [Section.REVIEW]: '🎉 Great work! Journey complete…',
    };
    setSuccessToast({
      message: sectionToastMessages[section] || '🎉 Great job! Moving to next section…',
      section,
    });
    setTimeout(() => setSuccessToast(null), 1800);
    if (hasEnoughForMilestone(section, draftProfile)) {
      triggerMilestoneCelebration(section);
    }
    setJourneyMessage(`${section === Section.BASIC ? 'Identity' : section === Section.ACADEMIC ? 'Academics' : section === Section.SKILLS ? 'Expertise' : section === Section.MILESTONES ? 'Milestones' : 'Reflections'} completed ✅`);
    setXpMessage('+10 XP');
    setTimeout(() => setXpMessage(null), 1400);
    
    // Auto scroll to next section
    const allSections = [
      ...SECTION_LEVELS.BASELINE,
      ...SECTION_LEVELS.DEEP,
      ...SECTION_LEVELS.REVIEW
    ];
    const currentIndex = allSections.indexOf(section);
    if (currentIndex < allSections.length - 1) {
      const nextSection = allSections[currentIndex + 1];
      if (!visibleSections.includes(nextSection)) {
        setVisibleSections(prev => [...prev, nextSection]);
      }
      setEditingSection(nextSection);
      const nextJourneyIndex = JOURNEY_STEPS.indexOf(nextSection);
      if (nextJourneyIndex >= 0) {
        setCurrentSectionIndex(prev => Math.max(prev, nextJourneyIndex));
      }
      setTimeout(() => {
        sectionRefs.current[nextSection]?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
      pushAppHistoryState({ section: nextSection, view: 'question', step: 0 });
    } else {
      setEditingSection(null);
    }
  };

  const isSectionFilled = (section: Section, prof: Profile = profile): boolean => {
    if (section === Section.BASIC) {
      return !!(prof.email.trim() || prof.location.trim() || prof.gender || prof.pronouns);
    }
    if (section === Section.ACADEMIC) {
      return !!(
        prof.collegeName.trim() || 
        prof.degreeType || 
        prof.yearOfStudy || 
        prof.graduationYear ||
        prof.cgpa || 
        prof.topLevelCategory || 
        prof.specializationCategory || 
        prof.specialization
      );
    }
    if (section === Section.SKILLS) {
      return (
        prof.subjectSkills.length > 0 || 
        prof.toolSkills.length > 0 || 
        prof.aiSkills.length > 0 || 
        prof.professionalSkills.length > 0 ||
        prof.interests.length > 0
      );
    }
    if (section === Section.MILESTONES) {
      return (
        prof.projects.some((p) => p.name.trim().length > 0) ||
        prof.exams.some((e) => e.name.trim().length > 0) ||
        prof.certifications.some((c) => c.name.trim().length > 0)
      );
    }
    if (section === Section.REFLECTIONS) {
      return (Object.values(prof.reflections) as string[]).some(v => !!v && v.trim().length > 0);
    }
    return false;
  };

  const getJourneyIndex = (section: Section | null): number => {
    if (!section) return 0;
    const idx = JOURNEY_STEPS.indexOf(section);
    return idx >= 0 ? idx : 0;
  };

  const handleStart = (importedProfile?: Profile) => {
    if (importedProfile) {
      const merged = mergeProfileWithDefaults(importedProfile);
      setProfile(merged);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      
      const isReturningUser = !!(merged.email || merged.collegeName || merged.degreeType);
      
      if (isReturningUser) {
        const filledSections = Object.values(Section).filter(s => s !== Section.REVIEW && isSectionFilled(s, merged));
        setSavedSections(filledSections);
      } else {
        setSavedSections([]);
      }
      
      const newVisibleSections: Section[] = [Section.BASIC];
      let firstEmptySection: Section | null = null;
      
      if (!isSectionFilled(Section.BASIC, merged)) {
        firstEmptySection = Section.BASIC;
      }
      
      const sectionsToCheck = [Section.ACADEMIC, Section.SKILLS, Section.MILESTONES, Section.REFLECTIONS];
      for (const sec of sectionsToCheck) {
        if (isSectionFilled(sec, merged)) {
          if (!newVisibleSections.includes(sec)) newVisibleSections.push(sec);
        } else if (!firstEmptySection) {
          if (!newVisibleSections.includes(sec)) newVisibleSections.push(sec);
          firstEmptySection = sec;
        }
      }
      if (!firstEmptySection) {
        newVisibleSections.push(Section.REVIEW);
      }
      
      setVisibleSections(newVisibleSections);
      // When every section is already filled, firstEmptySection is null. Fall
      // back to the Review section so a completed profile still renders on
      // reload instead of showing a blank screen (no section matches a null
      // editingSection in the render loop).
      setEditingSection(firstEmptySection ?? Section.REVIEW);
      setCurrentSectionIndex(firstEmptySection ? getJourneyIndex(firstEmptySection) : JOURNEY_STEPS.length - 1);
      
    } else {
      // If it's a new profile, make the first section editable
      setEditingSection(Section.BASIC);
      setCurrentSectionIndex(0);
      
    }
    setIsStarted(true);
    window.scrollTo(0, 0);
  };

  const hydrateProfileData = (existingRow: unknown): boolean => {
    if (!existingRow || typeof existingRow !== 'object') return false;
    const row = existingRow as { profile?: unknown };
    if (!row.profile || typeof row.profile !== 'object') return false;

    const merged = mergeProfileWithDefaults(row.profile);
    setProfile(merged);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));

    const filledSections = Object.values(Section).filter((s) => s !== Section.REVIEW && isSectionFilled(s, merged));
    setSavedSections(filledSections);
    setVisibleSections(ALL_MAIN_SECTIONS);
    setEditingSection(Section.REVIEW);
    setCurrentSectionIndex(JOURNEY_STEPS.length - 1);
    setIsStarted(true);
    window.scrollTo(0, 0);
    return true;
  };

  const triggerMilestoneCelebration = (section: Section) => {
    const possibleEmojis = MILESTONE_EMOJIS[section] || ['✨'];
    const singleEmoji = possibleEmojis[Math.floor(Math.random() * possibleEmojis.length)];
    setCurrentBurstEmojis([singleEmoji]);
    setShowMilestoneBurst(true);
    
    if (section === Section.REVIEW || completeness === 100) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#2c4869', '#ffcd29', '#f58434']
      });
    }

    setTimeout(() => setShowMilestoneBurst(false), 100);
  };

  const getMandatoryMissingFields = (section: Section, prof: Profile = profile): Record<string, string> => {
    const missing: Record<string, string> = {};
    if (section === Section.BASIC) {
      if (!prof.fullName.trim()) missing["fullName"] = "This field is required";
      if (!prof.whatsappNumber?.trim()) missing["whatsappNumber"] = "This field is required";
      if (!STRICT_EMAIL_REGEX.test((prof.email || '').trim())) {
        missing["email"] = "Please enter a valid email address (e.g., name@gmail.com)";
      }
    } else if (section === Section.ACADEMIC) {
      if (!prof.academicStatus) missing["academicStatus"] = "This field is required";
      if (!prof.collegeName.trim()) missing["collegeName"] = "This field is required";
      if (!prof.degreeType) missing["degreeType"] = "This field is required";
      if (prof.academicStatus === 'studying' && !prof.yearOfStudy) missing["yearOfStudy"] = "This field is required";
      if (prof.academicStatus === 'graduated') {
        const gy = (prof.graduationYear || '').trim();
        if (!gy) missing["graduationYear"] = "This field is required";
        else if (!/^\d{4}$/.test(gy)) missing["graduationYear"] = "Enter a valid 4-digit year";
      }
      if (!prof.cgpa?.trim()) missing["cgpa"] = "This field is required";
      if (!prof.topLevelCategory) missing["topLevelCategory"] = "This field is required";
      if (!prof.specializationCategory) missing["specializationCategory"] = "This field is required";
      else if (prof.specializationCategory === 'Other' && !prof.customCategory?.trim()) {
        missing["customCategory"] = "Please specify your subject area";
      }
      if (!prof.specialization) missing["specialization"] = "This field is required";
      else if (prof.specialization === 'Other' && !prof.customSpecialization?.trim()) {
        missing["customSpecialization"] = "Please specify your specialization";
      }
    } else if (section === Section.SKILLS) {
      const expertiseFilledCount = getExpertiseAnsweredCount(prof);
      if (expertiseFilledCount < MIN_EXPERTISE_QUESTIONS) {
        missing["expertise"] = `Please answer at least ${MIN_EXPERTISE_QUESTIONS} questions`;
      }
    } else if (section === Section.MILESTONES) {
      const hasMilestones =
        prof.projects.some((p) => p.name.trim().length > 0) ||
        prof.exams.some((e) => e.name.trim().length > 0) ||
        prof.certifications.some((c) => c.name.trim().length > 0);

      if (!hasMilestones) {
        missing["milestones"] = "This field is required";
      } else {
        const statusErr = getMilestoneStatusValidationError(prof);
        if (statusErr) missing["milestones"] = statusErr;
      }
    } else if (section === Section.REFLECTIONS) {
      // Reflections are intentionally flexible and non-mandatory.
    }
    return missing;
  };

  const validateSection = (section: Section, prof: Profile = profile): Record<string, string> => {
    const missing: Record<string, string> = {};
    if (section === Section.BASIC) {
      if (!prof.fullName.trim()) missing["fullName"] = "Full Name is required";
      if (!prof.whatsappNumber?.trim()) missing["whatsappNumber"] = "WhatsApp Number is required";
      if (!STRICT_EMAIL_REGEX.test((prof.email || '').trim())) {
        missing["email"] = "Please enter a valid email address (e.g., name@gmail.com)";
      }
      if (!prof.location.trim()) missing["location"] = "Current location is required";
    } else if (section === Section.ACADEMIC) {
      if (!prof.academicStatus) missing["academicStatus"] = "Academic status is required";
      if (!prof.collegeName.trim()) missing["collegeName"] = "Institution is required";
      if (!prof.degreeType) missing["degreeType"] = "Degree is required";
      if (prof.academicStatus === 'studying') {
        if (!prof.yearOfStudy) missing["yearOfStudy"] = "Year of Study is required";
      }
      if (prof.academicStatus === 'graduated') {
        const gy = (prof.graduationYear || '').trim();
        if (!gy) missing["graduationYear"] = "Graduation Year is required";
        else if (!/^\d{4}$/.test(gy)) missing["graduationYear"] = "Enter a valid 4-digit year";
      }
      if (!prof.cgpa.trim()) missing["cgpa"] = "CGPA is required";
      if (!prof.topLevelCategory) missing["topLevelCategory"] = "Broad STEM Stream is required";
      if (!prof.specializationCategory) missing["specializationCategory"] = "Specialization Category is required";
      else if (prof.specializationCategory === 'Other' && !prof.customCategory?.trim()) {
        missing["customCategory"] = "Please specify your subject area";
      }
      if (!prof.specialization) missing["specialization"] = "Specialization is required";
      else if (prof.specialization === 'Other' && !prof.customSpecialization?.trim()) {
        missing["customSpecialization"] = "Please specify your specialization";
      }
    } else if (section === Section.SKILLS) {
      const expertiseFilledCount = getExpertiseAnsweredCount(prof);
      if (expertiseFilledCount < MIN_EXPERTISE_QUESTIONS) {
        missing["expertise"] = `Please answer at least ${MIN_EXPERTISE_QUESTIONS} questions`;
      }
    } else if (section === Section.MILESTONES) {
      const hasMilestones =
        prof.projects.some((p) => p.name.trim().length > 0) ||
        prof.exams.some((e) => e.name.trim().length > 0) ||
        prof.certifications.some((c) => c.name.trim().length > 0);

      if (!hasMilestones) {
        missing["milestones"] = "Add at least one project, certification, or exam (title)";
      } else {
        const statusErr = getMilestoneStatusValidationError(prof);
        if (statusErr) missing["milestones"] = statusErr;
      }
    } else if (section === Section.REFLECTIONS) {
      // Reflections are intentionally flexible and non-mandatory.
    }
    return missing;
  };



  const calculateCompleteness = () => {
    const fields = [
      // Identity & Academic (10)
      profile.fullName,
      profile.gender,
      profile.pronouns,
      profile.whatsappNumber,
      profile.email,
      profile.location,
      profile.collegeName,
      profile.degreeType,
      profile.yearOfStudy,
      ...(profile.yearOfStudy === 'Alumnus' ? [profile.graduationYear] : []),
      profile.cgpa,
      profile.topLevelCategory,
      profile.specializationCategory,
      profile.specialization,
      
      // Expertise Core (5)
      profile.subjectSkills.length > 0 ? 'filled' : '',
      profile.toolSkills.length > 0 ? 'filled' : '',
      profile.aiSkills.length > 0 ? 'filled' : '',
      profile.professionalSkills.length > 0 ? 'filled' : '',
      profile.interests.length > 0 ? 'filled' : '',

      // Milestones: any titled entry counts for its bucket
      profile.projects.some((p) => p.name.trim()) ? 'filled' : '',
      profile.exams.some((e) => e.name.trim()) ? 'filled' : '',
      profile.certifications.some((c) => c.name.trim()) ? 'filled' : '',

      // Reflections (7)
      ...Object.values(profile.reflections)
    ];

    const filledCount = fields.filter(f => {
      if (typeof f === 'string') return f.trim().length > 0;
      return !!f;
    }).length;

    return Math.round((filledCount / fields.length) * 100);
  };

  const getRequiredProgress = () => {
    const graduationRequired = profile.yearOfStudy === 'Alumnus' ? 1 : 0;
    const total =
      4 + // identity: fullName, whatsapp, email, location
      (7 + graduationRequired) + // academics
      5 + // expertise
      3 + // milestones categories
      7; // reflections

    let filled = 0;

    // Identity
    if (profile.fullName.trim()) filled += 1;
    if (profile.whatsappNumber?.trim()) filled += 1;
    if (profile.email.trim()) filled += 1;
    if (profile.location.trim()) filled += 1;

    // Academics
    if (profile.collegeName.trim()) filled += 1;
    if (profile.degreeType) filled += 1;
    if (profile.yearOfStudy) filled += 1;
    if (profile.yearOfStudy === 'Alumnus' && profile.graduationYear?.trim()) filled += 1;
    if (profile.cgpa.trim()) filled += 1;
    if (profile.topLevelCategory) filled += 1;
    if (profile.specializationCategory) filled += 1;
    if (profile.specialization) filled += 1;

    // Expertise
    if (profile.subjectSkills.length > 0) filled += 1;
    if (profile.toolSkills.length > 0) filled += 1;
    if (profile.aiSkills.length > 0) filled += 1;
    if (profile.professionalSkills.length > 0) filled += 1;
    if (profile.interests.length > 0) filled += 1;

    // Milestones
    if (profile.projects.some((p) => p.name.trim())) filled += 1;
    if (profile.exams.some((e) => e.name.trim())) filled += 1;
    if (profile.certifications.some((c) => c.name.trim())) filled += 1;

    // Reflections
    if (profile.reflections.impactPurpose.trim()) filled += 1;
    if (profile.reflections.strengths.trim()) filled += 1;
    if (profile.reflections.curiosity.trim()) filled += 1;
    if (profile.reflections.grittyGrowth.trim()) filled += 1;
    if (profile.reflections.spark.trim()) filled += 1;
    if (profile.reflections.opportunities.trim()) filled += 1;
    if (profile.reflections.threats.trim()) filled += 1;

    const percent = total > 0 ? Math.round((filled / total) * 100) : 0;
    return { total, filled, percent };
  };

  const isSectionDirty = (section: Section, prof: Profile = profile): boolean => {
    if (section === Section.BASIC) {
      return !!(prof.fullName.trim() || prof.gender || prof.pronouns || prof.email.trim() || prof.location.trim());
    }
    if (section === Section.ACADEMIC) {
      return !!(
        prof.collegeName.trim() || 
        prof.degreeType || 
        prof.yearOfStudy || 
        prof.graduationYear ||
        prof.cgpa || 
        prof.topLevelCategory || 
        prof.specializationCategory || 
        prof.specialization
      );
    }
    if (section === Section.SKILLS) {
      return (
        prof.subjectSkills.length > 0 || 
        prof.toolSkills.length > 0 || 
        prof.aiSkills.length > 0 || 
        prof.professionalSkills.length > 0 ||
        prof.interests.length > 0
      );
    }
    if (section === Section.MILESTONES) {
      return (
        prof.projects.some((p) => p.name.trim().length > 0) ||
        prof.exams.some((e) => e.name.trim().length > 0) ||
        prof.certifications.some((c) => c.name.trim().length > 0)
      );
    }
    if (section === Section.REFLECTIONS) {
      return (Object.values(prof.reflections) as string[]).some(v => !!v && v.trim().length > 0);
    }
    return false;
  };

  const hasEnoughForMilestone = (section: Section, prof: Profile = profile): boolean => {
    if (section === Section.BASIC) {
      const filled = [prof.fullName, prof.gender, prof.pronouns, prof.whatsappNumber, prof.email, prof.location].filter(v => v && v.trim()).length;
      return filled >= 2;
    }
    if (section === Section.ACADEMIC) {
      const filled = [
        prof.collegeName, 
        prof.degreeType, 
        prof.yearOfStudy, 
        prof.graduationYear,
        prof.cgpa, 
        prof.topLevelCategory, 
        prof.specializationCategory, 
        prof.specialization
      ].filter(v => v && v.trim()).length;
      return filled >= 3;
    }
    if (section === Section.SKILLS) {
      return getExpertiseAnsweredCount(prof) >= MIN_EXPERTISE_QUESTIONS;
    }
    if (section === Section.MILESTONES) {
      return (
        prof.projects.some((p) => p.name.trim().length > 0) ||
        prof.exams.some((e) => e.name.trim().length > 0) ||
        prof.certifications.some((c) => c.name.trim().length > 0)
      );
    }
    if (section === Section.REFLECTIONS) {
      const filled = (Object.values(prof.reflections) as string[]).filter(v => !!v && v.trim().length > 0).length;
      return filled >= 2;
    }
    return false;
  };

  const completeness = calculateCompleteness();
  const countMandatoryChecks = (section: Section, prof: Profile = profile): number => {
    if (section === Section.BASIC) return 2;
    if (section === Section.ACADEMIC) return 4;
    if (section === Section.SKILLS) return 1;
    if (section === Section.MILESTONES) {
      let checks = 1;
      checks += prof.projects.length;
      checks += prof.exams.length;
      checks += prof.certifications.length;
      return checks;
    }
    return 0;
  };

  const getMandatoryProgressForSections = (sectionsToTrack: Section[]) => {
    const total = sectionsToTrack.reduce((sum, section) => sum + countMandatoryChecks(section), 0);
    const missing = sectionsToTrack.reduce((sum, section) => sum + Object.keys(getMandatoryMissingFields(section)).length, 0);
    const completed = Math.max(0, total - missing);
    const percent = total > 0 ? Math.round((completed / total) * 100) : 100;
    return { total, completed, percent };
  };

  const level1Progress = getMandatoryProgressForSections(LEVEL_1_SECTIONS);
  const level2Progress = getMandatoryProgressForSections(LEVEL_2_SECTIONS);
  const level1Complete = level1Progress.percent === 100;
  const goToPreviousJourneySection = (fromSection: Section) => {
    const idx = JOURNEY_STEPS.indexOf(fromSection);
    if (idx <= 0) return;
    const prev = JOURNEY_STEPS[idx - 1];
    if (prev === Section.REFLECTIONS && !level1Complete && !isReturningSession) {
      setSkipMessage('Please complete all required Level 1 sections to unlock Reflections.');
      setTimeout(() => setSkipMessage(null), 3200);
      return;
    }
    if (!visibleSections.includes(prev)) {
      setVisibleSections(v => [...v, prev]);
    }
    setResumeSectionEdit(null);
    setEditingSection(prev);
    setValidationErrors(null);
  };
  const goToNextJourneySection = (fromSection: Section) => {
    const idx = JOURNEY_STEPS.indexOf(fromSection);
    if (idx < 0) return;

    if (idx >= JOURNEY_STEPS.length - 1) {
      if (!visibleSections.includes(Section.REVIEW)) {
        setVisibleSections(v => [...v, Section.REVIEW]);
      }
      setResumeSectionEdit(null);
      setEditingSection(Section.REVIEW);
      setValidationErrors(null);
      setCurrentSectionIndex(JOURNEY_STEPS.length - 1);
      requestAnimationFrame(() => {
        sectionRefs.current[Section.REVIEW]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      pushAppHistoryState({ section: Section.REVIEW, view: 'review' });
      return;
    }

    const next = JOURNEY_STEPS[idx + 1];
    if (next === Section.REFLECTIONS && !level1Complete && !isReturningSession) {
      setSkipMessage('Please complete all required Level 1 sections to unlock Reflections.');
      setTimeout(() => setSkipMessage(null), 3200);
      return;
    }
    if (!visibleSections.includes(next)) {
      setVisibleSections(v => [...v, next]);
    }
    setResumeSectionEdit(null);
    setEditingSection(next);
    setValidationErrors(null);
    pushAppHistoryState({ section: next, view: 'question', step: 0 });
  };

  const handleReviewUiBack = useCallback(() => {
    setEditingSection(Section.REFLECTIONS);
    setResumeSectionEdit(null);
    setValidationErrors(null);
  }, []);

  const isOnSectionSummary =
    !!editingSection &&
    editingSection !== Section.REVIEW &&
    savedSections.includes(editingSection) &&
    isSectionFilled(editingSection, profile) &&
    resumeSectionEdit !== editingSection;

  useEffect(() => {
    if (!isStarted) return;
    initBrowserBackListener(true, () => replaceAppHistoryState());
    replaceAppHistoryState({ section: editingSection ?? Section.BASIC });
  }, [isStarted]);

  useEffect(() => {
    if (!isStarted || !isOnSectionSummary || !editingSection) return;
    setUiBackHandler(() => setResumeSectionEdit(editingSection));
  }, [isStarted, isOnSectionSummary, editingSection]);

  const identityComplete = Object.keys(getMandatoryMissingFields(Section.BASIC)).length === 0;
  const academicsComplete = Object.keys(getMandatoryMissingFields(Section.ACADEMIC)).length === 0;
  const expertiseComplete = Object.keys(getMandatoryMissingFields(Section.SKILLS)).length === 0;
  const milestonesComplete = Object.keys(getMandatoryMissingFields(Section.MILESTONES)).length === 0;
  const avatarStage =
    level1Complete
      ? 5
      : academicsComplete && expertiseComplete && milestonesComplete
      ? 4
      : academicsComplete || expertiseComplete
      ? 3
      : identityComplete
      ? 2
      : 1;
  const avatarStageMap: Record<number, { emoji: string; title: string; subtitle: string }> = {
    1: { emoji: '👩‍🎓', title: 'Starting Your Journey', subtitle: 'College-going dreamer taking the first step.' },
    2: { emoji: '🙋‍♀️', title: 'Understanding Yourself', subtitle: 'Clarity grows as your identity takes shape.' },
    3: { emoji: '👩‍💻', title: 'Building Your Skills', subtitle: 'Focused effort is turning potential into capability.' },
    4: { emoji: '💡👩‍💼', title: 'Shaping Your Career Path', subtitle: 'Your profile now reflects emerging professionalism.' },
    5: { emoji: '👩‍💼', title: 'Career Ready', subtitle: 'Confident, polished, and ready for opportunities.' },
  };
  const currentAvatarMeta = avatarStageMap[avatarStage];
  const requiredProgress = getRequiredProgress();
  const level2TotalFields = Object.values(profile.reflections).length;
  const level2FilledFields = (Object.values(profile.reflections) as string[]).filter((v) => v && v.trim().length > 0).length;
  const level2UiProgress = level2TotalFields > 0 ? Math.round((level2FilledFields / level2TotalFields) * 100) : 0;
  const isLevel1Active = editingSection ? LEVEL_1_SECTIONS.includes(editingSection) : false;
  const isLevel2Active = editingSection ? LEVEL_2_SECTIONS.includes(editingSection) : false;
  /** Use live draft while editing Academics so journey segments reflect full completion, not stale profile. */
  const academicProgressProfile =
    editingSection === Section.ACADEMIC && draftProfile ? draftProfile : profile;

  const completedMap: Record<Section, boolean> = {
    [Section.BASIC]: Object.keys(validateSection(Section.BASIC)).length === 0,
    [Section.ACADEMIC]:
      savedSections.includes(Section.ACADEMIC) ||
      Object.keys(validateSection(Section.ACADEMIC, academicProgressProfile)).length === 0,
    [Section.SKILLS]: Object.keys(validateSection(Section.SKILLS)).length === 0,
    [Section.MILESTONES]: Object.keys(validateSection(Section.MILESTONES)).length === 0,
    [Section.REFLECTIONS]: Object.keys(validateSection(Section.REFLECTIONS)).length === 0,
    [Section.REVIEW]: false,
  };
  const unlockedCount = Math.min(JOURNEY_STEPS.length, currentSectionIndex + 1);
  const completedCount = JOURNEY_STEPS.filter((s) => completedMap[s]).length;
  const overallJourneyProgress = Math.round((completedCount / JOURNEY_STEPS.length) * 100);

  useEffect(() => {
    if (unlockedCount > previousUnlockedCountRef.current && unlockedCount <= JOURNEY_STEPS.length) {
      const justUnlocked = JOURNEY_STEPS[unlockedCount - 1];
      const unlockedName =
        justUnlocked === Section.BASIC
          ? 'Identity'
          : justUnlocked === Section.ACADEMIC
          ? 'Academics'
          : justUnlocked === Section.SKILLS
          ? 'Expertise'
          : justUnlocked === Section.MILESTONES
          ? 'Milestones'
          : 'Reflections';
      setJourneyMessage(`You unlocked ${unlockedName} 🎉`);
      setTimeout(() => setJourneyMessage(null), 2200);
    }
    previousUnlockedCountRef.current = unlockedCount;
  }, [unlockedCount]);

  useEffect(() => {
    if (avatarStage > previousAvatarStageRef.current) {
      setAvatarGrowthToast(`🎉 You've grown into a ${currentAvatarMeta.title}!`);
      setTimeout(() => setAvatarGrowthToast(null), 2600);
    }
    previousAvatarStageRef.current = avatarStage;
  }, [avatarStage, currentAvatarMeta.title]);

  // Removed modal-based Level 2 prompt flow. Progress now transitions directly with celebratory toasts.

  const completeSection = (section: Section, forceSkip: boolean = false) => {
    if (!forceSkip) {
      const mandatoryMissing = getMandatoryMissingFields(section);
      if (Object.keys(mandatoryMissing).length > 0) {
        setValidationErrors({ section, fields: mandatoryMissing });
        return;
      }

      const missingFields = validateSection(section);
      if (Object.keys(missingFields).length > 0) {
        setValidationErrors({ section, fields: missingFields });
        return;
      }
    } else {
      setSkipMessage("No problem. We'll move ahead for now. However, we highly recommend that you add this later to receive more personalized guidance");
      setTimeout(() => setSkipMessage(null), 6000);
    }

    setValidationErrors(null);
    const sections = Object.values(Section);
    const currentIndex = sections.indexOf(section);
    
    if (currentIndex < sections.length - 1) {
      const nextSection = sections[currentIndex + 1];
      
      if (!visibleSections.includes(nextSection)) {
        if (!forceSkip && hasEnoughForMilestone(section)) {
          triggerMilestoneCelebration(section);
        }
        setVisibleSections(prev => [...prev, nextSection]);
        setEditingSection(nextSection);
        const nextJourneyIndex = JOURNEY_STEPS.indexOf(nextSection);
        if (nextJourneyIndex >= 0) {
          setCurrentSectionIndex(prev => Math.max(prev, nextJourneyIndex));
        }
        
        // Scroll to next section after a short delay to allow it to render
        setTimeout(() => {
          sectionRefs.current[nextSection]?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }, 100);
      } else {
        // Already visible, move editing focus to next
        setEditingSection(nextSection);
        const nextJourneyIndex = JOURNEY_STEPS.indexOf(nextSection);
        if (nextJourneyIndex >= 0) {
          setCurrentSectionIndex(prev => Math.max(prev, nextJourneyIndex));
        }
        sectionRefs.current[nextSection]?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    } else {
      // Last section completed
      setEditingSection(null);
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#2c4869]/20 border-t-[#2c4869] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Auth onLogin={(payload) => { 
      setUser(payload.user); 
      setIsAuthenticated(true); 
      setIsReturningSession(Boolean(payload.isReturningUser));

      // Clear any leftover completed-session data so a new user on the
      // same device doesn't inherit the previous user's profile.
      if (localStorage.getItem(SYNC_COMPLETE_KEY) === 'true') {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(SYNC_COMPLETE_KEY);
      }

      if (payload.isReturningUser) {
        const hydrated = hydrateProfileData(payload.existingRow);
        if (hydrated) {
          return;
        }
      }

      // New-user path: restore unfinished draft if the phone matches,
      // otherwise start fresh.
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const draftPhone = (parsed.whatsappNumber || '').replace(/\D/g, '');
          const loginPhone = (payload.user?.phone || '').replace(/\D/g, '');
          if (draftPhone && loginPhone && draftPhone !== loginPhone) {
            localStorage.removeItem(STORAGE_KEY);
            handleStart();
          } else {
            handleStart(parsed);
          }
        } catch (e) {
          handleStart();
        }
      } else {
        handleStart();
      }
    }} />;
  }

  return (
    <div className="min-h-screen bg-[#9DD3AF] flex flex-col pb-32 overflow-x-hidden">
      <EmojiBurst trigger={showMilestoneBurst} emojis={currentBurstEmojis} />
      
      
      
      <header className="sticky top-0 z-30 bg-[#9DD3AF] shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <img
            src={VIGYAN_SHAALA_LOGO}
            alt="VigyanShaala"
            className="h-7 sm:h-8 w-auto object-contain"
          />
          <button
            type="button"
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              setIsAuthenticated(false);
              setUser(null);
              setIsStarted(false);
              setProfile(INITIAL_PROFILE);
            }}
            className="shrink-0 px-3 sm:px-4 py-2 rounded-full bg-[#2c4869] text-white text-[10px] font-bold uppercase tracking-wider hover:bg-[#2c4869]/90 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <AnimatePresence>
        {skipMessage && (
          <motion.div 
            key="skip-message"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-6"
          >
            <div className="bg-[#2c4869] text-white p-4 rounded-xl shadow-2xl border border-white/10 flex items-start gap-3">
              <div className="mt-0.5">
                <svg className="w-5 h-5 text-[#ffcd29]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium leading-relaxed">
                {skipMessage}
              </p>
              <button onClick={() => setSkipMessage(null)} className="text-white/60 hover:text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 w-full px-6 pt-8 overflow-x-hidden">
        <div className="grid grid-cols-1 gap-6 items-stretch">
        <div className="space-y-12 w-full">
        <AnimatePresence mode="popLayout">
          {[
            { key: 'level1', title: '🟢 Foundation Mode', sections: LEVEL_1_SECTIONS, progress: level1Progress, locked: false },
            {
              key: 'level2',
              title: '🔵 Power-Up Mode',
              sections: LEVEL_2_SECTIONS,
              progress: level2Progress,
              // Returning users should be able to land directly on Review after login.
              locked: !level1Complete && !isReturningSession,
            },
          ].map((levelGroup) => (
            <div key={levelGroup.key} className="space-y-8">
              {levelGroup.locked ? null : levelGroup.sections.map((section, index) => {
                if (!visibleSections.includes(section)) return null;
                if (section !== Section.REVIEW) {
                  const stepIndex = JOURNEY_STEPS.indexOf(section);
                  if (stepIndex >= 0 && stepIndex >= unlockedCount) return null;
                }
                
                if (editingSection !== section) return null;
                const showSummaryCard =
                  section !== Section.REVIEW &&
                  savedSections.includes(section) &&
                  isSectionFilled(section, profile) &&
                  resumeSectionEdit !== section;
                return (
                  <motion.div 
                    key={section}
                    initial={{ opacity: 0, x: 32 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    ref={el => sectionRefs.current[section] = el}
                    className={`scroll-mt-36 transition-all duration-700 w-full ${
                      section === Section.REFLECTIONS && reflectionsFocusPulse
                        ? 'ring-2 ring-emerald-300 rounded-2xl shadow-[0_0_22px_rgba(16,185,129,0.22)]'
                        : ''
                    }`}
                  >
              <div className="transition-all duration-300 rounded-2xl sm:rounded-3xl px-4 py-6 sm:px-8 sm:py-10 bg-[#9DD3AF]">
                {section === Section.REVIEW ? (
                  <ReviewPage
                    profile={profile}
                    completeness={completeness}
                    isReturningUser={isReturningSession}
                    updateProfile={updateProfile}
                    onReviewUiBack={handleReviewUiBack}
                    setCurrentSection={(s) => {
                      setResumeSectionEdit(null);
                      setEditingSection(s);
                      setValidationErrors(null);
                      sectionRefs.current[s]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                  />
                ) : showSummaryCard ? (
                  <>
                    <SectionSummary
                      section={section}
                      profile={profile}
                      onEdit={() => {
                        setResumeSectionEdit(section);
                        pushAppHistoryState({ section, view: 'question' });
                      }}
                    />
                    <div className="mt-6 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          if (isReturningSession) {
                            if (!visibleSections.includes(Section.REVIEW)) {
                              setVisibleSections((v) => [...v, Section.REVIEW]);
                            }
                            setResumeSectionEdit(null);
                            setEditingSection(Section.REVIEW);
                            setValidationErrors(null);
                            setCurrentSectionIndex(JOURNEY_STEPS.length - 1);
                            requestAnimationFrame(() => {
                              sectionRefs.current[Section.REVIEW]?.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start',
                              });
                            });
                            pushAppHistoryState({ section: Section.REVIEW, view: 'review' });
                            return;
                          }
                          goToNextJourneySection(section);
                        }}
                        className="px-5 py-2.5 rounded-full bg-[#2c4869] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#2c4869]/90 transition-colors"
                      >
                        Go to Next Section
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {section === Section.BASIC && (
                      <IdentityForm
                        typeform
                        typeformResumeEdit={resumeSectionEdit === Section.BASIC}
                        profile={draftProfile || profile}
                        updateProfile={updateDraftProfile}
                        onCompleteSection={() => {
                          setResumeSectionEdit(null);
                          handleSave(Section.BASIC);
                        }}
                        validationErrors={{
                          ...(validationErrors?.section === Section.BASIC ? validationErrors.fields : {}),
                          ...getMandatoryMissingFields(Section.BASIC, draftProfile || profile),
                        }}
                      />
                    )}
                    {section === Section.ACADEMIC && (
                      <AcademicForm
                        typeform
                        typeformResumeEdit={resumeSectionEdit === Section.ACADEMIC}
                        profile={draftProfile || profile}
                        updateProfile={updateDraftProfile}
                        validationErrors={validationErrors?.section === Section.ACADEMIC ? validationErrors.fields : {}}
                        onCompleteSection={() => {
                          setResumeSectionEdit(null);
                          handleSave(Section.ACADEMIC);
                        }}
                        onBackFromFirst={() => goToPreviousJourneySection(Section.ACADEMIC)}
                      />
                    )}
                    {section === Section.SKILLS && (
                      <ExpertiseForm
                        typeform
                        profile={draftProfile || profile}
                        updateProfile={updateDraftProfile}
                        validationErrors={validationErrors?.section === Section.SKILLS ? validationErrors.fields : {}}
                        onCompleteSection={() => {
                          setResumeSectionEdit(null);
                          handleSave(Section.SKILLS);
                        }}
                        onBackFromFirst={() => goToPreviousJourneySection(Section.SKILLS)}
                      />
                    )}
                    {section === Section.MILESTONES && (
                      <MilestoneForm
                        typeform
                        typeformResumeEdit={resumeSectionEdit === Section.MILESTONES}
                        profile={draftProfile || profile}
                        updateProfile={updateDraftProfile}
                        validationErrors={validationErrors?.section === Section.MILESTONES ? validationErrors.fields : {}}
                        onCompleteSection={() => {
                          setResumeSectionEdit(null);
                          handleSave(Section.MILESTONES);
                        }}
                        onBackFromFirst={() => goToPreviousJourneySection(Section.MILESTONES)}
                      />
                    )}
                    {section === Section.REFLECTIONS && (
                      <ReflectionForm
                        typeform
                        profile={draftProfile || profile}
                        updateProfile={updateDraftProfile}
                        validationErrors={validationErrors?.section === Section.REFLECTIONS ? validationErrors.fields : {}}
                        onCompleteSection={() => {
                          setResumeSectionEdit(null);
                          handleSave(Section.REFLECTIONS);
                        }}
                        onBackFromFirst={() => goToPreviousJourneySection(Section.REFLECTIONS)}
                      />
                    )}
                  </>
                )}
                <div className="mt-8">
                  <p className="text-center text-[11px] font-semibold text-slate-500 mb-2">
                    {editingSection && JOURNEY_STEPS.includes(editingSection)
                      ? `Step ${JOURNEY_STEPS.indexOf(editingSection) + 1} of ${JOURNEY_STEPS.length}`
                      : 'Your journey'}
                  </p>
                  <JourneyHorizontalTracker
                    journeySteps={JOURNEY_STEPS}
                    completedMap={completedMap}
                    editingSection={editingSection}
                    currentSectionIndex={currentSectionIndex}
                    level1Complete={level1Complete}
                    isReturningSession={isReturningSession}
                    onReflectionLockedAttempt={() => {
                      setSkipMessage('Please complete all required Level 1 sections to unlock Reflections.');
                      setTimeout(() => setSkipMessage(null), 3200);
                    }}
                    onSelectStep={(sec) => {
                      setResumeSectionEdit(null);
                      setEditingSection(sec);
                      const showSummary =
                        savedSections.includes(sec) &&
                        isSectionFilled(sec, profile);
                      pushAppHistoryState({
                        section: sec,
                        view: showSummary ? 'summary' : 'question',
                        step: 0,
                      });
                      sectionRefs.current[sec]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                  />
                </div>
              </div>

              {section !== Section.REVIEW && validationErrors?.section === section && Object.keys(validationErrors.fields).length > 0 && (
                <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-red-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-red-800 mb-1 uppercase tracking-wider">Please fix the following</p>
                      <ul className="text-xs text-red-600 font-bold leading-relaxed list-disc list-inside mt-1 space-y-1">
                        {[...new Set(Object.values(validationErrors.fields))].map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Section Divider Removed */}
            </motion.div>
                );
              })}
            </div>
          ))}
        </AnimatePresence>
      </div>
      </div>
      </main>

      
    </div>
  );
};

export default App;
