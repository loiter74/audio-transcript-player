// 文件调试工具
export const debugFileInfo = (file, context = '') => {
  console.log(`=== 文件调试信息 ${context} ===`);
  console.log('文件对象:', file);
  console.log('文件类型:', typeof file);
  console.log('文件名称:', file?.name);
  console.log('文件大小:', file?.size);
  console.log('文件MIME类型:', file?.type);
  console.log('文件路径:', file?.path);
  console.log('Web路径:', file?.webPath);
  console.log('是否有数据:', !!file?.data);
  console.log('数据长度:', file?.data?.length);
  console.log('是否有文件对象:', !!file?.file);
  console.log('文件对象类型:', file?.file?.constructor?.name);
  console.log('=== 调试结束 ===');
};

export const validateFile = (file, expectedType) => {
  const errors = [];
  
  if (!file) {
    errors.push('文件对象为空');
    return errors;
  }
  
  if (!file.name) {
    errors.push('文件名称缺失');
  }
  
  if (!file.size || file.size === 0) {
    errors.push('文件大小异常');
  }
  
  if (expectedType === 'audio') {
    // 音频文件验证：检查扩展名或MIME类型
    const hasValidExtension = file.name?.match(/\.(mp3|wav|m4a|aac|ogg|flac)$/i);
    const hasValidMimeType = file.type?.startsWith('audio/');
    
    if (!hasValidExtension && !hasValidMimeType) {
      errors.push('不是有效的音频文件（支持格式：MP3, WAV, M4A, AAC, OGG, FLAC）');
    }
    
    // 检查文件大小（音频文件通常不会太小）
    if (file.size && file.size < 1024) { // 小于1KB可能是损坏的文件
      errors.push('音频文件大小异常，可能已损坏');
    }
  } else if (expectedType === 'srt') {
    if (!file.name?.endsWith('.srt')) {
      errors.push('不是有效的SRT文件');
    }
  } else if (expectedType === 'txt') {
    if (!file.name?.endsWith('.txt')) {
      errors.push('不是有效的TXT文件');
    }
  }
  
  // 检查是否有可用的数据源
  const hasValidDataSource = file.data || file.webPath || file.path || file.file;
  if (!hasValidDataSource) {
    errors.push('文件缺少有效的数据源（data、webPath、path或file）');
  }
  
  return errors;
};

export const getFileUrl = (file) => {
  if (file.path) {
    return file.path;
  }
  if (file.webPath) {
    return file.webPath;
  }
  if (file.data) {
    return `data:${file.type};base64,${file.data}`;
  }
  if (file.file) {
    return URL.createObjectURL(file.file);
  }
  return null;
}; 