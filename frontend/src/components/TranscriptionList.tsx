import type { Transcription } from '../types';
import { TranscriptionItem } from './TranscriptionItem';

type Props = {
  transcriptions: Transcription[];
  loading: boolean;
  onUpdate: (id: number, payload: Pick<Transcription, 'title' | 'text'>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
};

export function TranscriptionList({ transcriptions, loading, onUpdate, onDelete }: Props) {
  if (loading) {
    return <div className="emptyState">文字起こし一覧を読み込み中...</div>;
  }

  if (transcriptions.length === 0) {
    return <div className="emptyState">まだ文字起こしがありません。Start から録音してください。</div>;
  }

  return (
    <section className="memoList">
      {transcriptions.map((transcription) => (
        <TranscriptionItem
          key={transcription.id}
          transcription={transcription}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </section>
  );
}
