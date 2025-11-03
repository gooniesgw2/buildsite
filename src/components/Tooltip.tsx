import { useState, useRef, useEffect } from 'react';
import { parseGW2Text } from '../lib/textParser';

interface TooltipProps {
  content: string;
  title: string;
  icon?: string;
  children: React.ReactNode;
  bonuses?: string[]; // For runes/relics - array of bonus strings like "(1): +25 Power"
  rarity?: string; // Item rarity (e.g., "Exotic")
  itemType?: string; // Item type (e.g., "Upgrade Component", "Relic")
}

export default function Tooltip({ content, title, icon, children, bonuses, rarity, itemType }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      // Position below the trigger by default
      let top = triggerRect.bottom + 8;
      let left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);

      // Keep tooltip on screen horizontally
      if (left < 8) left = 8;
      if (left + tooltipRect.width > window.innerWidth - 8) {
        left = window.innerWidth - tooltipRect.width - 8;
      }

      // If tooltip would go off bottom, show above instead
      if (top + tooltipRect.height > window.innerHeight) {
        top = triggerRect.top - tooltipRect.height - 8;
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
          <div className="flex items-start gap-3">
            {icon && (
              <img src={icon} alt="" className="w-14 h-14 rounded flex-shrink-0 border border-gray-700" />
            )}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-orange-400 text-base mb-1">{title}</div>

              {rarity && itemType && (
                <div className="text-xs text-purple-400 mb-2">
                  {rarity} {itemType}
                </div>
              )}

              {bonuses && bonuses.length > 0 && (
                <div className="space-y-0.5 mb-2 text-xs">
                  {bonuses.map((bonus, index) => (
                    <div key={index} className="text-blue-300"
                      dangerouslySetInnerHTML={{ __html: parseGW2Text(bonus) }}
                    />
                  ))}
                </div>
              )}

              {content && (
                <div
                  className="text-sm text-gray-300 leading-relaxed mt-2 pt-2 border-t border-gray-700"
                  dangerouslySetInnerHTML={{ __html: parseGW2Text(content) }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
