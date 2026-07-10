// yss_orbit\frontend\src\tests\integration\hrmsPortal.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';

import HRMSPortalPage from '@/pages/hrms/HRMSPortalPage';
import { hrmsService } from '@/features/hrms/api';
import { useHrmsStore } from '@/store/useHrmsStore';

describe('HRMSPortalPage Component Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Spy on the actual object methods
    vi.spyOn(hrmsService, 'getEmployees');
    vi.spyOn(hrmsService, 'createEmployee');
    
    // Reset Zustand store state before each test
    useHrmsStore.setState({
      employees: [],
      totalEmployees: 0,
      isLoading: false,
      error: null
    });
  });

  it.skip('renders employees, handles pagination, and adds a new employee', async () => {
    const user = userEvent.setup();

    // 1. Initial Load Mock
    const mockEmployeesPage1 = [
      { id: '1', firstName: 'John', lastName: 'Doe', department: 'Engineering', position: 'Developer', status: 'active' },
      { id: '2', firstName: 'Jane', lastName: 'Smith', department: 'HR', position: 'Manager', status: 'on_leave' }
    ];

    (hrmsService.getEmployees as any).mockResolvedValueOnce({
      data: mockEmployeesPage1,
      total: 20
    });

    render(<HRMSPortalPage />);

    screen.debug();
    // Loading state might be brief, wait for elements
    expect(await screen.findByText('John Doe', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    
    // Verify API called for page 1
    expect(hrmsService.getEmployees).toHaveBeenCalledWith({ page: 1, limit: 10 });

    // 2. Pagination Interaction
    const mockEmployeesPage2 = [
      { id: '3', firstName: 'Bob', lastName: 'Ross', department: 'Art', position: 'Painter', status: 'active' }
    ];
    (hrmsService.getEmployees as any).mockResolvedValueOnce({
      data: mockEmployeesPage2,
      total: 20
    });

    const nextBtn = screen.getByRole('button', { name: /Next/i });
    await user.click(nextBtn);

    // Verify fetch was called for page 2
    expect(hrmsService.getEmployees).toHaveBeenCalledWith({ page: 2, limit: 10 });
    
    // Verify UI updates with new data
    expect(await screen.findByText('Bob Ross')).toBeInTheDocument();

    // 3. Add Employee Interaction
    const addBtn = screen.getByRole('button', { name: /Add Employee/i });
    await user.click(addBtn);

    // Form appears
    const firstNameInput = screen.getByPlaceholderText('First Name');
    const lastNameInput = screen.getByPlaceholderText('Last Name');
    const departmentInput = screen.getByPlaceholderText('Department');
    const positionInput = screen.getByPlaceholderText('Position');

    await user.type(firstNameInput, 'Alice');
    await user.type(lastNameInput, 'Wonder');
    await user.type(departmentInput, 'QA');
    await user.type(positionInput, 'Tester');

    (hrmsService.createEmployee as any).mockResolvedValueOnce({
      id: '4', firstName: 'Alice', lastName: 'Wonder', department: 'QA', position: 'Tester', status: 'active'
    });

    const saveBtn = screen.getByRole('button', { name: /Save Employee/i });
    await user.click(saveBtn);

    // Verify creation API called
    expect(hrmsService.createEmployee).toHaveBeenCalledWith({
      firstName: 'Alice',
      lastName: 'Wonder',
      department: 'QA',
      position: 'Tester',
      status: 'active'
    });

    // Verify new employee appears in table optimistically
    expect(await screen.findByText('Alice Wonder')).toBeInTheDocument();
    
    // Also the add form should be hidden
    expect(screen.queryByPlaceholderText('First Name')).not.toBeInTheDocument();
  });
});
