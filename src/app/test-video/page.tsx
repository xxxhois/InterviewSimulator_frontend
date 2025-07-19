'use client';

import { RTCPlayer } from '@/lib/rtcplayer';
import { useEffect, useRef, useState } from 'react';

export default function TestVideoPage() {
  const [isRTCPlayerConnected, setIsRTCPlayerConnected] = useState(false);
  const [isSimpleVideoPlaying, setIsSimpleVideoPlaying] = useState(false);
  const [logMessages, setLogMessages] = useState<string[]>([]);
  
  const rtcPlayerRef = useRef<InstanceType<typeof RTCPlayer> | null>(null);
  const rtcContainerRef = useRef<HTMLDivElement | null>(null);
  const simpleVideoRef = useRef<HTMLVideoElement | null>(null);

  // 添加日志
  const addLog = (message: string) => {
    console.log(message);
    setLogMessages(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // 测试简单的video元素
  const testSimpleVideo = () => {
    addLog('开始测试简单video元素');
    
    if (!simpleVideoRef.current) {
      addLog('错误: 找不到video元素');
      return;
    }

    try {
      // 创建一个测试视频流（使用摄像头）
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
          addLog('获取到摄像头流');
          simpleVideoRef.current!.srcObject = stream;
          simpleVideoRef.current!.play()
            .then(() => {
              addLog('简单video播放成功');
              setIsSimpleVideoPlaying(true);
            })
            .catch(error => {
              addLog(`简单video播放失败: ${error.message}`);
            });
        })
        .catch(error => {
          addLog(`获取摄像头失败: ${error.message}`);
        });
    } catch (error: any) {
      addLog(`测试简单video出错: ${error?.message}`);
    }
  };

  // 测试RTCPlayer
  const testRTCPlayer = () => {
    addLog('开始测试RTCPlayer');
    
    if (!rtcContainerRef.current) {
      addLog('错误: 找不到RTCPlayer容器');
      return;
    }

    try {
      // 先销毁之前的实例
      if (rtcPlayerRef.current) {
        addLog('销毁之前的RTCPlayer实例');
        rtcPlayerRef.current.destroy();
        rtcPlayerRef.current = null;
      }

      // 创建RTCPlayer实例
      addLog('创建新的RTCPlayer实例');
      const player = new RTCPlayer();
      rtcPlayerRef.current = player;

      // 设置监听事件
      player.on("play", function() {
        addLog("RTCPlayer: 播放开始");
      })
      .on("playing", function() {
        addLog("RTCPlayer: 播放中");
        setIsRTCPlayerConnected(true);
      })
      .on("waiting", function() {
        addLog("RTCPlayer: 等待中");
      })
      .on("error", function(e: any) {
        addLog(`RTCPlayer: 错误 - ${JSON.stringify(e)}`);
        setIsRTCPlayerConnected(false);
      })
      .on("not-allowed", function() {
        addLog("RTCPlayer: 触发浏览器限制播放策略");
        player.resume();
      });

      // 设置XRTC协议参数
      addLog('设置RTCPlayer参数');
      player.playerType = 12;
      player.stream = {
        sid: "vms000ec4da@dx195f094539d6f19882",
        server: "https://xrtc-cn-east-2.xf-yun.com",
        auth: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIxMDAwMDAwMDAxIiwidGltZSI6MTY0ODAxODQ2MTU0MywiaWF0IjoxNjQ4MTkxMjQyfQ.CTcOh_kCLqvvglo5VLVnjgpZzoFpzk7Un3Et0c9dhUs",
        appid: "1000000001",
        userId: "123123123",
        roomId: "ase0001bbe2hu19632f0f6070442142",
        timeStr: "123412341324",
      };

      // 设置视频尺寸
      player.videoSize = { 
        width: 720,
        height: 1280,
      };
      
      // 将视频流填充进容器中
      addLog('设置RTCPlayer容器');
      player.container = rtcContainerRef.current;

      // 开始播放
      addLog('开始RTCPlayer播放');
      player.play();

    } catch (error: any) {
      addLog(`初始化RTCPlayer失败: ${error?.message}`);
      console.error('RTCPlayer错误详情:', error);
    }
  };

  // 测试RTCPlayer使用本地视频流
  const testRTCPlayerWithLocalStream = () => {
    addLog('开始测试RTCPlayer使用本地视频流');
    
    if (!rtcContainerRef.current) {
      addLog('错误: 找不到RTCPlayer容器');
      return;
    }

    try {
      // 先销毁之前的实例
      if (rtcPlayerRef.current) {
        addLog('销毁之前的RTCPlayer实例');
        rtcPlayerRef.current.destroy();
        rtcPlayerRef.current = null;
      }

      // 获取本地视频流
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
          addLog('获取到本地视频流');
          
          // 创建RTCPlayer实例
          addLog('创建新的RTCPlayer实例');
          const player = new RTCPlayer();
          rtcPlayerRef.current = player;

          // 设置监听事件
          player.on("play", function() {
            addLog("RTCPlayer: 播放开始");
          })
          .on("playing", function() {
            addLog("RTCPlayer: 播放中");
            setIsRTCPlayerConnected(true);
          })
          .on("waiting", function() {
            addLog("RTCPlayer: 等待中");
          })
          .on("error", function(e: any) {
            addLog(`RTCPlayer: 错误 - ${JSON.stringify(e)}`);
            setIsRTCPlayerConnected(false);
          })
          .on("not-allowed", function() {
            addLog("RTCPlayer: 触发浏览器限制播放策略");
            player.resume();
          });

          // 尝试直接设置视频流
          addLog('尝试直接设置视频流到RTCPlayer');
          
          // 将视频流填充进容器中
          addLog('设置RTCPlayer容器');
          player.container = rtcContainerRef.current;

          // 尝试使用play方法
          addLog('开始RTCPlayer播放');
          player.play();

        })
        .catch(error => {
          addLog(`获取本地视频流失败: ${error.message}`);
        });

    } catch (error: any) {
      addLog(`初始化RTCPlayer失败: ${error?.message}`);
      console.error('RTCPlayer错误详情:', error);
    }
  };

  // 清理资源
  const cleanup = () => {
    addLog('清理资源');
    
    // 清理RTCPlayer
    if (rtcPlayerRef.current) {
      rtcPlayerRef.current.destroy();
      rtcPlayerRef.current = null;
      setIsRTCPlayerConnected(false);
    }
    
    // 清理简单video
    if (simpleVideoRef.current && simpleVideoRef.current.srcObject) {
      const stream = simpleVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      simpleVideoRef.current.srcObject = null;
      setIsSimpleVideoPlaying(false);
    }
  };

  useEffect(() => {
    addLog('测试页面加载完成');
    
    return () => {
      cleanup();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">视频渲染测试页面</h1>
        
        {/* 控制按钮 */}
        <div className="mb-6 space-x-4">
          <button
            onClick={testSimpleVideo}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            测试简单Video
          </button>
          <button
            onClick={testRTCPlayer}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
          >
            测试RTCPlayer
          </button>
          <button
            onClick={testRTCPlayerWithLocalStream}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded"
          >
            测试RTCPlayer(本地流)
          </button>
          <button
            onClick={cleanup}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
          >
            清理资源
          </button>
        </div>

        {/* 状态显示 */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="bg-gray-800 p-4 rounded">
            <h3 className="text-lg font-semibold mb-2">简单Video状态</h3>
            <div className={`inline-block px-2 py-1 rounded text-sm ${
              isSimpleVideoPlaying ? 'bg-green-600' : 'bg-red-600'
            }`}>
              {isSimpleVideoPlaying ? '播放中' : '未播放'}
            </div>
          </div>
          <div className="bg-gray-800 p-4 rounded">
            <h3 className="text-lg font-semibold mb-2">RTCPlayer状态</h3>
            <div className={`inline-block px-2 py-1 rounded text-sm ${
              isRTCPlayerConnected ? 'bg-green-600' : 'bg-red-600'
            }`}>
              {isRTCPlayerConnected ? '已连接' : '未连接'}
            </div>
          </div>
        </div>

        {/* 视频容器 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 简单Video容器 */}
          <div className="bg-gray-800 p-4 rounded">
            <h3 className="text-lg font-semibold mb-4">简单Video测试</h3>
            <div className="bg-black w-full aspect-square rounded-md relative overflow-hidden">
              <video
                ref={simpleVideoRef}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
              />
              {!isSimpleVideoPlaying && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  等待播放...
                </div>
              )}
            </div>
          </div>

          {/* RTCPlayer容器 */}
          <div className="bg-gray-800 p-4 rounded">
            <h3 className="text-lg font-semibold mb-4">RTCPlayer测试</h3>
            <div className="bg-black w-full aspect-square rounded-md relative overflow-hidden">
              <div 
                ref={rtcContainerRef}
                className="w-full h-full"
                style={{ backgroundColor: 'black' }}
              />
              {!isRTCPlayerConnected && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  等待连接...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 日志显示 */}
        <div className="bg-gray-800 p-4 rounded">
          <h3 className="text-lg font-semibold mb-4">日志信息</h3>
          <div className="bg-black p-4 rounded h-64 overflow-y-auto font-mono text-sm">
            {logMessages.length === 0 ? (
              <div className="text-gray-400">暂无日志</div>
            ) : (
              logMessages.map((message, index) => (
                <div key={index} className="mb-1">
                  {message}
                </div>
              ))
            )}
          </div>
          <button
            onClick={() => setLogMessages([])}
            className="mt-2 px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
          >
            清空日志
          </button>
        </div>
      </div>
    </div>
  );
} 