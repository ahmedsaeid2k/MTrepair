import { describe, it, expect } from 'vitest';
import FinanceEngine from '../app-modular/js/core/09-finance-engine.js';

const {
  fallbackSha256,
  sha256Hex,
  hashPasswordWithSalt,
  verifyLocalPassword,
  checkEmergencyAdminBootstrap,
  VALID_APP_SECTIONS
} = FinanceEngine;

describe('Authentication & Vault Security Engine', () => {
  describe('SHA-256 Hashing', () => {
    it('computes correct standard SHA-256 hash for known vector', async () => {
      // SHA-256("admin") = 8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918
      const hash = await sha256Hex('admin');
      expect(hash).toBe('8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918');
    });

    it('fallbackSha256 produces same output as sha256Hex for ascii strings', () => {
      const fb = fallbackSha256('admin');
      expect(fb).toBe('8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918');
    });
  });

  describe('Salted Iterated Hashing & Vault Verification', () => {
    it('generates unique salt and verifiable hash', async () => {
      const creds = await hashPasswordWithSalt('secretPassword123');
      expect(creds.salt).toBeDefined();
      expect(creds.salt.length).toBeGreaterThan(8);
      expect(creds.hash).toBeDefined();
      expect(creds.hash.length).toBe(64);

      // Verify correct password matches
      const isMatch = await verifyLocalPassword('secretPassword123', creds);
      expect(isMatch).toBe(true);

      // Verify incorrect password fails
      const isWrong = await verifyLocalPassword('wrongPassword', creds);
      expect(isWrong).toBe(false);
    });

    it('generates different hashes for same password with different salts', async () => {
      const creds1 = await hashPasswordWithSalt('samePass', 'saltAlpha');
      const creds2 = await hashPasswordWithSalt('samePass', 'saltBeta');
      expect(creds1.hash).not.toBe(creds2.hash);
      expect(await verifyLocalPassword('samePass', creds1)).toBe(true);
      expect(await verifyLocalPassword('samePass', creds2)).toBe(true);
    });
  });

  describe('Emergency Admin Bootstrap', () => {
    it('allows admin login with default password "admin"', () => {
      const res = checkEmergencyAdminBootstrap('admin', 'admin');
      expect(res).not.toBeNull();
      expect(res.name).toBe('admin');
      expect(res.role).toBe('admin');
      expect(res.superuser).toBe(true);
      expect(res.sections).toEqual(VALID_APP_SECTIONS);
    });

    it('allows admin login with alternate default password "123456"', () => {
      const res = checkEmergencyAdminBootstrap('admin', '123456');
      expect(res).not.toBeNull();
      expect(res.role).toBe('admin');
    });

    it('case-insensitively handles admin username with whitespace', () => {
      const res = checkEmergencyAdminBootstrap('  ADMIN  ', 'admin');
      expect(res).not.toBeNull();
      expect(res.name).toBe('admin');
    });

    it('rejects invalid admin passwords during bootstrap', () => {
      expect(checkEmergencyAdminBootstrap('admin', 'wrong')).toBeNull();
      expect(checkEmergencyAdminBootstrap('admin', '')).toBeNull();
    });

    it('does not bootstrap non-admin usernames', () => {
      expect(checkEmergencyAdminBootstrap('cashier', 'admin')).toBeNull();
      expect(checkEmergencyAdminBootstrap('user', '123456')).toBeNull();
    });
  });
});
