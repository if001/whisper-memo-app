import { FormEvent, useState } from 'react';
import type { Project } from '../types';

type Props = {
  projects: Project[];
  selectedProjectId: number | null;
  onSelect: (projectId: number) => void;
  onCreate: (name: string) => Promise<void>;
  onDelete: (projectId: number) => Promise<void>;
  loading: boolean;
};

export function ProjectDrawer({
  projects,
  selectedProjectId,
  onSelect,
  onCreate,
  onDelete,
  loading,
}: Props) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      await onCreate(trimmed);
      setName('');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(project: Project) {
    const ok = window.confirm(`「${project.name}」を削除しますか？関連する文字起こしも削除されます。`);
    if (!ok) return;
    await onDelete(project.id);
  }

  return (
    <aside className="drawer">
      <div className="drawerHeader">
        <div>
          <h1>Whisper Memo</h1>
          <p>音声メモ文字起こし</p>
        </div>
      </div>

      <form className="projectForm" onSubmit={handleSubmit}>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="新しいプロジェクト"
          disabled={submitting}
        />
        <button type="submit" disabled={submitting || !name.trim()}>
          作成
        </button>
      </form>

      <div className="projectList">
        {loading ? <div className="muted">読み込み中...</div> : null}
        {!loading && projects.length === 0 ? (
          <div className="emptySmall">プロジェクトを作成してください。</div>
        ) : null}

        {projects.map((project) => (
          <div
            className={project.id === selectedProjectId ? 'project active' : 'project'}
            key={project.id}
          >
            <button className="projectName" type="button" onClick={() => onSelect(project.id)}>
              {project.name}
            </button>
            <button
              className="iconButton danger"
              type="button"
              title="削除"
              onClick={() => void handleDelete(project)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
