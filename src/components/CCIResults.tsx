import React from 'react';
import { CCIResult, maturityLevels } from '../app/types';
import CreatorFooter from './CreatorFooter';

export interface CCIResultsProps {
  result: CCIResult;
  onViewReport: () => void;
  onViewParameterReport?: () => void;
  onReset: () => void;
  onShowAnnexureK: () => void;
}

interface CategoryScore {
  name: string;
  score: number;
}

interface ImprovementArea {
  measureId: string;
  title: string;
  score: number;
  impact: number;
}

const CCIResults: React.FC<CCIResultsProps> = ({ 
  result, 
  onViewReport, 
  onViewParameterReport, 
  onReset, 
  onShowAnnexureK 
}) => {
  const { totalScore, maturityLevel } = result;
  
  // Determine progress bar color and width based on score
  const getProgressBarStyles = () => {
    if (totalScore >= 80) {
      return {
        width: `${totalScore}%`,
        backgroundColor: '#000000', // Black for optimal
      };
    } else if (totalScore >= 70) {
      return {
        width: `${totalScore}%`,
        backgroundColor: '#374151', // Dark gray for manageable
      };
    } else if (totalScore >= 60) {
      return {
        width: `${totalScore}%`,
        backgroundColor: '#6B7280', // Medium gray for developing
      };
    } else {
      return {
        width: `${totalScore}%`,
        backgroundColor: '#9CA3AF', // Light gray for vulnerable
      };
    }
  };

  const progressBarStyles = getProgressBarStyles();
  
  // Helper functions for score categories and color
  const getScoreCategory = (score: number): string => {
    const level = maturityLevels.find(level => score >= level.min && score <= level.max);
    return level ? level.level : 'Undetermined';
  };
  
  const getCategoryBadgeColor = (score: number): string => {
    if (score >= 80) return 'bg-black text-white';
    if (score >= 60) return 'bg-gray-800 text-white';
    if (score >= 40) return 'bg-gray-600 text-white';
    return 'bg-gray-500 text-white';
  };

  // Format date as DD-MM-YYYY
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  return (
    <div className="animate-fadeIn">
      <div className="bg-black text-white p-6 rounded-t-xl shadow-md relative">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15),transparent_70%)]"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2">Results Analysis</h2>
          <p className="text-gray-300">Your organization&apos;s Cyber Capability Index assessment results</p>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-b-xl shadow-md mb-8">
        <div className="mb-8">
          <div className="flex flex-col items-center sm:flex-row sm:justify-between mb-6">
            <div className="mb-4 sm:mb-0">
              <h3 className="text-lg font-semibold">Cyber Capability Index (CCI)</h3>
              <p className="text-sm text-gray-600">Based on SEBI CSCRF standards</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={onReset}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-300 text-sm flex items-center"
              >
                <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                Reset
              </button>
              {onViewParameterReport && (
                <button
                  onClick={onViewParameterReport}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-300 text-sm flex items-center"
                >
                  <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Parameter Report
                </button>
              )}
              <button
                onClick={onViewReport}
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors duration-300 text-sm flex items-center"
              >
                <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Full Report
              </button>
            </div>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 transition-all duration-300 hover:shadow-md hover:border-black">
            <div className="flex justify-between mb-2">
              <span className="font-medium">Overall Score:</span>
              <span className="font-bold">{totalScore.toFixed(2)}</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div 
                className="h-2.5 rounded-full transition-all duration-1000 ease-in-out" 
                style={progressBarStyles}
              ></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Maturity Level:</div>
                <div className="font-semibold">{maturityLevel}</div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600 mb-1">Assessment Date:</div>
                <div className="font-semibold">{new Date().toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Maturity Level Descriptions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {maturityLevels.map((level, index) => (
              <div 
                key={index}
                className={`p-4 border rounded-md transition-all duration-300 hover:shadow-md ${
                  level.level === maturityLevel 
                    ? 'border-black bg-gray-50' 
                    : 'border-gray-200 hover:border-black'
                }`}
              >
                <div className="font-medium">{level.level}</div>
                <div className="text-sm text-gray-600 mt-1">{level.min} - {level.max}</div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-4">Regulatory Compliance Options</h3>
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 transition-all duration-300 hover:shadow-md hover:border-black">
            <div className="mb-4">
              <p className="text-gray-700">As per the SEBI CSCRF Annexure-K, you need to submit the following information:</p>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between">
              <div className="mb-4 sm:mb-0">
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Entity Type and Category</li>
                  <li>• Rationale for Selected Threshold</li>
                  <li>• Reporting Period</li>
                  <li>• CCI Score and Maturity Level</li>
                </ul>
              </div>
              
              <button
                onClick={onShowAnnexureK}
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors duration-300 text-sm flex items-center"
              >
                <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Go to Annexure-K
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <CreatorFooter />
    </div>
  );
};

export default CCIResults; 