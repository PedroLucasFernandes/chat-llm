import os
import uuid

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import APIConnectionError, APIError, APITimeoutError, OpenAI
from pydantic import BaseModel, field_validator

load_dotenv()

# ---------------------------------------------------------------------------
# OpenAI-compatible client pointing to Groq
# ---------------------------------------------------------------------------
client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1",
    timeout=30.0,
)

MODEL = "openai/gpt-oss-20b"
SYSTEM_PROMPT = "You are a helpful assistant."

# ---------------------------------------------------------------------------
# In-memory session store  (não persistente — limpa ao reiniciar)
# ---------------------------------------------------------------------------
sessions: dict[str, list[dict]] = {}

# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(title="Chat LLM API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------
class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None

    @field_validator("message")
    @classmethod
    def message_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("A mensagem não pode estar vazia.")
        return v.strip()


class ChatResponse(BaseModel):
    response: str
    session_id: str

# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------
@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    # Recupera ou cria sessão
    sid = req.session_id or str(uuid.uuid4())

    if sid not in sessions:
        sessions[sid] = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Adiciona mensagem do usuário ao histórico
    sessions[sid].append({"role": "user", "content": req.message})

    # Chama a LLM
    try:
        completion = client.chat.completions.create(
            model=MODEL,
            messages=sessions[sid],
        )
    except APITimeoutError:
        # Remove a mensagem do usuário que não obteve resposta
        sessions[sid].pop()
        raise HTTPException(
            status_code=408,
            detail="A requisição para a LLM excedeu o tempo limite. Tente novamente.",
        )
    except APIConnectionError:
        sessions[sid].pop()
        raise HTTPException(
            status_code=502,
            detail="Não foi possível conectar ao serviço da LLM. Tente novamente mais tarde.",
        )
    except APIError as e:
        sessions[sid].pop()
        raise HTTPException(
            status_code=502,
            detail=f"Erro na API da LLM: {e.message}",
        )
    except Exception:
        sessions[sid].pop()
        raise HTTPException(
            status_code=500,
            detail="Erro interno inesperado. Tente novamente.",
        )

    assistant_message = completion.choices[0].message.content
    sessions[sid].append({"role": "assistant", "content": assistant_message})

    return ChatResponse(response=assistant_message, session_id=sid)


# ---------------------------------------------------------------------------
# Entrypoint (python main.py)
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)