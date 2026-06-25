import { describe, it, expect } from 'vitest';
import { calculateRiskScore } from '../services/riskScoring.js';

describe('Risk scoring engine', () => {
  it('returns low risk for no signals', () => {
    const result = calculateRiskScore([]);

    expect(result.score).toBe(0);
    expect(result.level).toBe('low');
    expect(result.badge).toBe('🟢');
    expect(result.explanations).toEqual([]);
  });

  it('returns medium risk when score meets the medium threshold', () => {
    const result = calculateRiskScore([
      { type: 'vague_scope' },
      { type: 'low_budget_red_flag' }
    ]);

    expect(result.score).toBe(40);
    expect(result.level).toBe('medium');
    expect(result.badge).toBe('🟡');
    expect(result.explanations[0].weight).toBeGreaterThanOrEqual(result.explanations[1].weight);
  });

  it('returns high risk when score exceeds the high threshold', () => {
    const result = calculateRiskScore([
      { type: 'requests_unpaid_work' },
      { type: 'avoids_contract_discussion' },
      { type: 'payment_avoidance' }
    ]);

    expect(result.score).toBe(80);
    expect(result.level).toBe('high');
    expect(result.badge).toBe('🔴');
  });

  it('caps score at 100 when many signals are present', () => {
    const allSignals = [
      'avoids_contract_discussion',
      'requests_unpaid_work',
      'delayed_replies',
      'vague_scope',
      'rushes_timeline',
      'low_budget_red_flag',
      'payment_avoidance',
      'negative_reviews',
      'scope_creep_history',
      'communication_issues'
    ].map(type => ({ type }));

    const result = calculateRiskScore(allSignals);

    expect(result.score).toBe(100);
    expect(result.level).toBe('high');
    expect(result.badge).toBe('🔴');
  });
});
