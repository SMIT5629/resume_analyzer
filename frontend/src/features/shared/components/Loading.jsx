export default function Loading() {
  return (
    <div className="loader-wrapper">
      <div className="loader">
        {[...Array(8)].map((_, i) => (
          <span key={i} style={{ "--i": i }}></span>
        ))}
      </div>

      <style jsx>{`
        .loader-wrapper {
          position: fixed;
          inset: 0; /* full screen */
          display: flex;
          justify-content: center;
          align-items: center;
          background: transparent; /* important */
          z-index: 9999;
        }

        .loader {
          position: relative;
          width: 60px;
          height: 60px;
        }

        .loader span {
          position: absolute;
          width: 8px;
          height: 8px;
          background: #555;
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: rotate(calc(45deg * var(--i)))
            translate(25px);
          opacity: 0.2;
          animation: fade 1.2s linear infinite;
          animation-delay: calc(0.15s * var(--i));
        }

        @keyframes fade {
          0% {
            opacity: 1;
          }
          100% {
            opacity: 0.2;
          }
        }
      `}</style>
    </div>
  );
}