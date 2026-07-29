import React from 'react';

interface InfoIconProps {
  details: React.ReactNode;
  className?: string;
}

export const InfoIcon: React.FC<InfoIconProps> = ({ details, className = '' }) => {
  return (
    <div className={`group relative ml-[6px] inline-flex items-center justify-center align-middle ${className}`}>
      <div className="flex h-[16px] w-[16px] cursor-help items-center justify-center rounded-full border border-[#C4B89D] bg-white text-[10px] font-bold italic text-[#798C5E] transition-colors group-hover:border-[#DA7756] group-hover:bg-[#DA7756] group-hover:text-white">
        i
      </div>
      <div className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-[1000] -translate-x-1/2 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 translate-y-1">
        <div className="w-max max-w-[280px] rounded-[10px] border border-[#C4B89D] bg-white p-3 text-[11px] font-normal leading-[1.5] text-[#2C2C2C] shadow-[0_8px_24px_rgba(44,44,44,0.12)] text-left not-italic whitespace-normal">
          {details}
        </div>
        <div className="absolute -bottom-[5px] left-1/2 h-[10px] w-[10px] -translate-x-1/2 rotate-45 border-b border-r border-[#C4B89D] bg-white"></div>
      </div>
    </div>
  );
};
