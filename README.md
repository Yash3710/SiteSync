# SiteSync

SiteSync is an offline-first mobile app built for the Oil India SIH 2026 problem statement. It lets site workers log daily progress using just their voice (in Hindi or English). 

Since oil rigs and pipeline sites usually have terrible or zero internet, we built the entire AI pipeline to run completely offline. The backend uses a local Llama 3.1 model to transcribe and extract data from the voice notes, and a local NLP matching engine to map those notes directly to the master Excel schedule. 

### Features
- **Works Offline:** No Gemini, no ChatGPT. Llama 3.1 and SentenceTransformers run entirely on the local backend.
- **Voice to Schedule:** Workers just speak into their phone (e.g. "Completed hydrotesting in Sector 4"). The NLP engine automatically finds the matching task in the uploaded Excel sheet and marks it done.
- **Manager Review:** High-confidence matches are auto-applied. Vague reports get flagged for manual manager review.
- **Delay Tracking:** Automatically calculates planned vs actual dates to figure out where the project is bleeding time.

### Tech Stack
- **Mobile:** React Native (Expo)
- **Backend:** Python, FastAPI, SQLite
- **AI:** Ollama (Llama 3.1), HuggingFace MiniLM

### How to Run Locally

1. **Start the AI**
`ollama run llama3.1`

2. **Start the Backend**
`cd backend`
`source ../venv/bin/activate`
`uvicorn main:app --reload --host 0.0.0.0 --port 8000`

3. **Start the App**
`cd mobile`
`npx expo start -c`
