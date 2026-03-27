
import React, { useState, useEffect, useRef } from 'react';
import { Section, Profile, INITIAL_PROFILE, ChatPreferences, INITIAL_CHAT_PREFERENCES } from './types';
import { REFLECTION_PROMPTS, SECTION_LEVELS } from './constants';
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
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

const VIGYAN_SHAALA_LOGO = "https://vigyanshaala.com/wp-content/uploads/2021/01/VigyanShaala-Logo-Horizontal-1.png";
const STORAGE_KEY = 'vs_reflection_profile';
const CHAT_PREFS_KEY = 'vs_chat_preferences';

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
          if (typeof p === 'string') return { name: p, details: '', isSaved: true };
          return {
            name: p.name || '',
            details: p.details || '',
            isSaved: typeof p.isSaved === 'boolean' ? p.isSaved : true
          };
        })
      : [],
    exams: Array.isArray(data.exams) 
      ? data.exams.map((e: any) => {
          if (typeof e === 'string') return { name: e, status: '', details: '' };
          return {
            name: e.name || '',
            status: e.status || '',
            details: e.details || '',
            customName: e.customName || ''
          };
        }) 
      : [],
    certifications: Array.isArray(data.certifications)
      ? data.certifications.map((c: any) => ({
          name: c.name || '',
          status: c.status || '',
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

  const { profile, setProfile, chatPreferences, setChatPreferences } = useProfile();
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
  
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setIsAuthenticated(true);
          
          // Auto-start for returning authenticated users
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              handleStart(parsed);
            } catch (e) {
              handleStart();
            }
          } else {
            handleStart();
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
    const savedPrefs = localStorage.getItem(CHAT_PREFS_KEY);
    if (savedPrefs) {
      setChatPreferences(JSON.parse(savedPrefs));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CHAT_PREFS_KEY, JSON.stringify(chatPreferences));
  }, [chatPreferences]);

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
    setEditingSection(null);
    setValidationErrors(null);
    if (hasEnoughForMilestone(section, draftProfile)) {
      triggerMilestoneCelebration(section);
    }
    
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
      setTimeout(() => {
        sectionRefs.current[nextSection]?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
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
        prof.projects.length > 0 ||
        prof.exams.length > 0 ||
        prof.certifications.length > 0
      );
    }
    if (section === Section.REFLECTIONS) {
      return (Object.values(prof.reflections) as string[]).some(v => !!v && v.trim().length > 0);
    }
    return false;
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
      setEditingSection(firstEmptySection);
    } else {
      // If it's a new profile, make the first section editable
      setEditingSection(Section.BASIC);
    }
    setIsStarted(true);
    window.scrollTo(0, 0);
  };

  const triggerMilestoneCelebration = (section: Section) => {
    const possibleEmojis = MILESTONE_EMOJIS[section] || ['✨'];
    const singleEmoji = possibleEmojis[Math.floor(Math.random() * possibleEmojis.length)];
    setCurrentBurstEmojis([singleEmoji]);
    setShowMilestoneBurst(true);
    
    const messages: Record<string, string> = {
      [Section.BASIC]: "Identity Anchored! ⚓",
      [Section.ACADEMIC]: "Academic Foundations Set! 🎓",
      [Section.SKILLS]: "Expertise Core Built! 🚀",
      [Section.MILESTONES]: "Milestones & Projects Captured! 🏆",
      [Section.REFLECTIONS]: "Deep Reflections Captured! 🧠",
      [Section.REVIEW]: "Profile Ready for Curie! 🏁"
    };
    
    setSuccessToast({ message: messages[section] || "Section Completed!", section });
    
    if (section === Section.REVIEW || completeness === 100) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#2c4869', '#ffcd29', '#f58434']
      });
    }

    setTimeout(() => setShowMilestoneBurst(false), 100);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const getMandatoryMissingFields = (section: Section, prof: Profile = profile): Record<string, string> => {
    const missing: Record<string, string> = {};
    if (section === Section.BASIC) {
      if (!prof.fullName.trim()) missing["fullName"] = "Full Name is required";
      if (!prof.whatsappNumber?.trim()) missing["whatsappNumber"] = "WhatsApp Number is required";
    } else if (section === Section.ACADEMIC) {
      if (!prof.academicStatus) missing["academicStatus"] = "Academic Status is required";
      if (!prof.collegeName.trim()) missing["collegeName"] = "Institution is required";
      if (!prof.degreeType) missing["degreeType"] = "Degree is required";
      if (!prof.topLevelCategory) missing["topLevelCategory"] = "Broad STEM Stream is required";
    } else if (section === Section.SKILLS) {
      const hasExpertise = 
        prof.subjectSkills.length > 0 || 
        prof.toolSkills.length > 0 || 
        prof.aiSkills.length > 0 || 
        prof.professionalSkills.length > 0 ||
        prof.interests.length > 0;
      
      if (!hasExpertise) {
        missing["expertise"] = "Please add at least one skill or interest";
      }
    } else if (section === Section.MILESTONES) {
      const hasMilestones = 
        prof.projects.length > 0 || 
        prof.exams.length > 0 ||
        prof.certifications.length > 0;

      if (!hasMilestones) {
        missing["milestones"] = "Please add at least one project, exam, or certification";
      }

      prof.projects.forEach((project, index) => {
        if (!project.name.trim()) missing[`projectName_${index}`] = `Project Title is required`;
        if (project.name.trim() && !project.status) missing[`projectStatus_${index}`] = `Status for ${project.name} is required`;
      });
      prof.exams.forEach((exam, index) => {
        if (!exam.name.trim()) missing[`examName_${index}`] = `Exam Name is required`;
        if (exam.name.trim() && !exam.status) missing[`examStatus_${index}`] = `Status for ${exam.name} is required`;
      });
      prof.certifications.forEach((cert, index) => {
        if (!cert.name.trim()) missing[`certificationName_${index}`] = `Certification Name is required`;
        if (cert.name.trim() && !cert.status) missing[`certificationStatus_${index}`] = `Status for ${cert.name} is required`;
      });
    }
    return missing;
  };

  const validateSection = (section: Section): Record<string, string> => {
    const missing: Record<string, string> = {};
    if (section === Section.BASIC) {
      if (!profile.fullName.trim()) missing["fullName"] = "Full Name is required";
      if (!profile.whatsappNumber?.trim()) missing["whatsappNumber"] = "WhatsApp Number is required";
      if (!profile.email.trim()) missing["email"] = "Email address is required";
      if (!profile.location.trim()) missing["location"] = "Current location is required";
    } else if (section === Section.ACADEMIC) {
      if (!profile.collegeName.trim()) missing["collegeName"] = "Institution is required";
      if (!profile.degreeType) missing["degreeType"] = "Degree is required";
      if (!profile.yearOfStudy) missing["yearOfStudy"] = "Year of Study is required";
      if (profile.yearOfStudy === 'Alumnus' && !profile.graduationYear?.trim()) missing["graduationYear"] = "Graduation Year is required";
      if (!profile.cgpa.trim()) missing["cgpa"] = "CGPA is required";
      if (!profile.topLevelCategory) missing["topLevelCategory"] = "Broad STEM Stream is required";
      if (!profile.specializationCategory) missing["specializationCategory"] = "Specialization Category is required";
      if (!profile.specialization) missing["specialization"] = "Specialization is required";
    } else if (section === Section.SKILLS) {
      if (profile.subjectSkills.length === 0) missing["subjectSkills"] = "Subject Expertise is required";
      if (profile.toolSkills.length === 0) missing["toolSkills"] = "Technical Tools are required";
      if (profile.aiSkills.length === 0) missing["aiSkills"] = "AI & Data Skills are required";
      if (profile.professionalSkills.length === 0) missing["professionalSkills"] = "Professional Skills are required";
      if (profile.interests.length === 0) missing["interests"] = "Academic Interests are required";
    } else if (section === Section.MILESTONES) {
      const hasMilestones = 
        profile.projects.length > 0 || 
        profile.exams.length > 0 ||
        profile.certifications.length > 0;

      if (!hasMilestones) {
        missing["Projects"] = "Projects are required";
        missing["Exams"] = "Exams are required";
        missing["Certifications"] = "Certifications are required";
      }

      profile.projects.forEach((project, index) => {
        if (!project.name.trim()) missing[`projectName_${index}`] = `Project Title is required`;
        if (project.name.trim() && !project.status) missing[`projectStatus_${index}`] = `Status for ${project.name} is required`;
      });
      profile.exams.forEach((exam, index) => {
        if (!exam.name.trim()) missing[`examName_${index}`] = `Exam Name is required`;
        if (exam.name.trim() && !exam.status) missing[`examStatus_${index}`] = `Status for ${exam.name} is required`;
      });
      profile.certifications.forEach((cert, index) => {
        if (!cert.name.trim()) missing[`certificationName_${index}`] = `Certification Name is required`;
        if (cert.name.trim() && !cert.status) missing[`certificationStatus_${index}`] = `Status for ${cert.name} is required`;
      });
    } else if (section === Section.REFLECTIONS) {
      if (!profile.reflections.impactPurpose.trim()) missing["impactPurpose"] = "Impact & Purpose is required";
      if (!profile.reflections.strengths.trim()) missing["strengths"] = "Strengths is required";
      if (!profile.reflections.curiosity.trim()) missing["curiosity"] = "Curiosity is required";
      if (!profile.reflections.grittyGrowth.trim()) missing["grittyGrowth"] = "Gritty Growth is required";
      if (!profile.reflections.spark.trim()) missing["spark"] = "Spark is required";
      if (!profile.reflections.opportunities.trim()) missing["opportunities"] = "Opportunities is required";
      if (!profile.reflections.threats.trim()) missing["threats"] = "Threats is required";
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

      // Milestones & Projects (3)
      profile.projects.length > 0 ? 'filled' : '',
      profile.exams.length > 0 ? 'filled' : '',
      profile.certifications.length > 0 ? 'filled' : '',

      // Reflections (7)
      ...Object.values(profile.reflections)
    ];

    const filledCount = fields.filter(f => {
      if (typeof f === 'string') return f.trim().length > 0;
      return !!f;
    }).length;

    return Math.round((filledCount / fields.length) * 100);
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
        prof.projects.length > 0 ||
        prof.exams.length > 0 ||
        prof.certifications.length > 0
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
      const filled = [
        prof.subjectSkills.length > 0,
        prof.toolSkills.length > 0,
        prof.aiSkills.length > 0,
        prof.professionalSkills.length > 0,
        prof.interests.length > 0
      ].filter(Boolean).length;
      return filled >= 2;
    }
    if (section === Section.MILESTONES) {
      const filled = [
        prof.projects.length > 0,
        prof.exams.length > 0,
        prof.certifications.length > 0
      ].filter(Boolean).length;
      return filled >= 1;
    }
    if (section === Section.REFLECTIONS) {
      const filled = (Object.values(prof.reflections) as string[]).filter(v => !!v && v.trim().length > 0).length;
      return filled >= 2;
    }
    return false;
  };

  const completeness = calculateCompleteness();

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
    return <Auth onLogin={(u) => { 
      setUser(u); 
      setIsAuthenticated(true); 
      
      // Auto-start after login
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          handleStart(parsed);
        } catch (e) {
          handleStart();
        }
      } else {
        handleStart();
      }
    }} />;
  }

  const sections = Object.values(Section);

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex flex-col pb-32">
      <EmojiBurst trigger={showMilestoneBurst} emojis={currentBurstEmojis} />
      
      <AnimatePresence>
        {successToast && (
          <motion.div 
            key="success-toast"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[60] pointer-events-none"
          >
            <div className="bg-[#2c4869] text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/20 backdrop-blur-md">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 text-xl">
                👏
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60 leading-none mb-1">Milestone Reached</span>
                <span className="text-sm font-black tracking-tight">{successToast.message}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="bg-white/40 backdrop-blur-md py-2.5 text-center border-b border-slate-200/50 z-30 sticky top-0">
        <div className="flex flex-col items-center gap-1">
          <span className="text-[9px] font-black text-[#2c4869] uppercase tracking-[0.3em] leading-none">
            Your STEM Profile Builder
          </span>
          <span className="text-[8px] font-medium text-[#2c4869]/60 uppercase tracking-[0.15em] leading-none">
            by VigyanShaala International
          </span>
        </div>
      </div>

      <header className="sticky top-[38px] z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex flex-col shadow-sm">
        <div className="px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <img 
                src={VIGYAN_SHAALA_LOGO} 
                alt="VigyanShaala Logo" 
                className="h-8 sm:h-10 object-contain"
              />
            </div>
            {profile.lastUpdatedAt && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                <div className="flex items-center gap-2 text-[9px] font-black text-[#2c4869]/40 uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></span>
                  Draft Saved: {new Date(profile.lastUpdatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
                {profile.lastSyncedAt && (
                  <div className="flex items-center gap-2 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                    Sent to Curie: {new Date(profile.lastSyncedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-6 flex-1 max-w-md justify-end w-full">
            <button
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' });
                setIsAuthenticated(false);
                setUser(null);
                setIsStarted(false);
                setProfile(INITIAL_PROFILE);
                localStorage.removeItem(STORAGE_KEY);
              }}
              className="text-[10px] font-bold text-slate-500 hover:text-slate-800 uppercase tracking-wider transition-colors whitespace-nowrap"
            >
              Sign Out
            </button>
            <div className="flex flex-col items-end w-full">
              <div className="flex justify-between w-full mb-1.5 px-0.5">
                <span className="text-[10px] font-black text-[#2c4869]/40 uppercase tracking-widest leading-none">
                  Profile Completeness
                </span>
                <span className="text-[10px] font-black text-[#2c4869] leading-none">
                  {completeness}%
                </span>
              </div>
              <div className="w-full h-2 bg-[#2c4869]/10 rounded-full overflow-hidden shadow-inner relative">
                 <motion.div 
                   key={completeness}
                   initial={{ opacity: 0.5 }}
                   animate={{ opacity: 1 }}
                   className="absolute inset-0 bg-white/30 z-10 pointer-events-none"
                   transition={{ duration: 0.5 }}
                 />
                 <div 
                   className="h-full bg-gradient-to-r from-[#ffcd29] to-[#f58434] transition-all duration-700 ease-out"
                   style={{ width: `${completeness}%` }}
                 />
              </div>
            </div>
          </div>
        </div>
        
        <div className="w-full border-t border-slate-200/50 bg-slate-50/50 px-6 py-2 overflow-x-auto no-scrollbar flex gap-4">
          <div className="flex gap-4 max-w-2xl mx-auto w-full">
            {Object.entries(SECTION_LEVELS).map(([level, sections]) => (
              <div key={level} className="flex gap-2">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center pr-2 border-r border-slate-200">
                  {level}
                </span>
                {sections.map((sec) => {
                  const isVisible = visibleSections.includes(sec);
                  if (!isVisible) return null;
                  const isCurrent = editingSection === sec;
                  const isCompleted = Object.keys(validateSection(sec)).length === 0;
                  const isSaved = savedSections.includes(sec);
                  
                  return (
                    <button
                      key={sec}
                      onClick={() => {
                        sectionRefs.current[sec]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all ${isCurrent ? 'bg-[#2c4869] text-white shadow-md' : isCompleted ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100' : isSaved ? 'bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'}`}
                    >
                      {sec.split(' ')[0]}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
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

      <main className="flex-1 w-full max-w-2xl mx-auto px-6 pt-8 space-y-24">
        <AnimatePresence mode="popLayout">
          {Object.entries(SECTION_LEVELS).map(([level, sections]) => (
            <div key={level} className="space-y-8">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-2">
                {level} Personalization
              </h3>
              {sections.map((section, index) => {
                if (!visibleSections.includes(section)) return null;
                return (
                  <motion.div 
                    key={section}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    ref={el => sectionRefs.current[section] = el}
                    className="scroll-mt-48"
                  >
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2c4869] text-white text-[10px] font-black">
                    {index + 1}
                  </span>
                  <h2 className="text-2xl font-black text-[#2c4869]">
                    {section === Section.BASIC && "Let's start with the basics"}
                    {section === Section.ACADEMIC && "Your Academic Path"}
                    {section === Section.SKILLS && "Skills & Expertise"}
                    {section === Section.MILESTONES && "Achievements & Milestones"}
                    {section === Section.REFLECTIONS && "Your STEM Mindset"}
                    {section === Section.REVIEW && "Review Your Profile"}
                  </h2>
                  {section !== Section.REVIEW && Object.keys(validateSection(section)).length === 0 && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-[9px] font-black uppercase tracking-wider">Completed</span>
                    </motion.div>
                  )}
                  {section !== Section.REVIEW && savedSections.includes(section) && Object.keys(validateSection(section)).length > 0 && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="text-[9px] font-black uppercase tracking-wider">Incomplete</span>
                    </motion.div>
                  )}
                </div>
                {!(savedSections.includes(section) && editingSection !== section && isSectionFilled(section)) && (
                  <div className="text-[#2c4869]/60 font-medium">
                    {section === Section.BASIC && "Tell us who you are and how you’d like to be recognized in the STEM community."}
                    {section === Section.ACADEMIC && "Where are you currently learning? Tell us about your academic path and the subjects you’re diving into."}
                    {section === Section.SKILLS && (
                      <div className="space-y-1">
                        <p>What are you learning to do? From the tools you're just picking up to the skills you're mastering, every piece of your expertise helps Curie guide you.</p>
                        <p className="text-xs opacity-80 italic">These are the core competencies that define a STEM professional at the undergraduate level.</p>
                      </div>
                    )}
                    {section === Section.MILESTONES && (
                      <div className="space-y-1">
                        <p>Add important steps in your learning journey — projects you have built, certifications you are pursuing, or exams that are part of your progress.</p>
                      </div>
                    )}
                    {section === Section.REFLECTIONS && "Your reflections help us understand who you are as a learner: what drives you, what you're good at, what you're curious about, and where you may need support in your STEM journey. There are no right or wrong answers."}
                    {section === Section.REVIEW && "Check your answers before sending your data to Curie for personalized guidance."}
                  </div>
                )}
              </div>

              <div className="transition-all duration-300">
                {savedSections.includes(section) && editingSection !== section && isSectionFilled(section) && section !== Section.REVIEW ? (
                  <SectionSummary 
                    section={section} 
                    profile={profile} 
                    onEdit={() => setEditingSection(section)} 
                  />
                ) : (
                  <>
                    {section === Section.BASIC && (
                      <IdentityForm profile={draftProfile || profile} updateProfile={updateDraftProfile} validationErrors={validationErrors?.section === Section.BASIC ? validationErrors.fields : {}} />
                    )}
                    {section === Section.ACADEMIC && (
                      <AcademicForm profile={draftProfile || profile} updateProfile={updateDraftProfile} validationErrors={validationErrors?.section === Section.ACADEMIC ? validationErrors.fields : {}} />
                    )}
                    {section === Section.SKILLS && (
                      <ExpertiseForm profile={draftProfile || profile} updateProfile={updateDraftProfile} validationErrors={validationErrors?.section === Section.SKILLS ? validationErrors.fields : {}} />
                    )}
                    {section === Section.MILESTONES && (
                      <MilestoneForm profile={draftProfile || profile} updateProfile={updateDraftProfile} validationErrors={validationErrors?.section === Section.MILESTONES ? validationErrors.fields : {}} />
                    )}
                    {section === Section.REFLECTIONS && (
                      <ReflectionForm profile={draftProfile || profile} updateProfile={updateDraftProfile} validationErrors={validationErrors?.section === Section.REFLECTIONS ? validationErrors.fields : {}} />
                    )}
                    
                    {section !== Section.REVIEW && (
                      <div className="flex items-center justify-center gap-4 mt-8">
                        <button 
                          onClick={handleCancel}
                          className="px-6 py-2.5 rounded-xl font-black text-slate-500 hover:text-slate-700 transition-all"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => handleSave(section)}
                          className="px-6 py-2.5 rounded-xl font-black bg-[#2c4869] text-white shadow-lg hover:shadow-xl transition-all"
                        >
                          Save Changes
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
              {section === Section.REVIEW && (
                <ReviewPage 
                  profile={profile} 
                  completeness={completeness}
                  chatPreferences={chatPreferences}
                  setChatPreferences={setChatPreferences}
                  updateProfile={updateProfile}
                  setCurrentSection={(s) => {
                    setEditingSection(s);
                    setValidationErrors(null);
                    sectionRefs.current[s]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }} 
                />
              )}

              {section !== Section.REVIEW && (
                <div className="mt-12 space-y-6">
                  {editingSection !== section && (!savedSections.includes(section) || !isSectionFilled(section)) ? (
                    <>
                      {validationErrors?.section === section && Object.keys(validationErrors.fields).length > 0 && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 text-red-500">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-red-800 mb-1 uppercase tracking-wider">Missing Information</p>
                              <ul className="text-sm text-red-700 leading-relaxed list-disc list-inside">
                                {Object.values(validationErrors.fields).map((error, i) => (
                                  <li key={i}>{error}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-center gap-4">
                        <button 
                          onClick={() => handleSkip(section)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-[#2c4869]/40 border border-slate-200 font-black transition-all active:scale-95 text-[10px] uppercase tracking-widest hover:bg-slate-50 hover:text-[#2c4869]/60"
                        >
                          <span>Skip Section</span>
                        </button>
                        
                        <div className={`relative group ${!isSectionDirty(section) ? 'cursor-not-allowed' : ''}`}>
                          <button 
                            onClick={() => handleSave(section)}
                            disabled={!isSectionDirty(section)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black transition-all active:scale-95 text-[10px] uppercase tracking-widest shadow-lg relative overflow-hidden ${
                              isSectionDirty(section) 
                                ? 'bg-[#2c4869] text-white shadow-[#2c4869]/20 group-hover:shadow-xl group-hover:shadow-[#2c4869]/30 group-hover:-translate-y-0.5' 
                                : 'bg-slate-200 text-slate-400 shadow-none pointer-events-none'
                            }`}
                          >
                            {isSectionDirty(section) && (
                              <motion.div 
                                animate={{ 
                                  x: ['-100%', '200%'],
                                }}
                                transition={{ 
                                  repeat: Infinity, 
                                  duration: 2,
                                  ease: "linear"
                                }}
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none"
                              />
                            )}
                            <span>Save details</span>
                            <svg className={`w-3.5 h-3.5 transition-transform ${isSectionDirty(section) ? 'group-hover:translate-y-1' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          
                          {!isSectionDirty(section) && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-2 bg-slate-800 text-white text-[10px] font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-xl flex flex-col items-center">
                              <span>Please fill in at least one field to save</span>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              )}
              
              {/* Section Divider Removed */}
            </motion.div>
                );
              })}
            </div>
          ))}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default App;
