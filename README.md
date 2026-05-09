# Whisper Memo App

音声メモを録音し、OpenAI Whisper で文字起こししてプロジェクトごとに保存する MVP です。

## 構成

- Frontend: React + TypeScript + Vite
- Backend: FastAPI + openai-whisper + SQLAlchemy
- DB: PostgreSQL
- 起動: Docker Compose

音声ファイルは永続保存しません。バックエンドで一時ファイルとして保存し、Whisper 処理後に削除します。

## 起動

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API Docs: http://localhost:8000/docs
- PostgreSQL: localhost:5432

初回の文字起こし時、Whisper モデルのダウンロードが発生するため時間がかかります。

## モデル変更

`.env` の `WHISPER_MODEL` を変更します。

```env
WHISPER_MODEL=base
WHISPER_DEVICE=cpu
WHISPER_LANGUAGE=ja
```

CPU で動かす場合は `base` か `small` から始めるのが無難です。

## API

- `GET /api/projects`
- `POST /api/projects`
- `PATCH /api/projects/{project_id}`
- `DELETE /api/projects/{project_id}`
- `GET /api/projects/{project_id}/transcriptions`
- `POST /api/projects/{project_id}/transcriptions`
- `PATCH /api/transcriptions/{transcription_id}`
- `DELETE /api/transcriptions/{transcription_id}`
