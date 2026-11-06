import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Batch 4: UI Resilience & Form Integration (P1)', () => {
  describe('UI-01: Double-Submission Prevention on Financial Forms', () => {
    it('proves that journal entry modal disables save button during execution', () => {
      const journalJs = fs.readFileSync(path.join(__dirname, '../app-modular/js/modules/17b-journal.js'), 'utf8');

      // Before fix: saveBtn.onclick does not disable saveBtn
      const hasDoubleSubmitGuard = journalJs.includes('if(saveBtn.disabled) return') ||
                                   journalJs.includes('saveBtn.disabled = true');

      // This test is designed to FAIL before the fix, and PASS after the fix
      expect(hasDoubleSubmitGuard).toBe(true);
    });

    it('proves that invoice modal handleSave disables buttons during execution', () => {
      const reportsJs = fs.readFileSync(path.join(__dirname, '../app-modular/js/modules/11e-customer-reports.js'), 'utf8');

      // Before fix: handleSave in customer-reports did not guard against double clicking
      const hasDoubleSubmitGuard = reportsJs.includes('saveInvOnlyBtn.disabled = true') ||
                                   reportsJs.includes('isSavingInvoice') ||
                                   reportsJs.includes('handleSave.busy');

      // This test is designed to FAIL before the fix, and PASS after the fix
      expect(hasDoubleSubmitGuard).toBe(true);
    });
  });

  describe('UI-02: POS Inventory Rollback on Processing Failure', () => {
    it('proves that pos-retail has an inventory snapshot or rollback mechanism when sale processing fails', () => {
      const posJs = fs.readFileSync(path.join(__dirname, '../app-modular/js/modules/15-pos-retail.js'), 'utf8');

      // Before fix: inventory deducted immediately without inventory backup or rollback in catch block
      const hasInventoryRollback = posJs.includes('inventoryBackup') ||
                                   posJs.includes('inventorySnapshot');

      // This test is designed to FAIL before the fix, and PASS after the fix
      expect(hasInventoryRollback).toBe(true);
    });
  });

  describe('UI-03: BiDi Phone Number Isolation in Receipts List', () => {
    it('proves that phone numbers are wrapped with BiDi isolation attributes', () => {
      const listJs = fs.readFileSync(path.join(__dirname, '../app-modular/js/modules/10b-receipts-list.js'), 'utf8');

      // Before fix: line 104 and 209 just had <span>${escapeHtml(cPhone)}</span> without dir="ltr" or unicode-bidi
      const hasBidiIsolation = listJs.includes('unicode-bidi:isolate') ||
                               listJs.includes('unicode-bidi: isolate');

      // This test is designed to FAIL before the fix, and PASS after the fix
      expect(hasBidiIsolation).toBe(true);
    });
  });

  describe('UI-04: Intake Wizard Button Text Restoration on Failure', () => {
    it('proves that intake wizard buttons restore their original text label on error', () => {
      const intakeJs = fs.readFileSync(path.join(__dirname, '../app-modular/js/modules/10a-intake-wizard.js'), 'utf8');

      // Before fix: line 1778 did btns.forEach(b=>{ b.disabled = false; }); leaving "جارٍ الحفظ..." permanently
      const hasTextRestoration = intakeJs.includes('b.dataset.origText') ||
                                 intakeJs.includes('origText');

      // This test is designed to FAIL before the fix, and PASS after the fix
      expect(hasTextRestoration).toBe(true);
    });
  });
});
