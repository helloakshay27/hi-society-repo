import React, { useState, useEffect, useCallback } from 'react';

export type SurveyOption = { id: string | number; label: string };

export type SurveyQuestion = { id: string | number; title: string; required?: boolean; qtype?: string; options?: SurveyOption[] };

interface FioutMobileViewProps {
  logoSrc?: string;
  backgroundSrc?: string;
  onSubmit?: (answers: Record<string, string>, comments: string) => void;
}

const FioutMobileView: React.FC<FioutMobileViewProps> = ({ logoSrc, backgroundSrc, onSubmit }) => {
  const defaultLogo = 'https://www.persistent.com/wp-content/themes/persistent/dist/images/Persistent-Header-Logo-Black_460dd8e4.svg';
  const defaultBackground = 'https://lockated-public.s3.ap-south-1.amazonaws.com/attachfiles/documents/8412446/original/4.YOO_Villas_Villa_2_Vintage_Living_3.png';

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [comments, setComments] = useState('');
  const [categories, setCategories] = useState<{ name: string; questions: SurveyQuestion[] }[]>([]);

  const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);

  type FitoutSnagOption = { id: number | string; qname?: string };
  type FitoutSnagQuestion = { id: number | string; qtype: string; descr: string; quest_mandatory?: boolean; snag_quest_options?: FitoutSnagOption[] };
  type FitoutItem = { id?: number | string; name?: string; snag_questions: Array<{ snag_question: FitoutSnagQuestion }> };

  const adaptFromFitout = useCallback((payload: FitoutItem[]) => {
    return (payload || []).map((item) => ({
      name: item.name || 'Category',
      questions: (item.snag_questions || []).map((entry) => {
        const s = entry.snag_question;
        let qtype = s.qtype;
        if (qtype === 'text') qtype = 'inputbox';
        return {
          id: s.id,
          title: s.descr,
          required: !!s.quest_mandatory,
          qtype,
          options: (s.snag_quest_options || []).map((o) => ({ id: o.id, label: o.qname || String(o.id) })),
        } as SurveyQuestion;
      }),
    }));
  }, []);

  const MobileDatePicker: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
    const split = (value || '').split('-');
    const [y, m, d] = split.length === 3 ? [split[0], split[1], split[2]] : ['', '', ''];
    const now = new Date();
    const curYear = now.getFullYear();
    const years = Array.from({ length: 11 }, (_, i) => String(curYear - 5 + i));
    const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
    const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
    const emit = (yy: string, mm: string, dd: string) => {
      if (!yy || !mm || !dd) return onChange('');
      onChange(`${yy}-${mm}-${dd}`);
    };
    return (
      <div className="grid grid-cols-3 gap-2">
        <select value={d} onChange={(e) => emit(y || String(curYear), m || '01', e.target.value)} className="border rounded px-2 py-2 w-full">
          <option value="">Day</option>
          {days.map((dd) => (
            <option key={dd} value={dd}>{dd}</option>
          ))}
        </select>
        <select value={m} onChange={(e) => emit(y || String(curYear), e.target.value, d || '01')} className="border rounded px-2 py-2 w-full">
          <option value="">Month</option>
          {months.map((mm) => (
            <option key={mm} value={mm}>{mm}</option>
          ))}
        </select>
        <select value={y} onChange={(e) => emit(e.target.value, m || '01', d || '01')} className="border rounded px-2 py-2 w-full">
          <option value="">Year</option>
          {years.map((yy) => (
            <option key={yy} value={yy}>{yy}</option>
          ))}
        </select>
      </div>
    );
  };

  useEffect(() => {
    const url = 'https://uat-hi-society.lockated.com/crm/admin/fitout_requests/B6EBB5FCE533E099649AC2A37F0C12F9/fitout_mappings.json';
    let cancelled = false;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error('Network response not ok');
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        const payload = Array.isArray(data) ? data : (data || []);
        const adapted = adaptFromFitout(payload as FitoutItem[]);
        setCategories(adapted || []);
      })
      .catch(() => { if (!cancelled) setCategories([]); });
    return () => { cancelled = true; };
  }, [adaptFromFitout]);

  const selectOption = (qid: string | number, value: string | number) => setAnswers((s) => ({ ...s, [String(qid)]: String(value) }));
  const setOpenAnswer = (qid: string | number, value: string) => setAnswers((s) => ({ ...s, [String(qid)]: value }));

  // Toggle the required flag for a question in local component state
  const toggleRequired = (qid: string | number) => {
    setCategories((prev) => prev.map((cat) => ({
      ...cat,
      questions: cat.questions.map((qq) => (qq.id === qid ? { ...qq, required: !qq.required } : qq)),
    })));
  };

  const allRequiredAnswered = () => {
    const reqs = categories.flatMap((c) => c.questions.filter((q) => q.required));
    return reqs.every((q) => {
      const val = answers[String(q.id)];
      return typeof val === 'string' && val.trim().length > 0;
    });
  };

  const handleSubmit = () => { if (!allRequiredAnswered()) return; onSubmit?.(answers, comments); };

  const backgroundUrl = backgroundSrc || defaultBackground;
  const containerStyle: React.CSSProperties = { backgroundImage: `url(${backgroundUrl})`, backgroundSize: 'cover', backgroundPosition: 'center 30%', backgroundRepeat: 'no-repeat', filter: 'brightness(0.85)', minHeight: '100dvh' };

  const displayedCategory = (categories && categories[0] && categories[0].name) || 'Fitout setup';

  return (
    <div className="min-h-screen w-full bg-cover bg-center flex flex-col items-center" style={containerStyle}>
      <div className="w-full max-w-md px-4 pt-24">
        <div className="relative">
          <img src={logoSrc || defaultLogo} alt="logo" className="absolute right-0 top-0 h-10 opacity-90" />
        </div>
      </div>

      <div className="w-full max-w-md px-4 mt-14">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-black tracking-tight">{}</h1>
        </div>
      </div>

      <div className="w-full max-w-md px-4 mt-4 flex-1 pb-40">
        <div className="bg-white/90 border border-gray-200 rounded-md shadow-md p-4 space-y-6">
          {categories.map((cat, cidx) => (
            <div key={cidx}>
              {categories.length > 1 && <div className="text-xl font-semibold text-gray-700 mb-2">{cat.name}</div>}
              {cat.questions.map((q, idx) => (
                <div key={q.id}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start mb-2">
                    <div className="md:col-span-1">
                      <div className="text-[16px] md:text-base font-medium">{`${idx + 1}. ${q.title}`}{q.required && <span className="text-[#C72030] ml-1">*</span>}</div>
                    </div>

                    <div className="md:col-span-2">
                      <div className="space-y-3">
                        {q.qtype === 'inputbox' && !/time/i.test(String(q.title)) && (
                          <input type="text" value={answers[String(q.id)] || ''} onChange={(e) => setOpenAnswer(q.id, e.target.value)} placeholder="Enter your answer" className="w-full border rounded px-3 py-3 bg-white" />
                        )}

                        {(q.qtype === 'time' || (q.qtype === 'inputbox' && /time/i.test(String(q.title)))) && (
                          <input type="time" className="border rounded px-2 py-2" value={answers[String(q.id)] || ''} onChange={(e) => setOpenAnswer(q.id, e.target.value)} />
                        )}

                        {q.qtype === 'description' && (
                          <textarea value={answers[String(q.id)] || ''} onChange={(e) => setOpenAnswer(q.id, e.target.value)} placeholder="Write your answer..." className="w-full min-h-[100px] resize-none bg-white border border-gray-300 rounded p-3 text-sm" />
                        )}

                        {q.qtype === 'date_range' && (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Start Date</div>
                              <input type="date" className="border rounded px-2 py-2 w-full" value={answers[String(q.id) + '_start'] || ''} onChange={(e) => setOpenAnswer(`${q.id}_start`, e.target.value)} />
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">End Date</div>
                              <input type="date" className="border rounded px-2 py-2 w-full" value={answers[String(q.id) + '_end'] || ''} onChange={(e) => setOpenAnswer(`${q.id}_end`, e.target.value)} />
                            </div>
                          </div>
                        )}

                        {q.qtype === 'date' && (
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Select Date</div>
                            {isMobile ? (
                              <MobileDatePicker value={answers[String(q.id)] || ''} onChange={(v) => setOpenAnswer(q.id, v)} />
                            ) : (
                              <input type="date" className="border rounded px-2 py-2 w-full" value={answers[String(q.id)] || ''} onChange={(e) => setOpenAnswer(q.id, e.target.value)} />
                            )}
                          </div>
                        )}

                        {q.qtype === 'multiple' && q.options && q.options.map((opt) => {
                          const selected = answers[String(q.id)] === String(opt.id);
                          return (
                            <label key={opt.id} className={`w-full block border ${selected ? 'border-[#1E56D6] bg-[#E8F0FF]' : 'border-gray-200 bg-white'} rounded p-3 mb-2 cursor-pointer`}>
                              <div className="flex items-center justify-between">
                                <div className={`text-sm font-medium ${selected ? 'text-blue-700' : 'text-gray-900'}`}>{opt.label}</div>
                                <input type="radio" name={`q_${q.id}`} checked={selected} onChange={() => selectOption(q.id, opt.id)} />
                              </div>
                            </label>
                          );
                        })}

                        {q.qtype === 'checkbox' && q.options && q.options.map((opt) => {
                          const current = answers[String(q.id)] ? JSON.parse(answers[String(q.id)]) : [];
                          const checked = current.includes(String(opt.id));
                          const onToggle = () => {
                            const next = checked ? current.filter((c: string) => c !== String(opt.id)) : [...current, String(opt.id)];
                            setAnswers((s) => ({ ...s, [String(q.id)]: JSON.stringify(next) }));
                          };
                          return (
                            <label key={opt.id} className="w-full block border border-gray-200 bg-white rounded p-3 mb-2 cursor-pointer">
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-medium text-gray-900">{opt.label}</div>
                                <input type="checkbox" checked={checked} onChange={onToggle} />
                              </div>
                            </label>
                          );
                        })}

                        {!q.qtype && q.options && q.options.map((opt) => {
                          const selected = answers[String(q.id)] === String(opt.id);
                          return (
                            <button key={opt.id} type="button" onClick={() => selectOption(q.id, opt.id)} className={`w-full text-left px-4 py-4 rounded border ${selected ? 'border-[#1E56D6] bg-[#E8F0FF]' : 'border-gray-200 bg-white'} flex items-center justify-between`}>
                              <div className={`text-sm font-medium ${selected ? 'text-blue-700' : 'text-gray-900'}`}>{opt.label}</div>
                              <div className="flex-shrink-0">{selected ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="#1E56D6" /><path d="M7.5 12.5L10.5 15.5L16.5 9.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                              ) : null}</div>
                            </button>
                          );
                        })}

                        {!q.qtype && !q.options && (
                          <textarea value={answers[String(q.id)] || ''} onChange={(e) => setOpenAnswer(q.id, e.target.value)} placeholder="Write your answer..." className="w-full min-h-[100px] resize-none bg-white border border-gray-300 rounded p-3 text-sm focus:outline-none focus:ring-1" style={{ boxShadow: 'inset 0 0 0 1px rgba(30,86,214,0.08)' }} />
                        )}

                        {/* Mandatory row: left text, right readonly checkbox */}
                        <div className="grid grid-cols-2 items-center mt-2">
                          <div className="text-sm text-gray-700">Mandatory</div>
                          <div className="flex justify-end">
                            <label className="flex items-center space-x-2 text-sm text-gray-600">
                              <input type="checkbox" checked={!!q.required} onChange={() => toggleRequired(q.id)} className="w-4 h-4" />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-transparent p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white/90 border border-gray-200 rounded-md p-3">
            <button onClick={handleSubmit} disabled={!allRequiredAnswered()} className={`w-full py-4 rounded font-semibold text-white ${allRequiredAnswered() ? 'bg-[#1E56D6]' : 'bg-gray-300 cursor-not-allowed'}`}>
              Submit Survey
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FioutMobileView;

