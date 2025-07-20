/**
 * 识别简历内容
 * @param file 上传的文件对象
 * @returns 识别结果
 */
export async function recognizeResume(file: File): Promise<any> {
  const appcode = 'b38cda4d3a924db7aad47819c827e759'; 
  const url = 'http://jljxjk.market.alicloudapi.com/aliyunapp/aliyunservice.aspx';

  // 支持的扩展名
  const extMap: Record<string, string> = {
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/bmp': '.bmp',
    'image/gif': '.gif',
  };
  const ext = extMap[file.type];
  if (!ext) throw new Error('暂不支持该文件类型');

  // 读取文件为base64
  const base64Content = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // 去掉data:前缀
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // body结构
  const body = `cid=1&content=${encodeURIComponent(base64Content)}&ext=${ext}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'APPCODE ' + appcode,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
    body: body,
  });

  if (!response.ok) {
    throw new Error('简历识别接口请求失败');
  }

  return await response.json();
}
