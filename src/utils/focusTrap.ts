export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll(selector)) as HTMLElement[];
}

export function trapFocus(e: KeyboardEvent, focusableElements: HTMLElement[]): void {
  if (e.key !== 'Tab' || focusableElements.length === 0) return;

  const activeEl = document.activeElement as HTMLElement;
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  if (e.shiftKey) {
    if (activeEl === firstFocusable) {
      e.preventDefault();
      lastFocusable.focus();
    }
  } else {
    if (activeEl === lastFocusable) {
      e.preventDefault();
      firstFocusable.focus();
    }
  }
}
