// Risk scoring rules and weights
const RISK_SIGNALS = {
  avoids_contract_discussion: { weight: 25, description: 'Avoids contract discussion' },
  requests_unpaid_work: { weight: 30, description: 'Requests unpaid work or samples' },
  delayed_replies: { weight: 15, description: 'Delayed replies (>48 hours)' },
  vague_scope: { weight: 20, description: 'Vague or unclear project scope' },
  rushes_timeline: { weight: 10, description: 'Unrealistic or rushed timeline' },
  low_budget_red_flag: { weight: 20, description: 'Budget significantly below market rate' },
  payment_avoidance: { weight: 25, description: 'Avoids payment discussion or negotiation' },
  negative_reviews: { weight: 15, description: 'Negative reviews or feedback from other freelancers' },
  scope_creep_history: { weight: 15, description: 'History of scope creep or changing requirements' },
  communication_issues: { weight: 10, description: 'Poor communication or unprofessional behavior' }
};

export function calculateRiskScore(signals, context = {}) {
  let totalScore = 0;
  const explanations = [];
  const hasHighRiskCommunication = signals.some(signal =>
    signal.type === 'communication_issues' && /high|severe|risk|unprofessional|aggressive/i.test(signal.details || '')
  );

  signals.forEach(signal => {
    if (RISK_SIGNALS[signal.type]) {
      const signalData = RISK_SIGNALS[signal.type];
      let adjustedWeight = signalData.weight;

      if (
        hasHighRiskCommunication &&
        context.upfrontDepositPaid === true &&
        context.depositPercent === 100
      ) {
        adjustedWeight = Math.max(0, Math.round(signalData.weight * 0.5));
      }

      totalScore += adjustedWeight;
      explanations.push({
        type: signal.type,
        description: signalData.description,
        weight: adjustedWeight,
        details: signal.details || ''
      });
    }
  });

  // Cap at 100
  totalScore = Math.min(totalScore, 100);

  // Determine risk level
  let riskLevel = 'low';
  let badge = '🟢';

  if (totalScore >= 70) {
    riskLevel = 'high';
    badge = '🔴';
  } else if (totalScore >= 40) {
    riskLevel = 'medium';
    badge = '🟡';
  }

  return {
    score: totalScore,
    level: riskLevel,
    badge,
    explanations: explanations.sort((a, b) => b.weight - a.weight) // Sort by weight descending
  };
}

export function getRiskSignals() {
  return RISK_SIGNALS;
}

