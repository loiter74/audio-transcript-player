import React, { useState, useEffect, useRef } from 'react';
import { parseAndEnhanceSRT, findSubtitleIssues } from '../utils/enhancedSrtParser';
import ReactMarkdown from 'react-markdown';

const SubtitleDisplay = ({ srtFile, txtFile, currentTime, onSeek }) => {
  const [subtitles, setSubtitles] = useState([]);
  const [transcript, setTranscript] = useState('');
  const [activeSubtitle, setActiveSubtitle] = useState(null);
  const [fontSize, setFontSize] = useState(16);
  const [issues, setIssues] = useState([]);
  const [showIssues, setShowIssues] = useState(false);
  const transcriptRef = useRef(null);
  const nearbySubtitlesRef = useRef(null);
  const [highlightedTranscript, setHighlightedTranscript] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  
  // 加载并解析 SRT 文件
  useEffect(() => {
    if (srtFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        const enhancedSubtitles = parseAndEnhanceSRT(content);
        
        // 移除字幕中的逗号和句号
        const processedSubtitles = enhancedSubtitles.map(sub => ({
          ...sub,
          text: sub.text.replace(/[,\.]/g, '')
        }));
        
        setSubtitles(processedSubtitles);
        
        // 查找字幕中的潜在问题
        const subtitleIssues = findSubtitleIssues(processedSubtitles);
        setIssues(subtitleIssues);
      };
      reader.readAsText(srtFile);
    }
  }, [srtFile]);
  
  // 加载文字稿
  useEffect(() => {
    if (txtFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setTranscript(e.target.result);
        setHighlightedTranscript(e.target.result);
      };
      reader.readAsText(txtFile);
    }
  }, [txtFile]);
  
  // 根据当前时间更新活跃字幕
  useEffect(() => {
    if (subtitles.length > 0 && currentTime > 0) {
      const active = subtitles.find(
        sub => currentTime >= sub.start && currentTime <= sub.end
      );
      
      setActiveSubtitle(active);
      
      // 如果找到活跃字幕，在文字稿中高亮显示
      if (active && transcript) {
        const textToHighlight = active.text;
        const highlighted = highlightText(transcript, textToHighlight);
        setHighlightedTranscript(highlighted);
        
        // 滚动到高亮位置
        setTimeout(() => {
          const highlightElement = transcriptRef.current?.querySelector('.highlight');
          if (highlightElement && autoScroll) {
            highlightElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
        
        // 滚动附近字幕区域，确保当前字幕在视图中，但不强制移动页面
        setTimeout(() => {
          const activeElement = nearbySubtitlesRef.current?.querySelector('.active-subtitle');
          if (activeElement && autoScroll) {
            activeElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'nearest', 
              inline: 'nearest' 
            });
          }
        }, 100);
      }
    }
  }, [currentTime, subtitles, transcript, autoScroll]);
  
  // 在文字稿中高亮显示当前字幕文本
  const highlightText = (fullText, textToHighlight) => {
    if (!textToHighlight) return fullText;
    
    // 简单的文本替换，实际应用中可能需要更复杂的匹配算法
    const escapedText = textToHighlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedText})`, 'gi');
    return fullText.replace(regex, '<span class="highlight">$1</span>');
  };
  
  // 增加字体大小
  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 1, 24));
  };

  // 减小字体大小
  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 1, 12));
  };
  
  // 复制当前字幕到剪贴板
  const copyCurrentSubtitle = () => {
    if (activeSubtitle) {
      navigator.clipboard.writeText(activeSubtitle.text)
        .then(() => {
          alert('已复制到剪贴板');
        })
        .catch(err => {
          console.error('复制失败:', err);
        });
    }
  };
  
  // 跳转到指定字幕
  const jumpToSubtitle = (subtitle) => {
    if (onSeek && subtitle) {
      onSeek(subtitle.start);
    }
  };
  
  // 获取附近字幕列表（不限制条数）
  const getNearbySubtitles = () => {
    if (!subtitles.length) return [];
    
    if (!activeSubtitle) {
      // 如果没有活跃字幕，返回所有字幕
      return subtitles;
    }
    
    const currentIndex = subtitles.findIndex(sub => 
      activeSubtitle && sub.start === activeSubtitle.start
    );
    
    if (currentIndex === -1) return subtitles;
    
    // 计算前20条和后10条的索引范围，类似于时间轴的效果
    const startIndex = Math.max(0, currentIndex - 20);
    const endIndex = Math.min(subtitles.length, currentIndex + 11);
    
    return subtitles.slice(startIndex, endIndex);
  };
  
  // 获取附近字幕
  const nearbySubtitles = getNearbySubtitles();
  
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 items-center">
        <button 
          onClick={copyCurrentSubtitle} 
          disabled={!activeSubtitle}
          className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            activeSubtitle 
              ? 'text-white bg-blue-600 hover:bg-blue-700' 
              : 'text-gray-400 bg-gray-200 cursor-not-allowed'
          }`}
        >
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
          </svg>
          复制当前字幕
        </button>
        
        <button 
          onClick={() => setShowIssues(!showIssues)}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
        >
          {issues.length > 0 ? `查看问题 (${issues.length})` : '无字幕问题'}
        </button>
        
        <button
          onClick={() => setAutoScroll(!autoScroll)}
          className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            autoScroll
              ? 'text-white bg-green-600 hover:bg-green-700'
              : 'text-white bg-gray-500 hover:bg-gray-600'
          }`}
        >
          {autoScroll ? '自动滚动: 开' : '自动滚动: 关'}
        </button>
        
        <div className="inline-flex items-center rounded-md shadow-sm ml-auto">
          <button 
            onClick={decreaseFontSize} 
            title="减小字体"
            className="inline-flex items-center px-2 py-1 border border-gray-300 text-sm font-medium rounded-l-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          <span className="inline-flex items-center px-3 py-1 border-t border-b border-gray-300 text-sm font-medium text-gray-700 bg-gray-50">
            {fontSize}px
          </span>
          <button 
            onClick={increaseFontSize} 
            title="增大字体"
            className="inline-flex items-center px-2 py-1 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      {showIssues && issues.length > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">
                字幕问题 ({issues.length})
              </h3>
              <div className="mt-2 text-sm text-amber-700">
                <ul className="list-disc pl-5 space-y-1">
                  {issues.slice(0, 5).map((issue, index) => (
                    <li key={index}>{issue.message}</li>
                  ))}
                  {issues.length > 5 && (
                    <li>...还有 {issues.length - 5} 个问题</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 transition-shadow hover:shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">当前字幕</h3>
          <p 
            className="p-4 bg-gray-50 rounded-md min-h-[100px] text-gray-800 subtitle-text"
            style={{ fontSize: `${fontSize}px` }}
          >
            {activeSubtitle ? activeSubtitle.text : ''}
          </p>
          {activeSubtitle && (
            <div className="mt-3 flex justify-between text-sm text-gray-500">
              <span>时间: {activeSubtitle.formattedStart} - {activeSubtitle.formattedEnd}</span>
              <span>字数: {activeSubtitle.words} 词</span>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6 transition-shadow hover:shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">完整文字稿</h3>
          <div 
            ref={transcriptRef}
            className="p-4 bg-gray-50 rounded-md max-h-[300px] overflow-y-auto text-gray-800"
            style={{ fontSize: `${fontSize}px` }}
          >
            {/* 使用 ReactMarkdown 渲染 Markdown 格式的文本 */}
            <ReactMarkdown>
              {transcript}
            </ReactMarkdown>
            
            {/* 保留高亮功能的隐藏元素 */}
            <div 
              className="hidden"
              dangerouslySetInnerHTML={{ __html: highlightedTranscript }} 
            />
          </div>
        </div>
      </div>
      
      {/* 修改后的附近字幕区域（采用时间轴样式） */}
      <div className="bg-white rounded-xl shadow-md p-6 transition-shadow hover:shadow-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">附近字幕</h3>
        
        {/* 字幕时间轴指示器 */}
        <div className="relative mb-4">
          <div className="h-2 bg-gray-200 rounded-full">
            {subtitles.length > 0 && (
              <div 
                className="absolute h-2 bg-blue-500 rounded-full"
                style={{ 
                  left: '0', 
                  width: `${(currentTime / subtitles[subtitles.length - 1].end) * 100}%`,
                  transition: 'width 0.3s ease-in-out'
                }}
              />
            )}
          </div>
        </div>
        
        {/* 字幕滚动区域 */}
        <div 
          ref={nearbySubtitlesRef}
          className="flex overflow-x-auto pb-4 timeline-container"
          style={{ scrollbarWidth: 'thin' }}
        >
          {nearbySubtitles.map((sub, index) => {
            const isActive = activeSubtitle && activeSubtitle.start === sub.start;
            const isPast = activeSubtitle && sub.end < activeSubtitle.start;
            const isFuture = activeSubtitle && sub.start > activeSubtitle.end;
            
            let positionClass = '';
            if (isPast) positionClass = 'past-subtitle';
            if (isFuture) positionClass = 'future-subtitle';
            
            return (
              <div 
                key={index} 
                onClick={() => jumpToSubtitle(sub)}
                className={`flex-shrink-0 p-3 mx-1 rounded-md cursor-pointer transition-all ${positionClass} ${
                  isActive 
                    ? 'active-subtitle bg-blue-100 border-b-4 border-blue-500 min-w-[200px] transform scale-105'
                    : 'bg-gray-50 hover:bg-blue-50 min-w-[180px]'
                }`}
              >
                <div 
                  className={`text-sm ${isActive ? 'text-blue-800 font-medium' : 'text-gray-800'}`}
                  style={{ fontSize: `${Math.max(12, fontSize - 2)}px` }}
                >
                  {sub.text}
                </div>
                <div className={`text-xs mt-1 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                  {sub.formattedStart} - {sub.formattedEnd}
                </div>
              </div>
            );
          })}
          {nearbySubtitles.length === 0 && (
            <p className="text-center py-4 text-gray-500 w-full">
              没有可显示的字幕
            </p>
          )}
        </div>
        
        {/* 导航提示 */}
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>← 前20条字幕</span>
          <span>当前位置</span>
          <span>后10条字幕 →</span>
        </div>
      </div>
      
      <style jsx global>{`
        .highlight {
          background-color: #fef08a;
          padding: 2px 0;
          border-radius: 3px;
          animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(254, 240, 138, 0.7);
          }
          70% {
            box-shadow: 0 0 0 6px rgba(254, 240, 138, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(254, 240, 138, 0);
          }
        }
        
        .timeline-container {
          scrollbar-width: thin;
          scrollbar-color: #93c5fd #e5e7eb;
          scroll-behavior: smooth;
          padding: 8px 0;
        }
        
        .timeline-container::-webkit-scrollbar {
          height: 6px;
        }
        
        .timeline-container::-webkit-scrollbar-track {
          background: #e5e7eb;
          border-radius: 3px;
        }
        
        .timeline-container::-webkit-scrollbar-thumb {
          background-color: #93c5fd;
          border-radius: 3px;
        }
        
        .active-subtitle {
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
          z-index: 10;
        }
        
        .past-subtitle {
          opacity: 0.8;
        }
        
        .future-subtitle {
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
};

export default SubtitleDisplay;