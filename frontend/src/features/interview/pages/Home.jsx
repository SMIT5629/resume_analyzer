import React, { useState ,useRef} from 'react'
import "../styles/home.scss"
import { useInterview } from '../hooks/useInterview';
import { useNavigate } from 'react-router';

function Home() {
    const { loading, generateReport,reports} = useInterview()

    const [jobDescription, setJobDescription] = useState("");
    const [selfDescription, setSelfDescription] = useState("");
    const [fileName, setFileName] = useState("");
    const resumeInputRef = useRef()

    const navigate = useNavigate()

    const handleGenerateReport = async ()=>{
        const resumeFile = resumeInputRef.current.files[0]
        const data = await generateReport({jobDescription,selfDescription,resumeFile})
        navigate(`/interview/${data._id}`)

    }

    if (loading) {
        return(
            <main><h1>Loading Your Interview Plan ...</h1></main>
        )
    }
    return (
        <main className='home'>
            <div className="container">
                {/* HEADER */}
                <div className="header">
                    <h1>Create Your Custom <span className="highlight">Interview Plan</span></h1>
                    <p className="subtitle">Let our AI analyze the job requirements and your unique profile to build a winning strategy.</p>
                </div>

                {/* CARD */}
                <div className="card">

                    {/* LEFT PANEL */}
                    <div className="left">
                        <div className="section-header">
                            <span className="icon">📋</span>
                            <h3>Target Job Description</h3>
                            <span className="badge">REQUIRED</span>
                        </div>
                        <textarea
                            placeholder="Paste the full job description here...&#10;e.g. 'Senior Frontend Engineer at Google requires proficiency in React, TypeScript, and large-scale system design...'"
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                        />
                        <p className="char-count">{jobDescription.length} / 5000 chars</p>
                    </div>

                    {/* RIGHT PANEL */}
                    <div className="right">

                        {/* RESUME BOX */}
                        <div className="resume-box">
                            <div className="section-header">
                                <span className="icon">👤</span>
                                <h3>Your Profile</h3>
                                <span className="badge best">BEST RESULTS</span>
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
                                <label htmlFor="resumeUpload" className="upload-label">
                                    <span className="upload-icon">📄</span>
                                    <span className="upload-text">{fileName ? fileName : "Click to upload or drag & drop"}</span>
                                    {!fileName && <span className="upload-hint">PDF or DOCX (Max 5MB)</span>}
                                </label>
                            </div>
                        </div>

                        {/* SELF DESCRIPTION BOX */}
                        <div className="self-box">
                            <h3>Quick Self-Description</h3>
                            <textarea
                                placeholder="Briefly describe your experience, key skills, and years of experience if you don't have a resume handy..."
                                value={selfDescription}
                                onChange={(e) => setSelfDescription(e.target.value)}
                            />
                        </div>

                        {/* INFO BOX */}
                        <div className="info-box">
                            <span className="info-icon">ℹ️</span>
                            <p>Either a <strong>Resume</strong> or a <strong>Self Description</strong> is required to generate a personalized plan.</p>
                        </div>

                        {/* BUTTON */}
                        <button className="generate-btn"
                        onClick={handleGenerateReport}>
                            <span className="star">⭐</span> Generate My Interview Strategy
                        </button>

                    </div>

                </div>  {/* Recent Reports List */}
            {reports.length > 0 && (
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
           
        </main>
    )
}

export default Home