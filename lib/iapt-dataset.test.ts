import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  getPHQ9Severity,
  getGAD7Severity,
  getWSASSeverity,
  calculateReliableChange,
  calculateRecovery,
  PHQ9_SEVERITY,
  GAD7_SEVERITY,
  WSAS_SEVERITY
} from './iapt-dataset.ts';

describe('IAPT Dataset Utilities', () => {
  describe('getPHQ9Severity', () => {
    it('should return correct severity labels for PHQ-9 scores', () => {
      assert.strictEqual(getPHQ9Severity(0), PHQ9_SEVERITY.minimal.label);
      assert.strictEqual(getPHQ9Severity(4), PHQ9_SEVERITY.minimal.label);
      assert.strictEqual(getPHQ9Severity(5), PHQ9_SEVERITY.mild.label);
      assert.strictEqual(getPHQ9Severity(9), PHQ9_SEVERITY.mild.label);
      assert.strictEqual(getPHQ9Severity(10), PHQ9_SEVERITY.moderate.label);
      assert.strictEqual(getPHQ9Severity(14), PHQ9_SEVERITY.moderate.label);
      assert.strictEqual(getPHQ9Severity(15), PHQ9_SEVERITY.moderatelySevere.label);
      assert.strictEqual(getPHQ9Severity(19), PHQ9_SEVERITY.moderatelySevere.label);
      assert.strictEqual(getPHQ9Severity(20), PHQ9_SEVERITY.severe.label);
      assert.strictEqual(getPHQ9Severity(27), PHQ9_SEVERITY.severe.label);
    });
  });

  describe('getGAD7Severity', () => {
    it('should return correct severity labels for GAD-7 scores', () => {
      assert.strictEqual(getGAD7Severity(0), GAD7_SEVERITY.minimal.label);
      assert.strictEqual(getGAD7Severity(4), GAD7_SEVERITY.minimal.label);
      assert.strictEqual(getGAD7Severity(5), GAD7_SEVERITY.mild.label);
      assert.strictEqual(getGAD7Severity(9), GAD7_SEVERITY.mild.label);
      assert.strictEqual(getGAD7Severity(10), GAD7_SEVERITY.moderate.label);
      assert.strictEqual(getGAD7Severity(14), GAD7_SEVERITY.moderate.label);
      assert.strictEqual(getGAD7Severity(15), GAD7_SEVERITY.severe.label);
      assert.strictEqual(getGAD7Severity(21), GAD7_SEVERITY.severe.label);
    });
  });

  describe('getWSASSeverity', () => {
    it('should return correct severity labels for WSAS scores', () => {
      assert.strictEqual(getWSASSeverity(0), WSAS_SEVERITY.subclinical.label);
      assert.strictEqual(getWSASSeverity(9), WSAS_SEVERITY.subclinical.label);
      assert.strictEqual(getWSASSeverity(10), WSAS_SEVERITY.mild.label);
      assert.strictEqual(getWSASSeverity(19), WSAS_SEVERITY.mild.label);
      assert.strictEqual(getWSASSeverity(20), WSAS_SEVERITY.moderate.label);
      assert.strictEqual(getWSASSeverity(29), WSAS_SEVERITY.moderate.label);
      assert.strictEqual(getWSASSeverity(30), WSAS_SEVERITY.severe.label);
      assert.strictEqual(getWSASSeverity(40), WSAS_SEVERITY.severe.label);
    });
  });

  describe('calculateReliableChange', () => {
    it('should correctly identify reliable change for PHQ-9', () => {
      // Threshold is 6
      assert.deepStrictEqual(calculateReliableChange(15, 9, 'PHQ9'), {
        changed: true,
        improved: true,
        deteriorated: false
      });
      assert.deepStrictEqual(calculateReliableChange(15, 10, 'PHQ9'), {
        changed: false,
        improved: false,
        deteriorated: false
      });
      assert.deepStrictEqual(calculateReliableChange(10, 16, 'PHQ9'), {
        changed: true,
        improved: false,
        deteriorated: true
      });
    });

    it('should correctly identify reliable change for GAD-7', () => {
      // Threshold is 4
      assert.deepStrictEqual(calculateReliableChange(10, 6, 'GAD7'), {
        changed: true,
        improved: true,
        deteriorated: false
      });
      assert.deepStrictEqual(calculateReliableChange(10, 7, 'GAD7'), {
        changed: false,
        improved: false,
        deteriorated: false
      });
      assert.deepStrictEqual(calculateReliableChange(6, 10, 'GAD7'), {
        changed: true,
        improved: false,
        deteriorated: true
      });
    });
  });

  describe('calculateRecovery', () => {
    it('should return recovered true when criteria are met', () => {
      // Criteria: was above caseness, now below, and reliably improved
      // PHQ9 caseness: 10, GAD7 caseness: 8
      // PHQ9 reliable change: 6, GAD7 reliable change: 4

      const result = calculateRecovery(
        15, // initial PHQ9 (above caseness)
        9,  // current PHQ9 (below caseness, improved by 6)
        10, // initial GAD7 (above caseness)
        7   // current GAD7 (below caseness, improved by 3 - not reliable but PHQ9 is)
      );

      assert.strictEqual(result.recovered, true);
      assert.strictEqual(result.reliablyImproved, true);
      assert.strictEqual(result.reliablyDeteriorated, false);
    });

    it('should return recovered false when not reliably improved', () => {
      const result = calculateRecovery(
        15, 10, // initial/current PHQ9 (improved by 5 - not reliable)
        10, 7   // initial/current GAD7 (improved by 3 - not reliable)
      );

      assert.strictEqual(result.recovered, false);
      assert.strictEqual(result.reliablyImproved, false);
    });

    it('should return recovered false when still above caseness', () => {
      const result = calculateRecovery(
        20, 10, // PHQ9 improved by 10 (reliable) but still at caseness (10)
        10, 5   // GAD7 improved by 5 (reliable) and below caseness
      );

      assert.strictEqual(result.recovered, false);
    });

    it('should correctly identify reliable deterioration', () => {
      const result = calculateRecovery(
        10, 16, // PHQ9 deteriorated by 6 (reliable)
        5, 5
      );

      assert.strictEqual(result.reliablyDeteriorated, true);
    });
  });
});
