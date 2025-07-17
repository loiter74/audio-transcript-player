import React, { useState, useEffect, useRef } from 'react';
import { parseAndEnhanceSRT, findSubtitleIssues } from '../utils/enhancedSrtParser';
import ReactMarkdown from 'react-markdown';
import BgImageUploader from './BgImageUploader';

const SubtitleDisplay = ({ audioFile, srtFile, txtFile, currentTime, setCurrentTime, bgImage, bgOpacity, onBgImageChange, onOpacityChange, debugLog, setHighlightIndex, showFloat, setShowFloat }) => {
  const [subtitles, setSubtitles] = useState([]);
  const [transcript, setTranscript] = useState('');
  const [activeSubtitle, setActiveSubtitle] = useState(null);
  const [fontSize, setFontSize] = useState(16);
  const [issues, setIssues] = useState([]);
  const [showIssues, setShowIssues] = useState(false);
  const transcriptRef = useRef(null);
  const nearbySubtitlesRef = useRef(null);
  const [highlightedTranscript, setHighlightedTranscript] = useState('');
  const [formattedTranscript, setFormattedTranscript] = useState('');
  const [floatPos, setFloatPos] = useState({ x: 100, y: 100 });
  const floatRef = useRef();
  const dragOffset = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);
  const [pinned, setPinned] = useState(false); // 图钉状态
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);

  // 拖动事件
  const onMouseDown = (e) => {
    if (pinned) return; // 图钉状态下不可拖动
    dragging.current = true;
    dragOffset.current = {
      x: e.clientX - floatPos.x,
      y: e.clientY - floatPos.y
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };
  const onMouseMove = (e) => {
    if (!dragging.current) return;
    setFloatPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
  };
  const onMouseUp = () => {
    dragging.current = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  // 播放/暂停控制
  const togglePlayPause = (e) => {
    e && e.stopPropagation && e.stopPropagation();
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };
  // 音频进度同步
  const handleTimeUpdate = (e) => {
    setCurrentTime(e.target.currentTime);
  };

  // 进度条跳转
  const handleProgressClick = (e) => {
    if (!audioRef.current || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const percent = (clientX - rect.left) / rect.width;
    const seekTime = percent * duration;
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };
  // 时间格式化
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

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
          if (highlightElement) {
            highlightElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
        
        // 滚动附近字幕区域，确保当前字幕在视图中，但不强制移动页面
        setTimeout(() => {
          const activeElement = nearbySubtitlesRef.current?.querySelector('.active-subtitle');
          if (activeElement) {
            activeElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'nearest', 
              inline: 'nearest' 
            });
          }
        }, 100);
      }
    }
  }, [currentTime, subtitles, transcript, formattedTranscript]);
  
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

  // 通过props传递高亮正文索引
  const handleSubtitleClick = () => {
    if (!activeSubtitle || !txtFile || !setHighlightIndex) return;
    const paragraphs = (txtFile.content || transcript || '').split(/\n\s*\n/);
    const idx = paragraphs.findIndex(p => p.includes(activeSubtitle.text.trim()));
    if (idx !== -1) {
      setHighlightIndex(idx);
    }
  };
  
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  // 移除右上角操作区的按钮，只保留悬浮字幕浮窗
  return (
    <>
      {showFloat && (
        <div
          ref={floatRef}
          style={{ position: 'fixed', left: floatPos.x, top: floatPos.y, zIndex: 10000, minWidth: 320, maxWidth: 600, cursor: pinned ? 'default' : 'move', userSelect: 'none' }}
          className="shadow-2xl bg-white/90 rounded-xl border border-gray-300"
          onMouseDown={onMouseDown}
        >
          {/* 操作区：并排美化布局 */}
          <div className="flex flex-wrap items-center gap-3 bg-white/70 rounded-t-xl p-3 border-b border-gray-200">
            {/* 图钉按钮 */}
            <button
              onClick={e => { e.stopPropagation(); setPinned(v => !v); }}
              className={`w-10 h-10 flex items-center justify-center rounded-full border-2 ${pinned ? 'bg-yellow-400 border-yellow-500' : 'bg-gray-200 border-gray-300'} shadow focus:outline-none mr-2`}
              title={pinned ? '已固定，点击解锁拖动' : '未固定，点击固定悬浮窗'}
              type="button"
            >
              {pinned ? (
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.293 6.293a1 1 0 011.414 0L10 8.586l2.293-2.293a1 1 0 111.414 1.414L11.414 10l2.293 2.293a1 1 0 01-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 01-1.414-1.414L8.586 10 6.293 7.707a1 1 0 010-1.414z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l.7 2.148a1 1 0 00.95.69h2.262c.969 0 1.371 1.24.588 1.81l-1.833 1.33a1 1 0 00-.364 1.118l.7 2.148c.3.921-.755 1.688-1.54 1.118l-1.833-1.33a1 1 0 00-1.175 0l-1.833 1.33c-.784.57-1.838-.197-1.54-1.118l.7-2.148a1 1 0 00-.364-1.118l-1.833-1.33c-.783-.57-.38-1.81.588-1.81h2.262a1 1 0 00.95-.69l.7-2.148z" />
                </svg>
              )}
            </button>
            {/* 复制当前字幕 */}
            <button 
              onClick={e => { e.stopPropagation(); copyCurrentSubtitle(); }} 
              disabled={!activeSubtitle}
              className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 h-10 mt-5 ${
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
          </div>
          {/* 悬浮字幕内容 - 朴素风格 */}
          <div className="py-6 px-4 text-center select-text">
            <div
              style={{
                background: '#fff',
                borderRadius: 10,
                padding: 16,
                fontWeight: 500,
                fontSize: '1.5rem',
                color: '#222',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)',
                letterSpacing: 0.5,
                lineHeight: 1.5,
                cursor: activeSubtitle ? 'pointer' : 'default'
              }}
              onClick={handleSubtitleClick}
              title={activeSubtitle ? '点击跳转到正文对应段落' : ''}
            >
              {activeSubtitle ? (
                <span dangerouslySetInnerHTML={{ __html: activeSubtitle.text }} />
              ) : (
                <span className="text-gray-400">（等待音频播放...）</span>
              )}
            </div>
          </div>
        </div>
      )}
      <style jsx global>{`
         .highlight {
           background-color: #fef08a;
           padding: 2px 0;
           border-radius: 3px;
           animation: pulse 1.5s infinite;
         }
         @keyframes fadeInScale {
           0% { opacity: 0; transform: scale(0.95);}
           100% { opacity: 1; transform: scale(1);}
         }
       `}</style>
    </>
  );
}

export default SubtitleDisplay;