declare module '@/lib/rtcplayer.esm.js' {
  export default class RTCPlayer {
    constructor();
    on(event: string, callback: Function): RTCPlayer;
    play(): void;
    resume(): void;
    stop(): void;
    destroy(): void;
    playerType: number;
    stream: any;
    videoSize: { width: number; height: number };
    container: HTMLElement;
  }
} 