// Placeholder email helper.
// Real implementation is scaffolded once an email domain is configured.
// Until then, calls are logged server-side and reported as not-sent.

export type SendResult = { sent: boolean; reason?: string };

export async function sendTemplateEmail(
  template: string,
  to: string,
  opts: {
    templateData?: Record<string, unknown>;
    idempotencyKey?: string;
  } = {},
): Promise<SendResult> {
  console.log("[email:pending-domain-setup]", {
    template,
    to,
    ...opts,
  });
  return { sent: false, reason: "email_domain_not_configured" };
}
