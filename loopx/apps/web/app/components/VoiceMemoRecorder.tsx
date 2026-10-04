'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface VoiceMemoRecorderProps {
  onMemoReady: (audioBlob: Blob, durationSeconds: number) => void;
  onCancel: () => void;
}

export function VoiceMemoRecorder({ onMemoReady, onCancel }: VoiceMemoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [waveformBars, setWaveformBars] = useState<number[]>(Array(24).fill(4));
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const MAX_SECONDS = 30;

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    cancelAnimationFrame(animFrameRef.current);
    setIsRecording(false);
  }, []);

  // Auto-stop at 30s
  useEffect(() => {
    if (isRecording && elapsed >= MAX_SECONDS) {
      stopRecording();
    }
  }, [elapsed, isRecording, stopRecording]);

  async function startRecording() {
    setError(null);
    setAudioUrl(null);
    setAudioBlob(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Setup analyser for waveform visualizer
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      function drawWaveform() {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const bars = Array.from({ length: 24 }, (_, i) => {
          const val = dataArray[Math.floor((i * dataArray.length) / 24)] ?? 0;
          return Math.max(4, Math.round((val / 255) * 28));
        });
        setWaveformBars(bars);
        animFrameRef.current = requestAnimationFrame(drawWaveform);
      }
      drawWaveform();

      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const dur = (Date.now() - startTimeRef.current) / 1000;
        setAudioBlob(blob);
        setAudioUrl(url);
        setAudioDuration(Math.round(dur));
        // stop all tracks
        stream.getTracks().forEach((t) => t.stop());
        audioCtx.close();
      };

      mediaRecorderRef.current = recorder;
      recorder.start(100);
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setElapsed(0);

      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setError('Microphone access denied. Please allow mic permission.');
    }
  }

  function handleSend() {
    if (!audioBlob) return;
    onMemoReady(audioBlob, audioDuration);
  }

  function handleDiscard() {
    setAudioUrl(null);
    setAudioBlob(null);
    setElapsed(0);
    setWaveformBars(Array(24).fill(4));
  }

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50/70 border border-violet-200/80 shadow-lg animate-fade-in">
      {error && (
        <p className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5 mb-2">{error}</p>
      )}

      {!audioUrl ? (
        /* Recording UI */
        <div className="flex flex-col items-center gap-3">
          {/* Waveform */}
          <div className="flex items-end gap-[2px] h-8 px-2">
            {waveformBars.map((h, i) => (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-75 ${
                  isRecording ? 'bg-violet-500' : 'bg-neutral-300'
                }`}
                style={{ height: `${h}px` }}
              />
            ))}
          </div>

          {/* Timer */}
          <div className="flex items-center gap-2">
            {isRecording && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            )}
            <span className="text-sm font-mono font-bold text-neutral-800">
              {formatTime(elapsed)}
              {isRecording && <span className="text-neutral-400"> / {formatTime(MAX_SECONDS)}</span>}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {!isRecording ? (
              <>
                <button
                  onClick={startRecording}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-md transition-all active:scale-95"
                >
                  🎙️ Record Memo
                </button>
                <button
                  onClick={onCancel}
                  className="px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={stopRecording}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold shadow-md transition-all active:scale-95"
                >
                  ⏹ Stop
                </button>
                <span className="text-[10px] text-violet-600 font-mono">Recording…</span>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Preview UI */
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-violet-800">
            🎙️ Voice Memo — {formatTime(audioDuration)}
          </div>
          <audio src={audioUrl} controls className="w-full h-8 rounded-lg" style={{ height: '32px' }} />
          <div className="flex items-center gap-2">
            <button
              onClick={handleSend}
              className="flex-1 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-all active:scale-95 shadow-md"
            >
              📤 Send Memo
            </button>
            <button
              onClick={handleDiscard}
              className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 text-xs font-medium transition-colors"
            >
              Redo
            </button>
            <button
              onClick={onCancel}
              className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-red-50 text-neutral-600 hover:text-red-600 text-xs font-medium transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Inline Audio Player for rendered voice memos in chat ──────────────────────

interface VoiceMemoPlayerProps {
  audioUrl: string;
  durationSeconds?: number;
  isMe: boolean;
}

export function VoiceMemoPlayer({ audioUrl, durationSeconds, isMe }: VoiceMemoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds ?? 0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.onloadedmetadata = () => setDuration(audio.duration);
    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
      setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
    };
    audio.onended = () => { setIsPlaying(false); setProgress(0); setCurrentTime(0); };
    return () => { audio.pause(); audio.src = ''; };
  }, [audioUrl]);

  function togglePlay() {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play(); setIsPlaying(true); }
  }

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${Math.floor(s % 60).toString().padStart(2, '0')}`;

  return (
    <div
      className={`flex items-center gap-2.5 mt-1.5 px-3 py-2.5 rounded-xl ${
        isMe ? 'bg-violet-700/30 border border-violet-500/40' : 'bg-violet-50 border border-violet-200'
      }`}
    >
      <button
        onClick={togglePlay}
        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-sm shrink-0 ${
          isMe ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-violet-600 hover:bg-violet-700 text-white'
        }`}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      <div className="flex-1 min-w-0 space-y-1">
        <div
          className={`w-full h-1 rounded-full overflow-hidden ${isMe ? 'bg-white/20' : 'bg-violet-200'}`}
        >
          <div
            className={`h-full rounded-full transition-all ${isMe ? 'bg-white' : 'bg-violet-600'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className={`flex items-center justify-between text-[9px] font-mono ${isMe ? 'text-white/60' : 'text-violet-600'}`}>
          <span>🎙️ Voice Memo</span>
          <span>{fmt(isPlaying ? currentTime : duration)}</span>
        </div>
      </div>
    </div>
  );
}
