import json
from dataclasses import dataclass
from urllib import error, request

from app.config import get_settings

SUMMARY_PROMPT = """ノートの一覧を以下の条件に従って整理しまとめてください。

- ノートは音声の文字起こし文章であることを前提に、口頭の言い回しや文字起こしノイズを整理して読みやすくする
- 重複内容は統合し、必要に応じて順序を整理する
- 元データに存在しない内容は追加しない
- 出力は技術ブログ記事のベースとして利用することを前提に、セクションを作り整理しまとめてください

## ノートの一覧
{notes}
"""


@dataclass
class SummaryResult:
    text: str


class OllamaService:
    def __init__(self) -> None:
        settings = get_settings()
        self.base_url = settings.ollama_base_url.rstrip("/")
        self.model = settings.ollama_model
        self.api_key = settings.ollama_api_key

    def summarize_notes(self, notes: list[str]) -> SummaryResult:
        notes_text = "\n\n---\n\n".join(note.strip() for note in notes if note.strip())
        if not notes_text:
            raise ValueError("要約対象の文字起こしがありません。")

        payload = {
            "model": self.model,
            "prompt": SUMMARY_PROMPT.format(notes=notes_text),
            "stream": False,
        }

        req = request.Request(
            url=f"{self.base_url}/api/generate",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": "Bearer " + self.api_key,
            },
            method="POST",
        )

        try:
            with request.urlopen(req, timeout=120) as response:  # noqa: S310 - configured internal URL.
                body = response.read().decode("utf-8")
        except error.URLError as exc:
            raise RuntimeError(f"Ollama API 呼び出しに失敗しました: {exc}") from exc

        data = json.loads(body)
        result_text = str(data.get("response", "")).strip()
        if not result_text:
            raise RuntimeError("Ollama API から要約結果を取得できませんでした。")
        return SummaryResult(text=result_text)


ollama_service = OllamaService()
