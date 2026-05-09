from pathlib import Path
import tempfile

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.db import get_db
from app.whisper_service import whisper_service

router = APIRouter(tags=["transcriptions"])


@router.get(
    "/projects/{project_id}/transcriptions", response_model=list[schemas.TranscriptionRead]
)
def list_transcriptions(
    project_id: int, db: Session = Depends(get_db)
) -> list[schemas.TranscriptionRead]:
    project = crud.get_project(db, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return crud.list_transcriptions(db, project_id)


@router.post(
    "/projects/{project_id}/transcriptions",
    response_model=schemas.TranscriptionRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_transcription(
    project_id: int,
    file: UploadFile = File(...),
    title: str | None = Form(default=None),
    language: str | None = Form(default=None),
    db: Session = Depends(get_db),
) -> schemas.TranscriptionRead:
    project = crud.get_project(db, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    filename = file.filename or "audio.webm"
    suffix = Path(filename).suffix or ".webm"
    initial_title = title.strip() if title and title.strip() else "音声メモ 処理中"
    transcription = crud.create_processing_transcription(db, project_id, initial_title, language)

    temp_path: str | None = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            temp_path = tmp.name
            while chunk := await file.read(1024 * 1024):
                tmp.write(chunk)

        result = whisper_service.transcribe(temp_path, language=language)
        return crud.complete_transcription(db, transcription, result.text, result.language)
    except Exception as exc:  # noqa: BLE001 - MVP records error in DB and returns it to UI.
        return crud.fail_transcription(db, transcription, str(exc))
    finally:
        await file.close()
        if temp_path is not None:
            Path(temp_path).unlink(missing_ok=True)


@router.patch("/transcriptions/{transcription_id}", response_model=schemas.TranscriptionRead)
def update_transcription(
    transcription_id: int,
    payload: schemas.TranscriptionUpdate,
    db: Session = Depends(get_db),
) -> schemas.TranscriptionRead:
    transcription = crud.get_transcription(db, transcription_id)
    if transcription is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transcription not found")
    return crud.update_transcription(db, transcription, payload)


@router.delete("/transcriptions/{transcription_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transcription(transcription_id: int, db: Session = Depends(get_db)) -> None:
    transcription = crud.get_transcription(db, transcription_id)
    if transcription is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transcription not found")
    crud.delete_transcription(db, transcription)
