'use client';

import { useState, useEffect } from 'react';
import { 
  SBOMDocument, 
  SBOMComponent, 
  SBOMRegistry 
} from '../app/types';

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

export default function SBOMManagement() {
  const [registry, setRegistry] = useState<SBOMRegistry>({
    sbomDocuments: [],
    criticalSystems: [],
  });
  const [currentDocument, setCurrentDocument] = useState<SBOMDocument>(DEFAULT_SBOM_DOCUMENT);
  const [currentComponent, setCurrentComponent] = useState<SBOMComponent>(DEFAULT_SBOM_COMPONENT);
  const [activeTab, setActiveTab] = useState<'registry' | 'document' | 'component'>('registry');
  const [editMode, setEditMode] = useState<boolean>(false);
  const [criticalSystem, setCriticalSystem] = useState<string>('');

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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">SBOM Management for CSCRF SEBI Entities</h1>
      
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
          </div>

          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-semibold">SBOM Documents</h2>
            <div>
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
                  <th className="px-4 py-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {registry.sbomDocuments.map(doc => (
                  <tr key={doc.id}>
                    <td className="px-4 py-2 border">{doc.name}</td>
                    <td className="px-4 py-2 border">{doc.version}</td>
                    <td className="px-4 py-2 border">{doc.supplier}</td>
                    <td className="px-4 py-2 border">{doc.lastUpdated}</td>
                    <td className="px-4 py-2 border">{doc.components.length}</td>
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
                ))}
                {registry.sbomDocuments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-2 border text-center text-gray-500 italic">
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input 
                type="text"
                className="w-full px-3 py-2 border rounded"
                value={currentDocument.name}
                onChange={(e) => setCurrentDocument({...currentDocument, name: e.target.value})}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Version *</label>
              <input 
                type="text"
                className="w-full px-3 py-2 border rounded"
                value={currentDocument.version}
                onChange={(e) => setCurrentDocument({...currentDocument, version: e.target.value})}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label>
              <input 
                type="text"
                className="w-full px-3 py-2 border rounded"
                value={currentDocument.supplier}
                onChange={(e) => setCurrentDocument({...currentDocument, supplier: e.target.value})}
                required
              />
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input 
                type="text"
                className="w-full px-3 py-2 border rounded"
                value={currentComponent.name}
                onChange={(e) => setCurrentComponent({...currentComponent, name: e.target.value})}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Version *</label>
              <input 
                type="text"
                className="w-full px-3 py-2 border rounded"
                value={currentComponent.version}
                onChange={(e) => setCurrentComponent({...currentComponent, version: e.target.value})}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <input 
                type="text"
                className="w-full px-3 py-2 border rounded"
                value={currentComponent.supplier}
                onChange={(e) => setCurrentComponent({...currentComponent, supplier: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License</label>
              <input 
                type="text"
                className="w-full px-3 py-2 border rounded"
                placeholder="e.g., MIT, Apache 2.0"
                value={currentComponent.license}
                onChange={(e) => setCurrentComponent({...currentComponent, license: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cryptographic Hash</label>
              <input 
                type="text"
                className="w-full px-3 py-2 border rounded"
                placeholder="SHA-256 hash"
                value={currentComponent.cryptographicHash}
                onChange={(e) => setCurrentComponent({...currentComponent, cryptographicHash: e.target.value})}
              />
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
    </div>
  );
} 