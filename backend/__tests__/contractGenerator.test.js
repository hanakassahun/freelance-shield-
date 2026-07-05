import { generateContract } from '../services/contractGenerator.js';
import { describe, it, expect } from 'vitest';

describe('Contract Generator Service', () => {
  it('generates a service agreement containing the project type and client name', () => {
    const contract = generateContract({
      projectType: 'design',
      pricingModel: 'fixed',
      paymentSchedule: 'upfront',
      revisionLimit: 3,
      clientName: 'Acme Corp',
      projectDescription: 'Build a landing page.'
    });

    expect(contract).toContain('SERVICE AGREEMENT');
    expect(contract).toContain('Acme Corp');
    expect(contract).toContain('Fixed Price:');
    expect(contract).toContain('100% payment due upfront before work begins.');
    expect(contract).toContain('3 round(s) of revisions');
  });

  it('includes late fee language for the payment terms section', () => {
    const contract = generateContract({
      projectType: 'development',
      pricingModel: 'hourly',
      paymentSchedule: 'on-delivery',
      revisionLimit: 2,
      clientName: 'Beta LLC',
      projectDescription: 'Develop a web application.'
    });

    expect(contract).toContain('**Hourly Rate:** Services will be billed at [RATE] USD per hour');
    expect(contract).toContain('**Payment Schedule:** Payment due upon delivery of completed work.');
    expect(contract).toContain('late fee per week');
  });
});
