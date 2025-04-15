from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from datetime import datetime, timedelta
import time
from typing import Dict, Optional
import os

# Rate limiting configuration
RATE_LIMIT_CONFIG = {
    "limit": int(os.getenv("RATE_LIMIT", "100")),  # requests per minute
    "window": 60  # seconds
}

# In-memory storage for rate limiting
rate_limit_data = {}

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests: int = 100, time_window: int = 60):
        super().__init__(app)
        RATE_LIMIT_CONFIG["limit"] = max_requests
        RATE_LIMIT_CONFIG["window"] = time_window

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for test environment
        if os.getenv("ENVIRONMENT", "").lower() == "test":
            response = await call_next(request)
            # Add dummy rate limit headers in test environment
            response.headers.update({
                "X-RateLimit-Limit": str(RATE_LIMIT_CONFIG["limit"]),
                "X-RateLimit-Remaining": str(RATE_LIMIT_CONFIG["limit"]),
                "X-RateLimit-Reset": str(RATE_LIMIT_CONFIG["window"])
            })
            return response
        
        # Get client IP, checking X-Forwarded-For header first
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        else:
            client_ip = request.client.host if request.client else "127.0.0.1"
            
        current_time = time.time()
        
        # Get or initialize rate limit data for this IP
        if client_ip not in rate_limit_data:
            rate_limit_data[client_ip] = {
                "count": 0,
                "window_start": current_time
            }
        
        # Reset window if it's expired
        if current_time - rate_limit_data[client_ip]["window_start"] > RATE_LIMIT_CONFIG["window"]:
            rate_limit_data[client_ip]["count"] = 0
            rate_limit_data[client_ip]["window_start"] = current_time
        
        # Check if rate limit exceeded
        if rate_limit_data[client_ip]["count"] >= RATE_LIMIT_CONFIG["limit"]:
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Please try again later."}
            )
        
        # Update request count
        rate_limit_data[client_ip]["count"] += 1
        
        # Add rate limit headers to request state
        request.state.rate_limit_remaining = RATE_LIMIT_CONFIG["limit"] - rate_limit_data[client_ip]["count"]
        request.state.rate_limit_reset = int(rate_limit_data[client_ip]["window_start"] + RATE_LIMIT_CONFIG["window"] - current_time)
        
        # Call next middleware/route handler
        response = await call_next(request)
        
        # Add rate limit headers to response
        headers = get_rate_limit_headers(request)
        for key, value in headers.items():
            response.headers[key] = value
        
        return response

def get_rate_limit_headers(request: Request) -> Dict[str, str]:
    """Get rate limit headers for the response."""
    return {
        "X-RateLimit-Limit": str(RATE_LIMIT_CONFIG["limit"]),
        "X-RateLimit-Remaining": str(getattr(request.state, "rate_limit_remaining", RATE_LIMIT_CONFIG["limit"])),
        "X-RateLimit-Reset": str(getattr(request.state, "rate_limit_reset", RATE_LIMIT_CONFIG["window"]))
    } 