'use client';

import { createDigitalHuman, DigitalHumanAudio, DigitalHumanRequest, DigitalHumanVideo } from '@/api/digitalHuman';
import { runCode } from '@/api/code';
import { RTCPlayer } from '@/lib/rtcplayer';
import { Dialog, Transition } from '@headlessui/react';
import dynamic from 'next/dynamic';
import { Fragment, useEffect, useRef, useState } from 'react';
import { DIGITAL_HUMAN_CONFIG } from '@/api/digitalHuman';
import { useSearchParams, useRouter } from 'next/navigation';


// 动态引入 Monaco Editor，避免 SSR 问题
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

// 预留：当前问题、提示、历史、视频流等接口
const mockQuestion = {
  title: '请实现一个斐波那契数列函数',
  hint: '递归或动态规划均可，注意边界条件。',
};

const languageOptions = [
  { label: 'Plain Text', value: 'plaintext' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'Python', value: 'python' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'Java', value: 'java' },
];

function downsampleBuffer(buffer: Float32Array, sampleRate: number, outRate: number): Float32Array {
  if (outRate === sampleRate) return buffer;
  const sampleRateRatio = sampleRate / outRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    let accum = 0, count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = accum / count;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

export default function InterviewRoom() {
  const router = useRouter();
  // 使用 next/navigation 提供的 useSearchParams 钩子获取参数
  const searchParams = useSearchParams();

  const interview_id = searchParams ? searchParams.get('id') : null;
  const resume_id = searchParams ? searchParams.get('resume_id') : null;
  // 代码内容、语言、弹窗状态
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('plaintext');
  const [historyVisible, setHistoryVisible] = useState(false);
  const [historyList, setHistoryList] = useState<{ question: string; answer: string }[]>([]);
  const [transcript, setTranscript] = useState('');
  const [question, setQuestion] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  // 数字人相关状态
  const [isDigitalHumanConnected, setIsDigitalHumanConnected] = useState(false);
  const [isVideoConnected, setIsVideoConnected] = useState(false);
  const [isDigitalHumanSpeaking, setIsDigitalHumanSpeaking] = useState(false);
  const [digitalHumanText, setDigitalHumanText] = useState('');
  const [streamInfo, setStreamInfo] = useState<any>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);
  const [isAudioActivated, setIsAudioActivated] = useState(false);
  const [isDigitalHumanInitializing, setIsDigitalHumanInitializing] = useState(false);

  // 视频/音频/WebSocket相关ref
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const digitalHumanContainerRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const resampleBufferRef: React.MutableRefObject<number[]> = useRef([]);
  
  // 视频帧采集相关ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoFrameIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // RTCPlayer实例
  const rtcPlayerRef = useRef<InstanceType<typeof RTCPlayer> | null>(null);

  // 数字人服务实例
  const digitalHumanService = useRef(createDigitalHuman());

  // 采集与转写
  const startCollect = async () => {

    setTranscript('转写内容将实时显示在这里...');
    setQuestion('面试官问题将显示在这里');
    // 获取音视频流
    const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = localStream;
    if (videoRef.current) {
      (videoRef.current as HTMLVideoElement).srcObject = localStream as MediaStream;
    }
    // 连接WebSocket
    let token = localStorage.getItem('auth_token') || '';
    console.log('token', token);
    //let ws_scheme = window.location.protocol === "https:" ? "wss" : "ws";
    let ws_url = 'ws://localhost:8000/ws/webrtc/?token=' + token;
    console.log('ws_url', ws_url);
    const ws = new window.WebSocket(ws_url);
    wsRef.current = ws;
          ws.onopen = () => {
        setIsRecording(true);
        startAudioProcessing();
        startVideoFrameCapture(); // 启动视频帧采集
        
        // 发送创建流消息
        console.log('发送创建流消息...');
        ws.send(JSON.stringify({
          "type": "create_stream",
          "title": "面试视频流",
          "description": "实时面试",
          "interview_id": interview_id,
          "resume_id": resume_id
        }));
      };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('收到消息', data);
        if (data.type === 'asr_result') {
          let text = data.text;
          // 尝试提取所有中文
          try {
            const obj = typeof text === 'string' ? JSON.parse(text) : text;
            function extractChinese(obj: any): string {
              let result = '';
              if (typeof obj === 'string') {
                result += obj.match(/[ -]|[\u4e00-\u9fa5，。！？、；：""''（）《》【】]/g)?.join('') || '';
              } else if (Array.isArray(obj)) {
                for (const item of obj) result += extractChinese(item);
              } else if (typeof obj === 'object' && obj !== null) {
                for (const key in obj) result += extractChinese(obj[key]);
              }
              return result;
            }
            text = extractChinese(obj);
          } catch (e) {}
          setTranscript(text);
        } else if (data.type === 'interview_message') {
          setIsRecording(true);
          let text = data.text;
          try {
            const obj = typeof text === 'string' ? JSON.parse(text) : text;
            function extractChinese(obj: any): string {
              let result = '';
              if (typeof obj === 'string') {
                result += obj.match(/[ -]|[\u4e00-\u9fa5，。！？、；：""''（）《》【】]/g)?.join('') || '';
              } else if (Array.isArray(obj)) {
                for (const item of obj) result += extractChinese(item);
              } else if (typeof obj === 'object' && obj !== null) {
                for (const key in obj) result += extractChinese(obj[key]);
              }
              return result;
            }
            text = extractChinese(obj);
          } catch (e) {}
          setQuestion(text || '面试官问题将显示在这里');
          sendTextToDigitalHuman(text);
        }else if (data.type === 'connection_established') {
          setIsVideoConnected(true);
        }
      } catch (e) {
        // 非JSON消息忽略
      }
    };
    ws.onclose = () => {
      setIsRecording(false);
      setIsVideoConnected(false); // 重置视频连接状态
      stopAudioProcessing();
      stopVideoFrameCapture(); // 停止视频帧采集
    };
  };

  async function startAudioProcessing() {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioCtx() as AudioContext;
    audioContextRef.current = audioContext;
    await audioContext.audioWorklet.addModule('/recorder-worklet.js');
    const workletNode = new AudioWorkletNode(audioContext, 'recorder-worklet');
    workletNode.port.onmessage = (event) => {
      const inputData = event.data; // Float32Array
      const inputSampleRate = audioContext.sampleRate;
      const targetSampleRate = 16000;
      const resampled = Array.from(downsampleBuffer(inputData, inputSampleRate, targetSampleRate));
      // PCM 转换
      let pcm = new Int16Array(resampled.length);
      for (let i = 0; i < resampled.length; i++) {
        let s = Math.max(-1, Math.min(1, resampled[i]));
        pcm[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      let pcmBytes = new Uint8Array(pcm.length * 2);
      for (let i = 0; i < pcm.length; i++) {
        pcmBytes[2 * i] = pcm[i] & 0xff;
        pcmBytes[2 * i + 1] = (pcm[i] >> 8) & 0xff;
      }
      let base64String = btoa(String.fromCharCode.apply(null, Array.from(pcmBytes)));
      if (wsRef.current && wsRef.current.readyState === 1) {
        wsRef.current.send(JSON.stringify({ type: 'audio_frame', audio_data: base64String }));
      }
    };
    const input = audioContext.createMediaStreamSource(localStreamRef.current as MediaStream);
    inputRef.current = input;
    input.connect(workletNode);
    workletNode.connect(audioContext.destination);
    resampleBufferRef.current = [];
  }

  function stopAudioProcessing() {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (inputRef.current) {
      inputRef.current.disconnect();
      inputRef.current = null;
    }
    // 发送结束信号
    if (wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(JSON.stringify({ type: 'audio_frame', audio_data: '', end: true }));
    }
  }

  // 开始视频帧采集
  const startVideoFrameCapture = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('视频元素或画布元素不存在');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('无法获取画布上下文');
      return;
    }

    // 设置画布尺寸与视频一致
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    console.log(`开始视频帧采集，画布尺寸: ${canvas.width}x${canvas.height}`);

    // 每秒采集一帧视频
    videoFrameIntervalRef.current = setInterval(() => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        try {
          // 将视频帧绘制到画布上
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // 将画布内容转换为blob并发送
          canvas.toBlob(blob => {
            if (blob && wsRef.current && wsRef.current.readyState === 1) {
              const reader = new FileReader();
              reader.onloadend = function() {
                try {
                  const base64data = reader.result?.toString().split(',')[1];
                  if (base64data) {
                    wsRef.current?.send(JSON.stringify({
                      type: 'video_frame', 
                      frame_data: base64data, 
                      frame_type: 'keyframe'
                    }));
                    console.log('视频帧已发送，大小:', Math.round(base64data.length * 0.75), '字节');
                  }
                } catch (error) {
                  console.error('处理视频帧数据失败:', error);
                }
              };
              reader.onerror = function() {
                console.error('读取视频帧数据失败');
              };
              reader.readAsDataURL(blob);
            }
          }, 'image/jpeg', 0.8);
        } catch (error) {
          console.error('视频帧采集失败:', error);
        }
      } else {
        console.log('视频未准备好，readyState:', video.readyState);
      }
    }, 1000); // 每秒一帧

    console.log('视频帧采集定时器已启动');
  };

  // 停止视频帧采集
  const stopVideoFrameCapture = () => {
    if (videoFrameIntervalRef.current) {
      clearInterval(videoFrameIntervalRef.current);
      videoFrameIntervalRef.current = null;
      console.log('视频帧采集已停止');
    }
  };

  const stopCollect = () => {
    setIsRecording(false);
    setIsVideoConnected(false); // 重置视频连接状态
    if (wsRef.current) wsRef.current.close();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    stopAudioProcessing();
    stopVideoFrameCapture(); // 停止视频帧采集
    setTranscript('已停止采集');
  };

  // 预留：获取历史记录的异步接口
  async function getHistoryList() {
    setHistoryList([]);
  }

  // 初始化RTCPlayer
  const initializeRTCPlayer = (streamInfo: any) => {
    console.log('=== 开始初始化RTCPlayer ===');
    console.log('容器元素:', digitalHumanContainerRef.current);
    console.log('流信息:', JSON.stringify(streamInfo, null, 2));
    
    if (!digitalHumanContainerRef.current || !streamInfo) {
      console.error('缺少必要参数:', { 
        hasContainer: !!digitalHumanContainerRef.current, 
        hasStreamInfo: !!streamInfo 
      });
      return;
    }

    try {
      // 先销毁之前的实例
      if (rtcPlayerRef.current) {
        console.log('销毁之前的RTCPlayer实例');
        rtcPlayerRef.current.destroy();
        rtcPlayerRef.current = null;
      }

      // 创建RTCPlayer实例
      console.log('创建新的RTCPlayer实例');
      const player = new RTCPlayer();
      rtcPlayerRef.current = player;

      // 设置监听事件
      player.on("play", function() {
        console.log("=== RTCPlayer: 播放开始 ===");
      })
      .on("playing", function() {
        console.log("=== RTCPlayer: 播放中 ===");
        setIsDigitalHumanConnected(true);
      })
      .on("waiting", function() {
        console.log("=== RTCPlayer: 等待中 ===");
        console.log("等待原因可能是:");
        console.log("1. 流地址无效或无法访问");
        console.log("2. 认证信息错误");
        console.log("3. 服务器未响应");
        console.log("4. 网络连接问题");
      })
      .on("error", function(e: any) {
        console.log("=== RTCPlayer: 错误 ===");
        console.log("错误详情:", e);
        console.log("错误类型:", typeof e);
        console.log("错误消息:", e?.message || e?.toString());
        setIsDigitalHumanConnected(false);
      })
      .on("not-allowed", function() {
        console.log("=== RTCPlayer: 触发浏览器限制播放策略 ===");
        console.log("需要用户交互才能播放");
        player.resume();
      });

      // 设置XRTC协议参数
      console.log('=== 设置RTCPlayer参数 ===');
      player.playerType = 12; // XRTC模式
      
      const streamConfig = {
        sid: streamInfo.sid || "vms000ec4da@dx195f094539d6f19882",
        server: streamInfo.server || "https://xrtc-cn-east-2.xf-yun.com",
        auth: streamInfo.auth || "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIxMDAwMDAwMDAxIiwidGltZSI6MTY0ODAxODQ2MTU0MywiaWF0IjoxNjQ4MTkxMjQyfQ.CTcOh_kCLqvvglo5VLVnjgpZzoFpzk7Un3Et0c9dhUs",
        appid: streamInfo.appid || "1000000001",
        userId: streamInfo.userId || "123123123",
        roomId: streamInfo.roomId || "ase0001bbe2hu19632f0f6070442142",
        timeStr: streamInfo.timeStr || "123412341324",
      };
      
      console.log('流配置:', JSON.stringify(streamConfig, null, 2));
      player.stream = streamConfig;

      // 设置视频尺寸 - 与容器大小匹配
      const containerElement = digitalHumanContainerRef.current;
      if (containerElement) {
        const containerRect = containerElement.getBoundingClientRect();
        console.log('容器尺寸:', containerRect.width, 'x', containerRect.height);
        
        // 使用容器的实际尺寸，或者设置合适的比例
        player.videoSize = { 
          width: Math.round(containerRect.width) || 400,
          height: Math.round(containerRect.height) || 400,
        };
        
        console.log('设置RTCPlayer视频尺寸:', player.videoSize);
      } else {
        // 默认尺寸
        player.videoSize = { 
          width: 400,
          height: 400,
        };
        console.log('使用默认视频尺寸:', player.videoSize);
      }
      
      // 将视频流填充进容器中
      console.log('=== 设置RTCPlayer容器 ===');
      console.log('容器元素:', digitalHumanContainerRef.current);
      console.log('容器ID:', digitalHumanContainerRef.current.id);
      player.container = digitalHumanContainerRef.current;

      // 开始播放
      console.log('=== 开始RTCPlayer播放 ===');
      player.play();

    } catch (error: any) {
      console.error('=== 初始化RTCPlayer失败 ===');
      console.error('错误:', error);
      console.error('错误消息:', error?.message);
      console.error('错误堆栈:', error?.stack);
      setIsDigitalHumanConnected(false);
    }
  };

  // 数字人相关功能
  const initializeDigitalHuman = async () => {
    console.log('初始化数字人服务');
    setIsDigitalHumanInitializing(true);
    try {
      // 修复数字人初始化回调参数顺序
      await digitalHumanService.current.initialize(
        // 音频接收回调
        (audio: DigitalHumanAudio) => {
          console.log('收到数字人音频数据');
          playDigitalHumanAudio(audio);
        },
        // 视频接收回调
        (video: DigitalHumanVideo) => {
          console.log('收到数字人视频数据');
          // 处理视频数据 - 这里可以显示数字人视频
          console.log('数字人视频URL:', video.videoUrl);
          console.log('视频尺寸:', video.width, 'x', video.height);
        },
        // 错误回调
        (error: string) => {
          console.error('数字人服务错误:', error);
          setIsDigitalHumanConnected(false);
        },
        // 连接关闭回调
        () => {
          console.log('数字人连接已关闭');
          setIsDigitalHumanConnected(false);
        },
        // 数字人连接成功回调
        (streamUrl: string, fullMessage?: any) => {
          console.log('数字人连接成功，流地址:', streamUrl);
          console.log('完整连接消息:', fullMessage);
          
          // 解析流信息并初始化RTCPlayer
          try {
            if (fullMessage) {
              // 使用完整的连接消息解析参数
              const streamInfo = parseDigitalHumanMessage(fullMessage);
              if (streamInfo) {
                console.log('解析出的流信息:', streamInfo);
                setStreamInfo(streamInfo);
                initializeRTCPlayer(streamInfo);
              } else {
                console.warn('无法解析完整连接消息，尝试解析streamUrl');
                const streamInfo = parseStreamUrl(streamUrl);
                if (streamInfo) {
                  setStreamInfo(streamInfo);
                  initializeRTCPlayer(streamInfo);
                } else {
                  console.error('无法解析任何流信息');
                }
              }
            } else {
              // 回退到只解析streamUrl
              console.warn('没有完整连接消息，尝试解析streamUrl');
              const streamInfo = parseStreamUrl(streamUrl);
              if (streamInfo) {
                setStreamInfo(streamInfo);
                initializeRTCPlayer(streamInfo);
              } else {
                console.error('无法解析streamUrl');
              }
            }
            
            // 在数字人连接成功后，主动激活音频上下文
            console.log('数字人连接成功，主动激活音频上下文...');
            setTimeout(() => {
              testAudioPlayback(false); // 静默激活，不显示弹窗
            }, 1000); // 延迟1秒确保RTCPlayer初始化完成
            
          } catch (error) {
            console.error('解析流信息失败:', error);
          }
        }
      );
      console.log('数字人服务初始化成功');
      setIsDigitalHumanInitializing(false);
    } catch (error) {
      console.error('数字人服务初始化失败:', error);
      setIsDigitalHumanConnected(false);
      setIsDigitalHumanInitializing(false);
    }
  };

  // 解析流地址，提取RTCPlayer需要的参数
  const parseStreamUrl = (streamUrl: string) => {
    try {
      console.log('解析流地址:', streamUrl);
      
      // 如果streamUrl是完整的XRTC URL，尝试解析
      if (streamUrl.includes('xrtc')) {
        const url = new URL(streamUrl);
        const params = new URLSearchParams(url.search);
        
        // 根据pushMode不同，解析不同的参数
        const pushMode = params.get('pushMode') || 'xrtc';
        
        if (pushMode === 'xrtc') {
          // XRTC模式
          return {
            sid: params.get('sid') || url.pathname.split('/').pop() || '',
            server: `${url.protocol}//${url.host}`,
            auth: params.get('auth') || '',
            appid: params.get('appid') || DIGITAL_HUMAN_CONFIG.appId,
            userId: params.get('userId') || 'user_' + Date.now(),
            roomId: params.get('roomId') || 'room_' + Date.now(),
            timeStr: params.get('timeStr') || Date.now().toString(),
          };
        } else {
          // 其他模式，可能需要不同的解析逻辑
          console.log('未知的pushMode:', pushMode);
          return null;
        }
      } else {
        // 如果不是XRTC URL，返回null
        console.log('不是XRTC URL:', streamUrl);
        return null;
      }
    } catch (error) {
      console.error('解析流地址失败:', error);
      return null;
    }
  };

  // 解析数字人连接消息，提取RTCPlayer需要的参数
  const parseDigitalHumanMessage = (message: any) => {
    try {
      console.log('解析数字人连接消息:', JSON.stringify(message, null, 2));
      
      const avatar = message.payload?.avatar;
      if (!avatar || avatar.event_type !== 'stream_info') {
        console.log('不是stream_info事件或缺少avatar信息');
        return null;
      }

      const streamUrl = avatar.stream_url;
      const streamExtend = avatar.stream_extend;
      const sid = avatar.sid;

      console.log('流地址:', streamUrl);
      console.log('流扩展信息:', streamExtend);
      console.log('SID:', sid);

      // 解析streamUrl
      if (streamUrl && streamUrl.includes('xrtc')) {
        const url = new URL(streamUrl);
        const roomId = url.pathname.split('/').pop() || '';
        
        // 构造RTCPlayer需要的参数
        const streamInfo = {
          sid: sid || '',
          server: `http://xrtc-cn-east-2.xf-yun.com`,
          auth: streamExtend?.user_sign || '', // 使用user_sign作为auth
          appid: streamExtend?.appid || DIGITAL_HUMAN_CONFIG.appId,
          userId: 'user_' + Date.now(), // 生成用户ID
          roomId: url.pathname.replace(/^\//, ''), // 取斜杠后的部分作为roomId
          timeStr: Date.now().toString(), // 生成时间戳
        };

        console.log('解析出的RTCPlayer参数:', JSON.stringify(streamInfo, null, 2));
        return streamInfo;
      } else {
        console.log('无效的streamUrl:', streamUrl);
        return null;
      }
    } catch (error) {
      console.error('解析数字人连接消息失败:', error);
      return null;
    }
  };

  // 播放数字人音频
  const playDigitalHumanAudio = async (audio: DigitalHumanAudio) => {
    try {
      console.log('=== 开始播放数字人音频 ===');
      console.log('音频格式:', audio.format);
      console.log('音频大小:', audio.audioData.byteLength, '字节');
      
      // 在播放数字人音频前，确保音频上下文已激活
      //console.log('播放数字人音频前，确保音频上下文已激活...');
      //testAudioPlayback(false); // 静默激活音频上下文
      
      // 等待一小段时间确保音频上下文完全激活
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setIsDigitalHumanSpeaking(true);
      
      await digitalHumanService.current.playAudio(audio);
      
      console.log('=== 数字人音频播放完成 ===');
      setIsDigitalHumanSpeaking(false);
    } catch (error) {
      console.error('播放数字人音频失败:', error);
      setIsDigitalHumanSpeaking(false);
    }
  };

  // 测试音频播放功能
  const testAudioPlayback = (showAlert: boolean = true) => {
    try {
      console.log('=== 测试音频播放功能 ===');
      
      // 创建音频上下文
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('音频上下文状态:', audioContext.state);
      
      // 如果音频上下文被暂停，尝试恢复
      if (audioContext.state === 'suspended') {
        console.log('音频上下文被暂停，尝试恢复...');
        audioContext.resume().then(() => {
          console.log('音频上下文已恢复，状态:', audioContext.state);
          playTestTone(audioContext, showAlert);
        }).catch(error => {
          console.error('恢复音频上下文失败:', error);
          if (showAlert) {
            alert('无法恢复音频上下文，请检查浏览器设置');
          }
        });
      } else {
        playTestTone(audioContext, showAlert);
      }
      
    } catch (error) {
      console.error('测试音频播放失败:', error);
      if (showAlert) {
        alert('测试音频播放失败: ' + error);
      }
    }
  };

  // 播放测试音调
  const playTestTone = (audioContext: AudioContext, showAlert: boolean = true) => {
    try {
      // 创建一个简单的测试音调
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4音符
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime); // 降低音量
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 1); // 播放1秒
      
      console.log('测试音调开始播放');
      if (showAlert) {
        alert('测试音调播放成功！如果听到声音，说明音频功能正常。');
      }
      
    } catch (error) {
      console.error('播放测试音调失败:', error);
      if (showAlert) {
        alert('播放测试音调失败: ' + error);
      }
    }
  };

  // 处理欢迎弹窗关闭
  const handleWelcomeModalClose = () => {
    console.log('用户关闭欢迎弹窗，激活音频上下文...');
    
    // 激活音频上下文
    testAudioPlayback(false);
    
    // 设置音频已激活状态
    setIsAudioActivated(true);
    
    // 关闭弹窗
    setShowWelcomeModal(false);
    
    // 在用户交互后初始化数字人服务
    console.log('用户交互完成，开始初始化数字人服务...');
    initializeDigitalHuman();
    
    console.log('音频上下文已激活，欢迎弹窗已关闭，数字人服务初始化中...');
    startCollect();

  };

  // 发送文本给数字人
  const sendTextToDigitalHuman = async (text: string) => {
    console.log('=== 尝试发送文本给数字人 ===');
    console.log('文本内容:', text);
    console.log('数字人连接状态:', isDigitalHumanConnected);
    console.log('数字人初始化状态:', isDigitalHumanInitializing);
    console.log('音频激活状态:', isAudioActivated);
    
    // 检查文本是否有效
    if (!text || text.trim() === '') {
      console.warn('文本内容为空，跳过发送');
      return;
    }

    // 移除连接状态检查，直接尝试发送
    console.log('直接尝试发送文本给数字人，不检查连接状态');

    try {
      const request: DigitalHumanRequest = {
        text,
        voiceConfig: {
          vcn: "x4_xiaoyu"
        }
      };

      console.log('发送请求给数字人:', request);
      await digitalHumanService.current.textToSpeech(request);
      console.log('发送文本给数字人成功');
      setDigitalHumanText(text);
    } catch (error) {
      console.error('发送文本给数字人失败:', error);
    }
  };

  // 手动播放数字人视频（用于测试）
  const playDigitalHumanVideo = () => {
    console.log('尝试播放数字人视频');
    if (streamInfo) {
      console.log('使用流信息:', streamInfo);
      initializeRTCPlayer(streamInfo);
    } else {
      console.warn('没有可用的流信息');
      // 创建一个测试视频流
      const testStreamInfo = {
        sid: "vms000ec4da@dx195f094539d6f19882",
        server: "https://xrtc-cn-east-2.xf-yun.com",
        auth: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIxMDAwMDAwMDAxIiwidGltZSI6MTY0ODAxODQ2MTU0MywiaWF0IjoxNjQ4MTkxMjQyfQ.CTcOh_kCLqvvglo5VLVnjgpZzoFpzk7Un3Et0c9dhUs",
        appid: "1000000001",
        userId: "123123123",
        roomId: "ase0001bbe2hu19632f0f6070442142",
        timeStr: "123412341324",
      };
      console.log('使用测试流信息:', testStreamInfo);
      initializeRTCPlayer(testStreamInfo);
    }
  };

  useEffect(() => {
    // 页面初始化时获取历史记录
    getHistoryList();
    // 数字人服务将在用户交互后初始化
    
    return () => {
      stopCollect();
      stopVideoFrameCapture(); // 确保停止视频帧采集
      // 关闭数字人服务
      digitalHumanService.current.disconnect();
      // 关闭RTCPlayer
      if (rtcPlayerRef.current) {
        rtcPlayerRef.current.destroy();
      }
    };
  }, []);

  // 添加CSS样式来截取数字人上半部分
  useEffect(() => {
    const addVideoStyles = () => {
      const styleId = 'digital-human-video-styles';
      if (document.getElementById(styleId)) {
        return; // 样式已存在
      }

      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        #digital-human-container video {
          object-fit: cover !important;
          object-position: center top !important;
        }
        #digital-human-container canvas {
          object-fit: cover !important;
          object-position: center top !important;
        }
        #digital-human-container img {
          object-fit: cover !important;
          object-position: center top !important;
        }
      `;
      document.head.appendChild(style);
    };

    // 延迟添加样式，确保容器已存在
    const timer = setTimeout(addVideoStyles, 1000);
    
    return () => {
      clearTimeout(timer);
      const style = document.getElementById('digital-human-video-styles');
      if (style) {
        style.remove();
      }
    };
  }, []);

  // 运行代码相关
  const [stdin, setStdin] = useState('');
  const [runResult, setRunResult] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  
  const languageIdMap: Record<string, number> = {
    plaintext: 0,
    javascript: 63,
    python: 71,
    typescript: 74,
    java: 62,
  };

  // 运行代码
  async function handleRunCode() {
    setIsRunning(true);
    setRunResult('');
    try {
      const res = await runCode(code, languageIdMap[language] || 0, stdin);
      if (res && typeof res === 'object') {
        if (res.stdout && res.stdout.trim() !== '') {
          setRunResult(res.stdout);
        } else if (res.stderr && res.stderr.trim() !== '') {
          setRunResult(`<stderr>${res.stderr}</stderr>`);
        } else {
          setRunResult('');
        }
      } else {
        setRunResult('');
      }
    } catch (e: any) {
      setRunResult(e?.message || '运行出错');
    }
    setIsRunning(false);
  }

  // 新增：代码区展开/收起
  const [showEditor, setShowEditor] = useState(false);

  return (
    <div className="h-screen w-screen bg-gray-900 text-white flex flex-col md:flex-row relative overflow-hidden">
      {/* 按钮上下排列 */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3">
        <button
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded shadow-lg transition-all text-sm md:text-base"
          onClick={() => setShowEditor(v => !v)}
          aria-label={showEditor ? '收起代码区' : '展开代码区'}
        >
          {showEditor ? '收起代码区' : '展开代码区'}
        </button>
        <button
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded shadow-lg transition-all text-sm md:text-base"
          onClick={() => router.push('/interview/test')}
        >
          结束面试
        </button>
      </div>

      {/* 左侧：问题区 */}
      <div
        className={`transition-all duration-300 bg-gray-800 border-r border-gray-700 flex flex-col ${showEditor ? 'w-full md:w-1/5' : 'w-1/2'} min-w-[120px] max-h-screen`}
        style={{ overflow: 'hidden' }}
      >
        <div className="flex-1 overflow-y-auto p-6">
          <div className="text-purple-400 font-bold text-lg mb-2">当前问题</div>
          <div
            className="text-base mb-4 break-words whitespace-pre-line max-w-full"
            style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}
          >
            {question}
          </div>
          {/* <div className="text-gray-400 text-sm font-semibold mb-1">面试官问题</div>
          <div
            className="text-gray-300 text-sm break-words whitespace-pre-line max-w-full"
            style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}
          >
            {mockQuestion.title}
          </div> */}
        </div>
        <div className="sticky bottom-0 left-0 right-0 bg-gray-800 p-4 flex flex-col gap-2 z-10 border-t border-gray-700">
          <button
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm w-full"
            onClick={() => setHistoryVisible(true)}
          >
            查看历史记录
          </button>
        </div>
      </div>

      {/* 中间：代码编辑区 */}
      <div
        className={`transition-all duration-300 flex flex-col bg-gray-900 p-6 min-h-0 ${showEditor ? 'w-full md:w-3/5 opacity-100' : 'w-0 opacity-0 pointer-events-none select-none p-0'} overflow-hidden`}
        style={{ minWidth: showEditor ? 200 : 0, maxWidth: showEditor ? undefined : 0 }}
      >
        {showEditor && (
          <>
            <div className="flex items-center mb-2 justify-between">
              <div className="flex items-center">
                <span className="text-gray-400 text-sm mr-2">选择语言：</span>
                <select
                  className="bg-gray-800 text-white border border-gray-700 rounded px-2 py-1 text-sm outline-none"
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                >
                  {languageOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <button
                className="flex items-center bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium ml-2 transition-all"
                onClick={handleRunCode}
                disabled={isRunning}
                style={{ minWidth: 80 }}
              >
                {isRunning ? '运行中...' : '运行'}
                <svg className="ml-1 w-3 h-3" viewBox="0 0 12 12" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="3,2 10,6 3,10" />
                </svg>
              </button>
            </div>
            <div className="flex-1 min-h-0 mb-2">
              <MonacoEditor
                height="calc(100vh - 220px)"
                defaultLanguage={language}
                language={language}
                value={code}
                theme="vs-dark"
                onChange={v => setCode(v || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 16,
                  fontFamily: 'Fira Mono, monospace',
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  automaticLayout: true,
                }}
              />
            </div>
            <div className="mb-2">
              <label className="block text-gray-400 text-xs mb-1">标准输入（stdin，可选）</label>
              <textarea
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white resize-y min-h-[40px]"
                value={stdin}
                onChange={e => setStdin(e.target.value)}
                placeholder="请输入标准输入内容..."
              />
            </div>
            <div className="mb-2">
              <label className="block text-gray-400 text-xs mb-1">运行结果</label>
              <pre
                className="w-full bg-black border border-gray-700 rounded px-2 py-2 text-xs min-h-[40px] max-h-40 overflow-auto whitespace-pre-wrap"
                style={{ color: undefined }}
                dangerouslySetInnerHTML={{
                  __html: runResult
                    ? runResult
                        .replace(/<stderr>([\s\S]*?)<\/stderr>/g, '<span style="color:#f87171;">$1</span>')
                        .replace(/<stdout>([\s\S]*?)<\/stdout>/g, '<span style="color:#4ade80;">$1</span>')
                    : '',
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* 右侧：视频区 */}
      <div
        className={`transition-all duration-300 bg-gray-800 p-6 flex flex-col gap-8 items-center w-full ${showEditor ? 'md:w-1/5' : ''} min-w-[120px]`}
        style={{ minHeight: '0', justifyContent: 'center' }}
      >
        {/* 数字人面试官视频块 */}
        <div className="flex flex-col items-center justify-center w-full max-w-[400px] mx-auto" style={{ maxHeight: '40vh' }}>
          <div className="text-center text-xs text-gray-400 mb-2">
            数字人面试官
            <span className={`ml-2 px-2 py-1 rounded text-xs ${isDigitalHumanConnected ? 'bg-green-600' : isDigitalHumanInitializing ? 'bg-yellow-600' : 'bg-red-600'}`}>
              {isDigitalHumanConnected ? '已连接' : isDigitalHumanInitializing ? '连接中...' : '未连接'}
            </span>
            {/* <span className={`ml-2 px-2 py-1 rounded text-xs ${isAudioActivated ? 'bg-blue-600' : 'bg-yellow-600'}`}>
              {isAudioActivated ? '音频已激活' : '音频未激活'}
            </span> */}
          </div>
          
          {/* RTCPlayer容器 */}
          <div className="bg-black w-full aspect-square rounded-md flex items-center justify-center text-3xl mb-4 min-w-[200px] min-h-[200px] max-w-[400px] max-h-[400px] relative overflow-hidden">
            <div 
              ref={digitalHumanContainerRef}
              id="digital-human-container"
              className="w-full h-full"
              style={{ 
                width: '100%', 
                height: '100%',
                backgroundColor: 'black',
                minWidth: '200px',
                minHeight: '200px',
                overflow: 'hidden'
              }}
            />
            

            
            {/* 测试视频元素 */}
            <video
              id="test-video"
              className="absolute inset-0 w-full h-full object-cover rounded-md"
              style={{ display: 'none' }}
              autoPlay
              muted
              playsInline
            />
            
            {/* 音频可视化效果 */}
            {isDigitalHumanSpeaking && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-blue-400 rounded-full animate-pulse"
                    style={{
                      height: `${Math.random() * 20 + 10}px`,
                      animationDelay: `${i * 0.1}s`
                    }}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* 数字人控制区域 */}
          <div className="w-full space-y-2 mb-4">
            {/* <div className="text-xs text-gray-400 mb-1">数字人文本</div>
            <textarea
              className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white resize-none h-16"
              value={digitalHumanText}
              onChange={(e) => setDigitalHumanText(e.target.value)}
              placeholder="输入要转换为语音的文本..."
            /> */}
            <div className="mt-2 text-xs text-gray-300 min-h-[1.5em]">{digitalHumanText}</div>
            {/* <div className="flex space-x-2">
              <button
                className={`px-3 py-1 rounded text-xs font-medium ${
                  isDigitalHumanConnected && isAudioActivated
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
                onClick={() => sendTextToDigitalHuman(digitalHumanText)}
                disabled={!isDigitalHumanConnected || !isAudioActivated || !digitalHumanText.trim() || isDigitalHumanInitializing}
              >
                播放语音
              </button>
              <button
                className={`px-3 py-1 rounded text-xs font-medium ${
                  isDigitalHumanConnected && isAudioActivated
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
                onClick={() => sendTextToDigitalHuman('你好，我是数字人面试官，很高兴见到你！')}
                disabled={!isDigitalHumanConnected || !isAudioActivated || isDigitalHumanInitializing}
              >
                测试语音
              </button>
              <button
                className="px-3 py-1 rounded text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white"
                onClick={playDigitalHumanVideo}
              >
                播放视频
              </button>
              <button
                className="px-3 py-1 rounded text-xs font-medium bg-orange-600 hover:bg-orange-700 text-white"
                onClick={() => testAudioPlayback(true)}
              >
                测试音频
              </button>
            </div> */}
          </div>
        </div>

        {/* 面试者视频块 */}
        <div className="flex flex-col items-center justify-center w-full max-w-[400px] mx-auto" style={{ maxHeight: '40vh' }}>
          <div className="text-center text-xs text-gray-400 mb-2">
            面试者
            <span className={`ml-2 px-2 py-1 rounded text-xs ${isVideoConnected ? 'bg-green-600' : 'bg-red-600'}`}>
              {isVideoConnected ? '已连接' : '未连接'}
            </span>
          </div>
          <div className="bg-black w-full aspect-square rounded-md flex flex-col items-center justify-center text-3xl relative min-w-[120px] min-h-[120px] max-w-[400px] max-h-[40vh]">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover rounded-md"
              style={{ background: 'black' }}
            />
            {!isRecording && <span className="z-10"></span>}
          </div>
          {/* 隐藏的canvas用于视频帧采集 */}
          <canvas
            ref={canvasRef}
            style={{ display: 'none' }}
            width="640"
            height="480"
          />
          <div className="mt-2 flex space-x-2 justify-center">
            <button
              className={`px-3 py-1 rounded text-sm font-medium ${isRecording ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
              onClick={startCollect}
              disabled={isRecording}
            >
              开启摄像头
            </button>
            <button
              className={`px-3 py-1 rounded text-sm font-medium ${!isRecording ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white'}`}
              onClick={stopCollect}
              disabled={!isRecording}
            >
              关闭摄像头
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-300 min-h-[1.5em]">{transcript}</div>
        </div>
      </div>

      {/* 欢迎弹窗 */}
      <Transition appear show={showWelcomeModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => {}}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gray-800 p-6 text-left align-middle shadow-xl transition-all border border-gray-700">
                  <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 mb-4">
                      <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </div>
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-bold leading-6 text-white mb-2"
                    >
                      欢迎使用AI面试模拟器
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-300 mb-4">
                        这是一个基于AI的面试模拟系统，包含数字人面试官和实时语音交互功能。
                      </p>
                      <p className="text-xs text-gray-400 mb-6">
                        开始体验后系统将自动开启摄像头和麦克风，请做好准备。
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-center">
                    <button
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
                      onClick={handleWelcomeModalClose}
                    >
                      开始体验
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* 历史记录弹窗 */}
      <Transition appear show={historyVisible} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setHistoryVisible(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/60" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-gray-900 p-6 text-left align-middle shadow-xl transition-all border border-gray-700">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-bold leading-6 text-white mb-4"
                  >
                    历史问题与回答
                  </Dialog.Title>
                  <div className="space-y-4">
                    {historyList.map((item, idx) => (
                      <div key={idx} className="bg-gray-800 rounded p-4">
                        <div className="text-purple-400 font-semibold mb-1">Q: {item.question}</div>
                        <div className="text-gray-200">A: {item.answer}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm"
                      onClick={() => setHistoryVisible(false)}
                    >
                      关闭
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}