import React, { useEffect, useRef } from 'react';
import { XIcon } from 'lucide-react';

export const Dialog = ({ isOpen, onClose, title, description, children, maxWidth = "max-w-md" }) => {
  const dialogRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div 
        ref={dialogRef}
        className={`w-full ${maxWidth} bg-[#0e1424] text-slate-100 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden animate-dialog`}
      >
        {/* Header */}
        {(title || description) && (
          <div className="px-6 pt-6 pb-4 flex items-start justify-between border-b border-slate-800/80">
            <div>
              {title && (
                <h3 id="dialog-title" className="text-lg font-bold text-white tracking-tight">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 -mr-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors focus:outline-none cursor-pointer"
              aria-label="Close dialog"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Dialog;
