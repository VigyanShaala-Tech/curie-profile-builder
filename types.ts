
export enum Section {
  BASIC = 'identity',
  ACADEMIC = 'academics',
  SKILLS = 'expertise',
  MILESTONES = 'milestones',
  REFLECTIONS = 'reflections',
  REVIEW = 'review'
}

export interface MilestoneDetail {
  name: string;
  status: string;
  details: string;
  customName?: string;
  isSaved?: boolean;
}

export interface ChatPreferences {
  responseLength: 'short' | 'short-examples' | 'detailed' | '';
  responseFormat: 'bullets' | 'paragraphs' | 'mix' | '';
}

export const INITIAL_CHAT_PREFERENCES: ChatPreferences = {
  responseLength: '',
  responseFormat: '',
};

export interface ProjectDetail {
  name: string;
  status?: string;
  details?: string;
  isSaved?: boolean;
}

export interface Profile {
  fullName: string;
  gender: string;
  pronouns: string;
  email: string;
  whatsappNumber: string;
  location: string;
  academicStatus: 'studying' | 'graduated' | '';
  degreeType: string;
  yearOfStudy: string;
  graduationYear: string;
  topLevelCategory: string; // 'Sciences' or 'Engineering'
  specializationCategory: string;
  customCategory: string;
  specialization: string;
  customSpecialization: string;
  collegeName: string;
  cgpa: string;
  // Expertise Core
  subjectSkills: string[];
  toolSkills: string[];
  aiSkills: string[];
  professionalSkills: string[];
  projects: ProjectDetail[];
  exams: MilestoneDetail[];
  certifications: MilestoneDetail[];
  
  internships: string[];
  volunteering: string[];
  interests: string[];
  aspirations: {
    idealRole: string;
    industryInterest: string;
    higherStudies: boolean;
    researchInterest: boolean;
  };
  reflections: {
    impactPurpose: string;
    strengths: string;
    curiosity: string;
    grittyGrowth: string;
    spark: string;
    opportunities: string;
    threats: string;
  };
  lastSyncedAt?: string;
  lastUpdatedAt?: string;
}

export const INITIAL_PROFILE: Profile = {
  fullName: '',
  gender: '',
  pronouns: '',
  email: '',
  whatsappNumber: '',
  location: '',
  academicStatus: '',
  degreeType: '',
  yearOfStudy: '',
  graduationYear: '',
  topLevelCategory: '',
  specializationCategory: '',
  customCategory: '',
  specialization: '',
  customSpecialization: '',
  collegeName: '',
  cgpa: '',
  subjectSkills: [],
  toolSkills: [],
  aiSkills: [],
  professionalSkills: [],
  projects: [],
  exams: [],
  certifications: [],
  internships: [],
  volunteering: [],
  interests: [],
  aspirations: {
    idealRole: '',
    industryInterest: '',
    higherStudies: false,
    researchInterest: false
  },
  reflections: {
    impactPurpose: '',
    strengths: '',
    curiosity: '',
    grittyGrowth: '',
    spark: '',
    opportunities: '',
    threats: ''
  },
  lastSyncedAt: undefined,
  lastUpdatedAt: undefined
};
