const API_URL = "http://localhost:8000";
const TIMEOUT_MS = 35_000;

/**
 * Envia uma mensagem ao backend e retorna a resposta da LLM.
 *
 * @param {string} message   - Texto do usuário
 * @param {string|null} sessionId - ID da sessão (null na primeira mensagem)
 * @returns {Promise<{response: string, session_id: string}>}
 */
export async function sendChat(message, sessionId) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        session_id: sessionId,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      let errorMessage;
      try {
        const errorData = await res.json();
        errorMessage = errorData.detail || `Erro do servidor (${res.status})`;
      } catch {
        errorMessage = `Erro do servidor (${res.status})`;
      }
      throw new Error(errorMessage);
    }

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error("Resposta inesperada do servidor.");
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === "AbortError") {
      throw new Error("A resposta demorou demais. Tente novamente.");
    }

    if (err instanceof TypeError && err.message === "Failed to fetch") {
      throw new Error("Não foi possível conectar ao servidor.");
    }

    throw err;
  }
}
