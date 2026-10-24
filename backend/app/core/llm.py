from functools import lru_cache
from typing import Any, Type, Sequence

from pydantic import BaseModel
from langchain.chat_models import init_chat_model

from app.config import settings


@lru_cache(maxsize=1)
def get_chat_model(temperature: float | None = None, model_name: str | None = None) -> Any:
    """Build the configured LangChain chat model once per process."""
    if not settings.GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY is required for the configured chat model.")

    return init_chat_model(
        model=model_name or settings.MODEL_NAME,
        model_provider=settings.MODEL_PROVIDER,
        api_key=settings.GROQ_API_KEY,
        temperature=settings.MODEL_TEMPERATURE if temperature is None else temperature,
    )


def invoke_json(prompt: str, schema: Type[BaseModel] | None = None, temperature: float = 0.0) -> Any:
    """Invoke the shared model with LangChain's structured-output or JSON parser."""
    model = get_chat_model(temperature)
    if schema is not None:
        return model.with_structured_output(schema).invoke(prompt)

    from langchain_core.output_parsers import JsonOutputParser

    return (model | JsonOutputParser()).invoke(prompt)


def invoke_text(prompt: str, temperature: float = 0.2) -> str:
    """Invoke the shared model and normalize its LangChain message output."""
    from langchain_core.output_parsers import StrOutputParser

    return (get_chat_model(temperature) | StrOutputParser()).invoke(prompt).strip()


def invoke_json_with_images(
    prompt: str,
    image_base64: Sequence[str],
    temperature: float = 0.0,
    model_name: str | None = None,
) -> Any:
    """Invoke the configured vision model with base64-encoded page images."""
    from langchain_core.messages import HumanMessage
    from langchain_core.output_parsers import JsonOutputParser

    content = [{"type": "text", "text": prompt}]
    content.extend(
        {"type": "image", "base64": image, "mime_type": "image/png"}
        for image in image_base64
    )
    response = get_chat_model(temperature, model_name=model_name).invoke([HumanMessage(content=content)])
    return JsonOutputParser().invoke(response)
