# DocMind — RAG-Powered Document Intelligence Assistant

## 📌 Overview

DocMind is an AI-powered system that enables users to upload documents and query them using natural language. It leverages Retrieval-Augmented Generation (RAG) to provide accurate, context-based answers.

## 🚀 Features

* Upload PDF, TXT, and code files
* Semantic search using FAISS
* Context-aware responses using LLM
* Interactive UI with animated visualization
* Source chunk highlighting

## 🛠 Tech Stack

* FastAPI (Backend)
* Sentence Transformers (Embeddings - all-MiniLM-L6-v2 )
* FAISS (Vector Search)
* Gemini API (LLM)
* HTML/CSS/JS (Frontend)

## ⚙️ Setup Instructions

### 1. Clone repository

```bash
git clone <your-repo-link>
cd DocMind
```

### 2. Create virtual environment

```bash
python -m venv .venv
```

### 3. Activate environment

```bash
.\.venv\Scripts\Activate.ps1
```

### 4. Install dependencies

```bash
pip install -r requirements.txt
```

### 5. Create `.env` file

Create a `.env` file in root directory:

```env
GEMINI_API_KEY=your_api_key_here
```

### 6. Run backend

```bash
uvicorn backend.main:app --reload
```

### 7. Open in browser

```
http://127.0.0.1:8000
```

---

## 📽 Demo

(Add your video link here)

## 📄 Report

(Add PDF link here)

---

## ⚠️ Note

If API key is not provided, the system will still perform document retrieval but AI-generated answers may be limited.

---

## 💡 Future Improvements

* Multi-document support
* Better ranking (reranking models)
* Streaming responses
* Authentication system
