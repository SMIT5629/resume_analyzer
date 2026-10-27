const pdfParse = require("pdf-parse")
const { generateInterviewReport, generateResumePdf } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")


//generate report
async function generateInterViewReportController(req, res) {
    try {
        let resumeText = ""

        if (req.file && req.file.buffer) {
            try {
                const parsed = await (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText()
                resumeText = parsed.text || ""
            } catch (err) {
                console.warn("[PDF Parse] PDFParse class failed, attempting fallback:", err.message)
                try {
                    if (typeof pdfParse === "function") {
                        const parsed = await pdfParse(req.file.buffer)
                        resumeText = parsed.text || ""
                    }
                } catch (fallbackErr) {
                    console.error("[PDF Parse] Both parsing methods failed:", fallbackErr.message)
                }
            }
        }

        const { selfDescription = "", jobDescription } = req.body

        if (!jobDescription) {
            return res.status(400).json({
                message: "Job description is required."
            })
        }

        if (!resumeText && !selfDescription) {
            return res.status(400).json({
                message: "Please provide either a resume file or a quick self-description."
            })
        }

        const interViewReportByAi = await generateInterviewReport({
            resume: resumeText,
            selfDescription,
            jobDescription
        })

        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeText,
            selfDescription,
            jobDescription,
            ...interViewReportByAi
        })

        res.status(201).json({
            message: "Interview report generated successfully.",
            interviewReport
        })
    } catch (error) {
        console.error("Report generation error:", error)
        res.status(500).json({
            message: "Failed to generate interview report",
            error: error.message
        })
    }
}

//get report by id
async function getInterviewReportByIdController(req, res) {

    const { interviewId } = req.params

    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    res.status(200).json({
        message: "Interview report fetched successfully.",
        interviewReport
    })
}

//get all reports
async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

    res.status(200).json({
        message: "Interview reports fetched successfully.",
        interviewReports
    })
}

//generate resume pdf
async function generateResumePdfController(req, res) {
    try {
        const { interviewReportId } = req.params;

        if (!interviewReportId) {
            return res.status(400).json({
                message: "interviewReportId is required"
            });
        }

        let interviewReport = await interviewReportModel.findOne({
            _id: interviewReportId,
            user: req.user.id
        });

        if (!interviewReport) {
            interviewReport = await interviewReportModel.findById(interviewReportId);
        }

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            });
        }

        const { resume, jobDescription, selfDescription, title } = interviewReport;

        // Either resume or selfDescription is needed along with jobDescription
        if (!jobDescription || (!resume && !selfDescription)) {
            return res.status(400).json({
                message: "Profile details (resume or self-description) and target job description are required for resume generation"
            });
        }

        console.log("[PDF] Generating resume PDF for interviewReportId:", interviewReportId);

        const pdfBuffer = await generateResumePdf({
            resume: resume || "",
            jobDescription,
            selfDescription: selfDescription || "",
            title: title || "Professional Resume"
        });

        console.log("[PDF] PDF generated successfully, size:", pdfBuffer.length);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="resume_${interviewReportId}.pdf"`);
        res.setHeader("Content-Length", pdfBuffer.length);

        return res.end(pdfBuffer);

    } catch (error) {
        console.error("[PDF] Generation error:", error.message);
        console.error("[PDF] Full error:", error);

        return res.status(500).json({
            message: "Failed to generate PDF. " + (error.message || ""),
            error: error.message,
            stack: process.env.NODE_ENV === "development" ? error.stack : undefined
        });
    }
}

module.exports = { generateInterViewReportController, getInterviewReportByIdController, getAllInterviewReportsController, generateResumePdfController }