import React, { useRef, useEffect } from 'react';

const TranscriptDisplay = ({ transcript, highlightIndex, opacity = 0.95 }) => {
  const containerRef = useRef();
  const paragraphs = transcript ? transcript.split(/\n\s*\n/) : [];

  useEffect(() => {
    if (highlightIndex != null) {
      const el = containerRef.current?.querySelector(`[data-tidx='${highlightIndex}']`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightIndex]);

  // 只让背景透明，字体不透明
  const bgColor = `rgba(255,255,255,${opacity})`;

  return (
    <div
      ref={containerRef}
      className="max-h-[60vh] overflow-y-auto rounded-lg p-6 border border-gray-200 text-base text-gray-800 leading-relaxed shadow-md"
      style={{fontSize: '1.1rem', background: bgColor, color: '#222'}}
    >
      {paragraphs.length === 0 ? (
        <div className="text-gray-400 text-center">暂无正文</div>
      ) : (
        paragraphs.map((para, idx) => (
          <p
            key={idx}
            data-tidx={idx}
            className={`mb-4 transition-colors duration-200 rounded px-2 py-1 ${highlightIndex === idx ? 'bg-yellow-100 border-l-4 border-yellow-400' : ''}`}
          >
            {para}
          </p>
        ))
      )}
    </div>
  );
};

export default TranscriptDisplay; 