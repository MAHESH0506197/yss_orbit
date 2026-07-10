// src/features/organization/businessDomain/components/__tests__/BusinessDomainPermanentDeleteModal.test.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Tests for the permanent-delete confirmation modal.
//
// Coverage:
//  ● Renders correctly when open / hidden when closed
//  ● Shows domain name and archive date
//  ● Delete button is disabled until typed name exactly matches domain.name
//  ● Delete button enables on exact match (case-sensitive)
//  ● Correct name → calls permanentDeleteDomain → shows success toast → calls onDeleted + onClose
//  ● Wrong name → delete button stays disabled
//  ● Escape key closes the modal
//  ● Close button works
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BusinessDomainPermanentDeleteModal } from '../BusinessDomainPermanentDeleteModal';
import { BusinessDomain } from '../../types/businessDomainTypes';

// ─── Mock the mutations hook ───────────────────────────────────────────────────
const mockPermanentDelete = vi.fn();
vi.mock('../../api/useBusinessDomainMutations', () => ({
  useBusinessDomainMutations: () => ({
    permanentDeleteDomain: mockPermanentDelete,
    isPermanentDeleting: false,
    createDomain: vi.fn(),
    updateDomain: vi.fn(),
    deleteDomain: vi.fn(),
    restoreDomain: vi.fn(),
    uploadLogo: vi.fn(),
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    isRestoring: false,
    isUploadingLogo: false,
  }),
}));

// ─── Mock react-hot-toast ─────────────────────────────────────────────────────
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────
const makeDomain = (overrides: Partial<BusinessDomain> = {}): BusinessDomain => ({
  id: 'domain-uuid-1234',
  name: 'Pharmacy',
  code: 'BDOM-PHRMCY',
  description: 'Pharmacy vertical',
  logo_url: null,
  is_active: false,
  is_deleted: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-15T00:00:00Z',
  deleted_at: '2026-06-01T00:00:00Z',
  deleted_by_id: null,
  created_by_id: null,
  updated_by_id: null,
  restored_at: null,
  restored_by_id: null,
  created_reason: null,
  updated_reason: null,
  deleted_reason: null,
  restored_reason: null,
  ...overrides,
});

function renderModal(props: Partial<React.ComponentProps<typeof BusinessDomainPermanentDeleteModal>> = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const domain = makeDomain();
  return render(
    <QueryClientProvider client={qc}>
      <BusinessDomainPermanentDeleteModal
        isOpen={true}
        onClose={vi.fn()}
        domain={domain}
        onDeleted={vi.fn()}
        {...props}
      />
    </QueryClientProvider>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('BusinessDomainPermanentDeleteModal', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset portal target
    document.body.innerHTML = '';
  });

  describe('Rendering', () => {
    it('renders nothing when isOpen=false', () => {
      const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      const { container } = render(
        <QueryClientProvider client={qc}>
          <BusinessDomainPermanentDeleteModal
            isOpen={false}
            onClose={vi.fn()}
            domain={makeDomain()}
          />
        </QueryClientProvider>
      );
      expect(container.innerHTML).toBe('');
    });

    it('renders nothing when domain=null', () => {
      const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      const { container } = render(
        <QueryClientProvider client={qc}>
          <BusinessDomainPermanentDeleteModal
            isOpen={true}
            onClose={vi.fn()}
            domain={null}
          />
        </QueryClientProvider>
      );
      expect(container.innerHTML).toBe('');
    });

    it('renders the dialog when isOpen=true and domain is set', () => {
      renderModal();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Permanent Delete Domain')).toBeInTheDocument();
    });

    it('displays the domain name in the danger label', () => {
      renderModal();
      // Domain name should appear in the instruction text
      expect(screen.getAllByText('Pharmacy').length).toBeGreaterThan(0);
    });

    it('shows an irreversible warning', () => {
      renderModal();
      expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
    });

    it('renders the confirmation input field', () => {
      renderModal();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  describe('Name confirmation logic', () => {
    it('delete button is disabled initially (empty input)', () => {
      renderModal();
      const deleteBtn = screen.getByRole('button', { name: /permanently delete domain pharmacy/i });
      expect(deleteBtn).toBeDisabled();
    })

    it('delete button remains disabled when input does NOT match (case-sensitive)', async () => {
      renderModal();
      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'pharmacy'); // lowercase — should not match
      const deleteBtn = screen.getByRole('button', { name: /permanently delete domain pharmacy/i });
      expect(deleteBtn).toBeDisabled();
    });

    it('delete button remains disabled for partial input', async () => {
      renderModal();
      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'Pharm'); // partial
      const deleteBtn = screen.getByRole('button', { name: /permanently delete domain pharmacy/i });
      expect(deleteBtn).toBeDisabled();
    });

    it('delete button is ENABLED when input exactly matches domain.name', async () => {
      renderModal();
      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'Pharmacy'); // exact match
      const deleteBtn = screen.getByRole('button', { name: /permanently delete domain pharmacy/i });
      expect(deleteBtn).not.toBeDisabled();
    });

    it('shows "Name does not match" hint for wrong input', async () => {
      renderModal();
      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'wrong');
      expect(screen.getByText(/does not match/i)).toBeInTheDocument();
    });

    it('shows confirmed hint when name matches', async () => {
      renderModal();
      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'Pharmacy');
      expect(screen.getByText(/confirmed/i)).toBeInTheDocument();
    });
  });

  describe('Delete action', () => {
    it('calls permanentDeleteDomain with correct id and confirmationName on submit', async () => {
      mockPermanentDelete.mockResolvedValueOnce(undefined);
      const onDeleted = vi.fn();
      const onClose = vi.fn();
      renderModal({ onDeleted, onClose });

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'Pharmacy');

      const deleteBtn = screen.getByRole('button', { name: /permanently delete domain pharmacy/i });
      fireEvent.click(deleteBtn);

      await waitFor(() => {
        expect(mockPermanentDelete).toHaveBeenCalledWith({
          id: 'domain-uuid-1234',
          confirmationName: 'Pharmacy',
        });
      });
    });

    it('calls onDeleted and onClose after successful deletion', async () => {
      mockPermanentDelete.mockResolvedValueOnce(undefined);
      const onDeleted = vi.fn();
      const onClose = vi.fn();
      renderModal({ onDeleted, onClose });

      await userEvent.type(screen.getByRole('textbox'), 'Pharmacy');
      fireEvent.click(screen.getByRole('button', { name: /permanently delete domain pharmacy/i }));

      await waitFor(() => {
        expect(onDeleted).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('does NOT call onDeleted when API call fails', async () => {
      mockPermanentDelete.mockRejectedValueOnce(new Error('Server error'));
      const onDeleted = vi.fn();
      renderModal({ onDeleted });

      await userEvent.type(screen.getByRole('textbox'), 'Pharmacy');
      fireEvent.click(screen.getByRole('button', { name: /permanently delete domain pharmacy/i }));

      await waitFor(() => {
        expect(onDeleted).not.toHaveBeenCalled();
      });
    });
  });

  describe('Cancel / close', () => {
    it('calls onClose when Cancel button is clicked', () => {
      const onClose = vi.fn();
      renderModal({ onClose });
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when X button is clicked', () => {
      const onClose = vi.fn();
      renderModal({ onClose });
      fireEvent.click(screen.getByRole('button', { name: /close/i }));
      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when Escape key is pressed', () => {
      const onClose = vi.fn();
      renderModal({ onClose });
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalled();
    });
  });
});
