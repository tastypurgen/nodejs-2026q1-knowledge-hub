# Nest.js Knowledge Hub API

A REST API for a Knowledge Hub platform built with Nest.js and TypeScript. The application manages users, articles, categories, and comments with Prisma/PostgreSQL and exposes AI-powered article tools through Google Gemini.

## Tech stack

- Node.js 24.x
- Nest.js
- TypeScript
- class-validator / class-transformer
- Swagger via `@nestjs/swagger`
- Jest + Supertest

## Features

- Domain-based Nest modules: `user`, `article`, `category`, `comment`
- In-memory repositories with services separated from controllers
- DTO validation through a global `ValidationPipe`
- Swagger UI at [http://localhost:4000/doc](http://localhost:4000/doc)
- Request logging middleware
- Optional write-access guard using the `x-user-role` header
- Cascade delete behavior:
  - deleting a user sets related article `authorId` values to `null` and deletes their comments
  - deleting a category sets related article `categoryId` values to `null`
  - deleting an article deletes related comments
- Optional list pagination and sorting
- Article filtering by `status`, `categoryId`, and `tag`
- AI article summary, translation, analysis, generic generation, usage tracking, rate limiting, and in-memory response caching

## Installation

```bash
npm install
```

## Environment variables

Create `.env` from `.env.example` and fill in the database and Gemini values:

```env
PORT=4000
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=knowledge_hub
POSTGRES_HOST=db
POSTGRES_PORT=5432
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/knowledge_hub?schema=public&connection_limit=10&pool_timeout=5"

GEMINI_API_KEY=your-gemini-api-key
GEMINI_API_BASE_URL=https://generativelanguage.googleapis.com
GEMINI_MODEL=gemini-2.0-flash
AI_RATE_LIMIT_RPM=20
AI_CACHE_TTL_SEC=300
```

`GEMINI_MODEL` defaults to `gemini-2.0-flash`. `AI_RATE_LIMIT_RPM` defaults to `20`, and `AI_CACHE_TTL_SEC` defaults to `300`.

## Gemini API key setup

1. Open [Google AI Studio](https://aistudio.google.com/).
2. Sign in with a Google account.
3. Open **Get API key**.
4. Create a new API key for a Google Cloud project.
5. Copy the key.
6. Paste it into `.env` as `GEMINI_API_KEY=...`.

Do not commit `.env`; only `.env.example` belongs in the repository.

## Setup after cloning

```bash
npm install
copy .env.example .env
```

Edit `.env`, paste the Gemini key into `GEMINI_API_KEY`, and confirm `DATABASE_URL` points to your PostgreSQL instance. With Docker, start PostgreSQL and the API together:

```bash
docker-compose up --build
```

For local development, make sure PostgreSQL is running, apply Prisma migrations if needed, then start the API:

```bash
npx prisma migrate deploy
npm start
```

## Running the app

Start the API:

```bash
npm start
```

The service listens on `http://localhost:4000` by default.

## Quality checks

Lint the project:

```bash
npm run lint
```

Run tests:

```bash
npm test
```

Build the TypeScript output:

```bash
npm run build
```

## API overview

All request and response bodies use `application/json`.

### Users

- `GET /user`
- `GET /user/:id`
- `POST /user`
- `PUT /user/:id`
- `DELETE /user/:id`

Create user body:

```json
{
  "login": "editor-1",
  "password": "strong-password",
  "role": "editor"
}
```

Update password body:

```json
{
  "oldPassword": "strong-password",
  "newPassword": "new-strong-password"
}
```

Note: user passwords are never returned in responses.

### Articles

- `GET /article`
- `GET /article/:id`
- `POST /article`
- `PUT /article/:id`
- `DELETE /article/:id`

Create article body:

```json
{
  "title": "Nest.js validation guide",
  "content": "Detailed article content",
  "status": "published",
  "authorId": null,
  "categoryId": null,
  "tags": ["nestjs", "api"]
}
```

Filtering example:

```text
GET /article?status=published&tag=nestjs
```

### AI

The AI endpoints use existing article content from the database. All AI generation calls use Google Gemini through the REST `generateContent` endpoint.

- `POST /ai/articles/:articleId/summarize`
- `POST /ai/articles/:articleId/translate`
- `POST /ai/articles/:articleId/analyze`
- `POST /ai/generate`
- `GET /ai/usage`

Summarize body:

```json
{
  "maxLength": "medium"
}
```

Translate body:

```json
{
  "targetLanguage": "Polish",
  "sourceLanguage": "English"
}
```

Analyze body:

```json
{
  "task": "review"
}
```

Generic generation body:

```json
{
  "prompt": "Write a short checklist for improving Nest.js API validation.",
  "sessionId": "docs-review-session"
}
```

Example AI test flow:

```bash
curl -X POST http://localhost:4000/article \
  -H "Content-Type: application/json" \
  -H "x-user-role: editor" \
  -d "{\"title\":\"Nest.js validation guide\",\"content\":\"ValidationPipe validates incoming DTOs before controller handlers run.\",\"status\":\"published\",\"tags\":[\"nestjs\",\"validation\"]}"

curl -X POST http://localhost:4000/ai/articles/{articleId}/summarize \
  -H "Content-Type: application/json" \
  -d "{\"maxLength\":\"short\"}"
```

AI route behavior:

- Missing or invalid request bodies return `400`.
- Missing articles return `404`.
- AI rate limit violations return `429` with `Retry-After`.
- Gemini timeout or temporary upstream failures return `503`.
- Gemini authentication/configuration failures return `500` without logging secrets.
- Summary and translation responses are cached in memory by article id, request parameters, and article `updatedAt`.

### Categories

- `GET /category`
- `GET /category/:id`
- `POST /category`
- `PUT /category/:id`
- `DELETE /category/:id`

Create category body:

```json
{
  "name": "Node.js",
  "description": "Articles related to Node.js and backend runtime topics"
}
```

### Comments

- `GET /comment?articleId={articleId}`
- `POST /comment`
- `DELETE /comment/:id`

Create comment body:

```json
{
  "content": "Great explanation of validation pipes.",
  "articleId": "78f5c3cf-b753-413d-9cc9-f362ec1fe42b",
  "authorId": null
}
```

If the referenced article does not exist, comment creation returns `422`.

## Pagination and sorting

List endpoints support optional pagination and sorting query parameters:

- `page`
- `limit`
- `sortBy`
- `order=asc|desc`

If `page` or `limit` is provided, the response shape becomes:

```json
{
  "total": 2,
  "page": 1,
  "limit": 10,
  "data": []
}
```

Without pagination parameters, list endpoints return a plain array.

## Swagger documentation

OpenAPI documentation is available at:

- [http://localhost:4000/doc](http://localhost:4000/doc)

## Notes

- Validation errors return `400`.
- AI usage, generic conversation context, cache entries, and rate-limit counters are stored in memory and reset when the service restarts.
- Gemini free-tier quotas, network latency, regional availability, and model availability can affect AI endpoint latency and reliability.
- The app uses `gemini-2.0-flash` by default, but you can switch models with `GEMINI_MODEL`.

## Docker setup

Start the application and PostgreSQL database with Docker:

```bash
docker-compose up --build
```

**Docker Hub image:** [https://hub.docker.com/r/stilegs/nodejs-2026q1](https://hub.docker.com/r/stilegs/nodejs-2026q1)

### Security Scan Results
A vulnerability scan was performed on the `nodejs-2026q1:latest` application image using `docker scout cves`.
**Summary of vulnerabilities found:**
- **CRITICAL**: 0
- **HIGH**: 15
- **MEDIUM**: 15
- **LOW**: 2
- **UNSPECIFIED**: 2

Since there are **no CRITICAL vulnerabilities** present, the requirements for the hacker scope are satisfied.
