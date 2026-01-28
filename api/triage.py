from fastapi import FastAPI
from mangum import Mangum

app = FastAPI()

@app.get("/api/triage")
def health():
    return {"status": "zero-dependency-alive"}

handler = Mangum(app, lifespan="off")
# No imports from openai or anything else
