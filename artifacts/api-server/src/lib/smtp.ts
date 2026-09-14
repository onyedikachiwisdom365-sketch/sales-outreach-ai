import nodemailer from "nodemailer";

type SmtpEmailParams = {
  to: string;
  toName?: string | null;
  subject: string;
  body: string;
};

export class SmtpConfigurationError extends Error {
  constructor() {
    super("SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.");
    this.name = "SmtpConfigurationError";
  }
}

export class SmtpDeliveryError extends Error {
  constructor() {
    super("The SMTP server rejected the email. Check the Brevo SMTP credentials and sender settings.");
    this.name = "SmtpDeliveryError";
  }
}

export async function sendEmailWithSmtp({
  to,
  toName,
  subject,
  body,
}: SmtpEmailParams): Promise<void> {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const portValue = process.env.SMTP_PORT?.trim();
  const port = Number(portValue);

  if (!host || !user || !pass || !portValue || !Number.isInteger(port) || port <= 0) {
    throw new SmtpConfigurationError();
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({
      from: user,
      to: toName ? { name: toName, address: to } : to,
      subject,
      text: body,
    });
  } catch {
    throw new SmtpDeliveryError();
  } finally {
    transporter.close();
  }
}