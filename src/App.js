import React, { useState } from 'react';
import FileUploader from './components/FileUploader';
import SubtitleDisplay from './components/SubtitleDisplay';
import TranscriptDisplay from './components/TranscriptDisplay';
import AudioControls from './components/AudioControls';
import BgImageUploader from './components/BgImageUploader';

function App() {
  const [files, setFiles] = useState(null);
  // 新增：背景图片和透明度
  const [bgImage, setBgImage] = useState(null);
  const [bgOpacity, setBgOpacity] = useState(0.5); // 默认透明度
  const [debugLog, setDebugLog] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [highlightIndex, setHighlightIndex] = useState(null);
  const [transcriptOpacity, setTranscriptOpacity] = useState(0.2);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [showFloat, setShowFloat] = useState(true);

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
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* 全屏背景图片 */}
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
      <header className="py-6 border-b border-gray-200 relative z-10">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-center text-blue-600">音频字幕播放器</h1>
          <p className="text-center text-gray-500 mt-2">同步播放音频和高亮显示字幕文本</p>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 relative z-10">
        {!files ? (
          <FileUploader onFilesUploaded={handleFilesUploaded} />
        ) : (
          <>
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
              debugLog={debugLog}
              setHighlightIndex={setHighlightIndex}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
              duration={duration}
              setDuration={setDuration}
              showFloat={showFloat}
              setShowFloat={setShowFloat}
            />
            <div className="flex items-center gap-4 mb-2">
              <label className="text-sm font-medium text-gray-700">正文透明度
                <input type="range" min="0.2" max="1" step="0.01" value={transcriptOpacity} onChange={e => setTranscriptOpacity(Number(e.target.value))} className="w-32 ml-2 align-middle accent-blue-500" />
                <span className="ml-2 text-xs">{Math.round(transcriptOpacity * 100)}%</span>
              </label>
            </div>
            <div className="mt-2">
              <TranscriptDisplay
                transcript={files.txt?.content}
                highlightIndex={highlightIndex}
                opacity={transcriptOpacity}
              />
            </div>
          </>
        )}
      </main>
      <footer className="py-6 border-t border-gray-200 relative z-10">
        <div className="container mx-auto px-4">
          <p className="text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} 音频字幕播放器 | 简单、高效的音频文字同步工具
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;