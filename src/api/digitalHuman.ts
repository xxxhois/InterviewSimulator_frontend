
// 数字人API配置
const DIGITAL_HUMAN_CONFIG = {
  appId: "5945676c",
  apiKey: "203214509c072eca540be4c80bf533fa",
  apiSecret: "NjRjYmJhOTcxYzE0NzJhZTJhMDc4Y2E0",
  baseUrl: "wss://sparkos.xfyun.cn/v1/openapi/chat",
  scene: "sos_app"
};

// 数字人响应类型定义
export interface DigitalHumanResponse {
  header: {
    code: number;
    message: string;
    sid: string;
    status: number;
  };
  payload?: {
    tts?: {
      audio: string;
      status: number;
      encoding: string;
      sample_rate: number;
      channels: number;
      bit_depth: number;
      frame_size: number;
    };
    nlp?: {
      text: string;
      encoding: string;
      compress: string;
      format: string;
    };
    event?: {
      text: string;
      encoding: string;
      compress: string;
      format: string;
    };
  };
}

// 数字人请求参数
export interface DigitalHumanRequest {
  text: string;
  voiceConfig?: {
    vcn?: string; // 发音人
    speed?: number; // 语速 0-100
    volume?: number; // 音量 0-100
    pitch?: number; // 音调 0-100
  };
  audioConfig?: {
    encoding?: string; // 音频编码格式
    sample_rate?: number; // 采样率
    channels?: number; // 声道数
    bit_depth?: number; // 位深
  };
}

// 数字人音频数据
export interface DigitalHumanAudio {
  audioData: ArrayBuffer;
  format: string;
  sampleRate: number;
  channels: number;
}

// HMAC-SHA256签名计算
async function hmacSha256(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const messageData = encoder.encode(message);
  
  // 导入密钥
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  // 计算签名
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  
  // 转换为base64
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

// 鉴权URL构建
async function assembleAuthUrl(requestUrl: string, method: string = "GET"): Promise<string> {
  const url = new URL(requestUrl);
  const host = url.host;
  const path = url.pathname;
  
  // 生成RFC1123格式的时间戳
  const now = new Date();
  const date = now.toUTCString();
  
  // 构建签名原始字符串
  const signatureOrigin = `host: ${host}\ndate: ${date}\n${method} ${path} HTTP/1.1`;
  
  // 使用HMAC-SHA256计算签名
  const signatureSha = await hmacSha256(DIGITAL_HUMAN_CONFIG.apiSecret, signatureOrigin);
  
  const authorizationOrigin = `api_key="${DIGITAL_HUMAN_CONFIG.apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signatureSha}"`;
  const authorization = btoa(authorizationOrigin);
  
  // 构建查询参数
  const params = new URLSearchParams({
    host,
    date,
    authorization
  });
  
  return `${requestUrl}?${params.toString()}`;
}

// WebSocket连接管理类
export class DigitalHumanWebSocket {
  private ws: WebSocket | null = null;
  private isConnected: boolean = false;
  private audioChunks: Uint8Array[] = [];
  private onAudioReceived?: (audio: DigitalHumanAudio) => void;
  private onError?: (error: string) => void;
  private onClose?: () => void;

  constructor(
    onAudioReceived?: (audio: DigitalHumanAudio) => void,
    onError?: (error: string) => void,
    onClose?: () => void
  ) {
    this.onAudioReceived = onAudioReceived;
    this.onError = onError;
    this.onClose = onClose;
  }

  // 连接WebSocket
  async connect(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const authUrl = await assembleAuthUrl(DIGITAL_HUMAN_CONFIG.baseUrl);
        this.ws = new WebSocket(authUrl);
        
        this.ws.onopen = () => {
          console.log('数字人WebSocket连接已建立');
          this.isConnected = true;
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };
        
        this.ws.onerror = (error) => {
          console.error('数字人WebSocket错误:', error);
          this.isConnected = false;
          this.onError?.('WebSocket连接错误');
          reject(error);
        };
        
        this.ws.onclose = () => {
          console.log('数字人WebSocket连接已关闭');
          this.isConnected = false;
          this.onClose?.();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  // 处理接收到的消息
  // 修改handleMessage方法来正确处理Blob和文本数据
private async handleMessage(data: any) {
  try {
    let jsonData: string;
    
    // 检查数据类型
    if (data instanceof Blob) {
      // 如果是Blob，转换为文本
      jsonData = await data.text();
      console.log('收到Blob数据，转换为文本:', jsonData);
    } else if (typeof data === 'string') {
      // 如果是字符串，直接使用
      jsonData = data;
      console.log('收到文本数据:', jsonData);
    } else {
      console.error('未知数据类型:', typeof data, data);
      return;
    }
    
    const response: DigitalHumanResponse = JSON.parse(jsonData);
    
    // 检查响应状态码
    if (response.header.code === 0) {
      // 成功响应
      console.log('数字人API成功响应:', response.header.message);
      
      // 如果有payload，处理具体数据
      if (response.payload) {
        // 处理TTS音频数据
        if (response.payload.tts) {
          const tts = response.payload.tts;
          if (tts.audio && tts.audio.length > 0) {
            // 解码base64音频数据
            const audioBytes = this.base64ToUint8Array(tts.audio);
            this.audioChunks.push(audioBytes);
            
            // 检查是否为最后一帧
            if (tts.status === 2) {
              this.combineAudioChunks();
            }
          }
        }
        
        // 处理NLP文本数据
        if (response.payload.nlp) {
          console.log('NLP响应:', response.payload.nlp.text);
        }
        
        // 处理事件数据
        if (response.payload.event) {
          console.log('事件响应:', response.payload.event.text);
        }
      }
    } else {
      // 错误响应
      console.error('数字人API错误:', response.header);
      this.onError?.(response.header.message);
    }
  } catch (error) {
    console.error('解析数字人响应失败:', error);
    console.error('原始数据:', data);
    this.onError?.('解析响应失败');
  }
}

  // 发送文本转语音请求
  sendTextToSpeech(request: DigitalHumanRequest): void {
    if (!this.isConnected || !this.ws) {
      throw new Error('WebSocket未连接');
    }

    const data = {
      header: {
        app_id: DIGITAL_HUMAN_CONFIG.appId,
        uid: "user_" + Date.now(),
        status: 0,
        stmid: "1",
        scene: DIGITAL_HUMAN_CONFIG.scene
        // 移除额外的属性：msc_lat, msc_lng, interact_mode
      },
      parameter: {
        iat: {
          iat: {
            encoding: "utf8",
            compress: "raw",
            format: "json"
          }
        },
        nlp: {
          nlp: {
            encoding: "utf8",
            compress: "raw",
            format: "json"
          },
          new_session: "global"
        },
        tts: {
          vcn: request.voiceConfig?.vcn || "x5_lingxiaoyue_flow",
          speed: request.voiceConfig?.speed || 50,
          volume: request.voiceConfig?.volume || 50,
          pitch: request.voiceConfig?.pitch || 50,
          tts: {
            encoding: request.audioConfig?.encoding || "lame",
            sample_rate: request.audioConfig?.sample_rate || 16000,
            channels: request.audioConfig?.channels || 1,
            bit_depth: request.audioConfig?.bit_depth || 16,
            frame_size: 0
          }
        }
      },
      payload: {
        text: {
          status: 2,
          text: btoa(unescape(encodeURIComponent(request.text))),
          encoding: "utf8"
        }
      }
    };

    console.log('发送文本转语音请求:', data);
    this.ws.send(JSON.stringify(data));
  }

  // 合并音频块
  private combineAudioChunks(): void {
    if (this.audioChunks.length === 0) return;
    
    // 计算总长度
    const totalLength = this.audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    
    // 合并所有音频块
    const combinedAudio = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of this.audioChunks) {
      combinedAudio.set(chunk, offset);
      offset += chunk.length;
    }
    
    // 创建音频对象 - 根据实际接收到的格式
    const audio: DigitalHumanAudio = {
      audioData: combinedAudio.buffer,
      format: 'raw', // 根据API响应，格式是raw
      sampleRate: 16000,
      channels: 1
    };
    
    // 回调音频数据
    this.onAudioReceived?.(audio);
    
    // 清空音频块
    this.audioChunks = [];
  }

  // Base64转Uint8Array
  private base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  // 关闭连接
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  // 检查连接状态
  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

// 数字人服务类
export class DigitalHumanService {
  private wsClient: DigitalHumanWebSocket | null = null;

  // 初始化数字人服务
  async initialize(
    onAudioReceived?: (audio: DigitalHumanAudio) => void,
    onError?: (error: string) => void,
    onClose?: () => void
  ): Promise<void> {
    this.wsClient = new DigitalHumanWebSocket(onAudioReceived, onError, onClose);
    await this.wsClient.connect();
  }

  // 文本转语音
  async textToSpeech(request: DigitalHumanRequest): Promise<void> {
    if (!this.wsClient) {
      throw new Error('数字人服务未初始化');
    }
    
    this.wsClient.sendTextToSpeech(request);
  }

  // 播放音频
//   async playAudio(audio: DigitalHumanAudio): Promise<void> {
//     try {
//       // 创建AudioContext
//       const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
//       // 对于raw格式的音频，需要特殊处理
//       if (audio.format === 'raw') {
//         // 将ArrayBuffer转换为Float32Array
//         const audioData = new Int16Array(audio.audioData);
//         const floatData = new Float32Array(audioData.length);
        
//         // 转换为-1到1的浮点数
//         for (let i = 0; i < audioData.length; i++) {
//           floatData[i] = audioData[i] / 32768.0;
//         }
        
//         // 创建AudioBuffer
//         const audioBuffer = audioContext.createBuffer(audio.channels, floatData.length, audio.sampleRate);
//         audioBuffer.copyToChannel(floatData, 0);
        
//         // 创建音频源
//         const source = audioContext.createBufferSource();
//         source.buffer = audioBuffer;
//         source.connect(audioContext.destination);
        
//         // 播放音频
//         source.start(0);
//       } else {
//         // 对于其他格式，使用默认解码
//         const audioBuffer = await audioContext.decodeAudioData(audio.audioData);
//         const source = audioContext.createBufferSource();
//         source.buffer = audioBuffer;
//         source.connect(audioContext.destination);
//         source.start(0);
//       }
      
//       console.log('开始播放数字人音频');
//     } catch (error) {
//       console.error('播放音频失败:', error);
//       throw error;
//     }
//   }

  // 关闭服务
  disconnect(): void {
    if (this.wsClient) {
      this.wsClient.disconnect();
      this.wsClient = null;
    }
  }

  // 获取连接状态
  getConnectionStatus(): boolean {
    return this.wsClient?.getConnectionStatus() || false;
  }
}

// 创建数字人服务实例
export const digitalHumanService = new DigitalHumanService();

// 导出便捷函数
export const createDigitalHuman = () => new DigitalHumanService();

/*
使用示例：

// 1. 基本使用
import { digitalHumanService } from '@/api/digitalHuman';

// 初始化数字人服务
await digitalHumanService.initialize(
  (audio) => {
    // 处理接收到的音频数据
    console.log('收到音频数据:', audio);
  },
  (error) => {
    // 处理错误
    console.error('数字人错误:', error);
  },
  () => {
    // 连接关闭回调
    console.log('数字人连接已关闭');
  }
);

// 发送文本转语音请求
await digitalHumanService.textToSpeech({
  text: '你好，我是数字人面试官！',
  voiceConfig: {
    vcn: 'x5_lingxiaoyue_flow', // 女性发音人
    speed: 50, // 语速
    volume: 50, // 音量
    pitch: 50 // 音调
  }
});

// 2. 在React组件中使用
const [isConnected, setIsConnected] = useState(false);
const [isSpeaking, setIsSpeaking] = useState(false);

useEffect(() => {
  const initDigitalHuman = async () => {
    try {
      await digitalHumanService.initialize(
        (audio) => {
          setIsSpeaking(true);
          digitalHumanService.playAudio(audio).finally(() => {
            setIsSpeaking(false);
          });
        },
        (error) => {
          console.error('数字人错误:', error);
          setIsConnected(false);
        },
        () => {
          setIsConnected(false);
        }
      );
      setIsConnected(true);
    } catch (error) {
      console.error('初始化失败:', error);
    }
  };

  initDigitalHuman();
  
  return () => {
    digitalHumanService.disconnect();
  };
}, []);

// 3. 发送文本
const handleSendText = async (text: string) => {
  if (!isConnected) return;
  
  try {
    await digitalHumanService.textToSpeech({
      text,
      voiceConfig: {
        vcn: 'x5_lingxiaoyue_flow',
        speed: 50,
        volume: 50,
        pitch: 50
      }
    });
  } catch (error) {
    console.error('发送失败:', error);
  }
};
*/
