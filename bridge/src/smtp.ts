import { createTransport, type Transporter } from "nodemailer";

export interface SmtpConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  useTLS?: boolean;
  from: string;
}

export interface OutboundEmail {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  replyToMessageId?: string;
  inReplyTo?: string;
  references?: string[];
}

export function createSmtpTransport(config: SmtpConfig): Transporter {
  return createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.username, pass: config.password },
    tls: { rejectUnauthorized: false },
  });
}

export async function sendEmail(config: SmtpConfig, email: OutboundEmail): Promise<{ messageId: string }> {
  const transport = createSmtpTransport(config);
  try {
    const result = await transport.sendMail({
      from: config.from,
      to: email.to,
      subject: email.subject,
      text: email.text,
      html: email.html,
      inReplyTo: email.inReplyTo,
      references: email.references,
    });
    return { messageId: result.messageId ?? "" };
  } finally {
    transport.close();
  }
}
