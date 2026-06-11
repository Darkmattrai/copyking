"use client";

import { useRef, useState } from "react";

// Reusable voice-note button: records audio, transcribes it via /api/transcribe
// (Whisper), and hands the text back. Drop it into any chat input row.
export function MicButton({
  onText,
  onError,
  disabled,
}: {
  onText: (text: string) => void;
  onError?: (msg: string) => void;
  disabled?: boolean;
}) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const toggle = async () => {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        if (!blob.size) return;
        setTranscribing(true);
        try {
          const ext = (mr.mimeType || "").includes("mp4") ? "mp4" : "webm";
          const fd = new FormData();
          fd.append("audio", blob, `voice.${ext}`);
          const res = await fetch("/api/transcribe", { method: "POST", body: fd });
          const data = await res.json();
          if (res.ok && data.text) onText(data.text as string);
          else onError?.(data?.error || "Transcription failed");
        } catch {
          onError?.("Transcription failed");
        } finally {
          setTranscribing(false);
        }
      };
      recorderRef.current = mr;
      mr.start();
      setRecording(true);
    } catch {
      onError?.("Couldn't access the microphone.");
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled || transcribing}
      title={recording ? "Stop recording" : "Record a voice note"}
      className={`!px-3 !py-2 rounded-lg border text-sm shrink-0 transition-colors ${
        recording
          ? "border-red-500 bg-red-500/10 text-red-500 animate-pulse"
          : "border-border text-text-secondary hover:text-text-primary"
      } disabled:opacity-50`}
    >
      {transcribing ? "…" : recording ? "■" : "🎤"}
    </button>
  );
}
