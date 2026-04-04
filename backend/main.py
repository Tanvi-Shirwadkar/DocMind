import os
import re
import numpy as np
import faiss
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import google.generativeai as genai
from dotenv import load_dotenv
import pdfplumber
import io
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

load_dotenv()

app = FastAPI(title="DocMind RAG API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Models & State ────────────────────────────────────────────────
embedder = SentenceTransformer("all-MiniLM-L6-v2")
api_key = os.getenv("GEMINI_API_KEY")

model = None
if api_key:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-2.5-flash")

faiss_index: faiss.Index | None = None
chunks_store: list[str] = []
doc_meta: dict = {}

# ── Helpers ───────────────────────────────────────────────────────
def extract_text(file_bytes: bytes, filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower()
    if ext == "pdf":
        text_parts = []
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    text_parts.append(t)
        return "\n".join(text_parts)
    return file_bytes.decode("utf-8", errors="ignore")


def chunk_text(text: str, size: int = 350, overlap: int = 70) -> list[str]:
    words = text.split()
    chunks, i = [], 0
    while i < len(words):
        chunk = " ".join(words[i : i + size])
        if len(chunk.strip()) > 30:
            chunks.append(chunk.strip())
        i += size - overlap
    return chunks


def build_faiss(vectors: np.ndarray) -> faiss.Index:
    dim = vectors.shape[1]
    # Normalize for cosine similarity via inner product
    faiss.normalize_L2(vectors)
    index = faiss.IndexFlatIP(dim)
    index.add(vectors)
    return index


# ── Routes ────────────────────────────────────────────────────────
@app.post("/api/upload")
async def upload_document(file: UploadFile = File(...)):
    global faiss_index, chunks_store, doc_meta

    raw = await file.read()
    text = extract_text(raw, file.filename)

    if not text.strip():
        raise HTTPException(400, "Could not extract text from file")

    chunks_store = chunk_text(text)
    if not chunks_store:
        raise HTTPException(400, "Document too short to index")

    vectors = embedder.encode(chunks_store, show_progress_bar=False).astype("float32")
    faiss_index = build_faiss(vectors)

    word_count = len(text.split())
    doc_meta = {
        "filename": file.filename,
        "chunks": len(chunks_store),
        "words": word_count,
        "tokens_est": int(word_count * 1.35),
    }
    return {"status": "indexed", **doc_meta}


class QueryRequest(BaseModel):
    query: str
    top_k: int = 5


@app.post("/api/query")
async def query_document(req: QueryRequest):
    if faiss_index is None:
        raise HTTPException(400, "No document indexed yet")

    # Embed + search
    q_vec = embedder.encode([req.query]).astype("float32")
    faiss.normalize_L2(q_vec)
    scores, indices = faiss_index.search(q_vec, req.top_k)

    results = [
        {"chunk_id": int(i), "score": float(s), "text": chunks_store[i]}
        for s, i in zip(scores[0], indices[0])
        if i >= 0 and s > 0.1
    ]

    if not results:
        return {"answer": "No relevant content found in the document for this query.", "sources": []}

    context = "\n\n---\n\n".join(
        f"[Chunk {r['chunk_id']} | relevance {r['score']:.2f}]\n{r['text']}"
        for r in results
    )
    if model is None:
        return {
            "answer": "AI not configured. Showing retrieved context instead:\n\n" + context[:1000],
            "sources": results
        }
    response = model.generate_content(
        #To generate hallucination control and grounded responses
        f"""
        You are an intelligent document assistant.

        STRICT RULES:
        - Answer ONLY using the provided context.
        - Do NOT use outside knowledge.
        - If the answer is not in the context, say: "The document does not contain this information."
        - Be concise, clear, and accurate.
        - If possible, cite chunk numbers.
        

        CONTEXT:
        {context}

        QUESTION:
        {req.query}
        """
    )
    answer = response.text.strip()
    if not answer:
        answer = "No clear answer found in the document for this query."
    return {
        "answer": answer,
        "sources": results
    }
    

@app.get("/api/status")
async def status():
    return {
        "indexed": faiss_index is not None,
        "doc_meta": doc_meta,
        "total_chunks": len(chunks_store),
    }

app.mount(
    "/static",
    StaticFiles(directory=os.path.join(BASE_DIR, "../frontend/static")),
    name="static"
)

@app.get("/")
async def root():
    return FileResponse(os.path.join(BASE_DIR, "../frontend/index.html"))
