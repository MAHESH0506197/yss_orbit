// yss_orbit/frontend/src/pages/hrms/EmployeeFormPage.tsx
/**
 * EmployeeFormPage — Standalone page route for create/edit employee.
 * 
 * Route: /hrms/employees/new (create)
 * Route: /hrms/employees/:id/edit (edit)
 * 
 * Delegates to EmployeeFormDialog which contains all form logic,
 * validation (Zod), step management, and API mutations.
 * The dialog is rendered inline (always-open) rather than as a modal trigger.
 */
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, UserPlus, Edit3 } from 'lucide-react';
import { EmployeeFormDialog } from '@/features/hrms/components/employees/EmployeeFormDialog';
import { useEmployees } from '@/features/hrms/api/useEmployees';
import { Employee } from '@/features/hrms/types/employeeTypes';

export const EmployeeFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  // Load employee data when in edit mode
  // Note: id is not part of EmployeeFilters — cast as any to pass through for server-side filtering
  const { data: response } = useEmployees(isEditMode ? ({ id } as any) : undefined);
  const employee = isEditMode
    ? (response?.data as Employee[] | undefined)?.find(e => e.id === id) ?? null
    : null;

  // EmployeeFormDialog uses isOpen/onClose — we always keep it "open" on this page
  // and navigate back on close
  const handleClose = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Page Header */}
      <div className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card)/0.5)] backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <button
            onClick={handleClose}
            className="flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div className="h-5 w-px bg-[hsl(var(--border))]" />

          <div className="flex items-center gap-2">
            {isEditMode ? (
              <Edit3 size={18} className="text-[hsl(var(--primary))]" />
            ) : (
              <UserPlus size={18} className="text-[hsl(var(--primary))]" />
            )}
            <h1 className="text-base font-700 text-[hsl(var(--foreground))]">
              {isEditMode ? 'Edit Employee' : 'New Employee'}
            </h1>
          </div>
        </div>
      </div>

      {/* Form Dialog — rendered inline on this page (always open) */}
      {/* The Dialog's portal renders over the page; the back-nav on close returns to list */}
      <EmployeeFormDialog
        isOpen={true}
        onClose={handleClose}
        employee={employee}
      />
    </div>
  );
};
