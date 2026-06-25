// Red flag keywords and phrases with explanations
const RED_FLAGS = [
  {
    pattern: /exposure|exposure opportunity|great exposure|portfolio piece/i,
    explanation: 'Often used to avoid payment. Real work deserves real payment.',
    severity: 'high'
  },
  {
    pattern: /unpaid trial|free sample|test project|unpaid work/i,
    explanation: 'Requests for unpaid work are a major red flag. Legitimate clients pay for quality.',
    severity: 'high'
  },
  {
    pattern: /we'll pay you later|payment after launch|revenue share only/i,
    explanation: 'Deferred payment or revenue share without upfront payment is risky.',
    severity: 'high'
  },
  {
    pattern: /need it done yesterday|urgent|asap|rush job/i,
    explanation: 'Unrealistic timelines often indicate poor planning or unrealistic expectations.',
    severity: 'medium'
  },
  {
    pattern: /we're a startup|tight budget|can't afford much/i,
    explanation: 'While understandable, this may indicate undervaluing your work.',
    severity: 'medium'
  },
  {
    pattern: /we'll give you more work later|future projects/i,
    explanation: 'Promises of future work without current commitment are unreliable.',
    severity: 'medium'
  },
  {
    pattern: /just make it look good|you're the expert|figure it out/i,
    explanation: 'Vague requirements can lead to scope creep and payment disputes.',
    severity: 'medium'
  },
  {
    pattern: /we'll credit you|attribution|byline/i,
    explanation: 'Attribution alone doesn\'t pay bills. Ensure payment is discussed.',
    severity: 'low'
  },
  {
    pattern: /many revisions|unlimited revisions|keep tweaking/i,
    explanation: 'Unlimited revisions can lead to endless work without additional pay.',
    severity: 'medium'
  },
  {
    pattern: /pay on delivery|pay when done|payment after completion/i,
    explanation: 'Payment after delivery puts all risk on you. Consider milestone payments.',
    severity: 'medium'
  }
];

export function detectRedFlags(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const detected = [];

  RED_FLAGS.forEach((flag, index) => {
    const matches = text.match(flag.pattern);
    if (matches) {
      detected.push({
        id: index,
        matchedText: matches[0],
        explanation: flag.explanation,
        severity: flag.severity,
        position: text.indexOf(matches[0])
      });
    }
  });

  return detected.sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });
}

export function getRedFlagCount(text) {
  return detectRedFlags(text).length;
}

export function getRedFlagSeverity(text) {
  const flags = detectRedFlags(text);
  if (flags.length === 0) return 'none';
  
  const hasHigh = flags.some(f => f.severity === 'high');
  if (hasHigh) return 'high';
  
  const hasMedium = flags.some(f => f.severity === 'medium');
  if (hasMedium) return 'medium';
  
  return 'low';
}

