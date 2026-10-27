import React, { useState, useEffect } from 'react'
import '../styles/interview.scss'
import { useInterview } from '../hooks/useInterview.js'
import { useParams, useNavigate } from 'react-router'
import Loading from "../../shared/components/Loading"
import { toast } from "react-toastify"

const NAV_ITEMS = [
    {
        id: 'technical',
        label: 'Technical Questions',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
            </svg>
        )
    },
    {
        id: 'behavioral',
        label: 'Behavioral Questions',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
        )
    },
    {
        id: 'roadmap',
        label: 'Prep Road Map',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="3 11 22 2 13 21 11 13 3 11" />
            </svg>
        )
    },
]

// ── Sub-components ────────────────────────────────────────────────────────────
const QuestionCard = ({ item, index }) => {
    const [open, setOpen] = useState(index === 0)
    const [copied, setCopied] = useState(false)

    const handleCopy = (e) => {
        e.stopPropagation()
        navigator.clipboard.writeText(item.answer)
        setCopied(true)
        toast.success("Answer copied to clipboard!")
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className={`q-card ${open ? 'q-card--open' : ''}`}>
            <div className='q-card__header' onClick={() => setOpen(o => !o)}>
                <span className='q-card__index'>Q{index + 1}</span>
                <p className='q-card__question'>{item.question}</p>
                <span className={`q-card__chevron ${open ? 'q-card__chevron--open' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </span>
            </div>
            {open && (
                <div className='q-card__body'>
                    <div className='q-card__section'>
                        <div className='section-tag-row'>
                            <span className='q-card__tag q-card__tag--intention'>Interviewer Intention</span>
                        </div>
                        <p>{item.intention}</p>
                    </div>
                    <div className='q-card__section'>
                        <div className='section-tag-row'>
                            <span className='q-card__tag q-card__tag--answer'>Recommended Model Answer</span>
                            <button className='copy-btn' onClick={handleCopy} title='Copy answer'>
                                {copied ? '✓ Copied' : (
                                    <>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                        Copy Answer
                                    </>
                                )}
                            </button>
                        </div>
                        <p className='model-answer-text'>{item.answer}</p>
                    </div>
                </div>
            )}
        </div>
    )
}

const RoadMapDay = ({ day }) => (
    <div className='roadmap-day'>
        <div className='roadmap-day__header'>
            <span className='roadmap-day__badge'>Day {day.day}</span>
            <h3 className='roadmap-day__focus'>{day.focus}</h3>
        </div>
        <ul className='roadmap-day__tasks'>
            {day.tasks.map((task, i) => (
                <li key={i}>
                    <span className='roadmap-day__bullet' />
                    <span>{task}</span>
                </li>
            ))}
        </ul>
    </div>
)

// ── Main Component ────────────────────────────────────────────────────────────
const Interview = () => {
    const [activeNav, setActiveNav] = useState('technical')
    const { report, getReportById, loading, getResumePdf, downloadingResume } = useInterview()
    const { interviewId } = useParams()
    const navigate = useNavigate()

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        }
    }, [interviewId])

    const handleDownloadResume = async () => {
        if (!interviewId) return
        try {
            toast.info("Generating your tailored ATS resume PDF... Please wait a moment.")
            await getResumePdf(interviewId, report?.title)
            toast.success("Resume PDF downloaded successfully!")
        } catch (error) {
            console.error("Download error:", error)
            toast.error(error.message || "Failed to download resume. Please try again.")
        }
    }

    if (loading || !report) {
        return (
            <Loading />
        )
    }

    const scoreColor =
        report.matchScore >= 80 ? 'score--high' :
            report.matchScore >= 60 ? 'score--mid' : 'score--low'

    const matchLabel =
        report.matchScore >= 80 ? 'High Candidate Fit' :
            report.matchScore >= 60 ? 'Moderate Fit' : 'Requires Preparation'

    return (
        <div className='interview-page'>
            <div className='interview-container'>

                {/* ── Top Bar ── */}
                <div className='interview-topbar'>
                    <button className='back-btn' onClick={() => navigate("/")}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                        Back to Plans
                    </button>

                    <div className='topbar-center'>
                        <span className='topbar-tag'>Role Strategy</span>
                        <h1 className='topbar-title'>{report.title || "Custom Interview Strategy"}</h1>
                    </div>

                    <div className='topbar-meta'>
                        <span className='ready-badge'>
                            <span className='ready-dot'></span>
                            AI Strategy Ready
                        </span>
                    </div>
                </div>

                {/* ── Main Layout ── */}
                <div className='interview-layout'>

                    {/* ── Left Nav ── */}
                    <nav className='interview-nav'>
                        <div className="nav-content">
                            <p className='interview-nav__label'>Report Sections</p>
                            {NAV_ITEMS.map(item => (
                                <button
                                    key={item.id}
                                    className={`interview-nav__item ${activeNav === item.id ? 'interview-nav__item--active' : ''}`}
                                    onClick={() => setActiveNav(item.id)}
                                >
                                    <span className='interview-nav__icon'>{item.icon}</span>
                                    <span>{item.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Download Resume Box */}
                        <div className='nav-download-box'>
                            <div className='download-box-text'>
                                <p className='download-box-title'>Tailored Resume</p>
                                <p className='download-box-sub'>ATS-optimized for this role</p>
                            </div>

                            <button
                                onClick={handleDownloadResume}
                                disabled={downloadingResume}
                                className={`button download-btn ${downloadingResume ? 'is-loading' : ''}`}
                            >
                                {downloadingResume ? (
                                    <>
                                        <span className="spinner-dot"></span>
                                        Generating PDF...
                                    </>
                                ) : (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                            <polyline points="7 10 12 15 17 10"></polyline>
                                            <line x1="12" y1="15" x2="12" y2="3"></line>
                                        </svg>
                                        Download Resume
                                    </>
                                )}
                            </button>
                        </div>
                    </nav>

                    <div className='interview-divider' />

                    {/* ── Center Content ── */}
                    <main className='interview-content'>
                        {activeNav === 'technical' && (
                            <section>
                                <div className='content-header'>
                                    <div>
                                        <h2>Technical Interview Questions</h2>
                                        <p className='content-sub'>Core questions tailored to the position's technical stack</p>
                                    </div>
                                    <span className='content-header__count'>{report.technicalQuestions.length} Questions</span>
                                </div>
                                <div className='q-list'>
                                    {report.technicalQuestions.map((q, i) => (
                                        <QuestionCard key={i} item={q} index={i} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {activeNav === 'behavioral' && (
                            <section>
                                <div className='content-header'>
                                    <div>
                                        <h2>Behavioral & Situational Questions</h2>
                                        <p className='content-sub'>Leadership, conflict resolution, and cultural alignment</p>
                                    </div>
                                    <span className='content-header__count'>{report.behavioralQuestions.length} Questions</span>
                                </div>
                                <div className='q-list'>
                                    {report.behavioralQuestions.map((q, i) => (
                                        <QuestionCard key={i} item={q} index={i} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {activeNav === 'roadmap' && (
                            <section>
                                <div className='content-header'>
                                    <div>
                                        <h2>Preparation Road Map</h2>
                                        <p className='content-sub'>Structured plan to maximize interview readiness</p>
                                    </div>
                                    <span className='content-header__count'>{report.preparationPlan.length}-Day Plan</span>
                                </div>
                                <div className='roadmap-list'>
                                    {report.preparationPlan.map((day) => (
                                        <RoadMapDay key={day.day} day={day} />
                                    ))}
                                </div>
                            </section>
                        )}
                    </main>

                    <div className='interview-divider' />

                    {/* ── Right Sidebar ── */}
                    <aside className='interview-sidebar'>

                        {/* Match Score */}
                        <div className='match-score'>
                            <p className='match-score__label'>Profile Match Score</p>
                            <div className={`match-score__ring ${scoreColor}`}>
                                <div className='match-score__inner'>
                                    <span className='match-score__value'>{report.matchScore}</span>
                                    <span className='match-score__pct'>%</span>
                                </div>
                            </div>
                            <span className={`match-score__badge ${scoreColor}`}>
                                {matchLabel}
                            </span>
                        </div>

                        <div className='sidebar-divider' />

                        {/* Skill Gaps */}
                        <div className='skill-gaps'>
                            <div className='skill-gaps__header'>
                                <p className='skill-gaps__label'>Identified Skill Gaps</p>
                                <span className='skill-gaps__count'>{report.skillGaps.length}</span>
                            </div>
                            <div className='skill-gaps__list'>
                                {report.skillGaps.map((gap, i) => (
                                    <div key={i} className={`skill-tag skill-tag--${gap.severity}`}>
                                        <span className='skill-dot'></span>
                                        <span className='skill-name'>{gap.skill}</span>
                                        <span className='skill-sev'>{gap.severity}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </aside>
                </div>
            </div>
        </div>
    )
}

export default Interview