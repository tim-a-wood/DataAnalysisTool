import { useEffect, useRef } from 'react';
import { Toggle } from './Toggle';
import { useAppStore } from '../store/useAppStore';
import { getFocusableElements, trapFocus } from '../utils/focusTrap';

interface Props {
  onClose: () => void;
}

export function SettingsModal({ onClose }: Props) {
  const autosaveLayout = useAppStore(s => s.settings.autosaveLayout);
  const setAutosaveLayout = useAppStore(s => s.setAutosaveLayout);
  const resetLayout = useAppStore(s => s.resetLayout);
  const closeRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        previouslyFocused.current?.focus?.();
      }
      if (modalRef.current) {
        const focusable = getFocusableElements(modalRef.current);
        trapFocus(e, focusable);
      }
    };
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
      previouslyFocused.current?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={modalRef} className="modal-box" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <div className="modal-title" id="settings-title">Settings</div>
        <div className="modal-row">
          <span>Theme</span>
          <span className="modal-field-value">Dark only</span>
        </div>
        <div className="modal-row">
          <span>Default X-Axis Variable</span>
          <span className="modal-field-value">Case</span>
        </div>
        <div className="modal-row">
          <span>Autosave Layout</span>
          <Toggle checked={autosaveLayout} onChange={setAutosaveLayout} />
        </div>
        <div className="modal-row">
          <span>Reset Layout to Default</span>
          <button className="btn btn-ghost btn-sm" onClick={() => { resetLayout(); onClose(); }}>Reset</button>
        </div>
        <div className="modal-actions">
          <button ref={closeRef} className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
