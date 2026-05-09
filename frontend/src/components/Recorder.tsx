import { useRef, useState } from 'react';

type Props = {
  disabled: boolean;
  onRecordComplete: (audio: Blob) => Promise<void>;
};

function getSupportedMimeType(): string | undefined {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];
  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate));
}

export function Recorder({ disabled, onRecordComplete }: Props) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audio = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        chunksRef.current = [];
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setProcessing(true);
        void onRecordComplete(audio)
          .catch((err: unknown) => {
            setError(err instanceof Error ? err.message : '文字起こしに失敗しました。');
          })
          .finally(() => {
            setProcessing(false);
          });
      };

      recorder.start();
      setRecording(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '録音を開始できませんでした。');
    }
  }

  function stopRecording() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;
    recorder.stop();
    recorderRef.current = null;
    setRecording(false);
  }

  return (
    <section className="recorderPanel">
      <div>
        <h2>録音</h2>
        <p>録音停止後にサーバーへ送信し、Whisperで文字起こしします。</p>
      </div>
      <div className="recorderActions">
        {!recording ? (
          <button
            className="primary"
            type="button"
            disabled={disabled || processing}
            onClick={() => void startRecording()}
          >
            Start
          </button>
        ) : (
          <button className="stop" type="button" onClick={stopRecording}>
            Stop
          </button>
        )}
        {processing ? <span className="statusText">文字起こし中...</span> : null}
        {recording ? <span className="recordingDot">録音中</span> : null}
      </div>
      {error ? <div className="errorBox">{error}</div> : null}
    </section>
  );
}
