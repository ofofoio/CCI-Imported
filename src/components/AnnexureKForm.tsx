import React, { useState, useEffect } from 'react';
import { CCIResult, CCIParameter, AnnexureKData, entityTypes, entityCategories, getEntityCategory } from '../app/types';
import AnnexureKReport from './AnnexureKReport';
import { saveAs } from 'file-saver';
import { generateAnnexureKSampleData } from '../app/data/cciParameters';
import { exportAnnexureKReport } from '../app/utils/exportUtils';
import { toast } from 'react-hot-toast';
import CreatorFooter from './CreatorFooter';

interface AnnexureKFormProps {
  result: CCIResult;
  parameters: CCIParameter[];
  onCancel: () => void;
  onComplete: (formData: FormState) => void;
}

// Interface for form validation errors
interface FormErrors {
  organization?: string;
  entityType?: string;
  entityCategory?: string;
  rationale?: string;
  period?: string;
  auditingOrganization?: string;
  signatoryName?: string;
  designation?: string;
}

// Form state interface
export interface FormState {
  organization: string;
  entityType: string;
  entityCategory: string;
  rationale: string;
  period: string;
  auditingOrganization: string;
  signatoryName: string;
  designation: string;
}

const FORM_STORAGE_KEY = 'annexureK_form_data';

// Helper function to determine maturity level based on score
const getMaturityLevelForScore = (score: number): string => {
  if (score >= 91) return 'Exceptional';
  if (score >= 81) return 'Optimal';
  if (score >= 71) return 'Manageable';
  if (score >= 61) return 'Developing';
  if (score >= 51) return 'Bare Minimum';
  return 'Insufficient';
};

const AnnexureKForm: React.FC<AnnexureKFormProps> = ({ 
  result, 
  parameters, 
  onCancel,
  onComplete
}) => {
  const [formState, setFormState] = useState<FormState>({
    organization: '',
    entityType: '',
    entityCategory: '',
    rationale: '',
    period: '',
    auditingOrganization: '',
    signatoryName: '',
    designation: ''
  });

  // Added state for entity metrics
  const [entityMetrics, setEntityMetrics] = useState({
    clientCount: 0,
    tradingValue: 0,
    aum: 0
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [previewMode, setPreviewMode] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showClassificationHelper, setShowClassificationHelper] = useState(false);
  
  // Form field is required only if it's a MII
  const isMII = formState.entityType === 'Stock Exchange' || 
                formState.entityType === 'Depository' || 
                formState.entityType === 'Clearing Corporation';

  // Calculate form progress based on filled fields and validation status
  const calculateFormProgress = (): number => {
    const totalFields = 7; // Total number of required fields (excluding auditingOrganization if not MII)
    const requiredFieldCount = isMII ? totalFields + 1 : totalFields; // Add auditingOrganization if MII
    
    // Count completed fields (non-empty and valid)
    let completedFields = 0;
    
    if (formState.organization && !errors.organization) completedFields++;
    if (formState.entityType && !errors.entityType) completedFields++;
    if (formState.entityCategory && !errors.entityCategory) completedFields++;
    if (formState.rationale && !errors.rationale) completedFields++;
    if (formState.period && !errors.period) completedFields++;
    if (formState.signatoryName && !errors.signatoryName) completedFields++;
    if (formState.designation && !errors.designation) completedFields++;
    
    // Only count auditingOrganization if entity is MII
    if (isMII) {
      if (formState.auditingOrganization && !errors.auditingOrganization) completedFields++;
    }
    
    // Calculate percentage (rounded to nearest whole number)
    return Math.round((completedFields / requiredFieldCount) * 100);
  };

  // Load saved form data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem(FORM_STORAGE_KEY);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        // Only restore data if organization matches to prevent confusion
        if (parsedData.organization === result.organization) {
          setFormState(parsedData);
        }
      } catch (e) {
        console.error('Error parsing saved form data:', e);
      }
    }
  }, [result.organization]);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    if (formState.organization) {
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formState));
    }
  }, [formState]);

  // Effect to automatically determine entity category based on the entity type and metrics
  useEffect(() => {
    if (formState.entityType) {
      const suggestedCategory = getEntityCategory(
        formState.entityType,
        entityMetrics.clientCount,
        entityMetrics.tradingValue,
        entityMetrics.aum
      );
      
      // Only update if user hasn't manually selected a category
      if (!touched.entityCategory || !formState.entityCategory) {
        setFormState(prev => ({
          ...prev,
          entityCategory: suggestedCategory
        }));
      }
    }
  }, [formState.entityType, entityMetrics, touched.entityCategory]);

  // Validate form fields
  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};
    
    if (!formState.organization.trim()) {
      newErrors.organization = 'Organization name is required';
    }
    
    if (!formState.entityType) {
      newErrors.entityType = 'Entity type is required';
    }
    
    if (!formState.entityCategory) {
      newErrors.entityCategory = 'Entity category is required';
    }
    
    if (!formState.rationale.trim()) {
      newErrors.rationale = 'Rationale is required';
    } else if (formState.rationale.trim().length < 10) {
      newErrors.rationale = 'Please provide a more detailed rationale (minimum 10 characters)';
    }
    
    if (!formState.period.trim()) {
      newErrors.period = 'Period is required';
    } else if (!/^[A-Za-z]+\s+\d{4}\s+-\s+[A-Za-z]+\s+\d{4}$/.test(formState.period.trim())) {
      newErrors.period = 'Period should be in format "Month YYYY - Month YYYY"';
    }
    
    if (isMII && !formState.auditingOrganization.trim()) {
      newErrors.auditingOrganization = 'Auditing organization is required for MIIs';
    }
    
    if (!formState.signatoryName.trim()) {
      newErrors.signatoryName = 'Signatory name is required';
    }
    
    if (!formState.designation) {
      newErrors.designation = 'Designation is required';
    }
    
    return newErrors;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    // Clear error when field is edited
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Handle entity metrics changes
  const handleMetricsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value === '' ? 0 : parseFloat(value);
    
    setEntityMetrics(prev => ({
      ...prev,
      [name]: numValue
    }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name } = e.target;
    
    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    // Validate single field on blur
    const fieldErrors = validateForm();
    if (fieldErrors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: fieldErrors[name as keyof FormErrors]
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    
    // Validate all fields
    const formErrors = validateForm();
    setErrors(formErrors);
    
    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    Object.keys(formState).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);
    
    // If no errors, submit the form
    if (Object.keys(formErrors).length === 0) {
      // Clear localStorage after successful submission
      localStorage.removeItem(FORM_STORAGE_KEY);
      onComplete(formState);
    } else {
      // Scroll to first error
      const firstErrorField = Object.keys(formErrors)[0];
      const errorElement = document.getElementById(firstErrorField);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        errorElement.focus();
      }
    }
  };

  const togglePreview = () => {
    // If switching to preview, validate form first
    if (!previewMode) {
      const formErrors = validateForm();
      setErrors(formErrors);
      
      // Mark all fields as touched
      const allTouched: Record<string, boolean> = {};
      Object.keys(formState).forEach(key => {
        allTouched[key] = true;
      });
      setTouched(allTouched);
      
      // Only show preview if no errors
      if (Object.keys(formErrors).length === 0) {
        setPreviewMode(true);
      } else {
        // Scroll to first error
        const firstErrorField = Object.keys(formErrors)[0];
        const errorElement = document.getElementById(firstErrorField);
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          errorElement.focus();
        }
      }
    } else {
      setPreviewMode(false);
    }
  };

  const resetForm = () => {
    if (window.confirm('Are you sure you want to reset the form? All entered data will be lost.')) {
      const initialState = {
        organization: '',
        entityType: '',
        entityCategory: '',
        rationale: '',
        period: '',
        auditingOrganization: '',
        signatoryName: '',
        designation: ''
      };
      setFormState(initialState);
      setErrors({});
      setTouched({});
      setFormSubmitted(false);
      localStorage.removeItem(FORM_STORAGE_KEY);
    }
  };

  const loadSampleData = () => {
    const sampleData = generateAnnexureKSampleData(result.organization);
    setFormState(sampleData);
    setErrors({});
    setTouched({});
  };

  // Export as PDF function
  const handleExportPdf = () => {
    // Validate form first
    const formErrors = validateForm();
    setErrors(formErrors);
    
    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    Object.keys(formState).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);
    
    // Only export if no errors
    if (Object.keys(formErrors).length === 0) {
      try {
        // Set loading state
        setIsExporting(true);
        
        // Create the AnnexureKData object
        const annexureKData: AnnexureKData = {
          organization: formState.organization,
          entityType: formState.entityType,
          entityCategory: formState.entityCategory,
          rationale: formState.rationale,
          period: formState.period,
          auditingOrganization: formState.auditingOrganization,
          signatoryName: formState.signatoryName,
          designation: formState.designation
        };
        
        // Extract category scores from result
        const categoryScoresMap: Record<string, { score: number, maturityLevel: string }> = {};
        
        if (result.categoryScores) {
          result.categoryScores.forEach(category => {
            categoryScoresMap[category.name] = {
              score: category.score,
              maturityLevel: getMaturityLevelForScore(category.score)
            };
          });
        }
        
        // Call specific Annexure K export function
        exportAnnexureKReport({
          organizationName: formState.organization,
          assessmentDate: result.date,
          annexureKData: annexureKData,
          cciScore: result.totalScore,
          categoryScores: categoryScoresMap
        })
          .then(() => {
            console.log('Annexure K PDF export completed successfully');
            toast.success('Annexure-K PDF successfully exported for SEBI submission!');
            setIsExporting(false);
          })
          .catch(error => {
            console.error('Error exporting Annexure K PDF:', error);
            toast.error('Failed to export Annexure-K PDF document. Please try again.');
            alert('Failed to export Annexure K PDF document. Please try again.');
            setIsExporting(false);
          });
      } catch (error) {
        console.error('Error starting Annexure K PDF export:', error);
        alert('Failed to start Annexure K PDF export. Please try again.');
        setIsExporting(false);
      }
    } else {
      // Scroll to first error
      const firstErrorField = Object.keys(formErrors)[0];
      const errorElement = document.getElementById(firstErrorField);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        errorElement.focus();
      }
    }
  };

  // Helper function to determine if a field has an error
  const hasError = (fieldName: keyof FormState) => {
    return (touched[fieldName] || formSubmitted) && errors[fieldName];
  };

  // New helper to toggle classification helper visibility
  const toggleClassificationHelper = () => {
    setShowClassificationHelper(prev => !prev);
  };

  return (
    <div className="animate-fadeIn">
      <div className="bg-black p-6 rounded-t-xl relative">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_rgba(40,40,40,0.4),transparent_70%)]"></div>
        <div className="relative z-10 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white tracking-wider">SEBI CSCRF Annexure-K</h2>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={togglePreview}
              className="inline-flex items-center px-3 py-1.5 border border-white/30 text-white text-sm font-medium rounded-md hover:bg-white/10 focus:outline-none transition-colors duration-300"
            >
              {previewMode ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Form
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Preview
                </>
              )}
            </button>
            
            {previewMode && (
              <button
                type="button"
                onClick={handleExportPdf}
                className="bg-white hover:bg-gray-100 text-black py-1.5 px-3 rounded-md transition-all duration-300 flex items-center text-sm font-medium"
              >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                    </svg>
                Export PDF
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-b-xl shadow-md">
        {previewMode ? (
          <div className="p-6">
            <div className="mb-4 bg-black/5 border-l-4 border-black rounded-lg p-4">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <h3 className="text-md font-medium text-black">Preview Mode</h3>
              </div>
              <p className="text-sm text-gray-800 mt-2">
                This is a preview of your Annexure-K report. Click "Edit Form" to make changes or "Export PDF" to download.
              </p>
          </div>
          
          <AnnexureKReport 
            result={result}
            parameters={parameters}
            entityType={formState.entityType}
            entityCategory={formState.entityCategory}
            rationale={formState.rationale}
            period={formState.period}
            auditingOrganization={formState.auditingOrganization}
            signatoryName={formState.signatoryName}
            designation={formState.designation}
          />
          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleSubmit}
              className="bg-black hover:bg-gray-800 text-white py-2 px-6 rounded-md transition duration-200"
            >
              Complete and Save
            </button>
          </div>
          <p className="mt-4 text-sm text-gray-500 text-center">
            Once completed, this form will be included in the detailed CCI report for submission to SEBI.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6">
          {/* Form progress indicator */}
          <div className="mb-6">
            <div className="bg-black/5 border border-black/10 rounded-lg p-4">
              <h3 className="text-lg font-medium text-black mb-2">Annexure-K Form Instructions</h3>
              <p className="text-sm text-gray-700 mb-4">
                This form is required for SEBI compliance reporting. It captures the authorized signatory information that verifies your organization's CCI score for official submission. Please complete all required fields marked with an asterisk (*).
              </p>
              <p className="text-sm text-gray-700 mb-4">
                Once completed, you can export this Annexure-K as a PDF document ready for SEBI submission as part of your compliance documentation.
              </p>
              
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-700">Form Progress:</div>
                <div className="text-sm text-gray-600">
                  {Object.keys(errors).length === 0 && calculateFormProgress() === 100 ? (
                    <span className="text-black font-medium">Ready for submission</span>
                  ) : (
                    <span className="text-gray-600 font-medium">{calculateFormProgress()}% complete</span>
                  )}
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="h-2.5 rounded-full bg-black"
                  style={{ width: `${calculateFormProgress()}%` }}
                ></div>
              </div>
              
              <div className="mt-4 flex items-center justify-end text-sm">
                <button 
                  type="button"
                  onClick={loadSampleData}
                  className="text-black hover:text-gray-600 underline flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Need help? Load sample data to see an example
                </button>
              </div>
            </div>
          </div>
          
          {/* Remove the top export button in form mode - it's confusing */}
          <div className="mb-6 flex justify-end items-center">
            <div className="text-xs text-gray-500 flex items-center">
              <span className="inline-block h-2 w-2 rounded-full bg-black mr-2"></span>
              Form auto-saves as you type
            </div>
          </div>
        
          <div className="space-y-8">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-black mb-4">
                <span className="inline-flex items-center justify-center rounded-full bg-black h-6 w-6 text-white mr-2">1</span>
                Organization Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-1">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    id="organization"
                    name="organization"
                    value={formState.organization}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="Enter organization name"
                    className={`block w-full rounded-md shadow-sm focus:border-black focus:ring-black sm:text-sm ${
                      hasError('organization') ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    required
                    aria-invalid={hasError('organization') ? "true" : "false"}
                    aria-describedby={hasError('organization') ? 'organization-error' : undefined}
                  />
                  {hasError('organization') && (
                    <p className="mt-1 text-sm text-red-600" id="organization-error">{errors.organization}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="entityType" className="block text-sm font-medium text-gray-700 mb-1">
                    Entity Type <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="entityType"
                    name="entityType"
                    value={formState.entityType}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`block w-full rounded-md shadow-sm focus:border-black focus:ring-black sm:text-sm ${
                      hasError('entityType') ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    required
                    aria-invalid={hasError('entityType') ? "true" : "false"}
                    aria-describedby={hasError('entityType') ? 'entityType-error' : undefined}
                  >
                    <option value="">Select Entity Type</option>
                    {entityTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {hasError('entityType') ? (
                    <p className="mt-1 text-sm text-red-600" id="entityType-error">{errors.entityType}</p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500">Select the type of entity you represent under SEBI's classification</p>
                  )}
                </div>
              </div>

              {/* New section for entity metrics based on entity type */}
              {formState.entityType && (
                <div className="col-span-2 bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-md font-medium">Entity Classification Metrics (April 2025 Update)</h3>
                    <button 
                      type="button"
                      onClick={toggleClassificationHelper}
                      className="text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      {showClassificationHelper ? 'Hide Details' : 'Show Details'}
                    </button>
                  </div>
                  
                  {showClassificationHelper && (
                    <div className="mb-4 text-sm bg-blue-50 p-3 rounded">
                      <p className="mb-2">
                        As per SEBI Circular <a href="https://www.sebi.gov.in/legal/circulars/apr-2025/clarifications-to-cybersecurity-and-cyber-resilience-framework-cscrf-for-sebi-regulated-entities-res-_93734.html" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">SEBI/HO/ITD-1/ITD_CSC_EXT/P/CIR/2025/60</a> dated April 30, 2025, entities are classified based on specific criteria.
                        Classification is determined at the beginning of each financial year based on previous year's data.
                      </p>
                      {formState.entityType === 'Stock Broker' && (
                        <div>
                          <p className="font-medium mt-2">Stock Brokers Classification:</p>
                          <ul className="list-disc pl-4">
                            <li>Qualified RE: Clients &gt;10 lakhs OR Trading Value &gt;₹10,00,000 Cr</li>
                            <li>Mid-size RE: Clients 1-10 lakhs OR Trading Value ₹1,00,000-10,00,000 Cr</li>
                            <li>Small-size RE: Clients 10,000-1 lakh OR Trading Value ₹10,000-1,00,000 Cr</li>
                            <li>Self-certification RE: Clients &lt;10,000 AND Trading Value &lt;₹10,000 Cr</li>
                          </ul>
                        </div>
                      )}
                      {formState.entityType === 'Portfolio Manager' && (
                        <div>
                          <p className="font-medium mt-2">Portfolio Managers Classification:</p>
                          <ul className="list-disc pl-4">
                            <li>Mid-size RE: AUM &gt;₹3,000 Cr</li>
                            <li>Self-certification RE: AUM ≤₹3,000 Cr</li>
                          </ul>
                        </div>
                      )}
                      {formState.entityType === 'Investment Advisor' && (
                        <div>
                          <p className="font-medium mt-2">Investment Advisors Classification:</p>
                          <ul className="list-disc pl-4">
                            <li>Mid-size RE: Clients &gt;500</li>
                            <li>Small-size RE: Clients 101-500</li>
                            <li>Self-certification RE: Clients ≤100</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
                    {/* Stock Broker metrics */}
                    {formState.entityType === 'Stock Broker' && (
                      <>
                        <div>
                          <label htmlFor="clientCount" className="block text-sm font-medium text-gray-700 mb-1">
                            Number of Registered Clients
                          </label>
                          <input
                            type="number"
                            id="clientCount"
                            name="clientCount"
                            value={entityMetrics.clientCount || ''}
                            onChange={handleMetricsChange}
                            className="mt-1 block w-full rounded-md shadow-sm border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="e.g. 50000"
                          />
                        </div>
                        <div>
                          <label htmlFor="tradingValue" className="block text-sm font-medium text-gray-700 mb-1">
                            Trading Value (in Cr)
                          </label>
                          <input
                            type="number"
                            id="tradingValue"
                            name="tradingValue"
                            value={entityMetrics.tradingValue || ''}
                            onChange={handleMetricsChange}
                            className="mt-1 block w-full rounded-md shadow-sm border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="e.g. 25000"
                          />
                        </div>
                      </>
                    )}
                    
                    {/* Portfolio Manager metrics */}
                    {formState.entityType === 'Portfolio Manager' && (
                      <div>
                        <label htmlFor="aum" className="block text-sm font-medium text-gray-700 mb-1">
                          Assets Under Management (in Cr)
                        </label>
                        <input
                          type="number"
                          id="aum"
                          name="aum"
                          value={entityMetrics.aum || ''}
                          onChange={handleMetricsChange}
                          className="mt-1 block w-full rounded-md shadow-sm border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                          placeholder="e.g. 1500"
                        />
                      </div>
                    )}
                    
                    {/* Investment Advisor metrics */}
                    {formState.entityType === 'Investment Advisor' && (
                      <div>
                        <label htmlFor="clientCount" className="block text-sm font-medium text-gray-700 mb-1">
                          Number of Clients
                        </label>
                        <input
                          type="number"
                          id="clientCount"
                          name="clientCount"
                          value={entityMetrics.clientCount || ''}
                          onChange={handleMetricsChange}
                          className="mt-1 block w-full rounded-md shadow-sm border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                          placeholder="e.g. 200"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="entityCategory" className="block text-sm font-medium text-gray-700 mb-1">
                    Entity Category (as per CSCRF) <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="entityCategory"
                    name="entityCategory"
                    value={formState.entityCategory}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`block w-full rounded-md shadow-sm focus:border-black focus:ring-black sm:text-sm ${
                      hasError('entityCategory') ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    required
                    aria-invalid={hasError('entityCategory') ? "true" : "false"}
                    aria-describedby={hasError('entityCategory') ? 'entityCategory-error' : undefined}
                  >
                    <option value="">Select Category</option>
                    {entityCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  {hasError('entityCategory') ? (
                    <p className="mt-1 text-sm text-red-600" id="entityCategory-error">{errors.entityCategory}</p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500">
                      {formState.entityType && ['Stock Exchange', 'Depository', 'Clearing Corporation'].includes(formState.entityType) 
                        ? 'MIIs are automatically categorized as Market Infrastructure Institutions' 
                        : 'Select the appropriate category as defined in SEBI CSCRF'}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-1">
                    Period <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="period"
                    name="period"
                    value={formState.period}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="e.g., April 2023 - March 2024"
                    className={`block w-full rounded-md shadow-sm focus:border-black focus:ring-black sm:text-sm ${
                      hasError('period') ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    required
                    aria-invalid={hasError('period') ? "true" : "false"}
                    aria-describedby={hasError('period') ? 'period-error' : undefined}
                  />
                  {hasError('period') ? (
                    <p className="mt-1 text-sm text-red-600" id="period-error">{errors.period}</p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500">Enter the assessment period in the format "Month Year - Month Year"</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 mb-6">
                <div>
                  <label htmlFor="rationale" className="block text-sm font-medium text-gray-700 mb-1">
                    Rationale for the Category <span className="text-red-600">*</span>
                  </label>
                  <div className="mb-2 text-xs text-gray-600 bg-black/5 p-2 rounded">
                    <p className="font-medium">Guidance:</p>
                    <p>Explain why your entity belongs to the selected category as per SEBI CSCRF classification criteria. Include your cybersecurity posture, systemic importance, and business impact.</p>
                  </div>
                  <textarea
                    id="rationale"
                    name="rationale"
                    value={formState.rationale}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    rows={3}
                    className={`block w-full rounded-md shadow-sm focus:border-black focus:ring-black sm:text-sm ${
                      hasError('rationale') ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Provide detailed reasoning for the selected entity category based on CSCRF criteria..."
                    required
                    aria-invalid={hasError('rationale') ? "true" : "false"}
                    aria-describedby={hasError('rationale') ? 'rationale-error' : undefined}
                  />
                  {hasError('rationale') ? (
                    <p className="mt-1 text-sm text-red-600" id="rationale-error">{errors.rationale}</p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500">Minimum 10 characters required</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="auditingOrganization" className="block text-sm font-medium text-gray-700 mb-1">
                  Name of the Auditing Organisation {isMII && <span className="text-red-600">*</span>}
                </label>
                <input
                  type="text"
                  id="auditingOrganization"
                  name="auditingOrganization"
                  value={formState.auditingOrganization}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="Enter the name of third-party auditing organization (for MIIs only)"
                  className={`block w-full rounded-md shadow-sm focus:border-black focus:ring-black sm:text-sm ${
                    hasError('auditingOrganization') ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  required={isMII}
                  aria-invalid={hasError('auditingOrganization') ? "true" : "false"}
                  aria-describedby={hasError('auditingOrganization') ? 'auditingOrganization-error' : undefined}
                />
                {hasError('auditingOrganization') ? (
                  <p className="mt-1 text-sm text-red-600" id="auditingOrganization-error">{errors.auditingOrganization}</p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">
                    {isMII ? 
                      'Required for Market Infrastructure Institutions (MIIs) - enter the official name of your auditing partner' :
                      'Only required for MIIs. Leave blank if not applicable.'}
                  </p>
                )}
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-black mb-4">
                <span className="inline-flex items-center justify-center rounded-full bg-black h-6 w-6 text-white mr-2">2</span>
                Authorised Signatory Declaration
              </h3>
              
              <p className="mb-6 text-sm text-gray-700">
                I/ We hereby confirm that Cyber Capability Index (CCI) has been verified by me/ us and I/ We shall take the responsibility and ownership of the CCI report.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="signatoryName" className="block text-sm font-medium text-gray-700 mb-1">
                    Name of the Signatory <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="signatoryName"
                    name="signatoryName"
                    value={formState.signatoryName}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="Full name of authorized signatory"
                    className={`block w-full rounded-md shadow-sm focus:border-black focus:ring-black sm:text-sm ${
                      hasError('signatoryName') ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    required
                    aria-invalid={hasError('signatoryName') ? "true" : "false"}
                    aria-describedby={hasError('signatoryName') ? 'signatoryName-error' : undefined}
                  />
                  {hasError('signatoryName') ? (
                    <p className="mt-1 text-sm text-red-600" id="signatoryName-error">{errors.signatoryName}</p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500">Enter the full name of the person authorized to sign this document</p>
                  )}
                </div>
                <div>
                  <label htmlFor="designation" className="block text-sm font-medium text-gray-700 mb-1">
                    Designation <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="designation"
                    name="designation"
                    value={formState.designation}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`block w-full rounded-md shadow-sm focus:border-black focus:ring-black sm:text-sm ${
                      hasError('designation') ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    required
                    aria-invalid={hasError('designation') ? "true" : "false"}
                    aria-describedby={hasError('designation') ? 'designation-error' : undefined}
                  >
                    <option value="">Select Designation</option>
                    <option value="MD">MD</option>
                    <option value="CEO">CEO</option>
                    <option value="Board member">Board member</option>
                    <option value="Partners">Partners</option>
                    <option value="Proprietor">Proprietor</option>
                  </select>
                  {hasError('designation') ? (
                    <p className="mt-1 text-sm text-red-600" id="designation-error">{errors.designation}</p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500">This must be a senior executive authorized to represent the organization (MD/CEO/Board member/Partners/Proprietor)</p>
                  )}
                </div>
              </div>
              <div className="bg-black/5 border border-gray-200 rounded p-3 text-xs text-gray-600">
                <p><strong>Note:</strong> The authorised signatory declaration confirms that the reported CCI score has been verified and the organization takes responsibility for the accuracy of the report. As per SEBI requirements, this must be signed by a person in a position of authority.</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 bg-black/5 p-4 rounded-lg border border-gray-200">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-gray-800">Before submitting:</h4>
                <ul className="mt-1 text-xs text-gray-600 list-disc list-inside">
                  <li>Verify all information is accurate and complete</li>
                  <li>Ensure the authorized signatory has approved this submission</li>
                  <li>Click "Preview Report" to review the final document</li>
                </ul>
              </div>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onCancel}
                className="bg-gray-200 hover:bg-gray-300 text-black py-2 px-6 rounded-md transition duration-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={isExporting}
                className={`${isExporting ? 'bg-gray-500' : 'bg-white hover:bg-gray-100'} border border-black text-black py-2 px-6 rounded-md transition duration-200 flex items-center`}
              >
                {isExporting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                    </svg>
                    Export Annexure-K as PDF
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={togglePreview}
                className="bg-black hover:bg-gray-800 text-white py-2 px-6 rounded-md transition duration-200 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                Preview Report
              </button>
            </div>
          </div>
        </form>
      )}
        
        <CreatorFooter />
      </div>
    </div>
  );
};

export default AnnexureKForm; 