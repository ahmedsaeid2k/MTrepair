import { describe, it, expect } from 'vitest';
import FinanceEngine from '../app-modular/js/core/09-finance-engine.js';

const {
  isBalancedEntry,
  validateJournalEntryLines,
  computeTrialBalance,
  round2
} = FinanceEngine;

describe('Financial Lifecycle & Double-Entry E2E Integration Suite', () => {
  const chartOfAccounts = [
    { Code: '1101', Name: 'الخزينة الرئيسية', Nature: 'مدين' },
    { Code: '1102', Name: 'حساب بنكي', Nature: 'مدين' },
    { Code: '1103', Name: 'العملاء والمدينون', Nature: 'مدين' },
    { Code: '1104', Name: 'مخزون بضاعة بغرض البيع', Nature: 'مدين' },
    { Code: '1105', Name: 'ضريبة القيمة المضافة على المشتريات (مدخلات)', Nature: 'مدين' },
    { Code: '1106', Name: 'عهد وسلف العاملين', Nature: 'مدين' },
    { Code: '2101', Name: 'الموردون والدائنون', Nature: 'دائن' },
    { Code: '2104', Name: 'ضريبة القيمة المضافة المحصلة (مخرجات)', Nature: 'دائن' },
    { Code: '3101', Name: 'رأس المال', Nature: 'دائن' },
    { Code: '4101', Name: 'إيرادات خدمات صيانة', Nature: 'دائن' },
    { Code: '4102', Name: 'إيرادات مبيعات الأجهزة والإكسسوار', Nature: 'دائن' },
    { Code: '5101', Name: 'تكلفة قطع غيار الصيانة المستخدمة', Nature: 'مدين' },
    { Code: '5102', Name: 'تكلفة البضاعة المباعة (أجهزة وإكسسوار)', Nature: 'مدين' },
    { Code: '5201', Name: 'إيجار المقر', Nature: 'مدين' },
    { Code: '5202', Name: 'رواتب وأجور العاملين', Nature: 'مدين' }
  ];

  it('verifies that an end-to-end business operational cycle maintains strict ledger balance', () => {
    const journalEntries = [];

    // 1. Initial Capital Injection: 100,000 EGP to Cash
    const entryCapital = {
      Id: 'JE-001',
      Date: '2026-01-01',
      Description: 'إيداع رأس المال التأسيسي بالخزينة',
      Lines: [
        { AccountCode: '1101', Debit: 100000, Credit: 0 },
        { AccountCode: '3101', Debit: 0, Credit: 100000 }
      ]
    };
    expect(isBalancedEntry(entryCapital.Lines)).toBe(true);
    journalEntries.push(entryCapital);

    // 2. Inventory Purchase on Credit: 20,000 EGP + 14% Input VAT (2,800 EGP) from Supplier
    const entryPurchase = {
      Id: 'JE-002',
      Date: '2026-01-05',
      Description: 'شراء بضاعة ومخزون بالأجل من المورد',
      Lines: [
        { AccountCode: '1104', Debit: 20000, Credit: 0 },
        { AccountCode: '1105', Debit: 2800, Credit: 0 },
        { AccountCode: '2101', Debit: 0, Credit: 22800 }
      ]
    };
    expect(isBalancedEntry(entryPurchase.Lines)).toBe(true);
    journalEntries.push(entryPurchase);

    // 3. Purchase Return: Return 2,000 EGP worth of goods + 280 EGP VAT reversal to Supplier
    const entryPurchaseReturn = {
      Id: 'JE-003',
      Date: '2026-01-08',
      Description: 'مردودات مشتريات للمورد مع عكس ضريبة المدخلات',
      Lines: [
        { AccountCode: '2101', Debit: 2280, Credit: 0 },
        { AccountCode: '1104', Debit: 0, Credit: 2000 },
        { AccountCode: '1105', Debit: 0, Credit: 280 }
      ]
    };
    expect(isBalancedEntry(entryPurchaseReturn.Lines)).toBe(true);
    journalEntries.push(entryPurchaseReturn);

    // 4. POS Sale: Total 5,700 EGP (Subtotal 5,000 + 14% Output VAT 700).
    // Payment: Split (2,000 Cash, 1,000 Bank Card, 2,700 Customer Credit).
    // Associated COGS: 3,000 EGP
    const entrySaleRevenue = {
      Id: 'JE-004-REV',
      Date: '2026-01-10',
      Description: 'مبيعات نقطة البيع POS مجزأة مع ضريبة المخرجات',
      Lines: [
        { AccountCode: '1101', Debit: 2000, Credit: 0 },
        { AccountCode: '1102', Debit: 1000, Credit: 0 },
        { AccountCode: '1103', Debit: 2700, Credit: 0 },
        { AccountCode: '4102', Debit: 0, Credit: 5000 },
        { AccountCode: '2104', Debit: 0, Credit: 700 }
      ]
    };
    const entrySaleCogs = {
      Id: 'JE-004-COGS',
      Date: '2026-01-10',
      Description: 'تكلفة البضاعة المباعة لمبيعات POS',
      Lines: [
        { AccountCode: '5102', Debit: 3000, Credit: 0 },
        { AccountCode: '1104', Debit: 0, Credit: 3000 }
      ]
    };
    expect(isBalancedEntry(entrySaleRevenue.Lines)).toBe(true);
    expect(isBalancedEntry(entrySaleCogs.Lines)).toBe(true);
    journalEntries.push(entrySaleRevenue, entrySaleCogs);

    // 5. Sales Return: Return item worth 1,140 EGP (1,000 + 140 Output VAT refund) paid from Cash.
    // COGS reversal: 600 EGP back to inventory
    const entrySaleReturnRev = {
      Id: 'JE-005-REV',
      Date: '2026-01-12',
      Description: 'مردودات مبيعات مع عكس ضريبة المخرجات نقداً',
      Lines: [
        { AccountCode: '4102', Debit: 1000, Credit: 0 },
        { AccountCode: '2104', Debit: 140, Credit: 0 },
        { AccountCode: '1101', Debit: 0, Credit: 1140 }
      ]
    };
    const entrySaleReturnCogs = {
      Id: 'JE-005-COGS',
      Date: '2026-01-12',
      Description: 'عكس تكلفة البضاعة المباعة واسترجاع المخزون',
      Lines: [
        { AccountCode: '1104', Debit: 600, Credit: 0 },
        { AccountCode: '5102', Debit: 0, Credit: 600 }
      ]
    };
    expect(isBalancedEntry(entrySaleReturnRev.Lines)).toBe(true);
    expect(isBalancedEntry(entrySaleReturnCogs.Lines)).toBe(true);
    journalEntries.push(entrySaleReturnRev, entrySaleReturnCogs);

    // 6. Customer Debt Settlement: Customer pays 2,000 EGP in Cash
    const entryCustPay = {
      Id: 'JE-006',
      Date: '2026-01-15',
      Description: 'سداد دفعة من مديونية عميل نقداً',
      Lines: [
        { AccountCode: '1101', Debit: 2000, Credit: 0 },
        { AccountCode: '1103', Debit: 0, Credit: 2000 }
      ]
    };
    expect(isBalancedEntry(entryCustPay.Lines)).toBe(true);
    journalEntries.push(entryCustPay);

    // 7. Supplier Payment: Pay 15,000 EGP to supplier from Cash
    const entrySuppPay = {
      Id: 'JE-007',
      Date: '2026-01-18',
      Description: 'سداد مستحقات المورد من الخزينة',
      Lines: [
        { AccountCode: '2101', Debit: 15000, Credit: 0 },
        { AccountCode: '1101', Debit: 0, Credit: 15000 }
      ]
    };
    expect(isBalancedEntry(entrySuppPay.Lines)).toBe(true);
    journalEntries.push(entrySuppPay);

    // 8. Employee Advance: Advance 1,500 EGP from Cash
    const entryAdvance = {
      Id: 'JE-008',
      Date: '2026-01-20',
      Description: 'صرف سلفة موظف نقداً',
      Lines: [
        { AccountCode: '1106', Debit: 1500, Credit: 0 },
        { AccountCode: '1101', Debit: 0, Credit: 1500 }
      ]
    };
    expect(isBalancedEntry(entryAdvance.Lines)).toBe(true);
    journalEntries.push(entryAdvance);

    // 9. Monthly Payroll Run: Gross Salaries 6,000 EGP. Deduct 1,500 advance. Net Cash Paid: 4,500 EGP.
    const entryPayroll = {
      Id: 'JE-009',
      Date: '2026-01-30',
      Description: 'مسير رواتب الشهر مع استقطاع السلفة بالكامل',
      Lines: [
        { AccountCode: '5202', Debit: 6000, Credit: 0 },
        { AccountCode: '1106', Debit: 0, Credit: 1500 },
        { AccountCode: '1101', Debit: 0, Credit: 4500 }
      ]
    };
    expect(isBalancedEntry(entryPayroll.Lines)).toBe(true);
    journalEntries.push(entryPayroll);

    // Validate each individual entry with validateJournalEntryLines
    for (const je of journalEntries) {
      const v = validateJournalEntryLines(je.Lines);
      expect(v.valid).toBe(true);
      expect(v.difference).toBe(0);
    }

    // Compute Comprehensive Trial Balance
    const trialBalance = computeTrialBalance(chartOfAccounts, journalEntries);

    expect(trialBalance.isBalanced).toBe(true);
    expect(trialBalance.difference).toBe(0);

    // Verify trial balance totals match expected sum
    // Sum of all debits across entries:
    // 100k + 22.8k + 2.28k + 5.7k + 3k + 1.14k + 0.6k + 2k + 15k + 1.5k + 6k = 160,020 EGP
    expect(trialBalance.totalDebits).toBe(160020);
    expect(trialBalance.totalCredits).toBe(160020);

    // Verify key account balances:
    // Cash (1101): In (100k + 2k + 2k) - Out (1.14k + 15k + 1.5k + 4.5k) = 104,000 - 22,140 = 81,860 EGP
    const cashRow = trialBalance.rows.find(r => r.code === '1101');
    expect(round2(cashRow.netBalance)).toBe(81860);

    // Bank (1102): 1,000 EGP
    const bankRow = trialBalance.rows.find(r => r.code === '1102');
    expect(round2(bankRow.netBalance)).toBe(1000);

    // Customer Receivables (1103): 2,700 - 2,000 = 700 EGP
    const custRow = trialBalance.rows.find(r => r.code === '1103');
    expect(round2(custRow.netBalance)).toBe(700);

    // Inventory (1104): Purchased 20k - Returned 2k - Sold COGS 3k + Reversal COGS 0.6k = 15,600 EGP
    const invRow = trialBalance.rows.find(r => r.code === '1104');
    expect(round2(invRow.netBalance)).toBe(15600);

    // Net VAT Payable: Output VAT (700 - 140 = 560) vs Input VAT (2,800 - 280 = 2,520) -> Input tax credit of 1,960
    const inVatRow = trialBalance.rows.find(r => r.code === '1105');
    const outVatRow = trialBalance.rows.find(r => r.code === '2104');
    expect(round2(inVatRow.netBalance)).toBe(2520);
    expect(round2(outVatRow.netBalance)).toBe(560);

    // Supplier Payables (2101): Bought 22.8k - Returned 2.28k - Paid 15k = 5,520 EGP
    const suppRow = trialBalance.rows.find(r => r.code === '2101');
    expect(round2(suppRow.netBalance)).toBe(5520);

    // Employee Advances (1106): 1,500 advanced - 1,500 deducted = 0 EGP
    const advRow = trialBalance.rows.find(r => r.code === '1106');
    expect(round2(advRow.netBalance)).toBe(0);

    // Capital (3101): 100,000 EGP
    const capRow = trialBalance.rows.find(r => r.code === '3101');
    expect(round2(capRow.netBalance)).toBe(100000);

    // Net Revenue (4102): 5,000 - 1,000 = 4,000 EGP
    const revRow = trialBalance.rows.find(r => r.code === '4102');
    expect(round2(revRow.netBalance)).toBe(4000);

    // Net COGS (5102): 3,000 - 600 = 2,400 EGP
    const cogsRow = trialBalance.rows.find(r => r.code === '5102');
    expect(round2(cogsRow.netBalance)).toBe(2400);

    // Payroll Expense (5202): 6,000 EGP
    const salRow = trialBalance.rows.find(r => r.code === '5202');
    expect(round2(salRow.netBalance)).toBe(6000);
  });
});
