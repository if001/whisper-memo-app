import { FormEvent, useState } from 'react';
import type { Transcription } from '../types';

type Props = {
  transcription: Transcription;
  onUpdate: (id: number, payload: Pick<Transcription, 'title' | 'text'>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('ja-JP', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function TranscriptionItem({ transcription, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(transcription.title);
  const [text, setText] = useState(transcription.text);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await onUpdate(transcription.id, { title, text });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const ok = window.confirm('この文字起こしを削除しますか？');
    if (!ok) return;
    await onDelete(transcription.id);
  }

  if (editing) {
    return (
      <form className="memoCard editing" onSubmit={handleSubmit}>
        <input value={title} onChange={(event) => setTitle(event.target.value)} />
        <textarea value={text} onChange={(event) => setText(event.target.value)} rows={8} />
        <div className="cardActions">
          <button type="submit" disabled={saving || !title.trim()}>
            保存
          </button>
          <button type="button" onClick={() => setEditing(false)}>
            キャンセル
          </button>
        </div>
      </form>
    );
  }

  return (
    <article className="memoCard">
      <header>
        <div>
          <h3>{transcription.title}</h3>
          <p>
            {formatDate(transcription.created_at)}
            {transcription.language ? ` · ${transcription.language}` : ''}
            {` · ${transcription.status}`}
          </p>
        </div>
        <div className="cardActions">
          <button type="button" onClick={() => setEditing(true)}>
            編集
          </button>
          <button className="danger" type="button" onClick={() => void handleDelete()}>
            削除
          </button>
        </div>
      </header>
      {transcription.status === 'failed' ? (
        <div className="errorBox">{transcription.error_message ?? '文字起こしに失敗しました。'}</div>
      ) : (
        <p className="memoText">{transcription.text || '文字起こし結果はまだありません。'}</p>
      )}
    </article>
  );
}
