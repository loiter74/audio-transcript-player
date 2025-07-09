import React, { useState } from 'react';

const FileUploader = ({ onFilesUploaded }) => {
  const [audioFile, setAudioFile] = useState(null);
  const [srtFile, setSrtFile] = useState(null);
  const [txtFile, setTxtFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (audioFile && srtFile && txtFile) {
      onFilesUploaded({
        audio: audioFile,
        srt: srtFile,
        txt: txtFile
      });
    } else {
      alert('请上传所有必要文件');
    }
  };
  
  const isFormValid = audioFile && srtFile && txtFile;

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-8 transition-shadow hover:shadow-lg">
      <h2 className="text-2xl font-bold text-center text-blue-600 mb-2">上传文件</h2>
      <p className="text-gray-500 text-center mb-6">
        上传音频文件、字幕文件和文字稿，开始同步播放和高亮显示
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            音频文件 (MP3/WAV)
          </label>
          <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 flex justify-center items-center bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="space-y-1 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label htmlFor="audio-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                  <span>选择文件</span>
                  <input 
                    id="audio-upload" 
                    name="audio-upload" 
                    type="file" 
                    className="sr-only"
                    accept=".mp3,.wav" 
                    onChange={(e) => setAudioFile(e.target.files[0])} 
                    required 
                  />
                </label>
                <p className="pl-1">或拖放文件</p>
              </div>
              <p className="text-xs text-gray-500">
                MP3 或 WAV 格式
              </p>
            </div>
          </div>
          {audioFile && (
            <p className="mt-2 text-sm text-green-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              已选择: {audioFile.name}
            </p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            字幕文件 (SRT)
          </label>
          <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 flex justify-center items-center bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="space-y-1 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label htmlFor="srt-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                  <span>选择文件</span>
                  <input 
                    id="srt-upload" 
                    name="srt-upload" 
                    type="file" 
                    className="sr-only"
                    accept=".srt" 
                    onChange={(e) => setSrtFile(e.target.files[0])} 
                    required 
                  />
                </label>
                <p className="pl-1">或拖放文件</p>
              </div>
              <p className="text-xs text-gray-500">
                SRT 字幕文件格式
              </p>
            </div>
          </div>
          {srtFile && (
            <p className="mt-2 text-sm text-green-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              已选择: {srtFile.name}
            </p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            文字稿 (TXT)
          </label>
          <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 flex justify-center items-center bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="space-y-1 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label htmlFor="txt-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                  <span>选择文件</span>
                  <input 
                    id="txt-upload" 
                    name="txt-upload" 
                    type="file" 
                    className="sr-only"
                    accept=".txt" 
                    onChange={(e) => setTxtFile(e.target.files[0])} 
                    required 
                  />
                </label>
                <p className="pl-1">或拖放文件</p>
              </div>
              <p className="text-xs text-gray-500">
                TXT 文本文件格式
              </p>
            </div>
          </div>
          {txtFile && (
            <p className="mt-2 text-sm text-green-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              已选择: {txtFile.name}
            </p>
          )}
        </div>
        
        <button 
          type="submit" 
          disabled={!isFormValid}
          className={`w-full py-3 px-4 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${isFormValid ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}
        >
          开始播放
        </button>
      </form>
    </div>
  );
};

export default FileUploader;