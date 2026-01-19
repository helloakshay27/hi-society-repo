import React, { useState, useEffect, useCallback } from 'react';

export type SurveyOption = { id: string | number; label: string };

export type SurveyQuestion = {
  id: string | number;
  // Optional mapping id from snag_quest_maps.id used for POST payload
  snag_quest_map_id?: string | number;
  title: string;
  required?: boolean;
  qtype?: string;
  options?: SurveyOption[];
};

interface FioutMobileViewProps {
  logoSrc?: string;
  backgroundSrc?: string;
  onSubmit?: (answers: Record<string, string>, comments: string) => void;
}

const FioutMobileView: React.FC<FioutMobileViewProps> = ({ logoSrc, backgroundSrc, onSubmit }) => {
  // const defaultLogo = 'https://www.persistent.com/wp-content/themes/persistent/dist/images/Persistent-Header-Logo-Black_460dd8e4.svg';
  const defaultBackground = 'https://lockated-public.s3.ap-south-1.amazonaws.com/attachfiles/documents/8412446/original/4.YOO_Villas_Villa_2_Vintage_Living_3.png';

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [comments, setComments] = useState('');
  const [categories, setCategories] = useState<{ name: string; questions: SurveyQuestion[] }[]>([]);

  const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);

  type FitoutSnagOption = { id: number | string; qname?: string };
  type FitoutSnagQuestion = { id: number | string; qtype: string; descr: string; quest_mandatory?: boolean; snag_quest_options?: FitoutSnagOption[] };
  type FitoutItem = { id?: number | string; name?: string; snag_quest_maps: Array<{ id?: number | string; snag_question: FitoutSnagQuestion }> };

  const adaptFromFitout = useCallback((payload: FitoutItem[]) => {
    return (payload || []).map((item) => ({
      name: item.name || 'Category',
      questions: (item.snag_quest_maps || []).map((entry) => {
        const s = entry.snag_question;
        let qtype = s.qtype;
        if (qtype === 'text') qtype = 'inputbox';
        return {
          id: s.id,
          // keep a reference to snag_quest_map_id so POST can use it
          snag_quest_map_id: entry.id,
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

  const [submitting, setSubmitting] = useState(false);
  const [thankYou, setThankYou] = useState(false);
  const [fetchError, setFetchError] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchAttempt, setFetchAttempt] = useState(0);
  // if server already has any answers for this mapping, show "Form already submitted"
  const [serverSubmitted, setServerSubmitted] = useState(false);

    useEffect(() => {
  setFetchError(null);
  setLoading(true);
    const baseUrl = localStorage.getItem('baseUrl') || '';
    // mappingId can be provided as ?mappingId=... or as the last segment of the path
    const mappingId = (() => {
      try {
        const params = new URLSearchParams(window.location.search);
        const fromQuery = params.get('mappingId');
        if (fromQuery) return fromQuery;
        const parts = window.location.pathname.split('/').filter(Boolean);
        const last = parts[parts.length - 1] || '';
        // basic sanity: mapping ids are long hex-like strings, fallback to default
        if (/^[A-Fa-f0-9]{8,}$/.test(last)) return last;
      } catch (e) {
        // ignore
      }
      return '';
    })();

    const url = `https://${baseUrl}/crm/admin/fitout_requests/${mappingId}/fitout_mappings.json`;
    let cancelled = false;
    fetch(url)
      .then((r) => {
        if (r.status === 500) {
          if (!cancelled) setFetchError(500);
          throw new Error('Server error 500');
        }
        if (!r.ok) throw new Error('Network response not ok');
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        const payload = Array.isArray(data) ? data : (data || []);
        // If any snag_answers exist in the payload, treat the form as already submitted
        const answeredExists = (payload || []).some((item: unknown) => {
          if (!item || typeof item !== 'object') return false;
          const it = item as { snag_quest_maps?: unknown };
          if (!Array.isArray(it.snag_quest_maps)) return false;
          return (it.snag_quest_maps as unknown[]).some((entry: unknown) => {
            if (!entry || typeof entry !== 'object') return false;
            const e = entry as { snag_answers?: unknown };
            if (!Array.isArray(e.snag_answers)) return false;
            return (e.snag_answers as unknown[]).length > 0;
          });
        });
        if (answeredExists) {
          if (!cancelled) setServerSubmitted(true);
          if (!cancelled) setCategories([]);
          if (!cancelled) setLoading(false);
          return;
        }

        const adapted = adaptFromFitout(payload as FitoutItem[]);
        if (!cancelled) setCategories(adapted || []);
        if (!cancelled) setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setCategories([]);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [adaptFromFitout, fetchAttempt]);

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

  const handleSubmit = async () => {
    if (!allRequiredAnswered()) return;
    setSubmitting(true);
    try {
      // Build form data similar to the provided curl payload
      const baseUrl = localStorage.getItem('baseUrl') || 'uat-hi-society.lockated.com';
      const host = baseUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
      const postUrl = `https://${host}/fitout_requests/create_feedback`;

      const form = new FormData();

      // For each question create an entry under snag_answers[<mapId>][...]
      categories.forEach((cat) => {
        cat.questions.forEach((q) => {
          // Use snag_quest_map_id from GET payload when available, fallback to question id
          const mapId = String(q.snag_quest_map_id || q.id);
          const qKeyBase = `snag_answers[${mapId}]`;
          // include map id and question id
          form.append(`${qKeyBase}[snag_quest_map_id]`, mapId);
          form.append(`${qKeyBase}[snag_question_id]`, String(q.id));

          const val = answers[String(q.id)];
          if (q.qtype === 'multiple') {
            // single option selected (radio)
            if (val) {
              form.append(`${qKeyBase}[snag_quest_option_id]`, String(val));
              const label = q.options?.find((o) => String(o.id) === String(val))?.label || '';
              form.append(`${qKeyBase}[ans_descr]`, label);
            } else {
              form.append(`${qKeyBase}[ans_descr]`, '');
            }
          } else if (q.qtype === 'checkbox') {
            // val is stored as JSON array string
            try {
              const arr = val ? JSON.parse(val) : [];
              // send selected ids as comma separated in ans_descr
              form.append(`${qKeyBase}[ans_descr]`, Array.isArray(arr) ? arr.join(',') : String(val || ''));
            } catch (e) {
              form.append(`${qKeyBase}[ans_descr]`, String(val || ''));
            }
          } else {
            // text, date, description, date_range, time etc
            form.append(`${qKeyBase}[ans_descr]`, String(val || ''));
          }
        });
      });

  const token = sessionStorage.getItem('app_token') || sessionStorage.getItem('token') || localStorage.getItem('app_token') || localStorage.getItem('token') || localStorage.getItem('access_token') || '';
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const resp = await fetch(postUrl, { method: 'POST', body: form, headers });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      // Optionally call external handler
      onSubmit?.(answers, comments);

  // Reset fields and show thank you card
  setAnswers({});
  setComments('');
  setThankYou(true);
    } catch (err) {
      // keep subtle failure behavior for now; could add toast
      // console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const backgroundUrl = backgroundSrc || defaultBackground;
  const containerStyle: React.CSSProperties = {
    backgroundImage: `url(${backgroundUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
    backgroundRepeat: 'no-repeat',
    filter: 'brightness(0.85)',
    minHeight: '100dvh',
  };

  const displayedCategory = (categories && categories[0] && categories[0].name) || 'Fitout setup';
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-cover bg-center flex items-center justify-center" style={containerStyle}>
        <div className="bg-white/80 p-6 rounded-md shadow-md flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-t-blue-600 border-gray-200 rounded-full animate-spin mb-4" />
          <div className="text-sm text-gray-700">Form Loading...</div>
        </div>
      </div>
    );
  }
  if (thankYou) {
    return (
      <div className="min-h-screen w-full bg-cover bg-center flex flex-col items-center" style={containerStyle}>
        <div className="w-full max-w-md md:max-w-4xl px-4 pt-24">
          <div className="relative">
            {/* <img src={logoSrc || defaultLogo} alt="logo" className="absolute right-0 top-0 h-10 opacity-90" /> */}
          </div>
        </div>

        <div className="w-full max-w-md md:max-w-4xl px-4 mt-24">
          <div className="bg-white/90 rounded-md p-6 md:p-8 text-center shadow-md">
            <h2 className="text-2xl font-semibold mb-2">Thank you</h2>
            <p className="text-sm text-gray-700 mb-4">Your responses have been submitted successfully.</p>
            <button type="button" onClick={() => setThankYou(false)} className="mt-2 w-full py-3 rounded bg-[#1E56D6] text-white font-semibold">Close</button>
          </div>
        </div>
      </div>
    );
  }

  if (fetchError === 500) {
    return (
      <div className="min-h-screen w-full bg-cover bg-center flex flex-col items-center" style={containerStyle}>
        <div className="w-full max-w-md md:max-w-4xl px-4 pt-24">
          <div className="relative">
            {/* <img src={logoSrc || defaultLogo} alt="logo" className="absolute right-0 top-0 h-10 opacity-90" /> */}
          </div>
        </div>

        <div className="w-full max-w-md md:max-w-4xl px-4 mt-24">
          <div className="bg-white/90 rounded-md p-6 md:p-8 text-center shadow-md">
            <h2 className="text-2xl font-semibold mb-2">Server error</h2>
            <p className="text-sm text-gray-700 mb-4">We received a 500 error from the server while loading the survey.</p>
            <button type="button" onClick={() => { setFetchError(null); setFetchAttempt((s) => s + 1); }} className="mt-2 w-full py-3 rounded bg-[#1E56D6] text-white font-semibold">Retry</button>
          </div>
        </div>
      </div>
    );
  }

  if (serverSubmitted) {
    return (
      <div className="min-h-screen w-full bg-cover bg-center flex flex-col items-center" style={containerStyle}>
        <div className="w-full max-w-md md:max-w-4xl px-4 pt-24">
          <div className="relative">
            {/* <img src={logoSrc || defaultLogo} alt="logo" className="absolute right-0 top-0 h-10 opacity-90" /> */}
          </div>
        </div>

        <div className="w-full max-w-md md:max-w-4xl px-4 mt-24">
          <div className="bg-white/90 rounded-md p-6 md:p-8 text-center shadow-md">
            <h2 className="text-2xl font-semibold mb-2">Form already submitted</h2>
            <p className="text-sm text-gray-700 mb-4">We found previous answers for this fitout mapping. The form cannot be edited.</p>
            {/* <button type="button" onClick={() => setFetchAttempt((s) => s + 1)} className="mt-2 w-full py-3 rounded bg-[#1E56D6] text-white font-semibold">Reload</button> */}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-cover bg-center flex flex-col items-center" style={containerStyle}>
  <div className="w-full max-w-md md:max-w-4xl px-4 pt-6">
        <div className="relative">
          {/* <img src={logoSrc || defaultLogo} alt="logo" className="absolute right-0 top-0 h-10 opacity-90" /> */}
        </div>
      </div>

  <div className="w-full max-w-md md:max-w-4xl px-4 mt-4">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-black tracking-tight">{}</h1>
        </div>
      </div>

  <div className="w-full max-w-md md:max-w-5xl px-4 mt-4 pb-4 md:mx-auto">
        <div className="bg-white/90 md:bg-white md:border md:border-gray-200 md:rounded-1xl md:shadow-xl rounded-md shadow-md p-4 md:p-10 space-y-6 md:space-y-8">
          {categories.map((cat, cidx) => (
            <div key={cidx}>
              {categories.length > 1 && <div className="text-xl font-semibold text-gray-700 mb-2">{cat.name}</div>}
              {cat.questions.map((q, idx) => (
                <div key={q.id}>
                  <div className="grid grid-cols-1 gap-4 items-start mb-2">
                    <div>
                      <div className="text-[16px] md:text-base font-medium">{`${idx + 1}. ${q.title}`}</div>
                    </div>

                    <div>
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

                        {q.qtype === 'multiple' && q.options && (
                          <div className={`${
                            q.options.length === 4
                              ? 'grid grid-cols-2 md:grid-cols-4 gap-3'
                              : q.options.length === 3
                              ? 'grid grid-cols-2 md:grid-cols-3 gap-3'
                              : q.options.length === 2
                              ? 'grid grid-cols-2 gap-3'
                              : 'space-y-3'
                          }`}>
                            {q.options.map((opt) => {
                              const selected = answers[String(q.id)] === String(opt.id);
                              return (
                                <label
                                  key={opt.id}
                                  className={`w-full block border ${selected ? 'border-[#1E56D6] bg-[#E8F0FF]' : 'border-gray-200 bg-white'} rounded p-3 cursor-pointer`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className={`text-sm font-medium ${selected ? 'text-blue-700' : 'text-gray-900'}`}>{opt.label}</div>
                                    <input type="radio" name={`q_${q.id}`} checked={selected} onChange={() => selectOption(q.id, opt.id)} />
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}

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

                        {/* Mandatory UI removed */}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

    {/* Footer button under the form, not fixed */}
<div className="w-full max-w-md md:max-w-5xl px-4 mt-6 mb-6 md:mx-auto">
  <div className="bg-white/90 md:bg-white md:border md:border-gray-200 md:rounded-1xl md:shadow-xl rounded-md p-3 md:p-6">
    <button
      onClick={handleSubmit}
      disabled={!allRequiredAnswered()}
      className={`w-full py-4 rounded font-semibold text-white ${
        allRequiredAnswered() ? 'bg-[#1E56D6]' : 'bg-gray-300 cursor-not-allowed'
      }`}
    >
      Submit Fitout
    </button>
  </div>
</div>
    </div>
  );
};

export default FioutMobileView;

