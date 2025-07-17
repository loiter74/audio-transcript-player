# 故障排除指南

## 安卓模拟器文件路径问题

### 问题描述
在安卓模拟器中，从download文件夹选择文件后点击开始播放时，显示"路径文件不存在"的错误。

### 原因分析
1. **文件路径格式不同**：安卓系统中的文件路径格式与Web环境不同
2. **文件访问权限**：需要正确的权限配置来访问外部存储
3. **文件路径解析**：代码没有正确处理安卓系统的文件路径

### 解决方案

#### 1. 更新文件路径配置
确保 `android/app/src/main/res/xml/file_paths.xml` 包含正确的路径配置：

```xml
<?xml version="1.0" encoding="utf-8"?>
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <external-path name="my_images" path="." />
    <external-path name="downloads" path="Download/" />
    <external-path name="external_files" path="." />
    <cache-path name="my_cache_images" path="." />
    <files-path name="my_files" path="." />
</paths>
```

#### 2. 检查权限配置
确保 `android/app/src/main/AndroidManifest.xml` 包含必要的权限：

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

#### 3. 调试步骤

1. **查看控制台日志**：
   - 打开Chrome开发者工具
   - 查看Console标签页
   - 寻找文件调试信息

2. **检查文件对象**：
   - 确认文件对象包含正确的 `path`、`webPath` 或 `data` 属性
   - 验证文件大小和类型是否正确

3. **测试文件选择**：
   - 尝试选择不同位置的文件
   - 确认文件格式正确（MP3/WAV音频，SRT字幕，TXT文字稿）

#### 4. 常见错误及解决方法

**错误：文件读取失败**
- 解决方法：重新选择文件，确保文件格式正确

**错误：无法获取有效的音频文件URL**
- 解决方法：检查文件是否损坏，尝试使用其他音频文件

**错误：文件验证失败**
- 解决方法：确保选择了正确格式的文件（音频：MP3/WAV，字幕：SRT，文字稿：TXT）

#### 5. 开发调试

应用已集成调试工具，会在控制台输出详细的文件信息：

```javascript
// 查看文件调试信息
debugFileInfo(file, '上下文信息');

// 验证文件
const errors = validateFile(file, 'audio');

// 获取文件URL
const url = getFileUrl(file);
```

#### 6. 重新构建和部署

如果问题仍然存在，请按以下步骤重新构建：

```bash
# 构建Web应用
npm run build

# 同步到安卓
npx cap sync android

# 打开Android Studio
npx cap open android
```

## 音频文件上传问题

### 问题描述
音频文件无法成功上传，或者在安卓模拟器中上传后无法播放。

### 原因分析
1. **文件格式不支持**：某些音频格式可能不被支持
2. **文件大小限制**：过大的文件可能导致处理失败
3. **MIME类型错误**：文件MIME类型可能不正确
4. **数据源问题**：文件数据源（path、webPath、data）可能缺失

### 解决方案

#### 1. 支持的音频格式
应用现在支持以下音频格式：
- MP3 (.mp3)
- WAV (.wav)
- M4A (.m4a)
- AAC (.aac)
- OGG (.ogg)
- FLAC (.flac)

#### 2. 文件大小建议
- **推荐大小**：小于50MB
- **最大大小**：100MB（会有警告）
- **最小大小**：大于1KB

#### 3. 音频文件测试
应用已集成音频文件测试工具，会自动检查：
- 文件格式有效性
- 文件大小合理性
- MIME类型正确性
- 数据源可用性
- 音频URL可播放性

#### 4. 调试步骤

1. **查看音频测试结果**：
   - 选择音频文件后，查看控制台输出的测试结果
   - 检查是否有错误或警告信息

2. **检查文件信息**：
   - 文件名和扩展名
   - 文件大小
   - MIME类型
   - 数据源类型

3. **常见问题排查**：

**问题：音频文件测试失败**
- 检查文件是否损坏
- 确认文件格式是否支持
- 尝试使用其他音频文件

**问题：文件大小异常**
- 确保文件不是空文件
- 检查文件是否完整下载
- 尝试压缩音频文件

**问题：MIME类型错误**
- 某些系统可能无法正确识别MIME类型
- 应用会通过文件扩展名进行验证
- 确保文件扩展名正确

#### 5. 音频文件测试工具

应用集成了专门的音频测试工具：

```javascript
// 测试音频文件
const testResult = await testAudioFile(file);
console.log('测试结果:', testResult);

// 获取文件信息
const fileInfo = getAudioFileInfo(file);
console.log('文件信息:', fileInfo);
```

#### 6. 错误信息说明

**"不是有效的音频文件"**
- 检查文件扩展名是否为支持的格式
- 确认MIME类型是否正确

**"文件大小异常，可能已损坏"**
- 文件小于1KB，可能不是有效的音频文件
- 重新下载或选择其他文件

**"文件缺少有效的数据源"**
- 文件对象缺少path、webPath、data或file属性
- 可能是文件选择器的问题

**"音频URL测试失败"**
- 音频文件可能损坏
- 格式可能不被浏览器支持
- 尝试使用其他音频文件

#### 7. 预防措施

1. **文件格式验证**：确保上传的文件格式正确
2. **文件大小控制**：避免上传过大的文件
3. **错误处理**：提供清晰的错误信息给用户
4. **调试信息**：在开发环境中输出详细的调试信息

### 预防措施

1. **文件格式验证**：确保上传的文件格式正确
2. **路径处理**：使用统一的文件URL获取方法
3. **错误处理**：提供清晰的错误信息给用户
4. **调试信息**：在开发环境中输出详细的调试信息

### 技术支持

如果问题仍然存在，请：
1. 查看控制台错误信息
2. 检查文件格式和大小
3. 尝试使用不同的测试文件
4. 确认安卓模拟器版本和权限设置
5. 查看音频文件测试结果 