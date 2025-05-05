export interface CCIParameter {
  id: number;
  measureId: string;
  title: string;
  description: string;
  formula: string;
  target: number; // Usually 100%
  weightage: number; // As percentage (e.g., 8 for 8%)
  numerator: number;
  denominator: number;
  selfAssessmentScore: number;
  controlInfo: string; // Information about the control
  implementationEvidence: string; // Required implementation evidence
  auditorComments: string; // Comments from auditor
  standardContext?: string; // Additional context about the standard
  bestPractices?: string; // Best practices for implementation
  regulatoryGuidelines?: string; // Relevant regulatory guidelines and references
  frameworkCategory?: string; // Category within the CSCRF framework
  numeratorHelp?: string; // Help text for calculating the numerator
  denominatorHelp?: string; // Help text for calculating the denominator
}

export interface CategoryScore {
  name: string;
  score: number;
}

export interface ImprovementArea {
  measureId: string;
  title: string;
  score: number;
  impact: number;
}

export interface CCIResult {
  totalScore: number;
  maturityLevel: string;
  maturityDescription: string;
  date: string; // Date of assessment
  organization: string; // Organization name
  categoryScores?: CategoryScore[]; // Score breakdown by category
  improvementAreas?: ImprovementArea[]; // Top improvement areas
}

// Annexure K form data interface
export interface AnnexureKData {
  organization: string;
  entityType: string;
  entityCategory: string;
  rationale: string;
  period: string;
  auditingOrganization: string;
  signatoryName: string;
  designation: string;
}

// SBOM Interfaces
export interface SBOMComponent {
  id: string;
  name: string;
  version: string;
  supplier: string;
  license: string;
  cryptographicHash: string;
  dependencies: string[]; // IDs of dependent components
  description?: string;
}

export interface SBOMDocument {
  id: string;
  name: string;
  version: string;
  supplier: string;
  dateCreated: string;
  lastUpdated: string;
  updateFrequency: string;
  encryptionUsed: string;
  accessControl: string;
  errorHandlingMethod: string;
  knownUnknowns: string[];
  components: SBOMComponent[];
  notes?: string;
}

export interface SBOMRegistry {
  sbomDocuments: SBOMDocument[];
  criticalSystems: string[]; // IDs of critical systems
}

export const maturityLevels = [
  { min: 91, max: 100.99, level: 'Exceptional Cybersecurity Maturity' },
  { min: 81, max: 90.99, level: 'Optimal Cybersecurity Maturity' },
  { min: 71, max: 80.99, level: 'Manageable Cybersecurity Maturity' },
  { min: 61, max: 70.99, level: 'Developing Cybersecurity Maturity' },
  { min: 51, max: 60.99, level: 'Bare Minimum Cybersecurity Maturity' },
  { min: 0, max: 50.99, level: 'Fail' },
];

// SEBI Entity Classification (April 30, 2025 Circular)
export interface EntityClassificationCriteria {
  id: string;
  name: string;
  description: string;
  qualifiedREsThreshold: string;
  midSizeREsThreshold: string;
  smallSizeREsThreshold: string;
  selfCertificationThreshold: string;
}

export const entityTypes = [
  'Stock Broker',
  'Depository Participant',
  'Portfolio Manager',
  'Investment Advisor',
  'Research Analyst',
  'Stock Exchange',
  'Depository',
  'Clearing Corporation',
  'Merchant Banker',
  'Registrar to an Issue and Share Transfer Agent (RTA)',
  'KYC Registration Agency (KRA)',
  'Alternative Investment Fund (AIF)',
  'Venture Capital Fund (VCF)',
  'Other'
];

export const entityCategories = [
  'Qualified RE',
  'Mid-size RE',
  'Small-size RE',
  'Self-certification RE',
  'MII'
];

export const entityClassificationCriteria: Record<string, EntityClassificationCriteria[]> = {
  'Stock Broker': [
    {
      id: 'clients',
      name: 'Number of total registered clients',
      description: 'Total number of clients registered with the broker',
      qualifiedREsThreshold: 'More than 10 lakhs',
      midSizeREsThreshold: 'More than 1 lakh and up to 10 lakhs',
      smallSizeREsThreshold: 'More than 10,000 and up to 1 lakh',
      selfCertificationThreshold: 'Up to 10,000'
    },
    {
      id: 'trading',
      name: 'Total trading value across segments',
      description: 'Annual trading value across all market segments',
      qualifiedREsThreshold: 'More than ₹10,00,000 Cr',
      midSizeREsThreshold: 'More than ₹1,00,000 Cr and up to ₹10,00,000 Cr',
      smallSizeREsThreshold: 'More than ₹10,000 Cr and up to ₹1,00,000 Cr',
      selfCertificationThreshold: 'Up to ₹10,000 Cr'
    }
  ],
  'Portfolio Manager': [
    {
      id: 'aum',
      name: 'Assets Under Management (AUM)',
      description: 'Total assets managed by the portfolio manager',
      qualifiedREsThreshold: 'Not applicable',
      midSizeREsThreshold: 'More than ₹3,000 Cr',
      smallSizeREsThreshold: 'Not applicable',
      selfCertificationThreshold: 'Up to ₹3,000 Cr'
    }
  ],
  'Investment Advisor': [
    {
      id: 'clients',
      name: 'Number of clients',
      description: 'Total number of advisory clients',
      qualifiedREsThreshold: 'Not applicable',
      midSizeREsThreshold: 'More than 500',
      smallSizeREsThreshold: 'More than 100 and up to 500',
      selfCertificationThreshold: 'Up to 100'
    }
  ]
};

export const getEntityCategory = (
  entityType: string, 
  clientCount: number, 
  tradingValue: number, 
  aum: number
): string => {
  if (['Stock Exchange', 'Depository', 'Clearing Corporation'].includes(entityType)) {
    return 'MII';
  }
  
  if (entityType === 'Stock Broker') {
    // Apply the highest category based on either parameter
    if (clientCount > 1000000 || tradingValue > 1000000) {
      return 'Qualified RE';
    } else if ((clientCount > 100000 && clientCount <= 1000000) || 
              (tradingValue > 100000 && tradingValue <= 1000000)) {
      return 'Mid-size RE';
    } else if ((clientCount > 10000 && clientCount <= 100000) || 
              (tradingValue > 10000 && tradingValue <= 100000)) {
      return 'Small-size RE';
    } else {
      return 'Self-certification RE';
    }
  }
  
  if (entityType === 'Portfolio Manager') {
    return aum > 3000 ? 'Mid-size RE' : 'Self-certification RE';
  }
  
  if (entityType === 'Investment Advisor') {
    if (clientCount > 500) {
      return 'Mid-size RE';
    } else if (clientCount > 100 && clientCount <= 500) {
      return 'Small-size RE';
    } else {
      return 'Self-certification RE';
    }
  }
  
  // Default for other entity types not specifically mentioned in the circular
  return 'Self-certification RE';
}; 