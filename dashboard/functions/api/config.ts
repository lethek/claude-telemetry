interface Env {
  ALLOWED_EMAILS?: string;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const masked = local.length > 2
    ? local[0] + "***" + local[local.length - 1]
    : "***";
  return `${masked}@${domain}`;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const allowedEmails = context.env.ALLOWED_EMAILS
    ?.split(",")
    .map((e) => e.trim())
    .filter(Boolean) || [];

  return new Response(
    JSON.stringify({
      allowed_emails: allowedEmails.map(maskEmail),
      allowed_emails_count: allowedEmails.length,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
};
