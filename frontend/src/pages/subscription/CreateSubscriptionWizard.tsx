import React, { useState } from 'react';
import { useCatalogModules, useDirectAssignSubscription } from '@/features/tenancy/subscription/hooks/useSubscription';
import { Button } from '@/components/ui/Button';

export const CreateSubscriptionWizard = ({ businessUnitId, onClose }: { businessUnitId: string, onClose: () => void }) => {
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  
  // New fields for direct assignment
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
  );
  const [status, setStatus] = useState('ACTIVE');

  const { data: modules, isLoading } = useCatalogModules();
  const assignMutation = useDirectAssignSubscription(businessUnitId);

  const toggleFeature = (id: string) => {
    setSelectedFeatures(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const handleAssign = async () => {
    if (selectedFeatures.length === 0) return;
    await assignMutation.mutateAsync({ 
      featureIds: selectedFeatures, 
      startDate, 
      endDate, 
      status 
    });
    onClose();
  };

  if (isLoading) return <div className="p-8 text-center">Loading Catalog...</div>;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-6 border-b dark:border-gray-800 flex justify-between items-center bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white">
          <h2 className="text-2xl font-bold">Assign Subscription</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Subscription Settings */}
          <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border dark:border-gray-800 space-y-4">
            <h3 className="font-bold text-lg border-b pb-2 dark:border-gray-700">Subscription Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Start Date</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium">End Date</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium">Status</label>
                <select 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 text-sm"
                >
                  <option value="ACTIVE">Active (Provision Now)</option>
                  <option value="DRAFT">Draft (Do Not Provision)</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>
            </div>
          </div>

          {/* Module Selection */}
          <div className="space-y-6">
            <h3 className="font-bold text-lg">Select Modules & Features</h3>
            {modules?.map((module: any) => (
              <div key={module.id} className="border dark:border-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-white dark:bg-gray-900 px-5 py-4 border-b dark:border-gray-800">
                  <h4 className="font-bold text-lg text-violet-700 dark:text-violet-400">{module.name}</h4>
                  <p className="text-sm text-gray-500">{module.description}</p>
                </div>
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/50 dark:bg-gray-800/20">
                  {module.features?.map((feature: any) => {
                    const isSelected = selectedFeatures.includes(feature.id);
                    return (
                      <div 
                        key={feature.id} 
                        onClick={() => toggleFeature(feature.id)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                          isSelected 
                            ? 'border-violet-600 bg-violet-50 dark:bg-violet-900/20 shadow-sm' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-violet-300 bg-white dark:bg-gray-900'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-violet-600 border-violet-600' : 'border-gray-300'}`}>
                            {isSelected && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                          </div>
                          <div>
                            <span className={`font-semibold ${isSelected ? 'text-violet-900 dark:text-violet-100' : 'text-gray-900 dark:text-gray-100'}`}>
                              {feature.name}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">{feature.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

        </div>

        <div className="p-6 border-t dark:border-gray-800 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            className="bg-violet-600 hover:bg-violet-700 text-white"
            onClick={handleAssign} 
            disabled={selectedFeatures.length === 0 || assignMutation.isPending}
          >
            {assignMutation.isPending ? 'Assigning...' : 'Assign Subscription'}
          </Button>
        </div>
      </div>
    </div>
  );
};
