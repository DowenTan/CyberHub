import { useEffect } from 'react';
import { useTechChatStore } from '../store/useTechChatStore.js';

export default function TechCallOverlay() {
  const {
    activeCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
  } = useTechChatStore();

  // Escape key to end call
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && activeCall) {
        endCall();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeCall, endCall]);

  if (!activeCall) return null;

  const { tech, type, status, duration, isMuted, isVideoOff, isScreenSharing } = activeCall;

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const isVideo = type === 'video';

  return (
    <div
      className="tech-call-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        background: 'rgba(1, 6, 23, 0.92)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '28px 24px 36px',
        color: '#fff',
        fontFamily: 'Inter, system-ui, sans-serif',
        userSelect: 'none',
      }}
    >
      {/* 1. TOP HEADER & TELEMETRY */}
      <div
        style={{
          width: '100%',
          maxWidth: '900px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(5, 19, 64, 0.75)',
          border: '1px solid rgba(255, 115, 0, 0.35)',
          borderRadius: '12px',
          padding: '12px 20px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <img
              src={tech.avatar || '/logo1.png'}
              alt={tech.name}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid #ff7300',
              }}
            />
            <span
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: status === 'connected' ? '#2ed573' : '#ffa502',
                border: '2px solid #051340',
                boxShadow: status === 'connected' ? '0 0 8px #2ed573' : '0 0 8px #ffa502',
              }}
            />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>{tech.name}</span>
              <span
                style={{
                  background: 'rgba(255, 115, 0, 0.2)',
                  color: '#ff7300',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '4px',
                }}
              >
                {tech.code}
              </span>
            </div>
            <div style={{ fontSize: '11.5px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{tech.zone}</span>
              <span>•</span>
              <span style={{ color: '#2ed573' }}>
                Field Channel (Active)
              </span>
            </div>
          </div>
        </div>

        {/* Status / Timer & E2EE badge */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#2ed573' }}>
              [WebRTC DTLS-SRTP E2EE]
            </span>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginTop: '2px', letterSpacing: '0.5px' }}>
            {status === 'calling' ? (
              <span style={{ color: '#ffa502', fontSize: '14px' }}>
                Connecting to peer...
              </span>
            ) : (
              formatTimer(duration)
            )}
          </div>
        </div>
      </div>

      {/* 2. MAIN CALL STAGE (VIDEO or AUDIO) */}
      <div
        style={{
          flex: 1,
          width: '100%',
          maxWidth: '900px',
          margin: '20px 0',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #020921 0%, #010617 100%)',
          borderRadius: '16px',
          border: '1.5px solid rgba(56, 189, 248, 0.25)',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
        }}
      >
        {isVideo ? (
          // VIDEO CALL FEED
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <div
              style={{
                width: '100%',
                height: '100%',
                minHeight: '380px',
                background: 'radial-gradient(circle at center, #071644 0%, #020b27 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0.15,
                  backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />

              {/* Technician video avatar / simulation */}
              <div
                style={{
                  position: 'relative',
                  width: '130px',
                  height: '130px',
                  borderRadius: '50%',
                  border: '3px solid #38bdf8',
                  boxShadow: '0 0 35px rgba(56, 189, 248, 0.5)',
                  overflow: 'hidden',
                  zIndex: 2,
                }}
              >
                <img
                  src={tech.avatar || '/logo1.png'}
                  alt={tech.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <div style={{ marginTop: '16px', textAlign: 'center', zIndex: 2 }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
                  {tech.name}
                </div>
                <div style={{ fontSize: '12px', color: '#38bdf8', marginTop: '4px' }}>
                  Live Field Camera Feed • 1080p 60fps
                </div>
              </div>

              {/* Video telemetry HUD overlay */}
              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  background: 'rgba(2, 11, 39, 0.8)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '11px',
                  color: '#cbd5e1',
                  zIndex: 5,
                }}
              >
                <div>SIGNAL: <span style={{ color: '#2ed573' }}>EXCELLENT (5G 92ms)</span></div>
                <div>CODEC: <span style={{ color: '#38bdf8' }}>VP9 / OPUS 48kHz</span></div>
                <div>DEVICE: <span style={{ color: '#ff7300' }}>Field Terminal (Mobile)</span></div>
              </div>

              {/* Dispatcher Picture-In-Picture thumbnail */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '16px',
                  right: '16px',
                  width: '130px',
                  height: '90px',
                  background: isVideoOff ? '#020b27' : '#0a1d56',
                  border: '2px solid #ff7300',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
                  zIndex: 5,
                }}
              >
                {isVideoOff ? (
                  <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>Camera Off</span>
                ) : (
                  <div style={{ textAlign: 'center', color: '#e2e8f0', fontSize: '11px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 2px' }}>
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <div>Dispatcher Cam</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // AUDIO CALL SCREEN
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '18px',
              padding: '40px 20px',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                border: '3px solid #ff7300',
                boxShadow: status === 'connected'
                  ? '0 0 45px rgba(255, 115, 0, 0.5), 0 0 80px rgba(46, 213, 115, 0.25)'
                  : '0 0 25px rgba(255, 115, 0, 0.3)',
                overflow: 'hidden',
              }}
            >
              <img
                src={tech.avatar || '/logo1.png'}
                alt={tech.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>{tech.name}</div>
              <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
                {status === 'calling' ? 'Ringing mobile peer device...' : 'Voice Radio Channel Connected'}
              </div>
            </div>

            {/* Audio visualizer bars */}
            {status === 'connected' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '36px', marginTop: '8px' }}>
                {[14, 26, 18, 34, 22, 12, 28, 32, 16, 24, 30, 20, 15].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      width: '4px',
                      height: `${h}px`,
                      background: 'linear-gradient(180deg, #ff7300, #38bdf8)',
                      borderRadius: '2px',
                      animation: `typingPulse 0.9s infinite ease-in-out ${i * 0.08}s`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. CALL ACTION CONTROLS (CLEAN SVG ICONS) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '18px',
          background: 'rgba(5, 19, 64, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '12px 28px',
          borderRadius: '40px',
          boxShadow: '0 12px 35px rgba(0, 0, 0, 0.75)',
        }}
      >
        {/* Mute Mic */}
        <button
          type="button"
          onClick={toggleMute}
          title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: isMuted ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.08)',
            border: isMuted ? '2px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.2)',
            color: isMuted ? '#ef4444' : '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
        >
          {isMuted ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          )}
        </button>

        {/* Video Toggle (if Video call) */}
        {isVideo && (
          <button
            type="button"
            onClick={toggleVideo}
            title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: isVideoOff ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.08)',
              border: isVideoOff ? '2px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.2)',
              color: isVideoOff ? '#ef4444' : '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
          >
            {isVideoOff ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1" />
                <line x1="2" y1="2" x2="22" y2="22" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            )}
          </button>
        )}

        {/* Screen Share */}
        <button
          type="button"
          onClick={toggleScreenShare}
          title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen to Technician'}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: isScreenSharing ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.08)',
            border: isScreenSharing ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.2)',
            color: isScreenSharing ? '#38bdf8' : '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        </button>

        {/* End Call Button */}
        <button
          type="button"
          onClick={endCall}
          title="End Call (Esc)"
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.6)',
            transition: 'transform 0.1s ease',
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.92)'; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(135deg)' }}>
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
