import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import type { DateGrain } from '../../types';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDayLabel(d: Date) {
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

function formatMonthLabel(d: Date) {
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function formatRangeLabel(from: Date, to: Date) {
  if (from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear()) {
    return `${from.getDate()} – ${to.getDate()} ${MONTHS_SHORT[to.getMonth()]}`;
  }
  return `${from.getDate()} ${MONTHS_SHORT[from.getMonth()]} – ${to.getDate()} ${MONTHS_SHORT[to.getMonth()]}`;
}

function buildMonthGrid(view: Date) {
  const first = new Date(view.getFullYear(), view.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  const days: Date[] = [];
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

interface HeaderDatePickerProps {
  dateGrain: DateGrain;
}

export const HeaderDatePicker: React.FC<HeaderDatePickerProps> = ({ dateGrain }) => {
  const { toast } = useDashboard();
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(() => startOfDay(new Date(2026, 5, 27)));
  const [rangeFrom, setRangeFrom] = useState(() => startOfDay(new Date(2026, 5, 1)));
  const [rangeTo, setRangeTo] = useState(() => startOfDay(new Date(2026, 5, 27)));
  const [pickingEnd, setPickingEnd] = useState(false);
  const [view, setView] = useState(() => new Date(2026, 5, 1));
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const placePop = () => {
    const btn = btnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const width = 280;
    let left = r.right - width;
    left = Math.max(12, Math.min(left, window.innerWidth - width - 12));
    setPos({ top: r.bottom + 8, left });
  };

  useLayoutEffect(() => {
    if (!open) return;
    placePop();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (btnRef.current?.contains(target) || popRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onReposition = () => placePop();
    // Defer so the opening click doesn't immediately close the popover
    const timer = window.setTimeout(() => {
      document.addEventListener('mousedown', onDoc);
    }, 0);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
    setPickingEnd(false);
    setView(new Date(selected.getFullYear(), selected.getMonth(), 1));
  }, [dateGrain]);

  const label = useMemo(() => {
    if (dateGrain === 'today') return formatDayLabel(selected);
    if (dateGrain === 'range') return formatRangeLabel(rangeFrom, rangeTo);
    return formatMonthLabel(selected);
  }, [dateGrain, selected, rangeFrom, rangeTo]);

  const days = useMemo(() => buildMonthGrid(view), [view]);
  const isMonthMode = dateGrain === 'month' || dateGrain === 'week';

  const shiftView = (delta: number) => {
    setView((prev) => {
      const next = new Date(prev);
      if (isMonthMode) next.setFullYear(prev.getFullYear() + delta);
      else next.setMonth(prev.getMonth() + delta);
      return next;
    });
  };

  const selectDay = (day: Date) => {
    const next = startOfDay(day);
    if (dateGrain === 'range') {
      if (!pickingEnd || next < rangeFrom) {
        setRangeFrom(next);
        setRangeTo(next);
        setPickingEnd(true);
        return;
      }
      setRangeTo(next);
      setPickingEnd(false);
      setOpen(false);
      toast(`Range ${formatRangeLabel(rangeFrom, next)}`, 'd');
      return;
    }
    setSelected(next);
    setOpen(false);
    toast(`Date set to ${formatDayLabel(next)}`, 'd');
  };

  const selectMonth = (monthIndex: number) => {
    const next = new Date(view.getFullYear(), monthIndex, 1);
    setSelected(next);
    setView(next);
    setOpen(false);
    toast(`Period set to ${formatMonthLabel(next)}`, 'd');
  };

  const calendar = open
    ? createPortal(
        <div
          className="pp-cal"
          role="dialog"
          aria-label="Choose date"
          ref={popRef}
          style={{ top: pos.top, left: pos.left }}
        >
          <div className="pp-cal-head">
            <button type="button" className="pp-cal-nav" onClick={() => shiftView(-1)} aria-label="Previous">
              <ChevronLeft size={14} />
            </button>
            <div className="pp-cal-title">
              {isMonthMode ? view.getFullYear() : `${MONTHS[view.getMonth()]} ${view.getFullYear()}`}
            </div>
            <button type="button" className="pp-cal-nav" onClick={() => shiftView(1)} aria-label="Next">
              <ChevronRight size={14} />
            </button>
          </div>

          {dateGrain === 'range' && (
            <div className="pp-cal-hint">{pickingEnd ? 'Pick end date' : 'Pick start date'}</div>
          )}

          {isMonthMode ? (
            <div className="pp-cal-months">
              {MONTHS_SHORT.map((m, i) => {
                const active =
                  selected.getFullYear() === view.getFullYear() && selected.getMonth() === i;
                return (
                  <button
                    key={m}
                    type="button"
                    className={`pp-cal-month${active ? ' on' : ''}`}
                    onClick={() => selectMonth(i)}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          ) : (
            <>
              <div className="pp-cal-weekdays">
                {WEEKDAYS.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
              <div className="pp-cal-days">
                {days.map((day) => {
                  const inMonth = day.getMonth() === view.getMonth();
                  const isSelected =
                    dateGrain === 'range'
                      ? sameDay(day, rangeFrom) || sameDay(day, rangeTo)
                      : sameDay(day, selected);
                  const inRange =
                    dateGrain === 'range' &&
                    day >= rangeFrom &&
                    day <= rangeTo &&
                    !sameDay(rangeFrom, rangeTo);
                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      className={`pp-cal-day${inMonth ? '' : ' out'}${isSelected ? ' on' : ''}${inRange ? ' in-range' : ''}`}
                      onClick={() => selectDay(day)}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>,
        document.body
      )
    : null;

  return (
    <div className={`fdate${open ? ' open' : ''}`}>
      <button
        type="button"
        className="fdate-btn"
        ref={btnRef}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <Calendar size={11} className="fdate-ico" aria-hidden />
        <span className="fdate-label">{label}</span>
      </button>
      {calendar}
    </div>
  );
};
