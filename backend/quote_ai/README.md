
# Quote AI System

An AI-Assisted Quote Automation System.

## Installation

```bash
pip install -e .
```

## Development

```bash
# Install development dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Run the application
uvicorn quote_ai.api.main:app --reload
```
