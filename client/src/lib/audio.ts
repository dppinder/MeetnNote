import { loadSettings, wsBase } from "./settings";
import type { WsServerMessage } from "./types";

const TARGET_SAMPLE_RATE = 16000;

function resampleTo16k(input: Float32Array, inputRate: number): Float32Array {
  if (inputRate === TARGET_SAMPLE_RATE) return input;
  const ratio = inputRate / TARGET_SAMPLE_RATE;
  const outLength = Math.floor(input.length / ratio);
  const output = new Float32Array(outLength);
  for (let i = 0; i < outLength; i++) {
    const srcPos = i * ratio;
    const lo = Math.floor(srcPos);
    const hi = Math.min(lo + 1, input.length - 1);
    const frac = srcPos - lo;
    output[i] = input[lo] * (1 - frac) + input[hi] * frac;
  }
  return output;
}

function floatTo16BitPCM(input: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(input.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

export async function listAudioInputDevices(): Promise<MediaDeviceInfo[]> {
  // Labels are only populated after a permission grant; callers should
  // request a stream once (e.g. via a first `start()`) before relying on labels.
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((d) => d.kind === "audioinput");
}

export class MeetingRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private ws: WebSocket | null = null;
  private stopping = false;

  constructor(
    private meetingId: string,
    private onMessage: (msg: WsServerMessage) => void,
    private onError: (err: Error) => void,
  ) {}

  async start(deviceId?: string): Promise<void> {
    const settings = loadSettings();

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    this.audioContext = new AudioContext();
    await this.audioContext.audioWorklet.addModule("/pcm-worklet.js");

    const source = this.audioContext.createMediaStreamSource(this.stream);
    this.workletNode = new AudioWorkletNode(this.audioContext, "pcm-recorder");
    source.connect(this.workletNode);
    // Deliberately not connected to audioContext.destination — we only
    // capture, we don't want to loop mic audio back out of the speakers.

    const wsUrl = `${wsBase(settings)}/meetings/${this.meetingId}/audio?token=${encodeURIComponent(settings.token)}`;
    this.ws = new WebSocket(wsUrl);
    this.ws.binaryType = "arraybuffer";

    await new Promise<void>((resolve, reject) => {
      if (!this.ws) return reject(new Error("WebSocket not created"));
      this.ws.onopen = () => resolve();
      this.ws.onerror = () => reject(new Error("Failed to connect to server. Check Settings."));
    });

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as WsServerMessage;
        this.onMessage(msg);
      } catch {
        // ignore malformed frames
      }
    };
    this.ws.onerror = () => this.onError(new Error("Connection to server lost."));
    this.ws.onclose = () => {
      if (!this.stopping) this.onError(new Error("Connection to server closed unexpectedly."));
    };

    const inputRate = this.audioContext.sampleRate;
    this.workletNode.port.onmessage = (event: MessageEvent<Float32Array>) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
      const resampled = resampleTo16k(event.data, inputRate);
      const pcm16 = floatTo16BitPCM(resampled);
      this.ws.send(pcm16);
    };
  }

  stop(): Promise<void> {
    this.stopping = true;
    return new Promise((resolve) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const finish = () => {
          this.teardown();
          resolve();
        };
        const timeout = setTimeout(finish, 5000);
        this.ws.addEventListener(
          "message",
          (event) => {
            try {
              const msg = JSON.parse(event.data);
              if (msg.type === "stopped") {
                clearTimeout(timeout);
                finish();
              }
            } catch {
              /* ignore */
            }
          },
          { once: false },
        );
        this.ws.send(JSON.stringify({ action: "stop" }));
      } else {
        this.teardown();
        resolve();
      }
    });
  }

  private teardown(): void {
    this.workletNode?.disconnect();
    this.audioContext?.close();
    this.stream?.getTracks().forEach((t) => t.stop());
    if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.close();
    this.workletNode = null;
    this.audioContext = null;
    this.stream = null;
    this.ws = null;
  }
}
