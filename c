import re
import sys

def split_text(input_path, output_path):
    with open(input_path, 'r', encoding='utf-8') as f:
        text = f.read()
    # 正则分割，保留标点
    sentences = re.split(r'(，|。|；|：|！|？|、|\n)', text)
    lines = []
    current = ''
    for part in sentences:
        current += part
        if part in '，。；：！？\n':
            lines.append(current.strip())
            current = ''
    if current.strip():
        lines.append(current.strip())
    # 移除空行
    lines = [line for line in lines if line]
    
    # 删除除了问号和感叹号以外的所有标点符号
    processed_lines = []
    for line in lines:
        # 保留问号和感叹号，删除其他标点符号
        processed_line = re.sub(r'[，。；：、]', '', line)
        processed_lines.append(processed_line)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        for line in processed_lines:
            f.write(line + '\n')
    print(f"已生成 {output_path}")

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("用法: python split_subtitle.py 输入文件.txt 输出文件.txt")
    else:
        split_text(sys.argv[1], sys.argv[2])