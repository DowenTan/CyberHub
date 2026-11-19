import { useState, useRef, useEffect } from 'react';

// Curated technical and dispatch reaction GIFs
const CURATED_GIFS = [
  {
    title: 'Thumbs Up / Verified',
    category: 'Status',
    url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif',
  },
  {
    title: 'Work In Progress',
    category: 'Status',
    url: 'https://media.giphy.com/media/unQ3IJU2RG7DO/giphy.gif',
  },
  {
    title: 'Tools Ready',
    category: 'Operations',
    url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
  },
  {
    title: 'Fixed / Perfect',
    category: 'Status',
    url: 'https://media.giphy.com/media/NEvPzZ8bdvtxG/giphy.gif',
  },
  {
    title: 'On The Way / En Route',
    category: 'Operations',
    url: 'https://media.giphy.com/media/26AHPxxnSw1L9T1rW/giphy.gif',
  },
  {
    title: 'Mind Blown / Telemetry',
    category: 'Reactions',
    url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif',
  },
  {
    title: 'Mission Accomplished',
    category: 'Success',
    url: 'https://media.giphy.com/media/xT0GqssRweIhlz209i/giphy.gif',
  },
  {
    title: 'Team High Five',
    category: 'Success',
    url: 'https://media.giphy.com/media/3oEjHV0z8S7WM4MwnK/giphy.gif',
  },
  {
    title: 'Diagnostic Scanning',
    category: 'Technical',
    url: 'https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif',
  },
  {
    title: 'Copy That / Roger',
    category: 'Operations',
    url: 'https://media.giphy.com/media/3o7TKTDnUxE0g2fSE8/giphy.gif',
  },
  {
    title: 'Speed Dispatch / Turbo',
    category: 'Operations',
    url: 'https://media.giphy.com/media/3o7ZeCi0yT2CwUJn56/giphy.gif',
  },
  {
    title: 'Circuit & Hardware',
    category: 'Technical',
    url: 'https://media.giphy.com/media/YQitE4YNQNahy/giphy.gif',
  },
  {
    title: 'Checking Schematics',
    category: 'Technical',
    url: 'https://media.giphy.com/media/d3mlE7uhX8KFgEmY/giphy.gif',
  },
  {
    title: 'Inspection Passed',
    category: 'Success',
    url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
  },
  {
    title: 'Coffee Break / Standby',
    category: 'Reactions',
    url: 'https://media.giphy.com/media/oZEBLugoTNRxS/giphy.gif',
  },
  {
    title: 'Emergency Alarm / Priority',
    category: 'Operations',
    url: 'https://media.giphy.com/media/l41lI4bYmcsPJX9Go/giphy.gif',
  },
  {
    title: 'Precision Calibration',
    category: 'Technical',
    url: 'https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif',
  },
  {
    title: 'Approved / Sign Off',
    category: 'Success',
    url: 'https://media.giphy.com/media/10UeedrT5MIfPG/giphy.gif',
  },
  {
    title: 'Loading System Telemetry',
    category: 'Technical',
    url: 'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif',
  },
  {
    title: 'Victory Dance / Job Done',
    category: 'Success',
    url: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif',
  },
  {
    title: 'Investigating Fault',
    category: 'Technical',
    url: 'https://media.giphy.com/media/l2Je27hnQp0z52s7e/giphy.gif',
  },
  {
    title: 'Parts Delivered',
    category: 'Operations',
    url: 'https://media.giphy.com/media/l0HlHFRbmaZtBRhXG/giphy.gif',
  },
  {
    title: 'Ready for Next Queue',
    category: 'Operations',
    url: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif',
  },
  {
    title: 'All Systems Green',
    category: 'Success',
    url: 'https://media.giphy.com/media/xT5LMHxhOfscxPfIfm/giphy.gif',
  },
  {
    title: 'Super Fast Response',
    category: 'Operations',
    url: 'https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif',
  },
  {
    title: 'Acknowledged / Understood',
    category: 'Operations',
    url: 'https://media.giphy.com/media/xUOxeQax9Pt14yyWti/giphy.gif',
  },
  {
    title: 'Cheering Team',
    category: 'Success',
    url: 'https://media.giphy.com/media/g9582DNuQppxC/giphy.gif',
  },
];

function formatFileSize(bytes) {
  if (!bytes) return '1.2 MB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ChatAttachmentMenu({ onAttach }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showGiphyModal, setShowGiphyModal] = useState(false);
  const [giphySearch, setGiphySearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [customGifUrl, setCustomGifUrl] = useState('');

  const menuRef = useRef(null);
  const docInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleDocChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onAttach({
        type: 'document',
        name: file.name,
        size: formatFileSize(file.size),
        url,
      });
      setIsOpen(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        onAttach({
          type: 'image',
          name: file.name,
          url: reader.result,
        });
        setIsOpen(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onAttach({
        type: 'video',
        name: file.name,
        size: formatFileSize(file.size),
        url,
      });
      setIsOpen(false);
    }
  };

  const handleSelectGif = (gifUrl, title) => {
    onAttach({
      type: 'gif',
      name: title || 'Giphy GIF',
      url: gifUrl,
    });
    setShowGiphyModal(false);
    setIsOpen(false);
  };

  const categories = ['All', 'Operations', 'Technical', 'Status', 'Success', 'Reactions'];

  const filteredGifs = CURATED_GIFS.filter((g) => {
    const q = giphySearch.toLowerCase().trim();
    const matchesSearch =
      !q || g.title.toLowerCase().includes(q) || (g.category && g.category.toLowerCase().includes(q));
    const matchesCategory = selectedCategory === 'All' || g.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      {/* Hidden Native File Inputs */}
      <input
        type="file"
        ref={docInputRef}
        accept=".pdf,.doc,.docx,.txt,.dwg,.dxf,.rtf"
        style={{ display: 'none' }}
        onChange={handleDocChange}
      />
      <input
        type="file"
        ref={photoInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handlePhotoChange}
      />
      <input
        type="file"
        ref={videoInputRef}
        accept="video/*"
        style={{ display: 'none' }}
        onChange={handleVideoChange}
      />

      {/* Main Trigger Button */}
      <button
        type="button"
        title="Attach Job Photo / Schematic"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          background: isOpen ? 'rgba(255, 115, 0, 0.2)' : 'transparent',
          border: isOpen ? '1px solid #ff7300' : '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '8px',
          color: isOpen ? '#ff7300' : '#94a3b8',
          padding: '8px 10px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s ease',
          boxShadow: isOpen ? '0 0 10px rgba(255, 115, 0, 0.35)' : 'none',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </svg>
      </button>

      {/* Upward Dropdown Menu (goes up) */}
      {isOpen && (
        <div
          className="ch-attach-dropdown-up"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 10px)',
            left: 0,
            width: '260px',
            background: '#040d2d',
            border: '1.5px solid #ff7300',
            borderRadius: '10px',
            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.85), 0 0 20px rgba(255, 115, 0, 0.25)',
            zIndex: 9999,
            padding: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
            animation: 'fadeInUp 0.15s ease-out',
          }}
        >
          <div
            style={{
              padding: '6px 8px 4px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#ff7300',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '2px',
            }}
          >
            Attach to Dispatch
          </div>

          {/* 1. Upload Documents */}
          <button
            type="button"
            className="ch-attach-opt-btn"
            onClick={() => docInputRef.current?.click()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 10px',
              background: 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: '#e2e8f0',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(56, 189, 248, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: 'rgba(56, 189, 248, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#fff' }}>Upload Documents</div>
              <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>PDF, DWG schematics & specs</div>
            </div>
          </button>

          {/* 2. Upload Photos */}
          <button
            type="button"
            className="ch-attach-opt-btn"
            onClick={() => photoInputRef.current?.click()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 10px',
              background: 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: '#e2e8f0',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(46, 213, 115, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: 'rgba(46, 213, 115, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2ed573',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#fff' }}>Upload Photos</div>
              <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>Job fault & appliance label images</div>
            </div>
          </button>

          {/* 3. Upload Video */}
          <button
            type="button"
            className="ch-attach-opt-btn"
            onClick={() => videoInputRef.current?.click()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 10px',
              background: 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: '#e2e8f0',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 115, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: 'rgba(255, 115, 0, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ff7300',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#fff' }}>Upload Video</div>
              <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>MP4 inspection & rattle recording</div>
            </div>
          </button>

          {/* 4. Link to Giphy */}
          <button
            type="button"
            className="ch-attach-opt-btn"
            onClick={() => setShowGiphyModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 10px',
              background: 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: '#e2e8f0',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(168, 85, 247, 0.18)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: 'rgba(168, 85, 247, 0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#c084fc',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="4" />
                <path d="M7 9h4v6H7z" />
                <line x1="14" y1="9" x2="18" y2="9" />
                <line x1="16" y1="9" x2="16" y2="15" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#fff' }}>Link to Giphy</div>
              <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>Search & send animated dispatch GIFs</div>
            </div>
          </button>
        </div>
      )}

      {/* Giphy Search & Picker Modal */}
      {showGiphyModal && (
        <div
          className="dispatch-modal-overlay show"
          style={{ zIndex: 100000 }}
          onClick={() => setShowGiphyModal(false)}
        >
          <div
            className="dispatch-modal ch-crud-modal"
            style={{
              maxWidth: '680px',
              width: '95vw',
              maxHeight: '88vh',
              background: '#020b27',
              borderRadius: '14px',
              border: '1.5px solid #ff7300',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(255, 115, 0, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header ch-crud-modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff7300" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="4" />
                  <path d="M7 9h4v6H7z" />
                  <line x1="14" y1="9" x2="18" y2="9" />
                  <line x1="16" y1="9" x2="16" y2="15" />
                </svg>
                Giphy Dispatch Hub
              </h3>
              <button
                type="button"
                className="modal-close ch-crud-modal-close"
                onClick={() => setShowGiphyModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body ch-crud-modal-body" style={{ padding: '14px 16px' }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '12.5px', color: '#94a3b8' }}>
                Pick a reaction GIF below or paste a custom Giphy URL:
              </p>

              <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="ch-input"
                  placeholder="Paste direct Giphy link (e.g. https://media.giphy.com/...)"
                  value={customGifUrl}
                  onChange={(e) => setCustomGifUrl(e.target.value)}
                  style={{ flex: 1, fontSize: '12px' }}
                />
                <button
                  type="button"
                  className="btn-primary"
                  style={{ padding: '0 14px', fontSize: '12px' }}
                  onClick={() => {
                    if (customGifUrl.trim()) {
                      handleSelectGif(customGifUrl.trim(), 'Custom Giphy GIF');
                    }
                  }}
                >
                  Send
                </button>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <input
                  type="text"
                  className="ch-input"
                  placeholder="Filter 25+ curated dispatch GIFs by title or category..."
                  value={giphySearch}
                  onChange={(e) => setGiphySearch(e.target.value)}
                  style={{ fontSize: '12px' }}
                />
              </div>

              {/* Category Pills */}
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  overflowX: 'auto',
                  paddingBottom: '8px',
                  marginBottom: '8px',
                  scrollbarWidth: 'none',
                }}
              >
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '3px 9px',
                      fontSize: '11px',
                      borderRadius: '12px',
                      border: selectedCategory === cat ? '1px solid #ff7300' : '1px solid rgba(255, 255, 255, 0.12)',
                      background: selectedCategory === cat ? 'rgba(255, 115, 0, 0.25)' : 'rgba(5, 19, 64, 0.7)',
                      color: selectedCategory === cat ? '#ff7300' : '#cbd5e1',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      fontWeight: selectedCategory === cat ? 700 : 500,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Curated Grid - Scrollable without reducing GIF size */}
              <div
                className="ch-giphy-scroll-container"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: '12px',
                  maxHeight: '440px',
                  overflowY: 'auto',
                  padding: '4px',
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#ff7300 #01081f',
                }}
              >
                {filteredGifs.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectGif(item.url, item.title)}
                    style={{
                      cursor: 'pointer',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1.5px solid rgba(255, 115, 0, 0.25)',
                      background: '#040d2d',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#ff7300';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 18px rgba(255, 115, 0, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 115, 0, 0.25)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ width: '100%', height: '180px', minHeight: '180px', background: '#01081f' }}>
                      <img
                        src={item.url}
                        alt={item.title}
                        loading="lazy"
                        style={{
                          width: '100%',
                          height: '180px',
                          minHeight: '180px',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    </div>
                    <div
                      style={{
                        padding: '8px 10px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        color: '#f8fafc',
                        background: 'rgba(2, 9, 33, 0.95)',
                        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>{item.title}</span>
                      <span
                        style={{
                          fontSize: '10px',
                          color: '#38bdf8',
                          background: 'rgba(56, 189, 248, 0.12)',
                          padding: '1px 5px',
                          borderRadius: '4px',
                        }}
                      >
                        {item.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Direct link to Giphy.com */}
              <div style={{ marginTop: '14px', textAlign: 'center' }}>
                <a
                  href="https://giphy.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#38bdf8',
                    fontSize: '11.5px',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>Browse millions of GIFs on Giphy.com</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
