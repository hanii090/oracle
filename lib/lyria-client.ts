import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

export type EmotionWeights = {
  tension?: number; grief?: number; wonder?: number;
  relief?: number; dread?: number; stillness?: number;
}

const EMOTION_TO_PROMPT: Record<string, string> = {
  tension: "tense sparse piano, minor key, unresolved chord, silence between notes",
  grief: "slow cello, low register, long sustained notes, minor thirds",
  wonder: "shimmering strings, open fifths, gentle arpeggios, soft reverb",
  relief: "warm harmonics, major key resolution, slow breath, returning home",
  dread: "deep bass drone, dissonant intervals, slow pulse, atmospheric dark",
  stillness: "near silence, single note held, infinite reverb, empty space"
}

export class LyriaFoleyEngine {
  private session: any = null;
  private audioCtx: AudioContext | null = null;
  private nextPlayTime = 0;
  private isPlaying = false;
  private reconnectAttempts = 0;

  async connect() {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY?.trim();
    if (!apiKey) return;

    try {
      const ai = new GoogleGenAI({ apiKey });
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        callbacks: {
          onopen: () => {
            this.isPlaying = true;
            this.steer({ stillness: 0.7, wonder: 0.3 });
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              const pcmData = this.base64ToFloat32(base64Audio);
              this.queueAudio(pcmData);
            }
          },
          onclose: () => {
            if (this.isPlaying && this.reconnectAttempts < 5) {
              const delay = Math.pow(2, this.reconnectAttempts) * 1000;
              setTimeout(() => this.connect(), delay);
              this.reconnectAttempts++;
            }
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } }
          },
          systemInstruction: "Generate ambient music based on the user's emotional state."
        }
      });

      this.session = await sessionPromise;
    } catch (e) {
      console.error("Lyria connection failed", e);
    }
  }

  steer(emotions: EmotionWeights) {
    if (!this.session) return;

    const weightedPrompts = Object.entries(emotions)
      .filter(([, weight]) => (weight as number) > 0.05)
      .map(([emotion, weight]) => ({
        text: EMOTION_TO_PROMPT[emotion],
        weight: weight as number
      }));

    const promptText = weightedPrompts.map(p => `${p.text} (weight: ${p.weight})`).join(", ");

    this.session.sendRealtimeInput([{
      text: `Generate ambient music with these characteristics: ${promptText}`
    }]);
  }

  async triggerBreakthrough() {
    this.steer({ wonder: 0.9, relief: 0.3, stillness: 0.1 });
    await new Promise(r => setTimeout(r, 8000));
    this.steer({ stillness: 0.8 });
  }

  private queueAudio(pcm: Float32Array) {
    if (!this.audioCtx) return;
    const buffer = this.audioCtx.createBuffer(1, pcm.length, 24000);
    buffer.getChannelData(0).set(pcm);
    const source = this.audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioCtx.destination);
    
    const currentTime = this.audioCtx.currentTime;
    if (this.nextPlayTime < currentTime) {
      this.nextPlayTime = currentTime;
    }
    source.start(this.nextPlayTime);
    this.nextPlayTime += buffer.duration;
  }

  private base64ToFloat32(b64: string): Float32Array {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768;
    return float32;
  }

  disconnect() {
    this.isPlaying = false;
    if (this.session) {
      // The Live API doesn't expose a close method directly on the session object in all versions,
      // but we can just null it out to stop sending.
      this.session = null;
    }
    this.audioCtx?.close();
  }
}
