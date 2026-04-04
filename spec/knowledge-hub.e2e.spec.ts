import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import request from 'supertest';

import { AppModule } from '../src/app.module';

async function createApplication(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Knowledge Hub API')
    .setDescription('REST API for articles, categories, users, and comments')
    .setVersion('1.0.0')
    .build();
  SwaggerModule.setup('doc', app, SwaggerModule.createDocument(app, config));

  await app.init();
  return app;
}

describe('Knowledge Hub API', () => {
  let app: INestApplication;

  beforeEach(async () => {
    app = await createApplication();
  });

  afterEach(async () => {
    await app.close();
  });

  it('serves Swagger UI at /doc', async () => {
    await request(app.getHttpServer()).get('/doc').expect(200);
  });

  it('creates users without exposing the password', async () => {
    const response = await request(app.getHttpServer())
      .post('/user')
      .send({
        login: 'alice',
        password: 'secret',
      })
      .expect(201);

    expect(response.body.login).toBe('alice');
    expect(response.body.role).toBe('viewer');
    expect(response.body.password).toBeUndefined();
  });

  it('rejects password update when the old password is wrong', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/user')
      .send({
        login: 'bob',
        password: 'secret',
      })
      .expect(201);

    await request(app.getHttpServer())
      .put(`/user/${createResponse.body.id}`)
      .send({
        oldPassword: 'wrong',
        newPassword: 'new-secret',
      })
      .expect(403);
  });

  it('filters articles by status and tag', async () => {
    await request(app.getHttpServer())
      .post('/article')
      .send({
        title: 'Draft article',
        content: 'Draft content',
        status: 'draft',
        tags: ['nestjs'],
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/article')
      .send({
        title: 'Published article',
        content: 'Published content',
        status: 'published',
        tags: ['nestjs', 'nodejs'],
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/article')
      .query({
        status: 'published',
        tag: 'nodejs',
      })
      .expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0].title).toBe('Published article');
  });

  it('requires articleId when listing comments', async () => {
    await request(app.getHttpServer()).get('/comment').expect(400);
  });

  it('returns 422 when creating a comment for a missing article', async () => {
    await request(app.getHttpServer())
      .post('/comment')
      .send({
        content: 'No target article',
        articleId: '78f5c3cf-b753-413d-9cc9-f362ec1fe42b',
      })
      .expect(422);
  });

  it('nullifies authorId and removes comments when deleting a user', async () => {
    const userResponse = await request(app.getHttpServer())
      .post('/user')
      .send({
        login: 'charlie',
        password: 'secret',
        role: 'editor',
      })
      .expect(201);

    const articleResponse = await request(app.getHttpServer())
      .post('/article')
      .send({
        title: 'Authored article',
        content: 'Content',
        authorId: userResponse.body.id,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/comment')
      .send({
        content: 'Comment by author',
        articleId: articleResponse.body.id,
        authorId: userResponse.body.id,
      })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/user/${userResponse.body.id}`)
      .expect(204);

    const articleAfterDelete = await request(app.getHttpServer())
      .get(`/article/${articleResponse.body.id}`)
      .expect(200);
    expect(articleAfterDelete.body.authorId).toBeNull();

    const commentsAfterDelete = await request(app.getHttpServer())
      .get('/comment')
      .query({ articleId: articleResponse.body.id })
      .expect(200);
    expect(commentsAfterDelete.body).toEqual([]);
  });

  it('nullifies categoryId when deleting a category', async () => {
    const categoryResponse = await request(app.getHttpServer())
      .post('/category')
      .send({
        name: 'Backend',
        description: 'Backend category',
      })
      .expect(201);

    const articleResponse = await request(app.getHttpServer())
      .post('/article')
      .send({
        title: 'Categorized article',
        content: 'Content',
        categoryId: categoryResponse.body.id,
      })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/category/${categoryResponse.body.id}`)
      .expect(204);

    const articleAfterDelete = await request(app.getHttpServer())
      .get(`/article/${articleResponse.body.id}`)
      .expect(200);
    expect(articleAfterDelete.body.categoryId).toBeNull();
  });

  it('removes related comments when deleting an article', async () => {
    const articleResponse = await request(app.getHttpServer())
      .post('/article')
      .send({
        title: 'Disposable article',
        content: 'Content',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/comment')
      .send({
        content: 'First comment',
        articleId: articleResponse.body.id,
      })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/article/${articleResponse.body.id}`)
      .expect(204);

    await request(app.getHttpServer())
      .get('/comment')
      .query({ articleId: articleResponse.body.id })
      .expect(200, []);
  });
});
