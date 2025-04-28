import React, { useState } from 'react';
import { CCIResult, CCIParameter } from '../app/types';
import { calculateParameterScore, calculateWeightedScore } from '../app/utils/cciCalculator';
import { exportToMarkdown } from '../app/utils/exportUtils';

interface CCIReportProps {
  result: CCIResult;
  parameters: CCIParameter[];
  onExportMarkdown?: () => void;
}

const CCIReport: React.FC<CCIReportProps> = ({ result, parameters, onExportMarkdown }) => {
  // Add state for tracking export status
  const [isExportingMD, setIsExportingMD] = useState<boolean>(false);
  
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
      
      // Schedule state reset after a short delay
      setTimeout(() => {
        setIsExportingMD(false);
        clearTimeout(timeout);
        console.log('Markdown export process completed');
      }, 2000);
    } catch (error) {
      console.error('Error during Markdown export:', error);
      setIsExportingMD(false);
      clearTimeout(timeout);
    }
  };

  return (
    <div id="report" className="bg-white rounded-xl shadow-md overflow-hidden animate-scaleIn print:shadow-none print:p-0">
      <div className="p-6 bg-black border-b print:hidden">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">Detailed SEBI CSCRF Compliance Report</h2>
          <div className="flex space-x-3">
            <button 
              id="export-markdown-btn"
              onClick={handleExportMarkdown}
              disabled={isExportingMD}
              className={`${isExportingMD ? 'bg-gray-300 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200'} text-black py-2 px-4 rounded-md transition duration-200 flex items-center`}
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
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm11 1H6v8l4-2 4 2V6z" clipRule="evenodd" />
                  </svg>
                  Export as Markdown
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Report Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-black">SEBI Cyber Security and Cyber Resilience Framework</h1>
          <h2 className="text-xl mt-1 text-gray-800">Compliance Assessment Report</h2>
          <p className="mt-2 text-gray-600">Prepared for: {result.organization}</p>
          <p className="text-gray-600">Assessment Date: {formatDate(result.date)}</p>
        </div>

        {/* Executive Summary Section */}
        <div className="mb-8 print:break-after-page">
          <h3 className="text-lg font-semibold text-black border-b border-gray-300 pb-2 mb-4">Executive Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Overall CCI Score</h4>
              <p className="text-2xl font-bold text-black">{result.totalScore.toFixed(2)}/100</p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-black"
                  style={{ width: `${result.totalScore}%` }}
                ></div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Maturity Level</h4>
              <p className="text-xl font-bold text-black">{result.maturityLevel}</p>
              <p className="text-xs text-gray-500 mt-1">{result.maturityDescription}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
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
          
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
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
            <div className="flex items-center justify-center py-2 bg-black text-white text-sm font-medium px-4 mt-4 rounded">
              <span>Compliance Deadline: June 30, 2025</span>
            </div>
          </div>
        </div>

        {/* Category Analysis Section */}
        <div className="mb-8 print:break-after-page">
          <h3 className="text-lg font-semibold text-black border-b border-gray-300 pb-2 mb-4">Category Analysis</h3>
          
          <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
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
              {mainCategoryScores.map((category, idx) => (
                <React.Fragment key={idx}>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{category.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.score.toFixed(1)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.maturityLevel}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.score >= 60 ? 'Low' : 'High'}</td>
                  </tr>
                </React.Fragment>
              ))}
            </table>
          </div>
        </div>

        {/* Category Maturity Dashboard */}
        <div className="mb-8 bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 bg-gray-50 border-b">
            <h3 className="text-xl font-semibold">Category Maturity Classification</h3>
            <p className="text-sm text-gray-600">Detailed breakdown of maturity levels by security domain</p>
          </div>
          
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mainCategoryScores.map((category, idx) => (
              <div key={idx} className={`p-4 rounded-lg ${getScoreBgColor(category.score)} border border-gray-200`}>
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
                      className={category.color} 
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
            <h3 className="text-xl font-semibold mb-4 bg-gray-100 p-3 rounded flex justify-between items-center">
              <span>{category}</span>
              <span className={`text-sm px-3 py-1 rounded-full bg-gray-200 ${getScoreColor(categoryScores[categoryIndex].score)}`}>
                Score: {categoryScores[categoryIndex].score.toFixed(1)} - {categoryScores[categoryIndex].maturityLevel}
              </span>
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

        <div className="mt-10 bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Notes & Observations</h3>
          <div className="text-gray-700 space-y-2">
            <p>This report provides a snapshot of the organization's cyber capability maturity based on the assessment date shown above.</p>
            <p>The CCI is calculated based on the 23 parameters across various domains as specified in the SEBI CSCRF guidelines.</p>
            <p>For areas with lower scores, consider developing action plans to enhance controls and improve overall cyber resilience.</p>
            <div className="mt-4 p-3 bg-gray-100 rounded-lg text-gray-800 text-sm">
              <p className="font-medium mb-1">Maturity Level Classification:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><span className="font-medium">Exceptional (91-100):</span> Leading-edge security posture with advanced capabilities</li>
                <li><span className="font-medium">Optimal (81-90):</span> Robust security program with well-integrated controls</li>
                <li><span className="font-medium">Manageable (71-80):</span> Established security program with consistent implementation</li>
                <li><span className="font-medium">Developing (61-70):</span> Basic security controls with some gaps in implementation</li>
                <li><span className="font-medium">Bare Minimum (51-60):</span> Minimal security controls meeting basic requirements</li>
                <li><span className="font-medium">Insufficient (0-50):</span> Inadequate security controls requiring significant improvements</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CCIReport; 