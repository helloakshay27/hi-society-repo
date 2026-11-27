import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { BellRing, Camera, Loader2, PawPrint, Plus, Settings2, Syringe } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  CHANNELS, DAYS_BEFORE, DEFAULT_BREEDS, DEFAULT_SETTINGS, FILE_TYPES, MODULE_STATUSES,
  OVERDUE_REPEATS, PET_TYPES, PetSettings, PetType,
} from "./types";
import { apiErrorMessage, fetchPetSettings, savePetSettings } from "./petsApi";
import { FormFooter, PageHeader, SectionCard } from "./FormLayout";

type BreedType = Exclude<PetType, "Other">;
const LOCKED_BREEDS = ["Indie / Mixed", "Other"]; // always offered (sheet 1 note)
const REGISTER_PATH = "/settings/pets";

const Row = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-2 border-b border-[#efeee9] py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
    <div className="min-w-0">
      <div className="text-sm font-medium text-[#2c2c2c]">{label}</div>
      {hint && <div className="text-xs text-[#888780]">{hint}</div>}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

const toggleIn = <T,>(list: T[], value: T) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

export const PetSettingsPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<PetSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [extraBreeds, setExtraBreeds] = useState<Record<BreedType, string[]>>({ Dog: [], Cat: [], Bird: [] });
  const [newBreed, setNewBreed] = useState<Record<BreedType, string>>({ Dog: "", Cat: "", Bird: "" });

  useEffect(() => {
    // 1.1 GET /my_pets/settings.json
    fetchPetSettings()
      .then((settings) => {
        setForm(settings);
        // Breeds this society added earlier (extra_breeds) — not in the standard list
        setExtraBreeds({
          Dog: settings.breeds.Dog.filter((b) => !DEFAULT_BREEDS.Dog.includes(b)),
          Cat: settings.breeds.Cat.filter((b) => !DEFAULT_BREEDS.Cat.includes(b)),
          Bird: settings.breeds.Bird.filter((b) => !DEFAULT_BREEDS.Bird.includes(b)),
        });
      })
      .catch((err) => toast.error(apiErrorMessage(err, "Could not load pet settings — showing defaults")))
      .finally(() => setLoading(false));
  }, []);

  const set = <K extends keyof PetSettings>(key: K, value: PetSettings[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const allBreeds = (type: BreedType) => {
    const list = [...DEFAULT_BREEDS[type].filter((b) => b !== "Other"), ...extraBreeds[type]];
    return [...new Set(list), "Other"];
  };

  const toggleBreed = (type: BreedType, breed: string) =>
    set("breeds", { ...form.breeds, [type]: toggleIn(form.breeds[type], breed) });

  const addBreed = (type: BreedType) => {
    const name = newBreed[type].trim();
    if (!name) return;
    if (allBreeds(type).some((b) => b.toLowerCase() === name.toLowerCase())) {
      toast.error(`${name} is already in the ${type.toLowerCase()} list`);
      return;
    }
    setExtraBreeds((e) => ({ ...e, [type]: [...e[type], name] }));
    set("breeds", { ...form.breeds, [type]: [...form.breeds[type], name] });
    setNewBreed((n) => ({ ...n, [type]: "" }));
  };

  const validate = (): string | null => {
    if (!form.allowed_pet_types.length) return "Allow at least one pet type";
    if (form.max_pets_per_flat !== null && (form.max_pets_per_flat < 1 || form.max_pets_per_flat > 10))
      return "Max pets per flat must be 1–10 (or blank for no limit)";
    if (form.allow_not_taken && !form.not_taken_warning.trim()) return "Enter the “Not taken” warning text";
    if (form.not_taken_warning.length > 160) return "“Not taken” warning can be at most 160 characters";
    if (!form.certificate_file_types.length) return "Pick at least one certificate file type";
    if (form.certificate_max_mb < 1 || form.certificate_max_mb > 10) return "Certificate size must be 1–10 MB";
    if (form.due_soon_window < 1 || form.due_soon_window > 90) return "“Due soon” window must be 1–90 days";
    if (form.reminders_enabled) {
      if (form.auto_reminders && !form.remind_days_before.length) return "Pick at least one “Remind before due” day";
      if (form.stop_after !== null && (form.stop_after < 1 || form.stop_after > 10)) return "“Stop after” must be 1–10 reminders";
      if (!form.channels.length) return "Pick at least one reminder channel";
    }
    return null;
  };

  const handleSave = async () => {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }
    // 1.2 PATCH /my_pets/settings.json — 422 returns { errors: [...] }
    setSaving(true);
    try {
      await savePetSettings(form);
      toast.success("Pet settings saved");
      navigate(REGISTER_PATH);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not save pet settings"));
    } finally {
      setSaving(false);
    }
  };

  const numberOrNull = (v: string) => (v === "" ? null : Number(v));

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFDFB]">
        <Loader2 className="h-6 w-6 animate-spin text-[#888780]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFB] p-6">
      <PageHeader
        title="Pet Settings"
        subtitle="Rules for the Pets module in this project. Residents add pets from the app."
        onBack={() => navigate(REGISTER_PATH)}
      />

      {/* A. Module — PS-02, 03, 05, 06 */}
      <SectionCard icon={Settings2} title="Module">
        <Row label="Module status" hint="Inactive hides “Pets” in the resident app">
          <Select value={form.module_status} onValueChange={(v) => set("module_status", v as PetSettings["module_status"])}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MODULE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </Row>
        <Row label="Allowed pet types" hint="Unticked types are hidden on “Add a pet”">
          <div className="flex flex-wrap gap-3">
            {PET_TYPES.map((t) => (
              <label key={t} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.allowed_pet_types.includes(t)}
                  onCheckedChange={() => set("allowed_pet_types", toggleIn(form.allowed_pet_types, t))}
                />
                {t}
              </label>
            ))}
          </div>
        </Row>
        <Row label="Max pets per flat" hint="1–10. Leave blank for no limit">
          <Input
            type="number" min={1} max={10} className="w-28" placeholder="No limit"
            value={form.max_pets_per_flat ?? ""}
            onChange={(e) => set("max_pets_per_flat", numberOrNull(e.target.value))}
          />
        </Row>
        <Row label="Admin approval for new pets" hint="If on, new pets show “Pending approval” to the resident">
          <Switch checked={form.approval_required} onCheckedChange={(v) => set("approval_required", v)} />
        </Row>
      </SectionCard>

      {/* B. Vaccination — PS-07 … PS-11 */}
      <SectionCard icon={Syringe} title="Vaccination rules">
        <Row label="Vaccination certificate mandatory" hint="Applies when vaccinated Completely / Partially">
          <Switch checked={form.certificate_mandatory} onCheckedChange={(v) => set("certificate_mandatory", v)} />
        </Row>
        <Row label="Allow adding a pet when “Not taken”" hint="If off, Add pet is blocked until the first dose">
          <Switch checked={form.allow_not_taken} onCheckedChange={(v) => set("allow_not_taken", v)} />
        </Row>
        {form.allow_not_taken && (
          <div className="border-b border-[#efeee9] py-3">
            <div className="mb-1 text-sm font-medium text-[#2c2c2c]">“Not taken” warning text</div>
            <Textarea
              maxLength={160} rows={3}
              value={form.not_taken_warning}
              onChange={(e) => set("not_taken_warning", e.target.value)}
            />
            <div className="mt-1 text-right text-xs text-[#888780]">{form.not_taken_warning.length}/160</div>
          </div>
        )}
        <Row label="Admin verifies certificates" hint="Adds Verify / Reject on the register">
          <Switch checked={form.verify_certificates} onCheckedChange={(v) => set("verify_certificates", v)} />
        </Row>
        <Row label="Certificate file types & size" hint="Max 1–10 MB">
          <div className="flex flex-wrap items-center gap-3">
            {FILE_TYPES.map((t) => (
              <label key={t} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.certificate_file_types.includes(t)}
                  onCheckedChange={() => set("certificate_file_types", toggleIn(form.certificate_file_types, t))}
                />
                {t}
              </label>
            ))}
            <Input
              type="number" min={1} max={10} className="w-20"
              value={form.certificate_max_mb}
              onChange={(e) => set("certificate_max_mb", Number(e.target.value))}
            />
            <span className="text-sm text-[#888780]">MB</span>
          </div>
        </Row>
      </SectionCard>

      {/* C. Photo — PS-12, PS-13 */}
      <SectionCard icon={Camera} title="Photo">
        <Row label="Pet photo mandatory">
          <Switch checked={form.photo_mandatory} onCheckedChange={(v) => set("photo_mandatory", v)} />
        </Row>
        <Row label="Share photo with security (guard app)" hint="A clear face photo helps security recognise the pet">
          <Switch checked={form.share_photo_with_security} onCheckedChange={(v) => set("share_photo_with_security", v)} />
        </Row>
      </SectionCard>

      {/* PS-04 — breed master */}
      <SectionCard
        icon={PawPrint}
        title="Breed list"
        hint="Untick a breed to hide it from residents. “Indie / Mixed” and “Other” are always shown."
      >
        <div className="grid gap-4 py-2 md:grid-cols-3">
          {(["Dog", "Cat", "Bird"] as BreedType[]).map((type) => (
            <div key={type} className="rounded-lg border border-[#e5e5e5] p-3">
              <div className="mb-2 text-sm font-semibold">{type} breeds</div>
              <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
                {allBreeds(type).map((b) => {
                  const locked = LOCKED_BREEDS.includes(b);
                  return (
                    <label key={b} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        disabled={locked}
                        checked={locked || form.breeds[type].includes(b)}
                        onCheckedChange={() => toggleBreed(type, b)}
                      />
                      {b}
                    </label>
                  );
                })}
              </div>
              <div className="mt-3 flex gap-2">
                <Input
                  placeholder="Add breed" className="h-8 text-sm"
                  value={newBreed[type]}
                  onChange={(e) => setNewBreed((n) => ({ ...n, [type]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && addBreed(type)}
                />
                <Button type="button" size="sm" variant="outline" className="h-8 px-2" onClick={() => addBreed(type)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* D. Reminders — PS-14, RM-01 … RM-07 */}
      <SectionCard icon={BellRing} title="Vaccination reminders" hint="Optional feature">
        <Row label="Vaccination reminders" hint="Off = no “Remind owner” button">
          <Switch checked={form.reminders_enabled} onCheckedChange={(v) => set("reminders_enabled", v)} />
        </Row>
        <Row label="“Due soon” window (days)" hint="1–90. Drives due status and the Due soon count">
          <Input
            type="number" min={1} max={90} className="w-24"
            value={form.due_soon_window}
            onChange={(e) => set("due_soon_window", Number(e.target.value))}
          />
        </Row>
        {form.reminders_enabled && (
          <>
            <Row label="Channels" hint="SMS / WhatsApp cost decision pending">
              <div className="flex flex-wrap gap-3">
                {CHANNELS.map((c) => (
                  <label key={c} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={form.channels.includes(c)} onCheckedChange={() => set("channels", toggleIn(form.channels, c))} />
                    {c}
                  </label>
                ))}
              </div>
            </Row>
            <Row label="Automatic reminders" hint="Off = only manual “Remind owner”">
              <Switch checked={form.auto_reminders} onCheckedChange={(v) => set("auto_reminders", v)} />
            </Row>
            {form.auto_reminders && (
              <>
                <Row label="Remind before due (days)">
                  <div className="flex flex-wrap gap-3">
                    {DAYS_BEFORE.map((d) => (
                      <label key={d} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={form.remind_days_before.includes(d)}
                          onCheckedChange={() =>
                            set("remind_days_before", toggleIn(form.remind_days_before, d).sort((a, b) => b - a))
                          }
                        />
                        {d}
                      </label>
                    ))}
                  </div>
                </Row>
                <Row label="Remind when overdue">
                  <Select value={form.overdue_repeat} onValueChange={(v) => set("overdue_repeat", v)}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {OVERDUE_REPEATS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Row>
                <Row label="Stop after (reminders)" hint="1–10. Avoids spamming">
                  <Input
                    type="number" min={1} max={10} className="w-24"
                    value={form.stop_after ?? ""}
                    onChange={(e) => set("stop_after", numberOrNull(e.target.value))}
                  />
                </Row>
                <Row label="Remind owners of “Not taken” pets">
                  <Switch checked={form.remind_not_taken} onCheckedChange={(v) => set("remind_not_taken", v)} />
                </Row>
              </>
            )}
          </>
        )}
      </SectionCard>

      <FormFooter onCancel={() => navigate(REGISTER_PATH)} onSave={handleSave} saving={saving} />
    </div>
  );
};

export default PetSettingsPage;
