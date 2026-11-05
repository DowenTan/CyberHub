from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import price_settings, smart_orders, analytics

app = FastAPI(title="CyberHub Admin API")

# Configure CORS for React.js Dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Your React frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register dashboard modules
app.include_router(price_settings.router)
# app.include_router(smart_orders.router)
# app.include_router(analytics.router)

@app.get("/")
def health_check():
    return {"status": "CyberHub Backend Online"}