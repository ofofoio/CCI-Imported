"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ParameterInput from '../components/ParameterInput';
import CCIResults from '../components/CCIResults';
import CCIReport from '../components/CCIReport';
import AnnexureKForm from '../components/AnnexureKForm';
import SBOMManagement from '../components/SBOMManagement';
import Sidebar from '../components/Sidebar';
import { initialCCIParameters, generateSampleData } from './data/cciParameters';
import { CCIParameter, CCIResult, AnnexureKData } from './types';
import { calculateCCIIndex } from './utils/cciCalculator';
import { exportToMarkdown, exportToPdf, exportToCsv, exportCompactSebiReport, exportAnnexureKReport, exportSBOMDocument } from './utils/exportUtils';
import DataCollectionForm from '../components/DataCollectionForm';
import { FormState as AnnexureKFormState } from '../components/AnnexureKForm';
import { toast } from 'react-hot-toast';

// @ts-ignore - This component exists but TypeScript is having trouble finding it
import CCIParameterReport from '../components/CCIParameterReport';

// Add this function at the top level before your component
function CalculatorJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "SEBI CSCRF CCI Calculator",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "All",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "INR"
          },
          "description": "Official SEBI CSCRF Compliance Assessment Tool for calculating Cyber Capability Index (CCI) scores for Qualified REs and MIIs.",
          "audience": {
            "@type": "Audience",
            "audienceType": "Qualified Registered Entities and Market Infrastructure Institutions"
          }
        })
      }}
    />
  );
}

// Helper function to determine maturity level based on score
const getMaturityLevelForScore = (score: number): string => {
  if (score >= 91) return 'Exceptional';
  if (score >= 81) return 'Optimal';
  if (score >= 71) return 'Manageable';
  if (score >= 61) return 'Developing';
  if (score >= 51) return 'Bare Minimum';
  return 'Insufficient';
};

export default function Home() {
  const [parameters, setParameters] = useState<CCIParameter[]>(initialCCIParameters);
  const [showResults, setShowResults] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showDataCollection, setShowDataCollection] = useState(false);
  const [showAnnexureK, setShowAnnexureK] = useState<boolean>(false);
  const [showSBOM, setShowSBOM] = useState<boolean>(false);
  const [showOnlyParameterReport, setShowOnlyParameterReport] = useState(false);
  const [organizationName, setOrganizationName] = useState('Enter Organization Name');
  const [organizationNameError, setOrganizationNameError] = useState('');
  const [expandedParameter, setExpandedParameter] = useState<number | null>(null);
  const [assessmentDate, setAssessmentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [annexureKData, setAnnexureKData] = useState<AnnexureKData | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Determine current progress step
  const getCurrentStep = () => {
    if (showReport || showOnlyParameterReport) {
      return 2; // Export step
    } else if (showResults) {
      return 1; // Results step
    } else {
      return 0; // Input step (basic or detailed)
    }
  };
  
  const currentStep = getCurrentStep();
  const steps = [
    { name: 'Input', description: 'Enter parameters (basic or detailed)' },
    { name: 'Results', description: 'View analysis' },
    { name: 'Export', description: 'Download reports' }
  ];

  const handleParameterChange = (paramId: number, field: keyof CCIParameter, value: number | string) => {
    setParameters(prevParams => 
      prevParams.map(param => 
        param.id === paramId 
          ? { ...param, [field]: value } 
          : param
      )
    );
  };

  // Create a dynamic CCI result that includes organization name and date
  const cciResult: CCIResult = React.useMemo(() => {
    const baseResult = calculateCCIIndex(parameters);
    return {
      ...baseResult,
      date: assessmentDate,
      organization: organizationName
    };
  }, [parameters, assessmentDate, organizationName]);

  const handleCalculate = () => {
    // Validate organization name
    if (!organizationName || organizationName.trim() === '' || organizationName === 'Enter Organization Name') {
      setOrganizationNameError('Please enter your organization name');
      // Focus on the organization name field
      const orgNameField = document.getElementById('organizationName');
      if (orgNameField) {
        orgNameField.focus();
      }
      return;
    }
    
    setOrganizationNameError('');
    setShowResults(true);
    setShowReport(false);
    setShowDataCollection(false);
    // Smooth scroll to results
    setTimeout(() => {
      const resultsElement = document.getElementById('results');
      if (resultsElement) {
        resultsElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleReset = () => {
    setParameters(initialCCIParameters);
    setShowResults(false);
    setShowReport(false);
    setShowDataCollection(false);
    setShowAnnexureK(false);
    setShowSBOM(false);
    setShowOnlyParameterReport(false);
    setOrganizationName('Enter Organization Name');
    setOrganizationNameError('');
    setExpandedParameter(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewReport = () => {
    setShowReport(true);
    setShowResults(false);
    setShowDataCollection(false);
    setShowAnnexureK(false);
    setShowOnlyParameterReport(false);
    setTimeout(() => {
      const reportElement = document.getElementById('report');
      if (reportElement) {
        reportElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleViewParameterReport = () => {
    setShowOnlyParameterReport(true);
    setShowReport(false);
    setShowResults(false);
    setShowDataCollection(false);
    setShowAnnexureK(false);
    setShowSBOM(false);
    setTimeout(() => {
      const reportElement = document.getElementById('parameter-report');
      if (reportElement) {
        reportElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleExportMarkdown = () => {
    // Validate organization name
    if (!organizationName || organizationName.trim() === '' || organizationName === 'Enter Organization Name') {
      setOrganizationNameError('Please enter your organization name');
      // Focus on the organization name field
      const orgNameField = document.getElementById('organizationName');
      if (orgNameField) {
        orgNameField.focus();
        orgNameField.scrollIntoView({ behavior: 'smooth' });
      }
      toast.error('Please enter your organization name before exporting');
      return;
    }
    
    // Show loading indicator
    console.group('Markdown Export Process - Started');
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Organization: ${organizationName}`);
    console.log(`Parameters Count: ${parameters.length}`);
    
    try {
      // Export the markdown report
      exportToMarkdown(parameters, cciResult, annexureKData || undefined)
        .then(() => {
          console.log('Markdown export completed successfully');
          console.log(`Markdown file generated for: ${cciResult.organization}`);
          console.groupEnd();
        })
        .catch(error => {
          console.error('Error exporting Markdown:', error);
          console.groupEnd();
          toast.error('Failed to export Markdown document');
        });
    } catch (error) {
      console.error('Error starting Markdown export:', error);
      console.groupEnd();
      toast.error('Failed to start Markdown export');
    }
  };

  const handleExportPdf = () => {
    // Validate organization name
    if (!organizationName || organizationName.trim() === '' || organizationName === 'Enter Organization Name') {
      setOrganizationNameError('Please enter your organization name');
      // Focus on the organization name field
      const orgNameField = document.getElementById('organizationName');
      if (orgNameField) {
        orgNameField.focus();
        orgNameField.scrollIntoView({ behavior: 'smooth' });
      }
      toast.error('Please enter your organization name before exporting');
      return;
    }

    // Show loading indicator
    console.group('PDF Export Process - Started');
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Organization: ${organizationName}`);
    console.log(`Parameters Count: ${parameters.length}`);
    
    try {
      // Export the PDF report
      exportToPdf(parameters, cciResult, annexureKData || undefined)
        .then(() => {
          console.log('PDF export completed successfully');
          console.log(`PDF file generated for: ${cciResult.organization}`);
          console.groupEnd();
        })
        .catch(error => {
          console.error('Error exporting PDF:', error);
          console.groupEnd();
          toast.error('Failed to export PDF document');
        });
    } catch (error) {
      console.error('Error starting PDF export:', error);
      console.groupEnd();
      toast.error('Failed to start PDF export');
    }
  };

  const handleExportCsv = () => {
    // Validate organization name
    if (!organizationName || organizationName.trim() === '' || organizationName === 'Enter Organization Name') {
      setOrganizationNameError('Please enter your organization name');
      // Focus on the organization name field
      const orgNameField = document.getElementById('organizationName');
      if (orgNameField) {
        orgNameField.focus();
        orgNameField.scrollIntoView({ behavior: 'smooth' });
      }
      toast.error('Please enter your organization name before exporting');
      return;
    }

    // Show loading indicator
    console.group('CSV Export Process - Started');
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Organization: ${organizationName}`);
    console.log(`Parameters Count: ${parameters.length}`);
    
    try {
      // Export the CSV data
      exportToCsv(parameters, cciResult)
        .then(() => {
          console.log('CSV export completed successfully');
          console.log(`CSV file generated for: ${cciResult.organization}`);
          console.groupEnd();
        })
        .catch(error => {
          console.error('Error exporting CSV:', error);
          console.groupEnd();
          toast.error('Failed to export CSV file');
        });
    } catch (error) {
      console.error('Error starting CSV export:', error);
      console.groupEnd();
      toast.error('Failed to start CSV export');
    }
  };

  const handleExportCompactSebiReport = () => {
    // Validate organization name
    if (!organizationName || organizationName.trim() === '' || organizationName === 'Enter Organization Name') {
      setOrganizationNameError('Please enter your organization name');
      // Focus on the organization name field
      const orgNameField = document.getElementById('organizationName');
      if (orgNameField) {
        orgNameField.focus();
        orgNameField.scrollIntoView({ behavior: 'smooth' });
      }
      toast.error('Please enter your organization name before exporting');
      return;
    }

    // Show loading indicator
    console.group('Parameters-Only SEBI Report Export Process - Started');
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Organization: ${organizationName}`);
    console.log(`Parameters Count: ${parameters.length}`);
    
    try {
      // Export the parameters-only SEBI report
      exportCompactSebiReport(parameters, cciResult, annexureKData || undefined)
        .then(() => {
          console.log('Parameters-only SEBI report export completed successfully');
          console.log(`Parameters-only SEBI report generated for: ${cciResult.organization}`);
          console.groupEnd();
        })
        .catch(error => {
          console.error('Error exporting parameters-only SEBI report:', error);
          console.groupEnd();
          toast.error('Failed to export parameters-only SEBI report');
        });
    } catch (error) {
      console.error('Error starting parameters-only SEBI report export:', error);
      console.groupEnd();
      toast.error('Failed to start parameters-only SEBI report export');
    }
  };

  const handleLoadSample = () => {
    setParameters(generateSampleData());
  };

  const toggleExpanded = (paramId: number) => {
    setExpandedParameter(expandedParameter === paramId ? null : paramId);
  };

  const expandAll = () => {
    // If all are expanded, collapse all
    if (parameters.every(param => expandedParameter === param.id)) {
      setExpandedParameter(null);
    } else {
      // Otherwise expand the first one (just to mark something as expanded)
      setExpandedParameter(parameters[0].id);
    }
  };

  const handleShowDataCollection = () => {
    setShowDataCollection(true);
    setShowResults(false);
    setShowReport(false);
    setShowAnnexureK(false);
    // Smooth scroll to data collection form
    setTimeout(() => {
      const formElement = document.getElementById('data-collection');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleShowAnnexureK = () => {
    setShowAnnexureK(true);
    setShowResults(false);
    setShowReport(false);
    setShowDataCollection(false);
    // Smooth scroll to Annexure K form
    setTimeout(() => {
      const formElement = document.getElementById('annexure-k-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleDataCollectionComplete = (updatedParameters: CCIParameter[]) => {
    setParameters(updatedParameters);
    setShowDataCollection(false);
    handleCalculate();
  };

  const handleAnnexureKComplete = (formData: AnnexureKData) => {
    setAnnexureKData(formData);
    setShowAnnexureK(false);
    handleViewReport();
  };

  const handleShowSBOM = () => {
    setShowSBOM(true);
    setShowResults(false);
    setShowReport(false);
    setShowDataCollection(false);
    setShowAnnexureK(false);
    // Smooth scroll to SBOM management
    setTimeout(() => {
      const sbomElement = document.getElementById('sbom-management');
      if (sbomElement) {
        sbomElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // Group parameters by category for better organization
  const groupedParameters: Record<string, CCIParameter[]> = {};
  parameters.forEach(param => {
    const category = param.measureId.split('.')[0] || 'Other';
    if (!groupedParameters[category]) {
      groupedParameters[category] = [];
    }
    groupedParameters[category].push(param);
  });

  const getCategoryName = (category: string) => {
    const categories: Record<string, string> = {
      'GV': 'Governance',
      'ID': 'Identify',
      'PR': 'Protect',
      'DE': 'Detect',
      'RS': 'Respond',
      'RC': 'Recover'
    };
    return categories[category] || category;
  };

  // Handle export of Annexure K
  const handleExportAnnexureK = async () => {
    // Validate organization name
    if (!organizationName || organizationName.trim() === '' || organizationName === 'Enter Organization Name') {
      setOrganizationNameError('Please enter your organization name');
      // Focus on the organization name field
      const orgNameField = document.getElementById('organizationName');
      if (orgNameField) {
        orgNameField.focus();
        orgNameField.scrollIntoView({ behavior: 'smooth' });
      }
      toast.error('Please enter your organization name before exporting');
      return;
    }
    
    console.log('Exporting Annexure K...');
    
    try {
      if (cciResult) {
        // Build annexure K data from form or generate default values
        const annexureKFormData: AnnexureKData = {
          organization: organizationName,
          entityType: 'Stock Exchange', // Default value
          entityCategory: 'Market Infrastructure Institution (MII)', // Default value
          rationale: 'As per SEBI CSCRF guidelines', // Default value
          period: `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`, // Last year to current year
          auditingOrganization: 'Internal Assessment', // Default value
          signatoryName: 'CISO', // Default value
          designation: 'Chief Information Security Officer' // Default value
        };
        
        // Extract category scores from cciResult
        const categoryScoresMap: Record<string, { score: number, maturityLevel: string }> = {};
        
        if (cciResult.categoryScores) {
          cciResult.categoryScores.forEach(category => {
            categoryScoresMap[category.name] = {
              score: category.score,
              maturityLevel: getMaturityLevelForScore(category.score)
            };
          });
        }
        
        // Call export function with correctly formatted data
        await exportAnnexureKReport({
          organizationName: organizationName,
          assessmentDate: assessmentDate,
          annexureKData: annexureKFormData,
          cciScore: cciResult.totalScore,
          categoryScores: categoryScoresMap
        });
        
        toast.success('Annexure K exported successfully!');
      } else {
        toast.error('Unable to export Annexure K. Invalid result data.');
      }
    } catch (error) {
      console.error('Error exporting Annexure K:', error);
      toast.error('Failed to export Annexure K. See console for details.');
    }
  };

  // Handle export of SBOM
  const handleExportSBOM = async () => {
    // Validate organization name
    if (!organizationName || organizationName.trim() === '' || organizationName === 'Enter Organization Name') {
      setOrganizationNameError('Please enter your organization name');
      // Focus on the organization name field
      const orgNameField = document.getElementById('organizationName');
      if (orgNameField) {
        orgNameField.focus();
        orgNameField.scrollIntoView({ behavior: 'smooth' });
      }
      toast.error('Please enter your organization name before exporting');
      return;
    }
    
    console.log('Exporting SBOM data...');
    
    try {
      // Get the SBOM registry from localStorage
      const sbomRegistryData = localStorage.getItem('sbomRegistry');
      if (!sbomRegistryData) {
        toast.error('No SBOM data found. Please create SBOM records first.');
        return;
      }
      
      const sbomRegistry = JSON.parse(sbomRegistryData);
      
      // Check if there are any SBOM documents
      if (!sbomRegistry.sbomDocuments || sbomRegistry.sbomDocuments.length === 0) {
        toast.error('No SBOM documents found. Please create at least one SBOM document.');
        return;
      }
      
      // Call export function with SBOM data
      const success = await exportSBOMDocument(
        organizationName,
        sbomRegistry,
        assessmentDate
      );
      
      if (success) {
        toast.success('SBOM data exported successfully for SEBI submission!');
      } else {
        toast.error('Failed to export SBOM data. Please try again.');
      }
    } catch (error) {
      console.error('Error exporting SBOM data:', error);
      toast.error('Failed to export SBOM data. See console for details.');
    }
  };

  return (
    <>
      <CalculatorJsonLd />
      <div className="flex">
        <Sidebar 
          showResults={showResults}
          showReport={showReport}
          showDataCollection={showDataCollection}
          showAnnexureK={showAnnexureK}
          showSBOM={showSBOM}
          showOnlyParameterReport={showOnlyParameterReport}
          onCalculate={handleCalculate}
          onReset={handleReset}
          onViewReport={handleViewReport}
          onViewParameterReport={handleViewParameterReport}
          onShowDataCollection={handleShowDataCollection}
          onShowAnnexureK={handleShowAnnexureK}
          onShowSBOM={handleShowSBOM}
          onExportMarkdown={handleExportMarkdown}
          onExportPdf={handleExportPdf}
          onExportCsv={handleExportCsv}
          onExportCompactSebiReport={handleExportCompactSebiReport}
          onExportAnnexureK={handleExportAnnexureK}
          onExportSBOM={handleExportSBOM}
        />
        
        <main className="md:ml-64 w-full max-w-6xl mx-auto px-4 pb-20">
          <section aria-labelledby="cci-calculator-heading" className="p-8 mt-4 bg-black text-white rounded-xl shadow-lg mb-8">
            <h1 id="cci-calculator-heading" className="text-3xl font-bold text-center">
              Cyber Capability Index Calculator
            </h1>
            <p className="mt-2 text-center text-gray-300">
              SEBI CSCRF Compliance Assessment Tool<br />
              <span className="bg-white text-black px-2 py-1 mt-1 inline-block rounded-md font-medium text-sm">
                For Qualified REs & MIIs only | Deadline: June 30, 2025
              </span>
            </p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div className="md:col-span-3">
                <label htmlFor="organizationName" className="block text-xs font-medium text-gray-300">Organization Name <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input 
                    type="text" 
                    id="organizationName" 
                    value={organizationName} 
                    onChange={(e) => {
                      setOrganizationName(e.target.value);
                      if (e.target.value.trim() !== '') {
                        setOrganizationNameError('');
                      }
                    }}
                    onClick={() => {
                      if (organizationName === 'Enter Organization Name') {
                        setOrganizationName('');
                      }
                    }}
                    className={`mt-1 block w-full rounded-md border ${organizationNameError ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-gray-500 focus:ring-gray-500 text-sm h-9 text-gray-900 ${organizationName === 'Enter Organization Name' ? 'text-gray-500 italic' : ''}`}
                    placeholder="e.g., ABC Securities Ltd."
                    required
                  />
                  {organizationNameError && (
                    <p className="absolute text-xs text-red-500 -bottom-4">{organizationNameError}</p>
                  )}
                </div>
              </div>
              <div className="md:col-span-1">
                <label htmlFor="assessmentDate" className="block text-xs font-medium text-gray-300">Assessment Date</label>
                <input 
                  type="date" 
                  id="assessmentDate" 
                  value={assessmentDate} 
                  onChange={(e) => setAssessmentDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 text-gray-900 text-sm h-9"
                />
              </div>
            </div>
          </section>

          {/* CCI Calculation Explanation Blurb */}
          <section aria-label="CCI Calculation Explanation" className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded-r-md shadow-sm">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">How to Calculate Your CCI Score</h3>
            <p className="text-sm text-blue-900">
              The Cyber Capability Index (CCI) is calculated based on 23 critical parameters across 6 NIST-aligned domains 
              (Governance, Identify, Protect, Detect, Respond, and Recover). Each parameter has a specific weightage and target value,
              with scores determined by the ratio of numerator to denominator values. A score of 61+ ("Developing") meets SEBI CSCRF
              requirements for Qualified REs, while MIIs need 71+ ("Manageable") for compliance.
            </p>
          </section>

          {/* Progress Bar */}
          <section aria-label="Progress Tracker" className="my-6 bg-white rounded-xl shadow-md p-6">
            <div className="mb-3">
              <h2 className="text-lg font-semibold text-gray-700">Progress Tracker</h2>
              <p className="text-sm text-gray-500">
                Complete these steps to generate your SEBI CSCRF report
                <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                  For Qualified REs & MIIs only
                </span>
              </p>
            </div>
            <div className="relative mb-2">
              <div className="overflow-hidden h-3 mb-6 text-xs flex rounded bg-gray-200">
                <div style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }} 
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-black transition-all duration-500"></div>
              </div>
              <div className="flex justify-between">
                {steps.map((step, index) => (
                  <div key={index} className={`flex flex-col items-center ${index <= currentStep ? 'text-black' : 'text-gray-400'}`}>
                    <div className={`flex items-center justify-center h-12 w-12 rounded-full ${index <= currentStep ? 'bg-black text-white' : 'bg-gray-200'} mb-1`}>
                      {index + 1}
                    </div>
                    <div className="text-sm font-medium">{step.name}</div>
                    <div className="text-xs text-gray-500 text-center">{step.description}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-sm text-center mt-4 text-gray-600 bg-gray-100 py-3 rounded font-medium">
              {currentStep === 0 && "Step 1: Fill in your parameters through basic or detailed calculator"}
              {currentStep === 1 && "Step 2: Review your results and CCI score with detailed analysis"}
              {currentStep === 2 && "Step 3: Export your completed report in your preferred format"}
            </div>
          </section>

          {/* Calculate CCI Button - Centered below progress tracker */}
          <div className="flex justify-center mb-8">
            <button
              onClick={() => {
                // Check if any parameters have been filled in
                const hasFilledParameters = parameters.some(param => 
                  param.numerator !== undefined && param.numerator !== 0 && 
                  param.denominator !== undefined && param.denominator !== 0
                );
                
                if (!hasFilledParameters) {
                  toast.error('Please fill in the calculator parameters before proceeding');
                  
                  // Highlight a parameter to draw attention
                  const paramSection = document.querySelector('.space-y-4');
                  if (paramSection) {
                    paramSection.scrollIntoView({ behavior: 'smooth' });
                  }
                  return;
                }
                
                handleCalculate();
              }}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md shadow-md flex items-center justify-center text-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Calculate CCI
            </button>
          </div>

          {/* Parameters Section */}
          {!showDataCollection && !showResults && !showReport && !showSBOM && !showAnnexureK && !showOnlyParameterReport && (
            <section aria-label="CCI Parameters" className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
              <div className="p-6 bg-black border-b flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">CCI Parameters</h2>
                <div className="flex space-x-4">
                  <button
                    onClick={handleLoadSample}
                    className="cci-btn-outline text-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Load Sample Data
                  </button>
                  <button 
                    onClick={expandAll}
                    className="cci-btn-outline text-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Toggle All
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                {Object.keys(groupedParameters).map((category, categoryIndex) => (
                  <div key={categoryIndex} className="mb-8">
                    <h3 className="text-lg font-medium text-black mb-4 pb-2 border-b">
                      {getCategoryName(category)} Parameters
                    </h3>
                    
                    <div className="space-y-4">
                      {groupedParameters[category].map((param) => (
                        <div key={param.id} className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200">
                          <ParameterInput 
                            parameter={param} 
                            onChange={handleParameterChange}
                            expanded={expandedParameter === param.id}
                            onToggleExpand={() => toggleExpanded(param.id)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {/* Calculate CCI Button at the bottom of parameters */}
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={handleCalculate}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md shadow-md flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Calculate CCI
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Data Collection Form */}
          {showDataCollection && (
            <section id="data-collection" aria-label="Detailed Data Collection" className="mb-8 animate-fadeIn">
              <div className="flex justify-end mb-4">
                <button
                  onClick={handleLoadSample}
                  className="cci-btn-outline text-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Load Sample Data
                </button>
              </div>
              <DataCollectionForm 
                parameters={parameters} 
                onComplete={handleDataCollectionComplete}
                onCancel={() => setShowDataCollection(false)}
              />
            </section>
          )}

          {/* Results Section */}
          {showResults && !showReport && !showDataCollection && !showAnnexureK && !showSBOM && !showOnlyParameterReport && (
            <section id="results" aria-label="CCI Results" className="animate-fadeIn">
              <div className="flex justify-end mb-4">
                <button
                  onClick={handleLoadSample}
                  className="cci-btn-outline text-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Load Sample Data
                </button>
              </div>
              <CCIResults 
                result={cciResult} 
                onViewReport={handleViewReport}
                onViewParameterReport={handleViewParameterReport}
                onReset={handleReset}
                onShowAnnexureK={handleShowAnnexureK}
              />
            </section>
          )}

          {/* Report Section */}
          {showReport && !showDataCollection && !showAnnexureK && !showSBOM && !showOnlyParameterReport && (
            <section id="report" aria-label="CCI Report" className="animate-fadeIn">
              <div className="flex justify-end mb-4">
                <button
                  onClick={handleLoadSample}
                  className="cci-btn-outline text-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Load Sample Data
                </button>
              </div>
              <CCIReport 
                result={cciResult} 
                parameters={parameters}
                annexureKData={annexureKData || undefined}
                onExportMarkdown={handleExportMarkdown}
                onExportPdf={handleExportPdf}
                onExportCsv={handleExportCsv}
                onExportCompactSebiReport={handleExportCompactSebiReport}
                onExportAnnexureK={handleExportAnnexureK}
                onReset={() => {
                  setShowReport(false);
                  setShowAnnexureK(false);
                }}
                isExporting={isExporting}
              />
            </section>
          )}

          {/* Only Parameter Report Section */}
          {showOnlyParameterReport && !showReport && !showDataCollection && !showAnnexureK && !showSBOM && (
            <section id="parameter-report" aria-label="CCI Parameter Report" className="animate-fadeIn">
              <div className="flex justify-end mb-4">
                <button
                  onClick={handleLoadSample}
                  className="cci-btn-outline text-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Load Sample Data
                </button>
              </div>
              <CCIParameterReport 
                result={cciResult} 
                parameters={parameters}
                onReset={handleReset}
                onExportMarkdown={handleExportMarkdown}
                onExportPdf={handleExportPdf}
                onExportCsv={handleExportCsv}
              />
            </section>
          )}

          {/* SBOM Section */}
          {showSBOM && (
            <section id="sbom-management" aria-label="SBOM Management" className="mb-8 animate-fadeIn">
              <div className="flex justify-end mb-4">
                <button
                  onClick={handleLoadSample}
                  className="cci-btn-outline text-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Load Sample Data
                </button>
              </div>
              <SBOMManagement
                organizationName={organizationName}
                onBack={() => {
                  setShowSBOM(false);
                  if (showResults) {
                    setShowResults(true);
                  } else if (showReport) {
                    setShowReport(true);
                  }
                }}
                onExportSBOM={handleExportSBOM}
              />
            </section>
          )}

          {/* Annexure K Form Section */}
          {showAnnexureK && (
            <section id="annexure-k-form" aria-label="Annexure K Form" className="mb-8 animate-fadeIn">
              <div className="flex justify-end mb-4">
                <button
                  onClick={handleLoadSample}
                  className="cci-btn-outline text-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Load Sample Data
                </button>
              </div>
              <AnnexureKForm 
                result={cciResult}
                parameters={parameters}
                onComplete={handleAnnexureKComplete}
                onCancel={() => {
                  setShowAnnexureK(false);
                  if (showResults) {
                    setShowResults(true);
                  } else if (showReport) {
                    setShowReport(true);
                  }
                }}
              />
            </section>
          )}
        </main>
      </div>
    </>
  );
} 