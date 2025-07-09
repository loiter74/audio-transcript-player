import React, { useState } from 'react';
import FileUploader from './components/FileUploader';
import Player from './components/Player';

function App() {
  const [files, setFiles] = useState(null);
  
  const handleFilesUploaded = (uploadedFiles) => {
    setFiles(uploadedFiles);
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="py-6 border-b border-gray-200">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-center text-blue-600">音频字幕播放器</h1>
          <p className="text-center text-gray-500 mt-2">同步播放音频和高亮显示字幕文本</p>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {!files ? (
          <FileUploader onFilesUploaded={handleFilesUploaded} />
        ) : (
          <Player 
            audioFile={files.audio}
            srtFile={files.srt}
            txtFile={files.txt}
          />
        )}
      </main>
      
      <footer className="py-6 border-t border-gray-200">
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