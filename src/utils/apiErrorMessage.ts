const humanizeField = (field: string) =>
  field
    .replace(/[_.]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Converts Rails-style API error payloads into a readable message.
 * e.g. {"building_name":["has already been taken"]} -> "Building Name has already been taken"
 */
export const formatApiErrorMessage = (errorData: unknown, fallback: string): string => {
  if (!errorData) return fallback;
  if (typeof errorData === "string") return errorData;
  if (Array.isArray(errorData)) {
    return errorData.map((e) => formatApiErrorMessage(e, "")).filter(Boolean).join(", ") || fallback;
  }
  if (typeof errorData !== "object") return fallback;

  const data = errorData as Record<string, unknown>;
  if (typeof data.message === "string" && data.message) return data.message;
  if (typeof data.error === "string" && data.error) return data.error;
  if (data.errors) return formatApiErrorMessage(data.errors, fallback);

  const messages = Object.entries(data)
    .map(([field, value]) => {
      const text = Array.isArray(value) ? value.join(", ") : typeof value === "string" ? value : "";
      if (!text) return "";
      return field === "base" ? text : `${humanizeField(field)} ${text}`;
    })
    .filter(Boolean);

  return messages.length ? messages.join(", ") : fallback;
};
