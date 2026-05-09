import type { Project, Transcription } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: init?.body instanceof FormData
      ? init.headers
      : { 'Content-Type': 'application/json', ...init?.headers },
  });

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const data = await response.json();
      if (typeof data.detail === 'string') {
        message = data.detail;
      }
    } catch {
      // Keep default message.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  listProjects: () => request<Project[]>('/projects'),
  createProject: (name: string) =>
    request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  updateProject: (projectId: number, payload: Partial<Pick<Project, 'name' | 'description'>>) =>
    request<Project>(`/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteProject: (projectId: number) =>
    request<void>(`/projects/${projectId}`, { method: 'DELETE' }),

  listTranscriptions: (projectId: number) =>
    request<Transcription[]>(`/projects/${projectId}/transcriptions`),
  createTranscription: (projectId: number, audio: Blob, title?: string) => {
    const form = new FormData();
    form.append('file', audio, `memo-${Date.now()}.webm`);
    form.append('language', 'ja');
    if (title?.trim()) {
      form.append('title', title.trim());
    }
    return request<Transcription>(`/projects/${projectId}/transcriptions`, {
      method: 'POST',
      body: form,
    });
  },
  updateTranscription: (transcriptionId: number, payload: Pick<Transcription, 'title' | 'text'>) =>
    request<Transcription>(`/transcriptions/${transcriptionId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteTranscription: (transcriptionId: number) =>
    request<void>(`/transcriptions/${transcriptionId}`, { method: 'DELETE' }),
};
