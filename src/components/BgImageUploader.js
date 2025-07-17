import React, { useRef, useState } from 'react';

const BgImageUploader = ({ bgOpacity, onBgImageChange, onOpacityChange }) => {
  const [showModal, setShowModal] = useState(false);
  const dropRef = useRef();
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  // 拖拽上传
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowModal(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onBgImageChange({ target: { files: [e.dataTransfer.files[0]] } });
    }
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <>
      {isMobile ? (
        <button
          className="w-14 h-14 flex items-center justify-center bg-blue-500 rounded-xl shadow hover:bg-blue-600 focus:outline-none"
          onClick={() => setShowModal(true)}
          type="button"
          style={{padding: 0}}
        >
          {/* 上传图片SVG图标（MIT Bootstrap Icons）*/}
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-upload">
            <rect x="3" y="3" width="18" height="18" rx="4" fill="#3b82f6"/>
            <path d="M12 16V8M8 12l4-4 4 4" stroke="white"/>
            <path d="M8 16h8" stroke="white"/>
          </svg>
        </button>
      ) : (
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600 focus:outline-none text-base md:text-sm"
          onClick={() => setShowModal(true)}
          type="button"
        >
          上传背景图片
        </button>
      )}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg p-8 relative w-full max-w-md mx-auto" ref={dropRef}
            onDrop={!isMobile ? handleDrop : undefined}
            onDragOver={!isMobile ? handleDragOver : undefined}
          >
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl font-bold"
              onClick={() => setShowModal(false)}
              type="button"
            >
              ×
            </button>
            <div
              className={`flex flex-col items-center justify-center h-48 border-2 border-dashed border-blue-400 rounded-lg bg-blue-50 cursor-pointer ${isMobile ? 'py-8' : ''}`}
              onClick={() => dropRef.current.querySelector('input[type=file]').click()}
            >
              <svg className="w-12 h-12 text-blue-400 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" />
              </svg>
              <span className="text-blue-500 text-base md:text-sm">
                {isMobile ? '点击选择图片' : '拖拽图片到此处，或点击选择文件'}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={e => { setShowModal(false); onBgImageChange(e); }}
                className="hidden"
              />
            </div>
            {/* 背景透明度调节 */}
            <div className="mt-6 flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">背景透明度</label>
              <input type="range" min="0" max="1" step="0.01" value={bgOpacity} onChange={onOpacityChange} className="w-32 align-middle accent-blue-500" style={isMobile ? { height: 32 } : {}} />
              <span className="ml-2 text-xs">{Math.round(bgOpacity * 100)}%</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BgImageUploader; 