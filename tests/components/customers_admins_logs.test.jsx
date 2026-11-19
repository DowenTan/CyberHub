import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Customers from '../../pages/Customers.jsx';
import Admins from '../../pages/Admins.jsx';
import Logs from '../../pages/Logs.jsx';
import { useDashboardStore } from '../../store/useDashboardStore.js';
import { INITIAL_CUSTOMERS, INITIAL_ADMINS, INITIAL_AUDIT_LOGS } from '../../store/initialDbData.js';

describe('Customers, Admins & Audit Logs Management Suite', () => {
  beforeEach(() => {
    // Reset store state to initial seed data
    useDashboardStore.setState({
      customers: [...INITIAL_CUSTOMERS],
      admins: [...INITIAL_ADMINS],
      auditLogs: [...INITIAL_AUDIT_LOGS],
      globalPricing: {
        diagnosticFee: 65.0,
      },
    });
  });

  describe('1. Customers Registry & 360 Risk Evaluation', () => {
    it('renders customer statistics, segment pills, and customer directory entries', () => {
      render(<Customers />);

      expect(screen.getByText(/Customers Directory & CRM/i)).toBeInTheDocument();
      expect(screen.getByText(/Total Registered Clients/i)).toBeInTheDocument();
      expect(screen.getByText(/High Value VIP Clients/i)).toBeInTheDocument();
      expect(screen.getByText(/Returning Customers/i)).toBeInTheDocument();

      // Verify customer names from initial seed data
      expect(screen.getByText('Tan Kia Yu')).toBeInTheDocument();
      expect(screen.getByText('Siti Nurhaliza')).toBeInTheDocument();
      expect(screen.getByText('Aisyah binti Rahman')).toBeInTheDocument();

      // Check customer segment badges
      expect(screen.getAllByText('High Value VIP').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Returning').length).toBeGreaterThanOrEqual(1);

      // Verify zero emojis
      const bodyText = document.body.textContent || '';
      expect(bodyText).not.toMatch(/[\uD83C-\uDBFF\uDC00-\uDFFF]/);
    });

    it('masks phone numbers by default and reveals them when toggle button is clicked', () => {
      render(<Customers />);

      // Masked initial state for Tan Kia Yu (+60 12-384 9102) matches masked pattern
      expect(screen.getByText(/\+60.*102/)).toBeInTheDocument();

      // Find reveal toggle button for Tan Kia Yu
      const revealButtons = screen.getAllByTitle(/Reveal phone number/i);
      expect(revealButtons.length).toBeGreaterThanOrEqual(1);

      fireEvent.click(revealButtons[0]);

      // Phone number should now be unmasked
      expect(screen.getByText(/\+60 12-384 9102|\+60 13-902 4411/)).toBeInTheDocument();
    });

    it('opens Customer 360 brief modal with appliance repair history and AI risk analysis', () => {
      render(<Customers />);

      const view360Buttons = screen.getAllByTitle(/View Customer 360 Profile/i);
      expect(view360Buttons.length).toBeGreaterThanOrEqual(1);

      fireEvent.click(view360Buttons[0]);

      // Verify 360 modal content
      expect(screen.getByText(/Customer 360 Profile:/i)).toBeInTheDocument();
      expect(screen.getByText(/Customer 360 Brief/i)).toBeInTheDocument();
      expect(screen.getByText(/Access is logged/i)).toBeInTheDocument();
    });

    it('opens Add Customer modal and allows adding a new customer profile', async () => {
      render(<Customers />);

      const addBtn = screen.getByText('Add New Customer');
      fireEvent.click(addBtn);

      expect(screen.getByText('Add New Customer', { selector: 'h3' })).toBeInTheDocument();

      // Fill in customer details
      const nameInput = screen.getByPlaceholderText(/e\.g\. Mohd Syakir bin Rosli/i);
      const emailInput = screen.getByPlaceholderText(/client@gmail\.com/i);
      const phoneInput = screen.getByPlaceholderText(/\+60 12-345 6789/i);

      fireEvent.change(nameInput, { target: { value: 'Ahmad Faiz' } });
      fireEvent.change(emailInput, { target: { value: 'ahmad.faiz@example.com' } });
      fireEvent.change(phoneInput, { target: { value: '+60 18-999 8877' } });

      const saveBtn = screen.getByText('Create Customer');
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByText('Ahmad Faiz')).toBeInTheDocument();
      });
    });
  });

  describe('2. Admins & Staff Governance', () => {
    it('renders admin team list, roles, branches, and MFA security status', () => {
      render(<Admins />);

      expect(screen.getByText(/Admin & Staff Administration/i)).toBeInTheDocument();
      expect(screen.getByText(/Superadmin Accounts/i)).toBeInTheDocument();
      expect(screen.getByText(/Active Staff Personnel/i)).toBeInTheDocument();

      // Check real DB admin users
      expect(screen.getByText('Prinz Eugen')).toBeInTheDocument();
      expect(screen.getAllByText(/Tan Kia Yu/i).length).toBeGreaterThanOrEqual(1);

      // Check MFA badge
      expect(screen.getAllByText('AAL2 Enforced').length).toBeGreaterThanOrEqual(1);

      // Verify zero emojis
      const bodyText = document.body.textContent || '';
      expect(bodyText).not.toMatch(/[\uD83C-\uDBFF\uDC00-\uDFFF]/);
    });

    it('toggles admin account status between active and suspended', async () => {
      render(<Admins />);

      // Find the suspend button for an active admin
      const suspendButtons = screen.getAllByTitle(/Suspend account access/i);
      expect(suspendButtons.length).toBeGreaterThanOrEqual(1);

      fireEvent.click(suspendButtons[0]);

      // Admin status in store should now be suspended
      await waitFor(() => {
        const admins = useDashboardStore.getState().admins;
        const targetAdmin = admins.find((a) => a.id === '70f3d356-93af-4490-9c5a-85e778762094' || a.role === 'admin');
        expect(targetAdmin?.status).toBe('suspended');
      });
    });
  });

  describe('3. Audit Logs, Actor Filters & Undo Mechanism', () => {
    it('renders audit action log entries and calculates actor statistics', () => {
      render(<Logs />);

      expect(screen.getByText(/System & Audit Action Logs/i)).toBeInTheDocument();
      expect(screen.getByText(/Total Action Logs/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Done by Superadmin/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Done by Admin/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Reversible Actions/i)).toBeInTheDocument();

      // Check log actions from initial dataset
      expect(screen.getByText('global_settings.update')).toBeInTheDocument();
      expect(screen.getByText('spare_parts.markup_update')).toBeInTheDocument();

      // Verify zero emojis
      const bodyText = document.body.textContent || '';
      expect(bodyText).not.toMatch(/[\uD83C-\uDBFF\uDC00-\uDFFF]/);
    });

    it('filters log entries by actor role: Done by Superadmin vs Done by Admin', () => {
      render(<Logs />);

      // Initially All Actors is active and both superadmin and admin logs appear
      expect(screen.getByText('global_settings.update')).toBeInTheDocument();
      expect(screen.getByText('spare_parts.markup_update')).toBeInTheDocument();

      // Filter by "Done by Superadmin"
      const superAdminFilterBtn = screen.getByRole('button', { name: /Done by Superadmin/i });
      fireEvent.click(superAdminFilterBtn);

      // Should display super_admin actions like global_settings.update
      expect(screen.getByText('global_settings.update')).toBeInTheDocument();
      // Admin action spare_parts.markup_update should NOT be in the filtered table
      expect(screen.queryByText('spare_parts.markup_update')).not.toBeInTheDocument();

      // Filter by "Done by Admin"
      const adminFilterBtn = screen.getByRole('button', { name: /Done by Admin/i });
      fireEvent.click(adminFilterBtn);

      // Now spare_parts.markup_update should be present, but global_settings.update should not
      expect(screen.getByText('spare_parts.markup_update')).toBeInTheDocument();
      expect(screen.queryByText('global_settings.update')).not.toBeInTheDocument();

      // Reset to All Actors
      const allFilterBtn = screen.getByRole('button', { name: /All Actors/i });
      fireEvent.click(allFilterBtn);

      expect(screen.getByText('global_settings.update')).toBeInTheDocument();
      expect(screen.getByText('spare_parts.markup_update')).toBeInTheDocument();
    });

    it('triggers Undo Action workflow: opens modal, confirms undo, rolls back state, and marks log as reverted', async () => {
      // Set initial pricing state before rollback test
      useDashboardStore.setState({
        globalPricing: {
          diagnosticFee: 65.0, // modified price by LOG-101
        },
      });

      render(<Logs />);

      // Find the Undo button for LOG-101 (which is reversible)
      const undoButtons = screen.getAllByTitle(/Undo this action/i);
      expect(undoButtons.length).toBeGreaterThanOrEqual(1);

      // Click Undo
      fireEvent.click(undoButtons[0]);

      // Confirm Undo modal pops up
      expect(screen.getByText(/Revert & Undo Action/i)).toBeInTheDocument();
      expect(screen.getByText(/Log Reference: LOG-101/i)).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to revert this action/i)).toBeInTheDocument();

      // Click the Confirm Undo button
      const confirmBtn = screen.getByText('Confirm & Revert Action');
      fireEvent.click(confirmBtn);

      // Verify that store state was restored: diagnosticFee rolled back to 45.0
      await waitFor(() => {
        const state = useDashboardStore.getState();
        expect(state.globalPricing.diagnosticFee).toBe(45.0);

        // Verify that original LOG-101 is KEPT in audit logs, not deleted or removed
        const log101 = state.auditLogs.find((l) => l.id === 'LOG-101');
        expect(log101).toBeDefined();
        expect(log101.status).toBe('reverted');
        expect(log101.revertedBy).toBeDefined();
        expect(log101.revertedAt).toBeDefined();

        // Verify compensating undo log was prepended and tracks who undid what
        const undoLog = state.auditLogs.find(
          (l) => l.action.endsWith('.revert') && l.details.includes('LOG-101')
        );
        expect(undoLog).toBeDefined();
        expect(undoLog.actorName).toBeDefined();
        expect(undoLog.details).toContain('reverted by');
      });

      // Verify original log row and attribution is rendered in the UI
      await waitFor(() => {
        expect(screen.getByText('LOG-101')).toBeInTheDocument();
        expect(screen.getAllByText(/REVERTED/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText(/Undone by:/i).length).toBeGreaterThanOrEqual(1);
      });

      // Verify toast notification is displayed
      await waitFor(() => {
        expect(screen.getByText(/Action \[LOG-101\] has been successfully undone and reverted\./i)).toBeInTheDocument();
      });
    });
  });

  describe('4. Standard Layout Mode, Uneditable Email, Duplicate Prevention & Password Functionality', () => {
    it('Customer modal includes password input and "Generate Strong Password" generator', () => {
      render(<Customers />);

      const addBtn = screen.getByText('Add New Customer');
      fireEvent.click(addBtn);

      expect(screen.getByText('Add New Customer', { selector: 'h3' })).toBeInTheDocument();

      // Verify Password input and Generate Strong Password button are present
      expect(screen.getByText('Password', { selector: 'label' })).toBeInTheDocument();
      const generatePwdBtn = screen.getByText('Generate Strong Password');
      expect(generatePwdBtn).toBeInTheDocument();

      // Click "Generate Strong Password" button
      fireEvent.click(generatePwdBtn);

      const pwdInput = screen.getByPlaceholderText(/Click generate or enter password\.\.\./i);
      expect(pwdInput.value).toBeTruthy();
      expect(pwdInput.value.length).toBeGreaterThanOrEqual(10);
    });

    it('Admin modal enforces uneditable auto-generated @cyberhub.com email, password generation, and prevents duplicate submissions', async () => {
      render(<Admins />);

      const inviteBtn = screen.getByText('Invite Staff / Admin');
      fireEvent.click(inviteBtn);

      expect(screen.getByText('Invite Staff Personnel', { selector: 'h3' })).toBeInTheDocument();

      // Check Work Email is disabled/readOnly
      const emailInput = screen.getByPlaceholderText('staff@cyberhub.com');
      expect(emailInput).toHaveAttribute('readOnly');
      expect(emailInput).toBeDisabled();

      // Check name auto-populates @cyberhub.com email
      const nameInput = screen.getByPlaceholderText(/e\.g\. Lim Wei Shen/i);
      fireEvent.change(nameInput, { target: { value: 'Daniel Tan' } });
      expect(emailInput.value).toBe('daniel.tan@cyberhub.com');

      // Check Password input and Generate Strong Password button
      expect(screen.getByText('Password', { selector: 'label' })).toBeInTheDocument();
      const generatePwdBtn = screen.getByText('Generate Strong Password');
      expect(generatePwdBtn).toBeInTheDocument();

      fireEvent.click(generatePwdBtn);
      const pwdInput = screen.getByPlaceholderText(/Click generate or enter password\.\.\./i);
      expect(pwdInput.value).toBeTruthy();
      expect(pwdInput.value.length).toBeGreaterThanOrEqual(10);

      // Verify Edit button is an icon button with title
      const editButtons = screen.getAllByTitle('Edit Staff Credentials');
      expect(editButtons.length).toBeGreaterThanOrEqual(1);

      // Simulate rapid multi-click on Send Invitation button
      const sendInvitationBtn = screen.getByRole('button', { name: /Send Invitation/i });
      fireEvent.click(sendInvitationBtn);
      fireEvent.click(sendInvitationBtn);
      fireEvent.click(sendInvitationBtn);

      await waitFor(() => {
        const stateAdmins = useDashboardStore.getState().admins;
        const danielAdmins = stateAdmins.filter((a) => a.name === 'Daniel Tan');
        expect(danielAdmins.length).toBe(1); // exactly 1, no duplicate
      });
    });
  });

  describe('5. CRUD Changes Made by Me Audit Trail', () => {
    it('automatically records audit logs for CRUD operations made by current user', async () => {
      // Perform CRUD operations via store
      const store = useDashboardStore.getState();

      await store.addCustomer({
        name: 'Rachel Wong',
        email: 'rachel.wong@example.com',
        phone: '+60 12-888 7766',
        city: 'Subang Jaya',
      });

      await store.updateGlobalPricing({
        diagnosticFee: 75.0,
      });

      const updatedLogs = useDashboardStore.getState().auditLogs;
      const customerLog = updatedLogs.find((l) => l.action === 'customer.create' && l.target.includes('Rachel Wong'));
      const pricingLog = updatedLogs.find((l) => l.action === 'global_settings.pricing_update');

      expect(customerLog).toBeDefined();
      expect(customerLog.isCurrentUser).toBe(true);
      expect(pricingLog).toBeDefined();
      expect(pricingLog.isCurrentUser).toBe(true);
    });

    it('renders "Done by Me" filter and "Changes Made by Me" metric card, filtering CRUD changes', async () => {
      // Add a known CRUD action
      await useDashboardStore.getState().addAdmin({
        name: 'Chloe Tan',
        email: 'chloe.tan@cyberhub.com',
        role: 'admin',
      });

      render(<Logs />);

      // Verify "Changes Made by Me" metric card is present
      expect(screen.getByText(/Changes Made by Me/i)).toBeInTheDocument();

      // Find "Done by Me" filter button
      const byMeFilterBtn = screen.getByRole('button', { name: /Done by Me/i });
      expect(byMeFilterBtn).toBeInTheDocument();

      // Click "Done by Me"
      fireEvent.click(byMeFilterBtn);

      // Verify that the CRUD action for Chloe Tan is visible in the filtered table
      await waitFor(() => {
        expect(screen.getByText('admin.create')).toBeInTheDocument();
        expect(screen.getAllByText('YOU').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('CREATE').length).toBeGreaterThanOrEqual(1);
      });
    });
  });
});
