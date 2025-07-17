import React, { useState } from 'react';
import AudioPlayer from './AudioPlayer';
import SubtitleDisplay from './SubtitleDisplay';

const Player = ({ audioFile, srtFile, txtFile }) => {
  const [currentTime, setCurrentTime] = useState(0);
  
  const handleTimeUpdate = (time) => {
    setCurrentTime(time);
  };
  
  const handleSeek = (time) => {
    // 这个函数会被传递给子组件，用于跳转到特定时间
    const audioElement = document.querySelector('audio');
    if (audioElement) {
      audioElement.currentTime = time;
    }
    // 对于Android端，需要通知AudioPlayer组件
    // 这里可以通过ref或其他方式调用AudioPlayer的seekToTime方法
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <AudioPlayer 
          audioFile={audioFile} 
          onTimeUpdate={handleTimeUpdate} 
        />
      </div>
      <div className="lg:col-span-2">
        <SubtitleDisplay 
          srtFile={srtFile} 
          txtFile={txtFile} 
          currentTime={currentTime}
          onSeek={handleSeek}
        />
      </div>
    </div>
  );
};

export default Player;