// 音频文件测试工具
export const testAudioFile = async (file) => {
  const results = {
    isValid: false,
    errors: [],
    warnings: [],
    info: {}
  };

  try {
    console.log('开始测试音频文件:', file.name);

    // 基本信息检查
    results.info.name = file.name;
    results.info.size = file.size;
    results.info.type = file.type;
    results.info.sizeInMB = (file.size / (1024 * 1024)).toFixed(2);

    // 文件大小检查
    if (file.size === 0) {
      results.errors.push('文件大小为0，文件可能损坏');
    } else if (file.size < 1024) {
      results.errors.push('文件太小，可能不是有效的音频文件');
    } else if (file.size > 100 * 1024 * 1024) { // 100MB
      results.warnings.push('文件较大，可能影响加载速度');
    }

    // 文件扩展名检查
    const validExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension)) {
      results.errors.push(`不支持的音频格式: ${fileExtension}`);
    } else {
      results.info.extension = fileExtension;
    }

    // MIME类型检查
    if (file.type) {
      if (!file.type.startsWith('audio/')) {
        results.warnings.push(`MIME类型不是audio/: ${file.type}`);
      } else {
        results.info.mimeType = file.type;
      }
    } else {
      results.warnings.push('没有MIME类型信息');
    }

    // 数据源检查
    const hasData = !!file.data;
    const hasPath = !!file.path;
    const hasWebPath = !!file.webPath;
    const hasFile = !!file.file;

    results.info.dataSources = {
      hasData,
      hasPath,
      hasWebPath,
      hasFile
    };

    if (!hasData && !hasPath && !hasWebPath && !hasFile) {
      results.errors.push('文件缺少有效的数据源');
    }

    // 尝试创建音频URL（不进行实际测试）
    try {
      let audioUrl = null;
      
      if (file.path) {
        audioUrl = file.path;
        results.info.urlSource = 'path';
      } else if (file.webPath) {
        audioUrl = file.webPath;
        results.info.urlSource = 'webPath';
      } else if (file.data) {
        audioUrl = `data:${file.type};base64,${file.data}`;
        results.info.urlSource = 'data';
      } else if (file.file) {
        audioUrl = URL.createObjectURL(file.file);
        results.info.urlSource = 'file';
      }

      if (audioUrl) {
        results.info.audioUrl = audioUrl;
        results.isValid = true;
        console.log('音频URL创建成功:', audioUrl.substring(0, 100) + '...');
      } else {
        results.errors.push('无法创建有效的音频URL');
      }
    } catch (error) {
      results.errors.push(`音频URL创建失败: ${error.message}`);
    }

  } catch (error) {
    results.errors.push(`测试过程中出错: ${error.message}`);
  }

  console.log('音频文件测试结果:', results);
  return results;
};

export const getAudioFileInfo = (file) => {
  return {
    name: file.name,
    size: file.size,
    sizeInMB: (file.size / (1024 * 1024)).toFixed(2),
    type: file.type,
    extension: file.name.toLowerCase().substring(file.name.lastIndexOf('.')),
    hasData: !!file.data,
    hasPath: !!file.path,
    hasWebPath: !!file.webPath,
    hasFile: !!file.file
  };
}; 