'use client';

import { useState, useEffect } from 'react';
import { 
  SBOMDocument, 
  SBOMComponent, 
  SBOMRegistry 
} from '../app/types';
import CreatorFooter from './CreatorFooter';

interface SBOMManagementProps {
  organizationName: string;
  onBack?: () => void;
  onExportSBOM?: () => void;
}

const DEFAULT_SBOM_COMPONENT: SBOMComponent = {
  id: '',
  name: '',
  version: '',
  supplier: '',
  license: '',
  cryptographicHash: '',
  dependencies: [],
  description: '',
};

const DEFAULT_SBOM_DOCUMENT: SBOMDocument = {
  id: '',
  name: '',
  version: '',
  supplier: '',
  dateCreated: new Date().toISOString().split('T')[0],
  lastUpdated: new Date().toISOString().split('T')[0],
  updateFrequency: '',
  encryptionUsed: '',
  accessControl: '',
  errorHandlingMethod: '',
  knownUnknowns: [],
  components: [],
  notes: '',
};

export default function SBOMManagement({ organizationName, onBack, onExportSBOM }: SBOMManagementProps) {
  const [registry, setRegistry] = useState<SBOMRegistry>({
    sbomDocuments: [],
    criticalSystems: [],
  });
  const [currentDocument, setCurrentDocument] = useState<SBOMDocument>(DEFAULT_SBOM_DOCUMENT);
  const [currentComponent, setCurrentComponent] = useState<SBOMComponent>(DEFAULT_SBOM_COMPONENT);
  const [activeTab, setActiveTab] = useState<'registry' | 'document' | 'component'>('registry');
  const [editMode, setEditMode] = useState<boolean>(false);
  const [criticalSystem, setCriticalSystem] = useState<string>('');

  // Calculate completion percentages for SBOM documents and components
  const calculateDocumentCompletion = (document: SBOMDocument): number => {
    let points = 0;
    let totalPoints = 8; // Total number of key fields to check
    
    if (document.name) points++;
    if (document.version) points++;
    if (document.supplier) points++;
    if (document.encryptionUsed) points++;
    if (document.accessControl) points++;
    if (document.errorHandlingMethod) points++;
    if (document.updateFrequency) points++;
    if (document.components.length > 0) points++;
    
    return Math.round((points / totalPoints) * 100);
  };
  
  const calculateComponentCompletion = (component: SBOMComponent): number => {
    let points = 0;
    let totalPoints = 5; // Total number of key fields to check
    
    if (component.name) points++;
    if (component.version) points++;
    if (component.supplier) points++;
    if (component.license) points++;
    if (component.cryptographicHash) points++;
    
    return Math.round((points / totalPoints) * 100);
  };
  
  const getCompletionColor = (percentage: number): string => {
    if (percentage < 50) return 'bg-red-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Load registry from localStorage on component mount
  useEffect(() => {
    const savedRegistry = localStorage.getItem('sbomRegistry');
    if (savedRegistry) {
      setRegistry(JSON.parse(savedRegistry));
    }
  }, []);

  // Save registry to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sbomRegistry', JSON.stringify(registry));
  }, [registry]);

  // Sample SBOM data according to SEBI CSCRF guidelines
  const loadSampleData = () => {
    const sampleComponents: SBOMComponent[] = [
      {
        id: crypto.randomUUID(),
        name: 'Log4j',
        version: '2.17.1',
        supplier: 'Apache Software Foundation',
        license: 'Apache License 2.0',
        cryptographicHash: 'sha256:e55d8ce215c96a63ef1d457cc152b8fc2e2c9a19864bb5b47df4fadca2a0d1a3',
        dependencies: [],
        description: 'Java-based logging utility, updated after Log4Shell vulnerability',
      },
      {
        id: crypto.randomUUID(),
        name: 'Spring Boot',
        version: '2.7.3',
        supplier: 'Pivotal Software',
        license: 'Apache License 2.0',
        cryptographicHash: 'sha256:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
        dependencies: [],
        description: 'Framework to ease the bootstrapping and development of new Spring applications',
      },
      {
        id: crypto.randomUUID(),
        name: 'React',
        version: '18.2.0',
        supplier: 'Facebook Inc.',
        license: 'MIT License',
        cryptographicHash: 'sha256:5c5d4fc1d46760a2909a8e5c34b201bb5aea5e5e9a23a681f96a0d3177b86e59',
        dependencies: [],
        description: 'JavaScript library for building user interfaces',
      },
      {
        id: crypto.randomUUID(),
        name: 'SQLite',
        version: '3.39.2',
        supplier: 'SQLite Consortium',
        license: 'Public Domain',
        cryptographicHash: 'sha256:de1f3c4e9c3692de2e4cf40ee9e7f37c,7ea0df4f3d0c13a0b8e0d3e8d38c82b',
        dependencies: [],
        description: 'C-language library that implements a small, fast, self-contained SQL database engine',
      },
      {
        id: crypto.randomUUID(),
        name: 'OpenSSL',
        version: '3.0.7',
        supplier: 'OpenSSL Software Foundation',
        license: 'Apache License 2.0',
        cryptographicHash: 'sha256:83049d042a260e696f62406ac5c08bf706fd84383f945cf21bd61e9ed95c396e',
        dependencies: [],
        description: 'Robust, commercial-grade, full-featured toolkit for the Transport Layer Security (TLS) protocol',
      },
      {
        id: crypto.randomUUID(),
        name: 'Apache Kafka',
        version: '3.3.1',
        supplier: 'Apache Software Foundation',
        license: 'Apache License 2.0',
        cryptographicHash: 'sha256:4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6',
        dependencies: [],
        description: 'Distributed event streaming platform for high-performance data pipelines and streaming analytics',
      },
      {
        id: crypto.randomUUID(),
        name: 'PostgreSQL',
        version: '14.5',
        supplier: 'PostgreSQL Global Development Group',
        license: 'PostgreSQL License',
        cryptographicHash: 'sha256:1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e',
        dependencies: [],
        description: 'Advanced open source relational database',
      },
      {
        id: crypto.randomUUID(),
        name: 'Node.js',
        version: '16.18.0',
        supplier: 'OpenJS Foundation',
        license: 'MIT License',
        cryptographicHash: 'sha256:a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2a3b4c5d6e7',
        dependencies: [],
        description: 'JavaScript runtime environment that executes JavaScript code outside a web browser',
      },
      {
        id: crypto.randomUUID(),
        name: 'Redis',
        version: '7.0.5',
        supplier: 'Redis Ltd',
        license: 'BSD 3-Clause License',
        cryptographicHash: 'sha256:9b8c7d6e5f4a3b2c1d0e9f8g7h6j5k4m3n2p1o0q9r8s7t6u5v4w3x2y1z0a9b',
        dependencies: [],
        description: 'In-memory data structure store, used as a database, cache, and message broker',
      },
      {
        id: crypto.randomUUID(),
        name: 'Nginx',
        version: '1.23.2',
        supplier: 'Nginx, Inc.',
        license: 'BSD 2-Clause License',
        cryptographicHash: 'sha256:b1c2d3e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5a6b7c8d9e0f',
        dependencies: [],
        description: 'Web server, reverse proxy, and load balancer',
      },
      {
        id: crypto.randomUUID(),
        name: 'Django',
        version: '4.1.2',
        supplier: 'Django Software Foundation',
        license: 'BSD 3-Clause License',
        cryptographicHash: 'sha256:c1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v0w1x2y3z4a5b6c7d8e9f0',
        dependencies: [],
        description: 'High-level Python web framework that encourages rapid development',
      },
      {
        id: crypto.randomUUID(),
        name: 'jQuery',
        version: '3.6.1',
        supplier: 'jQuery Foundation',
        license: 'MIT License',
        cryptographicHash: 'sha256:d1e2f3g4h5i6j7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3a4b5c6d7e8f9g0',
        dependencies: [],
        description: 'Fast, small, and feature-rich JavaScript library',
      },
      {
        id: crypto.randomUUID(),
        name: 'Hibernate ORM',
        version: '6.1.4.Final',
        supplier: 'Red Hat, Inc.',
        license: 'GNU LGPL v2.1',
        cryptographicHash: 'sha256:e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2a3b4c5d6e7f8g9h0',
        dependencies: [],
        description: 'Object-relational mapping tool for Java',
      },
      {
        id: crypto.randomUUID(),
        name: 'TensorFlow',
        version: '2.10.0',
        supplier: 'Google LLC',
        license: 'Apache License 2.0',
        cryptographicHash: 'sha256:f1g2h3i4j5k6l7m8n9o0p1q2r3s4t5u6v7w8x9y0z1a2b3c4d5e6f7g8h9i0',
        dependencies: [],
        description: 'End-to-end open source platform for machine learning',
      },
      {
        id: crypto.randomUUID(),
        name: 'Kubernetes',
        version: '1.25.3',
        supplier: 'Cloud Native Computing Foundation',
        license: 'Apache License 2.0',
        cryptographicHash: 'sha256:g1h2i3j4k5l6m7n8o9p0q1r2s3t4u5v6w7x8y9z0a1b2c3d4e5f6g7h8i9j0',
        dependencies: [],
        description: 'Open-source container orchestration system for automating deployment, scaling, and management',
      }
    ];

    const tradingEngineComponents = [
      sampleComponents[0], // Log4j
      sampleComponents[1], // Spring Boot
      sampleComponents[2], // React
      sampleComponents[3], // SQLite
      sampleComponents[4], // OpenSSL
      sampleComponents[5], // Kafka
      sampleComponents[6], // PostgreSQL
    ];

    const settlementSystemComponents = [
      sampleComponents[1], // Spring Boot
      sampleComponents[3], // SQLite
      sampleComponents[7], // Node.js
      sampleComponents[8], // Redis
      sampleComponents[9], // Nginx
    ];

    const riskManagementComponents = [
      sampleComponents[0], // Log4j
      sampleComponents[6], // PostgreSQL
      sampleComponents[12], // Hibernate
      sampleComponents[13], // TensorFlow
      sampleComponents[14], // Kubernetes
    ];

    const sampleKnownUnknowns = [
      'Some transitive dependencies in npm packages not fully listed',
      'Native code extensions may have dependencies not captured in this SBOM',
      'Dynamic loading libraries may not be fully represented',
      'Third-party AI model dependencies not completely documented',
      'Legacy integration components with incomplete dependency information'
    ];

    const sampleCriticalSystems = [
      'Core Trading Engine',
      'Settlement Systems',
      'Risk Management System',
      'Clearing System',
      'Client Onboarding Platform',
      'Market Data Services'
    ];

    const sampleSBOMDocuments: SBOMDocument[] = [
      {
        id: crypto.randomUUID(),
        name: 'Trading Platform Core System',
        version: '3.5.2',
        supplier: 'Internal Development Team',
        dateCreated: '2023-06-15',
        lastUpdated: '2023-10-25',
        updateFrequency: 'Quarterly',
        encryptionUsed: 'AES-256, TLS 1.3',
        accessControl: 'Role-based access control with multi-factor authentication',
        errorHandlingMethod: 'Centralized error logging with automated alerts',
        knownUnknowns: [sampleKnownUnknowns[0], sampleKnownUnknowns[1], sampleKnownUnknowns[2]],
        components: tradingEngineComponents,
        notes: 'This SBOM is maintained by the Security Operations team. Update required before major releases.',
      },
      {
        id: crypto.randomUUID(),
        name: 'Settlement System',
        version: '2.7.0',
        supplier: 'FinTech Solutions Inc.',
        dateCreated: '2023-04-10',
        lastUpdated: '2023-11-05',
        updateFrequency: 'Monthly',
        encryptionUsed: 'ChaCha20-Poly1305, RSA 4096',
        accessControl: 'Zero Trust Architecture with continuous authentication',
        errorHandlingMethod: 'Graceful degradation with failover mechanisms',
        knownUnknowns: [
          'Some third-party libraries may have undocumented dependencies',
          'Pre-compiled binaries with limited visibility into source components'
        ],
        components: settlementSystemComponents,
        notes: 'Critical system with high availability requirements. Vendor-provided SBOM verified by internal security team.',
      },
      {
        id: crypto.randomUUID(),
        name: 'Risk Management System',
        version: '4.2.1',
        supplier: 'Risk Analytics Ltd.',
        dateCreated: '2023-05-22',
        lastUpdated: '2023-12-01',
        updateFrequency: 'Bi-monthly',
        encryptionUsed: 'AES-256-GCM, ECDSA P-384',
        accessControl: 'Attribute-based access control with privileged access management',
        errorHandlingMethod: 'Structured exception handling with automated recovery',
        knownUnknowns: [sampleKnownUnknowns[1], sampleKnownUnknowns[3], sampleKnownUnknowns[4]],
        components: riskManagementComponents,
        notes: 'System responsible for real-time risk calculations and market exposure monitoring. Contains proprietary machine learning models for risk prediction.',
      }
    ];

    // Set the sample data
    setRegistry({
      sbomDocuments: [...registry.sbomDocuments, ...sampleSBOMDocuments],
      criticalSystems: Array.from(new Set([...registry.criticalSystems, ...sampleCriticalSystems]))
    });

    alert('Sample SBOM data loaded successfully!');
  };

  const handleAddDocument = () => {
    if (!currentDocument.name || !currentDocument.supplier) {
      alert('Please fill in at least the name and supplier fields');
      return;
    }

    const newDocument = {
      ...currentDocument,
      id: crypto.randomUUID(),
    };

    setRegistry({
      ...registry,
      sbomDocuments: [...registry.sbomDocuments, newDocument],
    });
    setCurrentDocument(DEFAULT_SBOM_DOCUMENT);
    setActiveTab('registry');
  };

  const handleAddComponent = () => {
    if (!currentComponent.name || !currentComponent.version) {
      alert('Please fill in at least the name and version fields');
      return;
    }

    const newComponent = {
      ...currentComponent,
      id: crypto.randomUUID(),
    };

    const updatedDocument = {
      ...currentDocument,
      components: [...currentDocument.components, newComponent],
    };
    
    setCurrentDocument(updatedDocument);
    setCurrentComponent(DEFAULT_SBOM_COMPONENT);
    setActiveTab('document');
  };

  const handleEditDocument = (documentId: string) => {
    const document = registry.sbomDocuments.find(doc => doc.id === documentId);
    if (document) {
      setCurrentDocument(document);
      setActiveTab('document');
      setEditMode(true);
    }
  };

  const handleEditComponent = (componentId: string) => {
    const component = currentDocument.components.find(comp => comp.id === componentId);
    if (component) {
      setCurrentComponent(component);
      setActiveTab('component');
      setEditMode(true);
    }
  };

  const handleUpdateDocument = () => {
    const updatedDocuments = registry.sbomDocuments.map(doc => 
      doc.id === currentDocument.id ? currentDocument : doc
    );
    
    setRegistry({
      ...registry,
      sbomDocuments: updatedDocuments,
    });
    setCurrentDocument(DEFAULT_SBOM_DOCUMENT);
    setEditMode(false);
    setActiveTab('registry');
  };

  const handleUpdateComponent = () => {
    const updatedComponents = currentDocument.components.map(comp => 
      comp.id === currentComponent.id ? currentComponent : comp
    );
    
    setCurrentDocument({
      ...currentDocument,
      components: updatedComponents,
    });
    setCurrentComponent(DEFAULT_SBOM_COMPONENT);
    setEditMode(false);
    setActiveTab('document');
  };

  const handleDeleteDocument = (documentId: string) => {
    if (confirm('Are you sure you want to delete this SBOM document?')) {
      setRegistry({
        ...registry,
        sbomDocuments: registry.sbomDocuments.filter(doc => doc.id !== documentId),
      });
    }
  };

  const handleDeleteComponent = (componentId: string) => {
    if (confirm('Are you sure you want to delete this component?')) {
      setCurrentDocument({
        ...currentDocument,
        components: currentDocument.components.filter(comp => comp.id !== componentId),
      });
    }
  };

  const handleAddKnownUnknown = () => {
    const knownUnknown = prompt('Enter a known unknown (areas where dependency information is incomplete):');
    if (knownUnknown) {
      setCurrentDocument({
        ...currentDocument,
        knownUnknowns: [...currentDocument.knownUnknowns, knownUnknown],
      });
    }
  };

  const handleRemoveKnownUnknown = (index: number) => {
    setCurrentDocument({
      ...currentDocument,
      knownUnknowns: currentDocument.knownUnknowns.filter((_, i) => i !== index),
    });
  };

  const handleAddCriticalSystem = () => {
    if (criticalSystem && !registry.criticalSystems.includes(criticalSystem)) {
      setRegistry({
        ...registry,
        criticalSystems: [...registry.criticalSystems, criticalSystem],
      });
      setCriticalSystem('');
    }
  };

  const handleRemoveCriticalSystem = (system: string) => {
    setRegistry({
      ...registry,
      criticalSystems: registry.criticalSystems.filter(s => s !== system),
    });
  };

  const exportSBOM = (sbomDoc: SBOMDocument) => {
    const blob = new Blob([JSON.stringify(sbomDoc, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SBOM-${sbomDoc.name}-${sbomDoc.version}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importSBOM = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const sbom = JSON.parse(event.target?.result as string) as SBOMDocument;
            // Basic validation
            if (!sbom.name || !sbom.supplier || !Array.isArray(sbom.components)) {
              throw new Error('Invalid SBOM format');
            }
            // Generate new ID to avoid duplicates
            const newSbom = { ...sbom, id: crypto.randomUUID() };
            setRegistry({
              ...registry,
              sbomDocuments: [...registry.sbomDocuments, newSbom],
            });
          } catch (error) {
            alert('Error importing SBOM: ' + error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 text-center">
        SBOM Management for {organizationName}
      </h2>

      <div className="prose lg:prose-xl mx-auto mb-6">
        <p>Software Bill of Materials (SBOM) is a crucial part of the SEBI CSCRF requirements. Maintain an inventory of software components, versions, and dependencies to track security vulnerabilities and compliance status.</p>
      </div>
      
      {/* Top Banner - similar to SEBI page */}
      <div className="bg-black text-white p-4 rounded-lg shadow-lg mb-10">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center mb-3 md:mb-0">
            <div className="bg-white text-black rounded-full p-2 mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            </div>
            <div>
              <p className="font-bold">SBOM Management</p>
              <p className="text-sm">Track software components to meet SEBI CSCRF requirements</p>
            </div>
          </div>
          <button 
            onClick={onBack}
            className="bg-white hover:bg-gray-200 text-black py-2 px-6 rounded-md transition duration-200 font-bold flex items-center"
          >
            Back to Dashboard
          </button>
        </div>
        </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-4">
            <button 
              onClick={() => setActiveTab('registry')}
            className={`py-3 px-4 font-medium text-sm focus:outline-none ${
              activeTab === 'registry'
                ? 'border-b-2 border-black text-black'
                : 'text-gray-500 hover:text-black'
            }`}
            >
              SBOM Registry
            </button>
            <button 
              onClick={() => {
                  setCurrentDocument(DEFAULT_SBOM_DOCUMENT);
              setEditMode(false);
                  setActiveTab('document');
              }}
            className={`py-3 px-4 font-medium text-sm focus:outline-none ${
              activeTab === 'document'
                ? 'border-b-2 border-black text-black'
                : 'text-gray-500 hover:text-black'
            }`}
            >
            Add SBOM Document
            </button>
              <button 
                onClick={() => {
                    setCurrentComponent(DEFAULT_SBOM_COMPONENT);
              setEditMode(false);
                    setActiveTab('component');
            }}
            disabled={!currentDocument.id}
            className={`py-3 px-4 font-medium text-sm focus:outline-none ${
              activeTab === 'component'
                ? 'border-b-2 border-black text-black'
                : 'text-gray-500 hover:text-black'
            } ${!currentDocument.id ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Add Component
              </button>
          </div>
        </div>

      {/* SBOM Registry */}
        {activeTab === 'registry' && (
        <div className="animate-fadeIn">
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h3 className="text-2xl font-bold">SBOM Registry</h3>
            <div className="flex space-x-3">
              <button
                onClick={loadSampleData}
                className="bg-gray-200 hover:bg-gray-300 text-black py-2 px-4 rounded-md transition duration-200 text-sm font-medium flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Load Sample Data
              </button>
              <button
                onClick={onExportSBOM}
                className="bg-black hover:bg-gray-900 text-white py-2 px-4 rounded-md transition duration-200 text-sm font-medium flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Export SBOM Data
              </button>
            </div>
          </div>

          {/* Critical Systems List */}
          <div className="mb-8 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-xl font-semibold mb-3">Critical Systems</h3>
            <p className="text-gray-600 mb-4 text-sm">
              Identify critical systems that require SBOM tracking according to SEBI CSCRF requirements.
            </p>
            
            <div className="flex items-center mb-4">
                <input
                  type="text"
                  value={criticalSystem}
                  onChange={(e) => setCriticalSystem(e.target.value)}
                placeholder="Enter critical system name"
                className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                />
                <button
                  onClick={handleAddCriticalSystem}
                disabled={!criticalSystem.trim()}
                className="ml-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
              
            {registry.criticalSystems.length > 0 ? (
              <div className="mt-4">
                <ul className="space-y-2">
                {registry.criticalSystems.map((system, index) => (
                    <li key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                      <span>{system}</span>
                    <button
                      onClick={() => handleRemoveCriticalSystem(system)}
                        className="text-red-600 hover:text-red-800"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                    </li>
                ))}
                </ul>
              </div>
            ) : (
              <p className="text-gray-500 italic">No critical systems added yet.</p>
              )}
            </div>

          {/* Documents */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-xl font-semibold mb-4">SBOM Documents</h3>
            
            {registry.sbomDocuments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {registry.sbomDocuments.map((doc) => (
                  <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200 relative">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-lg font-medium">{doc.name}</h4>
                      <div className="flex">
                <button
                          onClick={() => handleEditDocument(doc.id)}
                          className="text-gray-600 hover:text-black mr-2"
                          title="Edit Document"
                >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                </button>
                <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete Document"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                </button>
              </div>
            </div>
            
                    <div className="mb-2 text-sm">
                      <p><span className="font-medium">Version:</span> {doc.version}</p>
                      <p><span className="font-medium">Supplier:</span> {doc.supplier}</p>
                      <p><span className="font-medium">Last Updated:</span> {doc.lastUpdated}</p>
                      <p><span className="font-medium">Components:</span> {doc.components.length}</p>
                </div>
                    
                    {/* Completion percentage */}
                    <div className="mt-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-medium">Completion</span>
                        <span className="text-xs font-medium">{calculateDocumentCompletion(doc)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getCompletionColor(calculateDocumentCompletion(doc))}`}
                          style={{ width: `${calculateDocumentCompletion(doc)}%` }}
                              ></div>
                            </div>
                          </div>
                    
                    {/* View Components Button */}
                          <button
                            onClick={() => exportSBOM(doc)}
                      className="mt-4 w-full bg-gray-200 hover:bg-gray-300 text-sm py-2 px-4 rounded-md font-medium transition duration-200"
                          >
                      Export Document
                          </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500 mb-4">No SBOM documents added yet</p>
                          <button
                  onClick={() => setActiveTab('document')}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none"
                          >
                  Create First SBOM Document
                          </button>
              </div>
            )}
            </div>
          </div>
        )}

      {/* Document Form */}
        {activeTab === 'document' && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 animate-fadeIn">
          <h3 className="text-xl font-semibold mb-6">{editMode ? 'Edit SBOM Document' : 'Create New SBOM Document'}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Document Name*</label>
                <input 
                  type="text"
                  value={currentDocument.name}
                  onChange={(e) => setCurrentDocument({...currentDocument, name: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="e.g., Trading Platform SBOM"
                />
              </div>
              
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Version*</label>
                <input 
                  type="text"
                  value={currentDocument.version}
                  onChange={(e) => setCurrentDocument({...currentDocument, version: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="e.g., 1.0.0"
                />
              </div>
              
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier*</label>
                <input 
                  type="text"
                  value={currentDocument.supplier}
                  onChange={(e) => setCurrentDocument({...currentDocument, supplier: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="e.g., Internal Development"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Created</label>
                <input 
                  type="date"
                  value={currentDocument.dateCreated}
                  onChange={(e) => setCurrentDocument({...currentDocument, dateCreated: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                <input 
                  type="date"
                  value={currentDocument.lastUpdated}
                  onChange={(e) => setCurrentDocument({...currentDocument, lastUpdated: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Update Frequency*</label>
              <select
                  value={currentDocument.updateFrequency}
                  onChange={(e) => setCurrentDocument({...currentDocument, updateFrequency: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">Select Frequency</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Bi-Annually">Bi-Annually</option>
                <option value="Annually">Annually</option>
                <option value="As Required">As Required</option>
              </select>
              </div>
              
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Encryption Used*</label>
              <select
                  value={currentDocument.encryptionUsed}
                  onChange={(e) => setCurrentDocument({...currentDocument, encryptionUsed: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">Select Encryption</option>
                <option value="AES-256">AES-256</option>
                <option value="RSA-2048">RSA-2048</option>
                <option value="TLS 1.3">TLS 1.3</option>
                <option value="None">None</option>
                <option value="Multiple">Multiple (see notes)</option>
              </select>
              </div>
              
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Access Control*</label>
              <select
                  value={currentDocument.accessControl}
                  onChange={(e) => setCurrentDocument({...currentDocument, accessControl: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">Select Access Control</option>
                <option value="Role-Based">Role-Based</option>
                <option value="Attribute-Based">Attribute-Based</option>
                <option value="Mandatory">Mandatory</option>
                <option value="Discretionary">Discretionary</option>
                <option value="Multiple">Multiple (see notes)</option>
              </select>
              </div>
              
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Error Handling Method*</label>
              <select
                  value={currentDocument.errorHandlingMethod}
                  onChange={(e) => setCurrentDocument({...currentDocument, errorHandlingMethod: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">Select Method</option>
                <option value="Exception Handling">Exception Handling</option>
                <option value="Retry Logic">Retry Logic</option>
                <option value="Graceful Degradation">Graceful Degradation</option>
                <option value="Fault Tolerance">Fault Tolerance</option>
                <option value="Circuit Breaker">Circuit Breaker</option>
                <option value="Multiple">Multiple (see notes)</option>
              </select>
              </div>
            </div>
            
          {/* Known Unknowns */}
            <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Known Unknowns</label>
            <p className="text-gray-500 text-sm mb-2">
              Document any dependencies or components that are not fully characterized in this SBOM
            </p>
            
            <div className="flex flex-wrap gap-2 mb-2">
                {currentDocument.knownUnknowns.map((item, index) => (
                <div key={index} className="bg-gray-100 rounded-full px-3 py-1 text-sm flex items-center">
                  <span>{item}</span>
                    <button
                      onClick={() => handleRemoveKnownUnknown(index)}
                    className="ml-2 text-gray-500 hover:text-red-600"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    </button>
                  </div>
                ))}
            </div>
            
            <div className="flex">
              <input
                type="text"
                placeholder="Add a known unknown"
                id="knownUnknown"
                className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddKnownUnknown();
                  }
                }}
              />
                <button 
                onClick={handleAddKnownUnknown}
                className="ml-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
              >
                Add
                </button>
            </div>
              </div>
              
          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={currentDocument.notes}
              onChange={(e) => setCurrentDocument({...currentDocument, notes: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              rows={4}
              placeholder="Additional notes about this SBOM document"
            ></textarea>
            </div>
            
          {/* Buttons */}
          <div className="flex justify-end space-x-3">
              <button 
              onClick={() => setActiveTab('registry')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button 
                onClick={editMode ? handleUpdateDocument : handleAddDocument}
              disabled={!currentDocument.name || !currentDocument.version || !currentDocument.supplier}
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
              {editMode ? 'Update Document' : 'Create Document'}
              </button>
            </div>
          </div>
        )}

      {/* Component Form */}
        {activeTab === 'component' && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 animate-fadeIn">
          <h3 className="text-xl font-semibold mb-6">{editMode ? 'Edit Component' : 'Add Component to SBOM'}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Component Name*</label>
                <input 
                  type="text"
                  value={currentComponent.name}
                  onChange={(e) => setCurrentComponent({...currentComponent, name: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="e.g., React"
                />
              </div>
              
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Version*</label>
                <input 
                  type="text"
                  value={currentComponent.version}
                  onChange={(e) => setCurrentComponent({...currentComponent, version: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="e.g., 18.2.0"
                />
              </div>
              
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier*</label>
                <input 
                  type="text"
                  value={currentComponent.supplier}
                  onChange={(e) => setCurrentComponent({...currentComponent, supplier: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="e.g., Facebook Inc."
                />
              </div>
              
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License*</label>
                <input 
                  type="text"
                  value={currentComponent.license}
                  onChange={(e) => setCurrentComponent({...currentComponent, license: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="e.g., MIT License"
                />
              </div>
              
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cryptographic Hash*</label>
                <input 
                  type="text"
                  value={currentComponent.cryptographicHash}
                  onChange={(e) => setCurrentComponent({...currentComponent, cryptographicHash: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="e.g., sha256:e55d8ce215c96a63ef1d457cc152b8fc..."
                />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                value={currentComponent.description}
                onChange={(e) => setCurrentComponent({...currentComponent, description: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                rows={3}
                placeholder="Brief description of the component's purpose"
              ></textarea>
              </div>
            </div>
            
          {/* Buttons */}
          <div className="flex justify-end space-x-3">
              <button 
              onClick={() => setActiveTab('registry')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button 
                onClick={editMode ? handleUpdateComponent : handleAddComponent}
              disabled={!currentComponent.name || !currentComponent.version || !currentComponent.supplier || !currentComponent.license || !currentComponent.cryptographicHash}
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editMode ? 'Update Component' : 'Add Component'}
              </button>
            </div>
          </div>
        )}

      <CreatorFooter />
    </div>
  );
} 