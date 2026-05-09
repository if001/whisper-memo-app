export type Project = {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type TranscriptionStatus = 'processing' | 'completed' | 'failed';

export type Transcription = {
  id: number;
  project_id: number;
  title: string;
  text: string;
  language: string | null;
  status: TranscriptionStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};
