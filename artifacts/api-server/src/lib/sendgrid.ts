type SendGridEmailParams = {
  to: string;
  toName?: string | null;
  subject: string;
  body: string;
};

export class SendGridConfigurationError extends Error {
  constructor() {
    super("SendGrid is not configured. Set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL.");
    this.name = "SendGridConfigurationError";
  }
}

export class SendGridDeliveryError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(
      status === 401 || status === 403
        ? "SendGrid authentication failed. Check the SendGrid API key."
        : `SendGrid rejected the email (HTTP ${status}). Check the verified sender and message content.`,
    );
    this.name = "SendGridDeliveryError";
    this.status = status;
  }
}

export async function sendEmailWithSendGrid({
  to,
  toName,
  subject,
  body,
}: SendGridEmailParams): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY?.trim();
  const fromEmail = process.env.SENDGRID_FROM_EMAIL?.trim();

  if (!apiKey || !fromEmail) {
    throw new SendGridConfigurationError();
  }

  const fromName = process.env.SENDGRID_FROM_NAME?.trim() || "Avion AI";
  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: to, ...(toName ? { name: toName } : {}) }],
        },
      ],
      from: { email: fromEmail, name: fromName },
      subject,
      content: [{ type: "text/plain", value: body }],
    }),
  });

  if (!response.ok) {
    throw new SendGridDeliveryError(response.status);
  }
}