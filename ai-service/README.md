# AI service (optional)

```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Set `AI_SERVICE_URL=http://localhost:8000` in the Nest backend `.env`.
