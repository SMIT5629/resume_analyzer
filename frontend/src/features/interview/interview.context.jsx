import { createContext, useState} from "react";

export const InterviewContext = createContext();

export const InterviewProvider = ({ children }) => {

    const [report, setReport] = useState(false)
    const [loading, setLoading] = useState(false);
    const [reports, setReports] = useState([])

    return (
        <InterviewContext.Provider value={{ reports,setReports,report,setReport, loading, setLoading }}>
            {children}
        </InterviewContext.Provider>
    );
};