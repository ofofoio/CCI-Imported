import React, { useState } from 'react';
import CreatorFooter from './CreatorFooter';

interface SEBIInfoProps {
  onCalculate: () => void;
}

const SEBIInfo: React.FC<SEBIInfoProps> = ({ onCalculate }) => {
  const [activeTab, setActiveTab] = useState('framework');
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  return (
    <section className="animate-fadeIn">
      {/* Hero Section with Futuristic Black and White Design */}
      <div className="bg-black rounded-xl shadow-xl overflow-hidden mb-10 transform transition-all duration-700 hover:shadow-2xl">
        <div className="p-8 md:p-12 relative">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15),transparent_70%)]"></div>
          <div className="max-w-4xl mx-auto relative z-10">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight animate-fadeInUp">
              SEBI CCI Index <span className="text-gray-300">Calculator</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 animate-fadeInUp animation-delay-100">
              The official assessment tool for SEBI CSCRF compliance within regulated financial entities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-8 animate-fadeInUp animation-delay-200">
              <button
                onClick={onCalculate}
                className="px-8 py-4 bg-white hover:bg-gray-100 text-black font-semibold rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl flex items-center justify-center text-lg group"
              >
                <span className="mr-2 transform transition-transform duration-300 group-hover:translate-x-1">Calculate CCI Score</span>
                <svg className="w-5 h-5 transform transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </button>
              <button
                onClick={() => {
                  const complianceSection = document.getElementById('compliance-info');
                  if (complianceSection) {
                    complianceSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="px-8 py-4 bg-transparent hover:bg-white/10 text-white font-medium rounded-lg border border-white/20 transform transition-all duration-300 hover:border-white/40 hover:shadow-lg backdrop-blur-sm"
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Deadline Alert */}
      <div className="bg-white border-l-4 border-black p-4 mb-10 rounded-lg shadow-md transform transition-all duration-500 hover:shadow-xl">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-black" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-bold text-black">SEBI Compliance Deadline Approaching</h3>
            <div className="mt-2 text-gray-700">
              <p>All Qualified Regulated Entities and Market Infrastructure Institutions must comply with SEBI CSCRF by June 30, 2025.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Feature Cards Grid with Hover Animations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {[
          {
            id: 1,
            title: "Governance & Identify",
            description: "Comprehensive assessment of your organization's policy development, structure, asset management, and risk assessment practices.",
            label: "GV & ID parameters"
          },
          {
            id: 2,
            title: "Protect & Detect",
            description: "Evaluation of access controls, awareness training, data security, continuous monitoring, and vulnerability scanning.",
            label: "PR & DE parameters"
          },
          {
            id: 3,
            title: "Respond & Recover",
            description: "Analysis of incident response planning, communication protocols, mitigation strategies, and recovery planning.",
            label: "RS & RC parameters"
          },
          {
            id: 4,
            title: "Compliance Reporting",
            description: "Generation of comprehensive reports for SEBI CSCRF submission, board-level communication, and regulatory compliance.",
            label: "Export capabilities"
          }
        ].map((card) => (
          <div 
            key={card.id}
            className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 transform transition-all duration-500 hover:shadow-2xl hover:-translate-y-1"
            onMouseEnter={() => setHoveredCard(card.id)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div className={`h-1 bg-black transition-all duration-500 ${hoveredCard === card.id ? 'w-full' : 'w-1/3'}`}></div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-black mb-4 flex items-center">
                <span className={`w-2 h-2 rounded-full bg-black mr-2 transition-all duration-300 ${hoveredCard === card.id ? 'opacity-100' : 'opacity-50'}`}></span>
                {card.title}
              </h3>
              <p className="text-gray-600 mb-4">
                {card.description}
              </p>
              <div className="flex items-center text-black font-medium group">
                <span>{card.label}</span>
                <svg 
                  className={`w-4 h-4 ml-2 transform transition-all duration-300 ${hoveredCard === card.id ? 'translate-x-1' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Main Content with Tabbed Navigation */}
      <div id="compliance-info" className="bg-white rounded-xl shadow-lg overflow-hidden mb-10 transform transition-all duration-500 hover:shadow-2xl">
        <div className="border-b border-gray-200">
          <nav className="flex">
            {[
              { id: 'framework', label: 'Framework Overview' },
              { id: 'architecture', label: 'CCI Architecture' },
              { id: 'maturity', label: 'Maturity Levels' },
              { id: 'evidence', label: 'Evidence Collection' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-medium focus:outline-none transition-all duration-300 border-b-2 ${
                  activeTab === tab.id
                    ? 'text-black border-black'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="p-6 md:p-8">
          {/* Framework Overview Tab */}
          <div className={`transition-opacity duration-500 ${activeTab === 'framework' ? 'opacity-100' : 'hidden opacity-0'}`}>
            <div className="mb-10 animate-fadeIn">
              <h2 className="text-2xl font-bold text-black mb-4 flex items-center">
                <div className="w-6 h-6 bg-black text-white rounded-sm flex items-center justify-center mr-3 text-xs font-normal">01</div>
                Introduction to SEBI CSCRF
              </h2>
              <p className="text-gray-700 mb-4 leading-relaxed pl-9">
                The SEBI CSCRF framework, established under SEBI Circular SEBI/HO/ITD-1/ITD_CSC_EXT/P/CIR/2024/113, mandates 
                cybersecurity requirements for market intermediaries including stock brokers, depository participants, mutual funds, 
                and other regulated entities in the Indian financial markets.
              </p>
              <p className="text-gray-700 leading-relaxed pl-9">
                The framework aims to enhance the cyber resilience of India's financial ecosystem by establishing minimum baseline 
                security requirements while promoting a risk-based approach to cybersecurity.
              </p>
            </div>
            
            <div className="mb-10 animate-fadeIn animation-delay-100">
              <h2 className="text-2xl font-bold text-black mb-4 flex items-center">
                <div className="w-6 h-6 bg-black text-white rounded-sm flex items-center justify-center mr-3 text-xs font-normal">02</div>
                Cyber Capability Index (CCI)
              </h2>
              <p className="text-gray-700 leading-relaxed pl-9">
                The Cyber Capability Index (CCI) is a quantitative methodology for assessing cybersecurity maturity specifically 
                designed for Qualified Regulated Entities (REs) and Market Infrastructure Institutions (MIIs) under SEBI's regulatory 
                purview. The CCI framework translates SEBI CSCRF requirements into 23 measurable parameters with specific weightages 
                to provide a standardized assessment approach.
              </p>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 pl-9">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 transform transition-all duration-300 hover:border-black hover:shadow-md">
                  <div className="font-bold text-black mb-2">Qualified REs</div>
                  <div className="text-gray-700 text-sm">Minimum CCI Score: 61+</div>
                  <div className="text-gray-700 text-sm">Maturity Level: "Developing"</div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 transform transition-all duration-300 hover:border-black hover:shadow-md">
                  <div className="font-bold text-black mb-2">MIIs</div>
                  <div className="text-gray-700 text-sm">Minimum CCI Score: 71+</div>
                  <div className="text-gray-700 text-sm">Maturity Level: "Manageable"</div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 transform transition-all duration-300 hover:border-black hover:shadow-md">
                  <div className="font-bold text-black mb-2">Assessment Frequency</div>
                  <div className="text-gray-700 text-sm">Every 6 months</div>
                  <div className="text-gray-700 text-sm">Independent annual audit</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* CCI Architecture Tab */}
          <div className={`transition-opacity duration-500 ${activeTab === 'architecture' ? 'opacity-100' : 'hidden opacity-0'}`}>
            <h2 className="text-2xl font-bold text-black mb-6 flex items-center">
              <span className="w-8 h-8 inline-flex items-center justify-center rounded-full border-2 border-black mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                </svg>
              </span>
              CCI Framework Architecture
            </h2>
            <p className="text-gray-700 mb-8 leading-relaxed">
              The CCI framework is structured around the NIST Cybersecurity Framework's core functions, organized into six key 
              categories that directly align with SEBI CSCRF requirements:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[
                {
                  code: "GV",
                  name: "Governance",
                  description: "Policy development, organizational structure, and resource allocation"
                },
                {
                  code: "ID",
                  name: "Identify",
                  description: "Asset management, risk assessment, and business environment analysis"
                },
                {
                  code: "PR",
                  name: "Protect",
                  description: "Access control, awareness training, data security, and information protection"
                },
                {
                  code: "DE",
                  name: "Detect",
                  description: "Continuous monitoring, vulnerability scanning, and anomaly detection"
                },
                {
                  code: "RS",
                  name: "Respond",
                  description: "Incident response planning, communications, and mitigation strategies"
                },
                {
                  code: "RC",
                  name: "Recover",
                  description: "Recovery planning, improvements, and communications protocols"
                }
              ].map((category, index) => (
                <div 
                  key={category.code}
                  className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm transform transition-all duration-500 hover:shadow-xl hover:-translate-y-1 group animate-fadeIn"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <h3 className="text-lg font-semibold text-black mb-3 flex items-center">
                    <div className="w-10 h-10 rounded-full border-2 border-black bg-white text-black flex items-center justify-center mr-3 font-bold transition-all duration-300 group-hover:bg-black group-hover:text-white">{category.code}</div>
                    {category.name}
                  </h3>
                  <p className="text-gray-600">{category.description}</p>
                </div>
              ))}
            </div>
            
            <p className="text-gray-700 mt-4 leading-relaxed">
              Each parameter within these categories is assigned a specific weightage based on its significance to the overall security 
              program, with the highest weightage (18%) given to Vulnerability Management measures.
            </p>
          </div>
          
          {/* Maturity Levels Tab */}
          <div className={`transition-opacity duration-500 ${activeTab === 'maturity' ? 'opacity-100' : 'hidden opacity-0'}`}>
            <h2 className="text-2xl font-bold text-black mb-6 flex items-center">
              <span className="w-8 h-8 inline-flex items-center justify-center rounded-full border-2 border-black mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </span>
              CCI Maturity Levels
            </h2>
            <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Maturity Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score Range</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[
                    {
                      level: "Exceptional",
                      range: "91-100",
                      description: "Leading-edge security posture with advanced capabilities"
                    },
                    {
                      level: "Optimal",
                      range: "81-90",
                      description: "Robust security program with well-integrated controls"
                    },
                    {
                      level: "Manageable",
                      range: "71-80",
                      description: "Established security program with consistent implementation"
                    },
                    {
                      level: "Developing",
                      range: "61-70",
                      description: "Basic security controls with some gaps in implementation"
                    },
                    {
                      level: "Bare Minimum",
                      range: "51-60",
                      description: "Minimal security controls meeting basic requirements"
                    },
                    {
                      level: "Insufficient",
                      range: "0-50",
                      description: "Inadequate security controls requiring significant improvements"
                    }
                  ].map((maturity, index) => (
                    <tr 
                      key={maturity.level} 
                      className="hover:bg-gray-50 transform transition-all duration-300 hover:shadow-sm animate-fadeIn" 
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-black">{maturity.level}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{maturity.range}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{maturity.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-8 bg-gray-50 rounded-lg p-6 border border-gray-200 animate-fadeIn animation-delay-300">
              <h3 className="text-lg font-bold text-black mb-4">Compliance Requirements</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="w-5 h-5 rounded-full border border-black flex items-center justify-center text-xs mr-3 mt-0.5">✓</span>
                  <span className="text-gray-700">Qualified REs must achieve a minimum score of 61 (Developing)</span>
                </li>
                <li className="flex items-start">
                  <span className="w-5 h-5 rounded-full border border-black flex items-center justify-center text-xs mr-3 mt-0.5">✓</span>
                  <span className="text-gray-700">MIIs must achieve a minimum score of 71 (Manageable)</span>
                </li>
                <li className="flex items-start">
                  <span className="w-5 h-5 rounded-full border border-black flex items-center justify-center text-xs mr-3 mt-0.5">✓</span>
                  <span className="text-gray-700">Assessment must be performed bi-annually with an independent audit annually</span>
                </li>
                <li className="flex items-start">
                  <span className="w-5 h-5 rounded-full border border-black flex items-center justify-center text-xs mr-3 mt-0.5">✓</span>
                  <span className="text-gray-700">Board-level review and approval of assessment results is required</span>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Evidence Collection Tab */}
          <div className={`transition-opacity duration-500 ${activeTab === 'evidence' ? 'opacity-100' : 'hidden opacity-0'}`}>
            <h2 className="text-2xl font-bold text-black mb-6 flex items-center">
              <span className="w-8 h-8 inline-flex items-center justify-center rounded-full border-2 border-black mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
              Evidence Collection Best Practices
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {[
                {
                  title: "Centralized Repository",
                  description: "Maintain a centralized repository of all evidence for easy access during audits"
                },
                {
                  title: "Proper Documentation",
                  description: "Ensure all evidence is properly dated, versioned, and includes appropriate context"
                },
                {
                  title: "Visual Documentation",
                  description: "Include screenshots with timestamps where applicable to demonstrate compliance"
                },
                {
                  title: "Data Protection",
                  description: "Redact sensitive information while preserving the relevant context for audit purposes"
                },
                {
                  title: "Organized Structure",
                  description: "Organize evidence by parameter number for streamlined assessment and review"
                },
                {
                  title: "Regular Updates",
                  description: "Update evidence regularly to reflect current system configurations and controls"
                }
              ].map((practice, index) => (
                <div 
                  key={practice.title}
                  className="flex items-start p-4 bg-white rounded-lg border border-gray-200 shadow-sm transform transition-all duration-300 hover:shadow-lg hover:border-black animate-fadeIn"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center border-2 border-black rounded-full mr-4 font-bold">{index + 1}</div>
                  <div>
                    <h3 className="text-lg font-bold text-black mb-1">{practice.title}</h3>
                    <p className="text-gray-600">{practice.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 animate-fadeIn animation-delay-600">
              <h3 className="text-lg font-bold text-black mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Important Note
              </h3>
              <p className="text-gray-700 mb-3">
                All evidence must be current (within the assessment period) and should clearly demonstrate compliance with the 
                specific parameter requirements. Documentation should include dates, system identifiers, and be properly approved 
                where applicable.
              </p>
              <p className="text-gray-700">
                For detailed parameter-specific evidence requirements, use the CCI Calculator to generate a comprehensive 
                guidance document tailored to your organization's needs.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="bg-black rounded-xl shadow-xl overflow-hidden mb-10 text-center p-8 md:p-12 transform transition-all duration-500 hover:shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.05),transparent_70%)]"></div>
        <div className="relative z-10 animate-fadeIn">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to assess your SEBI CSCRF compliance?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Determine your organization's Cyber Capability Index score and maturity level instantly with our comprehensive calculator.
          </p>
          <button
            onClick={onCalculate}
            className="px-8 py-4 bg-white hover:bg-gray-100 text-black font-bold rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105 text-lg tracking-wide group"
          >
            <span className="inline-block transform transition-transform duration-300 group-hover:translate-x-1">CALCULATE YOUR CCI SCORE NOW</span>
            <svg className="w-5 h-5 ml-2 inline-block transform transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
            </svg>
          </button>
          <p className="text-sm text-gray-400 mt-4">
            Free assessment tool • Detailed reporting • Compliant with latest SEBI guidelines
          </p>
        </div>
      </div>
      
      {/* Footer Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center text-gray-500 text-sm animate-fadeIn animation-delay-300">
        <p>
          <strong className="text-black">Disclaimer:</strong> This SEBI CCI Index Calculator is for informational purposes only and does not 
          constitute legal advice. Organizations should consult with qualified legal and security professionals to ensure 
          compliance with all applicable regulations.
        </p>
        <p className="mt-2">
          For more information or questions, contact the SEBI IT department at
          <a href="mailto:sebicscrf@sebi.gov.in" className="text-black mx-1 hover:underline">sebicscrf@sebi.gov.in</a>
          or visit the official SEBI website at
          <a href="https://www.sebi.gov.in" target="_blank" rel="noopener noreferrer" className="text-black ml-1 hover:underline">www.sebi.gov.in</a>.
        </p>
      </div>
      
      {/* Creator Footer */}
      <CreatorFooter className="mt-10" />
      
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.5s ease-out forwards;
        }
        
        .animation-delay-100 {
          animation-delay: 0.1s;
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        
        .animation-delay-300 {
          animation-delay: 0.3s;
        }
        
        .animation-delay-600 {
          animation-delay: 0.6s;
        }
      `}</style>
    </section>
  );
};

export default SEBIInfo; 