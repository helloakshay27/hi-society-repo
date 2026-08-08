import React from 'react';

interface InfoIconProps {
  details: React.ReactNode;
  className?: string;
  position?: 'top' | 'bottom';
}

export const InfoIcon: React.FC<InfoIconProps> = ({ details, className = '', position = 'top' }) => {
  const isBottom = position === 'bottom';

  return (
    <div className={`group relative ml-[6px] inline-flex items-center justify-center align-middle overflow-visible ${className}`}>
      <div className="flex h-[16px] w-[16px] cursor-help items-center justify-center rounded-full border border-[#C4B89D] bg-white text-[10px] font-bold italic text-[#798C5E] transition-colors group-hover:border-[#DA7756] group-hover:bg-[#DA7756] group-hover:text-white relative z-10">
        i
      </div>
      <div className={`pointer-events-none absolute left-1/2 z-[1200] -translate-x-1/2 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 ${isBottom ? 'top-[calc(100%+10px)] -translate-y-1' : 'bottom-[calc(100%+10px)] translate-y-1'}`}>
        <div className="w-max max-w-[280px] rounded-[10px] border border-[#C4B89D] bg-white p-3 text-[11px] font-normal leading-[1.5] text-[#2C2C2C] shadow-[0_8px_24px_rgba(44,44,44,0.12)] text-left not-italic whitespace-normal">
          {details}
        </div>
        <div className={`absolute left-1/2 h-[10px] w-[10px] -translate-x-1/2 rotate-45 bg-white ${isBottom ? '-top-[5px] border-t border-l border-[#C4B89D]' : '-bottom-[5px] border-b border-r border-[#C4B89D]'}`}></div>
      </div>
    </div>
  );
};
