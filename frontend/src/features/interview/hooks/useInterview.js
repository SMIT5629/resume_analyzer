import { generateInterviewReport, generateResumePdf, getAllInterviewReports, getInterviewReportById } from "../services/interview.api"
import { useContext, useState } from "react"
import { InterviewContext } from "../interview.context"

export const useInterview = () => {
    const context = useContext(InterviewContext)
    if (!context) {
        throw new Error("UseInterview must be used within an InterviewProvider")
    }

    const { reports, setReports, report, setReport, loading, setLoading } = context

    const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {
        setLoading(true)
        try {
            const response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile })
            setReport(response.interviewReport)
            return response.interviewReport
        } catch (error) {
            console.error("Error generating report:", error)
            throw error
        } finally {
            setLoading(false)
        }
    }

    const getReportById = async (interviewId) => {
        setLoading(true)
        try {
            const response = await getInterviewReportById(interviewId)
            setReport(response.interviewReport)
            return response.interviewReport
        } catch (error) {
            console.error("Error fetching report:", error)
            throw error
        } finally {
            setLoading(false)
        }
    }

    const getReports = async () => {
        setLoading(true)
        try {
            const response = await getAllInterviewReports()
            setReports(response.interviewReports)
            return response.interviewReports
        } catch (error) {
            console.error("Error fetching reports:", error)
            throw error
        } finally {
            setLoading(false)
        }
    }

    const [downloadingResume, setDownloadingResume] = useState(false)

    const getResumePdf = async (interviewReportId, reportTitle) => {
        setDownloadingResume(true)
        try {
            const pdfBlob = await generateResumePdf({ interviewReportId })

            // Validate that we got a valid PDF blob
            if (pdfBlob.type === "application/json" || pdfBlob.size < 300) {
                const text = await pdfBlob.text()
                try {
                    const json = JSON.parse(text)
                    if (json.message) {
                        throw new Error(json.message)
                    }
                } catch {
                    // not json
                }
            }

            const url = window.URL.createObjectURL(new Blob([pdfBlob], { type: "application/pdf" }))
            const link = document.createElement('a')
            link.href = url
            const safeName = reportTitle ? reportTitle.replace(/[^a-zA-Z0-9_-]/g, "_") : `resume_${interviewReportId}`
            link.setAttribute('download', `${safeName}.pdf`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            setTimeout(() => window.URL.revokeObjectURL(url), 1500)
            return true
        } catch (error) {
            console.error("Error downloading resume PDF:", error)
            if (error.response?.data instanceof Blob) {
                try {
                    const text = await error.response.data.text()
                    const parsed = JSON.parse(text)
                    const parsedError = new Error(parsed.message || "Server error while generating PDF")
                    throw parsedError
                } catch (parseErr) {
                    if (parseErr.message && !parseErr.message.includes("JSON")) {
                        throw parseErr
                    }
                }
            }
            throw error
        } finally {
            setDownloadingResume(false)
        }
    }

    return { loading, downloadingResume, report, reports, generateReport, getReportById, getReports, getResumePdf }
}
