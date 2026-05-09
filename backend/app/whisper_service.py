from __future__ import annotations

from dataclasses import dataclass
from threading import Lock
from typing import Any

import whisper

from app.config import get_settings


@dataclass(frozen=True)
class TranscriptionResult:
    text: str
    language: str | None


class WhisperService:
    def __init__(self) -> None:
        self._settings = get_settings()
        self._model: Any | None = None
        self._load_lock = Lock()
        self._transcribe_lock = Lock()

    def load(self) -> None:
        if self._model is not None:
            return
        with self._load_lock:
            if self._model is None:
                self._model = whisper.load_model(
                    self._settings.whisper_model,
                    device=self._settings.whisper_device,
                )

    def transcribe(self, audio_path: str, language: str | None = None) -> TranscriptionResult:
        self.load()
        if self._model is None:
            raise RuntimeError("Whisper model was not loaded")

        effective_language = language or self._settings.whisper_language
        options: dict[str, Any] = {
            "task": "transcribe",
            "fp16": self._settings.whisper_device != "cpu",
        }
        if effective_language:
            options["language"] = effective_language

        # Whisper/PyTorch inference can consume a large amount of memory.
        # For the MVP, serialize transcriptions to avoid parallel model execution.
        with self._transcribe_lock:
            result: dict[str, Any] = self._model.transcribe(audio_path, **options)

        text = str(result.get("text") or "").strip()
        detected_language = result.get("language")
        return TranscriptionResult(
            text=text,
            language=str(detected_language) if detected_language else effective_language,
        )


whisper_service = WhisperService()
