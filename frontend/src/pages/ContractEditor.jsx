import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';

const RED_FLAG_PATTERNS = [
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

function collectTextFromBlocks(blocks = []) {
  return blocks
    .map((block) => {
      if (!block?.data) return '';

      if (block.type === 'list') {
        return (block.data.items || []).join(' ');
      }

      return block.data.text || '';
    })
    .filter(Boolean)
    .join('\n');
}

function parseStoredContract(content) {
  if (!content) return null;

  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }

  return content;
}

function detectRedFlagsInText(text) {
  if (!text || typeof text !== 'string') return [];

  const detected = [];

  RED_FLAG_PATTERNS.forEach((flag, index) => {
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

export default function ContractEditor() {
  const editorInstance = useRef(null);
  const [savedContracts, setSavedContracts] = useState([]);
  const [selectedContractId, setSelectedContractId] = useState('');
  const [redFlags, setRedFlags] = useState([]);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);

  const loadSavedContracts = async () => {
    setLoadingContracts(true);
    try {
      const response = await axios.get('http://localhost:3001/api/contracts');
      const contracts = response.data || [];
      setSavedContracts(contracts);
      if (contracts.length > 0 && !selectedContractId) {
        setSelectedContractId(String(contracts[0].id));
      }
    } catch (error) {
      console.error('Unable to load saved contracts:', error);
    } finally {
      setLoadingContracts(false);
    }
  };

  const loadContractIntoEditor = async (contract) => {
    const parsedContract = parseStoredContract(contract?.content || contract?.projectDescription || contract?.contentBlocks);

    if (!parsedContract || !editorInstance.current) {
      return;
    }

    const renderContract = () => {
      if (editorInstance.current?.render) {
        editorInstance.current.render(parsedContract);
        const text = collectTextFromBlocks(parsedContract.blocks || []);
        setRedFlags(detectRedFlagsInText(text));
      }
    };

    if (editorInstance.current?.isReady) {
      renderContract();
    } else {
      setTimeout(renderContract, 150);
    }
  };

  useEffect(() => {
    loadSavedContracts();
  }, []);

  useEffect(() => {
    if (!editorInstance.current) {
      const editor = new EditorJS({
        holder: 'editorjs-holder',
        autofocus: true,
        placeholder: '✨ Start drafting your freelance contract terms here...',
        tools: {
          header: {
            class: Header,
            config: {
              placeholder: 'Enter section heading...',
              levels: [2, 3],
              defaultLevel: 2
            }
          },
          list: {
            class: List,
            inlineToolbar: true,
            config: {
              defaultStyle: 'unordered'
            }
          }
        },
        data: {
          time: Date.now(),
          blocks: [
            {
              type: 'paragraph',
              data: {
                text: '<b>MUTUAL NON-DISCLOSURE AGREEMENT</b>'
              }
            },
            {
              type: 'paragraph',
              data: {
                text: 'This agreement protects project data shared between Freelancer and Client...'
              }
            }
          ]
        },
        onChange: async () => {
          const savedData = await editor.save();
          const text = collectTextFromBlocks(savedData.blocks || []);
          setRedFlags(detectRedFlagsInText(text));
        }
      });

      editorInstance.current = editor;
    }

    return () => {
      if (editorInstance.current && typeof editorInstance.current.destroy === 'function') {
        editorInstance.current.destroy();
        editorInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (selectedContractId && savedContracts.length > 0) {
      const selectedContract = savedContracts.find((contract) => String(contract.id) === selectedContractId);
      if (selectedContract) {
        loadContractIntoEditor(selectedContract);
      }
    }
  }, [selectedContractId, savedContracts]);

  const handleSaveToDatabase = async () => {
    if (editorInstance.current) {
      const outputData = await editorInstance.current.save();
      setLoadingSave(true);

      try {
        const response = await axios.post('http://localhost:3001/api/contracts/generate', {
          clientName: 'Acme Corp Example',
          projectType: 'development',
          pricingModel: 'fixed',
          paymentSchedule: 'upfront',
          revisionLimit: 2,
          projectDescription: JSON.stringify(outputData),
          clientId: null
        });

        if (response.data.success) {
          await loadSavedContracts();
          alert('Contract structure saved successfully.');
        } else {
          alert('Failed to save contract structure.');
        }
      } catch (err) {
        console.error('Database communication error:', err);
        alert('Unable to save contract structure right now.');
      } finally {
        setLoadingSave(false);
      }
    }
  };

  const getSeverityStyles = (severity) => {
    const colors = {
      high: 'border-red-400 bg-red-950/70 text-red-100',
      medium: 'border-yellow-400 bg-yellow-950/70 text-yellow-100',
      low: 'border-blue-400 bg-blue-950/70 text-blue-100'
    };

    return colors[severity] || 'border-gray-500 bg-gray-900 text-gray-200';
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-900 text-white min-h-screen">
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-6 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-emerald-400">📝 Next-Gen Contract Workspace</h1>
          <p className="text-sm text-gray-400 mt-1">Powered by an open-source, block-styled engine with live risk review.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => loadSavedContracts()}
            className="bg-gray-700 hover:bg-gray-600 font-semibold px-4 py-2 rounded-lg transition"
          >
            {loadingContracts ? 'Loading...' : 'Refresh Contracts'}
          </button>
          <button
            onClick={handleSaveToDatabase}
            disabled={loadingSave}
            className="bg-emerald-600 hover:bg-emerald-500 font-semibold px-5 py-2 rounded-lg transition shadow-md disabled:opacity-60"
          >
            {loadingSave ? 'Saving...' : 'Save Structure'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_0.8fr] gap-6 mb-6">
        <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
          <label className="block text-sm font-medium text-gray-300 mb-2">Load a saved contract</label>
          <select
            value={selectedContractId}
            onChange={(event) => setSelectedContractId(event.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100"
          >
            {savedContracts.length === 0 ? (
              <option value="">No saved contracts yet</option>
            ) : (
              savedContracts.map((contract) => (
                <option key={contract.id} value={String(contract.id)}>
                  {contract.clientId ? `Contract #${contract.id}` : `Draft #${contract.id}`} — {contract.projectType || 'contract'}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
          <h2 className="text-sm font-semibold text-emerald-300 mb-2">Live Red Flag Review</h2>
          <p className="text-xs text-gray-400">The editor scans your contract text as you type and highlights risky language.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.6fr] gap-6">
        <div className="bg-gray-950 p-8 rounded-xl border border-gray-800 shadow-inner min-h-[520px]">
          <div
            id="editorjs-holder"
            className="prose prose-invert max-w-none text-gray-200 focus:outline-none"
          />
        </div>

        <div className="space-y-4">
          <div className="bg-gray-950 rounded-xl border border-gray-800 p-4">
            <h3 className="text-sm font-semibold text-emerald-300 mb-3">Detected Red Flags</h3>
            {redFlags.length === 0 ? (
              <p className="text-sm text-gray-400">No risky phrases detected yet. Start typing to review the contract language.</p>
            ) : (
              <div className="space-y-2">
                {redFlags.map((flag) => (
                  <div key={flag.id} className={`rounded-lg border p-3 ${getSeverityStyles(flag.severity)}`}>
                    <div className="text-xs uppercase tracking-wide font-semibold mb-1">
                      {flag.severity} severity
                    </div>
                    <div className="text-sm font-medium">“{flag.matchedText}”</div>
                    <div className="text-xs mt-1 opacity-90">{flag.explanation}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
