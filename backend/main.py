import os
from dotenv import load_dotenv

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from optimizer import run_optimization

app = FastAPI()

load_dotenv()

# Add both localhost and 127.0.0.1 to be safe
origins = [
    os.getenv("FRONTEND_URL", "http://localhost:5173"),
    "http://127.0.0.1:5173",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 2. MATCH THESE NAMES EXACTLY WITH THE FRONTEND
class MicrogridData(BaseModel):
    load: float
    pv: float
    wind: float
    grid_price: float
    ev_at_home: bool


@app.post("/api/optimize")
def optimize(data: MicrogridData):
    # Helpful print to see if data is actually arriving in your WSL terminal
    print(f"Received Data: {data}")

    res = run_optimization(
        data.load, data.pv, data.wind, data.grid_price, data.ev_at_home
    )

    if res.success:
        return {
            "success": True,
            "dispatch": {
                "grid": round(res.x[0], 2),
                "diesel": round(res.x[1], 2),
                "battery": round(res.x[2], 2),
                "ev": round(res.x[3], 2),
            },
            "total_cost": round(res.fun, 2),
        }
    return {"success": False, "error": "Optimization failed"}


if __name__ == "__main__":
    import uvicorn
    import os
    # Using 0.0.0.0 helps WSL bridge the connection to your Windows browser
    uvicorn.run(app, host="0.0.0.0", port=8000)