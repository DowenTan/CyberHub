import { describe, it, expect, beforeEach } from 'vitest';
import { useDashboardStore } from '../../store/useDashboardStore.js';
import { formatPhoneNumber, splitPhone, validatePhoneNumber, getTechnicianCertList, CertBadges } from '../../pages/Technicians.jsx';

describe('Technician Form Bug Fixes & Formatting Suite', () => {
  beforeEach(() => {
    // Reset Zustand store state before each test
    useDashboardStore.setState({
      technicians: [
        {
          code: 'T-001',
          name: 'Sarah Izzah',
          email: 't-001@cyberhub.com',
          password: 'OriginalPassword123!',
          phoneNumber: '+60123456789',
          status: 'AVAILABLE',
          rating: 4.8,
          certs: 'Master HVAC Certified (CIDB) • EPA 608 Universal',
          certifications: [],
        },
      ],
    });
  });

  it('formatPhoneNumber auto spaces phone number for Smart Table (e.g. 123456789 -> 12 345 6789)', () => {
    // 9-digit Malaysian numbers
    expect(formatPhoneNumber('+60123456789')).toBe('12 345 6789');
    expect(formatPhoneNumber('123456789')).toBe('12 345 6789');
    expect(formatPhoneNumber('+6012-3001234')).toBe('12 300 1234');
    expect(formatPhoneNumber('+60 12 345 6789')).toBe('12 345 6789');

    // 10-digit Malaysian numbers (e.g. 011 numbers)
    expect(formatPhoneNumber('+601112345678')).toBe('11 1234 5678');
    expect(formatPhoneNumber('1112345678')).toBe('11 1234 5678');

    // International numbers preserve country code
    expect(formatPhoneNumber('+6591234567')).toBe('+65 9123 4567');
  });

  it('splitPhone extracts raw unspaced digits for form input (form=123456789)', () => {
    expect(splitPhone('+60123456789')).toEqual({ countryCode: '+60', localNumber: '123456789' });
    expect(splitPhone('+60 12 345 6789')).toEqual({ countryCode: '+60', localNumber: '123456789' });
    expect(splitPhone('+601112345678')).toEqual({ countryCode: '+60', localNumber: '1112345678' });
    expect(splitPhone('+6591234567')).toEqual({ countryCode: '+65', localNumber: '91234567' });
  });

  it('validatePhoneNumber validates 9 and 10 digit phone numbers with leading 0 handling', () => {
    // Valid 9 digits
    const res9 = validatePhoneNumber('123456789', '+60');
    expect(res9.isValid).toBe(true);
    expect(res9.digits).toBe('123456789');

    // Valid 10 digits
    const res10 = validatePhoneNumber('1112345678', '+60');
    expect(res10.isValid).toBe(true);
    expect(res10.digits).toBe('1112345678');

    // Strips leading 0 automatically
    const resLeading0 = validatePhoneNumber('0123456789', '+60');
    expect(resLeading0.isValid).toBe(true);
    expect(resLeading0.digits).toBe('123456789');

    // Invalid: too short (5 digits)
    const resShort = validatePhoneNumber('12345', '+60');
    expect(resShort.isValid).toBe(false);
    expect(resShort.error).toContain('9 or 10 digits');

    // Invalid: too long (12 digits)
    const resLong = validatePhoneNumber('123456789012', '+60');
    expect(resLong.isValid).toBe(false);
    expect(resLong.error).toContain('9 or 10 digits');

    // Invalid: empty
    const resEmpty = validatePhoneNumber('', '+60');
    expect(resEmpty.isValid).toBe(false);
    expect(resEmpty.error).toContain('required');
  });

  it('getTechnicianCertList extracts actual certification names from array of objects, strings, and certs', () => {
    // Array of objects (created technician)
    const techWithObjCerts = {
      certifications: [
        { title: 'Master Technician', status: 'verified', issuer: 'CyberHub Academy' },
        { title: 'HVAC Pro Certified', status: 'verified', issuer: 'CyberHub Academy' },
      ],
      certs: 'Master Technician, HVAC Pro Certified',
    };
    expect(getTechnicianCertList(techWithObjCerts)).toEqual(['Master Technician', 'HVAC Pro Certified']);

    // String certs (existing technician)
    const techWithStringCerts = {
      certifications: [],
      certs: 'Commercial Refrigeration • Gas & Electrical Safety',
    };
    expect(getTechnicianCertList(techWithStringCerts)).toEqual(['Commercial Refrigeration', 'Gas & Electrical Safety']);

    // Mixed string in certifications
    const techWithMixedCerts = {
      certifications: 'EPA 608 Universal, Inverter Systems Specialist',
      certs: '',
    };
    expect(getTechnicianCertList(techWithMixedCerts)).toEqual(['EPA 608 Universal', 'Inverter Systems Specialist']);
  });

  it('addTechnician stores actual certification names and shows certificate titles instead of "verified"', async () => {
    const { addTechnician } = useDashboardStore.getState();

    await addTechnician({
      code: 'T-109',
      name: 'Ahmad Faizal',
      password: 'ManualSecretPassword#99',
      phoneNumber: '+60198765432',
      certifications: 'Master Technician, HVAC Pro Certified',
    });

    const fleet = useDashboardStore.getState().technicians;
    const added = fleet.find((t) => t.code === 'T-109');
    expect(added).toBeDefined();

    // Verify email uses Tech ID (non-editable generated format)
    expect(added.email).toBe('t-109@cyberhub.com');

    // Verify phone number is stored unspaced and formatted for smart table
    expect(added.phoneNumber).toBe('+60198765432');
    expect(formatPhoneNumber(added.phoneNumber)).toBe('19 876 5432');

    // Verify certifications contain the actual cert titles, NOT just "verified"
    const certList = getTechnicianCertList(added);
    expect(certList).toContain('Master Technician');
    expect(certList).toContain('HVAC Pro Certified');
    expect(certList).not.toContain('verified');
  });

  it('updateTechnician safely normalizes new certs without crashing into div#root', async () => {
    const { updateTechnician } = useDashboardStore.getState();

    // Adding a new certification to existing technician T-001
    await updateTechnician('T-001', {
      password: 'UpdatedManualPassword@2026',
      phoneNumber: '+60 12 999 8888',
      name: 'Sarah Izzah Ahmad',
      certifications: 'Master HVAC Certified (CIDB), EPA 608 Universal, Smart Electronics',
    });

    const fleet = useDashboardStore.getState().technicians;
    const updated = fleet.find((t) => t.code === 'T-001');

    expect(updated.password).toBe('UpdatedManualPassword@2026');
    expect(updated.phoneNumber).toBe('+60129998888');
    expect(formatPhoneNumber(updated.phoneNumber)).toBe('12 999 8888');

    // Certifications must be an array of objects and certs must be a string (no crashing .map)
    expect(Array.isArray(updated.certifications)).toBe(true);
    expect(typeof updated.certs).toBe('string');

    const certList = getTechnicianCertList(updated);
    expect(certList).toEqual(['Master HVAC Certified (CIDB)', 'EPA 608 Universal', 'Smart Electronics']);
    expect(certList).not.toContain('verified');
  });

  it('setTechnicians re-syncing from API preserves existing manually typed passwords and normalized certs', () => {
    const { setTechnicians } = useDashboardStore.getState();

    // Simulate backend response without passwords
    setTechnicians([
      {
        code: 'T-001',
        name: 'Sarah Izzah',
        phoneNumber: '+60123456789',
        certs: 'Master HVAC Certified (CIDB) • EPA 608 Universal',
      },
    ]);

    const fleet = useDashboardStore.getState().technicians;
    const tech = fleet.find((t) => t.code === 'T-001');

    // Password must NOT be wiped or regenerated
    expect(tech.password).toBe('OriginalPassword123!');
    expect(tech.email).toBe('t-001@cyberhub.com');
    expect(tech.phoneNumber).toBe('+60123456789');
    expect(formatPhoneNumber(tech.phoneNumber)).toBe('12 345 6789');

    // Certifications must be safely populated
    expect(Array.isArray(tech.certifications)).toBe(true);
    const certList = getTechnicianCertList(tech);
    expect(certList).toContain('Master HVAC Certified (CIDB)');
  });
});
