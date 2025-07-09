// 解析 SRT 文件内容
export const parseSRT = (srtContent) => {
  const subtitles = [];
  const blocks = srtContent.trim().split(/\n\s*\n/);
  
  blocks.forEach(block => {
    const lines = block.split('\n');
    if (lines.length >= 3) {
      // 跳过索引号
      const timeInfo = lines[1];
      const text = lines.slice(2).join(' ');
      
      // 解析时间信息 "00:00:20,000 --> 00:00:25,000"
      const timeMatch = timeInfo.match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);
      
      if (timeMatch) {
        const startTime = convertTimeToSeconds(timeMatch[1]);
        const endTime = convertTimeToSeconds(timeMatch[2]);
        
        subtitles.push({
          start: startTime,
          end: endTime,
          text: text
        });
      }
    }
  });
  
  return subtitles;
};

// 将 SRT 时间格式转换为秒
export const convertTimeToSeconds = (timeString) => {
  const [time, milliseconds] = timeString.split(',');
  const [hours, minutes, seconds] = time.split(':').map(Number);
  
  return hours * 3600 + minutes * 60 + seconds + parseInt(milliseconds) / 1000;
};

// 将秒转换为 SRT 格式的时间字符串 (00:00:20,000)
export const formatSecondsToSrtTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
};

// 将秒转换为友好的时间显示格式 (00:20)
export const formatSecondsToDisplayTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// 为字幕添加额外的信息和格式化方法
export const enhanceParsedSubtitles = (subtitles) => {
  return subtitles.map((subtitle, index) => ({
    ...subtitle,
    id: index + 1,
    duration: subtitle.end - subtitle.start,
    formattedStart: formatSecondsToDisplayTime(subtitle.start),
    formattedEnd: formatSecondsToDisplayTime(subtitle.end),
    words: subtitle.text.split(' ').length,
    charactersPerSecond: subtitle.text.length / (subtitle.end - subtitle.start)
  }));
};

// 增强版解析函数
export const parseAndEnhanceSRT = (srtContent) => {
  const parsedSubtitles = parseSRT(srtContent);
  return enhanceParsedSubtitles(parsedSubtitles);
};

// 查找字幕中可能的问题（字符速率过快、时长过短等）
export const findSubtitleIssues = (subtitles) => {
  const issues = [];
  
  subtitles.forEach((sub, index) => {
    // 检查字符速率 (通常阅读速度为每秒 15-20 个字符)
    if (sub.charactersPerSecond > 20) {
      issues.push({
        subtitleId: sub.id,
        type: 'high-character-rate',
        message: `字幕 #${sub.id} 的字符速率过快 (${sub.charactersPerSecond.toFixed(1)} 字符/秒)`
      });
    }
    
    // 检查时长过短
    if (sub.duration < 1.0 && sub.text.length > 10) {
      issues.push({
        subtitleId: sub.id,
        type: 'short-duration',
        message: `字幕 #${sub.id} 的显示时间过短 (${sub.duration.toFixed(1)} 秒)`
      });
    }
    
    // 检查与前一字幕的间隔
    if (index > 0) {
      const gap = sub.start - subtitles[index - 1].end;
      if (gap > 3.0) {
        issues.push({
          subtitleId: sub.id,
          type: 'large-gap',
          message: `字幕 #${sub.id} 与前一字幕间隔较大 (${gap.toFixed(1)} 秒)`
        });
      }
    }
  });
  
  return issues;
};