from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models import TranscriptionStatus


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None


class ProjectRead(BaseModel):
    id: int
    name: str
    description: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TranscriptionUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    text: str | None = None


class TranscriptionRead(BaseModel):
    id: int
    project_id: int
    title: str
    text: str
    language: str | None
    status: TranscriptionStatus
    error_message: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
