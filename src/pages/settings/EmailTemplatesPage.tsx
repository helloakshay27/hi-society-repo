import { useEffect, useRef, useState, useCallback } from "react";
import juice from "juice";
import grapesjs, { type Editor as GjsEditor } from "grapesjs";
import type { ComponentDefinition } from "grapesjs";
import gjsNewsletterPreset from "grapesjs-preset-newsletter";
import "grapesjs/dist/css/grapes.min.css";
import {
  Plus, Search, Edit2, Trash2, Copy, Eye, Mail,
  ToggleLeft, ToggleRight, X, Save, Monitor, Smartphone,
  Download, Code, ChevronDown, ArrowLeft, RefreshCw,
} from "lucide-react";
import { clsx } from "clsx";
import { toast } from "sonner";
import {
  emailTemplatesApi, MODULES, MODULE_LABELS, CATEGORIES, MERGE_TAGS,
  type EmailTemplate, type CreateTemplatePayload,
} from "@/api/emailTemplates";

// Brand palette (Lockated brand guidelines) — used instead of custom Tailwind tokens.
const CORAL = "#DA7756";
const CORAL_HOVER = "#c56845";

const STARTER_HTML = `
<table style="width:100%;max-width:600px;margin:0 auto;font-family:Arial,sans-serif;border-collapse:collapse;">
  <tr>
    <td style="background:#2C2C2C;padding:36px 32px;text-align:center;">
      <img src="https://india.lockated.co/lockated/lockated-logo-nw.png" alt="{{society.name}}" style="height:40px;display:block;margin:0 auto 12px;" />
      <h1 style="color:#ffffff;margin:0;font-size:30px;font-weight:700;letter-spacing:-0.5px;">{{society.name}}</h1>
      <p style="color:rgba(255,255,255,0.65);margin:8px 0 0;font-size:14px;">Society Communication</p>
    </td>
  </tr>
  <tr>
    <td style="background:#ffffff;padding:36px 32px;color:#374151;font-size:15px;line-height:1.75;">
      <p style="margin:0 0 16px;">Hello <strong>{{user.first_name}}</strong>,</p>
      <p style="margin:0 0 16px;">Write your message to society members here. Use the blocks on the left and merge tags to personalise each email.</p>
      <p style="margin:0 0 28px;">Thank you.</p>
      <p style="text-align:center;margin:0 0 16px;">
        <a href="#" style="display:inline-block;background:#DA7756;color:#ffffff;padding:13px 32px;text-decoration:none;border-radius:6px;font-weight:700;font-size:15px;letter-spacing:0.2px;">View Details</a>
      </p>
    </td>
  </tr>
  <tr>
    <td style="background:#F6F4EE;border-top:1px solid #e5e7eb;padding:24px 32px;text-align:center;color:#9ca3af;font-size:12px;line-height:1.6;">
      <p style="margin:0 0 6px;font-weight:600;color:#6b7280;">{{society.name}}</p>
      <p style="margin:0;">You are receiving this because you are a member of {{society.name}}.</p>
    </td>
  </tr>
</table>
`;

const MERGE_TAG_GROUPS = Object.entries(MERGE_TAGS).map(([group, tags]) => ({
  group: group.charAt(0).toUpperCase() + group.slice(1),
  tags,
}));

// ─────────────────────────────────────────────────────────────────────────────
// GrapesJS EMAIL EDITOR OVERLAY
// ─────────────────────────────────────────────────────────────────────────────

interface EditorOverlayProps {
  template?: EmailTemplate;
  onClose: () => void;
  onSaved: () => void;
}

function EditorOverlay({ template, onClose, onSaved }: EditorOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<GjsEditor | null>(null);

  const [name, setName]         = useState(template?.name     ?? "");
  const [subject, setSubject]   = useState(template?.subject   ?? "");
  const [category, setCategory] = useState(template?.category ?? "");
  const [moduleVal, setModule]  = useState(template?.module   ?? "");
  const [desc, setDesc]         = useState(template?.description ?? "");
  const [isActive, setIsActive] = useState(template?.is_active ?? true);

  const [deviceMode, setDeviceMode]     = useState<"desktop"|"mobile">("desktop");
  const [showCode, setShowCode]         = useState(false);
  const [showPreview, setShowPreview]   = useState(false);
  const [previewHtml, setPreviewHtml]   = useState("");
  const [saving, setSaving]             = useState(false);
  const [openMergeGrp, setOpenMergeGrp] = useState<string|null>(null);
  const [leftTab, setLeftTab]           = useState<"blocks"|"layers">("blocks");
  const [rightTab, setRightTab]         = useState<"style"|"settings">("style");

  // ── init GrapesJS ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || editorRef.current) return;

    const editor = grapesjs.init({
      container: containerRef.current,
      height: "100%",
      width: "100%",
      storageManager: false,
      plugins: [gjsNewsletterPreset],
      pluginsOpts: {
        "grapesjs-preset-newsletter": {
          inlineCss: true,
          modalLabelImport: "Paste HTML",
          modalLabelExport: "Copy HTML",
        },
      },
      canvas: {
        styles: ["https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"],
      },
      panels: { defaults: [] },
      blockManager:  { appendTo: "#gjsBlocks" },
      styleManager:  { appendTo: "#gjsStyles",  sectors: buildStyleSectors() },
      layerManager:  { appendTo: "#gjsLayers" },
      traitManager:  { appendTo: "#gjsTraits" },
      deviceManager: {
        devices: [
          { name: "Desktop", width: "" },
          { name: "Mobile",  width: "320px", widthMedia: "480px" },
        ],
      },
      assetManager: {
        assets: ["https://india.lockated.co/lockated/lockated-logo-nw.png"],
        upload: false,
        embedAsBase64: true,
        handleAdd(textFromInput: string) {
          const src = textFromInput.trim();
          if (src) return src;
        },
      },
    });

    editor.on("asset:open", () => {
      setTimeout(() => {
        const input = document.querySelector<HTMLInputElement>(".gjs-am-add-field input, .gjs-am-input");
        if (input) input.focus();
      }, 100);
    });

    editor.on("component:add", (component: { get: (key: string) => unknown }) => {
      if (component.get("type") === "image" && !component.get("src")) {
        setTimeout(() => editor.runCommand("open-assets", { target: component }), 100);
      }
    });

    editor.DomComponents.addType("image", {
      model: {
        defaults: {
          traits: [
            { type: "text", label: "Image URL", name: "src", placeholder: "https://example.com/image.png" },
            { type: "text", label: "Alt Text",  name: "alt", placeholder: "Describe the image" },
            { type: "text", label: "Width",     name: "width",  placeholder: "e.g. 100% or 300px" },
            { type: "text", label: "Height",    name: "height", placeholder: "e.g. auto or 200px" },
          ],
        },
      },
    });

    const rawHtml = template?.body_html ?? STARTER_HTML;
    const bodyMatch = rawHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    editor.setComponents(bodyMatch ? bodyMatch[1] : rawHtml);

    registerBlocks(editor);

    editor.on("device:select", (...args: unknown[]) => {
      const dev = args[0] as { getName?: () => string | undefined } | null | undefined;
      setDeviceMode(dev?.getName?.() === "Mobile" ? "mobile" : "desktop");
    });

    editorRef.current = editor;
    return () => { editor.destroy(); editorRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── helpers ───────────────────────────────────────────────────────────────
  const getFullHtml = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return "";
    const css  = (editor.getCss() ?? "").replace(/url\(['"]?data:[^'")\s]+['"]?\)/gi, "none");
    const html = editor.getHtml()
      .replace(/(?:background|src)=["']data:[^"']+["']/gi, "")
      .replace(/url\(['"]?data:[^'")\s]+['"]?\)/gi, "none");
    return `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
  <style type="text/css">
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
    table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}
    img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none}
    ${css}
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;word-spacing:normal;">${html}</body>
</html>`;
  }, []);

  const switchDevice = (mode: "desktop"|"mobile") => {
    editorRef.current?.setDevice(mode === "mobile" ? "Mobile" : "Desktop");
    setDeviceMode(mode);
  };

  const handlePreview = () => {
    setPreviewHtml(getFullHtml());
    setShowPreview(true);
  };

  const handleExport = () => {
    const blob = new Blob([getFullHtml()], { type: "text/html" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${name || "email-template"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const insertMergeTag = (tag: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    const sel = editor.getSelected();
    const el  = sel?.getEl();
    if (el) { el.focus(); document.execCommand("insertText", false, tag); }
    else {
      editor.setComponents(editor.getHtml() + ` <span>${tag}</span>`);
    }
    setOpenMergeGrp(null);
    toast.success(`Inserted ${tag}`);
  };

  const handleSave = async () => {
    if (!name.trim())    { toast.error("Template name is required");  return; }
    if (!subject.trim()) { toast.error("Subject line is required");    return; }
    setSaving(true);
    try {
      const rawHtml = getFullHtml();
      let inlinedHtml = rawHtml;
      try {
        inlinedHtml = juice(rawHtml, {
          removeStyleTags:              true,
          preserveMediaQueries:         false,
          preserveFontFaces:            false,
          applyAttributesTableElements: true,
          applyWidthAttributes:         true,
        });
      } catch {
        // juice failed — save raw HTML; server-side rendering still works
      }

      inlinedHtml = inlinedHtml
        .replace(/\s(?:background|src)=["']data:[^"']{20,}["']/gi, "")
        .replace(/url\(['"]?data:[^'")\s]{20,}['"]?\)/gi, "none");

      const payload: CreateTemplatePayload = {
        name:        name.trim(),
        subject:     subject.trim(),
        body_html:   inlinedHtml,
        category:    category   || undefined,
        module:      moduleVal  || undefined,
        description: desc       || undefined,
        is_active:   isActive,
      };
      if (template?.id) {
        await emailTemplatesApi.update(template.id, payload);
        toast.success("Template updated");
      } else {
        await emailTemplatesApi.create(payload);
        toast.success("Template created");
      }
      onSaved();
      onClose();
    } catch {
      toast.error("Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#18181a]">

      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2 bg-[#222224] border-b border-white/10 shrink-0 min-h-[48px]">
        <button onClick={onClose} className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm transition-colors shrink-0">
          <ArrowLeft size={15} />
          <span className="hidden sm:inline">Back</span>
        </button>

        <div className="w-px h-5 bg-white/10 shrink-0" />

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Template name…"
          className="bg-white/5 border border-white/10 rounded px-2.5 py-1 text-white text-sm font-semibold placeholder:text-white/25 outline-none focus:border-[#DA7756] w-44"
        />

        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Email subject line…"
          className="bg-white/5 border border-white/10 rounded px-2.5 py-1 text-white/80 text-sm placeholder:text-white/25 outline-none focus:border-[#DA7756] flex-1 min-w-0 max-w-sm"
        />

        <div className="flex items-center gap-1.5 shrink-0">
          <select
            value={moduleVal}
            onChange={(e) => setModule(e.target.value)}
            style={{ colorScheme: "dark" }}
            className={clsx(
              "bg-white/5 border rounded px-2.5 py-1 text-sm outline-none focus:border-[#DA7756]",
              moduleVal ? "border-[#DA7756]/60 text-[#DA7756] font-semibold" : "border-white/15 text-white/50"
            )}
          >
            <option value="" style={{ background: "#1e1e1e", color: "#ccc" }}>Select Audience</option>
            {MODULES.map((m) => (
              <option key={m} value={m} style={{ background: "#1e1e1e", color: "#fff" }}>{MODULE_LABELS[m] || m}</option>
            ))}
          </select>
        </div>

        <div className="ml-auto flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-white/8 rounded p-0.5 gap-0.5">
            {(["desktop","mobile"] as const).map((d) => (
              <button
                key={d}
                onClick={() => switchDevice(d)}
                className={clsx("p-1.5 rounded transition-colors", deviceMode === d ? "bg-white/20 text-white" : "text-white/40 hover:text-white")}
                title={d.charAt(0).toUpperCase()+d.slice(1)}
              >
                {d === "desktop" ? <Monitor size={14}/> : <Smartphone size={14}/>}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowCode(v => !v)}
            className={clsx("p-1.5 rounded transition-colors", showCode ? "bg-white/20 text-white" : "text-white/40 hover:text-white")}
            title="HTML Source"
          >
            <Code size={14}/>
          </button>

          <button onClick={handlePreview} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white/60 hover:text-white hover:bg-white/8 rounded transition-colors">
            <Eye size={14}/> Preview
          </button>

          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white/60 hover:text-white hover:bg-white/8 rounded transition-colors">
            <Download size={14}/> Export
          </button>

          <button onClick={() => setIsActive(v => !v)} className="flex items-center gap-1.5" title={isActive ? "Active" : "Draft"}>
            {isActive
              ? <ToggleRight size={22} className="text-green-400"/>
              : <ToggleLeft  size={22} className="text-white/30"/>}
            <span className={clsx("text-xs", isActive ? "text-green-400" : "text-white/30")}>
              {isActive ? "Active" : "Draft"}
            </span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className={clsx("flex items-center gap-2 px-4 py-1.5 rounded text-sm font-semibold transition-colors text-white", saving ? "cursor-not-allowed" : "")}
            style={{ background: saving ? "rgba(218,119,86,0.5)" : CORAL }}
            onMouseEnter={(e) => { if (!saving) (e.currentTarget.style.background = CORAL_HOVER); }}
            onMouseLeave={(e) => { if (!saving) (e.currentTarget.style.background = CORAL); }}
          >
            {saving ? <RefreshCw size={14} className="animate-spin"/> : <Save size={14}/>}
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* Three-column builder */}
      <div className="flex flex-1 min-h-0">

        {/* LEFT */}
        <div className="w-56 bg-[#222224] border-r border-white/10 flex flex-col shrink-0 overflow-hidden">
          <div className="flex border-b border-white/10 shrink-0">
            {(["blocks","layers"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setLeftTab(t)}
                className={clsx("flex-1 py-2 text-[10px] font-semibold uppercase tracking-wider transition-colors", leftTab === t ? "text-[#DA7756] border-b-2 border-[#DA7756]" : "text-white/35 hover:text-white/65")}
              >
                {t}
              </button>
            ))}
          </div>

          <div className={clsx("flex-1 overflow-y-auto", leftTab !== "blocks" && "hidden")} id="gjsBlocks"/>
          <div className={clsx("flex-1 overflow-y-auto", leftTab !== "layers" && "hidden")} id="gjsLayers"/>

          <div className="border-t border-white/10 p-3 space-y-2 shrink-0">
            <MetaSelect label="Category" value={category} onChange={setCategory} options={CATEGORIES}/>
            <MetaSelect label="Audience" value={moduleVal} onChange={setModule} options={MODULES} labelMap={MODULE_LABELS}/>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/35 mb-1">Description</label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={2}
                placeholder="Optional…"
                className="w-full bg-white/5 text-white/75 text-[11px] border border-white/10 rounded px-2 py-1.5 focus:outline-none focus:border-[#DA7756] resize-none placeholder:text-white/20"
              />
            </div>
          </div>

          <div className="border-t border-white/10 shrink-0">
            <div className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-white/35 font-semibold flex items-center gap-1.5">
              <Code size={11}/> Merge Tags
            </div>
            <div className="max-h-44 overflow-y-auto">
              {MERGE_TAG_GROUPS.map(({group, tags}) => (
                <div key={group}>
                  <button
                    onClick={() => setOpenMergeGrp(openMergeGrp === group ? null : group)}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] text-white/50 hover:text-white/85 hover:bg-white/5 transition-colors"
                  >
                    {group}
                    <ChevronDown size={10} className={clsx("transition-transform", openMergeGrp === group && "rotate-180")}/>
                  </button>
                  {openMergeGrp === group && (
                    <div className="px-3 pb-2 space-y-0.5">
                      {tags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => insertMergeTag(tag)}
                          className="w-full text-left px-2 py-1 text-[10px] font-mono bg-white/[0.04] hover:bg-[#DA7756]/15 hover:text-[#DA7756] text-white/40 rounded transition-colors truncate"
                          title={tag}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER */}
        <div className="flex-1 flex flex-col min-w-0 relative bg-[#18181a]">
          <div ref={containerRef} className="flex-1"/>

          {showCode && (
            <div className="absolute inset-0 z-10 bg-[#111113] flex flex-col">
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 shrink-0">
                <span className="text-white/50 text-sm font-mono">HTML Source</span>
                <button onClick={() => setShowCode(false)} className="text-white/35 hover:text-white text-sm">✕ Close</button>
              </div>
              <textarea
                readOnly
                value={getFullHtml()}
                className="flex-1 bg-[#0d0d0f] text-green-400 font-mono text-[11px] p-4 resize-none focus:outline-none leading-relaxed"
              />
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="w-56 bg-[#222224] border-l border-white/10 flex flex-col shrink-0 overflow-hidden">
          <div className="flex border-b border-white/10 shrink-0">
            {(["style","settings"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setRightTab(t)}
                className={clsx("flex-1 py-2 text-[10px] font-semibold uppercase tracking-wider transition-colors", rightTab === t ? "text-[#DA7756] border-b-2 border-[#DA7756]" : "text-white/35 hover:text-white/65")}
              >
                {t === "style" ? "Style" : "Settings"}
              </button>
            ))}
          </div>
          <div className={clsx("flex-1 overflow-y-auto", rightTab !== "style"    && "hidden")} id="gjsStyles"/>
          <div className={clsx("flex-1 overflow-y-auto", rightTab !== "settings" && "hidden")} id="gjsTraits"/>
        </div>
      </div>

      {/* Preview modal */}
      {showPreview && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 p-4">
          <div className="bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden" style={{width:"90vw",height:"90vh",maxWidth:820}}>
            <div className="flex items-center justify-between px-5 py-3 border-b shrink-0">
              <div>
                <p className="font-semibold text-gray-800 text-sm">{name || "Untitled"}</p>
                <p className="text-xs text-gray-500">{subject || "No subject"}</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleExport} className="text-xs font-medium hover:underline flex items-center gap-1" style={{ color: CORAL }}><Download size={12}/>Export</button>
                <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-100 transition-colors"><X size={16}/></button>
              </div>
            </div>
            <iframe
              srcDoc={previewHtml}
              className="flex-1 w-full border-0"
              title="Email Preview"
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function MetaSelect({ label, value, onChange, options, labelMap }: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[]; labelMap?: Record<string,string>;
}) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-widest text-white/35 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ colorScheme: "dark" }}
        className="w-full bg-white/5 text-white/75 text-[11px] border border-white/10 rounded px-2 py-1.5 focus:outline-none focus:border-[#DA7756]"
      >
        <option value="" style={{ background: "#1e1e1e", color: "#aaa" }}>None</option>
        {options.map((o) => <option key={o} value={o} style={{ background: "#1e1e1e", color: "#fff" }}>{labelMap?.[o] || o}</option>)}
      </select>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GRAPESJS BLOCK REGISTRATION
// ─────────────────────────────────────────────────────────────────────────────

function registerBlocks(editor: GjsEditor) {
  const bm = editor.BlockManager;
  bm.clear();

  const blocks: Array<{ id: string; label: string; category: string; icon: string; content: string | ComponentDefinition }> = [
    {
      id: "b-header", label: "Header", category: "Sections", icon: "H",
      content: `<table width="100%" style="background:#2C2C2C;border-collapse:collapse;"><tr><td style="padding:36px 32px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:28px;font-weight:700;">{{society.name}}</h1>
        <p style="color:rgba(255,255,255,0.65);margin:8px 0 0;font-size:13px;">Society Communication</p>
      </td></tr></table>`,
    },
    {
      id: "b-hero", label: "Hero", category: "Sections", icon: "★",
      content: `<table width="100%" style="background:linear-gradient(135deg,#DA7756 0%,#c56845 100%);border-collapse:collapse;"><tr><td style="padding:52px 32px;text-align:center;">
        <h1 style="color:#fff;margin:0 0 14px;font-size:36px;font-weight:700;line-height:1.2;">Big Headline Here</h1>
        <p style="color:rgba(255,255,255,0.88);margin:0 0 28px;font-size:16px;line-height:1.6;">Supporting description that tells the reader exactly what this email is about.</p>
        <a href="#" style="display:inline-block;background:#fff;color:#DA7756;padding:14px 36px;text-decoration:none;border-radius:6px;font-weight:700;font-size:15px;">Take Action</a>
      </td></tr></table>`,
    },
    {
      id: "b-text", label: "Text", category: "Sections", icon: "¶",
      content: `<table width="100%" style="background:#fff;border-collapse:collapse;"><tr><td style="padding:32px;font-family:Arial,sans-serif;font-size:15px;color:#374151;line-height:1.75;">
        <p style="margin:0 0 14px;">Hello <strong>{{user.first_name}}</strong>,</p>
        <p style="margin:0 0 14px;">Write your email body here. Use <strong>bold</strong>, <em>italic</em>, and <a href="#" style="color:#DA7756;">links</a> for emphasis.</p>
        <p style="margin:0;">Best regards,<br><strong>{{society.name}}</strong></p>
      </td></tr></table>`,
    },
    {
      id: "b-button", label: "Button", category: "Sections", icon: "▶",
      content: `<table width="100%" style="background:#fff;border-collapse:collapse;"><tr><td style="padding:24px 32px;text-align:center;">
        <a href="#" style="display:inline-block;background:#DA7756;color:#fff;padding:13px 32px;text-decoration:none;border-radius:6px;font-weight:700;font-size:15px;font-family:Arial,sans-serif;">Click Here</a>
      </td></tr></table>`,
    },
    {
      id: "b-image", label: "Image", category: "Sections", icon: "🖼",
      content: {
        type: "image",
        style: { "max-width": "100%", display: "block", margin: "0 auto", "border-radius": "6px" },
        attributes: { src: "https://placehold.co/560x240/F6F4EE/DA7756?text=Click+to+change", alt: "Image" },
      },
    },
    {
      id: "b-logo", label: "Logo", category: "Sections", icon: "◈",
      content: `<table width="100%" style="background:#fff;border-collapse:collapse;"><tr><td style="padding:20px 32px;text-align:center;">
        <img src="https://india.lockated.co/lockated/lockated-logo-nw.png" alt="{{society.name}}" style="height:44px;display:inline-block;max-width:200px;" />
      </td></tr></table>`,
    },
    {
      id: "b-image-text", label: "Image + Text", category: "Sections", icon: "⊡",
      content: `<table width="100%" style="background:#fff;border-collapse:collapse;"><tr>
        <td width="45%" style="padding:28px 12px 28px 32px;vertical-align:top;"><img src="https://placehold.co/280x200/F6F4EE/DA7756?text=Image" alt="" style="width:100%;border-radius:6px;display:block;" /></td>
        <td width="55%" style="padding:28px 32px 28px 16px;vertical-align:middle;font-family:Arial,sans-serif;">
          <h3 style="margin:0 0 10px;font-size:17px;color:#2c2c2a;font-weight:700;">Heading Here</h3>
          <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;">Add your supporting content alongside the image.</p>
        </td>
      </tr></table>`,
    },
    {
      id: "b-banner", label: "Image Banner", category: "Sections", icon: "▬",
      content: `<table width="100%" style="border-collapse:collapse;"><tr><td style="padding:0;">
        <img src="https://placehold.co/600x200/DA7756/ffffff?text=Banner+Image" alt="Banner" style="width:100%;max-width:600px;display:block;" />
      </td></tr></table>`,
    },
    {
      id: "b-two-col", label: "2 Columns", category: "Sections", icon: "⊞",
      content: `<table width="100%" style="background:#fff;border-collapse:collapse;"><tr>
        <td width="50%" style="padding:28px 16px 28px 32px;vertical-align:top;font-family:Arial,sans-serif;">
          <h3 style="margin:0 0 10px;color:#2C2C2C;font-size:16px;">Left Heading</h3>
          <p style="margin:0;font-size:14px;color:#374151;line-height:1.65;">Left column content goes here.</p>
        </td>
        <td width="50%" style="padding:28px 32px 28px 16px;vertical-align:top;font-family:Arial,sans-serif;">
          <h3 style="margin:0 0 10px;color:#2C2C2C;font-size:16px;">Right Heading</h3>
          <p style="margin:0;font-size:14px;color:#374151;line-height:1.65;">Right column content goes here.</p>
        </td>
      </tr></table>`,
    },
    {
      id: "b-quote", label: "Quote", category: "Sections", icon: "❝",
      content: `<table width="100%" style="background:#f8f9fa;border-collapse:collapse;"><tr><td style="padding:28px 32px 28px 28px;border-left:4px solid #DA7756;">
        <p style="margin:0;font-family:Georgia,serif;font-size:17px;font-style:italic;color:#374151;line-height:1.7;">"The secret of getting ahead is getting started."</p>
        <p style="margin:10px 0 0;font-size:13px;color:#9ca3af;font-family:Arial,sans-serif;">— Mark Twain</p>
      </td></tr></table>`,
    },
    {
      id: "b-divider", label: "Divider", category: "Sections", icon: "—",
      content: `<table width="100%" style="background:#fff;border-collapse:collapse;"><tr><td style="padding:8px 32px;">
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:0;"/>
      </td></tr></table>`,
    },
    {
      id: "b-spacer", label: "Spacer", category: "Sections", icon: "↕",
      content: `<table width="100%" style="background:#fff;border-collapse:collapse;"><tr><td style="height:40px;font-size:1px;line-height:1px;">&nbsp;</td></tr></table>`,
    },
    {
      id: "b-social", label: "Social", category: "Sections", icon: "◉",
      content: `<table width="100%" style="background:#fff;border-collapse:collapse;"><tr><td style="padding:20px 32px;text-align:center;font-family:Arial,sans-serif;">
        <p style="margin:0 0 12px;font-size:13px;color:#6b7280;">Follow us on social media</p>
        <a href="#" style="display:inline-block;margin:0 5px;background:#1DA1F2;color:#fff;width:36px;height:36px;line-height:36px;border-radius:50%;text-align:center;text-decoration:none;font-weight:700;font-size:13px;">T</a>
        <a href="#" style="display:inline-block;margin:0 5px;background:#1877F2;color:#fff;width:36px;height:36px;line-height:36px;border-radius:50%;text-align:center;text-decoration:none;font-weight:700;font-size:13px;">f</a>
        <a href="#" style="display:inline-block;margin:0 5px;background:#0A66C2;color:#fff;width:36px;height:36px;line-height:36px;border-radius:50%;text-align:center;text-decoration:none;font-weight:700;font-size:13px;">in</a>
      </td></tr></table>`,
    },
    {
      id: "b-footer", label: "Footer", category: "Sections", icon: "▼",
      content: `<table width="100%" style="background:#F6F4EE;border-top:1px solid #e5e7eb;border-collapse:collapse;"><tr><td style="padding:24px 32px;text-align:center;font-family:Arial,sans-serif;font-size:12px;color:#9ca3af;line-height:1.65;">
        <p style="margin:0 0 6px;font-weight:600;color:#6b7280;">{{society.name}}</p>
        <p style="margin:0;">You are receiving this because you are a member of {{society.name}}.</p>
      </td></tr></table>`,
    },
    {
      id: "b-stats", label: "Stats / KPIs", category: "Elements", icon: "📊",
      content: `<table width="100%" style="background:#fff;border-collapse:collapse;"><tr>
        <td width="33%" style="padding:24px 12px;text-align:center;border-right:1px solid #f0f0f0;font-family:Arial,sans-serif;">
          <p style="margin:0;font-size:32px;font-weight:700;color:#DA7756;">98%</p>
          <p style="margin:6px 0 0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;">Occupancy</p>
        </td>
        <td width="33%" style="padding:24px 12px;text-align:center;border-right:1px solid #f0f0f0;font-family:Arial,sans-serif;">
          <p style="margin:0;font-size:32px;font-weight:700;color:#DA7756;">500+</p>
          <p style="margin:6px 0 0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;">Members</p>
        </td>
        <td width="33%" style="padding:24px 12px;text-align:center;font-family:Arial,sans-serif;">
          <p style="margin:0;font-size:32px;font-weight:700;color:#DA7756;">24/7</p>
          <p style="margin:6px 0 0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;">Support</p>
        </td>
      </tr></table>`,
    },
    {
      id: "b-highlight", label: "Highlight Box", category: "Elements", icon: "💡",
      content: `<table width="100%" style="background:#fff;border-collapse:collapse;"><tr><td style="padding:8px 32px;">
        <table width="100%" style="border-collapse:collapse;background:#FFF8F5;border-left:4px solid #DA7756;border-radius:4px;">
          <tr><td style="padding:16px 20px;font-family:Arial,sans-serif;font-size:14px;color:#374151;line-height:1.7;">Add a key message or important note for the reader here.</td></tr>
        </table>
      </td></tr></table>`,
    },
    {
      id: "b-table", label: "Table", category: "Elements", icon: "⊟",
      content: `<table width="100%" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;background:#fff;">
        <tr style="background:#f3f4f6;">
          <th style="padding:10px 14px;border:1px solid #e5e7eb;text-align:left;color:#374151;font-weight:600;">Item</th>
          <th style="padding:10px 14px;border:1px solid #e5e7eb;text-align:left;color:#374151;font-weight:600;">Detail</th>
          <th style="padding:10px 14px;border:1px solid #e5e7eb;text-align:right;color:#374151;font-weight:600;">Amount</th>
        </tr>
        <tr>
          <td style="padding:10px 14px;border:1px solid #e5e7eb;color:#374151;">Maintenance</td>
          <td style="padding:10px 14px;border:1px solid #e5e7eb;color:#374151;">Monthly</td>
          <td style="padding:10px 14px;border:1px solid #e5e7eb;color:#374151;text-align:right;">₹2,500</td>
        </tr>
      </table>`,
    },
    {
      id: "b-list", label: "List", category: "Elements", icon: "≡",
      content: `<table width="100%" style="background:#fff;border-collapse:collapse;"><tr><td style="padding:24px 32px;font-family:Arial,sans-serif;font-size:14px;color:#374151;line-height:1.75;">
        <ul style="margin:0;padding-left:20px;">
          <li>First bullet point — add your content here</li>
          <li>Second bullet point — add your content here</li>
          <li>Third bullet point — add your content here</li>
        </ul>
      </td></tr></table>`,
    },
  ];

  blocks.forEach(({ id, label, category, content }) => {
    bm.add(id, { label, category, content, activate: id === "b-image" });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLE SECTORS
// ─────────────────────────────────────────────────────────────────────────────

function buildStyleSectors() {
  return [
    {
      name: "Typography", open: true,
      properties: [
        { property: "font-family", type: "select", defaults: "Arial,sans-serif", options: [
          { value: "Arial,sans-serif", name: "Arial" },
          { value: "'Poppins',sans-serif", name: "Poppins" },
          { value: "Georgia,serif", name: "Georgia" },
          { value: "'Times New Roman',serif", name: "Times New Roman" },
          { value: "Verdana,sans-serif", name: "Verdana" },
          { value: "'Courier New',monospace", name: "Courier New" },
        ]},
        { property: "font-size", type: "integer", defaults: "15", units: ["px","em"] },
        { property: "font-weight", type: "select", defaults: "400", options: [
          { value: "300", name: "Light" }, { value: "400", name: "Normal" },
          { value: "500", name: "Medium" }, { value: "600", name: "SemiBold" }, { value: "700", name: "Bold" },
        ]},
        { property: "line-height", type: "integer", defaults: "1.6", units: ["","px"] },
        { property: "letter-spacing", type: "integer", defaults: "0", units: ["px","em"] },
        { property: "color", type: "color" },
        { property: "text-align", type: "radio", defaults: "left", options: [
          { value: "left", name: "Left" }, { value: "center", name: "Center" },
          { value: "right", name: "Right" }, { value: "justify", name: "Justify" },
        ]},
        { property: "text-decoration", type: "select", defaults: "none", options: [
          { value: "none", name: "None" }, { value: "underline", name: "Underline" },
          { value: "line-through", name: "Strike" },
        ]},
      ],
    },
    {
      name: "Background", open: false,
      properties: [
        { property: "background-color", type: "color" },
        { property: "background-size", type: "select", defaults: "auto", options: [
          { value: "auto", name: "Auto" }, { value: "cover", name: "Cover" }, { value: "contain", name: "Contain" },
        ]},
      ],
    },
    {
      name: "Spacing", open: false,
      properties: [
        { property: "padding", type: "composite", properties: [
          { property: "padding-top", type: "integer", units: ["px"] },
          { property: "padding-right", type: "integer", units: ["px"] },
          { property: "padding-bottom", type: "integer", units: ["px"] },
          { property: "padding-left", type: "integer", units: ["px"] },
        ]},
        { property: "margin", type: "composite", properties: [
          { property: "margin-top", type: "integer", units: ["px"] },
          { property: "margin-right", type: "integer", units: ["px"] },
          { property: "margin-bottom", type: "integer", units: ["px"] },
          { property: "margin-left", type: "integer", units: ["px"] },
        ]},
      ],
    },
    {
      name: "Border", open: false,
      properties: [
        { property: "border-width", type: "integer", units: ["px"] },
        { property: "border-style", type: "select", defaults: "none", options: [
          { value: "none", name: "None" }, { value: "solid", name: "Solid" },
          { value: "dashed", name: "Dashed" }, { value: "dotted", name: "Dotted" },
        ]},
        { property: "border-color", type: "color" },
        { property: "border-radius", type: "integer", units: ["px"] },
      ],
    },
    {
      name: "Size", open: false,
      properties: [
        { property: "width", type: "integer", units: ["px","%"] },
        { property: "max-width", type: "integer", units: ["px","%"] },
        { property: "height", type: "integer", units: ["px","auto"] },
      ],
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE LIST PAGE  (route: /settings/template-list)
// ─────────────────────────────────────────────────────────────────────────────

export function EmailTemplatesPage() {
  const [templates, setTemplates]   = useState<EmailTemplate[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [filterCat, setFilterCat]   = useState("");
  const [filterMod, setFilterMod]   = useState("");

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTpl, setEditingTpl] = useState<EmailTemplate|undefined>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await emailTemplatesApi.list({
        category: filterCat || undefined,
        module:   filterMod || undefined,
      });
      setTemplates(data);
    } catch {
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, [filterCat, filterMod]);

  useEffect(() => { load(); }, [load]);

  const filtered = templates.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return t.name.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q);
  });

  const openNew  = () => { setEditingTpl(undefined); setEditorOpen(true); };
  const openEdit = (t: EmailTemplate) => { setEditingTpl(t); setEditorOpen(true); };

  const handleDelete = async (t: EmailTemplate) => {
    if (!confirm(`Delete "${t.name}"? This cannot be undone.`)) return;
    try {
      await emailTemplatesApi.delete(t.id);
      setTemplates((p) => p.filter((x) => x.id !== t.id));
      toast.success("Template deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleToggle = async (t: EmailTemplate) => {
    try {
      const u = await emailTemplatesApi.update(t.id, { is_active: !t.is_active });
      setTemplates((p) => p.map((x) => x.id === t.id ? u : x));
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleDuplicate = async (t: EmailTemplate) => {
    try {
      const c = await emailTemplatesApi.create({
        name: `${t.name} (Copy)`, subject: t.subject,
        body_html: t.body_html, body_text: t.body_text || undefined,
        category: t.category || undefined, module: t.module || undefined,
        description: t.description || undefined, is_active: false,
      });
      setTemplates((p) => [c, ...p]);
      toast.success("Template duplicated");
    } catch {
      toast.error("Failed to duplicate");
    }
  };

  const handlePreview = (t: EmailTemplate) => {
    const win = window.open("", "_blank");
    if (win) { win.document.write(t.body_html || "<p>No content</p>"); win.document.close(); }
  };

  return (
    <div className="min-h-screen" style={{ background: "#F6F4EE" }}>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-[#2C2C2C] flex items-center gap-2">
              <Mail size={22} style={{ color: CORAL }}/> Email Templates
            </h2>
            <p className="text-sm text-[#6B6B6B] mt-0.5">Design and manage reusable email templates with the visual builder.</p>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-md transition-colors shadow-sm"
            style={{ background: CORAL }}
          >
            <Plus size={15}/> New Template
          </button>
        </div>

        {/* Audience tab bar */}
        <div className="flex items-center gap-1 mb-4 border-b border-[#E5E1D8] pb-0 overflow-x-auto">
          {[{ value: "", label: "All" }, ...MODULES.map(m => ({ value: m, label: MODULE_LABELS[m] || m }))].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilterMod(value)}
              className={clsx("px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors",
                filterMod === value ? "text-[#DA7756]" : "border-transparent text-[#6B6B6B] hover:text-[#2C2C2C]")}
              style={filterMod === value ? { borderColor: CORAL } : undefined}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Filters bar */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B6B] pointer-events-none"/>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates…"
              className="w-full pl-8 pr-4 py-2 text-sm bg-white border border-[#C4B89D] rounded-md focus:outline-none focus:border-[#DA7756] text-[#2C2C2C] placeholder:text-[#9A968C]"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-[#2C2C2C]">
                <X size={12}/>
              </button>
            )}
          </div>

          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="text-sm bg-white border border-[#C4B89D] rounded-md px-3 py-2 text-[#2C2C2C] focus:outline-none focus:border-[#DA7756]"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <span className="text-xs text-[#6B6B6B] ml-auto">
            {loading ? "Loading…" : `${filtered.length} template${filtered.length!==1?"s":""}`}
          </span>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_,i) => <div key={i} className="h-44 rounded-lg bg-[#E5E1D8] animate-pulse"/>)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-[#E5E1D8]">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(218,119,86,0.1)" }}>
              <Mail size={22} style={{ color: CORAL }}/>
            </div>
            <h3 className="text-xl text-[#2C2C2C] mb-1 font-semibold">
              {search||filterCat||filterMod ? "No templates match" : "No email templates yet"}
            </h3>
            <p className="text-sm text-[#6B6B6B] max-w-xs mb-5">
              {search||filterCat||filterMod ? "Adjust filters or search." : "Create your first template to get started."}
            </p>
            {!search && !filterCat && !filterMod && (
              <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-md transition-colors" style={{ background: CORAL }}>
                <Plus size={15}/> New Template
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                onEdit={() => openEdit(t)}
                onPreview={() => handlePreview(t)}
                onDuplicate={() => handleDuplicate(t)}
                onDelete={() => handleDelete(t)}
                onToggle={() => handleToggle(t)}
              />
            ))}
          </div>
        )}
      </div>

      {editorOpen && (
        <EditorOverlay
          template={editingTpl}
          onClose={() => setEditorOpen(false)}
          onSaved={load}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE CARD
// ─────────────────────────────────────────────────────────────────────────────

function TemplateCard({ template: t, onEdit, onPreview, onDuplicate, onDelete, onToggle }: {
  template: EmailTemplate;
  onEdit: () => void;
  onPreview: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const created = t.created_at ? new Date(t.created_at).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" }) : "";

  return (
    <div className={clsx("bg-white border border-[#E5E1D8] rounded-lg overflow-hidden flex flex-col group transition-shadow hover:shadow-md", !t.is_active && "opacity-60")}>
      {/* Preview strip */}
      <div className="h-28 bg-[#F6F4EE] border-b border-[#E5E1D8] relative cursor-pointer overflow-hidden" onClick={onEdit}>
        <div
          className="absolute inset-0 p-3 text-[8px] leading-tight text-[#6B6B6B] overflow-hidden select-none pointer-events-none"
          style={{ fontFamily:"monospace" }}
          dangerouslySetInnerHTML={{ __html: t.body_html ? t.body_html.replace(/<[^>]+>/g," ").slice(0,400) : "<em>No content</em>" }}
        />
        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(44,44,44,0.3)" }}>
          <button onClick={(e) => { e.stopPropagation(); onPreview(); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#2C2C2C] text-xs font-medium rounded-md hover:bg-[#F6F4EE] transition-colors shadow">
            <Eye size={12}/> Preview
          </button>
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="flex items-center gap-1.5 px-3 py-1.5 text-white text-xs font-medium rounded-md transition-colors shadow" style={{ background: CORAL }}>
            <Edit2 size={12}/> Edit
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3.5 flex flex-col gap-1.5 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-[#2C2C2C] truncate cursor-pointer hover:text-[#DA7756] transition-colors" onClick={onEdit}>
            {t.name}
          </h3>
          {t.category && (
            <span className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full border" style={{ background: "#F6F4EE", color: CORAL, borderColor: "#C4B89D" }}>
              {t.category}
            </span>
          )}
        </div>
        <p className="text-xs text-[#6B6B6B] truncate">{t.subject || "No subject"}</p>
        {t.module && (
          <span className="text-[10px] font-semibold text-[#9A968C] uppercase tracking-wider">
            {MODULE_LABELS[t.module]||t.module}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="px-3.5 pb-3 flex items-center justify-between border-t border-[#E5E1D8] pt-2.5 mt-auto">
        <span className="text-[10px] text-[#9A968C]">{created}</span>
        <div className="flex items-center gap-0.5">
          <button onClick={onToggle} title={t.is_active?"Active — click to deactivate":"Inactive"} className="p-1 rounded transition-colors">
            {t.is_active
              ? <ToggleRight size={17} className="text-[#108C72]"/>
              : <ToggleLeft  size={17} className="text-[#9A968C]"/>}
          </button>
          <button onClick={onDuplicate} title="Duplicate" className="p-1 rounded text-[#6B6B6B] hover:text-[#2C2C2C] hover:bg-[#F6F4EE] transition-colors">
            <Copy size={13}/>
          </button>
          <button onClick={onDelete} title="Delete" className="p-1 rounded text-[#6B6B6B] hover:text-[#C72030] transition-colors">
            <Trash2 size={13}/>
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmailTemplatesPage;
