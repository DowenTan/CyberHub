import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKeyboard, faXmark } from '@fortawesome/free-solid-svg-icons';

export default function KeyboardShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'j', desc: 'Navigate to next assessment in queue' },
    { key: 'k', desc: 'Navigate to previous assessment in queue' },
    { key: 'a', desc: 'Approve selected assessment' },
    { key: 'r', desc: 'Open reject assessment dialog' },
    { key: 'e', desc: 'Toggle inline edit mode' },
    { key: '?', desc: 'Open this keyboard shortcuts cheatsheet' },
    { key: 'Esc', desc: 'Close dialogs or cancel edit' },
  ];

  return (
    <div className="diag-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="diag-modal-box shortcuts-box" onClick={(e) => e.stopPropagation()}>
        <div className="diag-modal-title-row">
          <h3 style={{ margin: 0 }}>
            <FontAwesomeIcon icon={faKeyboard} style={{ marginRight: '8px' }} />
            Keyboard Shortcuts
          </h3>
          <button type="button" className="ch-btn-ghost btn-xs" onClick={onClose} aria-label="Close shortcuts dialog">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="diag-shortcuts-list">
          {shortcuts.map((s, idx) => (
            <div key={idx} className="diag-shortcut-row">
              <kbd className="diag-kbd">{s.key}</kbd>
              <span className="diag-shortcut-desc">{s.desc}</span>
            </div>
          ))}
        </div>

        <div className="diag-modal-actions">
          <button type="button" className="ch-btn-primary btn-sm" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
