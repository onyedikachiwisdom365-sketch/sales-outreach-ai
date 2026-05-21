import OpenAI from "openai";
import { logger } from "./logger";

interface Prospect {
  name: string;
  email: string;
  company?: string | null;
  role?: string | null;
  website?: string | null;
  notes?: string | null;
}

interface GenerateEmailParams {
  prospect: Prospect;
  tone: string;
  context?: string | null;
}

interface GenerateEmailResult {
  subject: string;
  emailBody: string;
}

const openaiBaseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
const openaiApiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;

function buildPrompt({ prospect, tone, context }: GenerateEmailParams): string {
  const prospectDetails = [
    `Name: ${prospect.name}`,
    prospect.company ? `Company: ${prospect.company}` : null,
    prospect.role ? `Role: ${prospect.role}` : null,
    prospect.website ? `Website: ${prospect.website}` : null,
    prospect.notes ? `Notes: ${prospect.notes}` : null,
    context ? `Additional context: ${context}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const toneDescriptions: Record<string, string> = {
    professional: "formal and professional, business-focused",
    friendly: "warm and personable, conversational yet respectful",
    concise: "brief and to the point, no fluff",
    persuasive: "compelling and benefit-driven, with a clear call to action",
  };

  return `You are a skilled SaaS sales rep writing a personalized cold outreach email.

Prospect details:
${prospectDetails}

Tone: ${toneDescriptions[tone] ?? tone}

Write a personalized outreach email for this prospect. Return ONLY a JSON object with two fields:
- "subject": the email subject line (concise, relevant, no clickbait)
- "body": the full email body (plain text, no HTML, include a greeting and sign-off)

Do not include any explanation or markdown. Just the raw JSON object.`;
}

function generateFallbackEmail({ prospect, tone }: GenerateEmailParams): GenerateEmailResult {
  const company = prospect.company ?? "your company";
  const role = prospect.role ?? "your team";
  const name = prospect.name.split(" ")[0];

  const templates: Record<string, GenerateEmailResult> = {
    professional: {
      subject: `Partnership opportunity with ${company}`,
      emailBody: `Hi ${name},

I hope this message finds you well. I came across ${company} and was impressed by what your team is building.

I'm reaching out because I believe our platform could help ${role} at ${company} achieve better results — specifically around [key benefit relevant to their space].

I'd love to schedule a brief 20-minute call to explore whether there's a fit. Would any time next week work for you?

Best regards,
[Your Name]
[Your Company]`,
    },
    friendly: {
      subject: `Quick question for you, ${name}`,
      emailBody: `Hey ${name},

I was checking out ${company} and I have to say — really impressive work!

I wanted to reach out because I think we might be able to help with something your team deals with. Our platform has been helping similar companies in your space save time and grow faster.

Would love to grab a quick chat if you're open to it. No pressure at all — just a friendly conversation!

Cheers,
[Your Name]`,
    },
    concise: {
      subject: `${company} + [Your Company]`,
      emailBody: `Hi ${name},

I help ${role === "your team" ? "teams" : `${role}s`} at SaaS companies like ${company} with [key problem].

Two questions:
1. Is [key challenge] something your team is actively working on?
2. Do you have 15 minutes this week to explore?

Best,
[Your Name]`,
    },
    persuasive: {
      subject: `How ${company} could [achieve specific result]`,
      emailBody: `Hi ${name},

Companies like ${company} are seeing [specific result] after using our platform — typically within the first 30 days.

Here's what makes the difference: [key differentiator that's relevant to their role/company].

I'd love to show you exactly how this would work for ${company}. Can we get 20 minutes on the calendar this week?

Looking forward to connecting,
[Your Name]
[Your Company]`,
    },
  };

  return templates[tone] ?? templates.professional;
}

export async function generateEmailWithAI(params: GenerateEmailParams): Promise<GenerateEmailResult> {
  if (openaiBaseUrl && openaiApiKey) {
    try {
      const client = new OpenAI({
        baseURL: openaiBaseUrl,
        apiKey: openaiApiKey,
      });

      const response = await client.chat.completions.create({
        model: "gpt-5.2",
        max_completion_tokens: 1024,
        messages: [{ role: "user", content: buildPrompt(params) }],
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content.trim()) as { subject: string; body: string };
        return { subject: parsed.subject, emailBody: parsed.body };
      }
    } catch (err) {
      logger.warn({ err }, "AI email generation failed, using fallback template");
    }
  }

  return generateFallbackEmail(params);
}
