import { useState } from 'react';
import axios from 'axios';

export default function RedFlagDetector() {
  const [text, setText] = useState('');
  const [redFlags, setRedFlags] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!text.trim()) {
      alert('Please enter some text to analyze');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/risk/detect', { text });
      setRedFlags(response.data.redFlags || []);
    } catch (error) {
      console.error('Error detecting red flags:', error);
      // Fallback to client-side detection if API fails
      detectRedFlagsClientSide();
    } finally {
      setLoading(false);
    }
  };

  // Client-side fallback detection
  const detectRedFlagsClientSide = () => {
    const flags = [];
    const patterns = [
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

    patterns.forEach((flag, index) => {
      const matches = text.match(flag.pattern);
      if (matches) {
        flags.push({
          id: index,
          matchedText: matches[0],
          explanation: flag.explanation,
          severity: flag.severity,
          position: text.indexOf(matches[0])
        });
      }
    });

    setRedFlags(flags.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    }));
  };

  const getSeverityColor = (severity) => {
    const colors = {
      high: 'bg-red-100 text-red-800 border-red-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-blue-100 text-blue-800 border-blue-300'
    };
    return colors[severity] || colors.medium;
  };

  const highlightText = (text, flags) => {
    if (flags.length === 0) return text;

    let highlighted = text;
    const sortedFlags = [...flags].sort((a, b) => b.position - a.position);

    sortedFlags.forEach(flag => {
      const before = highlighted.substring(0, flag.position);
      const match = highlighted.substring(flag.position, flag.position + flag.matchedText.length);
      const after = highlighted.substring(flag.position + flag.matchedText.length);

      const severityClass = flag.severity === 'high' ? 'bg-red-200' : flag.severity === 'medium' ? 'bg-yellow-200' : 'bg-blue-200';
      
      highlighted = before + `<mark class="${severityClass} px-1 rounded" title="${flag.explanation}">${match}</mark>` + after;
    });

    return highlighted;
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Red Flag Detector</h2>
        <p className="mt-2 text-gray-600">
          Paste client messages or project descriptions to detect potential red flags and risky language.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Analyze Text</h3>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste client message, project description, or any text to analyze for red flags..."
            rows="15"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
          />
          <button
            onClick={handleAnalyze}
            disabled={loading || !text.trim()}
            className="mt-4 w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Analyzing...' : 'Detect Red Flags'}
          </button>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Results</h3>
            {redFlags.length > 0 && (
              <span className="text-sm text-gray-600">
                {redFlags.length} flag{redFlags.length !== 1 ? 's' : ''} detected
              </span>
            )}
          </div>

          {redFlags.length === 0 ? (
            <div className="bg-gray-50 rounded p-8 border border-gray-200 text-center text-gray-500">
              {text ? 'No red flags detected. Click "Detect Red Flags" to analyze.' : 'Enter text to analyze for red flags'}
            </div>
          ) : (
            <div className="space-y-3">
              {redFlags.map((flag) => (
                <div
                  key={flag.id}
                  className={`border-2 rounded-lg p-4 ${getSeverityColor(flag.severity)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-semibold mb-1">
                        <span className="mr-2">
                          {flag.severity === 'high' ? '🔴' : flag.severity === 'medium' ? '🟡' : '🔵'}
                        </span>
                        {flag.severity.toUpperCase()} Severity
                      </div>
                      <div className="text-sm font-mono bg-white bg-opacity-50 rounded px-2 py-1 mb-2">
                        "{flag.matchedText}"
                      </div>
                      <div className="text-sm opacity-90">
                        {flag.explanation}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Highlighted Text Preview */}
          {redFlags.length > 0 && text && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Highlighted Text</h4>
              <div
                className="bg-gray-50 rounded p-4 border border-gray-200 text-sm whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: highlightText(text, redFlags) }}
              />
              <div className="mt-2 flex gap-4 text-xs text-gray-600">
                <span><span className="inline-block w-3 h-3 bg-red-200 rounded mr-1"></span> High</span>
                <span><span className="inline-block w-3 h-3 bg-yellow-200 rounded mr-1"></span> Medium</span>
                <span><span className="inline-block w-3 h-3 bg-blue-200 rounded mr-1"></span> Low</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

