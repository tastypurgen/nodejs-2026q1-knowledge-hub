# Nest.js Knowledge Hub API

A REST API for a Knowledge Hub platform built with Nest.js and TypeScript. The application manages users, articles, categories, and comments using in-memory repositories organized by domain modules so the data source can be replaced later.

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

## Installation

```bash
npm install
```

## Environment variables

The app reads the port from `.env`.

```env
PORT=4000
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

- Data is stored in memory only, so restarting the service resets all records.
- UUIDs are generated with Node.js `randomUUID()`.
- Validation errors return `400`.
