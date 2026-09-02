import React, { useState } from 'react';
import { Send, Star, X } from 'lucide-react';
import {
  COPILOT_DEFAULT_REPLY,
  COPILOT_GREETING,
  COPILOT_PROMPT_LABELS,
  COPILOT_RESPONSES,
} from '../../data/copilotResponses';
import { SOCIETY_NAME } from '../../data/mockData';
import { useDashboard } from '../../context/DashboardContext';

interface CopilotMessage {
  id: string;
  type: 'u' | 'a';
  html: string;
}

let msgCounter = 0;

export const AiCopilot: React.FC = () => {
  const { copilotOpen, setCopilotOpen } = useDashboard();
  const [messages, setMessages] = useState<CopilotMessage[]>([
    { id: 'greeting', type: 'a', html: COPILOT_GREETING },
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
      addMessage(COPILOT_RESPONSES[key] || 'I can answer questions about your BMS data once connected.', 'a');
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
      addMessage(COPILOT_DEFAULT_REPLY, 'a');
    }, 900);
  };

  return (
    <>
      <button
        type="button"
        className="cbtn"
        onClick={() => setCopilotOpen(!copilotOpen)}
        title="Ask about your society"
      >
        <Star size={20} color="white" fill="white" />
      </button>
      <div className={`cpan${copilotOpen ? ' on' : ''}`} id="cpan">
        <div className="chdr">
          <div className="chi">
            <Star size={15} color="white" fill="white" />
          </div>
          <div>
            <div className="cht">AI Copilot</div>
            <div className="chs">{SOCIETY_NAME} · BMS Intelligence</div>
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
            placeholder={`Ask about ${SOCIETY_NAME}…`}
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
