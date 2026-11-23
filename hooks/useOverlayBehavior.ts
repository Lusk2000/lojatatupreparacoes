import { useEffect } from 'react';

let activeScrollLockCount = 0;

export const useOverlayBehavior = (isActive: boolean, onClose: () => void) => {
  useEffect(() => {
    if (!isActive) return;

    activeScrollLockCount += 1;
    if (activeScrollLockCount === 1) {
      document.body.style.overflow = 'hidden';
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      activeScrollLockCount = Math.max(0, activeScrollLockCount - 1);
      if (activeScrollLockCount === 0) {
        document.body.style.overflow = '';
      }
    };
  }, [isActive, onClose]);
};
