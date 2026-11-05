import React, { useState } from 'react';
import { Send, Star, X } from 'lucide-react';
import { COPILOT_GREETING, COPILOT_PROMPT_LABELS } from '../../data/copilotResponses';
import { useDashboard } from '../../context/DashboardContext';
import { getUser } from '@/utils/auth';

interface CopilotMessage {
  id: string;
  type: 'u' | 'a';
  html: string;
}

let msgCounter = 0;

// Genie has no live-data backend yet; the canned sample answers (with made-up figures) were removed.
const COPILOT_NOT_CONNECTED =
  "Genie isn't connected to live data yet, so I can't answer that. Your dashboard figures are live — answers will appear here once Genie is connected.";

export const AiCopilot: React.FC = () => {
  const { copilotOpen, setCopilotOpen, societyId, societies } = useDashboard();
  const societyName = societies.find((society) => society.id === societyId)?.name ?? 'this society';
  const firstName = (() => {
    try {
      return getUser()?.firstname?.trim() || '';
    } catch {
      return '';
    }
  })();
  const greeting = firstName ? `Hi ${firstName}` : 'Hi';
  const [messages, setMessages] = useState<CopilotMessage[]>([
    { id: 'greeting', type: 'a', html: COPILOT_GREETING.replace('Hi Komal', greeting) },
  ]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState('');

  const addMessage = (html: string, type: 'u' | 'a') => {
    setMessages((prev) => [...prev, { id: `m-${++msgCounter}`, type, html }]);
  };

  const askCopilot = (key: string) => {
    addMessage(COPILOT_PROMPT_LABELS[key] || key, 'u');
    setTyping(true);
    window.setTimeout(() => {
      setTyping(false);
      addMessage(COPILOT_NOT_CONNECTED, 'a');
    }, 1100);
  };

  const sendCopilot = () => {
    const v = input.trim();
    if (!v) return;
    addMessage(v, 'u');
    setInput('');
    setTyping(true);
    window.setTimeout(() => {
      setTyping(false);
      addMessage(COPILOT_NOT_CONNECTED, 'a');
    }, 900);
  };

  return (
    <>
      <button
        type="button"
        className="cbtn"
        onClick={() => setCopilotOpen(!copilotOpen)}
        title="Ask Genie"
      >
        <Star size={16} color="white" fill="white" />
        Ask Genie
      </button>
      <div className={`cpan${copilotOpen ? ' on' : ''}`} id="cpan">
        <div className="chdr">
          <div className="chi">
            <Star size={15} color="white" fill="white" />
          </div>
          <div>
            <div className="cht">Ask Genie</div>
            <div className="chs">{societyName} · Business Genie AI</div>
          </div>
          <button type="button" className="ccl" onClick={() => setCopilotOpen(false)}>
            <X size={13} color="white" />
          </button>
        </div>
        <div className="cpr">
          {Object.keys(COPILOT_PROMPT_LABELS).map((key) => (
            <button key={key} type="button" className="cpb" onClick={() => askCopilot(key)}>
              {COPILOT_PROMPT_LABELS[key]}
            </button>
          ))}
        </div>
        <div className="cms" id="cms">
          {messages.map((m) => (
            <div key={m.id} className={`cmsg ${m.type}`} dangerouslySetInnerHTML={{ __html: m.html }} />
          ))}
          {typing && (
            <div className="ctyp show" id="ctp">
              <span />
              <span />
              <span />
            </div>
          )}
        </div>
        <div className="cin-row">
          <input
            className="cinp"
            type="text"
            placeholder={`Ask about ${societyName}…`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') sendCopilot();
            }}
          />
          <button type="button" className="csnd" onClick={sendCopilot}>
            <Send size={13} />
          </button>
        </div>
      </div>
    </>
  );
};
