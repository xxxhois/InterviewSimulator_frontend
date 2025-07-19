'use client';

import { DigitalHumanAudio, DigitalHumanRequest, digitalHumanService } from '@/api/digitalHuman';
import { runCode } from '@/api/test';
import { Dialog, Transition } from '@headlessui/react';
import dynamic from 'next/dynamic';
import { Fragment, useEffect, useRef, useState } from 'react';

// 动态引入 Monaco Editor，避免 SSR 问题
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

// 预留：当前问题、提示、历史、视频流等接口
const mockQuestion = {
  title: '请实现一个斐波那契数列函数',
  hint: '递归或动态规划均可，注意边界条件。',
};
// const mockHistory = [
//   { question: '什么是闭包？', answer: '闭包是函数和其引用的变量环境的组合。' },
//   { question: '手写防抖函数', answer: 'function debounce(fn, delay) { /* ... */ }' },
// ];

const languageOptions = [
  { label: 'Plain Text', value: 'plaintext' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'Python', value: 'python' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'Java', value: 'java' },
  // 可扩展更多语言
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

export default function InterviewPage() {
  // 代码内容、语言、弹窗状态
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('plaintext');
  const [historyVisible, setHistoryVisible] = useState(false);
  const [historyList, setHistoryList] = useState<{ question: string; answer: string }[]>([]); // 初始为空
  const [transcript, setTranscript] = useState('');
  const [question, setQuestion] = useState('');//面试官ws传输的当前语音
  const [isRecording, setIsRecording] = useState(false);
  // 当前采集QA的索引，-1表示无
  const [currentQAIndex, setCurrentQAIndex] = useState(-1);
  // 用ref保存最新的QA索引，保证onmessage里能取到最新值
  const currentQAIndexRef = useRef(-1);
  useEffect(() => { currentQAIndexRef.current = currentQAIndex; }, [currentQAIndex]);
  const lastTextRef = useRef('');

  // 数字人相关状态
  const [isDigitalHumanConnected, setIsDigitalHumanConnected] = useState(false);
  const [isDigitalHumanSpeaking, setIsDigitalHumanSpeaking] = useState(false);
  const [digitalHumanText, setDigitalHumanText] = useState('');
  const digitalHumanAudioRef = useRef<HTMLAudioElement | null>(null);

  // 视频/音频/WebSocket相关ref，添加类型
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const sendTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resampleBufferRef: React.MutableRefObject<number[]> = useRef([]);

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
    // let ws_scheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
    // let ws_url = ws_scheme + '://' + window.location.host + '/ws/webrtc/';
    let ws_url = 'ws://localhost:8000/ws/webrtc/';
    const ws = new window.WebSocket(ws_url);
    wsRef.current = ws;
    ws.onopen = () => {
      setIsRecording(true);
      startAudioProcessing();
    };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('收到消息',data)
        if (data.type === 'asr_result') {
          let text = data.text;
          // 尝试提取所有中文
          try {
            const obj = typeof text === 'string' ? JSON.parse(text) : text;
            function extractChinese(obj: any): string {
              let result = '';
              if (typeof obj === 'string') {
                result += obj.match(/[ -]|[\u4e00-\u9fa5，。！？、；：“”‘’（）《》【】]/g)?.join('') || '';
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
          
        }
        else if (data.type === 'interview_message') {
          setIsRecording(true);
          let text = data.text;
          try {
            const obj = typeof text === 'string' ? JSON.parse(text) : text;
            function extractChinese(obj: any): string {
              let result = '';
              if (typeof obj === 'string') {
                result += obj.match(/[ -]|[\u4e00-\u9fa5，。！？、；：“”‘’（）《》【】]/g)?.join('') || '';
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
        }
      } catch (e) {
        // 非JSON消息忽略
      }
    };
    ws.onclose = () => {
      setIsRecording(false);
      stopAudioProcessing();
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
      // 检查采集到的音频数据
      //console.log('inputData[0~5]:', inputData.slice(0, 5));
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
        //console.log('发送音频帧', base64String.length);
        wsRef.current.send(JSON.stringify({type: 'audio_frame', audio_data: base64String}));
      }
    };
    const input = audioContext.createMediaStreamSource(localStreamRef.current as MediaStream);
    inputRef.current = input;
    input.connect(workletNode);
    workletNode.connect(audioContext.destination);
    // 不再累积和 setInterval
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
      wsRef.current.send(JSON.stringify({type: 'audio_frame', audio_data: '', end: true}));
    }
  }

  const stopCollect = () => {
    setIsRecording(false);
    if (wsRef.current) wsRef.current.close();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    stopAudioProcessing();
    setTranscript('已停止采集');
    setCurrentQAIndex(-1);
    currentQAIndexRef.current = -1;
    lastTextRef.current = '';
  };

  // 预留：获取历史记录的异步接口
  async function getHistoryList() {
    // TODO: 替换为实际后端请求
    // const res = await fetch('/api/history');
    // const data = await res.json();
    // setHistoryList(data);
    // 临时占位
    setHistoryList([]);
  }

  // 数字人相关功能
  const initializeDigitalHuman = async () => {
    try {
      await digitalHumanService.initialize(
        // 音频接收回调
        (audio: DigitalHumanAudio) => {
          console.log('收到数字人音频数据');
          playDigitalHumanAudio(audio);
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
        }
      );
      setIsDigitalHumanConnected(true);
      console.log('数字人服务初始化成功');
    } catch (error) {
      console.error('数字人服务初始化失败:', error);
      setIsDigitalHumanConnected(false);
    }
  };

  // 修复playAudio方法，正确处理MP3格式
  async function playAudio(audio: DigitalHumanAudio): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log(`开始播放音频，格式: ${audio.format}, 大小: ${audio.audioData.byteLength} 字节`);
        
        // 创建AudioContext
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        if (audio.format === 'mp3') {
          // 对于MP3格式，使用decodeAudioData
          audioContext.decodeAudioData(audio.audioData).then(audioBuffer => {
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            
            // 监听播放结束事件
            source.onended = () => {
              console.log('数字人音频播放完成');
              resolve();
            };
            
            source.start(0);
            console.log('MP3音频开始播放');
          }).catch(error => {
            console.error('MP3解码失败:', error);
            reject(error);
          });
        } else if (audio.format === 'raw') {
          // 对于raw格式，需要特殊处理
          const audioData = new Int16Array(audio.audioData);
          const floatData = new Float32Array(audioData.length);
          
          // 转换为-1到1的浮点数
          for (let i = 0; i < audioData.length; i++) {
            floatData[i] = audioData[i] / 32768.0;
          }
          
          // 创建AudioBuffer
          const audioBuffer = audioContext.createBuffer(audio.channels, floatData.length, audio.sampleRate);
          audioBuffer.copyToChannel(floatData, 0);
          
          // 创建音频源
          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContext.destination);
          
          // 监听播放结束事件
          source.onended = () => {
            console.log('数字人音频播放完成');
            resolve();
          };
          
          source.start(0);
          console.log('Raw音频开始播放');
        } else {
          // 对于其他格式，尝试默认解码
          audioContext.decodeAudioData(audio.audioData).then(audioBuffer => {
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            
            source.onended = () => {
              console.log('数字人音频播放完成');
              resolve();
            };
            
            source.start(0);
            console.log('默认格式音频开始播放');
          }).catch(reject);
        }
      } catch (error) {
        console.error('播放音频失败:', error);
        reject(error);
      }
    });
  }

  // 在playDigitalHumanAudio中添加更多调试信息
  const playDigitalHumanAudio = async (audio: DigitalHumanAudio) => {
    try {
      console.log('=== 开始播放数字人音频 ===');
      console.log('音频格式:', audio.format);
      console.log('音频大小:', audio.audioData.byteLength, '字节');
      console.log('采样率:', audio.sampleRate);
      console.log('声道数:', audio.channels);
      
      setIsDigitalHumanSpeaking(true);
      
      await playAudio(audio);
      
      console.log('=== 数字人音频播放完成 ===');
      setIsDigitalHumanSpeaking(false);
    } catch (error) {
      console.error('播放数字人音频失败:', error);
      setIsDigitalHumanSpeaking(false);
    }
  };

  // 发送文本给数字人
  const sendTextToDigitalHuman = async (text: string) => {
    if (!isDigitalHumanConnected) {
      console.warn('数字人服务未连接');
      return;
    }

    try {
      const request: DigitalHumanRequest = {
        text,
        voiceConfig: {
          vcn: "x5_lingxiaoyue_flow", // 女性发音人
          speed: 50,
          volume: 50,
          pitch: 50
        },
        audioConfig: {
          encoding: "lame",
          sample_rate: 16000,
          channels: 1,
          bit_depth: 16
        }
      };

      await digitalHumanService.textToSpeech(request);
      setDigitalHumanText(text);
    } catch (error) {
      console.error('发送文本给数字人失败:', error);
    }
  };

  useEffect(() => {
    // 页面初始化时获取历史记录
    getHistoryList();
    // 初始化数字人服务
    initializeDigitalHuman();
    
    return () => {
      stopCollect();
      // 关闭数字人服务
      digitalHumanService.disconnect();
    };
    // eslint-disable-next-line
  }, []);

  // 预留：当前问题、提示、历史、视频流等接口
  const currentQuestion = mockQuestion; // TODO: 替换为实际接口

  // 新增：代码区展开/收起
  const [showEditor, setShowEditor] = useState(false);//默认收起
  // // 响应式：小屏默认收起，大屏默认展开
  // useEffect(() => {
  //   const handleResize = () => {
  //     if (window.innerWidth < 900) {
  //       setShowEditor(false);
  //     } else {
  //       setShowEditor(true);
  //     }
  //   };
  //   handleResize();
  //   window.addEventListener('resize', handleResize);
  //   return () => window.removeEventListener('resize', handleResize);
  // }, []);

  // 运行代码相关
  const [stdin, setStdin] = useState('');
  const [runResult, setRunResult] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  // 语言映射（language_id）
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
      // 若stdout为空则显示stderr（红字）
      if (res && typeof res === 'object') {
        if (res.stdout && res.stdout.trim() !== '') {
          setRunResult(res.stdout);
        } else if (res.stderr && res.stderr.trim() !== '') {
          // 用特殊标记包裹stderr，后续渲染时可用红色显示
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

  return (
    <div className="h-screen w-screen bg-gray-900 text-white flex flex-col md:flex-row relative overflow-hidden">
      {/* 展开/收起按钮，固定在右上角，z-50，移动端更明显 */}
      <button
        className="fixed top-4 right-4 z-50 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded shadow-lg transition-all md:top-6 md:right-6 md:px-5 md:py-2.5 text-sm md:text-base"
        onClick={() => setShowEditor(v => !v)}
        aria-label={showEditor ? '收起代码区' : '展开代码区'}
      >
        {showEditor ? '收起代码区' : '展开代码区'}
      </button>
      {/* 左侧：问题区（可滚动，按钮粘性，内容不超宽） */}
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
          <div className="text-gray-400 text-sm font-semibold mb-1">面试官问题</div>
          <div
            className="text-gray-300 text-sm break-words whitespace-pre-line max-w-full"
            style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}
          >
            {currentQuestion.title}
          </div>
        </div>
        <div className="sticky bottom-0 left-0 right-0 bg-gray-800 p-4 flex flex-col gap-2 z-10 border-t border-gray-700">
          <button
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm w-full"
            onClick={() => setHistoryVisible(true)}
          >
            查看历史记录
          </button>
          {/* <button
            className={`bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm w-full flex items-center justify-center ${isRunning ? 'opacity-60 cursor-not-allowed' : ''}`}
            onClick={handleRunCode}
            disabled={isRunning}
          >
            {isRunning ? '运行中...' : '运行代码'}
          </button> */}
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
                {/* 运行符号：使用经典的“播放”三角形图标 */}
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
            {/* 输入框和运行结果 */}
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

      {/* 右侧：视频区（竖直排列，收起IDE时也能完整显示） */}
      <div
        className={`transition-all duration-300 bg-gray-800 p-6 flex flex-col gap-8 items-center w-full ${showEditor ? 'md:w-1/5' : ''} min-w-[120px]`}
        style={{ minHeight: '0', justifyContent: 'center' }}
      >
        {/* 面试官视频块 */}
        <div className="flex flex-col items-center justify-center w-full max-w-[400px] mx-auto" style={{ maxHeight: '40vh' }}>
          <div className="text-center text-xs text-gray-400 mb-2">
            数字人面试官
            <span className={`ml-2 px-2 py-1 rounded text-xs ${isDigitalHumanConnected ? 'bg-green-600' : 'bg-red-600'}`}>
              {isDigitalHumanConnected ? '已连接' : '未连接'}
            </span>
          </div>
          <div className="bg-black w-full aspect-square rounded-md flex items-center justify-center text-3xl mb-4 min-w-[120px] min-h-[120px] max-w-[400px] max-h-[40vh] relative">
            {/* 数字人形象渲染区域 */}
            <div className="absolute inset-0 flex items-center justify-center">
              {isDigitalHumanSpeaking ? (
                <div className="text-blue-400 animate-pulse flex flex-col items-center">
                  <div className="text-2xl mb-2">🎤</div>
                  <div className="text-sm">正在说话...</div>
                  <div className="text-xs text-blue-300 mt-1">状态: {isDigitalHumanSpeaking ? 'true' : 'false'}</div>
                </div>
              ) : (
                <div className="text-gray-500 flex flex-col items-center">
                  <div className="text-4xl mb-2">🤖</div>
                  <div className="text-sm">数字人形象</div>
                  <div className="text-xs text-gray-400 mt-1">状态: {isDigitalHumanSpeaking ? 'true' : 'false'}</div>
                </div>
              )}
            </div>
            
            {/* 添加音频可视化效果 */}
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
            <div className="text-xs text-gray-400 mb-1">数字人文本</div>
            <textarea
              className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white resize-none h-16"
              value={digitalHumanText}
              onChange={(e) => setDigitalHumanText(e.target.value)}
              placeholder="输入要转换为语音的文本..."
            />
            <div className="flex space-x-2">
              <button
                className={`px-3 py-1 rounded text-xs font-medium ${
                  isDigitalHumanConnected 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
                onClick={() => sendTextToDigitalHuman(digitalHumanText)}
                disabled={!isDigitalHumanConnected || !digitalHumanText.trim()}
              >
                播放语音
              </button>
              <button
                className={`px-3 py-1 rounded text-xs font-medium ${
                  isDigitalHumanConnected 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
                onClick={() => sendTextToDigitalHuman('你好，我是数字人面试官，很高兴见到你！')}
                disabled={!isDigitalHumanConnected}
              >
                测试语音
              </button>
            </div>
          </div>
        </div>
        {/* 面试者视频块 */}
        <div className="flex flex-col items-center justify-center w-full max-w-[400px] mx-auto" style={{ maxHeight: '40vh' }}>
          <div className="text-center text-xs text-gray-400 mb-2">面试者</div>
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
          <div className="mt-2 flex space-x-2 justify-center">
            <button
              className={`px-3 py-1 rounded text-sm font-medium ${isRecording ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
              onClick={startCollect}
              disabled={isRecording}
            >
              开始采集
            </button>
            <button
              className={`px-3 py-1 rounded text-sm font-medium ${!isRecording ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white'}`}
              onClick={stopCollect}
              disabled={!isRecording}
            >
              停止采集
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-300 min-h-[1.5em]">{transcript}</div>
        </div>
      </div>
      {/* 历史记录弹窗（Tailwind + Headless UI） */}
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
