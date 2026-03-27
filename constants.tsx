import { Section } from './types';

export const DEGREE_OPTIONS = [
  'B.Tech / B.E.',
  'M.Tech / M.E.',
  'B.Sc / B.S.',
  'M.Sc / M.S.',
  'BCA / MCA',
  'Integrated M.Tech / M.Sc',
  'B.Pharm / M.Pharm',
  'B.Arch / M.Arch',
  'PhD',
  'Diploma'
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
      "Biotechnology", "Botany", "Zoology", "Immunology", "Microbiology"
    ],
    "Chemistry": [
      "Analytical Chemistry", "Computational Chemistry", "Inorganic Chemistry", "Medicinal Chemistry", 
      "Nanotechnology & Materials Science", "Organic Chemistry", "Physical Chemistry", "Polymer Chemistry", "Pharmacy"
    ],
    "Computer Sciences and Application": [
      "Programming & Software Development", "Operating Systems & System Programming", 
      "Database Management Systems (DBMS)", "Web Development & Cloud Computing", 
      "Computer Networks & Security", "Embedded Systems & IoT", "Robotics & Automation", 
      "Cybersecurity & Ethical Hacking", "Game Development & Graphics", "Computer Science"
    ],
    "Data Science, AI and ML": [
      "Data Science & Machine Learning", "Deep Learning & AI Applications", "Big Data & Data Engineering", 
      "Natural Language Processing (NLP)", "Data Visualization & Business Intelligence", "Computer Vision"
    ],
    "Earth & Environmental Sciences": [
      "Geology & Geophysics", "Climate, Ocean & Atmospheric Sciences", "Planetary & Space Sciences", 
      "Atmospheric Sciences", "Ecology & Conservation", "Environmental Chemistry & Toxicology", 
      "Forestry", "Natural Resource Management"
    ],
    "Food Science": [
      "Food Microbiology", "Food Biotechnology", "Food Chemistry", "Food Toxicology", 
      "Nutritional Biochemistry", "Food Processing", "Food Quality Control"
    ],
    "Forensics Science": [
      "Forensic Biology", "Forensic Chemistry & Toxicology", "Forensic Physics & Ballistics", "Cyber Forensics"
    ],
    "Mathematics & Statistics": [
      "Pure Mathematics", "Applied Mathematics", "Statistics & Probability", 
      "Discrete Mathematics", "Mathematical Modeling & Applied Sciences"
    ],
    "Physics": [
      "Astrophysics", "Biophysics", "Computational Physics", "Nanotechnology & Materials Science", 
      "Mathematical Physics", "Medical Physics", "Optics & Photonics", "Theoretical Physics", 
      "Space Science", "Fluid Mechanics", "Electronics"
    ],
    "Psychology": [
      "Cognitive & Neuroscience Psychology", "Computational Psychology", "Human Factors & Ergonomics", 
      "Behavioral & Biological Psychology", "Forensic & Legal Psychology", "Industrial-Organizational Psychology", 
      "Medical & Health Psychology"
    ],
    "Material Sciences": [
      "Metallurgy", "Ceramics & Glass Science", "Polymer Science", "Energy Materials", 
      "Composite Material Science", "Electronic & Photonic Materials", "Biomaterials", 
      "Computational Materials Science", "Electronic & Magnetic Materials"
    ]
  },
  "Engineering": {
    "Aeronautical Engineering": [
      "Aircraft Structures & Materials", "Aerodynamics & Fluid Mechanics", "Propulsion Systems", 
      "Avionics & Flight Control", "Aircraft Design & Manufacturing"
    ],
    "Aerospace Engineering": [
      "Aerodynamics & Propulsion", "Spacecraft Design & Engineering", 
      "Orbital Mechanics & Space Propulsion", "Space Systems Engineering", "Rocket & Propulsion Technology"
    ],
    "Agricultural Engineering": [
      "Farm Machinery & Mechanization", "Soil & Water Engineering", 
      "Agricultural Structures & Environmental Control", "Food & Bioprocess Engineering", 
      "Renewable Energy in Agriculture", "Precision Agriculture & Smart Farming", 
      "Post-Harvest Technology", "Environmental & Waste Management Engineering"
    ],
    "Artificial Intelligence / Machine Learning": [
      "AI in Finance"
    ],
    "Automobile Engineering": [
      "Vehicle Design & Manufacturing", "Powertrain & Propulsion Systems", 
      "Automotive Electronics & AI", "Chassis & Vehicle Dynamics", "Safety & Crash Testing", 
      "Sustainability & Alternative Fuels"
    ],
    "Biotechnology, Bioengineering & Biomedical Engineering": [
      "Biotechnology", "Biomedical Engineering", "Genetic & Molecular Engineering", 
      "Bioprocess & Biochemical Engineering", "Computational & Systems Bioengineering"
    ],
    "Chemical Engineering": [
      "Process Engineering", "Biochemical & Bioprocess Engineering", "Petroleum & Energy Engineering", 
      "Materials & Polymer Engineering", "Environmental & Sustainable Engineering", 
      "Electrochemical Engineering", "Computational & Systems Engineering", "Thermodynamics & Transport Phenomena"
    ],
    "Civil Engineering": [
      "Construction Engineering & Management", "Highway Engineering", "Structural Engineering", "Water Resources Engineering"
    ],
    "Computer Science and Engineering (CSE)": [
      "Cybersecurity", "Information Technology", "Computer Vision Engineering", "Blockchain Engineering"
    ],
    "Data Science and Cloud": [
      "Cloud Computing & Big Data Engineering", "Data Engineering & Cloud Infrastructure", 
      "Machine Learning & AI", "DevOps, Cloud Automation & MLOps", "Business Intelligence & Decision Science"
    ],
    "Electrical Engineering": [
      "Power Systems & Energy Engineering", "Electronics & Embedded Systems", 
      "Control Systems & Automation", "Communication & Signal Processing"
    ],
    "Electronics and Communication Engineering": [
      "Communication Systems Engineering", "Embedded Systems Engineering", "Power Systems Engineering", 
      "Signal Processing Engineering", "Telecommunication Engineering", "Wireless Communication Engineering", 
      "VLSI Design & Embedded Systems"
    ],
    "Environmental Engineering": [
      "Coastal & Ocean Engineering", "Environmental Technology", 
      "Forestry & Ecological Engineering", "Geological Engineering"
    ],
    "Interdisciplinary Engineering": [
      "Internet of Things (IoT)", "Drone & Unmanned Systems Engineering", 
      "Augmented Reality / Virtual Reality (AR/VR)", "Robotics Engineering"
    ],
    "Material Science & Nanotechnology": [
      "Metallurgical Engineering", "Composite Materials Engineering", "Nanotechnology Engineering"
    ],
    "Mechanical Engineering": [
      "Computational Fluid Dynamics Engineering", "Computational Mechanics Engineering", 
      "Mechatronics Engineering", "Marine Engineering"
    ],
    "Mining & Mineral Engineering": [
      "Mine Planning & Design", "Rock Mechanics & Ground Control", "Mineral Processing & Extractive Metallurgy"
    ],
    "Nuclear Engineering": [
      "Nuclear Reactor Design & Engineering", "Nuclear Fuel Cycle & Waste Management", 
      "Nuclear Materials & Structural Integrity", "Plasma Physics & Fusion Energy", 
      "Nuclear Policy & Non-Proliferation"
    ],
    "Petroleum Engineering": [
      "Oil & Gas Engineering", "Reservoir Engineering", "Drilling & Well Engineering", 
      "Production & Refining Engineering"
    ],
    "Systems and Control Engineering": [
      "Manufacturing Engineering", "Industrial Engineering", "Instrumentation & Control Engineering"
    ],
    "Textile Engineering": [
      "Textile Materials Science", "Textile Manufacturing & Production", "Textile Chemistry", 
      "Smart Textiles", "Textile Machinery & Automation", "Sustainable Textiles"
    ],
    "Urban and Regional Planning Engineering": [
      "Transportation Engineering", "Geospatial & GIS Engineering"
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
