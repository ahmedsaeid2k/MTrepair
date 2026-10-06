import { describe, it, expect } from 'vitest';
import FinanceEngine from '../app-modular/js/core/09-finance-engine.js';

const {
  checkUserSectionAccess,
  checkActionAuthorization,
  VALID_APP_SECTIONS
} = FinanceEngine;

describe('RBAC & User Permissions Engine', () => {
  it('contains expected valid application section keys', () => {
    expect(VALID_APP_SECTIONS).toContain('maintenance');
    expect(VALID_APP_SECTIONS).toContain('pos');
    expect(VALID_APP_SECTIONS).toContain('finance');
    expect(VALID_APP_SECTIONS).toContain('settings');
    expect(VALID_APP_SECTIONS).toContain('audit');
    expect(VALID_APP_SECTIONS).toContain('users');
  });

  describe('checkUserSectionAccess()', () => {
    const adminUser = {
      name: 'Admin',
      role: 'admin',
      superuser: true,
      sections: VALID_APP_SECTIONS
    };

    const cashierUser = {
      name: 'كاشير 1',
      role: 'cashier',
      superuser: false,
      sections: ['pos', 'cashdrawer']
    };

    const techUser = {
      name: 'فني صيانة',
      role: 'technician',
      superuser: false,
      sections: ['maintenance']
    };

    const accountantUser = {
      name: 'محاسب',
      role: 'accountant',
      superuser: false,
      sections: ['daily', 'cashdrawer', 'invoices', 'finance', 'inventory']
    };

    it('grants admin full access to every section including settings', () => {
      VALID_APP_SECTIONS.forEach(sec => {
        expect(checkUserSectionAccess(adminUser, sec)).toBe(true);
      });
    });

    it('strictly forbids settings section for all non-admin users', () => {
      expect(checkUserSectionAccess(cashierUser, 'settings')).toBe(false);
      expect(checkUserSectionAccess(techUser, 'settings')).toBe(false);
      expect(checkUserSectionAccess(accountantUser, 'settings')).toBe(false);
      expect(checkUserSectionAccess({ role: 'accountant', superuser: true }, 'settings')).toBe(false);
    });

    it('restricts cashier strictly to POS and Cash Drawer', () => {
      expect(checkUserSectionAccess(cashierUser, 'pos')).toBe(true);
      expect(checkUserSectionAccess(cashierUser, 'cashdrawer')).toBe(true);
      expect(checkUserSectionAccess(cashierUser, 'maintenance')).toBe(false);
      expect(checkUserSectionAccess(cashierUser, 'finance')).toBe(false);
      expect(checkUserSectionAccess(cashierUser, 'users')).toBe(false);
    });

    it('restricts technician strictly to Maintenance', () => {
      expect(checkUserSectionAccess(techUser, 'maintenance')).toBe(true);
      expect(checkUserSectionAccess(techUser, 'pos')).toBe(false);
      expect(checkUserSectionAccess(techUser, 'finance')).toBe(false);
    });

    it('allows accountant access to financial sections but forbids audit/users unless superuser', () => {
      expect(checkUserSectionAccess(accountantUser, 'finance')).toBe(true);
      expect(checkUserSectionAccess(accountantUser, 'invoices')).toBe(true);
      expect(checkUserSectionAccess(accountantUser, 'daily')).toBe(true);
      expect(checkUserSectionAccess(accountantUser, 'users')).toBe(false);
      expect(checkUserSectionAccess(accountantUser, 'audit')).toBe(false);
    });

    it('allows superuser to access users and audit management', () => {
      const superAccountant = {
        name: 'محاسب أول',
        role: 'accountant',
        superuser: true,
        sections: ['finance']
      };
      expect(checkUserSectionAccess(superAccountant, 'users')).toBe(true);
      expect(checkUserSectionAccess(superAccountant, 'audit')).toBe(true);
      expect(checkUserSectionAccess(superAccountant, 'settings')).toBe(false); // still false
    });

    it('safely handles null/undefined user objects', () => {
      expect(checkUserSectionAccess(null, 'pos')).toBe(false);
      expect(checkUserSectionAccess(undefined, 'maintenance')).toBe(false);
    });
  });

  describe('checkActionAuthorization()', () => {
    it('restricts deleteReceipt to admin only', () => {
      expect(checkActionAuthorization('admin', 'deleteReceipt')).toBe(true);
      expect(checkActionAuthorization('accountant', 'deleteReceipt')).toBe(false);
      expect(checkActionAuthorization('cashier', 'deleteReceipt')).toBe(false);
      expect(checkActionAuthorization('technician', 'deleteReceipt')).toBe(false);
    });

    it('allows transferWarehouseStock for admin and accountant', () => {
      expect(checkActionAuthorization('admin', 'transferWarehouseStock')).toBe(true);
      expect(checkActionAuthorization('accountant', 'transferWarehouseStock')).toBe(true);
      expect(checkActionAuthorization('cashier', 'transferWarehouseStock')).toBe(false);
    });

    it('allows openCashDrawer for admin, cashier, and accountant', () => {
      expect(checkActionAuthorization('admin', 'openCashDrawer')).toBe(true);
      expect(checkActionAuthorization('cashier', 'openCashDrawer')).toBe(true);
      expect(checkActionAuthorization('accountant', 'openCashDrawer')).toBe(true);
      expect(checkActionAuthorization('technician', 'openCashDrawer')).toBe(false);
    });

    it('returns false for unknown actions', () => {
      expect(checkActionAuthorization('admin', 'unknownSecretAction')).toBe(false);
    });
  });
});
