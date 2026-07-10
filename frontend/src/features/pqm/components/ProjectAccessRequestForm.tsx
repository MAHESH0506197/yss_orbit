import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export interface ProjectAccessRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  availableProjects: any[]; // Projects the user doesn't have access to
}

export const ProjectAccessRequestForm: React.FC<ProjectAccessRequestFormProps> = ({ isOpen, onClose, availableProjects }) => {
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [justification, setJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProjectIds.length === 0) {
      alert("Please select at least one project");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/pqm/projects/request-access/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projects: selectedProjectIds,
          justification
        })
      });
      if (res.ok) {
        alert("Access requested successfully");
        onClose();
        setSelectedProjectIds([]);
        setJustification('');
      } else {
        alert("Failed to request access");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to request access");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleProject = (id: string) => {
    setSelectedProjectIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request Project Access" description="Select the projects you need access to and provide a justification.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Available Projects</label>
          <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-2 dark:border-gray-700">
            {availableProjects.length === 0 ? (
              <p className="text-sm text-gray-500">No projects available to request.</p>
            ) : (
              availableProjects.map(proj => (
                <div key={proj.id} className="flex items-center space-x-2 p-1">
                  <input 
                    type="checkbox"
                    id={`proj-${proj.id}`}
                    checked={selectedProjectIds.includes(proj.id)}
                    onChange={() => handleToggleProject(proj.id)}
                    className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                  />
                  <label htmlFor={`proj-${proj.id}`} className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer select-none">
                    {proj.name}
                  </label>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Justification</label>
          <textarea
            required
            className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            rows={3}
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Explain why you need access to these projects..."
          />
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
          <Button type="submit" loading={isSubmitting} disabled={selectedProjectIds.length === 0}>
            Request Access
          </Button>
        </div>
      </form>
    </Modal>
  );
};
