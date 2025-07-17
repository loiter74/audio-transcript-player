import React, { useState, useRef, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { NativeAudio } from '@capacitor-community/native-audio';
import { Filesystem, Directory } from '@capacitor/filesystem';

const isAndroid = Capacitor.getPlatform() === 'android';

// 辅助函数：优先用base64写入缓存目录，兼容content://和file://
async function getPlayableFilePath(audioFile) {
  // 优先用 base64 数据
  if (audioFile.data) {
    const fileName = (audioFile.name || 'audio_tmp.mp3').replace(/[^a-zA-Z0-9.]/g, '_');
    const writePath = `audio_tmp_${Date.now()}_${fileName}`;
    await Filesystem.writeFile({
      path: writePath,
      data: audioFile.data,
      directory: Directory.Cache
    });
    const uri = await Filesystem.getUri({ path: writePath, directory: Directory.Cache });
    return uri.uri;
  }
  // 其次用 file:// 或 /storage 路径
  let path = audioFile.path;
  if (path && (path.startsWith('file://') || path.startsWith('/storage/'))) {
    return path.startsWith('file://') ? path : 'file://' + path;
  }
  throw new Error('无法获取可播放音频路径');
}

const AudioPlayer = ({ audioFile, onTimeUpdate }) => {
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [error, setError] = useState('');
  const [mediaId, setMediaId] = useState(null); // 安卓原生播放id
  // 新增：只preload一次
  const [isLoaded, setIsLoaded] = useState(false);
  // 新增：累计播放时间和播放起点
  const [accumulatedTime, setAccumulatedTime] = useState(0);
  const playStartTimeRef = useRef(null);
  // 新增：防止重复操作
  const [isOperating, setIsOperating] = useState(false);
  // 新增：防止暂停后自动回播
  const recentlyPausedRef = useRef(false);

  useEffect(() => {
    if (!audioFile) return;
    if (isAndroid) {
      setAudioUrl('');
      setIsLoaded(false);
      setCurrentTime(0);
      setAccumulatedTime(0);
      playStartTimeRef.current = null;
    } else {
      // Web端优先webPath/path/file，最后base64
      let url = '';
      if (audioFile.webPath) {
        url = audioFile.webPath;
      } else if (audioFile.path) {
        url = audioFile.path;
      } else if (audioFile.file) {
        url = URL.createObjectURL(audioFile.file);
      } else if (audioFile.data) {
        url = `data:${audioFile.type || 'audio/mpeg'};base64,${audioFile.data}`;
      }
      setAudioUrl(url);
    }
  }, [audioFile]);

  // 安卓端：播放/暂停控制
  const handleNativePlayPause = async () => {
    if (!audioFile || isOperating) return;
    setIsOperating(true);
    try {
      if (isAndroid) {
        console.log('Android端播放，权限检查已简化');
      }
      const assetId = (audioFile.path || audioFile.name || 'audio').replace(/[^a-zA-Z0-9]/g, '_');
      // 统一获取可播放路径
      const assetPath = await getPlayableFilePath(audioFile);
      if (!isPlaying) {
        // 播放前判断是否刚刚暂停，避免误触发
        if (recentlyPausedRef.current) {
          setIsOperating(false);
          return;
        }
        if (!isLoaded) {
          await NativeAudio.preload({
            assetId,
            assetPath,
            isUrl: true
          });
          setIsLoaded(true);
          setMediaId(assetId);
          // 尝试获取音频时长（如果支持）
          try {
            if (audioFile.size) {
              const estimatedDuration = (audioFile.size * 8) / (128 * 1024);
              setDuration(estimatedDuration);
            }
          } catch (e) {
            console.warn('无法获取音频时长:', e);
          }
        }
        await NativeAudio.play({ assetId });
        setIsPlaying(true);
        playStartTimeRef.current = Date.now();
        startTimeUpdateTimer();
      } else {
        if (mediaId) {
          // 优先stop，pause仅兼容
          try {
            await NativeAudio.stop({ assetId: mediaId });
            await NativeAudio.unload({ assetId: mediaId });
          } catch (e) {
            try {
              await NativeAudio.pause({ assetId: mediaId });
              await NativeAudio.unload({ assetId: mediaId });
            } catch (e2) {
              setError('安卓暂停失败: ' + (e2.message || e2));
            }
          }
          setIsLoaded(false); // 下次需重新preload
        }
        setIsPlaying(false);
        // 累加已播放时间
        setAccumulatedTime(prev => {
          const played = playStartTimeRef.current ? (Date.now() - playStartTimeRef.current) / 1000 : 0;
          return prev + played;
        });
        stopTimeUpdateTimer();
        playStartTimeRef.current = null;
        recentlyPausedRef.current = true;
        setTimeout(() => { recentlyPausedRef.current = false; }, 800);
      }
    } catch (e) {
      setError('安卓原生音频播放出错: ' + (e.message || e));
      console.error('[AudioPlayer] 播放出错:', e, audioFile);
    } finally {
      setIsOperating(false);
    }
  };

  // Android时间更新定时器
  const timeUpdateIntervalRef = useRef(null);
  
  const startTimeUpdateTimer = () => {
    if (timeUpdateIntervalRef.current) {
      clearInterval(timeUpdateIntervalRef.current);
    }
    timeUpdateIntervalRef.current = setInterval(() => {
      if (isPlaying && (mediaId || isAndroid)) {
        // 用累计时间+当前播放段时间模拟currentTime
        const played = playStartTimeRef.current ? (Date.now() - playStartTimeRef.current) / 1000 : 0;
        const cur = accumulatedTime + played;
        setCurrentTime(cur);
        onTimeUpdate(cur);
      }
    }, 100);
  };
  
  const stopTimeUpdateTimer = () => {
    if (timeUpdateIntervalRef.current) {
      clearInterval(timeUpdateIntervalRef.current);
      timeUpdateIntervalRef.current = null;
    }
  };

  // Android端跳转功能（暂时未使用，但保留以备将来扩展）
  // eslint-disable-next-line no-unused-vars
  const seekToTime = async (time) => {
    if (isAndroid && mediaId) {
      try {
        // 注意：NativeAudio可能不直接支持seek功能
        // 这里可以尝试重新加载音频到指定位置
        console.warn('Android端暂不支持精确跳转，建议使用Web端进行精确控制');
        setCurrentTime(time);
        onTimeUpdate(time);
      } catch (e) {
        console.error('Android端跳转失败:', e);
      }
    }
  };

  // 安卓端：停止播放（组件卸载时）
  useEffect(() => {
    return () => {
      if (isAndroid && mediaId) {
        NativeAudio.stop({ assetId: mediaId });
        NativeAudio.unload({ assetId: mediaId });
      }
      // 清理定时器
      stopTimeUpdateTimer();
    };
    // eslint-disable-next-line
  }, [mediaId]);

  // Web端事件
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime;
      setCurrentTime(time);
      onTimeUpdate(time);
    }
  };
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };
  const handleAudioError = (e) => {
    setError('音频播放出错：文件格式可能不被支持，建议重新导出为标准mp3或wav。');
    console.error('音频播放出错:', e);
  };
  const togglePlayPause = async () => {
    try {
      if (!audioRef.current) return;
      if (audioRef.current.paused) {
        await audioRef.current.play();
        setIsPlaying(true);
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    } catch (error) {
      setError(`播放音频时出错: ${error.message}`);
    }
  };
  const handleProgressClick = (e) => {
    if (!audioRef.current || duration === 0) return;
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    if (!clientX) return;
    const percent = (clientX - rect.left) / rect.width;
    const seekTime = percent * duration;
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };
  const handleSpeedChange = (speed) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
      setPlaybackRate(speed);
    }
  };
  const handleVolumeChange = (e) => {
    const value = parseFloat(e.target.value);
    setVolume(value);
    if (audioRef.current) {
      audioRef.current.volume = value;
    }
  };
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white/70 rounded-xl shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">音频播放器</h2>
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>错误:</strong> {error}
        </div>
      )}
      {/* 安卓端：原生播放按钮 */}
      {isAndroid ? (
        <div className="flex flex-col items-center space-y-4">
          <button
            onClick={handleNativePlayPause}
            disabled={isOperating}
            className={`w-24 h-24 flex items-center justify-center text-white rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isPlaying ? (
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          <div className="text-gray-500 text-sm">{isPlaying ? '正在播放（原生）' : '点击播放（原生）'}</div>
          {/* Android端进度显示，始终显示 */}
          <div className="w-full space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>{formatTime(currentTime)}</span>
              <span>{duration > 0 ? formatTime(duration) : '--:--'}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full cursor-pointer" onClick={() => alert('安卓原生音频暂不支持拖动进度条')}> 
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-100"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      ) : (
        // Web端audio播放器
        <>
          <audio
            ref={audioRef}
            src={audioUrl}
            type={audioFile?.type || 'audio/mpeg'}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onError={handleAudioError}
            controlsList="nodownload"
            playsInline
            preload="metadata"
            controls
          />
          {/* 调试信息 */}
          <div className="text-xs text-gray-400 break-all mt-1">
            src: {audioUrl?.slice(0, 80)}...<br />
            type: {audioFile?.type || '未知'}<br />
            size: {audioFile?.size || '未知'}
          </div>
          {!audioUrl && (
            <div className="text-red-500 text-xs mt-1">未选择有效音频文件，或格式不被支持</div>
          )}
          <div className="space-y-4">
            <div
              className="h-4 bg-gray-200 rounded-full cursor-pointer relative"
              onClick={handleProgressClick}
              onTouchStart={handleProgressClick}
            >
              <div
                ref={progressRef}
                className="absolute top-0 left-0 h-full bg-blue-600 rounded-full"
                style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <div className="flex items-center justify-between">
              <button
                onClick={togglePlayPause}
                disabled={!audioUrl}
                className={`w-16 h-16 flex items-center justify-center text-white rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  audioUrl ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
                }`}
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
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828a1 1 0 010-1.415z" clipRule="evenodd" />
                </svg>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-24 h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
            <div className="flex justify-center space-x-2 pt-2 flex-wrap">
              {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(speed => (
                <button
                  key={speed}
                  onClick={() => handleSpeedChange(speed)}
                  className={`px-4 py-2 text-sm rounded-full focus:outline-none mb-1 ${
                    playbackRate === speed
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AudioPlayer;