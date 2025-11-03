import { useState, useRef, useEffect } from 'react';
import { parseGW2Text } from '../lib/textParser';

interface TooltipProps {
  content: string;
  title: string;
  icon?: string;
  children: React.ReactNode;
}

export default function Tooltip({ content, title, icon, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      let top = triggerRect.bottom + window.scrollY + 8;
      let left = triggerRect.left + window.scrollX + (triggerRect.width / 2) - (tooltipRect.width / 2);

      // Keep tooltip on screen
      if (left < 8) left = 8;
      if (left + tooltipRect.width > window.innerWidth - 8) {
        left = window.innerWidth - tooltipRect.width - 8;
      }

      // If tooltip would go off bottom, show above instead
      if (top + tooltipRect.height > window.innerHeight + window.scrollY) {
        top = triggerRect.top + window.scrollY - tooltipRect.height - 8;
      }

      setPosition({ top, left });
    }
  }, [isVisible]);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="inline-block"
      >
        {children}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-50 max-w-sm bg-gray-900 border-2 border-gray-600 rounded-lg p-3 shadow-2xl"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          <div className="flex items-start gap-2">
            {icon && (
              <img src={icon} alt="" className="w-12 h-12 rounded flex-shrink-0" />
            )}
            <div className="flex-1">
              <div className="font-semibold text-yellow-400 mb-1">{title}</div>
              <div
                className="text-sm text-gray-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: parseGW2Text(content) }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
