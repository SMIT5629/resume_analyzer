import React, { useState ,useRef,useEffect} from 'react'
import "../styles/home.scss"
import { useInterview } from '../hooks/useInterview';
import { useNavigate } from 'react-router';
import Loading from "../../shared/components/Loading";
import { useAuth } from "../../auth/hooks/useAuth.js";

function Home() {
    const { loading, generateReport,reports,getReports} = useInterview()

    const { handleLogout } = useAuth();

    const [jobDescription, setJobDescription] = useState("");
    const [selfDescription, setSelfDescription] = useState("");
    const [fileName, setFileName] = useState("");
    const resumeInputRef = useRef()

    const navigate = useNavigate()
    useEffect(() => {
        getReports()
    }, []) 

    const handleClearFile = (e) => {
        e.stopPropagation()
        e.preventDefault()
        setFileName("")
        if (resumeInputRef.current) resumeInputRef.current.value = ""
    }

    const handleGenerateReport = async () => {
        if (!jobDescription.trim()) {
            toast.error("Please provide the target job description.")
            return
        }
        const resumeFile = resumeInputRef.current?.files?.[0]
        if (!resumeFile && !selfDescription.trim()) {
            toast.error("Please upload a resume or provide a quick self-description.")
            return
        }
        try {
            const data = await generateReport({ jobDescription, selfDescription, resumeFile })
            navigate(`/interview/${data._id}`)
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || "Failed to generate interview strategy")
        }
    }

    if (loading) {
        return (
            <Loading />
        )
    }

    return (
        <main className='home'>
            <div className="container">
                <div className="header">
                    <div className="header-content">
                        <div className="header-pill">
                            <span className="pill-dot"></span>
                            AI Career Intelligence & ATS Resume Studio
                        </div>
                        <h1>
                            Build Your Custom <span className="highlight">Interview Strategy</span>
                        </h1>
                        <p className="subtitle">
                            Analyze target job descriptions against your experience to generate custom technical prep, behavioral guides, and tailored ATS resumes.
                        </p>
                    </div>

                    <button className="logout-btn" onClick={handleLogout}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                        Logout
                    </button>
                </div>

                {/* CARD */}
                <div className="card">

                    {/* LEFT PANEL */}
                    <div className="left">
                        <div className="section-header">
                            <span className="icon">📋</span>
                            <div>
                                <h3>Target Job Description</h3>
                                <p className="section-sub">Paste the position requirements and role expectations</p>
                            </div>
                            <span className="badge required">REQUIRED</span>
                        </div>
                        <textarea
                            placeholder="Paste the full job description here...&#10;e.g. 'Senior Full Stack Engineer: Experience with React, Node.js, distributed databases, cloud architecture, and cross-functional leadership...'"
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                        />
                        <div className="char-count-row">
                            <span className="char-hint">More detail yields more tailored interview questions</span>
                            <span className="char-count">{jobDescription.length} / 5000 chars</span>
                        </div>
                    </div>

                    {/* RIGHT PANEL */}
                    <div className="right">

                        {/* RESUME BOX */}
                        <div className="resume-box">
                            <div className="section-header">
                                <span className="icon">📄</span>
                                <div>
                                    <h3>Upload Resume</h3>
                                    <p className="section-sub">Upload your latest PDF or DOCX</p>
                                </div>
                                <span className="badge best">RECOMMENDED</span>
                            </div>

                            <div className="upload-area">
                                <input
                                    ref={resumeInputRef}
                                    id="resumeUpload"
                                    type="file"
                                    accept=".pdf,.docx"
                                    hidden
                                    onChange={(e) => setFileName(e.target.files[0]?.name || "")}
                                />
                                <label htmlFor="resumeUpload" className={`upload-label ${fileName ? 'has-file' : ''}`}>
                                    {fileName ? (
                                        <div className="file-selected-box">
                                            <span className="file-badge">✓ PDF Uploaded</span>
                                            <span className="upload-text file-name">{fileName}</span>
                                            <button type="button" className="clear-file-btn" onClick={handleClearFile}>
                                                Change File
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="upload-icon">
                                                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                            </span>
                                            <span className="upload-text">Click or drag resume here</span>
                                            <span className="upload-hint">PDF or DOCX (Max 5MB)</span>
                                        </>
                                    )}
                                </label>
                            </div>
                        </div>

                        {/* SELF DESCRIPTION BOX */}
                        <div className="self-box">
                            <div className="section-header">
                                <span className="icon">✍️</span>
                                <div>
                                    <h3>Quick Self-Description</h3>
                                    <p className="section-sub">Optional context or summary</p>
                                </div>
                            </div>
                            <textarea
                                placeholder="Briefly summarize your experience, top achievements, or skills (especially if not uploading a resume)..."
                                value={selfDescription}
                                onChange={(e) => setSelfDescription(e.target.value)}
                            />
                        </div>

                        {/* INFO BOX */}
                        <div className="info-box">
                            <span className="info-icon">💡</span>
                            <p>Either a <strong>Resume</strong> or <strong>Self Description</strong> is needed to build your custom strategy.</p>
                        </div>

                        {/* BUTTON */}
                        <button className="generate-btn" onClick={handleGenerateReport}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6z"/></svg>
                            Generate Interview Strategy
                        </button>

                    </div>
                </div>  

                {/* Recent Reports List */}
                <div className="reports-container">  {reports.length > 0 && (
                <section className='recent-reports'>
                    <h2>My Recent Interview Plans</h2>
                    <ul className='reports-list'>
                        {reports.map(report => (
                            <li key={report._id} className='report-item' onClick={() => navigate(`/interview/${report._id}`)}>
                                <h3>{report.title || 'Untitled Position'}</h3>
                                <p className='report-meta'>Generated on {new Date(report.createdAt).toLocaleDateString()}</p>
                                <p className={`match-score ${report.matchScore >= 80 ? 'score--high' : report.matchScore >= 60 ? 'score--mid' : 'score--low'}`}>Match Score: {report.matchScore}%</p>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
            </div>
          <footer className="home-footer">
  <div className="footer-content">
    <p>© {new Date().getFullYear()} Interview AI</p>
    <div className="footer-links">
      <span>Privacy</span>
      <span>Terms</span>
      <span>Contact</span>
    </div>
  </div>
</footer>
            </div>
           
        </main>
    )
}

export default Home