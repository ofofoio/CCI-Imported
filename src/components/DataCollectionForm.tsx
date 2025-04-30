import React, { useState, useRef, useEffect, useMemo } from 'react';
import { CCIParameter, CCIResult } from '../app/types';
import { calculateParameterScore } from '../app/utils/cciCalculator';
import { calculateCCIIndex } from '../app/utils/cciCalculator';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface DataCollectionFormProps {
  parameters: CCIParameter[];
  onComplete: (updatedParameters: CCIParameter[]) => void;
  onCancel: () => void;
}

// Define walkthrough steps
interface WalkthroughStep {
  target: string;
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

const DataCollectionForm: React.FC<DataCollectionFormProps> = ({
  parameters,
  onComplete,
  onCancel
}) => {
  const [formData, setFormData] = useState<CCIParameter[]>(parameters);
  const [detailedData, setDetailedData] = useState<Record<number, { 
    numeratorBreakdown: { question: string, value: number }[], 
    denominatorBreakdown: { question: string, value: number }[] 
  }>>({});
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  
  // Walkthrough state
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  
  // Refs for walkthrough targets
  const parameterHeaderRef = useRef<HTMLDivElement>(null);
  const exportButtonRef = useRef<HTMLButtonElement>(null);
  const numeratorSectionRef = useRef<HTMLDivElement>(null);
  const denominatorSectionRef = useRef<HTMLDivElement>(null);
  const addQuestionButtonRef = useRef<HTMLButtonElement>(null);
  const evidenceSectionRef = useRef<HTMLDivElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);

  // Define walkthrough steps
  const walkthroughSteps: WalkthroughStep[] = [
    {
      target: 'header',
      title: 'Welcome to the CCI Detailed Calculator',
      content: 'This form allows you to enter detailed data for each parameter of the Cyber Capability Index. Follow this walkthrough to learn how to use it.',
      placement: 'bottom'
    },
    {
      target: 'parameter',
      title: 'Parameter Details',
      content: 'Each parameter has a title, description, and formula. The score is calculated automatically as you enter data.',
      placement: 'top'
    },
    {
      target: 'numerator',
      title: 'Numerator Questions',
      content: 'Enter values for each question in the numerator section. These values will be summed automatically to calculate the total numerator.',
      placement: 'right'
    },
    {
      target: 'denominator',
      title: 'Denominator Questions',
      content: 'Enter values for each question in the denominator section. These values will be summed automatically to calculate the total denominator.',
      placement: 'left'
    },
    {
      target: 'addQuestion',
      title: 'Add Custom Questions',
      content: 'You can add custom questions if needed for more detailed breakdowns.',
      placement: 'top'
    },
    {
      target: 'evidence',
      title: 'Implementation Evidence',
      content: 'Document your implementation evidence and auditor comments in these sections.',
      placement: 'bottom'
    },
    {
      target: 'export',
      title: 'Export Your Data',
      content: 'You can export your data to PDF at any time using this button.',
      placement: 'bottom'
    },
    {
      target: 'save',
      title: 'Save and Calculate',
      content: 'Once you\'ve entered all your data, click "Save and Calculate" to update your CCI index.',
      placement: 'top'
    }
  ];

  const handleChange = (paramId: number, field: keyof CCIParameter, value: any) => {
    setFormData(prevData =>
      prevData.map(param =>
        param.id === paramId ? { ...param, [field]: value } : param
      )
    );
  };

  const handleDetailedValueChange = (
    paramId: number, 
    type: 'numerator' | 'denominator', 
    index: number, 
    value: number
  ) => {
    setDetailedData(prev => {
      const paramData = prev[paramId] || {
        numeratorBreakdown: [],
        denominatorBreakdown: []
      };
      
      const updatedData = { ...prev };
      
      // Update the specific value
      if (type === 'numerator') {
        const updatedNumerator = [...paramData.numeratorBreakdown];
        updatedNumerator[index] = { ...updatedNumerator[index], value };
        updatedData[paramId] = {
          ...paramData,
          numeratorBreakdown: updatedNumerator
        };
      } else {
        const updatedDenominator = [...paramData.denominatorBreakdown];
        updatedDenominator[index] = { ...updatedDenominator[index], value };
        updatedData[paramId] = {
          ...paramData,
          denominatorBreakdown: updatedDenominator
        };
      }
      
      // Calculate and update the totals in formData
      if (type === 'numerator') {
        const numeratorTotal = updatedData[paramId].numeratorBreakdown.reduce(
          (sum, item) => sum + (item.value || 0), 0
        );
        handleChange(paramId, 'numerator', numeratorTotal);
      } else {
        const denominatorTotal = updatedData[paramId].denominatorBreakdown.reduce(
          (sum, item) => sum + (item.value || 0), 0
        );
        // Ensure denominator is not zero
        handleChange(paramId, 'denominator', denominatorTotal || 1);
      }
      
      return updatedData;
    });
  };

  const initializeDetailedData = (paramId: number) => {
    if (detailedData[paramId]) return;
    
    const param = formData.find(p => p.id === paramId);
    if (!param) return;
    
    // Set framework category based on measureId prefix if not already set
    if (!param.frameworkCategory) {
      // Handle special cases first
      if (param.measureId.includes(',')) {
        // For cases like "ID.AM.S1, ID.AM.S2" - take the first prefix
        const prefix = param.measureId.split('.')[0];
        handleCategoryAssignment(param, prefix);
      } else if (param.measureId === "Automated compliance with CSCRF") {
        // Special case for the automated compliance parameter
        handleChange(param.id, 'frameworkCategory', 'Governance');
      } else if (!param.measureId.includes('.')) {
        // For cases without the standard dot notation
        if (param.measureId.startsWith('GV') || 
            param.measureId.toLowerCase().includes('governance') ||
            param.measureId.toLowerCase().includes('policy')) {
          handleChange(param.id, 'frameworkCategory', 'Governance');
        } else {
          // Default category for unusual cases
          handleChange(param.id, 'frameworkCategory', 'Other');
        }
      } else {
        // Standard case - extract the prefix
        const prefix = param.measureId.split('.')[0];
        handleCategoryAssignment(param, prefix);
      }
    }
    
    // Create questions based on the parameter formula
    let numeratorQuestions: { question: string, value: number }[] = [];
    let denominatorQuestions: { question: string, value: number }[] = [];
    
    // Generate questions based on parameter type
    switch(param.id) {
      case 1: // Vulnerability Management Measure (DE.CM.S5)
        numeratorQuestions = [
          { question: "Critical vulnerabilities remediated within SLA:", value: 0 },
          { question: "High vulnerabilities remediated within SLA:", value: 0 },
          { question: "Medium vulnerabilities remediated within SLA:", value: 0 },
          { question: "Low vulnerabilities remediated within SLA:", value: 0 }
        ];
        denominatorQuestions = [
          { question: "Critical vulnerabilities identified:", value: 0 },
          { question: "High vulnerabilities identified:", value: 0 },
          { question: "Medium vulnerabilities identified:", value: 0 },
          { question: "Low vulnerabilities identified:", value: 0 }
        ];
        break;
      case 2: // Security Training Measure (PR.AT.S1)
        numeratorQuestions = [
          { question: "Full-time security personnel who completed training:", value: 0 },
          { question: "IT staff with security responsibilities who completed training:", value: 0 },
          { question: "Security contractors/consultants who completed training:", value: 0 },
          { question: "Security managers/leadership who completed training:", value: 0 }
        ];
        denominatorQuestions = [
          { question: "Total full-time security personnel:", value: 0 },
          { question: "Total IT staff with security responsibilities:", value: 0 },
          { question: "Total security contractors/consultants:", value: 0 },
          { question: "Total security managers/leadership:", value: 0 }
        ];
        break;
      case 3: // Security Budget Measure (GV.RR.S4)
        numeratorQuestions = [
          { question: "Annual expenditure on security hardware and appliances (INR):", value: 0 },
          { question: "Annual expenditure on security software and licenses (INR):", value: 0 },
          { question: "Annual expenditure on security personnel salaries and benefits (INR):", value: 0 },
          { question: "Annual expenditure on security training and awareness (INR):", value: 0 },
          { question: "Annual expenditure on security assessments and audits (INR):", value: 0 },
          { question: "Annual expenditure on security consulting services (INR):", value: 0 },
          { question: "Other security-related expenses (INR):", value: 0 }
        ];
        denominatorQuestions = [
          { question: "Annual expenditure on IT hardware (INR):", value: 0 },
          { question: "Annual expenditure on IT software and licenses (INR):", value: 0 },
          { question: "Annual expenditure on IT personnel salaries and benefits (INR):", value: 0 },
          { question: "Annual expenditure on IT infrastructure (network, data centers) (INR):", value: 0 },
          { question: "Annual expenditure on cloud services (INR):", value: 0 },
          { question: "Annual expenditure on IT outsourcing and managed services (INR):", value: 0 },
          { question: "Other IT-related expenses (INR):", value: 0 }
        ];
        break;
      case 4: // Remote Access Control Measure (PR.AA.S12)
        numeratorQuestions = [
          { question: "Employees using MFA for remote access:", value: 0 },
          { question: "Contractors using MFA for remote access:", value: 0 },
          { question: "Vendors using MFA for remote access:", value: 0 },
          { question: "Third-party service providers using MFA for remote access:", value: 0 }
        ];
        denominatorQuestions = [
          { question: "Total employees with remote access:", value: 0 },
          { question: "Total contractors with remote access:", value: 0 },
          { question: "Total vendors with remote access:", value: 0 },
          { question: "Total third-party service providers with remote access:", value: 0 }
        ];
        break;
      case 5: // Audit Record Review Measure (DE.CM.S1)
        numeratorQuestions = [
          { question: "Critical production systems integrated with SIEM:", value: 0 },
          { question: "Critical database systems integrated with SIEM:", value: 0 },
          { question: "Critical network devices integrated with SIEM:", value: 0 },
          { question: "Critical security systems integrated with SIEM:", value: 0 },
          { question: "Other critical systems integrated with SIEM:", value: 0 }
        ];
        denominatorQuestions = [
          { question: "Total critical production systems:", value: 0 },
          { question: "Total critical database systems:", value: 0 },
          { question: "Total critical network devices:", value: 0 },
          { question: "Total critical security systems:", value: 0 },
          { question: "Total other critical systems:", value: 0 }
        ];
        break;
      case 6: // Configuration Changes Measure (DE.CM.S5)
        numeratorQuestions = [
          { question: "Approved and implemented OS configuration changes:", value: 0 },
          { question: "Approved and implemented application configuration changes:", value: 0 },
          { question: "Approved and implemented database configuration changes:", value: 0 },
          { question: "Approved and implemented network device configuration changes:", value: 0 },
          { question: "Approved and implemented security tool configuration changes:", value: 0 }
        ];
        denominatorQuestions = [
          { question: "Total OS configuration changes detected:", value: 0 },
          { question: "Total application configuration changes detected:", value: 0 },
          { question: "Total database configuration changes detected:", value: 0 },
          { question: "Total network device configuration changes detected:", value: 0 },
          { question: "Total security tool configuration changes detected:", value: 0 }
        ];
        break;
      case 7: // Contingency Plan Testing Measure (RS.MA.S3)
        numeratorQuestions = [
          { question: "Production systems with tested contingency plans:", value: 0 },
          { question: "Database systems with tested contingency plans:", value: 0 },
          { question: "Network systems with tested contingency plans:", value: 0 },
          { question: "Security systems with tested contingency plans:", value: 0 },
          { question: "Other systems with tested contingency plans:", value: 0 }
        ];
        denominatorQuestions = [
          { question: "Total production systems in inventory:", value: 0 },
          { question: "Total database systems in inventory:", value: 0 },
          { question: "Total network systems in inventory:", value: 0 },
          { question: "Total security systems in inventory:", value: 0 },
          { question: "Total other systems in inventory:", value: 0 }
        ];
        break;
      case 8: // User Accounts Measure (PR.AA.S7)
        numeratorQuestions = [
          { question: "Production systems with privileged access through PIM:", value: 0 },
          { question: "Database systems with privileged access through PIM:", value: 0 },
          { question: "Network devices with privileged access through PIM:", value: 0 },
          { question: "Security systems with privileged access through PIM:", value: 0 },
          { question: "Cloud services with privileged access through PIM:", value: 0 }
        ];
        denominatorQuestions = [
          { question: "Total production systems requiring privileged access:", value: 0 },
          { question: "Total database systems requiring privileged access:", value: 0 },
          { question: "Total network devices requiring privileged access:", value: 0 },
          { question: "Total security systems requiring privileged access:", value: 0 },
          { question: "Total cloud services requiring privileged access:", value: 0 }
        ];
        break;
      case 9: // Incident Response Measure (RS.CO.S2)
        numeratorQuestions = [
          { question: "Critical incidents reported on time:", value: 0 },
          { question: "High severity incidents reported on time:", value: 0 },
          { question: "Medium severity incidents reported on time:", value: 0 },
          { question: "Low severity incidents reported on time:", value: 0 }
        ];
        denominatorQuestions = [
          { question: "Total critical incidents:", value: 0 },
          { question: "Total high severity incidents:", value: 0 },
          { question: "Total medium severity incidents:", value: 0 },
          { question: "Total low severity incidents:", value: 0 }
        ];
        break;
      case 10: // Maintenance Measure (PR.MA.S1)
        numeratorQuestions = [
          { question: "Server hardware components receiving scheduled maintenance:", value: 0 },
          { question: "Network hardware components receiving scheduled maintenance:", value: 0 },
          { question: "Security hardware components receiving scheduled maintenance:", value: 0 },
          { question: "Software systems receiving scheduled maintenance/patching:", value: 0 },
          { question: "Other components receiving scheduled maintenance:", value: 0 }
        ];
        denominatorQuestions = [
          { question: "Total server hardware components requiring maintenance:", value: 0 },
          { question: "Total network hardware components requiring maintenance:", value: 0 },
          { question: "Total security hardware components requiring maintenance:", value: 0 },
          { question: "Total software systems requiring maintenance/patching:", value: 0 },
          { question: "Total other components requiring maintenance:", value: 0 }
        ];
        break;
      case 11: // Media Sanitization Measure (PR.AA.S14)
        numeratorQuestions = [
          { question: "Hard drives/SSDs passing sanitization testing:", value: 0 },
          { question: "USB storage devices passing sanitization testing:", value: 0 },
          { question: "Backup tapes/media passing sanitization testing:", value: 0 },
          { question: "Mobile devices passing sanitization testing:", value: 0 },
          { question: "Other media passing sanitization testing:", value: 0 }
        ];
        denominatorQuestions = [
          { question: "Total hard drives/SSDs disposed/reused:", value: 0 },
          { question: "Total USB storage devices disposed/reused:", value: 0 },
          { question: "Total backup tapes/media disposed/reused:", value: 0 },
          { question: "Total mobile devices disposed/reused:", value: 0 },
          { question: "Total other media disposed/reused:", value: 0 }
        ];
        break;
      case 12: // Physical Security Incidents Measure (PR.AA.S10)
        numeratorQuestions = [
          { question: "Unauthorized access incidents to server rooms:", value: 0 },
          { question: "Unauthorized access incidents to network closets:", value: 0 },
          { question: "Unauthorized access incidents to secure workspaces:", value: 0 },
          { question: "Unauthorized access incidents to other secure areas:", value: 0 }
        ];
        denominatorQuestions = [
          { question: "Total physical security incidents at server rooms:", value: 0 },
          { question: "Total physical security incidents at network closets:", value: 0 },
          { question: "Total physical security incidents at secure workspaces:", value: 0 },
          { question: "Total physical security incidents at other secure areas:", value: 0 }
        ];
        break;
      case 13: // Planning Measure (GV.RR.S5)
        numeratorQuestions = [
          { question: "Employees granted access after signing agreements:", value: 0 },
          { question: "Contractors granted access after signing agreements:", value: 0 },
          { question: "Vendors granted access after signing agreements:", value: 0 },
          { question: "Third parties granted access after signing agreements:", value: 0 }
        ];
        denominatorQuestions = [
          { question: "Total employees granted system access:", value: 0 },
          { question: "Total contractors granted system access:", value: 0 },
          { question: "Total vendors granted system access:", value: 0 },
          { question: "Total third parties granted system access:", value: 0 }
        ];
        break;
      case 14: // Personnel Security Screening Measure (PR.AA.S10)
        numeratorQuestions = [
          { question: "Employees who underwent screening before access:", value: 0 },
          { question: "Contractors who underwent screening before access:", value: 0 },
          { question: "Vendors who underwent screening before access:", value: 0 },
          { question: "Third parties who underwent screening before access:", value: 0 }
        ];
        denominatorQuestions = [
          { question: "Total employees with system access:", value: 0 },
          { question: "Total contractors with system access:", value: 0 },
          { question: "Total vendors with system access:", value: 0 },
          { question: "Total third parties with system access:", value: 0 }
        ];
        break;
      case 15: // Risk Assessment Measure (ID.RA.S2)
        numeratorQuestions = [
          { question: "Critical production systems risk-assessed:", value: 0 },
          { question: "Critical database systems risk-assessed:", value: 0 },
          { question: "Critical network infrastructure risk-assessed:", value: 0 },
          { question: "Critical applications risk-assessed:", value: 0 },
          { question: "Critical data assets risk-assessed:", value: 0 }
        ];
        denominatorQuestions = [
          { question: "Total critical production systems:", value: 0 },
          { question: "Total critical database systems:", value: 0 },
          { question: "Total critical network infrastructure:", value: 0 },
          { question: "Total critical applications:", value: 0 },
          { question: "Total critical data assets:", value: 0 }
        ];
        break;
      case 16: // Service Acquisition Contract Measure (GV.SC.S3)
        numeratorQuestions = [
          { question: "Software acquisition contracts with security requirements:", value: 0 },
          { question: "Hardware acquisition contracts with security requirements:", value: 0 },
          { question: "Cloud service contracts with security requirements:", value: 0 },
          { question: "IT service provider contracts with security requirements:", value: 0 },
          { question: "Other acquisition contracts with security requirements:", value: 0 }
        ];
        denominatorQuestions = [
          { question: "Total software acquisition contracts:", value: 0 },
          { question: "Total hardware acquisition contracts:", value: 0 },
          { question: "Total cloud service contracts:", value: 0 },
          { question: "Total IT service provider contracts:", value: 0 },
          { question: "Total other acquisition contracts:", value: 0 }
        ];
        break;
      case 17: // System and Communication Protection Measure (PR.DS.S4)
        numeratorQuestions = [
          { question: "Laptops with full cryptographic protection:", value: 0 },
          { question: "Mobile phones with full cryptographic protection:", value: 0 },
          { question: "Tablets with full cryptographic protection:", value: 0 },
          { question: "Other mobile devices with full cryptographic protection:", value: 0 }
        ];
        denominatorQuestions = [
          { question: "Total laptops in use:", value: 0 },
          { question: "Total mobile phones in use:", value: 0 },
          { question: "Total tablets in use:", value: 0 },
          { question: "Total other mobile devices in use:", value: 0 }
        ];
        break;
      case 18: // Risk Management (GV.RM.S1, GV.RM.S2)
        numeratorQuestions = [
          { question: "Production systems covered by risk management:", value: 0 },
          { question: "Network infrastructure covered by risk management:", value: 0 },
          { question: "Applications covered by risk management:", value: 0 },
          { question: "Data assets covered by risk management:", value: 0 },
          { question: "Other assets covered by risk management:", value: 0 }
        ];
        denominatorQuestions = [
          { question: "Total production systems in inventory:", value: 0 },
          { question: "Total network infrastructure in inventory:", value: 0 },
          { question: "Total applications in inventory:", value: 0 },
          { question: "Total data assets in inventory:", value: 0 },
          { question: "Total other assets in inventory:", value: 0 }
        ];
        break;
      case 19: // Critical Assets Identified (ID.AM.S1, ID.AM.S2)
        numeratorQuestions = [
          { question: "Production servers classified as critical:", value: 0 },
          { question: "Databases classified as critical:", value: 0 },
          { question: "Network devices classified as critical:", value: 0 },
          { question: "Applications classified as critical:", value: 0 },
          { question: "Other systems classified as critical:", value: 0 }
        ];
        denominatorQuestions = [
          { question: "Production servers integrated with SOC:", value: 0 },
          { question: "Databases integrated with SOC:", value: 0 },
          { question: "Network devices integrated with SOC:", value: 0 },
          { question: "Applications integrated with SOC:", value: 0 },
          { question: "Other systems integrated with SOC:", value: 0 }
        ];
        break;
      case 20: // CSK Events (RS.MA.S5)
        numeratorQuestions = [
          { question: "Critical CSK events closed within 15 days:", value: 0 },
          { question: "High CSK events closed within 15 days:", value: 0 },
          { question: "Medium CSK events closed within 15 days:", value: 0 },
          { question: "Low CSK events closed within 15 days:", value: 0 }
        ];
        denominatorQuestions = [
          { question: "Total critical CSK events reported:", value: 0 },
          { question: "Total high CSK events reported:", value: 0 },
          { question: "Total medium CSK events reported:", value: 0 },
          { question: "Total low CSK events reported:", value: 0 }
        ];
        break;
      case 21: // Cybersecurity Policy Document (GV.PO.S1)
        numeratorQuestions = [
          { question: "Comprehensive cybersecurity policy exists and is documented (Yes=1, No=0):", value: 0 },
          { question: "Policy approved by senior management within last 12 months (Yes=1, No=0):", value: 0 },
          { question: "Policy updated within the last 12 months (Yes=1, No=0):", value: 0 },
          { question: "Policy effectively communicated to all staff (Yes=1, No=0):", value: 0 },
          { question: "Policy implementation verified through assessments (Yes=1, No=0):", value: 0 }
        ];
        denominatorQuestions = [
          { question: "Total criteria (fixed value):", value: 5 }
        ];
        break;
      case 22: // SOC Efficacy
        numeratorQuestions = [
          { question: "SOC operational capabilities score (as per Annexure-N):", value: 0 },
          { question: "SOC monitoring effectiveness score (as per Annexure-N):", value: 0 },
          { question: "SOC incident response score (as per Annexure-N):", value: 0 },
          { question: "SOC threat intelligence score (as per Annexure-N):", value: 0 },
          { question: "SOC maturity score (as per Annexure-N):", value: 0 }
        ];
        denominatorQuestions = [
          { question: "Maximum possible operational capabilities score:", value: 0 },
          { question: "Maximum possible monitoring effectiveness score:", value: 0 },
          { question: "Maximum possible incident response score:", value: 0 },
          { question: "Maximum possible threat intelligence score:", value: 0 },
          { question: "Maximum possible maturity score:", value: 0 }
        ];
        break;
      case 23: // Automated compliance with CSCRF
        numeratorQuestions = [
          { question: "Governance standards with automated compliance monitoring:", value: 0 },
          { question: "Identify standards with automated compliance monitoring:", value: 0 },
          { question: "Protect standards with automated compliance monitoring:", value: 0 },
          { question: "Detect standards with automated compliance monitoring:", value: 0 },
          { question: "Respond standards with automated compliance monitoring:", value: 0 },
          { question: "Recover standards with automated compliance monitoring:", value: 0 }
        ];
        denominatorQuestions = [
          { question: "Total applicable Governance standards:", value: 0 },
          { question: "Total applicable Identify standards:", value: 0 },
          { question: "Total applicable Protect standards:", value: 0 },
          { question: "Total applicable Detect standards:", value: 0 },
          { question: "Total applicable Respond standards:", value: 0 },
          { question: "Total applicable Recover standards:", value: 0 }
        ];
        break;
      default:
        // Default pattern if no specific questions are defined
        numeratorQuestions = [
          { question: param.numeratorHelp || "Enter the numerator value for this parameter", value: 0 }
        ];
        denominatorQuestions = [
          { question: param.denominatorHelp || "Enter the denominator value for this parameter", value: 0 }
        ];
    }
    
    setDetailedData(prev => ({
      ...prev,
      [paramId]: {
        numeratorBreakdown: numeratorQuestions,
        denominatorBreakdown: denominatorQuestions
      }
    }));
  };

  // Helper function for category assignment
  const handleCategoryAssignment = (param: CCIParameter, prefix: string) => {
    // Enhanced mapping with more detailed categories
    const categoryMap: Record<string, string> = {
      'GV': 'Governance: Roles and Responsibilities',
      'ID': 'Identify: Asset Management',
      'PR': 'Protect: Data Security'
    };
    
    // More specific mappings based on full prefix pattern
    if (param.measureId.startsWith('ID.AM')) {
      handleChange(param.id, 'frameworkCategory', 'Identify: Asset Management');
    } else if (param.measureId.startsWith('ID.RA')) {
      handleChange(param.id, 'frameworkCategory', 'Identify: Risk Assessment');
    } else if (param.measureId.startsWith('PR.AA')) {
      handleChange(param.id, 'frameworkCategory', 'Protect: Identity Management, Authentication, and Access Control');
    } else if (param.measureId.startsWith('PR.AT')) {
      handleChange(param.id, 'frameworkCategory', 'Protect: Awareness and Training');
    } else if (param.measureId.startsWith('PR.DS')) {
      handleChange(param.id, 'frameworkCategory', 'Protect: Data Security');
    } else if (param.measureId.startsWith('PR.IP')) {
      handleChange(param.id, 'frameworkCategory', 'Protect: Information Protection');
    } else if (param.measureId.startsWith('DE.CM')) {
      handleChange(param.id, 'frameworkCategory', 'Detect: Continuous Monitoring');
    } else if (param.measureId.startsWith('DE.DP')) {
      handleChange(param.id, 'frameworkCategory', 'Detect: Detection Processes');
    } else if (param.measureId.startsWith('RS.RP')) {
      handleChange(param.id, 'frameworkCategory', 'Respond: Response Planning');
    } else if (param.measureId.startsWith('RS.CO')) {
      handleChange(param.id, 'frameworkCategory', 'Respond: Communications');
    } else if (param.measureId.startsWith('RS.AN') || param.measureId.startsWith('RS.MI')) {
      handleChange(param.id, 'frameworkCategory', 'Respond: Analysis and Mitigation');
    } else if (param.measureId.startsWith('RC.RP')) {
      handleChange(param.id, 'frameworkCategory', 'Recover: Recovery Planning');
    } else if (param.measureId.startsWith('RC.IM')) {
      handleChange(param.id, 'frameworkCategory', 'Recover: Improvements');
    }
    // Basic category fallback if no specific pattern matches
    else if (categoryMap[prefix]) {
      handleChange(param.id, 'frameworkCategory', categoryMap[prefix]);
    } else {
      // Fallback for unrecognized prefixes
      handleChange(param.id, 'frameworkCategory', 'Other');
    }
  };

  const addCustomQuestion = (paramId: number, type: 'numerator' | 'denominator') => {
    setDetailedData(prev => {
      const paramData = prev[paramId] || {
        numeratorBreakdown: [],
        denominatorBreakdown: []
      };
      
      if (type === 'numerator') {
        return {
          ...prev,
          [paramId]: {
            ...paramData,
            numeratorBreakdown: [
              ...paramData.numeratorBreakdown,
              { question: `Additional item ${paramData.numeratorBreakdown.length + 1}`, value: 0 }
            ]
          }
        };
      } else {
        return {
          ...prev,
          [paramId]: {
            ...paramData,
            denominatorBreakdown: [
              ...paramData.denominatorBreakdown,
              { question: `Additional item ${paramData.denominatorBreakdown.length + 1}`, value: 0 }
            ]
          }
        };
      }
    });
  };

  const updateQuestionText = (
    paramId: number, 
    type: 'numerator' | 'denominator', 
    index: number, 
    question: string
  ) => {
    setDetailedData(prev => {
      const paramData = prev[paramId] || {
        numeratorBreakdown: [],
        denominatorBreakdown: []
      };
      
      if (type === 'numerator') {
        const updatedNumerator = [...paramData.numeratorBreakdown];
        updatedNumerator[index] = { ...updatedNumerator[index], question };
        return {
          ...prev,
          [paramId]: {
            ...paramData,
            numeratorBreakdown: updatedNumerator
          }
        };
      } else {
        const updatedDenominator = [...paramData.denominatorBreakdown];
        updatedDenominator[index] = { ...updatedDenominator[index], question };
        return {
          ...prev,
          [paramId]: {
            ...paramData,
            denominatorBreakdown: updatedDenominator
          }
        };
      }
    });
  };

  const removeQuestion = (
    paramId: number, 
    type: 'numerator' | 'denominator', 
    index: number
  ) => {
    setDetailedData(prev => {
      const paramData = prev[paramId] || {
        numeratorBreakdown: [],
        denominatorBreakdown: []
      };
      
      if (type === 'numerator') {
        const updatedNumerator = [...paramData.numeratorBreakdown];
        updatedNumerator.splice(index, 1);
        
        const numeratorTotal = updatedNumerator.reduce(
          (sum, item) => sum + (item.value || 0), 0
        );
        handleChange(paramId, 'numerator', numeratorTotal);
        
        return {
          ...prev,
          [paramId]: {
            ...paramData,
            numeratorBreakdown: updatedNumerator
          }
        };
      } else {
        const updatedDenominator = [...paramData.denominatorBreakdown];
        updatedDenominator.splice(index, 1);
        
        const denominatorTotal = updatedDenominator.reduce(
          (sum, item) => sum + (item.value || 0), 0
        );
        handleChange(paramId, 'denominator', denominatorTotal || 1);
        
        return {
          ...prev,
          [paramId]: {
            ...paramData,
            denominatorBreakdown: updatedDenominator
          }
        };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(formData);
  };

  const handleExportPDF = () => {
    // Alert the user that PDF export is no longer available
    alert('PDF export is no longer available. Please use Markdown export in the detailed report view.');
  };

  const handleLoadSampleData = () => {
    setIsLoadingSample(true);
    
    // Create sample data for all parameters
    const updatedDetailedData = { ...detailedData };
    
    formData.forEach(param => {
      // Initialize detailed data if not already done
      initializeDetailedData(param.id);
      
      // Get the current parameter's detailed data
      const paramData = updatedDetailedData[param.id] || {
        numeratorBreakdown: [],
        denominatorBreakdown: []
      };
      
      // Generate random values for each question in numerator and denominator
      if (paramData.numeratorBreakdown.length > 0) {
        paramData.numeratorBreakdown = paramData.numeratorBreakdown.map(q => {
          // Generate random value between 70 and 95 for each question
          const randomValue = Math.floor(Math.random() * 26) + 70;
          return { ...q, value: randomValue };
        });
        
        // Calculate and update the total numerator value
        const numeratorTotal = paramData.numeratorBreakdown.reduce(
          (sum, item) => sum + (item.value || 0), 0
        );
        
        // Update the parameter's numerator
        handleChange(param.id, 'numerator', numeratorTotal);
      }
      
      if (paramData.denominatorBreakdown.length > 0) {
        paramData.denominatorBreakdown = paramData.denominatorBreakdown.map(q => {
          // Generate random value between 80 and 100 for each question
          const randomValue = Math.floor(Math.random() * 21) + 80;
          return { ...q, value: randomValue };
        });
        
        // Calculate and update the total denominator value
        const denominatorTotal = paramData.denominatorBreakdown.reduce(
          (sum, item) => sum + (item.value || 0), 0
        );
        
        // Ensure denominator is not zero
        handleChange(param.id, 'denominator', denominatorTotal || 1);
      }
      
      // Update the detailed data for this parameter
      updatedDetailedData[param.id] = paramData;
    });
    
    // Update state with the new detailed data
    setDetailedData(updatedDetailedData);
    setIsLoadingSample(false);
    
    // Show success message
    alert('Sample data has been loaded successfully!');
  };

  // Walkthrough functions
  const startWalkthrough = () => {
    setCurrentStep(0);
    setShowWalkthrough(true);
  };

  const nextStep = () => {
    if (currentStep < walkthroughSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowWalkthrough(false);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const closeWalkthrough = () => {
    setShowWalkthrough(false);
  };

  // Update tooltip position based on current step
  useEffect(() => {
    if (!showWalkthrough) return;

    const currentTarget = walkthroughSteps[currentStep].target;
    let targetElement: HTMLElement | null = null;

    switch (currentTarget) {
      case 'header':
        targetElement = parameterHeaderRef.current;
        break;
      case 'parameter':
        targetElement = document.querySelector('.border-gray-200');
        break;
      case 'numerator':
        targetElement = numeratorSectionRef.current;
        break;
      case 'denominator':
        targetElement = denominatorSectionRef.current;
        break;
      case 'addQuestion':
        targetElement = addQuestionButtonRef.current;
        break;
      case 'evidence':
        targetElement = evidenceSectionRef.current;
        break;
      case 'export':
        targetElement = exportButtonRef.current;
        break;
      case 'save':
        targetElement = saveButtonRef.current;
        break;
      default:
        break;
    }

    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      const placement = walkthroughSteps[currentStep].placement || 'bottom';
      const scrollTop = window.scrollY;
      
      // Calculate position based on placement
      let top = 0;
      let left = 0;
      
      switch (placement) {
        case 'top':
          top = rect.top + scrollTop - 150;
          left = rect.left + rect.width / 2 - 150;
          break;
        case 'bottom':
          top = rect.bottom + scrollTop + 10;
          left = rect.left + rect.width / 2 - 150;
          break;
        case 'left':
          top = rect.top + scrollTop + rect.height / 2 - 75;
          left = rect.left - 310;
          break;
        case 'right':
          top = rect.top + scrollTop + rect.height / 2 - 75;
          left = rect.right + 10;
          break;
      }
      
      setTooltipPosition({ top, left });
      
      // Scroll to make sure the element is visible
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentStep, showWalkthrough]);

  // Tooltip component
  const Tooltip = () => {
    if (!showWalkthrough) return null;
    
    const step = walkthroughSteps[currentStep];
    
    return (
      <div
        className="fixed z-50 bg-white shadow-xl rounded-lg p-4 border border-gray-200 w-300"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          width: '300px',
        }}
      >
        <div className="font-bold text-lg mb-2">{step.title}</div>
        <p className="text-gray-600 mb-4">{step.content}</p>
        <div className="flex justify-between items-center">
          <div>
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="text-sm px-3 py-1 rounded border border-gray-300 mr-2 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={nextStep}
              className="text-sm px-3 py-1 rounded bg-black text-white"
            >
              {currentStep === walkthroughSteps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
          <button
            onClick={closeWalkthrough}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Skip
          </button>
        </div>
      </div>
    );
  };

  // Function to get color class based on score
  const getScoreColorClass = (score: number) => {
    if (score >= 80) return 'bg-black';
    if (score >= 60) return 'bg-gray-600';
    if (score >= 40) return 'bg-gray-400';
    return 'bg-gray-300';
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6 bg-black border-b">
        <div className="flex justify-between items-center" ref={parameterHeaderRef}>
          <h2 className="text-xl font-semibold text-white">CCI Detailed Calculator</h2>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={isExporting}
              ref={exportButtonRef}
              className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition duration-200 flex items-center disabled:opacity-70"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
              </svg>
              {isExporting ? 'Generating PDF...' : 'Export as PDF'}
            </button>
            <button
              className="px-3 py-1 bg-black hover:bg-gray-800 text-white rounded-md text-sm flex items-center"
              onClick={handleLoadSampleData}
              disabled={isLoadingSample}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              {isLoadingSample ? 'Loading...' : 'Load Sample Data'}
            </button>
            <button
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md text-sm flex items-center"
              onClick={startWalkthrough}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Help
            </button>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6">
        <div className="space-y-8">
          {formData.map((param) => {
            // Initialize detailed data if not already done
            initializeDetailedData(param.id);
            
            // Calculate current score
            const score = calculateParameterScore(param);
            const paramData = detailedData[param.id] || {
              numeratorBreakdown: [],
              denominatorBreakdown: []
            };
            
            return (
            <div key={param.id} className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-black mb-2">{param.measureId}: {param.title}</h3>
                <p className="text-gray-600 mb-2">{param.description}</p>
                
                {param.frameworkCategory && (
                  <div className="mb-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      param.frameworkCategory.startsWith('Governance') ? 'bg-purple-100 text-purple-800' :
                      param.frameworkCategory.startsWith('Identify') ? 'bg-blue-100 text-blue-800' :
                      param.frameworkCategory.startsWith('Protect') ? 'bg-green-100 text-green-800' :
                      param.frameworkCategory.startsWith('Detect') ? 'bg-yellow-100 text-yellow-800' :
                      param.frameworkCategory.startsWith('Respond') ? 'bg-orange-100 text-orange-800' :
                      param.frameworkCategory.startsWith('Recover') ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {/* Icon based on category */}
                      {param.frameworkCategory.startsWith('Governance') && (
                        <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                      {param.frameworkCategory.startsWith('Identify') && (
                        <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                      )}
                      {param.frameworkCategory.startsWith('Protect') && (
                        <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                      {param.frameworkCategory.startsWith('Detect') && (
                        <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {param.frameworkCategory.startsWith('Respond') && (
                        <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                      )}
                      {param.frameworkCategory.startsWith('Recover') && (
                        <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                        </svg>
                      )}
                      {param.frameworkCategory}
                    </span>
                  </div>
                )}
                
                <div className="text-sm text-gray-500 mb-4">
                  <strong>Formula:</strong> {param.formula}
                </div>
                
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div className="text-sm">
                      <span className="font-medium">Current Score:</span> {score.toFixed(2)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      Target: {param.target}% | Weightage: {param.weightage}%
                    </div>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${getScoreColorClass(score)}`} 
                      style={{ width: `${Math.min(score, 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  {/* Numerator Section */}
                  <div ref={numeratorSectionRef} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between mb-3">
                      <h4 className="font-medium">
                        Numerator Questions 
                        {param.numeratorHelp && (
                          <span className="text-xs text-gray-500 block mt-1">
                            ({param.numeratorHelp})
                          </span>
                        )}
                      </h4>
                      <span className="text-sm font-semibold bg-black text-white px-2 py-1 rounded">
                        Total: {param.numerator}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {paramData.numeratorBreakdown.map((item, index) => (
                        <div key={`num-${index}`} className="bg-gray-50 p-3 rounded">
                          <div className="mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                              {item.question}
                            </label>
                            <input
                              type="number"
                              value={item.value}
                              onChange={(e) => handleDetailedValueChange(param.id, 'numerator', index, Number(e.target.value))}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
                              min="0"
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <button
                              type="button"
                              onClick={() => updateQuestionText(param.id, 'numerator', index, item.question)}
                              className="text-xs text-gray-500 hover:text-gray-700"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => removeQuestion(param.id, 'numerator', index)}
                              className="text-xs text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      <button
                        type="button"
                        ref={addQuestionButtonRef}
                        onClick={() => addCustomQuestion(param.id, 'numerator')}
                        className="mt-2 inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                      >
                        + Add Custom Question
                      </button>
                    </div>
                  </div>
                  
                  {/* Denominator Section */}
                  <div ref={denominatorSectionRef} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between mb-3">
                      <h4 className="font-medium">
                        Denominator Questions
                        {param.denominatorHelp && (
                          <span className="text-xs text-gray-500 block mt-1">
                            ({param.denominatorHelp})
                          </span>
                        )}
                      </h4>
                      <span className="text-sm font-semibold bg-black text-white px-2 py-1 rounded">
                        Total: {param.denominator}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {paramData.denominatorBreakdown.map((item, index) => (
                        <div key={`den-${index}`} className="bg-gray-50 p-3 rounded">
                          <div className="mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                              {item.question}
                            </label>
                            <input
                              type="number"
                              value={item.value}
                              onChange={(e) => handleDetailedValueChange(param.id, 'denominator', index, Number(e.target.value))}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
                              min="0"
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <button
                              type="button"
                              onClick={() => updateQuestionText(param.id, 'denominator', index, item.question)}
                              className="text-xs text-gray-500 hover:text-gray-700"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => removeQuestion(param.id, 'denominator', index)}
                              className="text-xs text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      <button
                        type="button"
                        onClick={() => addCustomQuestion(param.id, 'denominator')}
                        className="mt-2 inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                      >
                        + Add Custom Question
                      </button>
                    </div>
                </div>
              </div>
              
                <div ref={evidenceSectionRef} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Implementation Evidence</label>
                <div className="mb-2 bg-blue-50 border border-blue-200 rounded-md p-3 text-xs text-blue-700">
                  <p className="font-medium mb-1">Suggested Evidence:</p>
                  {param.id === 1 && (
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Vulnerability scan reports from the last assessment period</li>
                      <li>Remediation tracking documentation showing timeline of fixes</li>
                      <li>Change management records for vulnerability patches</li>
                      <li>Screenshots of vulnerability management dashboard</li>
                    </ul>
                  )}
                  {param.id === 2 && (
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Training completion certificates for security personnel</li>
                      <li>Training attendance logs with dates and content covered</li>
                      <li>Skills assessment results for role-specific security training</li>
                      <li>Training program documentation showing role-specific modules</li>
                    </ul>
                  )}
                  {param.id === 3 && (
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Annual budget allocation documents showing security budget</li>
                      <li>Financial reports showing actual security expenditures</li>
                      <li>Budget comparison documents showing IT vs security allocations</li>
                      <li>Purchase orders for security tools, services, and personnel</li>
                    </ul>
                  )}
                  {param.id === 4 && (
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Risk assessment reports with dates and system coverage</li>
                      <li>System inventory documentation</li>
                      <li>Risk assessment methodology documentation</li>
                      <li>Screenshots of risk register or GRC tool</li>
                    </ul>
                  )}
                  {param.id === 5 && (
                    <ul className="list-disc pl-4 space-y-1">
                      <li>SIEM architecture diagrams showing connected systems</li>
                      <li>Log collection/forwarding configuration files</li>
                      <li>Documentation of critical systems inventory</li>
                      <li>Screenshots of SIEM dashboard showing system coverage</li>
                    </ul>
                  )}
                  {param.id === 6 && (
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Change management records showing approved configuration changes</li>
                      <li>Screenshots of configuration management database</li>
                      <li>Baseline configuration documentation</li>
                      <li>Audit logs showing configuration drift detection</li>
                    </ul>
                  )}
                  {param.id === 7 && (
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Contingency plan test records and after-action reports</li>
                      <li>BCP/DR exercise documentation</li>
                      <li>Test schedule showing systems covered</li>
                      <li>Screenshots of test execution or exercise logs</li>
                    </ul>
                  )}
                  {param.id === 8 && (
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Privileged access management system inventory reports</li>
                      <li>PIM solution architecture diagrams</li>
                      <li>Privileged account inventory documentation</li>
                      <li>Screenshots of privileged session recordings</li>
                    </ul>
                  )}
                  {param.id === 9 && (
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Incident response logs with timestamps</li>
                      <li>Security incident reports with reporting timeline</li>
                      <li>Screenshots from incident management system</li>
                      <li>Incident classification documentation</li>
                    </ul>
                  )}
                  {param.id === 10 && (
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Anti-malware deployment inventory reports</li>
                      <li>Configuration settings for malware protection tools</li>
                      <li>System coverage reports for anti-malware solutions</li>
                      <li>Screenshots of management console showing coverage</li>
                    </ul>
                  )}
                  {param.id === 11 && (
                    <ul className="list-disc pl-4 space-y-1">
                      <li>MFA configuration documentation for remote access systems</li>
                      <li>VPN session logs showing authentication methods</li>
                      <li>Remote access policy documentation</li>
                      <li>Screenshots of MFA enrollment status for users</li>
                    </ul>
                  )}
                  {param.id === 12 && (
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Physical security incident reports</li>
                      <li>Access control logs for physical entry points</li>
                      <li>Badge system reports for unauthorized access attempts</li>
                      <li>CCTV footage or records of physical security events</li>
                    </ul>
                  )}
                  {param.id === 13 && (
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Signed confidentiality agreements</li>
                      <li>System access request forms showing agreement requirements</li>
                      <li>User onboarding process documentation</li>
                      <li>HR records of agreement completion</li>
                    </ul>
                  )}
                  {param.id === 14 && (
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Background check records for personnel</li>
                      <li>Security clearance documentation</li>
                      <li>Screening policy documentation</li>
                      <li>Personnel security verification records</li>
                    </ul>
                  )}
                  {param.id === 15 && (
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Policy document inventory with approval signatures and dates</li>
                      <li>Policy review schedule and completion records</li>
                      <li>Documentation of policy approval workflow</li>
                      <li>Screenshots of policy management system</li>
                    </ul>
                  )}
                  {param.id === 16 && (
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Contract language samples showing security requirements</li>
                      <li>Vendor assessment documentation</li>
                      <li>Procurement policy showing security requirement integration</li>
                      <li>Third-party security agreement examples</li>
                    </ul>
                  )}
                  {param.id === 17 && (
                    <ul className="list-disc pl-4 space-y-1">
                      <li>User termination records with timestamps</li>
                      <li>Account deactivation logs</li>
                      <li>HR/IT coordination documentation for departures</li>
                      <li>Screenshots of offboarding workflow system</li>
                    </ul>
                  )}
                  {param.id === 18 && (
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Continuous monitoring strategy documentation</li>
                      <li>Automated control testing reports</li>
                      <li>Dashboard screenshots showing control monitoring</li>
                      <li>Continuous assessment workflow documentation</li>
                    </ul>
                  )}
                  {param.id === 19 && (
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Asset classification documentation</li>
                      <li>Critical asset inventory reports</li>
                      <li>Business impact analysis records</li>
                      <li>System dependency mappings for critical assets</li>
                    </ul>
                  )}
                  {param.id === 20 && (
                    <ul className="list-disc pl-4 space-y-1">
                      <li>CSK event logs with resolution timestamps</li>
                      <li>Event management system screenshots</li>
                      <li>CSK report handling procedures</li>
                      <li>SLA documentation for event resolution</li>
                    </ul>
                  )}
                  {param.id === 21 && (
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Password policy documentation</li>
                      <li>System configuration screenshots showing password settings</li>
                      <li>Compliance reports for password complexity</li>
                      <li>Group policy objects or equivalent settings</li>
                    </ul>
                  )}
                  {param.id === 22 && (
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Cyber insurance policy documentation</li>
                      <li>Coverage details showing limits and inclusions</li>
                      <li>Insurance renewal documentation</li>
                      <li>Cyber coverage assessment reports</li>
                    </ul>
                  )}
                  {param.id === 23 && (
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Automated compliance monitoring tool configuration</li>
                      <li>Documentation showing CSCRF mapping to automated controls</li>
                      <li>Compliance dashboard screenshots</li>
                      <li>Automated assessment reports for CSCRF standards</li>
                    </ul>
                  )}
                  {param.id > 23 && (
                    <p>Provide relevant documentation, screenshots, logs, or other evidence that demonstrates your compliance with this control requirement.</p>
                  )}
                </div>
                <textarea
                  value={param.implementationEvidence || ''}
                  onChange={(e) => handleChange(param.id, 'implementationEvidence', e.target.value)}
                  rows={3}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
                  placeholder="Provide evidence of implementation..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Auditor Comments</label>
                <textarea
                  value={param.auditorComments || ''}
                  onChange={(e) => handleChange(param.id, 'auditorComments', e.target.value)}
                  rows={2}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
                  placeholder="Auditor comments..."
                />
              </div>
            </div>
            );
          })}
        </div>
        
        <div className="mt-8 flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-200 hover:bg-gray-300 text-black py-2 px-6 rounded-md transition duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            ref={saveButtonRef}
            className="bg-black hover:bg-gray-800 text-white py-2 px-6 rounded-md transition duration-200"
          >
            Save and Calculate
          </button>
        </div>
      </form>
      
      {/* Score breakdown by category and top improvement areas */}
      <div className="p-6 border-t border-gray-200">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Score Breakdown by Category */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-black p-4">
              <h3 className="font-medium text-white text-lg">Score Breakdown by Category</h3>
            </div>
            <div className="p-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {useMemo(() => {
                    // Calculate scores by category
                    const categoryScores: { [key: string]: { score: number, totalWeight: number, params: CCIParameter[] } } = {};
                    const baseCategories = ['Governance', 'Identify', 'Protect', 'Detect', 'Respond', 'Recover'];
                    
                    // Initialize all base categories
                    baseCategories.forEach(cat => {
                      categoryScores[cat] = { score: 0, totalWeight: 0, params: [] };
                    });
                    
                    // Aggregate parameters by category
                    formData.forEach(param => {
                      let category = '';
                      if (param.frameworkCategory) {
                        category = param.frameworkCategory.split(':')[0].trim();
                      } else if (param.measureId) {
                        if (param.measureId.startsWith('GV')) category = 'Governance';
                        else if (param.measureId.startsWith('ID')) category = 'Identify';
                        else if (param.measureId.startsWith('PR')) category = 'Protect';
                        else if (param.measureId.startsWith('DE')) category = 'Detect';
                        else if (param.measureId.startsWith('RS')) category = 'Respond';
                        else if (param.measureId.startsWith('RC')) category = 'Recover';
                      }
                      
                      if (category && baseCategories.includes(category)) {
                        categoryScores[category].params.push(param);
                        categoryScores[category].totalWeight += param.weightage || 0;
                      }
                    });
                    
                    // Calculate weighted scores
                    Object.keys(categoryScores).forEach(cat => {
                      if (categoryScores[cat].totalWeight > 0) {
                        let totalScore = 0;
                        categoryScores[cat].params.forEach(param => {
                          totalScore += calculateParameterScore(param) * (param.weightage || 0);
                        });
                        categoryScores[cat].score = totalScore / categoryScores[cat].totalWeight;
                      }
                    });
                    
                    // Get rating for score
                    const getRating = (score: number) => {
                      if (score >= 80) return 'Optimal Cybersecurity Maturity';
                      if (score >= 70) return 'Manageable Cybersecurity Maturity';
                      if (score >= 60) return 'Developing Cybersecurity Maturity';
                      if (score >= 40) return 'Vulnerable Cybersecurity Maturity';
                      return 'Undetermined';
                    };
                    
                    return baseCategories.map(category => {
                      const { score } = categoryScores[category];
                      return (
                        <tr key={category}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{score.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getRating(score)}</td>
                        </tr>
                      );
                    });
                  }, [formData])}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Top Improvement Areas */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-black p-4">
              <h3 className="font-medium text-white text-lg">Top Improvement Areas</h3>
            </div>
            <div className="p-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Measure ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Score</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Impact</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {useMemo(() => {
                    // Calculate impact areas by finding gap between current score and target
                    // Sort by potential impact (weightage * gap)
                    
                    // Calculate current CCI index
                    const currentCCI = calculateCCIIndex(formData).totalScore;
                    
                    // Calculate improvement impact for each parameter
                    const improvementAreas = formData.map(param => {
                      const currentScore = calculateParameterScore(param);
                      const targetScore = param.target || 100;
                      const gap = Math.max(0, targetScore - currentScore);
                      
                      // Clone parameters and calculate CCI with this parameter at target
                      const paramsWithImprovement = formData.map(p => 
                        p.id === param.id 
                          ? { ...p, numerator: (p.denominator * targetScore) / 100 } 
                          : p
                      );
                      
                      const improvedCCI = calculateCCIIndex(paramsWithImprovement).totalScore;
                      const impact = improvedCCI - currentCCI;
                      
                      return {
                        id: param.id,
                        measureId: param.measureId,
                        title: param.title,
                        currentScore,
                        gap,
                        impact,
                        weightage: param.weightage || 0
                      };
                    });
                    
                    // Sort by impact and take top 4
                    return improvementAreas
                      .sort((a, b) => b.impact - a.impact)
                      .slice(0, 4)
                      .map(area => (
                        <tr key={area.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{area.measureId}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{area.title}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{area.currentScore.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">+{area.impact.toFixed(2)} points</td>
                        </tr>
                      ));
                  }, [formData])}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      {/* Render tooltip component */}
      <Tooltip />
    </div>
  );
};

export default DataCollectionForm; 