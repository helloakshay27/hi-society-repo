import React, { useState, useEffect } from 'react';
import { Bell, CalendarX2, CircleOff, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { apiClient } from '@/utils/apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CancellationRow {
  cutoffTime: string;
  returnAmount: string;
}

interface SetupRuleForm {
  // Notification Reminder for Staff
  staffReminder01Value: string;
  staffReminder01Unit: string;
  staffReminder02Value: string;
  staffReminder02Unit: string;

  // Notification Reminder for User
  userReminder01Value: string;
  userReminder01ValueUnit: string;
  userReminder01Unit: string;
  userReminder02Value: string;
  userReminder02Unit: string;

  // Final Reminder
  finalReminderUnit: string;
  finalReminderValue: string;

  // Cancellation Setup
  cancellationPolicyText: string;
  cancellationRows: CancellationRow[];

  // Schedule Setting
  scheduleBeforeValue: string;
  scheduleBeforeUnit: string;
  scheduleBeforeText: string;

  // Disclaimer
  disclaimerText: string;
}

const TIME_UNITS = ['Minutes', 'Hours', 'Days'];
const MINUTE_UNITS = ['Minute', 'Hour', 'Day'];

const defaultForm = (): SetupRuleForm => ({
  staffReminder01Value: '2',
  staffReminder01Unit: 'Minutes',
  staffReminder02Value: '1',
  staffReminder02Unit: 'Minutes',

  userReminder01Value: '20',
  userReminder01ValueUnit: 'Minute',
  userReminder01Unit: 'Minutes',
  userReminder02Value: '10',
  userReminder02Unit: 'Hrs',

  finalReminderUnit: 'Hrs',
  finalReminderValue: '15',

  cancellationPolicyText:
    'In the event that you cancel your booking/order, cancellation fees will be charged as detailed below. We will endeavour to resell your booking and, if successful, any payments received for such booking sold will be taken into account, based on the applied percentage, when calculating your cancellation fee.',
  cancellationRows: [
    { cutoffTime: '10', returnAmount: '5' },
    { cutoffTime: '', returnAmount: '' },
    { cutoffTime: '', returnAmount: '' },
  ],

  scheduleBeforeText: 'User can select a schedule before',
  scheduleBeforeValue: '2',
  scheduleBeforeUnit: 'Minutes',

  disclaimerText: '',
});

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-[#FFF5F5] border border-[#F5C6C6] rounded-t-md">
      <Icon className="w-4 h-4 text-[#C72030]" />
      <span className="text-sm font-semibold text-[#C72030]">{title}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export const OSRSetupRulePage: React.FC = () => {
  const [form, setForm] = useState<SetupRuleForm>(defaultForm());
  const [saving, setSaving] = useState(false);
  const [reminderId, setReminderId] = useState<number | null>(null);

  const set = (key: keyof SetupRuleForm, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const parseTimeValue = (value: string, unit: string) => {
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) {
      return { hr: null, min: null };
    }

    const normalized = unit?.toLowerCase() ?? '';
    if (normalized.includes('day')) {
      return { hr: num * 24, min: null };
    }
    if (normalized.includes('hour') || normalized.includes('hrs') || normalized === 'hr') {
      return { hr: num, min: null };
    }
    return { hr: null, min: num };
  };

  const setCancellationRow = (index: number, field: keyof CancellationRow, value: string) => {
    setForm(prev => {
      const rows = [...prev.cancellationRows];
      rows[index] = { ...rows[index], [field]: value };
      return { ...prev, cancellationRows: rows };
    });
  };

 

  useEffect(() => {
  const loadReminders = async () => {
    try {
      const getSelectedSocietyId = () => {
        const raw =
          localStorage.getItem('selectedSocietyId') ||
          localStorage.getItem('selectedUserSociety') ||
          localStorage.getItem('society_id');
        return raw ? Number(raw) : null;
      };

      const societyId = getSelectedSocietyId();

      let r: any = null;

      if (societyId) {
        try {
          const res = await apiClient.get(`/crm/admin/osr_reminders.json?society_id=${societyId}`);
          const payload = res.data;
          const body = payload?.osr_reminder ?? payload;

          if (Array.isArray(body)) {
            r = body.find((it: any) => it.society_id === societyId) ?? body[0];
          } else if (body && body.id) {
            r = body;
          } else if (payload?.osr_reminders) {
            r = (payload.osr_reminders as any[]).find(it => it.society_id === societyId) ?? payload.osr_reminders[0];
          }
        } catch {
          // fallback below
        }
      }

      if (!r) {
        const all = await apiClient.get('/crm/admin/osr_reminders.json');
        const data = all.data;
        const arr = Array.isArray(data) ? data : (data?.osr_reminders ?? []);
        if (Array.isArray(arr) && arr.length > 0) {
          r = societyId ? arr.find((it: any) => it.society_id === societyId) ?? arr[0] : arr[0];
        } else if (data?.id) {
          r = data;
        }
      }

      r = r ?? {};
      if (r?.id) setReminderId(Number(r.id));

      // ── FIX: unit strings now match the Select option values exactly ──
      // Final reminder & User reminder 02 dropdowns use 'Hrs'/'Min'/'Days'
      // Staff reminder & Schedule dropdowns use 'Hours'/'Minutes'/'Days'
      const pickValueUnit = (
        hr: any,
        min: any,
        hrLabel: string,   // pass the exact string your Select uses for hours
        minLabel: string   // pass the exact string your Select uses for minutes
      ) => {
        if (hr !== null && hr !== undefined && Number(hr) > 0)
          return { value: String(hr), unit: hrLabel };
        if (min !== null && min !== undefined && Number(min) > 0)
          return { value: String(min), unit: minLabel };
        return { value: '0', unit: minLabel };
      };
      // Staff reminders → Select uses 'Hours' / 'Minutes'
      const staff1 = pickValueUnit(r.notifn_one_hr, r.notifn_one_min, 'Hours', 'Minutes');
      const staff2 = pickValueUnit(r.notifn_two_hr, r.notifn_two_min, 'Hours', 'Minutes');

      // User reminder 01 value unit → Select uses 'Hour' / 'Minute' / 'Day'
      const user1 = pickValueUnit(r.user_notifn_one_hr, r.user_notifn_one_min, 'Hour', 'Minute');

      // User reminder 02 → Select uses 'Hrs' / 'Min' / 'Days'
      const user2 = pickValueUnit(r.user_notifn_two_hr, r.user_notifn_two_min, 'Hrs', 'Min');

      // Final reminder → Select uses 'Hrs' / 'Min' / 'Days'
      const finalRem = pickValueUnit(r.final_rem_hr, r.final_rem_min, 'Hrs', 'Min');

      // Schedule before → Select uses 'Hours' / 'Minutes'
      const scheduleBefore = pickValueUnit(r.schedule_before_hr, r.schedule_before_min, 'Hours', 'Minutes');

      const rows: CancellationRow[] = [
        {
          cutoffTime: r.cutoff_hr != null ? String(r.cutoff_hr) : r.cutoff_min != null ? String(r.cutoff_min) : '',
          returnAmount: r.return_percentage != null ? String(r.return_percentage) : '',
        },
        {
          cutoffTime: r.cutoff_second_hr != null ? String(r.cutoff_second_hr) : r.cutoff_second_min != null ? String(r.cutoff_second_min) : '',
          returnAmount: r.return_percentage_second != null ? String(r.return_percentage_second) : '',
        },
        {
          cutoffTime: r.cutoff_third_hr != null ? String(r.cutoff_third_hr) : r.cutoff_third_min != null ? String(r.cutoff_third_min) : '',
          returnAmount: r.return_percentage_third != null ? String(r.return_percentage_third) : '',
        },
      ];

      setForm(prev => ({
        ...prev,

        // Staff reminders
        staffReminder01Value: staff1.value,
        staffReminder01Unit:  staff1.unit,   // e.g. 'Hours'
        staffReminder02Value: staff2.value,
        staffReminder02Unit:  staff2.unit,   // e.g. 'Hours'

        // User reminder 01
        userReminder01Value:     user1.value,
        userReminder01ValueUnit: user1.unit,  // e.g. 'Hour' — matches MINUTE_UNITS

        // User reminder 02
        userReminder02Value: user2.value,
        userReminder02Unit:  user2.unit,      // ← FIX: was never set, defaulted to 'Hrs'

        // Final reminder
        finalReminderValue: finalRem.value,
        finalReminderUnit:  finalRem.unit,    // ← FIX: was never set, defaulted to 'Hrs'

        // Schedule before
        scheduleBeforeValue: scheduleBefore.value,
        scheduleBeforeUnit:  scheduleBefore.unit,

        // Cancellation rows
        cancellationRows: rows,

        // Disclaimer
        disclaimerText: r.disclaimer ?? '',
      }));

    } catch (err) {
      toast.error('Failed to load reminders.');
    }
  };

  loadReminders();
}, []);
  const addCancellationRow = () => {
    setForm(prev => ({
      ...prev,
      cancellationRows: [...prev.cancellationRows, { cutoffTime: '', returnAmount: '' }],
    }));
  };

  const removeCancellationRow = (index: number) => {
    setForm(prev => ({
      ...prev,
      cancellationRows: prev.cancellationRows.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const staffReminder01 = parseTimeValue(form.staffReminder01Value, form.staffReminder01Unit);
      const staffReminder02 = parseTimeValue(form.staffReminder02Value, form.staffReminder02Unit);
      const userReminder01 = parseTimeValue(form.userReminder01Value, form.userReminder01ValueUnit);
      const userReminder02 = parseTimeValue(form.userReminder02Value, form.userReminder02Unit);
      const finalReminder = parseTimeValue(form.finalReminderValue, form.finalReminderUnit);
      const scheduleBefore = parseTimeValue(form.scheduleBeforeValue, form.scheduleBeforeUnit);

      const payload = {
        osr_reminder: {
          society_id: Number(localStorage.getItem('selectedSocietyId') || localStorage.getItem('selectedUserSociety') || localStorage.getItem('society_id') || 0),
          notifn_one_hr: staffReminder01.hr,
          notifn_one_min: staffReminder01.min,
          notifn_two_hr: staffReminder02.hr,
          notifn_two_min: staffReminder02.min,
          user_notifn_one_hr: userReminder01.hr,
          user_notifn_one_min: userReminder01.min,
          user_notifn_two_hr: userReminder02.hr,
          user_notifn_two_min: userReminder02.min,
          final_rem_hr: finalReminder.hr,
          final_rem_min: finalReminder.min,
          schedule_before_hr: scheduleBefore.hr,
          schedule_before_min: scheduleBefore.min,
          disclaimer: form.disclaimerText,
          cutoff_hr: Number(form.cancellationRows[0]?.cutoffTime || '') || null,
          cutoff_min: null,
          return_percentage: Number(form.cancellationRows[0]?.returnAmount || '') || null,
          cutoff_second_hr: Number(form.cancellationRows[1]?.cutoffTime || '') || null,
          cutoff_second_min: null,
          return_percentage_second: Number(form.cancellationRows[1]?.returnAmount || '') || null,
          cutoff_third_hr: Number(form.cancellationRows[2]?.cutoffTime || '') || null,
          cutoff_third_min: null,
          return_percentage_third: Number(form.cancellationRows[2]?.returnAmount || '') || null,
        },
      };

      if (reminderId) {
        await apiClient.patch(`/crm/admin/osr_reminders/${reminderId}.json`, payload);
      } else {
        await apiClient.post('/crm/admin/osr_reminders.json', payload);
      }

      toast.success('Setup rules saved successfully!');
    } catch (err) {
      toast.error('Failed to save setup rules.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="bg-white px-6 py-4 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900">Setup Rules</h1>
      </div>

      <div className="p-6 space-y-3">

        {/* ── 1. Notification Reminder for Staff ──────────────────────────── */}
        <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
          <SectionHeader icon={Bell} title="Notification Reminder for Staff" />
          <div className="px-5 py-3 grid grid-cols-2 gap-x-10 gap-y-3">
            {/* Reminder 01 */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 w-52 shrink-0">
                Reminder Notification 01
              </label>
              <Input
                type="number"
                min="0"
                value={form.staffReminder01Value}
                onChange={e => set('staffReminder01Value', e.target.value)}
                className="w-24 text-center"
              />
              <Select value={form.staffReminder01Unit} onValueChange={v => set('staffReminder01Unit', v)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Reminder 02 */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 w-52 shrink-0">
                Reminder Notification 02
              </label>
              <Input
                type="number"
                min="0"
                value={form.staffReminder02Value}
                onChange={e => set('staffReminder02Value', e.target.value)}
                className="w-24 text-center"
              />
              <Select value={form.staffReminder02Unit} onValueChange={v => set('staffReminder02Unit', v)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* ── 2. Notification Reminder for User ───────────────────────────── */}
        <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
          <SectionHeader icon={Bell} title="Notification Reminder for User" />
          <div className="px-5 py-3 grid grid-cols-2 items-start gap-x-10 gap-y-3">
            {/* Reminder 01 */}
            <div>
              <div className="flex items-start gap-3">
                <label className="text-sm font-medium text-gray-700 w-52 shrink-0 pt-2">
                  Reminder Notification 01
                </label>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Select value={form.userReminder01Value} onValueChange={v => set('userReminder01Value', v)}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 60 }, (_, i) => String(i + 1)).map(n => (
                          <SelectItem key={n} value={n}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={form.userReminder01ValueUnit} onValueChange={v => set('userReminder01ValueUnit', v)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MINUTE_UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    (Notification will be send to users one day prior to the schedule)
                  </p>
                </div>
              </div>
            </div>

            {/* Reminder 02 */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 w-52 shrink-0">
                Reminder Notification 02
              </label>
              <Select value={form.userReminder02Unit} onValueChange={v => set('userReminder02Unit', v)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hrs">Hrs</SelectItem>
                  <SelectItem value="Min">Min</SelectItem>
                  <SelectItem value="Days">Days</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                min="0"
                value={form.userReminder02Value}
                onChange={e => set('userReminder02Value', e.target.value)}
                className="w-24 text-center"
              />
            </div>
          </div>
        </div>

        {/* ── 3. Final Reminder Notification to User ───────────────────────── */}
        <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
          <SectionHeader icon={Bell} title="Final Reminder Notification to User" />
          <div className="px-5 py-3">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 w-52 shrink-0">
                Notification before
              </label>
              <Select value={form.finalReminderUnit} onValueChange={v => set('finalReminderUnit', v)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hrs">Hrs</SelectItem>
                  <SelectItem value="Min">Min</SelectItem>
                  <SelectItem value="Days">Days</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                min="0"
                value={form.finalReminderValue}
                onChange={e => set('finalReminderValue', e.target.value)}
                className="w-24 text-center"
              />
            </div>
          </div>
        </div>

        {/* ── 4. Cancellation Setup ────────────────────────────────────────── */}
        <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
          <SectionHeader icon={CalendarX2} title="Cancellation Setup" />
          <div className="px-5 py-3 space-y-3">
            {/* Policy textarea */}
            <textarea
              rows={4}
              value={form.cancellationPolicyText}
              onChange={e => set('cancellationPolicyText', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-[#C72030] focus:border-transparent"
              placeholder="Enter cancellation policy..."
            />

            {/* Cancellation table */}
            <div className="border border-gray-200 rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 border-r border-gray-200 w-1/2">
                      Cutoff Time
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 w-1/2">
                      Return Amount (%)
                    </th>
                    <th className="w-10 border-l border-gray-200"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {form.cancellationRows.map((row, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 border-r border-gray-200">
                        <Input
                          type="number"
                          min="0"
                          placeholder="e.g. 10"
                          value={row.cutoffTime}
                          onChange={e => setCancellationRow(idx, 'cutoffTime', e.target.value)}
                          className="text-center"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="e.g. 5"
                            value={row.returnAmount}
                            onChange={e => setCancellationRow(idx, 'returnAmount', e.target.value)}
                            className="text-center flex-1"
                          />
                          <span className="text-sm font-medium text-gray-600">%</span>
                        </div>
                      </td>
                      <td className="px-2 text-center border-l border-gray-200">
                        {form.cancellationRows.length > 1 && (
                          <button
                            onClick={() => removeCancellationRow(idx)}
                            className="text-red-400 hover:text-red-600 text-lg leading-none font-bold transition-colors"
                            title="Remove row"
                          >
                            ×
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add row */}
            <button
              onClick={addCancellationRow}
              className="text-sm text-[#C72030] hover:text-[#A01B28] font-medium flex items-center gap-1 transition-colors"
            >
              <span className="text-lg leading-none">+</span> Add Row
            </button>
          </div>
        </div>

        {/* ── 5. Schedule Setting ──────────────────────────────────────────── */}
        <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
          <SectionHeader icon={CircleOff} title="Schedule Setting" />
          <div className="px-5 py-3">
            <div className="flex items-center gap-3 flex-wrap">
              <Input
                value={form.scheduleBeforeText}
                onChange={e => set('scheduleBeforeText', e.target.value)}
                className="w-72 text-sm"
                placeholder="Label text"
              />
              <Input
                type="number"
                min="0"
                value={form.scheduleBeforeValue}
                onChange={e => set('scheduleBeforeValue', e.target.value)}
                className="w-24 text-center"
              />
              <Select value={form.scheduleBeforeUnit} onValueChange={v => set('scheduleBeforeUnit', v)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* ── 6. Disclaimer ────────────────────────────────────────────────── */}
        <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
          <SectionHeader icon={CircleOff} title="Disclaimer" />
          <div className="px-5 py-3">
            <textarea
              rows={4}
              value={form.disclaimerText}
              onChange={e => set('disclaimerText', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-[#C72030] focus:border-transparent"
              placeholder="Enter disclaimer text..."
            />
          </div>
        </div>

        {/* ── Save Button ──────────────────────────────────────────────────── */}
        <div className="flex justify-center pb-6">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#C72030] hover:bg-[#A61C28] text-white px-12 py-2.5 font-medium shadow-sm flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>

      </div>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <div className="py-4 flex justify-center border-t border-gray-200 bg-white">
        <span className="text-sm text-gray-600">
          Powered by <span className="font-semibold">LOCKATED</span>
        </span>
      </div>
    </div>
  );
};

export default OSRSetupRulePage;
