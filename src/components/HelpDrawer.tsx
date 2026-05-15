import { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, ChevronRight } from 'lucide-react';
import { helpSections } from '../config/helpContent';
import { getFocusableElements, trapFocus } from '../utils/focusTrap';

interface Props {
  onClose: () => void;
}

export function HelpDrawer({ onClose }: Props) {
  const [openSections, setOpenSections] = useState<Set<number>>(new Set([0]));
  const closeRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
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
      if (drawerRef.current) {
        const focusable = getFocusableElements(drawerRef.current);
        trapFocus(e, focusable);
      }
    };
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
      previouslyFocused.current?.focus?.();
    };
  }, [onClose]);

  const toggle = (i: number) => setOpenSections(prev => {
    const n = new Set(prev);
    n.has(i) ? n.delete(i) : n.add(i);
    return n;
  });

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div ref={drawerRef} className="drawer" role="dialog" aria-modal="true" aria-label="SignalLite Help">
        <div className="drawer-header">
          <span className="drawer-title">SignalLite Help</span>
          <button ref={closeRef} className="btn btn-icon" onClick={onClose} aria-label="Close help">
            <X size={15} />
          </button>
        </div>
        <div className="drawer-body">
          {helpSections.map((sec, i) => (
            <div key={i} className="help-section">
              <button className="help-section-btn" onClick={() => toggle(i)} aria-expanded={openSections.has(i)}>
                {sec.title}
                {openSections.has(i) ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </button>
              {openSections.has(i) && <div className="help-section-body">{sec.body}</div>}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
