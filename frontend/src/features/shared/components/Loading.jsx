import React from 'react'

export default function Loading({ message = "AI is analyzing requirements & building strategy..." }) {
  return (
    <div className="app-loader-wrapper">
      <div className="app-loader-card">
        <div className="app-spinner-ring">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        <p className="app-loader-text">{message}</p>
        <span className="app-loader-sub">This usually takes 5-15 seconds</span>
      </div>

      <style>{`
        .app-loader-wrapper {
          position: fixed;
          inset: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          background: rgba(10, 13, 20, 0.75);
          backdrop-filter: blur(8px);
          z-index: 9999;
          animation: fadeIn 0.2s ease-out;
        }

        .app-loader-card {
          background: #111726;
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 32px 40px;
          border-radius: 18px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6);
          max-width: 360px;
          text-align: center;
        }

        .app-spinner-ring {
          display: inline-block;
          position: relative;
          width: 54px;
          height: 54px;
        }

        .app-spinner-ring div {
          box-sizing: border-box;
          display: block;
          position: absolute;
          width: 44px;
          height: 44px;
          margin: 5px;
          border: 4px solid #f43f5e;
          border-radius: 50%;
          animation: ringSpin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
          border-color: #f43f5e transparent transparent transparent;
        }

        .app-spinner-ring div:nth-child(1) { animation-delay: -0.45s; }
        .app-spinner-ring div:nth-child(2) { animation-delay: -0.3s; }
        .app-spinner-ring div:nth-child(3) { animation-delay: -0.15s; }

        .app-loader-text {
          color: #f8fafc;
          font-size: 14px;
          font-weight: 600;
          margin: 0;
          line-height: 1.5;
        }

        .app-loader-sub {
          color: #64748b;
          font-size: 12px;
        }

        @keyframes ringSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}