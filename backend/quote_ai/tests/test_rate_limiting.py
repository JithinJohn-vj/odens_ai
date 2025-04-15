import pytest
from quote_ai.api.main import app
from fastapi.testclient import TestClient
import time
from fastapi import HTTPException, Request
from quote_ai.api.middleware.rate_limiting import RateLimitMiddleware, get_rate_limit_headers
from quote_ai.api.middleware.rate_limiting import rate_limit_data, RATE_LIMIT_CONFIG
from starlette.testclient import TestClient
from starlette.applications import Starlette
from starlette.responses import Response
from unittest.mock import patch

client = TestClient(app)

# Create rate limit middleware instance
rate_limit_middleware = RateLimitMiddleware(app=app)

async def mock_call_next(request: Request):
    return Response("OK")

def test_rate_limiting(client):
    """Test that rate limiting works in production environment"""
    # Set production environment
    import os
    os.environ["ENVIRONMENT"] = "production"
    
    # Clear rate limit data
    rate_limit_data.clear()
    
    # Make requests up to the limit
    for _ in range(RATE_LIMIT_CONFIG["limit"]):
        response = client.get("/")
        assert response.status_code == 200
        
        # Verify rate limit headers
        assert "X-RateLimit-Limit" in response.headers
        assert "X-RateLimit-Remaining" in response.headers
        assert "X-RateLimit-Reset" in response.headers
    
    # Next request should be rate limited
    response = client.get("/")
    assert response.status_code == 429
    assert "Rate limit exceeded" in response.json()["detail"]

@pytest.mark.asyncio
async def test_rate_limit_reset():
    """Test that rate limit resets after window expires"""
    # Set production environment
    import os
    os.environ["ENVIRONMENT"] = "production"
    
    # Clear rate limit data
    rate_limit_data.clear()
    
    # Mock time to simulate window expiration
    with patch('time.time') as mock_time:
        # Set initial time
        mock_time.return_value = 0
        
        # Make requests up to the limit
        for _ in range(RATE_LIMIT_CONFIG["limit"]):
            response = client.get("/")
            assert response.status_code == 200
        
        # Next request should be rate limited
        response = client.get("/")
        assert response.status_code == 429
        
        # Simulate time passing beyond the window
        mock_time.return_value = RATE_LIMIT_CONFIG["window"] + 1
        
        # Should be able to make requests again
        response = client.get("/")
        assert response.status_code == 200

def test_rate_limiting_with_different_ips(client):
    """Test that rate limiting works independently for different IPs"""
    # Set production environment
    import os
    os.environ["ENVIRONMENT"] = "production"
    
    # Clear rate limit data
    rate_limit_data.clear()
    
    # Make requests from different IPs
    for ip in ["127.0.0.1", "192.168.1.1", "10.0.0.1"]:
        for _ in range(RATE_LIMIT_CONFIG["limit"]):
            response = client.get("/", headers={"X-Forwarded-For": ip})
            assert response.status_code == 200
        
        # Next request should be rate limited
        response = client.get("/", headers={"X-Forwarded-For": ip})
        assert response.status_code == 429

def test_rate_limiting_in_test_environment(client):
    """Test that rate limiting is disabled in test environment"""
    # Set test environment
    import os
    os.environ["ENVIRONMENT"] = "test"
    
    # Clear rate limit data
    rate_limit_data.clear()
    
    # Make requests beyond the limit
    for _ in range(RATE_LIMIT_CONFIG["limit"] + 5):
        response = client.get("/")
        assert response.status_code == 200

@pytest.mark.asyncio
async def test_rate_limiting_in_production_environment():
    """Test rate limiting in production environment"""
    # Set production environment
    import os
    os.environ["ENVIRONMENT"] = "production"
    
    # Create test app with rate limiting middleware
    app = Starlette()
    
    # Add a test route
    @app.route("/")
    async def test_route(request):
        return Response("OK")
    
    app.add_middleware(RateLimitMiddleware)
    
    # Create test client
    client = TestClient(app)
    
    # Clear rate limit data
    rate_limit_data.clear()
    
    # Make requests up to the limit
    for _ in range(RATE_LIMIT_CONFIG["limit"]):
        response = client.get("/")
        assert response.status_code == 200
    
    # Next request should be rate limited
    response = client.get("/")
    assert response.status_code == 429

@pytest.mark.asyncio
async def test_rate_limit_headers():
    """Test that rate limit headers are correctly set"""
    # Set production environment
    import os
    os.environ["ENVIRONMENT"] = "production"
    
    # Create test app with rate limiting middleware
    app = Starlette()
    app.add_middleware(RateLimitMiddleware)
    
    # Create test client
    client = TestClient(app)
    
    # Clear rate limit data
    rate_limit_data.clear()
    
    # Make a request
    response = client.get("/")
    
    # Verify headers
    assert "X-RateLimit-Limit" in response.headers
    assert "X-RateLimit-Remaining" in response.headers
    assert "X-RateLimit-Reset" in response.headers
    
    # Verify header values
    assert int(response.headers["X-RateLimit-Limit"]) == RATE_LIMIT_CONFIG["limit"]
    assert int(response.headers["X-RateLimit-Remaining"]) == RATE_LIMIT_CONFIG["limit"] - 1
    assert int(response.headers["X-RateLimit-Reset"]) > 0 