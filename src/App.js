import React, { useState } from 'react';
import FileUploader from './components/FileUploader';
import SubtitleDisplay from './components/SubtitleDisplay';
import TranscriptDisplay from './components/TranscriptDisplay';
import AudioControls from './components/AudioControls';
import BgImageUploader from './components/BgImageUploader';
import AudioPlayer from './components/AudioPlayer';
import { useEffect } from 'react';

const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [files, setFiles] = useState(null);
  // 新增：背景图片和透明度
  const [bgImage, setBgImage] = useState(null);
  const [bgOpacity, setBgOpacity] = useState(0.1); // 默认10%透明度
  const [debugLog, setDebugLog] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [highlightIndex, setHighlightIndex] = useState(null);
  const [transcriptOpacity, setTranscriptOpacity] = useState(0.2);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [showFloat, setShowFloat] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); // 安卓端三条杠菜单

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  const handleFilesUploaded = (uploadedFiles) => {
    setFiles(uploadedFiles);
    if (uploadedFiles.debugLog) {
      setDebugLog(uploadedFiles.debugLog);
    }
  };

  // 新增：处理背景图片上传
  const handleBgImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setBgImage(url);
    }
  };

  // 新增：处理透明度调整
  const handleOpacityChange = (e) => {
    setBgOpacity(Number(e.target.value));
  };

  // 自动高亮正文段落
  const handleActiveParagraphChange = (currentTime) => {
    if (!files || !files.srt || !files.txt) return;
    // 解析srt，找到当前时间对应的字幕
    const srtContent = files.srt.content;
    if (!srtContent) return;
    // 简单SRT解析（只支持常规格式）
    const srtBlocks = srtContent.split(/\n\s*\n/);
    let activeText = '';
    for (let block of srtBlocks) {
      const lines = block.split(/\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length >= 3) {
        const timeLine = lines[1];
        const textLine = lines.slice(2).join(' ');
        const match = timeLine.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
        if (match) {
          const start = parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]) + parseInt(match[4]) / 1000;
          const end = parseInt(match[5]) * 3600 + parseInt(match[6]) * 60 + parseInt(match[7]) + parseInt(match[8]) / 1000;
          if (currentTime >= start && currentTime <= end) {
            activeText = textLine;
            break;
          }
        }
      }
    }
    if (activeText) {
      const paragraphs = (files.txt.content || '').split(/\n\s*\n/);
      const idx = paragraphs.findIndex(p => p.includes(activeText.trim()));
      if (idx !== -1) {
        setHighlightIndex(idx);
      }
    }
  };

  return (
    <>
      {/* 背景图片始终在所有内容下方 */}
      {bgImage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 0,
            pointerEvents: 'none',
            backgroundImage: `url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: bgOpacity,
            transition: 'opacity 0.3s',
          }}
        />
      )}
      {/* 控制面板 */}
      <header className="py-6 w-full bg-transparent" style={{position: 'relative', zIndex: 1}}>
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-center text-blue-600">音频字幕播放器</h1>
          <p className="text-center text-gray-500 mt-2">同步播放音频和高亮显示字幕文本</p>
        </div>
      </header>
      <main className="container mx-auto px-2 py-4 flex-1 w-full flex flex-col items-center" style={{position: 'relative', zIndex: 1}}>
        {!files ? (
          <FileUploader onFilesUploaded={handleFilesUploaded} />
        ) : (
          <>
            {/* 音频播放控件 */}
            <div className={`w-full ${isMobile ? 'max-w-full px-1' : 'max-w-4xl mx-auto'}`}>
              <AudioControls
                audioFile={files.audio}
                currentTime={currentTime}
                setCurrentTime={setCurrentTime}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                duration={duration}
                setDuration={setDuration}
                onActiveParagraphChange={handleActiveParagraphChange}
              />
            </div>
            {/* 正文显示区（确保所有端都渲染且不被遮挡） */}
            <div className="w-full max-w-4xl mx-auto mt-2" style={{zIndex: 2, position: 'relative', background: 'none'}}>
              <div className="flex items-center gap-4 mb-2">
                <label className="text-sm font-medium text-gray-700">
                  正文背景透明度
                  <input type="range" min="0.1" max="1" step="0.01" value={transcriptOpacity} onChange={e => setTranscriptOpacity(Number(e.target.value))} className="w-32 ml-2 align-middle accent-blue-500" />
                  <span className="ml-2 text-xs">{Math.round(transcriptOpacity * 100)}%</span>
                </label>
              </div>
              <TranscriptDisplay
                transcript={files.txt?.content}
                highlightIndex={highlightIndex}
                opacity={transcriptOpacity}
              />
            </div>
            {/* 悬浮字幕与右上角操作区 */}
            {isMobile ? (
              <>
                <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
                  {/* 三条杠菜单按钮 */}
                  <button
                    className="w-14 h-14 flex items-center justify-center rounded-full shadow bg-white/80 hover:bg-gray-200 focus:outline-none"
                    onClick={() => setMenuOpen(v => !v)}
                    title="设置"
                    type="button"
                  >
                    {/* 三条杠SVG */}
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="4" y1="6" x2="20" y2="6" />
                      <line x1="4" y1="12" x2="20" y2="12" />
                      <line x1="4" y1="18" x2="20" y2="18" />
                    </svg>
                  </button>
                </div>
                {/* 抽屉菜单 */}
                {menuOpen && (
                  <div className="fixed top-0 right-0 w-64 h-full bg-white dark:bg-[#23272f] shadow-2xl z-[9999] flex flex-col p-6 animate-slideIn" style={{transition: 'right 0.2s'}}>
                    <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold" onClick={() => setMenuOpen(false)} type="button">×</button>
                    <div className="flex flex-col gap-6 mt-10">
                      {/* 上传背景图片 */}
                      <BgImageUploader
                        bgOpacity={bgOpacity}
                        onBgImageChange={handleBgImageChange}
                        onOpacityChange={handleOpacityChange}
                      />
                      {/* 悬浮字幕显示/隐藏 */}
                      <button
                        className={`w-full py-3 flex items-center justify-center rounded-lg shadow text-base font-medium focus:outline-none transition-colors ${showFloat ? 'bg-blue-600 text-white' : 'bg-gray-200 text-blue-600'}`}
                        onClick={() => setShowFloat(v => !v)}
                        type="button"
                      >
                        {showFloat ? '隐藏悬浮字幕' : '显示悬浮字幕'}
                      </button>
                      {/* 夜间模式切换 */}
                      <button
                        className={`w-full py-3 flex items-center justify-center rounded-lg shadow text-base font-medium focus:outline-none transition-colors ${darkMode ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-blue-600'}`}
                        onClick={() => setDarkMode(v => !v)}
                        type="button"
                      >
                        {darkMode ? '切换为日间模式' : '切换为夜间模式'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
                <BgImageUploader
                  bgOpacity={bgOpacity}
                  onBgImageChange={handleBgImageChange}
                  onOpacityChange={handleOpacityChange}
                />
                {/* 悬浮字幕显示/隐藏按钮 */}
                <button
                  className={`w-14 h-14 flex items-center justify-center rounded-full shadow focus:outline-none transition-colors ${showFloat ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-blue-600'}`}
                  onClick={() => setShowFloat(v => !v)}
                  title={showFloat ? '隐藏悬浮字幕' : '显示悬浮字幕'}
                  type="button"
                >
                  {showFloat ? (
                    // 睁开眼睛SVG
                    <svg width="32" height="32" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8z" fill="white" stroke="#2563eb" strokeWidth="1.5"/>
                      <circle cx="8" cy="8" r="3" fill="#2563eb"/>
                      <circle cx="8" cy="8" r="1.5" fill="white"/>
                    </svg>
                  ) : (
                    // 闭合眼睛SVG
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" fill="white" stroke="#2563eb" strokeWidth="1.5"/>
                      <path d="M4 4l16 16" stroke="#2563eb" strokeWidth="2"/>
                    </svg>
                  )}
                </button>
                {/* 夜间模式切换按钮 */}
                <button
                  className={`w-14 h-14 flex items-center justify-center rounded-full shadow focus:outline-none transition-colors ${darkMode ? 'bg-yellow-400 hover:bg-yellow-500' : 'bg-gray-200 hover:bg-gray-300'}`}
                  onClick={() => setDarkMode(v => !v)}
                  title={darkMode ? '切换为日间模式' : '切换为夜间模式'}
                  type="button"
                >
                  {darkMode ? (
                    // 太阳图标
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e42" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" fill="#fbbf24"/><g stroke="#f59e42"><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></g></svg>
                  ) : (
                    // 月亮图标
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" fill="#2563eb"/></svg>
                  )}
                </button>
              </div>
            )}
            {/* 悬浮字幕浮窗 */}
            <SubtitleDisplay
              audioFile={files.audio}
              srtFile={files.srt}
              txtFile={files.txt}
              currentTime={currentTime}
              setCurrentTime={setCurrentTime}
              bgImage={bgImage}
              bgOpacity={bgOpacity}
              onBgImageChange={handleBgImageChange}
              onOpacityChange={handleOpacityChange}
              setHighlightIndex={setHighlightIndex}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
              duration={duration}
              setDuration={setDuration}
              showFloat={showFloat}
              setShowFloat={setShowFloat}
            />
          </>
        )}
      </main>
      <footer className="py-6 border-t border-gray-200 w-full bg-white/80" style={{position: 'absolute', left: 0, bottom: 0, zIndex: 1}}>
        <div className="container mx-auto px-4">
          <p className="text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} 音频字幕播放器 | 简单、高效的音频文字同步工具
          </p>
        </div>
      </footer>
    </>
  );
}

export default App;