never to pip install use the predefined libraries 

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TruChat is a chat application with a serverless Python backend and React/TypeScript frontend. The architecture separates backend serverless functions (deployed as OpenWhisk actions) from a Vite-powered React frontend.

## Architecture

### Frontend (React + Vite)

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with SWC
- **UI**: Radix UI components with Tailwind CSS
- **Routing**: React Router with HashRouter
- **State**: React Query for server state
- **Key Pages**:
  - `/` - Chat interface ([src/pages/Index.tsx](src/pages/Index.tsx))
  - `/ingest` - Document ingestion UI ([src/pages/Ingest.tsx](src/pages/Ingest.tsx))

### Backend (Serverless Python)

Backend is organized as serverless **actions** deployed to OpenWhisk. Each action is a REST endpoint.

**Critical Pattern**:
- Actions live in `packages/<package>/<action>/`
- Each action has two files:
  - `__main__.py` - Entry point with annotations, returns `{"body": <action>.<action>(args)}`
  - `<action>.py` - Contains the actual logic in a function named same as action
- **NEVER write logic in `__main__.py`** - only annotations and the return statement

**Action Structure Example**:
```
packages/
  hello/
    chat/
      __main__.py    # Just annotations and return statement
      chat.py        # Contains def chat(args): ...
  rag/
    clean/
      __main__.py
      clean.py       # Contains def clean(args): ...
```

**Required Annotations in `__main__.py`**:
```python
#--kind python:default
#--web true
```

**URL Pattern**: Actions become REST endpoints at `/api/my/<package>/<action>`

### Testing Strategy

Two types of tests for each action:

1. **Unit Tests** (`tests/<package>/test_<action>.py`):
   - Import and call action function directly
   - Mock services
   - Can run in isolation

2. **Integration Tests** (`tests/<package>/test_<action>_int.py`):
   - **Must redeploy action before running**: `ops ide deploy <package>/<action>`
   - Make HTTP requests to deployed endpoints
   - Use `OPSDEV_HOST` environment variable + "/api/my/" + package+ "/"  +action for invoking actions
   - Use  
   ```
   username = os.getenv("OPSDEV_USERNAME")
   os.getenv("OPSDEV_HOST").replace(f"/{username}.", "/stream.")+f"/web/{username}" + package + "/" + action  
   ```
   for invoking streaming and use requests with POSTS and stream=True 

## Development Commands

### Frontend

```bash
npm run dev          # Start dev server (localhost:5173)
npm run build        # Production build to web/
npm run build:dev    # Development build
npm run lint         # ESLint
```

### Backend Actions

```bash
ops ide login                      # Login and create ~/.wskprops (required first)
ops lv new <action> <package>      # Create new action
ops ide deploy <package>/<action>  # Deploy single action
ops ide deploy                     # Deploy all actions
```

### Testing

```bash
# Unit test (uses testcontainers, can run anytime)
pytest tests/<package>/test_<action>.py

# Integration test (requires deployed action)
ops ide deploy <package>/<action>
pytest tests/<package>/test_<action>_int.py
```

## Service Integration Patterns

When actions need external services, follow these patterns:

### Redis
1. Add to `__main__.py`:
```python
#--param REDIS_URL $REDIS_URL
#--param REDIS_PREFIX $REDIS_PREFIX
```

2. In action function:
```python
rd = redis.from_url(args.get("REDIS_URL", os.getenv("REDIS_URL")))
prefix = args.get("REDIS_PREFIX", os.getenv("REDIS_PREFIX"))
```

3. Add `ENABLE_REDIS=1` to `tests/.env`

### PostgreSQL
1. Add to `__main__.py`: `#--param POSTGRES_URL "$POSTGRES_URL"`
2. In action: `dburl = args.get("POSTGRES_URL", os.getenv("POSTGRES_URL"))`
3. Add `ENABLE_POSTGRES=1` to `tests/.env`

### Milvus (Vector DB)
1. Add to `__main__.py`:
```python
#--param MILVUS_HOST $MILVUS_HOST
#--param MILVUS_PORT $MILVUS_PORT
#--param MILVUS_DB_NAME $MILVUS_DB_NAME
#--param MILVUS_TOKEN $MILVUS_TOKEN
```

2. In action:
```python
uri = f"http://{args.get('MILVUS_HOST', os.getenv('MILVUS_HOST'))}"
token = args.get("MILVUS_TOKEN", os.getenv("MILVUS_TOKEN"))
db_name = args.get("MILVUS_DB_NAME", os.getenv("MILVUS_DB_NAME"))
client = MilvusClient(uri=uri, token=token, db_name=db_name)
```

3. Add `ENABLE_MILVUS=1` to `tests/.env`

### S3 (MinIO)
1. Add to `__main__.py`:
```python
#--param S3_HOST $S3_HOST
#--param S3_PORT $S3_PORT
#--param S3_ACCESS_KEY $S3_ACCESS_KEY
#--param S3_SECRET_KEY $S3_SECRET_KEY
#--param S3_BUCKET_DATA $S3_BUCKET_DATA
```

2. In action:
```python
host = args.get("S3_HOST", os.getenv("S3_HOST"))
port = args.get("S3_PORT", os.getenv("S3_PORT"))
url = f"http://{host}:{port}"
key = args.get("S3_ACCESS_KEY", os.getenv("S3_ACCESS_KEY"))
sec = args.get("S3_SECRET_KEY", os.getenv("S3_SECRET_KEY"))
store_s3 = boto3.client('s3', region_name='us-east-1', endpoint_url=url,
                        aws_access_key_id=key, aws_secret_access_key=sec)
bucket = args.get("S3_BUCKET_DATA", os.getenv("S3_BUCKET_DATA"))
```

3. Add `ENABLE_MINIO=1` to `tests/.env`

## Important Constraints

### Backend Development
- **Python only** - no JavaScript in backend
- **No pip/requirements.txt** - use only approved libraries: `requests`, `openai`, `psycopg`, `boto3`, `pymilvus`, `redis`
- **JSON objects only** for input/output - never arrays or primitives at top level
- **Stateless functions** - no shared code between actions
- **Never modify frontend** - backend must adapt to existing frontend

### Frontend Development
- Uses path alias `@/*` for `./src/*`
- TypeScript strict checks disabled (noImplicitAny, strictNullChecks false)
- API calls go to `/api/my/<package>/<action>`
- Vite proxy routes `/api/my` to `OPS_HOST` or `OPSDEV_HOST` env var

## Current Packages

- **hello**: Core chat functionality (chat, llm, cache, store, vdb, stream, sql)
- **rag**: Document ingestion pipeline (clean, chunk, process, store)

## RAG Ingestion Pipeline

The `/ingest` page implements a document processing pipeline with these steps:
1. **Upload** - Upload PDF document
2. **Extract** - Convert to text via Tika server (tika.minipos.me)
3. **Cleaning** - Clean extracted text (`/api/my/rag/clean`)
4. **Chunking** - Split into chunks (`/api/my/rag/chunk`)
5. **Processing** - Process chunks (`/api/my/rag/process`)
6. **Storing** - Store in vector DB (`/api/my/rag/store`)

Pipeline allows re-running earlier steps, which clears all subsequent steps.
