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
  const [formattedTranscript, setFormattedTranscript] = useState('');
  const [speakerImage, setSpeakerImage] = useState(null);
  const fileInputRef = useRef(null);
  
  // 计算中文字数 - 直接计算字符数
  const countChineseChars = (text) => {
    if (!text) return 0;
    // 移除空格、标点符号等，只保留实际字符
    const cleanedText = text.replace(/[\s\p{P}]/gu, '');
    return cleanedText.length;
  };
  
  // 加载并解析 SRT 文件
  useEffect(() => {
    if (srtFile) {
      if (srtFile.file && srtFile.file instanceof Blob) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target.result;
          const enhancedSubtitles = parseAndEnhanceSRT(content);
          
          // 移除字幕中的逗号和句号，并计算正确的汉字字数
          const processedSubtitles = enhancedSubtitles.map(sub => {
            const cleanedText = sub.text.replace(/[,.]/g, '');
            // 计算汉字字数
            const charCount = countChineseChars(cleanedText);
            
            // 确保字符速率计算不会出现无穷大
            const duration = Math.max(0.1, sub.end - sub.start); // 确保持续时间至少为0.1秒
            const charRate = charCount / duration;
            
            return {
              ...sub,
              text: cleanedText,
              words: charCount, // 使用汉字字数
              charRate: charRate.toFixed(2)
            };
          });
          
          setSubtitles(processedSubtitles);
          
          // 使用修正后的字幕查找问题
          const subtitleIssues = findSubtitleIssues(processedSubtitles);
          setIssues(subtitleIssues);
          
          // 如果有字幕和文字稿，处理文字稿格式
          if (processedSubtitles.length > 0 && transcript) {
            formatTranscriptWithTimestamps(transcript, processedSubtitles);
          }
        };
        reader.readAsText(srtFile.file);
      } else if (srtFile.content) {
        const enhancedSubtitles = parseAndEnhanceSRT(srtFile.content);
        
        // 移除字幕中的逗号和句号，并计算正确的汉字字数
        const processedSubtitles = enhancedSubtitles.map(sub => {
          const cleanedText = sub.text.replace(/[,.]/g, '');
          // 计算汉字字数
          const charCount = countChineseChars(cleanedText);
          
          // 确保字符速率计算不会出现无穷大
          const duration = Math.max(0.1, sub.end - sub.start); // 确保持续时间至少为0.1秒
          const charRate = charCount / duration;
          
          return {
            ...sub,
            text: cleanedText,
            words: charCount, // 使用汉字字数
            charRate: charRate.toFixed(2)
          };
        });
        
        setSubtitles(processedSubtitles);
        
        // 使用修正后的字幕查找问题
        const subtitleIssues = findSubtitleIssues(processedSubtitles);
        setIssues(subtitleIssues);
        
        // 如果有字幕和文字稿，处理文字稿格式
        if (processedSubtitles.length > 0 && transcript) {
          formatTranscriptWithTimestamps(transcript, processedSubtitles);
        }
      }
    }
  }, [srtFile, transcript]);
  
  // 格式化文字稿，添加时间戳
  const formatTranscriptWithTimestamps = (text, subs) => {
    if (!text || !subs || subs.length === 0) return text;
    
    // 获取字幕的时间范围
    const startTime = subs[0].start;
    const endTime = subs[subs.length - 1].end;
    
    // 创建每分钟的时间标记
    const timeMarkers = [];
    for (let time = Math.floor(startTime / 60) * 60; time <= endTime; time += 60) {
      // 找到最接近这个时间点的字幕
      const nearestSub = subs.reduce((prev, curr) => {
        return Math.abs(curr.start - time) < Math.abs(prev.start - time) ? curr : prev;
      }, subs[0]);
      
      // 将时间格式化为 MM:SS
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      timeMarkers.push({
        time,
        formattedTime,
        text: nearestSub.text.substring(0, 20) + '...' // 取字幕前20个字符
      });
    }
    
    // 将文字稿分段，并在每段之间添加时间标记
    const paragraphs = text.split(/\n\s*\n/);
    const paragraphsPerMarker = Math.ceil(paragraphs.length / (timeMarkers.length || 1));
    
    let formattedText = '';
    paragraphs.forEach((para, index) => {
      // 每隔一定段落添加时间标记
      if (index > 0 && index % paragraphsPerMarker === 0) {
        const markerIndex = Math.floor(index / paragraphsPerMarker) - 1;
        if (markerIndex < timeMarkers.length) {
          const marker = timeMarkers[markerIndex];
          formattedText += `\n\n**[${marker.formattedTime}]** *${marker.text}*\n\n`;
        }
      }
      formattedText += para + '\n\n';
    });
    
    setFormattedTranscript(formattedText);
  };
  
  // 加载文字稿
  useEffect(() => {
    if (txtFile) {
      if (txtFile.file && txtFile.file instanceof Blob) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target.result;
          setTranscript(text);
          setHighlightedTranscript(text);
          
          // 如果已经有字幕数据，处理文字稿格式
          if (subtitles.length > 0) {
            formatTranscriptWithTimestamps(text, subtitles);
          }
        };
        reader.readAsText(txtFile.file);
      } else if (txtFile.content) {
        setTranscript(txtFile.content);
        setHighlightedTranscript(txtFile.content);
        
        // 如果已经有字幕数据，处理文字稿格式
        if (subtitles.length > 0) {
          formatTranscriptWithTimestamps(txtFile.content, subtitles);
        }
      }
    }
  }, [txtFile, subtitles]);
  
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
        const highlighted = highlightText(formattedTranscript || transcript, textToHighlight);
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
  }, [currentTime, subtitles, transcript, formattedTranscript, autoScroll]);
  
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
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(activeSubtitle.text)
          .then(() => alert('已复制到剪贴板'))
          .catch(err => alert('复制失败，请手动选择文本'));
      } else {
        alert('当前环境不支持一键复制，请手动选择文本');
      }
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
  
  // 获取字幕问题详情
  const getIssueDetails = (issue) => {
    if (issue.type === 'charRate') {
      return `字幕 #${issue.index} 的字符速率过快 (${issue.value} 字符/秒)`;
    }
    return issue.message;
  };
  
  // 处理演讲者图片上传
  const handleSpeakerImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSpeakerImage(event.target.result);
        
        // 保存到本地存储，以便页面刷新后保留
        try {
          localStorage.setItem('speakerImage', event.target.result);
        } catch (err) {
          console.warn('无法保存图片到本地存储:', err);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  // 触发文件选择对话框
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };
  
  // 移除演讲者图片
  const removeSpeakerImage = () => {
    setSpeakerImage(null);
    localStorage.removeItem('speakerImage');
  };
  
  // 从本地存储加载演讲者图片
  useEffect(() => {
    try {
      const savedImage = localStorage.getItem('speakerImage');
      if (savedImage) {
        setSpeakerImage(savedImage);
      }
    } catch (err) {
      console.warn('无法从本地存储加载图片:', err);
    }
  }, []);
  
  return (
    <div className="relative">
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
        
        {/* 添加演讲者图片上传按钮 */}
        <button
          onClick={triggerFileInput}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
          {speakerImage ? '更换立绘' : '上传立绘'}
        </button>
        
        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleSpeakerImageUpload}
        />
        
        {/* 如果有图片，显示删除按钮 */}
        {speakerImage && (
          <button
            onClick={removeSpeakerImage}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            删除立绘
          </button>
        )}
        
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
                    <li key={index}>{getIssueDetails(issue)}</li>
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
      
      {/* 修改布局，添加演讲者图片区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 演讲者立绘区域 */}
        <div className="bg-white rounded-xl shadow-md p-6 transition-shadow hover:shadow-lg flex flex-col items-center justify-center speaker-portrait-container">
          {speakerImage ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <img 
                src={speakerImage} 
                alt="演讲者立绘" 
                className="max-h-[400px] max-w-full object-contain speaker-portrait"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <svg className="w-24 h-24 mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              <p className="text-center">
                点击上方"上传立绘"按钮<br/>添加演讲者图片
              </p>
            </div>
          )}
        </div>
        
        {/* 当前字幕区域 */}
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
              <span>字数: {activeSubtitle.words || 0} 字</span>
            </div>
          )}
        </div>
        
        {/* 完整文字稿区域 */}
        <div className="bg-white rounded-xl shadow-md p-6 transition-shadow hover:shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">完整文字稿</h3>
          <div 
            ref={transcriptRef}
            className="p-4 bg-gray-50 rounded-md max-h-[300px] overflow-y-auto text-gray-800 transcript-content"
            style={{ fontSize: `${fontSize}px` }}
          >
            {/* 使用 ReactMarkdown 渲染 Markdown 格式的文本 */}
            <ReactMarkdown>
              {formattedTranscript || transcript}
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
                <div className={`text-xs mt-1 flex justify-between ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                  <span>{sub.formattedStart} - {sub.formattedEnd}</span>
                  <span>{sub.words || 0}字</span>
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
      
      {/* 字幕显示区域，固定底部居中，半透明背景 */}
      <div className="fixed left-1/2 bottom-12 z-30 w-full max-w-3xl px-4" style={{ transform: 'translateX(-50%)' }}>
        <div className="bg-black/60 rounded-lg py-3 px-6 text-white text-xl text-center shadow-lg select-text">
          {/* 高亮字幕内容 */}
          {activeSubtitle ? (
            <span dangerouslySetInnerHTML={{ __html: activeSubtitle.text }} />
          ) : (
            <span className="text-gray-300">（等待音频播放...）</span>
          )}
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
        
        /* 增加文字稿的行间距和段落间距 */
        .transcript-content {
          line-height: 1.8;
        }
        
        .transcript-content p {
          margin-bottom: 1.2em;
        }
        
        /* 时间标记样式 */
        .transcript-content strong {
          color: #2563eb;
        }
        
        .transcript-content em {
          color: #4b5563;
          font-style: italic;
        }
        
        /* 演讲者立绘容器样式 */
        .speaker-portrait-container {
          min-height: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f9fafb;
          overflow: hidden;
        }
        
        /* 演讲者立绘样式 */
        .speaker-portrait {
          transition: transform 0.3s ease;
        }
        
        .speaker-portrait:hover {
          transform: scale(1.02);
        }
        
        /* 响应式布局调整 */
        @media (max-width: 1023px) {
          .speaker-portrait-container {
            min-height: 300px;
          }
        }
      `}</style>
    </div>
  );
};

export default SubtitleDisplay;