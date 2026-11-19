import { describe, it, expect } from 'vitest';

describe('Technician App Registration & Role Linking Suite', () => {
  it('resolves technician email from employee code if entered without domain', () => {
    function resolveTargetEmail(raw) {
      const trimmed = raw.trim();
      if (!trimmed.includes('@') && /^T-\d+/i.test(trimmed)) {
        return `${trimmed.toLowerCase()}@cyberhub.com`;
      }
      return trimmed;
    }

    expect(resolveTargetEmail('T-101')).toBe('t-101@cyberhub.com');
    expect(resolveTargetEmail('t-109')).toBe('t-109@cyberhub.com');
    expect(resolveTargetEmail('T-001')).toBe('t-001@cyberhub.com');
    expect(resolveTargetEmail('tech.specialist@domain.com')).toBe('tech.specialist@domain.com');
  });

  it('correctly maps signup payload for Field Technician vs Customer accounts', () => {
    function buildSignupPayload(accountType, name, email, employeeCode) {
      const isTech = accountType === 'technician';
      const cleanEmpCode = employeeCode ? employeeCode.trim().toUpperCase() : undefined;
      return {
        email: email.trim(),
        options: {
          data: {
            full_name: name.trim(),
            role: isTech ? 'technician' : 'customer',
            employee_code: isTech && cleanEmpCode ? cleanEmpCode : undefined,
          },
        },
      };
    }

    const techPayload = buildSignupPayload('technician', 'Mohd Faris', 't-101@cyberhub.com', 'T-101');
    expect(techPayload.options.data.role).toBe('technician');
    expect(techPayload.options.data.employee_code).toBe('T-101');
    expect(techPayload.options.data.full_name).toBe('Mohd Faris');

    const customerPayload = buildSignupPayload('customer', 'John Doe', 'john@gmail.com', '');
    expect(customerPayload.options.data.role).toBe('customer');
    expect(customerPayload.options.data.employee_code).toBeUndefined();
  });

  it('safely resolves profile and technician role when session loads without existing profile', async () => {
    // Simulate AuthProvider session resolution logic
    async function resolveSessionAccount(user, mockDb) {
      let profileData = mockDb.profiles.find((p) => p.id === user.id) || null;
      let rolesData = mockDb.user_roles.filter((r) => r.user_id === user.id);

      // Auto-upsert profile if missing
      const meta = user.user_metadata || {};
      const fallbackName = meta.full_name || (user.email ? user.email.split('@')[0] : 'Member');
      if (!profileData) {
        profileData = {
          id: user.id,
          full_name: fallbackName,
          phone: '',
          avatar_path: '',
          account_status: 'active',
        };
        mockDb.profiles.push(profileData);
      }

      const metaRole = meta.role;
      const metaCode = meta.employee_code ? String(meta.employee_code).trim().toUpperCase() : '';
      let isTech = rolesData.some((r) => r.role === 'technician');
      const isAdmin = rolesData.some((r) => r.role === 'admin' || r.role === 'super_admin');

      if (!isTech && !isAdmin) {
        let techMatch = null;
        if (metaCode) {
          techMatch = mockDb.technician_profiles.find((t) => t.employee_code.toLowerCase() === metaCode.toLowerCase());
        }
        if (!techMatch && user.email) {
          techMatch = mockDb.technician_profiles.find((t) => t.email.toLowerCase() === user.email.toLowerCase());
        }

        if (techMatch || metaRole === 'technician') {
          isTech = true;
          if (techMatch) {
            techMatch.user_id = user.id;
            techMatch.account_status = 'active';
          } else if (metaRole === 'technician') {
            mockDb.technician_profiles.push({
              user_id: user.id,
              employee_code: metaCode || `T-${user.id.slice(0, 4).toUpperCase()}`,
              full_name: profileData.full_name,
              email: user.email,
              availability_status: 'available',
            });
          }
          mockDb.user_roles.push({ user_id: user.id, role: 'technician' });
        }
      }

      const role = isTech ? 'technician' : (isAdmin ? 'admin' : 'user');
      return {
        id: user.id,
        fullName: profileData.full_name,
        role,
      };
    }

    const mockDb = {
      profiles: [],
      user_roles: [],
      technician_profiles: [
        {
          id: 101,
          employee_code: 'T-101',
          email: 't-101@cyberhub.com',
          user_id: null,
          full_name: 'Faris Azman',
        },
      ],
    };

    const newTechUser = {
      id: 'uuid-tech-101',
      email: 't-101@cyberhub.com',
      user_metadata: {
        full_name: 'Faris Azman',
        role: 'technician',
        employee_code: 'T-101',
      },
    };

    const account = await resolveSessionAccount(newTechUser, mockDb);
    expect(account.role).toBe('technician');
    expect(account.fullName).toBe('Faris Azman');
    expect(mockDb.technician_profiles[0].user_id).toBe('uuid-tech-101');
    expect(mockDb.user_roles.some((r) => r.role === 'technician')).toBe(true);
    expect(mockDb.profiles.some((p) => p.id === 'uuid-tech-101')).toBe(true);
  });
});
