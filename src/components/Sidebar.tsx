import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

interface SidebarProps {
  // Navigation states
  showResults: boolean;
  showReport: boolean;
  showDataCollection: boolean;
  showAnnexureK: boolean;
  showSBOM: boolean;
  showOnlyParameterReport?: boolean;
  
  // Navigation handlers
  onCalculate: () => void;
  onReset: () => void;
  onViewReport: () => void;
  onViewParameterReport?: () => void;
  onShowDataCollection: () => void;
  onShowAnnexureK: () => void;
  onShowSBOM: () => void;
  onExportMarkdown: () => void;
  onExportPdf: () => void;
  onExportCsv: () => void;
  onExportCompactSebiReport: () => void;
  onExportAnnexureK: () => void;
  onExportSBOM?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  showResults,
  showReport,
  showDataCollection,
  showAnnexureK,
  showSBOM,
  showOnlyParameterReport = false,
  onCalculate,
  onReset,
  onViewReport,
  onViewParameterReport,
  onShowDataCollection,
  onShowAnnexureK,
  onShowSBOM,
  onExportMarkdown,
  onExportPdf,
  onExportCsv,
  onExportCompactSebiReport,
  onExportAnnexureK,
  onExportSBOM = () => { toast.success('SBOM Export functionality will be available in the next update'); }
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Helper function to handle export button clicks when they should be disabled
  const handleDisabledExport = (e: React.MouseEvent, buttonName: string) => {
    e.preventDefault();
    toast.error('Please fill in the details to export forms');
    console.log(`${buttonName} button clicked but export not available`);
  };
  
  return (
    <>
      {/* Mobile toggle button - visible only on small screens */}
      <button 
        className="md:hidden fixed top-4 left-4 z-50 bg-black text-white p-2 rounded-md shadow-md"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </button>
      
      <div className={`bg-gray-100 w-64 h-screen fixed left-0 top-0 overflow-y-auto shadow-md transition-transform duration-300 ease-in-out z-40 ${isCollapsed ? '-translate-x-full' : 'translate-x-0'} md:translate-x-0`}>
        <div className="p-4 bg-black text-white font-bold text-lg flex justify-between items-center">
          <span>CCI Calculator</span>
          <button 
            className="hidden md:block"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            )}
          </button>
        </div>
        
        {/* Detailed Data Collection */}
        <div className="p-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">CCI Calculator</h3>
          <div className="space-y-2">
            <button
              onClick={() => {
                // Go back to the main calculator page
                onReset();
              }}
              className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-200 flex items-center ${!showResults && !showReport && !showDataCollection && !showAnnexureK && !showSBOM && !showOnlyParameterReport ? 'bg-gray-200 font-medium' : ''}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              CCI Calculator
            </button>
            <button
              onClick={onShowDataCollection}
              className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-200 flex items-center ${showDataCollection ? 'bg-gray-200 font-medium' : ''}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              CCI Detailed Calculator
            </button>
          </div>
        </div>
        
        {/* Annexure K */}
        <div className="p-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Annexure K Document</h3>
          <div className="space-y-2">
            <button
              onClick={onShowAnnexureK}
              className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-200 flex items-center ${showAnnexureK ? 'bg-gray-200 font-medium' : ''}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Annexure-K Form
            </button>
          </div>
        </div>
        
        {/* SBOM Management */}
        <div className="p-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">SBOM Management</h3>
          <div className="space-y-2">
            <button
              onClick={onShowSBOM}
              className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-200 flex items-center ${showSBOM ? 'bg-gray-200 font-medium' : ''}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              SBOM Registry
            </button>
          </div>
        </div>
        
        {/* Analysis & Reporting */}
        <div className="p-4 border-t border-gray-200">
          <h3 
            className="text-sm font-medium text-gray-500 mb-2 flex items-center cursor-help" 
            title="Only use after filling in all the details to access this functionality"
          >
            Analysis & Reporting
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </h3>
          
          {/* Notice banner for filling in details */}
          <div className={`bg-amber-50 border-l-4 border-amber-400 p-2 mb-3 rounded-r text-xs text-amber-700 ${(showResults || showReport || showOnlyParameterReport) ? 'hidden' : 'block'}`}>
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>Please fill in details first to enable export functionality</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <button
              onClick={onViewReport}
              className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-200 flex items-center ${showReport ? 'bg-gray-200 font-medium' : ''} ${!showResults && !showReport ? 'opacity-50 line-through' : ''}`}
              disabled={!showResults && !showReport}
              title={!showResults && !showReport ? "Calculate CCI first to view report" : ""}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              View Detailed Report
            </button>
            <button
              onClick={(e) => {
                if (!showResults && !showReport && !showOnlyParameterReport) {
                  handleDisabledExport(e, 'Export as Markdown');
                } else {
                  onExportMarkdown();
                }
              }}
              className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-200 flex items-center ${!showResults && !showReport && !showOnlyParameterReport ? 'opacity-50 line-through' : ''}`}
              disabled={!showResults && !showReport && !showOnlyParameterReport}
              title={!showResults && !showReport && !showOnlyParameterReport ? "Calculate CCI first to export" : ""}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Export as Markdown Full SEBI Report
            </button>
            <button
              onClick={(e) => {
                if (!showResults && !showReport && !showOnlyParameterReport) {
                  handleDisabledExport(e, 'Parameter-Only Report');
                } else {
                  onExportCompactSebiReport();
                }
              }}
              className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-200 flex items-center ${!showResults && !showReport && !showOnlyParameterReport ? 'opacity-50 line-through' : ''}`}
              disabled={!showResults && !showReport && !showOnlyParameterReport}
              title={!showResults && !showReport && !showOnlyParameterReport ? "Calculate CCI first to export" : ""}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Parameter-Only Report
            </button>
            <button
              onClick={(e) => {
                if (!showAnnexureK) {
                  handleDisabledExport(e, 'Export Annexure K');
                } else {
                  onExportAnnexureK();
                }
              }}
              className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-200 flex items-center ${!showAnnexureK ? 'opacity-50 line-through' : ''}`}
              disabled={!showAnnexureK}
              title={!showAnnexureK ? "Go to Annexure K form first" : ""}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Annexure K
            </button>
            <button
              onClick={(e) => {
                if (!showSBOM) {
                  handleDisabledExport(e, 'Export SBOM');
                } else {
                  onExportSBOM();
                }
              }}
              className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-200 flex items-center ${!showSBOM ? 'opacity-50 line-through' : ''}`}
              disabled={!showSBOM}
              title={!showSBOM ? "Complete SBOM form first" : ""}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Export SBOM
            </button>
            <button
              onClick={(e) => {
                if (!showResults && !showReport && !showOnlyParameterReport) {
                  handleDisabledExport(e, 'Export Data (CSV)');
                } else {
                  onExportCsv();
                }
              }}
              className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-200 flex items-center ${!showResults && !showReport && !showOnlyParameterReport ? 'opacity-50 line-through' : ''}`}
              disabled={!showResults && !showReport && !showOnlyParameterReport}
              title={!showResults && !showReport && !showOnlyParameterReport ? "Calculate CCI first to export" : ""}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Export Data (CSV)
            </button>
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onReset}
            className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-200 flex items-center text-red-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset All Values
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar; 