import React, { useState } from 'react';
import { CCIResult, CCIParameter, AnnexureKData } from '../app/types';
import { calculateParameterScore, calculateWeightedScore } from '../app/utils/cciCalculator';
import { exportToMarkdown } from '../app/utils/exportUtils';

interface CCIReportProps {
  result: CCIResult;
  parameters: CCIParameter[];
  annexureKData?: AnnexureKData;
  onExportMarkdown?: () => void;
  onExportPdf?: () => void;
  onExportCsv?: () => void;
  onExportCompactSebiReport?: () => void;
  onExportAnnexureK?: () => Promise<void>;
  onReset?: () => void;
  isExporting?: boolean;
}

const CCIReport: React.FC<CCIReportProps> = ({ 
  result, 
  parameters, 
  annexureKData, 
  onExportMarkdown, 
  onExportPdf,
  onExportCsv,
  onExportCompactSebiReport,
  onExportAnnexureK,
  onReset, 
  isExporting = false 
}) => {
  // Add state for tracking export status
  const [isExportingMD, setIsExportingMD] = useState<boolean>(isExporting);
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);
  const [isExportingCSV, setIsExportingCSV] = useState<boolean>(false);
  const [isExportingCompactSebi, setIsExportingCompactSebi] = useState<boolean>(false);
  const [isExportingAnnexureK, setIsExportingAnnexureK] = useState<boolean>(false);
  
  // Helper function to get the color for a score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-black font-semibold';
    if (score >= 60) return 'text-gray-800';
    if (score >= 40) return 'text-gray-700';
    return 'text-gray-600';
  };
  
  // Helper function to get the background color for a score
  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-gray-200';
    if (score >= 60) return 'bg-gray-100';
    if (score >= 40) return 'bg-gray-50';
    return 'bg-white';
  };
  
  // Get maturity level for a specific score
  const getMaturityLevelForScore = (score: number) => {
    if (score >= 91) return 'Exceptional';
    if (score >= 81) return 'Optimal';
    if (score >= 71) return 'Manageable';
    if (score >= 61) return 'Developing';
    if (score >= 51) return 'Bare Minimum';
    return 'Insufficient';
  };
  
  // Group parameters by their category (if available)
  const parametersByCategory: { [key: string]: CCIParameter[] } = {};
  parameters.forEach(param => {
    const category = param.frameworkCategory || 'Uncategorized';
    if (!parametersByCategory[category]) {
      parametersByCategory[category] = [];
    }
    parametersByCategory[category].push(param);
  });
  
  // Define the standard NIST CSF categories and their display order
  const categoryOrder = [
    'Governance: Roles and Responsibilities',
    'Identify: Risk Assessment',
    'Identify: Asset Management',
    'Protect: Identity Management, Authentication, and Access Control',
    'Protect: Awareness and Training',
    'Protect: Data Security',
    'Protect: Information Protection',
    'Detect: Continuous Monitoring',
    'Detect: Detection Processes',
    'Respond: Response Planning',
    'Respond: Communications',
    'Respond: Analysis and Mitigation',
    'Recover: Recovery Planning',
    'Recover: Improvements',
    'Uncategorized'
  ];
  
  // Sort categories according to the predefined order
  const sortedCategories = Object.keys(parametersByCategory).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    
    // If category not found in the order list, put it at the end
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    
    return indexA - indexB;
  });
  
  // Get friendly name for category (extract main part)
  const getCategoryName = (category: string) => {
    const parts = category.split(':');
    if (parts.length > 1) {
      return parts[0].trim();
    }
    return category;
  };
  
  // Get category subcategory
  const getCategorySubname = (category: string) => {
    const parts = category.split(':');
    if (parts.length > 1) {
      return parts[1].trim();
    }
    return '';
  };
  
  // Calculate category scores
  const categoryScores = sortedCategories.map(category => {
    const params = parametersByCategory[category];
    const totalWeightage = params.reduce((sum, param) => sum + param.weightage, 0);
    const weightedSum = params.reduce((sum, param) => {
      return sum + calculateWeightedScore(param);
    }, 0);
    
    const categoryScore = totalWeightage > 0 ? (weightedSum / totalWeightage) * 100 : 0;
    
    return {
      category,
      mainCategory: getCategoryName(category),
      subCategory: getCategorySubname(category),
      score: categoryScore,
      weightedScore: weightedSum,
      totalWeightage,
      maturityLevel: getMaturityLevelForScore(categoryScore),
      color: categoryScore >= 80 ? 'bg-gray-900' : 
             categoryScore >= 60 ? 'bg-gray-800' : 
             categoryScore >= 40 ? 'bg-gray-700' : 'bg-gray-600'
    };
  });
  
  // Group category scores by main category for the dashboard
  const scoresByMainCategory: { [key: string]: number } = {};
  const weightageByMainCategory: { [key: string]: number } = {};
  
  categoryScores.forEach(categoryScore => {
    const mainCategory = getCategoryName(categoryScore.category);
    if (!scoresByMainCategory[mainCategory]) {
      scoresByMainCategory[mainCategory] = 0;
      weightageByMainCategory[mainCategory] = 0;
    }
    scoresByMainCategory[mainCategory] += categoryScore.weightedScore;
    weightageByMainCategory[mainCategory] += categoryScore.totalWeightage;
  });
  
  // Calculate main category aggregate scores
  const mainCategoryScores = Object.keys(scoresByMainCategory).map(category => {
    const totalWeight = weightageByMainCategory[category];
    const totalScore = scoresByMainCategory[category];
    const score = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
    
    return {
      category,
      score,
      maturityLevel: getMaturityLevelForScore(score),
      color: score >= 80 ? 'bg-gray-900' : 
             score >= 60 ? 'bg-gray-800' : 
             score >= 40 ? 'bg-gray-700' : 'bg-gray-600'
    };
  }).sort((a, b) => {
    const indexA = ['Governance', 'Identify', 'Protect', 'Detect', 'Respond', 'Recover'].indexOf(a.category);
    const indexB = ['Governance', 'Identify', 'Protect', 'Detect', 'Respond', 'Recover'].indexOf(b.category);
    return indexA - indexB;
  });

  // Format date function
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  // Add handleExportMarkdown function
  const handleExportMarkdown = () => {
    if (!onExportMarkdown) {
      console.log('Export Markdown function not provided');
      alert('Markdown export function not available');
      return;
    }
    
    // Log export attempt with details
    console.log('Export as Markdown button clicked');
    console.log(`Exporting report for: ${result.organization}`);
    
    // Set loading state
    setIsExportingMD(true);
    
    // Add a timeout to reset if export doesn't complete
    const timeout = setTimeout(() => {
      if (isExportingMD) {
        setIsExportingMD(false);
        console.error('Markdown export timeout - reset UI state');
      }
    }, 30000); // 30 second timeout
    
    try {
      // Execute the export function
      onExportMarkdown();
      
      // Clear the timeout since we handled it
      clearTimeout(timeout);
      
      // Reset state after a short delay to show success
      setTimeout(() => {
        setIsExportingMD(false);
      }, 2000);
    } catch (e) {
      console.error('Error executing export function:', e);
      setIsExportingMD(false);
      clearTimeout(timeout);
    }
  };

  // Add handleExportPdf function
  const handleExportPdf = () => {
    if (!onExportPdf) {
      console.log('Export PDF function not provided');
      alert('PDF export function not available');
      return;
    }
    
    // Log export attempt with details
    console.log('Export as PDF button clicked');
    console.log(`Exporting PDF report for: ${result.organization}`);
    
    // Set loading state
    setIsExportingPDF(true);
    
    // Add a timeout to reset if export doesn't complete
    const timeout = setTimeout(() => {
      if (isExportingPDF) {
        setIsExportingPDF(false);
        console.error('PDF export timeout - reset UI state');
      }
    }, 30000); // 30 second timeout
    
    try {
      // Execute the export function
      onExportPdf();
      
      // Clear the timeout since we handled it
      clearTimeout(timeout);
      
      // Reset state after a short delay to show success
      setTimeout(() => {
        setIsExportingPDF(false);
      }, 2000);
    } catch (e) {
      console.error('Error executing PDF export function:', e);
      setIsExportingPDF(false);
      clearTimeout(timeout);
    }
  };

  // Add handleExportCsv function
  const handleExportCsv = () => {
    if (!onExportCsv) {
      console.log('Export CSV function not provided');
      alert('CSV export function not available');
      return;
    }
    
    // Log export attempt with details
    console.log('Export as CSV button clicked');
    console.log(`Exporting CSV data for: ${result.organization}`);
    
    // Set loading state
    setIsExportingCSV(true);
    
    // Add a timeout to reset if export doesn't complete
    const timeout = setTimeout(() => {
      if (isExportingCSV) {
        setIsExportingCSV(false);
        console.error('CSV export timeout - reset UI state');
      }
    }, 30000); // 30 second timeout
    
    try {
      // Execute the export function
      onExportCsv();
      
      // Clear the timeout since we handled it
      clearTimeout(timeout);
      
      // Reset state after a short delay to show success
      setTimeout(() => {
        setIsExportingCSV(false);
      }, 2000);
    } catch (e) {
      console.error('Error executing CSV export function:', e);
      setIsExportingCSV(false);
      clearTimeout(timeout);
    }
  };

  // Add handleExportCompactSebiReport function
  const handleExportCompactSebiReport = () => {
    if (!onExportCompactSebiReport) {
      console.log('Export Parameters-Only SEBI Report function not provided');
      alert('Parameters-Only SEBI Report export function not available');
      return;
    }
    
    // Log export attempt with details
    console.log('Export Parameters-Only SEBI Report button clicked');
    console.log(`Exporting Parameters-Only SEBI Report for: ${result.organization}`);
    
    // Set loading state
    setIsExportingCompactSebi(true);
    
    // Add a timeout to reset if export doesn't complete
    const timeout = setTimeout(() => {
      if (isExportingCompactSebi) {
        setIsExportingCompactSebi(false);
        console.error('Parameters-Only SEBI Report export timeout - reset UI state');
      }
    }, 30000); // 30 second timeout
    
    try {
      // Execute the export function
      onExportCompactSebiReport();
      
      // Clear the timeout since we handled it
      clearTimeout(timeout);
      
      // Reset state after a short delay to show success
      setTimeout(() => {
        setIsExportingCompactSebi(false);
      }, 2000);
    } catch (e) {
      console.error('Error executing Parameters-Only SEBI Report export function:', e);
      setIsExportingCompactSebi(false);
      clearTimeout(timeout);
    }
  };

  // Add handleExportAnnexureK function
  const handleExportAnnexureK = async () => {
    if (!onExportAnnexureK) {
      console.log('Export Annexure K function not provided');
      alert('Annexure K export function not available');
      return;
    }
    
    // Log export attempt with details
    console.log('Export Annexure K button clicked');
    console.log(`Exporting Annexure K for: ${result.organization}`);
    
    // Set loading state
    setIsExportingAnnexureK(true);
    
    // Add a timeout to reset if export doesn't complete
    const timeout = setTimeout(() => {
      if (isExportingAnnexureK) {
        setIsExportingAnnexureK(false);
        console.error('Annexure K export timeout - reset UI state');
      }
    }, 30000); // 30 second timeout
    
    try {
      // Execute the export function
      await onExportAnnexureK();
      
      // Clear the timeout since we handled it
      clearTimeout(timeout);
      
      // Reset state after a short delay to show success
      setTimeout(() => {
        setIsExportingAnnexureK(false);
      }, 2000);
    } catch (e) {
      console.error('Error executing Annexure K export function:', e);
      setIsExportingAnnexureK(false);
      clearTimeout(timeout);
    }
  };

  return (
    <div className="animate-fadeIn">
      {/* Report Header with black futuristic design */}
      <div className="bg-black relative overflow-hidden rounded-t-xl shadow-lg">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15),transparent_70%)]"></div>
        <div className="p-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-white mb-6 md:mb-0">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight animate-fadeInUp">
                SEBI CSCRF <span className="text-gray-300">Report</span>
              </h2>
              <p className="text-gray-300 mt-2 animate-fadeInUp animation-delay-100">
                Cyber Capability Index: {result.totalScore.toFixed(2)} | Maturity Level: {result.maturityLevel}
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center md:justify-end gap-3">
              <button 
                id="export-md-btn"
                onClick={handleExportMarkdown}
                disabled={isExportingMD}
                title="Export this report as Markdown format for easy sharing and version control"
                className="px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-md transition-all duration-300 flex items-center disabled:opacity-70 transform hover:scale-105"
              >
                {isExportingMD ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-800" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Export as Markdown</span>
                  </>
                )}
              </button>
              
              <button 
                id="export-compact-sebi-btn"
                onClick={handleExportCompactSebiReport}
                disabled={isExportingCompactSebi}
                title="Export a SEBI report with only parameter details, excluding the compliance summary (<10 pages)"
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md transition-all duration-300 flex items-center disabled:opacity-70 border border-white/20"
              >
                {isExportingCompactSebi ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Parameters-Only Report</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-white rounded-b-xl shadow-md">
        {/* Report Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-black">SEBI Cyber Security and Cyber Resilience Framework</h1>
          <h2 className="text-xl mt-1 text-gray-800">Compliance Assessment Report</h2>
          <div className="mt-6 mb-2 py-3 px-4 bg-gray-50 border border-gray-200 hover:border-black transition-all duration-300 rounded-lg inline-block mx-auto">
            <p className="text-gray-800 text-xl font-semibold">Organization: {result.organization}</p>
            <p className="mt-2 text-gray-700 text-lg">Assessment Date: {formatDate(result.date)}</p>
          </div>
        </div>

        {/* Executive Summary Section */}
        <div className="mb-8 print:break-after-page">
          <h3 className="text-lg font-semibold text-black border-b border-gray-300 pb-2 mb-4">Executive Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white border border-gray-200 hover:border-black rounded-lg p-4 shadow-sm transition-all duration-300 transform hover:shadow-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Overall CCI Score</h4>
              <p className="text-2xl font-bold text-black">{result.totalScore.toFixed(2)}/100</p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-black transition-all duration-500 ease-in-out"
                  style={{ width: `${result.totalScore}%` }}
                ></div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 hover:border-black rounded-lg p-4 shadow-sm transition-all duration-300 transform hover:shadow-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Maturity Level</h4>
              <p className="text-xl font-bold text-black">{result.maturityLevel}</p>
              <p className="text-xs text-gray-500 mt-1">{result.maturityDescription}</p>
            </div>
            <div className="bg-white border border-gray-200 hover:border-black rounded-lg p-4 shadow-sm transition-all duration-300 transform hover:shadow-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Compliance Status</h4>
              <p className={`text-xl font-bold ${result.totalScore >= 60 ? 'text-black' : 'text-gray-700'}`}>
                {result.totalScore >= 60 ? 'Compliant' : 'Non-Compliant'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {result.totalScore >= 60 
                  ? 'Meets SEBI CSCRF requirements' 
                  : 'Does not meet minimum requirements'}
              </p>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 hover:border-black rounded-lg p-4 shadow-sm transition-all duration-300">
            <h4 className="font-medium text-black mb-2">Assessment Overview</h4>
            <p className="text-gray-700 mb-3">
              This report provides a comprehensive assessment of {result.organization}'s compliance with the Securities and Exchange Board of India (SEBI) Cyber Security and Cyber Resilience Framework (CSCRF). The assessment was conducted on {formatDate(result.date)} using the Cyber Capability Index (CCI) methodology.
            </p>
            <p className="text-gray-700 mb-3">
              {result.totalScore >= 80 ? 
                `${result.organization} demonstrates a strong cybersecurity posture with an overall score of ${result.totalScore.toFixed(2)}. The organization has implemented robust controls across most areas of the framework.` :
              result.totalScore >= 60 ?
                `${result.organization} shows a satisfactory level of compliance with an overall score of ${result.totalScore.toFixed(2)}. While meeting the minimum requirements, there are several areas where improvements would strengthen the cybersecurity posture.` :
                `${result.organization} currently does not meet the minimum compliance requirements with a score of ${result.totalScore.toFixed(2)}. Significant improvements are needed across multiple areas to achieve SEBI CSCRF compliance by the June 30, 2025 deadline.`
              }
            </p>
            <div className="flex items-center justify-center py-2 bg-black text-white text-sm font-medium px-4 mt-4 rounded transform transition-all duration-300 hover:scale-105">
              <span>Compliance Deadline: June 30, 2025</span>
            </div>
          </div>
          
          {/* Markdown Export Info */}
          <div className="mt-4 bg-gray-50 border-l-4 border-black p-4 rounded-r text-sm text-gray-700 transition-all duration-300 hover:shadow-inner">
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="font-semibold mb-1">Export as Markdown</h4>
                <p className="text-gray-600 mb-1">
                  This report can be exported as a Markdown (.md) file using the "Export as Markdown" button at the top of the page.
                </p>
                <p className="text-gray-600">
                  Markdown is a lightweight markup format that's easily readable and can be converted to other formats like PDF or HTML. It's perfect for documentation, GitHub repositories, and sharing with technical teams.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Category Analysis Section */}
        <div className="mb-8 print:break-after-page">
          <h3 className="text-lg font-semibold text-black border-b border-gray-300 pb-2 mb-4">Category Analysis</h3>
          
          <div className="overflow-hidden bg-white border border-gray-200 hover:border-black rounded-lg shadow-sm mb-6 transition-all duration-300">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-black">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Score
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Compliance Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Priority
                  </th>
                </tr>
              </thead>
              {/* Table body with main category data */}
              <tbody>
                {mainCategoryScores.map((category, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{category.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.score.toFixed(1)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.maturityLevel}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.score >= 60 ? 'Low' : 'High'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Maturity Dashboard */}
        <div className="mb-8 bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-200 hover:border-black">
          <div className="p-4 bg-black relative">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.1),transparent_70%)]"></div>
            <h3 className="text-xl font-semibold text-white relative z-10">Category Maturity Classification</h3>
            <p className="text-sm text-gray-300 relative z-10">Detailed breakdown of maturity levels by security domain</p>
          </div>
          
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mainCategoryScores.map((category, idx) => (
              <div key={idx} className={`p-4 rounded-lg ${getScoreBgColor(category.score)} border border-gray-200 hover:border-black transition-all duration-300 hover:shadow-md`}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{category.category}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full bg-gray-200 ${getScoreColor(category.score)}`}>
                    {category.score.toFixed(1)}
                  </span>
                </div>
                <p className="text-xs mb-2">Weightage: {weightageByMainCategory[category.category]}%</p>
                <div className="mt-2">
                  <div className="text-sm font-medium">Maturity: {category.maturityLevel}</div>
                  <div className="w-full bg-white bg-opacity-50 rounded-full h-2 mt-1">
                    <div 
                      className="bg-black transition-all duration-500 ease-in-out" 
                      style={{ width: `${Math.min(100, category.score)}%`, height: '0.5rem' }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Category sections with parameters */}
        {sortedCategories.map((category, categoryIndex) => (
          <div key={categoryIndex} className="mb-8">
            <h3 className="text-xl font-semibold mb-4 bg-gray-50 p-3 rounded-lg flex justify-between items-center border border-gray-200 hover:border-black transition-all duration-300">
              <span>{category}</span>
              <span className={`text-sm px-3 py-1 rounded-full bg-black text-white`}>
                Score: {categoryScores[categoryIndex].score.toFixed(1)} - {categoryScores[categoryIndex].maturityLevel}
              </span>
            </h3>
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:border-black transition-all duration-300">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parameter</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numerator</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Denominator</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weightage</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weighted Score</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {parametersByCategory[category].map((param, paramIndex) => {
                    const score = calculateParameterScore(param);
                    const weightedScore = calculateWeightedScore(param);
                    
                    return (
                      <React.Fragment key={paramIndex}>
                        <tr className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{param.title}</div>
                            <div className="text-xs text-gray-500">{param.measureId}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{param.numerator}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{param.denominator}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{param.weightage}%</td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${getScoreColor(score)}`}>{score.toFixed(2)}</td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${getScoreColor(weightedScore)}`}>{weightedScore.toFixed(2)}</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="text-sm">
                              <p className="font-medium text-gray-700 mb-1">Description:</p>
                              <p className="text-gray-600 mb-2">{param.description}</p>
                              
                              <p className="font-medium text-gray-700 mb-1 mt-3">Control Information:</p>
                              <p className="text-gray-600 mb-2">{param.controlInfo}</p>
                              
                              <p className="font-medium text-gray-700 mb-1 mt-3">Implementation Evidence:</p>
                              <p className="text-gray-600 mb-2">{param.implementationEvidence}</p>
                              
                              {param.standardContext && (
                                <>
                                  <p className="font-medium text-gray-700 mb-1 mt-3">Standard Context:</p>
                                  <p className="text-gray-600 mb-2">{param.standardContext}</p>
                                </>
                              )}
                              
                              {param.bestPractices && (
                                <>
                                  <p className="font-medium text-gray-700 mb-1 mt-3">Best Practices:</p>
                                  <p className="text-gray-600 mb-2">{param.bestPractices}</p>
                                </>
                              )}
                              
                              {param.regulatoryGuidelines && (
                                <>
                                  <p className="font-medium text-gray-700 mb-1 mt-3">Regulatory Guidelines:</p>
                                  <p className="text-gray-600 mb-2">{param.regulatoryGuidelines}</p>
                                </>
                              )}
                              
                              {param.auditorComments && (
                                <>
                                  <p className="font-medium text-gray-700 mb-1 mt-3">Auditor Comments:</p>
                                  <p className="text-gray-600 mb-2">{param.auditorComments}</p>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        <div className="mt-10 bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:border-black transition-all duration-300">
          <h3 className="text-xl font-semibold mb-4">Notes & Observations</h3>
          <div className="text-gray-700 space-y-2">
            <p>This report provides a snapshot of the organization's cyber capability maturity based on the assessment date shown above.</p>
            <p>The CCI is calculated based on the 23 parameters across various domains as specified in the SEBI CSCRF guidelines.</p>
            <p>For areas with lower scores, consider developing action plans to enhance controls and improve overall cyber resilience.</p>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-gray-800 text-sm">
              <p className="font-medium mb-1">Maturity Level Classification:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><span className="font-medium">Exceptional (91-100.99):</span> Leading-edge security posture with advanced capabilities</li>
                <li><span className="font-medium">Optimal (81-90.99):</span> Robust security program with well-integrated controls</li>
                <li><span className="font-medium">Manageable (71-80.99):</span> Established security program with consistent implementation</li>
                <li><span className="font-medium">Developing (61-70.99):</span> Basic security controls with some gaps in implementation</li>
                <li><span className="font-medium">Bare Minimum (51-60.99):</span> Minimal security controls meeting basic requirements</li>
                <li><span className="font-medium">Insufficient (0-50.99):</span> Inadequate security controls requiring significant improvements</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {onReset && (
            <button
              onClick={onReset}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-all duration-300 flex items-center transform hover:scale-105"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Back to Calculator
            </button>
          )}
          
          <button
            onClick={handleExportMarkdown}
            disabled={isExportingMD}
            className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-md transition-all duration-300 flex items-center disabled:opacity-70 transform hover:scale-105"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            {isExportingMD ? 'Generating Markdown...' : 'Export as Markdown'}
          </button>
          
          <button
            onClick={handleExportPdf}
            disabled={isExportingPDF}
            className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-md transition-all duration-300 flex items-center disabled:opacity-70 transform hover:scale-105"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
            </svg>
            {isExportingPDF ? 'Generating PDF...' : 'Full SEBI Report (PDF)'}
          </button>
          
          <button
            onClick={handleExportCsv}
            disabled={isExportingCSV}
            className="px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-md transition-all duration-300 flex items-center disabled:opacity-70 border border-gray-300 transform hover:scale-105"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            {isExportingCSV ? 'Generating CSV...' : 'Export Data (CSV)'}
          </button>
          
          {onExportAnnexureK && (
            <button
              onClick={handleExportAnnexureK}
              disabled={isExportingAnnexureK}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-black rounded-md transition-all duration-300 flex items-center disabled:opacity-70 border border-gray-300 transform hover:scale-105"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                <path d="M8 11a1 1 0 100 2h4a1 1 0 100-2H8z" />
                <path d="M8 7a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
              </svg>
              {isExportingAnnexureK ? 'Generating Annexure K...' : 'Export Annexure K'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CCIReport; 