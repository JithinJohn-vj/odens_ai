# Quote AI System

A full-stack application for generating quotes using AI, with both frontend and backend components.

## Project Structure

```
.
├── frontend/          # Next.js frontend application
├── backend/          # FastAPI backend application
└── README.md
```

## Prerequisites

- Node.js (v18 or later)
- Python (v3.9 or later)
- Docker and Docker Compose
- Ollama (for local AI processing)
- OpenAI API key (for cloud AI processing)

## Backend Setup

### 1. Environment Setup

```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
cd backend
pip install -r requirements.txt
```

### 2. Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/quote_ai

# AI Configuration
AI_PROVIDER=ollama  # or "openai"
OPENAI_API_KEY=your_openai_api_key  # Required if using OpenAI
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2  # or any other model you have in Ollama

# Security
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 3. Database Setup with Docker

```bash
# Start PostgreSQL and pgAdmin
docker-compose up -d

# Run database migrations
cd backend
alembic upgrade head
```

### 4. Run Backend

```bash
# Start the backend server
uvicorn quote_ai.main:app --reload --port 8000
```

## Frontend Setup

### 1. Environment Setup

```bash
cd frontend
npm install
```

### 2. Environment Variables

Create a `.env.development` file in the `frontend` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Run Frontend

```bash
npm run dev
```

## AI Service Setup

### Option 1: Using Ollama (Local)

1. Install Ollama:
   - Windows: Download and install from [Ollama website](https://ollama.ai)
   - Linux/Mac: 
     ```bash
     curl -fsSL https://ollama.ai/install.sh | sh
     ```

2. Pull a model:
   ```bash
   ollama pull llama3.2
   ```

3. Start Ollama service:
   ```bash
   ollama serve
   ```

4. Verify Ollama is running:
   ```bash
   # Check available models
   ollama list
   
   # Test the model
   ollama run llama2 "Hello, how are you?"
   ```

5. Using Ollama with Docker:
   ```bash
   # Pull the Ollama Docker image
   docker pull ollama/ollama
   
   # Run Ollama in a container
   docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
   
   # Pull a model in the container
   docker exec -it ollama ollama pull llama2
   ```

### Option 2: Using OpenAI (Cloud)

1. Sign up for an OpenAI account at [OpenAI](https://openai.com)
2. Get your API key from the OpenAI dashboard
3. Set `AI_PROVIDER=openai` in backend `.env` file
4. Add your OpenAI API key to the `.env` file

## Running the Application

1. Start the database:
   ```bash
   docker-compose up -d
   ```

2. Start the backend:
   ```bash
   cd backend
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   uvicorn quote_ai.main:app --reload --port 8000
   ```

3. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

4. Access the application at `http://localhost:3000`

## Development Workflow

1. Backend Development:
   - API endpoints are in `backend/quote_ai/api/routers/`
   - Database models are in `backend/quote_ai/core/models.py`
   - Run tests: `pytest`

2. Frontend Development:
   - Pages are in `frontend/src/app/`
   - Components are in `frontend/src/components/`
   - Run tests: `npm test`

## Troubleshooting

1. Database Issues:
   - Check if PostgreSQL is running: `docker ps`
   - Reset database: `docker-compose down -v && docker-compose up -d`

2. AI Service Issues:
   - For Ollama: Check if service is running: `curl http://localhost:11434/api/tags`
   - For OpenAI: Verify API key and internet connection
   - Common Ollama issues:
     - If Ollama is not responding: `ollama serve` (restart the service)
     - If model is not found: `ollama pull <model_name>`
     - If Docker container is not responding: `docker restart ollama`

3. Frontend Issues:
   - Clear cache: `npm cache clean --force`
   - Reinstall dependencies: `rm -rf node_modules && npm install`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 