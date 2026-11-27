import { ArrowLeft } from "lucide-react";

// Same layout as the other add/edit pages (e.g. Add User): header with back
// arrow, white section cards, Cancel / Save footer.

export const PageHeader = ({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack: () => void }) => (
  <div className="mb-8 flex items-center">
    <button
      type="button"
      onClick={onBack}
      className="mr-2 flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-gray-100"
      aria-label="Go back"
    >
      <ArrowLeft className="h-4 w-4 text-gray-600" />
    </button>
    <div>
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      {subtitle && <p className="text-sm text-[#888780]">{subtitle}</p>}
    </div>
  </div>
);

export const SectionCard = ({
  icon: Icon, title, hint, children,
}: { icon: React.ElementType; title: string; hint?: string; children: React.ReactNode }) => (
  <div className="mb-6 overflow-hidden rounded-2xl border border-[rgba(26,26,24,.09)] bg-white">
    <div className="flex items-center gap-3 px-6 pt-[22px]">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F4F0]">
        <Icon size={14} color="#1A1A18" />
      </span>
      <div>
        <h2 className="m-0 text-sm font-semibold leading-snug text-[#1A1A18]">{title}</h2>
        {hint && <p className="text-xs text-[#888780]">{hint}</p>}
      </div>
    </div>
    <div className="px-6 pb-5 pt-2">{children}</div>
  </div>
);

export const FormFooter = ({
  onCancel, onSave, saving, saveLabel = "Save", savingLabel = "Saving...",
}: { onCancel: () => void; onSave: () => void; saving: boolean; saveLabel?: string; savingLabel?: string }) => (
  <div className="flex justify-end gap-3 pb-8">
    <button
      type="button"
      onClick={onCancel}
      disabled={saving}
      className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-[rgba(26,26,24,.08)] bg-white px-[22px] text-[13px] font-semibold text-[rgba(26,26,24,.68)] transition-all hover:border-[rgba(26,26,24,.28)] hover:text-[#1A1A18]"
    >
      Cancel
    </button>
    <button
      type="button"
      onClick={onSave}
      disabled={saving}
      className="inline-flex min-h-[42px] items-center justify-center rounded-lg border border-[#1A1A18] bg-[#1A1A18] px-[22px] text-[13px] font-semibold text-white transition-colors hover:bg-[#12100E] disabled:opacity-60"
    >
      {saving ? savingLabel : saveLabel}
    </button>
  </div>
);
