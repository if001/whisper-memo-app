import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from './api/client';
import { ProjectDrawer } from './components/ProjectDrawer';
import { Recorder } from './components/Recorder';
import { TranscriptionList } from './components/TranscriptionList';
import type { Project, Transcription } from './types';
import './styles.css';

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingTranscriptions, setLoadingTranscriptions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  const loadProjects = useCallback(async () => {
    setLoadingProjects(true);
    setError(null);
    try {
      const data = await api.listProjects();
      setProjects(data);
      setSelectedProjectId((current) => {
        if (current && data.some((project) => project.id === current)) {
          return current;
        }
        return data[0]?.id ?? null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'プロジェクト一覧の取得に失敗しました。');
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  const loadTranscriptions = useCallback(async (projectId: number) => {
    setLoadingTranscriptions(true);
    setError(null);
    try {
      const data = await api.listTranscriptions(projectId);
      setTranscriptions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '文字起こし一覧の取得に失敗しました。');
    } finally {
      setLoadingTranscriptions(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (selectedProjectId === null) {
      setTranscriptions([]);
      return;
    }
    void loadTranscriptions(selectedProjectId);
  }, [selectedProjectId, loadTranscriptions]);

  async function createProject(name: string) {
    const project = await api.createProject(name);
    setProjects((current) => [project, ...current]);
    setSelectedProjectId(project.id);
  }

  async function deleteProject(projectId: number) {
    await api.deleteProject(projectId);
    const nextProjects = projects.filter((project) => project.id !== projectId);
    setProjects(nextProjects);
    if (selectedProjectId === projectId) {
      setSelectedProjectId(nextProjects[0]?.id ?? null);
    }
  }

  async function createTranscription(audio: Blob) {
    if (selectedProjectId === null) return;
    const transcription = await api.createTranscription(selectedProjectId, audio);
    setTranscriptions((current) => [transcription, ...current]);
  }

  async function updateTranscription(
    id: number,
    payload: Pick<Transcription, 'title' | 'text'>,
  ) {
    const updated = await api.updateTranscription(id, payload);
    setTranscriptions((current) =>
      current.map((transcription) => (transcription.id === id ? updated : transcription)),
    );
  }

  async function deleteTranscription(id: number) {
    await api.deleteTranscription(id);
    setTranscriptions((current) => current.filter((transcription) => transcription.id !== id));
  }

  async function summarizeTranscriptions() {
    if (selectedProjectId === null) return;
    setSummarizing(true);
    setError(null);
    try {
      const summary = await api.summarizeTranscriptions(selectedProjectId);
      setTranscriptions((current) => [summary, ...current]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'まとめの生成に失敗しました。');
    } finally {
      setSummarizing(false);
    }
  }

  return (
    <div className="appShell">
      <ProjectDrawer
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelect={setSelectedProjectId}
        onCreate={createProject}
        onDelete={deleteProject}
        loading={loadingProjects}
      />

      <main className="mainPanel">
        <header className="mainHeader">
          <div>
            <p className="eyebrow">Project</p>
            <h2>{selectedProject ? selectedProject.name : 'プロジェクト未選択'}</h2>
          </div>
          <div className="mainHeaderActions">
            <button type="button" onClick={() => void summarizeTranscriptions()} disabled={!selectedProjectId || summarizing}>
              {summarizing ? '生成中...' : 'まとめを生成'}
            </button>
            <button type="button" onClick={() => selectedProjectId && void loadTranscriptions(selectedProjectId)}>
              再読み込み
            </button>
          </div>
        </header>

        {error ? <div className="errorBox">{error}</div> : null}

        {selectedProjectId === null ? (
          <div className="emptyState">左のドロワーからプロジェクトを作成してください。</div>
        ) : (
          <>
            <Recorder disabled={selectedProjectId === null} onRecordComplete={createTranscription} />
            <TranscriptionList
              transcriptions={transcriptions}
              loading={loadingTranscriptions}
              onUpdate={updateTranscription}
              onDelete={deleteTranscription}
            />
          </>
        )}
      </main>
    </div>
  );
}
