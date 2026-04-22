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

// Reuse browser
async function getBrowser() {
    if (!browser) {
        browser = await puppeteer.launch({
            headless: "new",
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
    }
    return browser;
}

// Stronger sanitization
function sanitizeHtml(html) {
    return html
        .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
        .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "")
        .replace(/on\w+="[^"]*"/g, "")
        .replace(/javascript:/gi, "");
}

// Extract JSON even if model messes up
function extractJson(text) {
    try {
        return JSON.parse(text);
    } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
            return JSON.parse(match[0]);
        }
        throw new Error("No valid JSON found in AI response");
    }
}

async function generatePdfFromHtml(htmlContent) {
    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
        await page.setJavaScriptEnabled(false);

        await page.setContent(htmlContent, {
            waitUntil: "networkidle0",
            timeout: 30000
        });

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
                top: "20mm",
                bottom: "20mm",
                left: "15mm",
                right: "15mm"
            }
        });

        await page.close();
        return pdfBuffer;

    } catch (err) {
        await page.close();
        throw err;
    }
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
    const resumePdfSchema = z.object({
        html: z.string()
    });

    const prompt = `
Generate a professional resume tailored to the job.

Resume: ${resume}
Self Description: ${selfDescription}
Job Description: ${jobDescription}

STRICT RULES:
- Return ONLY JSON
- No markdown
- No explanation
- No backticks
- No scripts
- Inline CSS only

Format:
{
  "html": "<valid ATS-friendly HTML>"
}
`;

    let responseText;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: zodToJsonSchema(resumePdfSchema),
                temperature: 0.3
            }
        });

        responseText = response.text;

    } catch (err) {
        throw new Error("AI request failed: " + err.message);
    }

    let jsonContent;

    try {
        jsonContent = extractJson(responseText);
    } catch (err) {
        console.error("Raw AI output:", responseText);
        throw new Error("Failed to parse AI response");
    }

    if (!jsonContent?.html) {
        throw new Error("Invalid response: missing html");
    }

    const safeHtml = sanitizeHtml(jsonContent.html);

    return await generatePdfFromHtml(safeHtml);
}
module.exports = { generateInterviewReport, generateResumePdf }