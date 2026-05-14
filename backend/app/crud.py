from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models, schemas


def list_projects(db: Session) -> list[models.Project]:
    stmt = select(models.Project).order_by(models.Project.created_at.desc())
    return list(db.scalars(stmt).all())


def get_project(db: Session, project_id: int) -> models.Project | None:
    return db.get(models.Project, project_id)


def create_project(db: Session, payload: schemas.ProjectCreate) -> models.Project:
    project = models.Project(name=payload.name, description=payload.description)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def update_project(
    db: Session, project: models.Project, payload: schemas.ProjectUpdate
) -> models.Project:
    if payload.name is not None:
        project.name = payload.name
    if payload.description is not None:
        project.description = payload.description
    db.commit()
    db.refresh(project)
    return project


def delete_project(db: Session, project: models.Project) -> None:
    db.delete(project)
    db.commit()


def list_transcriptions(db: Session, project_id: int) -> list[models.Transcription]:
    stmt = (
        select(models.Transcription)
        .where(models.Transcription.project_id == project_id)
        .order_by(models.Transcription.created_at.desc())
    )
    return list(db.scalars(stmt).all())


def get_transcription(db: Session, transcription_id: int) -> models.Transcription | None:
    return db.get(models.Transcription, transcription_id)


def create_processing_transcription(
    db: Session, project_id: int, title: str, language: str | None
) -> models.Transcription:
    transcription = models.Transcription(
        project_id=project_id,
        title=title,
        text="",
        language=language,
        status=models.TranscriptionStatus.PROCESSING,
    )
    db.add(transcription)
    db.commit()
    db.refresh(transcription)
    return transcription


def create_completed_transcription(
    db: Session, project_id: int, title: str, text: str, language: str | None
) -> models.Transcription:
    transcription = models.Transcription(
        project_id=project_id,
        title=title,
        text=text,
        language=language,
        status=models.TranscriptionStatus.COMPLETED,
    )
    db.add(transcription)
    db.commit()
    db.refresh(transcription)
    return transcription


def complete_transcription(
    db: Session, transcription: models.Transcription, text: str, language: str | None
) -> models.Transcription:
    transcription.text = text
    transcription.language = language
    transcription.status = models.TranscriptionStatus.COMPLETED
    transcription.error_message = None
    if transcription.title.startswith("音声メモ ") and text.strip():
        transcription.title = text.strip().replace("\n", " ")[:40]
    db.commit()
    db.refresh(transcription)
    return transcription


def fail_transcription(
    db: Session, transcription: models.Transcription, message: str
) -> models.Transcription:
    transcription.status = models.TranscriptionStatus.FAILED
    transcription.error_message = message
    db.commit()
    db.refresh(transcription)
    return transcription


def update_transcription(
    db: Session, transcription: models.Transcription, payload: schemas.TranscriptionUpdate
) -> models.Transcription:
    if payload.title is not None:
        transcription.title = payload.title
    if payload.text is not None:
        transcription.text = payload.text
    db.commit()
    db.refresh(transcription)
    return transcription


def delete_transcription(db: Session, transcription: models.Transcription) -> None:
    db.delete(transcription)
    db.commit()
