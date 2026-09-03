import axios from "axios";
import { getFullUrl, getAuthHeader } from "@/config/apiConfig";

// Mirrors the Hi-Society backend Spree::Manage::EmailTemplatesController and
// UserEmailsController, mounted under /crm/admin. Shape aligned with the
// GrapesJS visual builder ported from the Sales CRM.

export interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body_html: string;
  body_text?: string | null;
  category?: string | null;
  module?: string | null;
  description?: string | null;
  is_active: boolean;
  created_by_id?: number | null;
  created_at?: string;
  updated_at?: string;
}

export type CreateTemplatePayload = Partial<
  Pick<
    EmailTemplate,
    "name" | "subject" | "body_html" | "body_text" | "category" | "module" | "description" | "is_active"
  >
>;

export interface EmailRecipient {
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  mobile?: string;
  flat?: string;
  tower?: string;
}

export interface SendBulkResult {
  sent: number;
  failed: number;
  errors: { email: string; error: string }[];
}

// Hi-Society audiences (repurposed "module" from the CRM builder).
export const MODULES = ["residents", "owners", "tenants", "staff", "committee", "all_users"];

export const MODULE_LABELS: Record<string, string> = {
  residents: "Residents",
  owners: "Owners",
  tenants: "Tenants",
  staff: "Staff",
  committee: "Committee",
  all_users: "All Users",
};

export const CATEGORIES = [
  "General",
  "Announcement",
  "Notice",
  "Welcome",
  "Reminder",
  "Event",
  "Maintenance",
  "Billing",
  "Other",
];

export const MERGE_TAGS: Record<string, string[]> = {
  user: [
    "{{user.name}}",
    "{{user.first_name}}",
    "{{user.last_name}}",
    "{{user.email}}",
    "{{user.mobile}}",
    "{{user.flat}}",
    "{{user.tower}}",
  ],
  society: ["{{society.name}}"],
};

// Back-compat alias used by SendEmailModal.
export const DEFAULT_MERGE_TAGS = MERGE_TAGS;

const authGet = () => ({ headers: { Authorization: getAuthHeader() } });

export const emailTemplatesApi = {
  list: async (params?: {
    q?: string;
    active?: boolean;
    category?: string;
    module?: string;
  }): Promise<EmailTemplate[]> => {
    const qs = new URLSearchParams();
    if (params?.q) qs.set("q", params.q);
    if (params?.active) qs.set("active", "true");
    if (params?.category) qs.set("category", params.category);
    if (params?.module) qs.set("module", params.module);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    const res = await axios.get(getFullUrl(`/crm/admin/email_templates.json${suffix}`), authGet());
    return res.data?.data ?? [];
  },

  get: async (id: number): Promise<EmailTemplate> => {
    const res = await axios.get(getFullUrl(`/crm/admin/email_templates/${id}.json`), authGet());
    return res.data?.data;
  },

  create: async (payload: CreateTemplatePayload): Promise<EmailTemplate> => {
    const res = await axios.post(
      getFullUrl(`/crm/admin/email_templates.json`),
      { email_template: payload },
      authGet()
    );
    return res.data?.data;
  },

  update: async (id: number, payload: CreateTemplatePayload): Promise<EmailTemplate> => {
    const res = await axios.patch(
      getFullUrl(`/crm/admin/email_templates/${id}.json`),
      { email_template: payload },
      authGet()
    );
    return res.data?.data;
  },

  delete: async (id: number): Promise<void> => {
    await axios.delete(getFullUrl(`/crm/admin/email_templates/${id}.json`), authGet());
  },

  preview: async (
    id: number,
    context?: Record<string, unknown>
  ): Promise<{ subject: string; body: string }> => {
    const res = await axios.post(
      getFullUrl(`/crm/admin/email_templates/${id}/preview.json`),
      { context },
      authGet()
    );
    return res.data?.data;
  },

  mergeTags: async (): Promise<Record<string, string[]>> => {
    const res = await axios.get(getFullUrl(`/crm/admin/email_templates/merge_tags.json`), authGet());
    return res.data?.data ?? {};
  },

  sendBulk: async (payload: {
    template_id?: number;
    subject?: string;
    body_html?: string;
    recipients: EmailRecipient[];
  }): Promise<SendBulkResult> => {
    const res = await axios.post(
      getFullUrl(`/crm/admin/user_emails/send_bulk.json`),
      payload,
      authGet()
    );
    return res.data?.data ?? { sent: 0, failed: 0, errors: [] };
  },
};

export const TEMPLATE_CATEGORIES = CATEGORIES;
