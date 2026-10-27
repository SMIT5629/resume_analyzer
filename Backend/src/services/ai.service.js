const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const puppeteer = require("puppeteer")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})


const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum(["low", "medium", "high"]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.")
    })).describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
})

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {

    const prompt = `Generate an interview report for a candidate with the following details:
Resume: ${resume}
Self Description: ${selfDescription}
Job Description: ${jobDescription}

IMPORTANT: Return ONLY valid JSON object, no markdown, no code blocks, no explanations.`

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(interviewReportSchema),
        }
    })

    // Extract JSON from response, handling markdown code blocks and other formatting
    let jsonText = response.text.trim()

    // Remove markdown code block if present
    if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }

    // Remove any leading markdown headers or text before the JSON object
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
        jsonText = jsonMatch[0]
    }

    return JSON.parse(jsonText)


}



let browser;

// Reuse browser with proper connection check and optimized flags
async function getBrowser() {
    if (!browser || !browser.connected) {
        browser = await puppeteer.launch({
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--no-first-run",
                "--no-zygote"
            ]
        });
    }
    return browser;
}

// Stronger sanitization
function sanitizeHtml(html) {
    if (!html) return "";
    return html
        .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
        .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "")
        .replace(/on\w+="[^"]*"/g, "")
        .replace(/javascript:/gi, "");
}

// Extract HTML or JSON even if model response has formatting
function extractResumeHtml(text) {
    if (!text) return "";

    // 1. If text is already a full HTML document or fragment
    if (text.includes("<!DOCTYPE html>") || text.includes("<html") || (text.includes("<body") && text.includes("</body>"))) {
        const clean = text.replace(/^```(?:html)?\n?/i, "").replace(/\n?```$/i, "");
        return clean;
    }

    // 2. Try parsing as JSON
    try {
        const parsed = JSON.parse(text);
        if (parsed.html) return parsed.html;
    } catch {
        // Try regex match for JSON object
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
            try {
                const parsed = JSON.parse(match[0]);
                if (parsed.html) return parsed.html;
            } catch {
                // Try extracting html property content directly via regex
                const htmlPropMatch = match[0].match(/"html"\s*:\s*"([\s\S]*?)(?:"\s*\}|"$)/);
                if (htmlPropMatch && htmlPropMatch[1]) {
                    // Unescape quotes and newlines
                    return htmlPropMatch[1]
                        .replace(/\\"/g, '"')
                        .replace(/\\n/g, "\n")
                        .replace(/\\t/g, "\t")
                        .replace(/\\\\/g, "\\");
                }
            }
        }
    }

    // 3. Fallback: extract any HTML between tags or strip markdown fences
    const stripped = text.replace(/^```(?:json|html)?\n?/i, "").replace(/\n?```$/i, "");
    if (stripped.includes("<") && stripped.includes(">")) {
        return stripped;
    }

    return "";
}

function buildFallbackResumeHtml({ resume, selfDescription, jobDescription, title }) {
    const candidateInfo = (resume || selfDescription || "Candidate").slice(0, 3000);
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    @page { margin: 15mm; size: A4; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; line-height: 1.5; font-size: 13px; margin: 0; padding: 0; }
    .header { border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 16px; }
    h1 { font-size: 24px; margin: 0 0 4px 0; color: #0f172a; }
    .title { font-size: 15px; color: #0284c7; font-weight: 600; margin-bottom: 6px; }
    .section-title { font-size: 14px; text-transform: uppercase; letter-spacing: 0.8px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin: 16px 0 8px 0; font-weight: 700; }
    p { margin: 0 0 8px 0; }
    .content-box { white-space: pre-wrap; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; font-size: 12px; color: #334155; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title || "Professional Profile"}</h1>
    <div class="title">Tailored Candidate Resume</div>
  </div>
  <div class="section-title">Target Role & Opportunity</div>
  <p><strong>Target Position:</strong> ${title || "Target Role"}</p>
  <div class="section-title">Candidate Profile & Highlights</div>
  <div class="content-box">${candidateInfo}</div>
</body>
</html>`;
}

function ensureCompleteHtmlDocument(html, title) {
    if (!html.includes("<!DOCTYPE html>") && !html.includes("<html")) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title || "Resume"}</title>
  <style>
    @page { margin: 15mm; size: A4; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5; font-size: 13px; margin: 0; padding: 0; }
    h1 { font-size: 22px; color: #0f172a; margin: 0 0 6px 0; }
    h2 { font-size: 14px; color: #0f172a; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px; margin: 14px 0 6px 0; text-transform: uppercase; letter-spacing: 0.5px; }
    h3 { font-size: 13px; color: #334155; margin: 6px 0 2px 0; }
    p { margin: 0 0 6px 0; }
    ul { margin: 4px 0 8px 18px; padding: 0; }
    li { margin-bottom: 3px; }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;
    }
    return html;
}

async function generatePdfFromHtml(htmlContent) {
    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
        await page.setJavaScriptEnabled(false);

        // domcontentloaded prevents getting stuck on external web fonts or unresolvable assets
        await page.setContent(htmlContent, {
            waitUntil: ["domcontentloaded", "load"],
            timeout: 25000
        });

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
                top: "15mm",
                bottom: "15mm",
                left: "15mm",
                right: "15mm"
            }
        });

        return pdfBuffer;

    } finally {
        try {
            if (page && !page.isClosed()) {
                await page.close();
            }
        } catch (closeErr) {
            console.warn("Failed to close puppeteer page:", closeErr.message);
        }
    }
}

async function generateResumePdf({ resume = "", selfDescription = "", jobDescription = "", title = "Tailored Resume" }) {
    const resumePdfSchema = z.object({
        html: z.string().describe("Complete ATS-friendly HTML document with inline CSS styling for the resume")
    });

    const candidateProfile = [
        resume ? `RESUME CONTENT:\n${resume}` : "",
        selfDescription ? `ADDITIONAL PROFILE / SELF-DESCRIPTION:\n${selfDescription}` : ""
    ].filter(Boolean).join("\n\n") || "Candidate profile";

    const prompt = `You are an expert executive resume writer and ATS specialist.
Generate a tailored, ATS-friendly, professional resume in HTML format based on the candidate's profile and target job description.

TARGET JOB DESCRIPTION:
${jobDescription}

CANDIDATE PROFILE:
${candidateProfile}

STRICT INSTRUCTIONS:
1. Return a valid JSON object matching the schema: {"html": "..."}.
2. The HTML must have embedded <style> with clean, elegant ATS formatting:
   - Page margins: A4 size
   - Typography: Clean sans-serif (Arial, Helvetica, sans-serif)
   - Professional sections: Contact info header, Professional Summary, Core Competencies & Skills, Experience (with bullet points highlighting achievements), Projects, Education.
   - Elegant, clean colors: dark navy header (#0f172a), subtle section dividers (#cbd5e1), crisp dark body text (#334155).
3. Do NOT include external script tags or iframes.
`;

    let htmlToRender = "";

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: zodToJsonSchema(resumePdfSchema),
                temperature: 0.2
            }
        });

        const rawText = response.text || "";
        const extractedHtml = extractResumeHtml(rawText);

        if (extractedHtml) {
            htmlToRender = sanitizeHtml(extractedHtml);
        }
    } catch (err) {
        console.warn("[PDF] AI generation warning, falling back to structured template:", err.message);
    }

    if (!htmlToRender) {
        htmlToRender = buildFallbackResumeHtml({ resume, selfDescription, jobDescription, title });
    } else {
        htmlToRender = ensureCompleteHtmlDocument(htmlToRender, title);
    }

    return await generatePdfFromHtml(htmlToRender);
}

module.exports = { generateInterviewReport, generateResumePdf }