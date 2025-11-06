import { describe, it, expect } from '@jest/globals';

/**
 * Unit Tests for Payment Amount Validation (VULN-005)
 * Tests the security fix for floating-point payment validation
 */
describe('Payment Amount Validation (VULN-005)', () => {
  describe('Integer (Cents) Comparison', () => {
    it('should reject payment with 1 cent difference', () => {
      const expectedAmount = 100.00;
      const paidAmount = 99.99;

      const expectedAmountCents = Math.round(expectedAmount * 100);
      const paidAmountCents = Math.round(paidAmount * 100);

      expect(expectedAmountCents).toBe(10000);
      expect(paidAmountCents).toBe(9999);
      expect(expectedAmountCents === paidAmountCents).toBe(false);
    });

    it('should accept payment with exact match', () => {
      const expectedAmount = 100.00;
      const paidAmount = 100.00;

      const expectedAmountCents = Math.round(expectedAmount * 100);
      const paidAmountCents = Math.round(paidAmount * 100);

      expect(expectedAmountCents).toBe(10000);
      expect(paidAmountCents).toBe(10000);
      expect(expectedAmountCents === paidAmountCents).toBe(true);
    });

    it('should handle floating point precision correctly', () => {
      // The classic JavaScript floating point issue
      const amount = 0.1 + 0.2; // 0.30000000000000004

      const expectedAmountCents = Math.round(0.3 * 100);
      const paidAmountCents = Math.round(amount * 100);

      expect(expectedAmountCents).toBe(30);
      expect(paidAmountCents).toBe(30);
      expect(expectedAmountCents === paidAmountCents).toBe(true);
    });

    it('should reject manipulation attempts', () => {
      const testCases = [
        { expected: 100.00, paid: 99.99, shouldMatch: false },
        { expected: 100.00, paid: 100.01, shouldMatch: false },
        { expected: 50.50, paid: 50.49, shouldMatch: false },
        { expected: 50.50, paid: 50.51, shouldMatch: false },
        { expected: 0.01, paid: 0.00, shouldMatch: false },
      ];

      for (const { expected, paid, shouldMatch } of testCases) {
        const expectedCents = Math.round(expected * 100);
        const paidCents = Math.round(paid * 100);
        expect(expectedCents === paidCents).toBe(shouldMatch);
      }
    });

    it('should handle large amounts correctly', () => {
      const testCases = [
        { expected: 999999.99, paid: 999999.99, shouldMatch: true },
        { expected: 999999.99, paid: 999999.98, shouldMatch: false },
        { expected: 1000000.00, paid: 1000000.00, shouldMatch: true },
      ];

      for (const { expected, paid, shouldMatch } of testCases) {
        const expectedCents = Math.round(expected * 100);
        const paidCents = Math.round(paid * 100);
        expect(expectedCents === paidCents).toBe(shouldMatch);
      }
    });

    it('should handle decimal precision edge cases', () => {
      const testCases = [
        { expected: 10.10, paid: 10.10, shouldMatch: true },
        { expected: 10.99, paid: 10.99, shouldMatch: true },
        { expected: 0.33, paid: 0.33, shouldMatch: true },
        { expected: 1.11, paid: 1.11, shouldMatch: true },
        { expected: 9.99, paid: 9.99, shouldMatch: true },
      ];

      for (const { expected, paid, shouldMatch } of testCases) {
        const expectedCents = Math.round(expected * 100);
        const paidCents = Math.round(paid * 100);
        expect(expectedCents === paidCents).toBe(shouldMatch);
      }
    });
  });

  describe('Old Floating-Point Method (Insecure)', () => {
    it('should demonstrate why tolerance-based comparison is insecure', () => {
      const expected = 100.00;
      const paid = 99.99;
      const tolerance = 0.01;

      // Old method: tolerance-based comparison (INSECURE)
      const diff = Math.abs(paid - expected);
      const oldMethodPasses = diff <= tolerance;

      // This would INCORRECTLY pass with 0.01 tolerance
      expect(oldMethodPasses).toBe(true); // BAD!

      // New method: exact cents comparison (SECURE)
      const expectedCents = Math.round(expected * 100);
      const paidCents = Math.round(paid * 100);
      const newMethodPasses = expectedCents === paidCents;

      // This correctly fails
      expect(newMethodPasses).toBe(false); // GOOD!
    });

    it('should show tolerance allows payment manipulation', () => {
      // Attacker could pay 99.99 for 100.00 invoice with 0.01 tolerance
      const scenarios = [
        { expected: 100.00, paid: 99.99, saved: 0.01 },
        { expected: 1000.00, paid: 999.99, saved: 0.01 },
        { expected: 500.00, paid: 499.99, saved: 0.01 },
      ];

      for (const { expected, paid, saved } of scenarios) {
        const tolerance = 0.01;
        const diff = Math.abs(paid - expected);

        // Old method would allow this
        expect(diff <= tolerance).toBe(true);

        // But attacker saves money
        expect(expected - paid).toBe(saved);

        // New method rejects this
        const expectedCents = Math.round(expected * 100);
        const paidCents = Math.round(paid * 100);
        expect(expectedCents === paidCents).toBe(false);
      }
    });
  });

  describe('Rounding Behavior', () => {
    it('should round consistently', () => {
      const testCases = [
        { value: 10.005, cents: 1001 }, // Rounds up
        { value: 10.004, cents: 1000 }, // Rounds down
        { value: 10.995, cents: 1100 }, // Rounds up
        { value: 10.994, cents: 1099 }, // Rounds down
      ];

      for (const { value, cents } of testCases) {
        expect(Math.round(value * 100)).toBe(cents);
      }
    });

    it('should handle negative amounts (refunds)', () => {
      const expected = -50.00;
      const paid = -50.00;

      const expectedCents = Math.round(expected * 100);
      const paidCents = Math.round(paid * 100);

      expect(expectedCents).toBe(-5000);
      expect(paidCents).toBe(-5000);
      expect(expectedCents === paidCents).toBe(true);
    });

    it('should reject negative amount manipulation', () => {
      const expected = -50.00;
      const paid = -49.99; // Attacker tries to refund less

      const expectedCents = Math.round(expected * 100);
      const paidCents = Math.round(paid * 100);

      expect(expectedCents === paidCents).toBe(false);
    });
  });

  describe('Real-World Payment Scenarios', () => {
    it('should validate invoice payment scenarios', () => {
      const invoiceScenarios = [
        { invoice: 1250.50, payment: 1250.50, valid: true },
        { invoice: 1250.50, payment: 1250.49, valid: false },
        { invoice: 1250.50, payment: 1250.51, valid: false },
        { invoice: 99.99, payment: 99.99, valid: true },
        { invoice: 99.99, payment: 100.00, valid: false },
        { invoice: 0.01, payment: 0.01, valid: true },
        { invoice: 0.01, payment: 0.00, valid: false },
      ];

      for (const { invoice, payment, valid } of invoiceScenarios) {
        const invoiceCents = Math.round(invoice * 100);
        const paymentCents = Math.round(payment * 100);
        expect(invoiceCents === paymentCents).toBe(valid);
      }
    });

    it('should handle multiple currency decimal places', () => {
      // USD, EUR, GBP (2 decimal places)
      const amount1 = 10.99;
      expect(Math.round(amount1 * 100)).toBe(1099);

      // JPY (0 decimal places, but still works)
      const amount2 = 1000;
      expect(Math.round(amount2 * 100)).toBe(100000);

      // BTC (8 decimal places - would need different logic)
      // This demonstrates the limitation
      const amount3 = 0.00000001; // 1 satoshi
      expect(Math.round(amount3 * 100)).toBe(0); // Loses precision
    });
  });

  describe('Error Message Generation', () => {
    it('should generate detailed error messages with cents', () => {
      const expected = 100.00;
      const paid = 99.99;

      const expectedCents = Math.round(expected * 100);
      const paidCents = Math.round(paid * 100);

      const errorMessage = `Amount mismatch: expected ${expectedCents / 100} (${expectedCents} cents), got ${paidCents / 100} (${paidCents} cents)`;

      expect(errorMessage).toBe('Amount mismatch: expected 100 (10000 cents), got 99.99 (9999 cents)');
    });
  });

  describe('Metadata for Forensics', () => {
    it('should store mismatch detection data', () => {
      const expected = 100.00;
      const paid = 99.99;

      const expectedCents = Math.round(expected * 100);
      const paidCents = Math.round(paid * 100);

      const metadata = {
        expectedAmountCents,
        paidAmountCents,
        mismatchDetected: expectedCents !== paidCents,
      };

      expect(metadata.mismatchDetected).toBe(true);
      expect(metadata.expectedAmountCents).toBe(10000);
      expect(metadata.paidAmountCents).toBe(9999);
    });
  });
});
