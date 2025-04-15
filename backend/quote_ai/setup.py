
from setuptools import setup, find_packages

setup(
    name="quote_ai",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "fastapi",
        "uvicorn",
        "sqlalchemy",
        "pydantic",
        "python-jose[cryptography]",
        "passlib[bcrypt]",
        "python-multipart",
        "alembic",
        "openai",
        "reportlab",
        "python-dotenv"
    ],
    extras_require={
        "dev": [
            "pytest",
            "pytest-asyncio",
            "httpx",
            "black",
            "isort",
            "flake8"
        ]
    }
)
