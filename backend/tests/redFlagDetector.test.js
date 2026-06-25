import { describe, it, expect } from 'vitest';
import { detectRedFlags, getRedFlagCount, getRedFlagSeverity } from '../services/redFlagDetector.js';

describe('Red flag detector', () => {
  it('detects high-severity exposure language', () => {
    const text = 'This is a great exposure opportunity for your portfolio.';
    const flags = detectRedFlags(text);

    expect(flags.length).toBeGreaterThan(0);
    expect(flags[0].severity).toBe('high');
    expect(getRedFlagCount(text)).toBe(flags.length);
    expect(getRedFlagSeverity(text)).toBe('high');
  });

  it('detects medium-severity urgent or unpaid payment phrasing', () => {
    const text = 'We need it done yesterday and can only offer pay on delivery.';
    const severity = getRedFlagSeverity(text);

    expect(severity).toBe('medium');
    expect(getRedFlagCount(text)).toBeGreaterThanOrEqual(1);
  });

  it('orders detected flags by severity descending', () => {
    const text = 'This is a great exposure opportunity and we need it done yesterday.';
    const flags = detectRedFlags(text);

    expect(flags[0].severity).toBe('high');
    expect(flags[flags.length - 1].severity).not.toBe('high');
  });

  it('returns none severity for clean text', () => {
    const text = 'Please send your proposal and timeline for review.';

    expect(detectRedFlags(text)).toEqual([]);
    expect(getRedFlagCount(text)).toBe(0);
    expect(getRedFlagSeverity(text)).toBe('none');
  });

});
