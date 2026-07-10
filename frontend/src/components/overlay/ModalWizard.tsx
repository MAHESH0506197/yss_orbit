// yss_orbit\frontend\src\components\overlay\ModalWizard.tsx
import React, { useState } from 'react';
import { ModalRoot, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter, ModalOverlay, ModalPortal } from './Modal';
import { Button } from '../ui/Button';
import { Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  content: React.ReactNode;
  isValid?: boolean;
}

export interface ModalWizardProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  steps: WizardStep[];
  onComplete: () => void;
  isSubmitting?: boolean;
}

export const ModalWizard: React.FC<ModalWizardProps> = ({
  isOpen,
  onClose,
  title,
  description,
  steps,
  onComplete,
  isSubmitting = false,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  const currentStep = steps[currentStepIndex]!; // always in range: 0..steps.length-1

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStepIndex((i) => i + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStepIndex((i) => i - 1);
    }
  };

  // Reset state when closed
  React.useEffect(() => {
    if (!isOpen) {
      setTimeout(() => setCurrentStepIndex(0), 300);
    }
  }, [isOpen]);

  return (
    <ModalRoot open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalPortal>
        <ModalOverlay />
        <ModalContent className="sm:max-w-[600px]">
          <ModalHeader>
            <ModalTitle>{title}</ModalTitle>
            {description && <ModalDescription>{description}</ModalDescription>}
          </ModalHeader>

          {/* Stepper Header */}
          <div className="relative mt-4">
            <div className="absolute top-4 left-0 w-full h-0.5 bg-muted" />
            <div
              className="absolute top-4 left-0 h-0.5 bg-primary transition-all duration-300"
              style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
            />
            <div className="relative flex justify-between z-10">
              {steps.map((step, index) => {
                const isCompleted = index < currentStepIndex;
                const isCurrent = index === currentStepIndex;
                return (
                  <div key={step.id} className="flex flex-col items-center gap-2">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center border-2 bg-background transition-colors duration-300",
                        isCompleted ? "border-primary bg-primary text-primary-foreground" :
                        isCurrent ? "border-primary text-primary" : "border-muted text-muted-foreground"
                      )}
                    >
                      {isCompleted ? <Check className="w-4 h-4" /> : <span className="text-sm font-semibold">{index + 1}</span>}
                    </div>
                    <span className={cn(
                      "text-xs font-medium",
                      isCurrent || isCompleted ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="py-6 min-h-[250px]">
            <div className="mb-4">
              <h3 className="text-lg font-medium">{currentStep.title}</h3>
              {currentStep.description && (
                <p className="text-sm text-muted-foreground">{currentStep.description}</p>
              )}
            </div>
            {currentStep.content}
          </div>

          <ModalFooter>
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={isFirstStep || isSubmitting}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={currentStep.isValid === false || isSubmitting}
              loading={isSubmitting && isLastStep}
            >
              {isLastStep ? 'Complete' : 'Next'}
              {!isLastStep && <ChevronRight className="w-4 h-4 ml-2" />}
            </Button>
          </ModalFooter>
        </ModalContent>
      </ModalPortal>
    </ModalRoot>
  );
};
