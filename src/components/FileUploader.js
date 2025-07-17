import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FilePicker } from '@capawesome/capacitor-file-picker';
import { debugFileInfo, validateFile } from '../utils/fileDebugger';

const FileUploader = ({ onFilesUploaded }) => {
  const [audioFile, setAudioFile] = useState(null);
  const [srtFile, setSrtFile] = useState(null);
  const [txtFile, setTxtFile] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [debugLog, setDebugLog] = useState(''); // 调试日志

  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  // 添加调试日志的函数
  const addDebugLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setDebugLog(prev => prev + logMessage + '\n');
  };

  const handleFileSelect = async (fileType) => {
    try {
      setError('');
      addDebugLog(`开始选择${fileType}文件`);
      addDebugLog(`setIsLoading(true)`);
      setIsLoading(true);
      
      // 根据文件类型设置接受的扩展名
      let extensions;
      switch (fileType) {
        case 'audio':
          extensions = ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac'];
          break;
        case 'srt':
          extensions = ['srt'];
          break;
        case 'txt':
          extensions = ['txt'];
          break;
        default:
          extensions = [];
      }
      
      addDebugLog(`文件类型: ${fileType}, 扩展名: ${extensions.join(', ')}`);
      
      // 使用 FilePicker 选择文件
      addDebugLog('调用FilePicker.pickFiles...');
      const result = await FilePicker.pickFiles({
        types: extensions.map(ext => `.${ext}`),
        multiple: false,
        readData: true // 让 FilePicker 返回 base64
      });
      
      addDebugLog(`FilePicker返回结果: ${result.files.length}个文件`);
      
      if (result.files.length > 0) {
        const file = result.files[0];
        addDebugLog(`选择的文件: ${file.name}, 大小: ${file.size}字节`);
        
        // 使用调试工具分析文件
        debugFileInfo(file, `选择的${fileType}文件`);
        
        // 对于音频文件，检查文件大小
        if (fileType === 'audio' && file.size) {
          const sizeInMB = file.size / (1024 * 1024);
          addDebugLog(`音频文件大小: ${sizeInMB.toFixed(2)} MB`);
          
          // 如果文件太大，给出警告但继续处理
          if (sizeInMB > 50) {
            addDebugLog('警告: 音频文件较大，可能需要较长时间处理');
          }
        }
        
        if (!file.data) {
          addDebugLog('错误: 文件读取失败，没有data字段');
          throw new Error('文件读取失败，请重试或更换文件');
        }

        addDebugLog('文件data字段存在，开始构建文件对象');

        // 构建文件对象，包含所有必要信息
        const fileObj = {
          name: file.name,
          type: file.mimeType,
          size: file.size,
          data: file.data,
          path: file.path, // 添加路径信息
          webPath: file.webPath // 添加webPath信息
        };
        
        addDebugLog(`构建的文件对象: name=${fileObj.name}, type=${fileObj.type}, size=${fileObj.size}`);
        
        // 基本验证（不进行复杂的音频测试）
        if (fileType === 'audio') {
          addDebugLog('开始音频文件基本验证...');
          
          // 检查文件扩展名
          const validExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'];
          const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
          addDebugLog(`音频扩展名: ${fileExtension}`);
          
          if (!validExtensions.includes(fileExtension)) {
            addDebugLog(`错误: 不支持的音频格式: ${fileExtension}`);
            throw new Error(`不支持的音频格式: ${fileExtension}`);
          }
          
          // 检查文件大小
          if (file.size === 0) {
            addDebugLog('错误: 文件大小为0，文件可能损坏');
            throw new Error('文件大小为0，文件可能损坏');
          }
          
          if (file.size < 1024) {
            addDebugLog('错误: 文件太小，可能不是有效的音频文件');
            throw new Error('文件太小，可能不是有效的音频文件');
          }
          
          addDebugLog('音频文件基本验证通过');
        } else {
          // 对于其他文件类型，使用原有的验证
          addDebugLog('开始其他文件类型验证...');
          const validationErrors = validateFile(fileObj, fileType);
          if (validationErrors.length > 0) {
            addDebugLog(`错误: 文件验证失败: ${validationErrors.join(', ')}`);
            throw new Error(`文件验证失败: ${validationErrors.join(', ')}`);
          }
          addDebugLog('其他文件类型验证通过');
        }
        
        // 根据文件类型设置状态
        addDebugLog('开始设置文件状态...');
        switch (fileType) {
          case 'audio':
            addDebugLog('调用setAudioFile...');
            setAudioFile(fileObj);
            addDebugLog('音频文件设置成功');
            break;
          case 'srt':
            addDebugLog('调用setSrtFile...');
            setSrtFile(fileObj);
            addDebugLog('字幕文件设置成功');
            break;
          case 'txt':
            addDebugLog('调用setTxtFile...');
            setTxtFile(fileObj);
            addDebugLog('文字稿文件设置成功');
            break;
          default:
            addDebugLog(`警告: 未知的文件类型: ${fileType}`);
            console.warn('未知的文件类型:', fileType);
            break;
        }
        
        addDebugLog('文件处理完成');
      }
    } catch (error) {
      if (error && (error.message === 'pickFiles canceled' || error.message === 'pickFiles conceled')) {
        // 用户取消选择，静默处理
        addDebugLog('用户取消文件选择');
        return;
      }
      addDebugLog(`文件选择错误: ${error.message}`);
      console.error('文件选择错误:', error);
      setError(`选择文件时出错: ${error.message}`);
    } finally {
      addDebugLog('finally块执行，设置isLoading为false');
      setIsLoading(false);
      addDebugLog('setIsLoading(false)完成');
    }
  };

  const handleFileInput = (e, fileType) => {
    const file = e.target.files[0];
    if (!file) {
      addDebugLog('Web文件选择: 没有选择文件');
      return;
    }
    
    addDebugLog(`Web文件选择: ${file.name}, 大小: ${file.size}字节`);
    debugFileInfo(file, `Web选择的${fileType}文件`);
    
    const fileObj = {
      name: file.name,
      type: file.type,
      size: file.size,
      webPath: URL.createObjectURL(file),
      file: file
    };
    
    addDebugLog(`Web构建的文件对象: name=${fileObj.name}, type=${fileObj.type}, size=${fileObj.size}`);
    
    // 基本验证
    if (fileType === 'audio') {
      addDebugLog('Web音频文件验证开始...');
      
      // 检查文件扩展名
      const validExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      addDebugLog(`Web音频扩展名: ${fileExtension}`);
      
      if (!validExtensions.includes(fileExtension)) {
        addDebugLog(`Web错误: 不支持的音频格式: ${fileExtension}`);
        setError(`不支持的音频格式: ${fileExtension}`);
        return;
      }
      
      // 检查文件大小
      if (file.size === 0) {
        addDebugLog('Web错误: 文件大小为0，文件可能损坏');
        setError('文件大小为0，文件可能损坏');
        return;
      }
      
      if (file.size < 1024) {
        addDebugLog('Web错误: 文件太小，可能不是有效的音频文件');
        setError('文件太小，可能不是有效的音频文件');
        return;
      }
      
      addDebugLog('Web音频文件验证通过，调用setAudioFile');
      setAudioFile(fileObj);
      addDebugLog('Web音频文件设置成功');
    } else {
      // 对于其他文件类型，使用原有的验证
      addDebugLog('Web其他文件类型验证开始...');
      const validationErrors = validateFile(fileObj, fileType);
      if (validationErrors.length > 0) {
        addDebugLog(`Web错误: 文件验证失败: ${validationErrors.join(', ')}`);
        setError(`文件验证失败: ${validationErrors.join(', ')}`);
        return;
      }
      
      addDebugLog('Web其他文件类型验证通过');
      switch (fileType) {
        case 'srt': 
          addDebugLog('Web调用setSrtFile');
          setSrtFile(fileObj); 
          addDebugLog('Web字幕文件设置成功');
          break;
        case 'txt': 
          addDebugLog('Web调用setTxtFile');
          setTxtFile(fileObj); 
          addDebugLog('Web文字稿文件设置成功');
          break;
        default:
          addDebugLog(`Web警告: 未知的文件类型: ${fileType}`);
          console.warn('Web未知的文件类型:', fileType);
          break;
      }
    }
  };

  const readFileContent = async (fileObj) => {
    addDebugLog('开始读取文件内容...');
    debugFileInfo(fileObj, '读取内容前');
    
    if (fileObj.data) {
      // 安卓WebView atob后用TextDecoder解码，保证utf-8兼容
      addDebugLog('使用base64数据解码并用TextDecoder(utf-8)解码');
      try {
        const binary = atob(fileObj.data);
        const bytes = new Uint8Array([...binary].map(c => c.charCodeAt(0)));
        const decoder = new TextDecoder('utf-8');
        const text = decoder.decode(bytes);
        addDebugLog('TextDecoder解码成功');
        return text;
      } catch (e) {
        addDebugLog('TextDecoder解码失败，使用atob直接返回');
        return atob(fileObj.data);
      }
    }
    if (fileObj.file && fileObj.file instanceof Blob) {
      addDebugLog('使用FileReader读取文件，强制utf-8编码');
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(fileObj.file, 'utf-8');
      });
    }
    addDebugLog('错误: 无法读取文件内容：没有 base64 数据或文件对象');
    throw new Error('无法读取文件内容：没有 base64 数据或文件对象');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    addDebugLog('开始提交表单...');
    addDebugLog('setIsLoading(true)');
    setIsLoading(true);
    
    if (audioFile && srtFile && txtFile) {
      try {
        addDebugLog('所有文件都已选择，开始验证...');
        console.info('准备读取文件内容', { srtFile, txtFile });
        
        // 验证所有文件
        addDebugLog('验证SRT文件...');
        const srtErrors = validateFile(srtFile, 'srt');
        addDebugLog('验证TXT文件...');
        const txtErrors = validateFile(txtFile, 'txt');
        
        const allErrors = [...srtErrors, ...txtErrors];
        if (allErrors.length > 0) {
          addDebugLog(`错误: 文件验证失败: ${allErrors.join(', ')}`);
          throw new Error(`文件验证失败: ${allErrors.join(', ')}`);
        }
        
        addDebugLog('文件验证通过，开始读取内容...');
        const srtContent = await readFileContent(srtFile);
        const txtContent = await readFileContent(txtFile);
        addDebugLog(`读取文件内容成功: SRT长度=${srtContent.length}, TXT长度=${txtContent.length}`);
        console.info('读取文件内容成功', { srtContentLength: srtContent.length, txtContentLength: txtContent.length });

        addDebugLog('调用onFilesUploaded...');
        onFilesUploaded({
          audio: audioFile,
          srt: {
            ...srtFile,
            content: srtContent
          },
          txt: {
            ...txtFile,
            content: txtContent
          }
        });
        addDebugLog('onFilesUploaded调用完成');
      } catch (error) {
        addDebugLog(`读取文件内容错误: ${error.message}`);
        console.error('读取文件内容错误:', error, { srtFile, txtFile });
        setError(`读取文件内容时出错: ${error.message}`);
      }
    } else {
      addDebugLog('错误: 请上传所有必要文件');
      setError('请上传所有必要文件');
    }
    
    addDebugLog('setIsLoading(false)');
    setIsLoading(false);
    addDebugLog('表单提交处理完成');
  };
  
  const isFormValid = audioFile && srtFile && txtFile;

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6 transition-shadow hover:shadow-lg">
      <h2 className="text-2xl font-bold text-center text-blue-600 mb-2">上传文件</h2>
      <p className="text-gray-500 text-center mb-6">
        上传音频文件、字幕文件和文字稿，开始同步播放和高亮显示
      </p>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>错误:</strong> {error}
        </div>
      )}
      
      {/* 调试日志面板 */}
      <div className="mb-4 p-3 bg-gray-100 border border-gray-300 rounded">
        <h3 className="text-sm font-medium text-gray-700 mb-2">调试日志:</h3>
        <pre className="text-xs text-gray-600 max-h-32 overflow-y-auto whitespace-pre-wrap">
          {debugLog || '暂无日志...'}
        </pre>
        <button 
          onClick={() => setDebugLog('')}
          className="mt-2 px-2 py-1 text-xs bg-gray-300 hover:bg-gray-400 rounded"
        >
          清空日志
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            音频文件 (MP3/WAV/M4A/AAC/OGG/FLAC)
          </label>
          {isMobile ? (
            <button
              type="button"
              onClick={() => handleFileSelect('audio')}
              disabled={isLoading}
              className={`w-full py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? '处理中...' : '选择音频文件'}
            </button>
          ) : (
            <input
              type="file"
              accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac"
              onChange={e => handleFileInput(e, 'audio')}
              className="w-full py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            />
          )}
          {audioFile && (
            <div className="mt-2">
              <p className="text-sm text-green-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                已选择: {audioFile.name} ({(audioFile.size / (1024 * 1024)).toFixed(2)} MB)
              </p>
              <div className="mt-1 text-xs text-gray-500">
                <p>格式: {audioFile.name.toLowerCase().substring(audioFile.name.lastIndexOf('.'))}</p>
                <p>MIME类型: {audioFile.type || '未知'}</p>
              </div>
            </div>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            字幕文件 (SRT)
          </label>
          {isMobile ? (
            <button
              type="button"
              onClick={() => handleFileSelect('srt')}
              disabled={isLoading}
              className={`w-full py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? '处理中...' : '选择字幕文件'}
            </button>
          ) : (
            <input
              type="file"
              accept=".srt"
              onChange={e => handleFileInput(e, 'srt')}
              className="w-full py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            />
          )}
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
          {isMobile ? (
            <button
              type="button"
              onClick={() => handleFileSelect('txt')}
              disabled={isLoading}
              className={`w-full py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? '处理中...' : '选择文字稿文件'}
            </button>
          ) : (
            <input
              type="file"
              accept=".txt"
              onChange={e => handleFileInput(e, 'txt')}
              className="w-full py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            />
          )}
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
          disabled={!isFormValid || isLoading}
          className={`w-full py-4 px-4 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${isFormValid && !isLoading ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}
        >
          {isLoading ? '处理中...' : '开始播放'}
        </button>
      </form>
    </div>
  );
};

export default FileUploader;
