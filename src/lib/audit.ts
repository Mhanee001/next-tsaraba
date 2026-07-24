import { supabase } from "@/integrations/supabase/client";

type AuditAction = "INSERT" | "UPDATE" | "DELETE";

type AuditPayload = {
  table_name: string;
  record_id?: string;
  action: AuditAction;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
};

export async function writeAuditLog(payload: AuditPayload) {
  const changedFields = payload.old_values && payload.new_values
    ? Object.keys(payload.new_values).filter(
        (k) => JSON.stringify(payload.old_values![k]) !== JSON.stringify(payload.new_values![k]),
      )
    : payload.action === "INSERT"
      ? Object.keys(payload.new_values ?? {})
      : [];

  const { error } = await supabase.from("audit_logs").insert({
    table_name: payload.table_name,
    record_id: payload.record_id ?? null,
    action: payload.action,
    old_values: (payload.old_values ?? null) as never,
    new_values: (payload.new_values ?? null) as never,
    changed_fields: changedFields.length > 0 ? changedFields : null,
  });

  if (error) console.error("audit log failed:", error);
}
