from fastapi import FastAPI
from mangum import Mangum

app = FastAPI()

@app.get("/py/triage")
def health():
    return {"status": "namespace-isolated-alive"}

@app.post("/py/triage")
def post_triage():
    return {"status": "namespace-isolated-post-alive"}

handler = Mangum(app, lifespan="off")
