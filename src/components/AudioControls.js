import React, { useRef, useEffect, useState } from 'react';

const AudioControls = (props) => {
  const isAndroid = /Android/i.test(navigator.userAgent);

  const {
    audioFile,
    currentTime,
    setCurrentTime,
    isPlaying,
    setIsPlaying,
    duration,
    setDuration,
    onActiveParagraphChange
  } = props;
  const audioRef = useRef(null);
  const [triedUnmuted, setTriedUnmuted] = useState(false);

  // 播放/暂停控制，安卓端首次播放时muted
  const togglePlayPause = (e) => {
    if (!audioRef.current) return;
    console.log('[AudioControls] 播放按钮点击，audio状态:', {
      src: audioRef.current.src,
      paused: audioRef.current.paused,
      muted: audioRef.current.muted,
      currentTime: audioRef.current.currentTime,
      readyState: audioRef.current.readyState,
      error: audioRef.current.error
    });
    try {
      if (isAndroid && !triedUnmuted) {
        console.log('[AudioControls] 安卓端首次播放，尝试muted=true后play()');
        audioRef.current.muted = true;
        audioRef.current.play().then(() => {
          audioRef.current.muted = false;
          setTriedUnmuted(true);
          setIsPlaying(true);
          console.log('[AudioControls] 安卓端首次play()成功，已unmuted', {
            src: audioRef.current.src,
            paused: audioRef.current.paused,
            muted: audioRef.current.muted,
            currentTime: audioRef.current.currentTime,
            readyState: audioRef.current.readyState,
            error: audioRef.current.error
          });
        }).catch((err) => {
          console.error('[AudioControls] 安卓端首次play()失败', err, {
            src: audioRef.current.src,
            paused: audioRef.current.paused,
            muted: audioRef.current.muted,
            currentTime: audioRef.current.currentTime,
            readyState: audioRef.current.readyState,
            error: audioRef.current.error
          });
          alert('如未能自动播放，请再次点击播放按钮或尝试刷新页面。');
        });
        return;
      }
      if (audioRef.current.paused) {
        audioRef.current.play();
        setIsPlaying(true);
        console.log('[AudioControls] play() called, now playing', {
          src: audioRef.current.src,
          paused: audioRef.current.paused,
          muted: audioRef.current.muted,
          currentTime: audioRef.current.currentTime,
          readyState: audioRef.current.readyState,
          error: audioRef.current.error
        });
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
        console.log('[AudioControls] pause() called, now paused', {
          src: audioRef.current.src,
          paused: audioRef.current.paused,
          muted: audioRef.current.muted,
          currentTime: audioRef.current.currentTime,
          readyState: audioRef.current.readyState,
          error: audioRef.current.error
        });
      }
    } catch (err) {
      console.error('play/pause异常', err);
      alert('如未能自动播放，请再次点击播放按钮或尝试刷新页面。');
    }
  };

  // 进度同步
  const handleTimeUpdate = (e) => {
    setCurrentTime(e.target.currentTime);
    if (onActiveParagraphChange) {
      onActiveParagraphChange(e.target.currentTime);
    }
    console.log('audio timeupdate:', e.target.currentTime);
  };
  const handleLoadedMetadata = (e) => {
    setDuration(e.target.duration || 0);
    console.log('audio loadedmetadata, duration:', e.target.duration);
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
    if (onActiveParagraphChange) {
      onActiveParagraphChange(seekTime);
    }
  };
  // 时间格式化
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // 移除安卓端 return null，让安卓端也渲染完整UI
  // if (isAndroid) return null;

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto mb-4">
      <div className="flex items-center gap-4 mb-2 w-full">
        <button
          onClick={togglePlayPause}
          onTouchEnd={isAndroid ? togglePlayPause : undefined}
          disabled={!audioFile}
          className={`w-14 h-14 flex items-center justify-center text-white rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${audioFile ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}
          type="button"
        >
          {isPlaying ? (
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
        </button>
        <audio
          ref={audioRef}
          src={audioFile?.webPath || (audioFile?.file ? URL.createObjectURL(audioFile.file) : '')}
          type={audioFile?.type || 'audio/mpeg'}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          controls={false}
          playsInline
          onPlay={() => {
            console.log('[AudioControls] audio onPlay', {
              src: audioRef.current?.src,
              paused: audioRef.current?.paused,
              muted: audioRef.current?.muted,
              currentTime: audioRef.current?.currentTime,
              readyState: audioRef.current?.readyState,
              error: audioRef.current?.error
            });
          }}
          onPause={() => {
            console.log('[AudioControls] audio onPause', {
              src: audioRef.current?.src,
              paused: audioRef.current?.paused,
              muted: audioRef.current?.muted,
              currentTime: audioRef.current?.currentTime,
              readyState: audioRef.current?.readyState,
              error: audioRef.current?.error
            });
          }}
          onError={e => {
            console.error('[AudioControls] audio onError', e, {
              src: audioRef.current?.src,
              type: audioFile?.type,
              size: audioFile?.size,
              error: audioRef.current?.error
            });
            alert('音频播放出错：文件格式可能不被支持，建议重新导出为标准mp3或wav。');
          }}
        />
        {/* 调试信息 */}
        <div className="text-xs text-gray-400 break-all mt-1">
          src: {(audioFile?.webPath || (audioFile?.file ? URL.createObjectURL(audioFile.file) : ''))?.slice(0, 80)}...<br />
          type: {audioFile?.type || '未知'}<br />
          size: {audioFile?.size || '未知'}
        </div>
        {!audioFile?.webPath && !audioFile?.file && (
          <div className="text-red-500 text-xs mt-1">未选择有效音频文件，或格式不被支持</div>
        )}
        <div className="flex flex-col items-center w-full flex-1">
          <div className="flex items-center justify-between w-full text-xs text-gray-500 mb-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <div
            className="relative h-3 bg-gray-200 rounded-full cursor-pointer select-none w-full max-w-3xl"
            onClick={handleProgressClick}
            onTouchStart={handleProgressClick}
          >
            <div
              className="absolute top-0 left-0 h-3 bg-blue-500 rounded-full transition-all duration-100"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            ></div>
            <div
              className="absolute top-1/2 transform -translate-y-1/2"
              style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            >
              <div className="w-4 h-4 bg-blue-500 rounded-full shadow border-2 border-white -ml-2"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioControls; 