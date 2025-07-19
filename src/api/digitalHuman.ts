// 数字人API配置
const DIGITAL_HUMAN_CONFIG = {
    appId: "5945676c",
    apiKey: "203214509c072eca540be4c80bf533fa",
    apiSecret: "NjRjYmJhOTcxYzE0NzJhZTJhMDc4Y2E0",
    baseUrl: "wss://avatar.cn-huadong-1.xf-yun.com/v1/interact",
    anchorId: "110332017",
    vcn: "x4_lingxiaoqi_oral"
  };
  
  // 自定义异常类
  class BreakException extends Error {
    constructor(message: string = "Break exception") {
      super(message);
      this.name = "BreakException";
    }
  }
  
  // 数字人响应类型定义
  export interface DigitalHumanResponse {
    header: {
      code: number;
      message: string;
      request_id?: string;
      ctrl?: string;
    };
    payload?: {
      avatar?: {
        error_code?: number;
        event_type?: string;
        stream_url?: string;
        video?: string;
        encoding?: string;
        width?: number;
        height?: number;
      };
      tts?: {
        audio?: string;
        status?: number;
        encoding?: string;
      };
    };
  }
  
  // 数字人请求参数
  export interface DigitalHumanRequest {
    text: string;
    voiceConfig?: {
      vcn?: string;
    };
  }
  
  // 数字人音频数据
  export interface DigitalHumanAudio {
    audioData: ArrayBuffer;
    format: string;
    sampleRate: number;
    channels: number;
  }
  
  // 数字人视频数据
  export interface DigitalHumanVideo {
    videoUrl: string;
    width: number;
    height: number;
  }
  
  // HMAC-SHA256签名计算
  async function hmacSha256(key: string, message: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const messageData = encoder.encode(message);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  }
  
  // 鉴权URL构建
  async function assembleAuthUrl(requestUrl: string, method: string = "GET"): Promise<string> {
    const url = new URL(requestUrl);
    const host = url.host;
    const path = url.pathname;
    
    const now = new Date();
    const date = now.toUTCString();
    
    const signatureOrigin = `host: ${host}\ndate: ${date}\n${method} ${path} HTTP/1.1`;
    const signatureSha = await hmacSha256(DIGITAL_HUMAN_CONFIG.apiSecret, signatureOrigin);
    
    const authorizationOrigin = `api_key="${DIGITAL_HUMAN_CONFIG.apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signatureSha}"`;
    const authorization = btoa(authorizationOrigin);
    
    const params = new URLSearchParams({
      host,
      date,
      authorization
    });
    
    return `${requestUrl}?${params.toString()}`;
  }
  
  // 消息队列类
  class MessageQueue {
    private queue: string[] = [];
    private maxSize: number;
  
    constructor(maxSize: number = 100) {
      this.maxSize = maxSize;
    }
  
    put(message: string): boolean {
      if (this.queue.length >= this.maxSize) {
        return false;
      }
      this.queue.push(message);
      return true;
    }
  
    get(): string | null {
      return this.queue.shift() || null;
    }
  
    isEmpty(): boolean {
      return this.queue.length === 0;
    }
  
    size(): number {
      return this.queue.length;
    }
  }
  
  // 数字人WebSocket类
  export class AvatarWebSocket {
    private ws: WebSocket | null = null;
    private appId: string = DIGITAL_HUMAN_CONFIG.appId;
    private vcn: string = DIGITAL_HUMAN_CONFIG.vcn;
    private anchorId: string = DIGITAL_HUMAN_CONFIG.anchorId;
    private dataList: MessageQueue;
    private status: boolean = true;
    private linkConnected: boolean = false;
    private avatarLinked: boolean = false;
    private terminated: boolean = false;
    private sendMessageInterval: NodeJS.Timeout | null = null;
    private pingInterval: NodeJS.Timeout | null = null;
  
    // 回调函数
    private onAudioReceived?: (audio: DigitalHumanAudio) => void;
    private onVideoReceived?: (video: DigitalHumanVideo) => void;
    private onError?: (error: string) => void;
    private onClose?: () => void;
    private onAvatarConnected?: (streamUrl: string, fullMessage?: any) => void;
  
    constructor(
      onAudioReceived?: (audio: DigitalHumanAudio) => void,
      onVideoReceived?: (video: DigitalHumanVideo) => void,
      onError?: (error: string) => void,
      onClose?: () => void,
      onAvatarConnected?: (streamUrl: string, fullMessage?: any) => void
    ) {
      this.dataList = new MessageQueue(100);
      this.onAudioReceived = onAudioReceived;
      this.onVideoReceived = onVideoReceived;
      this.onError = onError;
      this.onClose = onClose;
      this.onAvatarConnected = onAvatarConnected;
    }
  
    // 启动WebSocket连接
    async start(): Promise<void> {
      try {
        const authUrl = await assembleAuthUrl(DIGITAL_HUMAN_CONFIG.baseUrl);
        console.log('连接数字人WebSocket:', authUrl);
        
        this.ws = new WebSocket(authUrl);
        
        this.ws.onopen = () => {
          console.log('数字人WebSocket连接已建立');
          this.onOpen();
        };
        
        this.ws.onmessage = (event) => {
          this.onMessage(event.data);
        };
        
        this.ws.onerror = (error) => {
          console.error('数字人WebSocket错误:', error);
          this.onError?.(`WebSocket错误: ${error}`);
        };
        
        this.ws.onclose = (event) => {
          console.log('数字人WebSocket连接已关闭', event.code, event.reason);
          this.onClose?.();
        };
      } catch (error) {
        console.error('启动WebSocket失败:', error);
        this.onError?.(`启动失败: ${error}`);
      }
    }
  
    // 停止WebSocket连接
    stop(): void {
      console.log('停止数字人WebSocket连接');
      this.status = false;
      this.terminated = true;
      
      if (this.sendMessageInterval) {
        clearInterval(this.sendMessageInterval);
        this.sendMessageInterval = null;
      }
      
      if (this.pingInterval) {
        clearInterval(this.pingInterval);
        this.pingInterval = null;
      }
      
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
    }
  
    // WebSocket连接打开回调
    private onOpen(): void {
      console.log('WebSocket连接已打开');
      this.linkConnected = true;
      this.connectAvatar();
      this.startSendMessage();
    }
  
    // 处理接收到的消息
    private async onMessage(data: any): Promise<void> {
      try {
        let message: string;
        
        if (data instanceof Blob) {
          message = await data.text();
        } else {
          message = data;
        }
        
        console.log('收到消息:', message);
        this.receivedMessage(message);
      } catch (error) {
        console.error('处理消息失败:', error);
      }
    }
  
    // 发送消息
    private send(message: string): void {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log('发送消息:', message);
        this.ws.send(message);
      } else {
        console.warn('WebSocket未连接，无法发送消息');
      }
    }
  
    // 开始发送消息循环
    private startSendMessage(): void {
      this.sendMessageInterval = setInterval(() => {
        if (this.status && !this.terminated && this.linkConnected) {
          try {
            if (this.avatarLinked) {
              const task = this.dataList.get();
              if (task) {
                const timestamp = new Date().toLocaleString();
                console.log(`${timestamp} 发送消息: ${task}`);
                this.send(task);
              } else {
                // 发送ping消息
                this.send(this.getPingMsg());
              }
            }
          } catch (error) {
            console.error('发送消息失败:', error);
          }
        }
      }, 5000); // 每5秒检查一次
    }
  
    // 发送驱动文本
    sendDriverText(driverText: string): void {
      try {
        const textMsg = {
          header: {
            app_id: this.appId,
            request_id: this.generateRequestId(),
            ctrl: "text_driver"
          },
          parameter: {
            tts: {
              vcn: this.vcn
            },
            avatar_dispatch: {
              interactive_mode: 0
            }
          },
          payload: {
            text: {
              content: driverText
            }
          }
        };
        
        this.dataList.put(JSON.stringify(textMsg));
        console.log('添加文本消息到队列:', driverText);
      } catch (error) {
        console.error('发送驱动文本失败:', error);
      }
    }
  
    // 连接数字人
    private connectAvatar(): void {
      try {
        const startMsg = {
          header: {
            app_id: this.appId,
            request_id: this.generateRequestId(),
            ctrl: "start"
          },
          parameter: {
            tts: {
              vcn: this.vcn
            },
            avatar: {
              stream: {
                protocol: "xrtc"
              },
              avatar_id: this.anchorId
            }
          }
        };
        
        const timestamp = new Date().toLocaleString();
        console.log(`${timestamp} 发送启动请求: ${JSON.stringify(startMsg)}`);
        this.send(JSON.stringify(startMsg));
      } catch (error) {
        console.error('连接数字人失败:', error);
      }
    }
  
    // 生成ping消息
    private getPingMsg(): string {
      const pingMsg = {
        header: {
          app_id: this.appId,
          request_id: this.generateRequestId(),
          ctrl: "ping"
        }
      };
      return JSON.stringify(pingMsg);
    }
  
    // 生成请求ID
    private generateRequestId(): string {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
  
    // 处理接收到的消息
    private receivedMessage(message: string): void {
      try {
        const data: DigitalHumanResponse = JSON.parse(message);
        
        if (data.header.code !== 0) {
          this.status = false;
          console.error('收到错误消息:', message);
          this.onError?.(`API错误: ${data.header.message}`);
          return;
        }
  
        // 处理数字人相关消息
        if (data.payload?.avatar) {
          const avatar = data.payload.avatar;
          
          // 处理错误
          if (avatar.error_code !== undefined && avatar.error_code !== 0) {
            console.error('数字人错误:', avatar);
            this.onError?.(`数字人错误: ${avatar.error_code}`);
            return;
          }
  
          // 处理流信息
          if (avatar.event_type === 'stream_info') {
            this.avatarLinked = true;
            console.log('数字人WebSocket连接成功:', message);
            if (avatar.stream_url) {
              console.log('流地址:', avatar.stream_url);
              this.onAvatarConnected?.(avatar.stream_url, data);
            }
          }
  
          // 处理视频数据
          if (avatar.event_type === 'video' && avatar.video) {
            this.handleVideoData(avatar);
          }
  
          // 处理停止事件
          if (avatar.event_type === 'stop') {
            console.log('数字人停止事件');
            throw new BreakException('数字人停止');
          }
  
          // 处理pong响应
          if (avatar.event_type === 'pong') {
            console.log('收到pong响应');
          }
        }
  
        // 处理TTS音频数据
        if (data.payload?.tts) {
          this.handleAudioData(data.payload.tts);
        }
  
      } catch (error) {
        if (error instanceof BreakException) {
          console.log('收到停止信号但继续运行');
        } else {
          console.error('处理消息失败:', error);
        }
      }
    }
  
    // 处理音频数据
    private handleAudioData(tts: any): void {
      if (tts.audio && tts.audio.length > 0) {
        console.log('=== TTS音频数据 ===');
        console.log('状态:', tts.status);
        console.log('编码:', tts.encoding);
        console.log('音频长度:', tts.audio.length);
        
        try {
          const audioBytes = this.base64ToUint8Array(tts.audio);
          console.log('解码后音频大小:', audioBytes.length, '字节');
          
          const audio: DigitalHumanAudio = {
            audioData: audioBytes.buffer as ArrayBuffer,
            format: tts.encoding || 'raw',
            sampleRate: 16000,
            channels: 1
          };
          
          this.onAudioReceived?.(audio);
        } catch (error) {
          console.error('处理音频数据失败:', error);
        }
      }
    }
  
    // 处理视频数据
    private handleVideoData(avatar: any): void {
      if (avatar.video && avatar.video.length > 0) {
        console.log('=== 数字人视频数据 ===');
        console.log('编码:', avatar.encoding);
        console.log('尺寸:', avatar.width, 'x', avatar.height);
        console.log('视频长度:', avatar.video.length);
        
        try {
          const videoBytes = this.base64ToUint8Array(avatar.video);
          const videoBlob = new Blob([videoBytes], { type: 'video/mp4' });
          const videoUrl = URL.createObjectURL(videoBlob);
          
          const video: DigitalHumanVideo = {
            videoUrl,
            width: avatar.width || 512,
            height: avatar.height || 512
          };
          
          this.onVideoReceived?.(video);
        } catch (error) {
          console.error('处理视频数据失败:', error);
        }
      }
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
  
    // 获取连接状态
    getConnectionStatus(): boolean {
      return this.status && this.linkConnected && this.avatarLinked;
    }
  
    // 获取数字人连接状态
    getAvatarLinked(): boolean {
      return this.avatarLinked;
    }
  }
  
  // 数字人服务类
  export class DigitalHumanService {
    private wsClient: AvatarWebSocket | null = null;
  
    async initialize(
      onAudioReceived?: (audio: DigitalHumanAudio) => void,
      onVideoReceived?: (video: DigitalHumanVideo) => void,
      onError?: (error: string) => void,
      onClose?: () => void,
      onAvatarConnected?: (streamUrl: string, fullMessage?: any) => void
    ): Promise<void> {
      this.wsClient = new AvatarWebSocket(
        onAudioReceived,
        onVideoReceived,
        onError,
        onClose,
        onAvatarConnected
      );
      
      await this.wsClient.start();
    }
  
    async textToSpeech(request: DigitalHumanRequest): Promise<void> {
      if (!this.wsClient) {
        throw new Error('数字人服务未初始化');
      }
      
      if (!this.wsClient.getConnectionStatus()) {
        throw new Error('数字人未连接');
      }
      
      this.wsClient.sendDriverText(request.text);
    }
  
    // 播放音频
    async playAudio(audio: DigitalHumanAudio): Promise<void> {
      return new Promise((resolve, reject) => {
        try {
          console.log(`=== 开始播放音频 ===`);
          console.log(`格式: ${audio.format}`);
          console.log(`大小: ${audio.audioData.byteLength} 字节`);
          console.log(`采样率: ${audio.sampleRate}`);
          console.log(`声道数: ${audio.channels}`);
          
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          
          if (audio.format === 'mp3' || audio.format === 'lame') {
            console.log('使用MP3解码播放');
            audioContext.decodeAudioData(audio.audioData).then(audioBuffer => {
              const source = audioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(audioContext.destination);
              
              source.onended = () => {
                console.log('MP3音频播放完成');
                resolve();
              };
              
              source.start(0);
              console.log('MP3音频开始播放');
            }).catch(error => {
              console.error('MP3解码失败:', error);
              reject(error);
            });
          } else {
            console.log('使用Raw格式播放');
            const audioData = new Int16Array(audio.audioData);
            const floatData = new Float32Array(audioData.length);
            
            for (let i = 0; i < audioData.length; i++) {
              floatData[i] = audioData[i] / 32768.0;
            }
            
            const audioBuffer = audioContext.createBuffer(audio.channels, floatData.length, audio.sampleRate);
            audioBuffer.copyToChannel(floatData, 0);
            
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            
            source.onended = () => {
              console.log('Raw音频播放完成');
              resolve();
            };
            
            source.start(0);
            console.log('Raw音频开始播放');
          }
        } catch (error) {
          console.error('播放音频失败:', error);
          reject(error);
        }
      });
    }
  
    disconnect(): void {
      if (this.wsClient) {
        this.wsClient.stop();
        this.wsClient = null;
      }
    }
  
    getConnectionStatus(): boolean {
      return this.wsClient?.getConnectionStatus() || false;
    }
  
    getAvatarLinked(): boolean {
      return this.wsClient?.getAvatarLinked() || false;
    }
  }
  
  // 创建数字人服务实例
  export const createDigitalHuman = () => new DigitalHumanService();