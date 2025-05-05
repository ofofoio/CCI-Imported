import React from 'react';

export const SEBICSCRFIntroduction: React.FC = () => {
  return (
    <div className="sebi-cscrf-container">
      <h2 className="text-2xl font-bold mb-4">Introduction to SEBI CSCRF</h2>
      <p className="mb-4">
        The SEBI CSCRF framework, established under <a href="https://www.sebi.gov.in/legal/circulars/aug-2024/cybersecurity-and-cyber-resilience-framework-cscrf-for-sebi-regulated-entities-res-_85964.html" className="text-blue-600 hover:underline">SEBI Circular SEBI/HO/ITD-1/ITD_CSC_EXT/P/CIR/2024/113</a>, 
        mandates cybersecurity requirements for market intermediaries including stock brokers, depository participants, mutual funds, and other regulated entities in the Indian financial markets.
      </p>
      <p className="mb-6">
        The framework aims to enhance the cyber resilience of India's financial ecosystem by establishing minimum baseline security requirements while promoting a risk-based approach to cybersecurity.
      </p>
      
      {/* Latest Update - April 30, 2025 Circular Information */}
      <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-500 p-4">
        <h3 className="text-lg font-semibold mb-2">Latest Update: SEBI Circular (April 30, 2025)</h3>
        <p className="mb-2">
          SEBI has issued revised classifications for Regulated Entities (REs) under the CSCRF framework via circular 
          <a href="https://www.sebi.gov.in/legal/circulars/apr-2025/clarifications-to-cybersecurity-and-cyber-resilience-framework-cscrf-for-sebi-regulated-entities-res-_93734.html" className="text-blue-600 hover:underline ml-1" target="_blank" rel="noopener noreferrer">SEBI/HO/ITD-1/ITD_CSC_EXT/P/CIR/2025/60</a> dated April 30, 2025.
        </p>
        <p>
          The circular revises thresholds and categorization criteria, with entity categories determined at the beginning of each 
          financial year based on the previous year's data. Once decided, entities remain in the same category throughout the
          financial year regardless of parameter changes.
        </p>
      </div>

      <h2 className="text-2xl font-bold mb-4">Cyber Capability Index (CCI) for Qualified REs and MIIs</h2>
      <p className="mb-4">
        The Cyber Capability Index (CCI) is a quantitative methodology for assessing cybersecurity maturity specifically designed for 
        Qualified Regulated Entities (REs) and Market Infrastructure Institutions (MIIs) under SEBI's regulatory purview. The CCI framework 
        translates SEBI CSCRF requirements into 23 measurable parameters with specific weightages to provide a standardized assessment approach.
      </p>

      {/* Entity Classification Section - 2025 Update */}
      <div className="mb-6 bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
        <h3 className="text-xl font-semibold mb-3">Entity Classification Under SEBI CSCRF (2025 Update)</h3>
        
        <div className="mb-4">
          <h4 className="font-medium text-md mb-2">Entity Classification Categories:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded shadow-sm">
              <h5 className="font-semibold text-sm mb-1 text-indigo-800">Qualified REs</h5>
              <p className="text-xs">Highest compliance requirements including dedicated HSM, M-SOC services, and comprehensive SBOM management</p>
            </div>
            <div className="bg-gray-50 p-3 rounded shadow-sm">
              <h5 className="font-semibold text-sm mb-1 text-indigo-800">Mid-size REs</h5>
              <p className="text-xs">Moderate compliance requirements with shared HSM options and simplified vulnerability management</p>
            </div>
            <div className="bg-gray-50 p-3 rounded shadow-sm">
              <h5 className="font-semibold text-sm mb-1 text-indigo-800">Small-size REs</h5>
              <p className="text-xs">Reduced compliance requirements with exemptions for certain technical controls</p>
            </div>
            <div className="bg-gray-50 p-3 rounded shadow-sm">
              <h5 className="font-semibold text-sm mb-1 text-indigo-800">Self-certification REs</h5>
              <p className="text-xs">Simplified compliance for smaller entities, with exemptions for M-SOC for those with &lt;100 clients</p>
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <h4 className="font-medium text-md mb-2">Entity Types and Their Classification Criteria:</h4>
          <ul className="list-disc pl-6 text-sm space-y-2">
            <li><strong>Stock Brokers:</strong> Classified by client count (up to &gt;10 lakhs) and trading volume (up to &gt;₹10,00,000 Cr)</li>
            <li><strong>Portfolio Managers:</strong> Self-certification for AUM ≤₹3000 Cr, Mid-size for AUM &gt;₹3000 Cr</li>
            <li><strong>Investment Advisors:</strong> Classification based on client count (&lt;100, 100-500, &gt;500)</li>
            <li><strong>MIIs:</strong> Stock Exchanges, Depositories, and Clearing Corporations remain as MIIs with the highest compliance requirements</li>
          </ul>
        </div>
        
        <div className="bg-blue-50 p-3 rounded text-sm mt-4">
          <p><strong>Note:</strong> Entity category is determined at the beginning of each financial year based on the previous year's data and remains fixed throughout the year regardless of parameter changes during the period.</p>
        </div>
      </div>

      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <h3 className="text-xl font-semibold mb-3">CCI Framework Architecture</h3>
        <p className="mb-3">
          The CCI framework is structured around the NIST Cybersecurity Framework's core functions, organized into six key categories 
          that directly align with SEBI CSCRF requirements:
        </p>
        <ul className="list-disc pl-6 mb-3">
          <li className="mb-2"><strong>Governance (GV):</strong> Policy development, organizational structure, and resource allocation</li>
          <li className="mb-2"><strong>Identify (ID):</strong> Asset management, risk assessment, and business environment analysis</li>
          <li className="mb-2"><strong>Protect (PR):</strong> Access control, awareness training, data security, and information protection</li>
          <li className="mb-2"><strong>Detect (DE):</strong> Continuous monitoring, vulnerability scanning, and anomaly detection</li>
          <li className="mb-2"><strong>Respond (RS):</strong> Incident response planning, communications, and mitigation strategies</li>
          <li className="mb-2"><strong>Recover (RC):</strong> Recovery planning, improvements, and communications protocols</li>
        </ul>
        <p>
          Each parameter within these categories is assigned a specific weightage based on its significance to the overall security program,
          with the highest weightage (18%) given to Vulnerability Management measures.
        </p>
      </div>

      <h3 className="text-xl font-semibold mb-3">Key Features for Regulated Entities</h3>
      <ul className="list-disc pl-6 mb-6">
        <li className="mb-2"><strong>Regulatory Compliance:</strong> Direct alignment with SEBI CSCRF mandates for Qualified REs and MIIs</li>
        <li className="mb-2"><strong>Quantifiable Measurements:</strong> Numerical scoring system (0-100) to determine cybersecurity maturity levels</li>
        <li className="mb-2"><strong>Risk-Based Assessment:</strong> Weighted parameters prioritizing critical security controls</li>
        <li className="mb-2"><strong>Maturity Benchmarking:</strong> Industry-specific maturity classification for financial market participants</li>
        <li className="mb-2"><strong>Continuous Improvement:</strong> Trackable metrics to demonstrate security posture enhancement</li>
      </ul>

      <p className="mb-6 p-4 bg-gray-100 border-l-4 border-blue-500">
        Under SEBI directives, all Qualified REs must maintain a minimum CCI maturity level of "Developing" (score of 61 or higher), 
        while critical MIIs are expected to achieve "Manageable" (score of 71 or higher) to ensure adequate protection of market infrastructure.
      </p>
      
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-3">CCI Maturity Levels</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-b">Maturity Level</th>
                <th className="py-2 px-4 border-b">Score Range</th>
                <th className="py-2 px-4 border-b">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 px-4 border-b font-medium">Exceptional</td>
                <td className="py-2 px-4 border-b">91-100</td>
                <td className="py-2 px-4 border-b">Leading-edge security posture with advanced capabilities</td>
              </tr>
              <tr>
                <td className="py-2 px-4 border-b font-medium">Optimal</td>
                <td className="py-2 px-4 border-b">81-90</td>
                <td className="py-2 px-4 border-b">Robust security program with well-integrated controls</td>
              </tr>
              <tr>
                <td className="py-2 px-4 border-b font-medium">Manageable</td>
                <td className="py-2 px-4 border-b">71-80</td>
                <td className="py-2 px-4 border-b">Established security program with consistent implementation</td>
              </tr>
              <tr>
                <td className="py-2 px-4 border-b font-medium">Developing</td>
                <td className="py-2 px-4 border-b">61-70</td>
                <td className="py-2 px-4 border-b">Basic security controls with some gaps in implementation</td>
              </tr>
              <tr>
                <td className="py-2 px-4 border-b font-medium">Bare Minimum</td>
                <td className="py-2 px-4 border-b">51-60</td>
                <td className="py-2 px-4 border-b">Minimal security controls meeting basic requirements</td>
              </tr>
              <tr>
                <td className="py-2 px-4 border-b font-medium">Insufficient</td>
                <td className="py-2 px-4 border-b">0-50</td>
                <td className="py-2 px-4 border-b">Inadequate security controls requiring significant improvements</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* SEO Keywords (hidden from visual display but present for indexing) */}
      <div className="hidden">
        <span>Cyber Capability Index CCI</span>
        <span>Qualified Regulated Entities REs</span>
        <span>Market Infrastructure Institutions MIIs</span>
        <span>SEBI CSCRF</span>
        <span>cybersecurity maturity</span>
        <span>regulatory compliance</span>
        <span>cyber resilience</span>
        <span>minimum baseline security</span>
        <span>risk-based approach</span>
        <span>cybersecurity assessment</span>
        <span>SEBI compliance</span>
        <span>Indian financial markets</span>
        <span>SEBI/HO/ITD-1/ITD_CSC_EXT/P/CIR/2024/113</span>
        <span>SEBI/HO/ITD-1/ITD_CSC_EXT/P/CIR/2025/60</span>
        <span>maturity levels</span>
        <span>NIST Cybersecurity Framework</span>
        <span>entity classification</span>
        <span>stock brokers</span>
        <span>portfolio managers</span>
        <span>investment advisors</span>
      </div>
    </div>
  );
};

export default SEBICSCRFIntroduction; 