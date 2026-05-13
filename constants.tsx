import { Profile, Section } from './types';

/** Number of expertise prompts (subject, tools, AI, professional, interests). */
export const EXPERTISE_TOTAL_PROMPTS = 5;

/** Minimum distinct prompts that must have at least one entry to complete Expertise. */
export const MIN_EXPERTISE_QUESTIONS = 3;

export const getExpertiseAnsweredCount = (p: Profile): number =>
  [
    p.subjectSkills.length > 0,
    p.toolSkills.length > 0,
    p.aiSkills.length > 0,
    p.professionalSkills.length > 0,
    p.interests.length > 0,
  ].filter(Boolean).length;

export const DEGREE_OPTIONS = [
  'B.E./B.Tech',
  'BSc.',
  'Integrated BS-MS or BSc-MSc',
  'Integrated Dual Degree(BTech + MTech)',
  'BCA/BCS',
  'B.Arch',
  'MSc.',
  'M.E./M.Tech',
  'MCS / MCA',
  'M.Arch',
  'PhD',
  'B.Pharmacy',
  'M.Pharma',
  'MBA',
  'B.Ed',
  'M.Ed',
  'MBBS',
  'BAMS',
  'BHMS',
  'BPT',
];

export const STEM_HIERARCHY: Record<string, Record<string, string[]>> = {
  "Sciences": {
    "Agricultural Sciences": [
      "Horticulture", "Agronomy", "Animal Husbandry", "Soil & Water Conservation", 
      "Crop Production", "Crop Protection", "Agricultural Biotechnology & Genetics", "Agroforestry"
    ],
    "Biological Sciences": [
      "Biochemistry & Molecular Biology", "Genetics & Evolutionary Biology", "Neuroscience & Cognitive Sciences", 
      "Ecology & Environmental Biology", "Biomedical & Pharmaceutical Sciences", "Computational Biology & Bioinformatics", 
      "Biotechnology", "Botany", "Zoology", "Immunology", "Microbiology", "Animal Husbandry", "Biology"
    ],
    "Chemistry": [
      "Analytical Chemistry", "Computational Chemistry", "Inorganic Chemistry", "Medicinal Chemistry", 
      "Nanotechnology & Materials Science", "Organic Chemistry", "Physical Chemistry", "Polymer Chemistry", "Pharmacy", "Chemistry"
    ],
    "Computer Sciences and Application": [
      "Programming & Software Development", "Operating Systems & System Programming", 
      "Database Management Systems (DBMS)", "Web Development & Cloud Computing", 
      "Computer Networks & Security", "Embedded Systems & IoT", "Robotics & Automation", 
      "Cybersecurity & Ethical Hacking", "Game Development & Graphics", "Computer Science", "Computer Application"
    ],
    "Data Science, AI and ML": [
      "Data Science & Machine Learning", "Deep Learning & AI Applications", "Big Data & Data Engineering", 
      "Natural Language Processing (NLP)", "Data Visualization & Business Intelligence", "Computer Vision", "Data Science", "Artificial Intelligence & Machine Learning", 
      "Machine Learning", "Artificial Intelligence"
    ],
    "Earth & Environmental Sciences": [
      "Geology & Geophysics", "Climate, Ocean & Atmospheric Sciences", "Planetary & Space Sciences", 
      "Atmospheric Sciences", "Ecology & Conservation", "Environmental Chemistry & Toxicology", 
      "Forestry", "Natural Resource Management", "Earth Science", "Environmental Science"
    ],
    "Food Science": [
      "Food Microbiology", "Food Biotechnology", "Food Chemistry", "Food Toxicology", 
      "Nutritional Biochemistry", "Food Processing", "Food Quality Control", "Food Science"
    ],
    "Forensics Science": [
      "Forensic Biology", "Forensic Chemistry & Toxicology", "Forensic Physics & Ballistics", "Cyber Forensics"
    ],
    "Mathematics & Statistics": [
      "Pure Mathematics", "Applied Mathematics", "Statistics & Probability", 
      "Discrete Mathematics", "Mathematical Modeling & Applied Sciences", "Mathematics", "Statistics"
    ],
    "Physics": [
      "Astrophysics", "Biophysics", "Computational Physics", "Nanotechnology & Materials Science", 
      "Mathematical Physics", "Medical Physics", "Optics & Photonics", "Theoretical Physics", 
      "Space Science", "Fluid Mechanics", "Electronics", "Physics"
    ],
    "Psychology": [
      "Cognitive & Neuroscience Psychology", "Computational Psychology", "Human Factors & Ergonomics", 
      "Behavioral & Biological Psychology", "Forensic & Legal Psychology", "Industrial-Organizational Psychology", 
      "Medical & Health Psychology", "Psychology"
    ],
    "Material Sciences": [
      "Metallurgy", "Ceramics & Glass Science", "Polymer Science", "Energy Materials", 
      "Composite Material Science", "Electronic & Photonic Materials", "Biomaterials", 
      "Computational Materials Science", "Electronic & Magnetic Materials", "Material Science"
    ],
    "Nursing": [
      "Nursing"
    ],
    "Homeopathy": [
      "Homeopathy"
    ],
    "Ayurveda": [
      "Ayurveda"
    ],
    "Physiotherapy": [
      "Physiotherapy"
    ]

  },
  "Engineering": {
    "Aeronautical Engineering": [
      "Aircraft Structures & Materials", "Aerodynamics & Fluid Mechanics", "Propulsion Systems", 
      "Avionics & Flight Control", "Aircraft Design & Manufacturing", "Aeronautical Engineering"
    ],
    "Aerospace Engineering": [
      "Aerodynamics & Propulsion", "Spacecraft Design & Engineering", "Aerospace Engineering",
      "Orbital Mechanics & Space Propulsion", "Space Systems Engineering", "Rocket & Propulsion Technology"
    ],
    "Agricultural Engineering": [
      "Farm Machinery & Mechanization", "Soil & Water Engineering", "Agricultural Engineering",
      "Agricultural Structures & Environmental Control", "Food & Bioprocess Engineering", 
      "Renewable Energy in Agriculture", "Precision Agriculture & Smart Farming", 
      "Post-Harvest Technology", "Environmental & Waste Management Engineering"
    ],
    "Artificial Intelligence / Machine Learning": [
      "AI in Finance", "Artificial Intelligence/Machine Learning"
    ],
    "Automobile Engineering": [
      "Vehicle Design & Manufacturing", "Powertrain & Propulsion Systems", 
      "Automotive Electronics & AI", "Chassis & Vehicle Dynamics", "Safety & Crash Testing", 
      "Sustainability & Alternative Fuels", "Automobile Engineering"
    ],
    "Biotechnology, Bioengineering & Biomedical": [
      "Bioengineering", "Biotechnology, Bioengineering & Biomedical", "Genetic & Molecular Engineering", 
      "Bioprocess & Biochemical Engineering", "Computational & Systems Bioengineering", "Biomedical Engineering"
    ],
    "Chemical Engineering": [
      "Process Engineering", "Biochemical & Bioprocess Engineering", "Petroleum & Energy Engineering", 
      "Materials & Polymer Engineering", "Environmental & Sustainable Engineering", 
      "Electrochemical Engineering", "Computational & Systems Engineering", "Thermodynamics & Transport Phenomena", "Chemical Engineering"
    ],
    "Civil Engineering": [
      "Construction Engineering & Management", "Highway Engineering", "Structural Engineering", "Water Resources Engineering", "Civil Engineering"
    ],
    "Computer Science and Engineering (CSE)": [
      "Cybersecurity", "Information and Technology", "Computer Vision Engineering", "Blockchain Engineering", "Computer Science and Engineering (CSE)"
    ],
    "Data Science and Cloud": [
      "Cloud Computing & Big Data Engineering", "Data Engineering & Cloud Infrastructure", 
      "Machine Learning & AI", "DevOps, Cloud Automation & MLOps", "Business Intelligence & Decision Science", "Data Science and Cloud"
    ],
    "Electrical Engineering": [
      "Power Systems & Energy Engineering", "Electronics & Embedded Systems", 
      "Control Systems & Automation", "Communication & Signal Processing", "Electrical Engineering"
    ],
    "Electronics and Communication Engineering": [
      "Communication Systems Engineering", "Embedded Systems Engineering", "Power Systems Engineering", 
      "Signal Processing Engineering", "Telecommunication Engineering", "Wireless Communication Engineering", 
      "VLSI Design & Embedded Systems", "Electronics and Communication Engineering"
    ],
    "Environmental Engineering": [
      "Coastal & Ocean Engineering", "Environmental Tech", 
      "Forestry & Ecological Engineering", "Geological Engineering", "Environmental Engineering"
    ],
    "Interdisciplinary Engineering": [
      "Internet of Things (IoT)", "Drone & Unmanned Systems Engineering", 
      "Augmented Virtual Reality (AR/VR)", "Robotics Engineering", "Interdisciplinary Engineering"
    ],
    "Material Science & Nanotechnology": [
      "Metallurgical Engineering", "Composite Materials Engineering", "Nanotechnology Engineering", "Material Science & Nanotechnology"
    ],
    "Mechanical Engineering": [
      "Computational Fluid Dynamics Engineering", "Computational Mechanics Engineering", 
      "Mechatronics Engineering", "Marine Engineering", "Mechanical Engineering"
    ],
    "Mining & Mineral Engineering": [
      "Mine Planning & Design", "Rock Mechanics & Ground Control", "Mineral Processing & Extractive Metallurgy", "Mining & Mineral Engineering"
    ],
    "Nuclear Engineering": [
      "Nuclear Reactor Design & Engineering", "Nuclear Fuel Cycle & Waste Management", 
      "Nuclear Materials & Structural Integrity", "Plasma Physics & Fusion Energy", 
      "Nuclear Policy & Non-Proliferation", "Nuclear Engineering"
    ],
    "Petroleum Engineering": [
      "Oil & Gas Engineering", "Reservoir Engineering", "Drilling & Well Engineering", 
      "Production & Refining Engineering", "Petroleum Engineering"
    ],
    "Systems and Control Engineering": [
      "Manufacturing Engineering", "Industrial Engineering", "Instrumentation & Control Engineering", "Systems and Control Engineering"
    ],
    "Textile Engineering": [
      "Textile Materials Science", "Textile Manufacturing & Production", "Textile Chemistry", 
      "Smart Textiles", "Textile Machinery & Automation", "Sustainable Textiles", "Textile Engineering"
    ],
    "Urban and Regional Planning Engineering": [
      "Transportation Engineering", "Geospatial & GIS Engineering", "Urban and Regional Planning Engineering"
    ]
  }
};

export const COMPETITIVE_EXAMS = [
  'GATE',
  'IIT-JAM',
  'CSIR-UGC NET',
  'JEST',
  'TIFR GS',
  'ICMR-JRF',
  'DBT-BET',
  'NBHM',
  'UPSC ESE',
  'CUET PG',
  'GAT-B',
  'GRE Subject Test',
  'ISRO Recruitment',
  'DRDO Recruitment',
  'BARC OCES / DGFS',
  'ISI Admission Test',
  'FRI Entrance Exam',
  'CMI Entrance Exam',
  'NIMCET',
  'UKSEE',
  'INAT',
  'RRI PhD Admission',
  'NEST',
  'Other Exam'
];

export const EXAM_STATUS_OPTIONS = [
  'Planning to take',
  'Preparing',
  'Attempted',
  'Qualified / Cleared'
];

export const CERTIFICATION_OPTIONS = [
  'AWS Certified',
  'Google Cloud Professional',
  'Microsoft Azure Certifications',
  'Cisco CCNA / CCNP',
  'Linux Certifications (LPIC / Red Hat)',
  'Machine Learning Certifications',
  'Data Science Certifications',
  'Deep Learning Certifications',
  'TensorFlow / PyTorch Certifications',
  'Data Analytics Certifications',
  'Python Certifications',
  'Java Certifications',
  'C / C++ Certifications',
  'Full-Stack Development Certifications',
  'Mobile App Development Certifications',
  'AutoCAD Certification',
  'SolidWorks Certification',
  'ANSYS Certification',
  'MATLAB Certification',
  'Embedded Systems Certifications',
  'Robotics Certifications',
  'Bioinformatics Certifications',
  'Genomics / Proteomics Courses',
  'Clinical Research Certifications',
  'Biostatistics Certifications',
  'Laboratory Techniques Certifications',
  'Environmental Impact Assessment Courses',
  'GIS / Remote Sensing Certifications',
  'Climate Data Analysis Courses',
  'Sustainability Certifications',
  'NPTEL / SWAYAM Certifications',
  'Coursera Certificates',
  'edX Certificates',
  'MIT OpenCourseWare Programs',
  'Other Certification'
];

export const CERTIFICATION_STATUS_OPTIONS = [
  'Planning to take',
  'Preparing',
  'Attempted',
  'Completed'
];

export const PROJECT_STATUS_OPTIONS = [
  'Planned',
  'In Progress',
  'Completed'
];

/** Align stored Sheet/local strings with canonical dropdown labels (trim + case-insensitive). */
export function normalizeMilestoneStatus(
  raw: string | undefined | null,
  allowed: readonly string[]
): string {
  const s = String(raw ?? '').trim();
  if (!s) return '';
  if (allowed.includes(s)) return s;
  const lower = s.toLowerCase();
  const match = allowed.find((opt) => opt.toLowerCase() === lower);
  return match ?? s;
}

/** Every project / exam / certification with a title must have a valid status label. */
export function getMilestoneStatusValidationError(prof: Profile): string | null {
  for (const p of prof.projects) {
    if (!p.name?.trim()) continue;
    const st = normalizeMilestoneStatus(p.status, PROJECT_STATUS_OPTIONS);
    if (!PROJECT_STATUS_OPTIONS.includes(st)) return 'Choose a status for each project';
  }
  for (const e of prof.exams) {
    if (!e.name?.trim()) continue;
    const st = normalizeMilestoneStatus(e.status, EXAM_STATUS_OPTIONS);
    if (!EXAM_STATUS_OPTIONS.includes(st)) return 'Choose a status for each exam';
  }
  for (const c of prof.certifications) {
    if (!c.name?.trim()) continue;
    const st = normalizeMilestoneStatus(c.status, CERTIFICATION_STATUS_OPTIONS);
    if (!CERTIFICATION_STATUS_OPTIONS.includes(st)) return 'Choose a status for each certification';
  }
  return null;
}

export const REFLECTION_PROMPTS = [
  {
    key: 'impactPurpose' as const,
    label: 'Your Purpose',
    description: 'What problem in the world would you like to help solve?',
    example: 'Example: clean water, healthcare, climate solutions.',
    prompt: ''
  },
  {
    key: 'strengths' as const,
    label: 'Your Strengths and Superpowers',
    description: 'What comes naturally to you?',
    example: 'Example: logical thinking, explaining ideas, organizing.',
    prompt: ''
  },
  {
    key: 'curiosity' as const,
    label: 'Your Interests',
    description: 'What topic or technology excites you the most? Why?',
    prompt: ''
  },
  {
    key: 'grittyGrowth' as const,
    label: 'Challenges You are Currently Facing',
    description: 'What topic or skill feels difficult right now? How are you improving?',
    prompt: ''
  },
  {
    key: 'spark' as const,
    label: 'Your Moments',
    description: 'Describe a moment when you solved a problem or helped someone learn.',
    example: 'Example: fixing a bug, explaining a concept.',
    prompt: ''
  },
  {
    key: 'opportunities' as const,
    label: 'Your Opportunities',
    description: 'What people or resources could help you grow?',
    example: 'Example: mentors, clubs, labs, competitions.',
    prompt: ''
  },
  {
    key: 'threats' as const,
    label: 'Your Barriers',
    description: 'What obstacles might make your STEM journey harder?',
    example: 'Example: time, money, confidence.',
    prompt: ''
  }
];

export const SECTION_LEVELS = {
  BASELINE: [Section.BASIC, Section.ACADEMIC, Section.SKILLS],
  DEEP: [Section.MILESTONES, Section.REFLECTIONS],
  REVIEW: [Section.REVIEW]
};
