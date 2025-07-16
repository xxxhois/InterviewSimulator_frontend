'use client';

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
const mockHistory = [
  { question: '什么是闭包？', answer: '闭包是函数和其引用的变量环境的组合。' },
  { question: '手写防抖函数', answer: 'function debounce(fn, delay) { /* ... */ }' },
];

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
  const [historyList, setHistoryList] = useState(mockHistory); // 改为可变
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  // 当前采集QA的索引，-1表示无
  const [currentQAIndex, setCurrentQAIndex] = useState(-1);
  // 用ref保存最新的QA索引，保证onmessage里能取到最新值
  const currentQAIndexRef = useRef(-1);
  useEffect(() => { currentQAIndexRef.current = currentQAIndex; }, [currentQAIndex]);
  const lastTextRef = useRef('');

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
    // 新增一条QA记录，answer为空，并设置当前索引
    setHistoryList((prev) => {
      const newList = [...prev, { question: '实时转写', answer: '' }];
      setCurrentQAIndex(newList.length - 1);
      currentQAIndexRef.current = newList.length - 1;
      return newList;
    });
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
        if (data.type === 'asr_result') {
          let text = data.text;
          // 尝试提取所有中文
          try {
            const obj = typeof text === 'string' ? JSON.parse(text) : text;
            function extractChinese(obj: any): string {
              let result = '';
              if (typeof obj === 'string') {
                result += obj.match(/[\u4e00-\u9fa5，。！？、；：“”‘’（）《》【】]/g)?.join('') || '';
              } else if (Array.isArray(obj)) {
                for (const item of obj) result += extractChinese(item);
              } else if (typeof obj === 'object' && obj !== null) {
                for (const key in obj) result += extractChinese(obj[key]);
              }
              return result;
            }
            text = extractChinese(obj);
          } catch (e) {}
          setTranscript(text || '[无转写内容]');
          // 先在 onmessage 作用域外部处理去重拼接
          const idx = currentQAIndexRef.current;
          if (idx === -1 || !text) return;
          let last = lastTextRef.current;
          let append = text.startsWith(last) ? text.slice(last.length) : text;
          lastTextRef.current = text;
          setHistoryList((prev) => {
            const newList = [...prev];
            newList[idx] = {
              ...newList[idx],
              answer: (newList[idx].answer || '') + append
            };
            return newList;
          });
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
      console.log('inputData[0~5]:', inputData.slice(0, 5));
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
        console.log('发送音频帧', base64String.length);
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

  useEffect(() => {
    // 页面卸载时清理
    return () => {
      stopCollect();
    };
    // eslint-disable-next-line
  }, []);

  // 预留：当前问题、提示、历史、视频流等接口
  const currentQuestion = mockQuestion; // TODO: 替换为实际接口

  return (
    <div className="h-screen w-screen bg-gray-900 text-white flex flex-row">
      {/* 左侧：问题区 */}
      <div className="w-1/5 bg-gray-800 border-r border-gray-700 p-6 flex flex-col justify-between">
        <div>
          <div className="text-purple-400 font-bold text-lg mb-2">当前问题</div>
          <div className="text-base mb-4">{currentQuestion.title}</div>
          <div className="text-gray-400 text-sm font-semibold mb-1">提示</div>
          <div className="text-gray-300 text-sm">{currentQuestion.hint}</div>
        </div>
        <button
          className="mt-8 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm"
          onClick={() => setHistoryVisible(true)}
        >
          查看历史记录
        </button>
      </div>

      {/* 中间：代码编辑区 */}
      <div className="w-3/5 flex flex-col bg-gray-900 p-6">
        <div className="flex items-center mb-2">
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
        <div className="flex-1 min-h-0">
          <MonacoEditor
            height="calc(100vh - 120px)"
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
      </div>

      {/* 右侧：视频区 */}
      <div className="w-1/5 bg-gray-800 p-6 flex flex-col justify-between items-center">
        <div className="w-full">
          <div className="text-center text-xs text-gray-400 mb-2">数字人面试官</div>
          {/* 预留：面试官视频流 */}
          <div className="bg-black w-full aspect-square rounded-md flex items-center justify-center text-3xl mb-6">🤖</div>
        </div>
        <div className="w-full">
          <div className="text-center text-xs text-gray-400 mb-2">面试者</div>
          {/* 面试者视频流 */}
          <div className="bg-black w-full aspect-square rounded-md flex flex-col items-center justify-center text-3xl relative">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover rounded-md"
              style={{ background: 'black' }}
            />
            {!isRecording && <span className="z-10">🧑‍💻</span>}
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
