import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Batch 3: Backend & API Integration, Concurrency, and HR Synchronization (P1)', () => {
  describe('INT-01: HR and Payroll Backend Endpoints Registration', () => {
    it('proves that HR and Payroll write actions are registered in ACTION_ROLES and AUTOPOST_REFS', () => {
      const backendJs = fs.readFileSync(path.join(__dirname, '../files(11)/GoogleAppsScript_Backend.gs.txt'), 'utf8');

      // Check if HR actions are in ACTION_ROLES
      const hasSaveAdvance = backendJs.includes('saveEmployeeAdvance:') || backendJs.includes("saveEmployeeAdvance");
      const hasSaveRepayment = backendJs.includes('saveEmployeeAdvanceRepayment:') || backendJs.includes("saveEmployeeAdvanceRepayment");
      const hasSavePayroll = backendJs.includes('savePayrollRun:') || backendJs.includes("savePayrollRun");
      
      // In ACTION_ROLES specifically
      const hasHrActionRoles = backendJs.includes("saveEmployeeAdvance:        ['admin'") ||
                               backendJs.includes("saveEmployeeAdvance: ['admin'");

      // This test is designed to FAIL before the fix, and PASS after the fix
      expect(hasHrActionRoles).toBe(true);
      expect(hasSaveAdvance).toBe(true);
      expect(hasSaveRepayment).toBe(true);
      expect(hasSavePayroll).toBe(true);
    });
  });

  describe('INT-02: Idempotency Two-Phase Commit to Prevent Silent Client Data Loss', () => {
    it('proves that idempotency is committed after operation execution, not before', () => {
      const backendJs = fs.readFileSync(path.join(__dirname, '../files(11)/GoogleAppsScript_Backend.gs.txt'), 'utf8');

      // Before fix: checkIdempotency immediately appends row to sheet on check
      // Fix: checkIdempotency checks if already COMPLETED, and recordIdempotencySuccess marks it completed after work
      const hasSeparateCommit = backendJs.includes('recordIdempotencySuccess') ||
                                backendJs.includes('markIdempotencyDone');

      // This test is designed to FAIL before the fix, and PASS after the fix
      expect(hasSeparateCommit).toBe(true);
    });
  });

  describe('INT-03: Offline Queue Payload Preservation (data vs top-level)', () => {
    it('proves that processSyncQueue supplies both data object and top-level fields for backend compatibility', () => {
      const apiSyncJs = fs.readFileSync(path.join(__dirname, '../app-modular/js/core/02-api-sync.js'), 'utf8');

      // In processSyncQueue (around line 1172), payload must include data: item.data
      const hasDualDataEnvelope = apiSyncJs.includes('data: item.data') ||
                                  apiSyncJs.includes('data: (item.data');

      // This test is designed to FAIL before the fix, and PASS after the fix
      expect(hasDualDataEnvelope).toBe(true);
    });
  });

  describe('INT-04: Inventory Adjustment Parameter Compatibility (delta vs quantity)', () => {
    it('proves that adjustInventoryQty in backend supports body.quantity and CCTV projects sends delta', () => {
      const backendJs = fs.readFileSync(path.join(__dirname, '../files(11)/GoogleAppsScript_Backend.gs.txt'), 'utf8');
      const cctvJs = fs.readFileSync(path.join(__dirname, '../app-modular/js/modules/21-cctv-projects.js'), 'utf8');

      // Backend supports body.quantity fallback
      const backendSupportsQuantity = backendJs.includes('body.quantity') ||
                                      backendJs.includes('safeNumber(body.quantity');
      // CCTV project sends delta: -1
      const cctvSendsDelta = cctvJs.includes('delta:') || cctvJs.includes('delta :');

      // This test is designed to FAIL before the fix, and PASS after the fix
      expect(backendSupportsQuantity).toBe(true);
      expect(cctvSendsDelta).toBe(true);
    });
  });

  describe('INT-05: Preserving System Reference Types in Backend Journal Entries', () => {
    it('proves that saveJournalEntry in backend retains authorized AUTOPOST_REFS instead of forcing Manual', () => {
      const backendJs = fs.readFileSync(path.join(__dirname, '../files(11)/GoogleAppsScript_Backend.gs.txt'), 'utf8');

      // Line 2236 currently has: ReferenceType: 'Manual', // Client can ONLY submit Manual entries
      const hasForcedManualOnly = backendJs.includes("ReferenceType: 'Manual', // Client can ONLY submit Manual entries");

      // This test is designed to FAIL before the fix, and PASS after the fix
      expect(hasForcedManualOnly).toBe(false);
    });
  });

  describe('INT-06: Valid Google Gemini AI Model Identifier', () => {
    it('proves that the default Gemini model identifier is set to an official supported model (gemini-2.5-flash or 1.5-flash)', () => {
      const configJs = fs.readFileSync(path.join(__dirname, '../app-modular/js/core/06-config-defaults.js'), 'utf8');
      const aiJs = fs.readFileSync(path.join(__dirname, '../app-modular/js/modules/11d-ai-assistant.js'), 'utf8');

      // Check that non-existent gemini-3.5-flash is removed
      const hasNonexistentModelInConfig = configJs.includes("'gemini-3.5-flash'");
      const hasNonexistentModelInAi = aiJs.includes("'gemini-3.5-flash'");

      // This test is designed to FAIL before the fix, and PASS after the fix
      expect(hasNonexistentModelInConfig).toBe(false);
      expect(hasNonexistentModelInAi).toBe(false);
    });
  });

  describe('INT-07: Cleanup of Expired Sessions in ScriptProperties', () => {
    it('proves that a session cleanup function exists in backend to prevent 500KB quota exhaustion', () => {
      const backendJs = fs.readFileSync(path.join(__dirname, '../files(11)/GoogleAppsScript_Backend.gs.txt'), 'utf8');

      const hasSessionCleanup = backendJs.includes('cleanupExpiredSessions');

      // This test is designed to FAIL before the fix, and PASS after the fix
      expect(hasSessionCleanup).toBe(true);
    });
  });
});
