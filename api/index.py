from fastapi import FastAPI
from mangum import Mangum

app = FastAPI()

@app.get("/api/health")
def health():
    return {"status": "minimal-alive", "version": "4.0.0"}

@app.get("/api/triage")
def triage_get():
    return {"message": "Triage GET working. Use POST for analysis."}

@app.post("/api/triage")
def triage_post():
    return {"message": "Triage POST reached minimal handler."}

handler = Mangum(app, lifespan="off")
