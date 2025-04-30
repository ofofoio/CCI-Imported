'use client';

import { useState, useEffect } from 'react';
import { 
  SBOMDocument, 
  SBOMComponent, 
  SBOMRegistry 
} from '../app/types';

interface SBOMManagementProps {
  organizationName: string;
  onBack?: () => void;
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

export default function SBOMManagement({ organizationName, onBack }: SBOMManagementProps) {
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
    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8 animate-fadeIn">
      <div className="p-6 bg-black border-b flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Software Bill of Materials (SBOM) Management</h2>
        {onBack && (
          <button 
            onClick={onBack}
            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back
          </button>
        )}
      </div>
      
      <div className="p-6">
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-md">
          <h3 className="text-md font-semibold text-blue-800 mb-1">SBOM for {organizationName}</h3>
          <p className="text-sm text-blue-700">
            A Software Bill of Materials (SBOM) is a formal record containing the details and supply chain relationships of various components used in building software. 
            SBOMs are critical for compliance with SEBI CSCRF and other security frameworks.
          </p>
          <button 
            className="mt-2 text-blue-700 underline text-sm font-medium flex items-center"
            onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            View SBOM Guide
          </button>
        </div>

        <div className="mb-6">
          <div className="flex space-x-4 mb-4">
            <button 
              className={`px-4 py-2 font-semibold rounded ${activeTab === 'registry' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              onClick={() => setActiveTab('registry')}
            >
              SBOM Registry
            </button>
            <button 
              className={`px-4 py-2 font-semibold rounded ${activeTab === 'document' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              onClick={() => {
                if (editMode || currentDocument.id) {
                  setActiveTab('document');
                } else {
                  setCurrentDocument(DEFAULT_SBOM_DOCUMENT);
                  setActiveTab('document');
                }
              }}
            >
              {editMode ? 'Edit SBOM Document' : 'New SBOM Document'}
            </button>
            {activeTab === 'document' && (
              <button 
                className={`px-4 py-2 font-semibold rounded ${(activeTab as string) === 'component' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                onClick={() => {
                  if (editMode && currentComponent.id) {
                    setActiveTab('component');
                  } else {
                    setCurrentComponent(DEFAULT_SBOM_COMPONENT);
                    setActiveTab('component');
                  }
                }}
              >
                {editMode && currentComponent.id ? 'Edit Component' : 'Add Component'}
              </button>
            )}
          </div>
        </div>

        {activeTab === 'registry' && (
          <div>
            <div className="mb-6 p-4 border rounded bg-gray-50">
              <h2 className="text-xl font-semibold mb-4">Critical Systems</h2>
              <p className="mb-4 text-sm">
                According to SEBI CSCRF guidelines, SBOMs are mandatory for critical systems. List your critical systems here.
              </p>
              
              <div className="flex mb-4">
                <input
                  type="text"
                  className="flex-grow px-3 py-2 border rounded"
                  placeholder="Enter critical system name"
                  value={criticalSystem}
                  onChange={(e) => setCriticalSystem(e.target.value)}
                />
                <button
                  className="ml-2 px-4 py-2 bg-blue-600 text-white rounded"
                  onClick={handleAddCriticalSystem}
                >
                  Add
                </button>
              </div>
              
              <div className="space-y-2">
                {registry.criticalSystems.map((system, index) => (
                  <div key={index} className="flex items-center bg-white p-2 rounded border">
                    <span className="flex-grow">{system}</span>
                    <button
                      className="text-red-600"
                      onClick={() => handleRemoveCriticalSystem(system)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {registry.criticalSystems.length === 0 && (
                  <p className="text-gray-500 italic">No critical systems added yet</p>
                )}
              </div>
              
              {registry.criticalSystems.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-sm">SBOM Coverage:</span>
                    <span className="text-sm">
                      {registry.sbomDocuments.length}/{registry.criticalSystems.length} systems
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${registry.sbomDocuments.length >= registry.criticalSystems.length ? 'bg-green-600' : 'bg-yellow-500'}`}
                      style={{ width: `${Math.min(100, (registry.sbomDocuments.length / Math.max(1, registry.criticalSystems.length)) * 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs mt-1 text-gray-600">
                    {registry.sbomDocuments.length >= registry.criticalSystems.length 
                      ? '✓ All critical systems have SBOMs' 
                      : `${registry.criticalSystems.length - registry.sbomDocuments.length} critical systems need SBOMs`}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-semibold">SBOM Documents</h2>
              <div>
                <button
                  className="px-4 py-2 bg-purple-600 text-white rounded mr-2"
                  onClick={loadSampleData}
                >
                  Load Sample Data
                </button>
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded mr-2"
                  onClick={importSBOM}
                >
                  Import SBOM
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                  onClick={() => {
                    setCurrentDocument(DEFAULT_SBOM_DOCUMENT);
                    setEditMode(false);
                    setActiveTab('document');
                  }}
                >
                  Create New SBOM
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 border">Name</th>
                    <th className="px-4 py-2 border">Version</th>
                    <th className="px-4 py-2 border">Supplier</th>
                    <th className="px-4 py-2 border">Last Updated</th>
                    <th className="px-4 py-2 border">Components</th>
                    <th className="px-4 py-2 border">Completion</th>
                    <th className="px-4 py-2 border">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {registry.sbomDocuments.map(doc => {
                    const completionPercentage = calculateDocumentCompletion(doc);
                    return (
                      <tr key={doc.id}>
                        <td className="px-4 py-2 border">{doc.name}</td>
                        <td className="px-4 py-2 border">{doc.version}</td>
                        <td className="px-4 py-2 border">{doc.supplier}</td>
                        <td className="px-4 py-2 border">{doc.lastUpdated}</td>
                        <td className="px-4 py-2 border">{doc.components.length}</td>
                        <td className="px-4 py-2 border">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                              <div 
                                className={`h-2.5 rounded-full ${getCompletionColor(completionPercentage)}`}
                                style={{ width: `${completionPercentage}%` }}
                              ></div>
                            </div>
                            <span className="text-xs whitespace-nowrap">{completionPercentage}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 border">
                          <button
                            className="text-blue-600 mr-2"
                            onClick={() => handleEditDocument(doc.id)}
                          >
                            Edit
                          </button>
                          <button
                            className="text-green-600 mr-2"
                            onClick={() => exportSBOM(doc)}
                          >
                            Export
                          </button>
                          <button
                            className="text-red-600"
                            onClick={() => handleDeleteDocument(doc.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {registry.sbomDocuments.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-2 border text-center text-gray-500 italic">
                        No SBOM documents found. Create your first one!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'document' && (
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">{editMode ? 'Edit SBOM Document' : 'New SBOM Document'}</h2>
            
            {/* Progress indicator */}
            <div className="mb-6 p-3 bg-gray-50 rounded border">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-sm">Document Completion:</span>
                <span className="text-sm">{calculateDocumentCompletion(currentDocument)}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${getCompletionColor(calculateDocumentCompletion(currentDocument))}`}
                  style={{ width: `${calculateDocumentCompletion(currentDocument)}%` }}
                ></div>
              </div>
              <div className="flex mt-2 text-xs text-gray-500 justify-between flex-wrap">
                <span className={currentDocument.name ? "text-green-600" : "text-red-500"}>Name*</span>
                <span className={currentDocument.version ? "text-green-600" : "text-red-500"}>Version*</span>
                <span className={currentDocument.supplier ? "text-green-600" : "text-red-500"}>Supplier*</span>
                <span className={currentDocument.encryptionUsed ? "text-green-600" : "text-gray-500"}>Encryption</span>
                <span className={currentDocument.accessControl ? "text-green-600" : "text-gray-500"}>Access Control</span>
                <span className={currentDocument.errorHandlingMethod ? "text-green-600" : "text-gray-500"}>Error Handling</span>
                <span className={currentDocument.updateFrequency ? "text-green-600" : "text-gray-500"}>Update Frequency</span>
                <span className={currentDocument.components.length > 0 ? "text-green-600" : "text-gray-500"}>Components</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  className={`w-full px-3 py-2 border rounded ${!currentDocument.name ? 'border-red-300 bg-red-50' : ''}`}
                  value={currentDocument.name}
                  onChange={(e) => setCurrentDocument({...currentDocument, name: e.target.value})}
                  required
                />
                {!currentDocument.name && (
                  <p className="mt-1 text-sm text-red-500">Name is required</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Version <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  className={`w-full px-3 py-2 border rounded ${!currentDocument.version ? 'border-red-300 bg-red-50' : ''}`}
                  value={currentDocument.version}
                  onChange={(e) => setCurrentDocument({...currentDocument, version: e.target.value})}
                  placeholder="e.g., 1.0.0, 2.5.3, v3.2"
                  required
                />
                {!currentDocument.version && (
                  <p className="mt-1 text-sm text-red-500">Version is required</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier Name <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  className={`w-full px-3 py-2 border rounded ${!currentDocument.supplier ? 'border-red-300 bg-red-50' : ''}`}
                  value={currentDocument.supplier}
                  onChange={(e) => setCurrentDocument({...currentDocument, supplier: e.target.value})}
                  required
                />
                {!currentDocument.supplier && (
                  <p className="mt-1 text-sm text-red-500">Supplier is required</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Created</label>
                <input 
                  type="date"
                  className="w-full px-3 py-2 border rounded"
                  value={currentDocument.dateCreated}
                  onChange={(e) => setCurrentDocument({...currentDocument, dateCreated: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                <input 
                  type="date"
                  className="w-full px-3 py-2 border rounded"
                  value={currentDocument.lastUpdated}
                  onChange={(e) => setCurrentDocument({...currentDocument, lastUpdated: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Update Frequency</label>
                <input 
                  type="text"
                  className="w-full px-3 py-2 border rounded"
                  placeholder="e.g., Monthly, Quarterly"
                  value={currentDocument.updateFrequency}
                  onChange={(e) => setCurrentDocument({...currentDocument, updateFrequency: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Encryption Used</label>
                <input 
                  type="text"
                  className="w-full px-3 py-2 border rounded"
                  placeholder="e.g., AES-256"
                  value={currentDocument.encryptionUsed}
                  onChange={(e) => setCurrentDocument({...currentDocument, encryptionUsed: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Access Control</label>
                <input 
                  type="text"
                  className="w-full px-3 py-2 border rounded"
                  placeholder="e.g., Role-based access control"
                  value={currentDocument.accessControl}
                  onChange={(e) => setCurrentDocument({...currentDocument, accessControl: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Error Handling Method</label>
                <input 
                  type="text"
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Methods for accommodating occasional incidental errors"
                  value={currentDocument.errorHandlingMethod}
                  onChange={(e) => setCurrentDocument({...currentDocument, errorHandlingMethod: e.target.value})}
                />
              </div>
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Known Unknowns</label>
                <button 
                  className="text-sm text-blue-600"
                  onClick={handleAddKnownUnknown}
                >
                  + Add Known Unknown
                </button>
              </div>
              <div className="space-y-2">
                {currentDocument.knownUnknowns.map((item, index) => (
                  <div key={index} className="flex items-center bg-gray-50 p-2 rounded border">
                    <span className="flex-grow">{item}</span>
                    <button
                      className="text-red-600"
                      onClick={() => handleRemoveKnownUnknown(index)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {currentDocument.knownUnknowns.length === 0 && (
                  <p className="text-gray-500 italic">No known unknowns added yet</p>
                )}
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea 
                className="w-full px-3 py-2 border rounded h-24"
                placeholder="Additional notes about this SBOM"
                value={currentDocument.notes || ''}
                onChange={(e) => setCurrentDocument({...currentDocument, notes: e.target.value})}
              />
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Components</h3>
                <button 
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                  onClick={() => {
                    setCurrentComponent(DEFAULT_SBOM_COMPONENT);
                    setEditMode(false);
                    setActiveTab('component');
                  }}
                >
                  Add Component
                </button>
              </div>
              
              {currentDocument.components.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-3 py-2 border">Name</th>
                        <th className="px-3 py-2 border">Version</th>
                        <th className="px-3 py-2 border">Supplier</th>
                        <th className="px-3 py-2 border">License</th>
                        <th className="px-3 py-2 border">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentDocument.components.map(comp => (
                        <tr key={comp.id}>
                          <td className="px-3 py-2 border">{comp.name}</td>
                          <td className="px-3 py-2 border">{comp.version}</td>
                          <td className="px-3 py-2 border">{comp.supplier}</td>
                          <td className="px-3 py-2 border">{comp.license}</td>
                          <td className="px-3 py-2 border">
                            <button
                              className="text-blue-600 mr-2"
                              onClick={() => handleEditComponent(comp.id)}
                            >
                              Edit
                            </button>
                            <button
                              className="text-red-600"
                              onClick={() => handleDeleteComponent(comp.id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 italic">No components added yet</p>
              )}
            </div>
            
            <div className="flex justify-end space-x-4">
              <button 
                className="px-4 py-2 bg-gray-200 rounded"
                onClick={() => {
                  setCurrentDocument(DEFAULT_SBOM_DOCUMENT);
                  setEditMode(false);
                  setActiveTab('registry');
                }}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={editMode ? handleUpdateDocument : handleAddDocument}
              >
                {editMode ? 'Update SBOM Document' : 'Save SBOM Document'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'component' && (
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">{editMode ? 'Edit Component' : 'Add Component'}</h2>
            
            {/* Component completion tracker */}
            <div className="mb-6 p-3 bg-gray-50 rounded border">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-sm">Component Details Completion:</span>
                <span className="text-sm">{calculateComponentCompletion(currentComponent)}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${getCompletionColor(calculateComponentCompletion(currentComponent))}`}
                  style={{ width: `${calculateComponentCompletion(currentComponent)}%` }}
                ></div>
              </div>
              <div className="flex mt-2 text-xs text-gray-500 justify-between flex-wrap">
                <span className={currentComponent.name ? "text-green-600" : "text-red-500"}>Name*</span>
                <span className={currentComponent.version ? "text-green-600" : "text-red-500"}>Version*</span>
                <span className={currentComponent.supplier ? "text-green-600" : "text-gray-500"}>Supplier</span>
                <span className={currentComponent.license ? "text-green-600" : "text-gray-500"}>License</span>
                <span className={currentComponent.cryptographicHash ? "text-green-600" : "text-gray-500"}>Hash</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  className={`w-full px-3 py-2 border rounded ${!currentComponent.name ? 'border-red-300 bg-red-50' : ''}`}
                  value={currentComponent.name}
                  onChange={(e) => setCurrentComponent({...currentComponent, name: e.target.value})}
                  required
                />
                {!currentComponent.name && (
                  <p className="mt-1 text-sm text-red-500">Component name is required</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Version <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  className={`w-full px-3 py-2 border rounded ${!currentComponent.version ? 'border-red-300 bg-red-50' : ''}`}
                  value={currentComponent.version}
                  onChange={(e) => setCurrentComponent({...currentComponent, version: e.target.value})}
                  placeholder="e.g., 1.0.0, 2.5.3, v3.2"
                  required
                />
                {!currentComponent.version && (
                  <p className="mt-1 text-sm text-red-500">Component version is required</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  className={`w-full px-3 py-2 border rounded ${!currentComponent.supplier ? 'border-red-300 bg-red-50' : ''}`}
                  value={currentComponent.supplier}
                  onChange={(e) => setCurrentComponent({...currentComponent, supplier: e.target.value})}
                  required
                />
                {!currentComponent.supplier && (
                  <p className="mt-1 text-sm text-red-500">Supplier is required</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  className={`w-full px-3 py-2 border rounded ${!currentComponent.license ? 'border-red-300 bg-red-50' : ''}`}
                  value={currentComponent.license}
                  onChange={(e) => setCurrentComponent({...currentComponent, license: e.target.value})}
                  required
                />
                {!currentComponent.license && (
                  <p className="mt-1 text-sm text-red-500">License is required</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cryptographic Hash <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  className={`w-full px-3 py-2 border rounded ${!currentComponent.cryptographicHash ? 'border-red-300 bg-red-50' : ''}`}
                  value={currentComponent.cryptographicHash}
                  onChange={(e) => setCurrentComponent({...currentComponent, cryptographicHash: e.target.value})}
                  required
                />
                {!currentComponent.cryptographicHash && (
                  <p className="mt-1 text-sm text-red-500">Cryptographic hash is required</p>
                )}
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                className="w-full px-3 py-2 border rounded h-24"
                placeholder="Component description"
                value={currentComponent.description || ''}
                onChange={(e) => setCurrentComponent({...currentComponent, description: e.target.value})}
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Dependencies</label>
              <p className="text-sm text-gray-600 mb-2">
                If this component depends on other components in this SBOM, select them below:
              </p>
              <div className="space-y-2">
                {currentDocument.components
                  .filter(comp => comp.id !== currentComponent.id)
                  .map(comp => (
                  <div key={comp.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`dep-${comp.id}`}
                      checked={currentComponent.dependencies.includes(comp.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCurrentComponent({
                            ...currentComponent,
                            dependencies: [...currentComponent.dependencies, comp.id]
                          });
                        } else {
                          setCurrentComponent({
                            ...currentComponent,
                            dependencies: currentComponent.dependencies.filter(id => id !== comp.id)
                          });
                        }
                      }}
                      className="mr-2"
                    />
                    <label htmlFor={`dep-${comp.id}`}>{comp.name} ({comp.version})</label>
                  </div>
                ))}
                {currentDocument.components.length <= 1 && (
                  <p className="text-gray-500 italic">No other components available to select as dependencies</p>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-4">
              <button 
                className="px-4 py-2 bg-gray-200 rounded"
                onClick={() => {
                  setCurrentComponent(DEFAULT_SBOM_COMPONENT);
                  setEditMode(false);
                  setActiveTab('document');
                }}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={editMode ? handleUpdateComponent : handleAddComponent}
              >
                {editMode ? 'Update Component' : 'Add Component'}
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="font-semibold text-lg mb-2">SEBI CSCRF SBOM Requirements</h3>
          <p className="mb-4 text-sm">
            According to SEBI's CSCRF Guidelines, SBOMs must include:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li>License information</li>
            <li>Name of the supplier</li>
            <li>All primary components with transitive dependencies (including third-party and open-source)</li>
            <li>Encryption used</li>
            <li>Cryptographic hash of the components</li>
            <li>Frequency of updates</li>
            <li>Known unknowns (where a SBOM does not include a full dependency graph)</li>
            <li>Access control</li>
            <li>Methods for accommodating occasional incidental errors</li>
          </ul>
        </div>

        <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="font-semibold text-xl mb-4">SBOM Creation Guide</h3>
          
          <div className="mb-6">
            <h4 className="font-semibold text-lg text-blue-700 mb-2">Getting Started with SBOMs</h4>
            <p className="mb-2">For a quick start, click the "Load Sample Data" button to populate your registry with example SBOMs that follow SEBI CSCRF guidelines.</p>
            <p>Sample data includes critical systems like "Core Trading Engine" and "Settlement Systems" along with complete SBOM documents that show proper implementation.</p>
          </div>
          
          <div className="mb-6">
            <h4 className="font-semibold text-lg text-blue-700 mb-2">Step-by-Step SBOM Creation</h4>
            <ol className="list-decimal pl-6 space-y-3">
              <li>
                <span className="font-semibold">Identify your critical systems</span>
                <p className="text-sm mt-1">Start by listing your critical systems in the "Critical Systems" section. According to SEBI CSCRF Standard 5 under GV.SC (Cybersecurity Supply Chain Risk Management), SBOMs are mandatory for all critical systems.</p>
              </li>
              <li>
                <span className="font-semibold">Create an SBOM document for each critical system</span>
                <p className="text-sm mt-1">Click "Create New SBOM" and fill in the basic information including name, version, and supplier name. Set the date created, last updated, and update frequency fields.</p>
              </li>
              <li>
                <span className="font-semibold">Document security controls</span>
                <p className="text-sm mt-1">Complete the encryption, access control, and error handling fields as required by SEBI CSCRF. These details help assess the security posture of the software.</p>
              </li>
              <li>
                <span className="font-semibold">Add components</span>
                <p className="text-sm mt-1">Click "Add Component" to add each software component. For each component, include:</p>
                <ul className="list-disc pl-6 text-sm mt-1">
                  <li>Name and version (required)</li>
                  <li>Supplier information</li>
                  <li>License information</li>
                  <li>Cryptographic hash (SHA-256 recommended)</li>
                  <li>Dependencies on other components</li>
                </ul>
              </li>
              <li>
                <span className="font-semibold">Document known unknowns</span>
                <p className="text-sm mt-1">Use the "Add Known Unknown" button to document areas where dependency information might be incomplete, such as dynamically loaded libraries or nested dependencies that aren't fully mapped.</p>
              </li>
              <li>
                <span className="font-semibold">Save and maintain your SBOM</span>
                <p className="text-sm mt-1">Click "Save SBOM Document" when complete. Remember to update SBOMs whenever components change, especially after patching vulnerabilities like Log4Shell.</p>
              </li>
            </ol>
          </div>
          
          <div className="mb-6">
            <h4 className="font-semibold text-lg text-blue-700 mb-2">Best Practices</h4>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <span className="font-semibold">Component Details</span>
                <p className="text-sm mt-1">For each component, provide as much detail as possible, especially for open-source dependencies with known vulnerabilities (like Apache Log4j).</p>
              </li>
              <li>
                <span className="font-semibold">Regular Updates</span>
                <p className="text-sm mt-1">Update your SBOM whenever software components change, especially after security patches are applied.</p>
              </li>
              <li>
                <span className="font-semibold">Include Transitive Dependencies</span>
                <p className="text-sm mt-1">Document not just direct dependencies but also indirect (transitive) dependencies where possible.</p>
              </li>
              <li>
                <span className="font-semibold">SBOM Generation Tools</span>
                <p className="text-sm mt-1">Consider using automated tools like CycloneDX, SPDX, or Syft to generate SBOMs for complex systems, then import them using the "Import SBOM" button.</p>
              </li>
              <li>
                <span className="font-semibold">Vendor Requirements</span>
                <p className="text-sm mt-1">As per SEBI CSCRF, make SBOMs a requirement for all new software procurements and obtain them from vendors for existing critical systems.</p>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-lg text-blue-700 mb-2">Sample Component List for Trading Platforms</h4>
            <p className="mb-2 text-sm">A typical trading platform might include the following components that should be documented in an SBOM:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Order matching engine software libraries</li>
              <li>Market data processing components</li>
              <li>Messaging middleware (Kafka, RabbitMQ)</li>
              <li>Database systems (PostgreSQL, MongoDB)</li>
              <li>Authentication libraries (OpenID, JWT)</li>
              <li>Encryption libraries (OpenSSL, BouncyCastle)</li>
              <li>Web frameworks (React, Angular, Spring)</li>
              <li>Logging frameworks (Log4j, SLF4J)</li>
              <li>API gateways and load balancers</li>
              <li>Time synchronization libraries</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 