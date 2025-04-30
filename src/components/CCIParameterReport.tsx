import React, { useState } from 'react';
import { CCIResult, CCIParameter } from '../app/types';
import { calculateParameterScore, calculateWeightedScore } from '../app/utils/cciCalculator';

interface CCIParameterReportProps {
  result: CCIResult;
  parameters: CCIParameter[];
  onReset?: () => void;
  onExportMarkdown?: () => void;
  onExportPdf?: () => void;
  onExportCsv?: () => void;
}

const CCIParameterReport: React.FC<CCIParameterReportProps> = ({ 
  result, 
  parameters, 
  onReset,
  onExportMarkdown,
  onExportPdf,
  onExportCsv
}) => {
  const [isExportingMD, setIsExportingMD] = useState<boolean>(false);
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);
  const [isExportingCSV, setIsExportingCSV] = useState<boolean>(false);
  
  // Helper function to get the color for a score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-black font-semibold';
    if (score >= 60) return 'text-gray-800';
    if (score >= 40) return 'text-gray-700';
    return 'text-gray-600';
  };
  
  // Format date function
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
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

  // Add handleExportMarkdown function
  const handleExportMarkdown = () => {
    if (!onExportMarkdown) {
      console.log('Export Markdown function not provided');
      return;
    }
    
    // Set loading state
    setIsExportingMD(true);
    
    try {
      // Execute the export function
      onExportMarkdown();
      
      // Reset state after a short delay to show success
      setTimeout(() => {
        setIsExportingMD(false);
      }, 2000);
    } catch (e) {
      console.error('Error executing export function:', e);
      setIsExportingMD(false);
    }
  };

  // Add handleExportPdf function
  const handleExportPdf = () => {
    if (!onExportPdf) {
      console.log('Export PDF function not provided');
      return;
    }
    
    // Set loading state
    setIsExportingPDF(true);
    
    try {
      // Execute the export function
      onExportPdf();
      
      // Reset state after a short delay to show success
      setTimeout(() => {
        setIsExportingPDF(false);
      }, 2000);
    } catch (e) {
      console.error('Error executing PDF export function:', e);
      setIsExportingPDF(false);
    }
  };

  // Add handleExportCsv function
  const handleExportCsv = () => {
    if (!onExportCsv) {
      console.log('Export CSV function not provided');
      return;
    }
    
    // Set loading state
    setIsExportingCSV(true);
    
    try {
      // Execute the export function
      onExportCsv();
      
      // Reset state after a short delay to show success
      setTimeout(() => {
        setIsExportingCSV(false);
      }, 2000);
    } catch (e) {
      console.error('Error executing CSV export function:', e);
      setIsExportingCSV(false);
    }
  };

  return (
    <div id="parameter-report" className="bg-white rounded-xl shadow-md overflow-hidden animate-scaleIn print:shadow-none print:p-0">
      <div className="p-6 bg-black border-b print:hidden">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">Comprehensive Parameter Report</h2>
          <div className="flex space-x-3">
            <button 
              onClick={handleExportMarkdown}
              disabled={isExportingMD}
              title="Export this report as Markdown format for easy sharing and version control"
              className={`${isExportingMD ? 'bg-gray-400 cursor-not-allowed' : 'cci-btn-outline'}`}
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
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Report Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-black">SEBI CSCRF Parameter Report</h1>
          <h2 className="text-xl mt-1 text-gray-800">Comprehensive Parameter Assessment</h2>
          <div className="mt-6 mb-2 py-3 px-4 bg-gray-50 border border-gray-200 rounded-lg inline-block mx-auto">
            <p className="text-gray-800 text-xl font-semibold">Organization: {result.organization}</p>
            <p className="mt-2 text-gray-700 text-lg">Assessment Date: {formatDate(result.date)}</p>
          </div>
        </div>

        {/* Category sections with parameters */}
        {sortedCategories.map((category, categoryIndex) => (
          <div key={categoryIndex} className="mb-8">
            <h3 className="text-xl font-semibold mb-4 bg-gray-100 p-3 rounded flex justify-between items-center">
              <span>{category}</span>
            </h3>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
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
                        <tr>
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
        
        <div className="mt-8 flex justify-center space-x-4">
          {onReset && (
            <button
              onClick={onReset}
              className="bg-gray-200 hover:bg-gray-300 text-black py-2 px-6 rounded-md transition duration-200 flex items-center"
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
            className="cci-btn-primary disabled:opacity-70"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            {isExportingMD ? 'Generating Markdown...' : 'Export as Markdown'}
          </button>
          
          <button
            onClick={handleExportPdf}
            disabled={isExportingPDF}
            className="cci-btn-danger disabled:opacity-70"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
            </svg>
            {isExportingPDF ? 'Generating PDF...' : 'Compact SEBI Report (<10 pages)'}
          </button>
          
          <button
            onClick={handleExportCsv}
            disabled={isExportingCSV}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition duration-200 flex items-center disabled:opacity-70"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            {isExportingCSV ? 'Generating CSV...' : 'Export Data (CSV)'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CCIParameterReport; 