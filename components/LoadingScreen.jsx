import { useState, useEffect } from 'react';

/**
 * LoadingScreen: Displays a welcome message, animated progress bar,
 * and dynamic telemetry initialization stages.
 */
export default function LoadingScreen({
  welcomeHeading = 'Welcome to CyberHub Operations Control',
  welcomeSubtitle = 'Field Service Management & Encrypted Dispatch Platform',
  initialProgress = 15,
}) {
  const [progress, setProgress] = useState(initialProgress);
  const [stageIndex, setStageIndex] = useState(0);

  const stages = [
    'Verifying cryptographic credentials...',
    'Establishing encrypted technician dispatch stream...',
    'Synchronizing field orders and inventory telemetry...',
    'Loading diagnostics engine & price models...',
    'System ready. Launching workspace...',
  ];

  useEffect(() => {
    // Smooth progress increment
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 96) return 96; // Hold near 100% until unmounted
        const increment = Math.max(1, Math.floor((100 - prev) / 6));
        return Math.min(prev + increment, 96);
      });
    }, 180);

    // Stage progression
    const stageInterval = setInterval(() => {
      setStageIndex((prev) => (prev < stages.length - 1 ? prev + 1 : prev));
    }, 450);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stageInterval);
    };
  }, [stages.length]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'radial-gradient(ellipse at center, #07153d 0%, #01081f 70%, #000411 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        color: '#ffffff',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        userSelect: 'none',
      }}
    >
      {/* Outer ambient glow */}
      <div
        style={{
          position: 'absolute',
          width: '420px',
          height: '420px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 115, 0, 0.14) 0%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      {/* Center card wrapper */}
      <div
        style={{
          position: 'relative',
          maxWidth: '520px',
          width: '100%',
          background: 'rgba(5, 19, 64, 0.65)',
          border: '1.5px solid rgba(255, 115, 0, 0.35)',
          borderRadius: '18px',
          padding: '36px 32px 30px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85), 0 0 30px rgba(255, 115, 0, 0.2)',
          backdropFilter: 'blur(16px)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Pulsing Logo Avatar */}
        <div
          style={{
            position: 'relative',
            width: '74px',
            height: '74px',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: '-6px',
              borderRadius: '50%',
              border: '2px solid #ff7300',
              boxShadow: '0 0 20px #ff7300, inset 0 0 10px #ff7300',
              animation: 'spinGlow 8s linear infinite',
            }}
          />
          <img
            src="/image/MainLogo.png"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/logo1.png';
            }}
            alt="CyberHub Logo"
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              objectFit: 'cover',
              background: '#040d2d',
              border: '2px solid #00d2d3',
              position: 'relative',
              zIndex: 2,
            }}
          />
        </div>

        {/* Welcome Tag */}
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: '#38bdf8',
            background: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            padding: '3px 12px',
            borderRadius: '20px',
            marginBottom: '12px',
          }}
        >
          Secure Operations Portal
        </span>

        {/* Welcome Heading */}
        <h1
          style={{
            margin: '0 0 8px 0',
            fontSize: '22px',
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-0.3px',
            lineHeight: 1.3,
          }}
        >
          {welcomeHeading}
        </h1>

        {/* Welcome Subtitle */}
        <p
          style={{
            margin: '0 0 26px 0',
            fontSize: '13px',
            color: '#94a3b8',
            lineHeight: 1.5,
            maxWidth: '420px',
          }}
        >
          {welcomeSubtitle}
        </p>

        {/* Progress Bar Container */}
        <div style={{ width: '100%', marginBottom: '14px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
              fontSize: '12px',
            }}
          >
            <span style={{ color: '#cbd5e1', fontWeight: 600 }}>System Initialization</span>
            <span
              style={{
                color: '#ff7300',
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12.5px',
              }}
            >
              {Math.min(progress, 100)}%
            </span>
          </div>

          {/* Progress Bar Track & Fill */}
          <div
            style={{
              width: '100%',
              height: '8px',
              
              borderRadius: '999px',
              overflow: 'hidden',
              border: '1px solid rgba(255, 115, 0, 0.25)',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #ff7300 0%, #ff9f43 50%, #2ed573 100%)',
                borderRadius: '999px',
                boxShadow: '0 0 16px rgba(255, 115, 0, 0.8)',
                transition: 'width 0.25s ease-out',
              }}
            />
          </div>
        </div>

        {/* Dynamic Stage Text */}
        <div
          style={{
            fontSize: '12px',
            color: '#38bdf8',
            fontFamily: "'JetBrains Mono', monospace",
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            minHeight: '20px',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#2ed573',
              boxShadow: '0 0 8px #2ed573',
              display: 'inline-block',
              animation: 'pulseDot 1.4s infinite ease-in-out',
            }}
          />
          <span>{stages[stageIndex]}</span>
        </div>

        {/* Security badge at bottom */}
        <div
          style={{
            marginTop: '22px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '10.5px',
            color: '#64748b',
            letterSpacing: '0.4px',
            textTransform: 'uppercase',
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#2ed573"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>256-Bit Encrypted Dispatch • Telemetry Active</span>
        </div>
      </div>

      <style>{`
        @keyframes spinGlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}
