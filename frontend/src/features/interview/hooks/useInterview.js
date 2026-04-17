import { generateInterviewReport, generateResumePdf, getAllInterviewReports, getInterviewReportById } from "../services/interview.api"
import { useContext } from "react"
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

    const getResumePdf = async (interviewReportId) => {
        try {
            const pdfBlob = await generateResumePdf({ interviewReportId })
            // Create a blob URL and trigger download
            const url = window.URL.createObjectURL(pdfBlob)
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `resume_${interviewReportId}.pdf`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error("Error downloading resume PDF:", error)
            throw error
        }
    }

    return { loading, report, reports, generateReport, getReportById, getReports, getResumePdf }
}
