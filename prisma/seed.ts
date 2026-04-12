import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Users
  const admin = await prisma.user.create({
    data: {
      login: 'admin',
      password: 'StrongAdminPassword123!',
      role: 'ADMIN',
    },
  });

  const editor = await prisma.user.create({
    data: {
      login: 'editor',
      password: 'StrongEditorPassword123!',
      role: 'EDITOR',
    },
  });

  // Categories
  const category1 = await prisma.category.create({
    data: { name: 'Technology', description: 'Tech related articles' },
  });
  const category2 = await prisma.category.create({
    data: { name: 'Science', description: 'Science articles' },
  });
  const category3 = await prisma.category.create({
    data: { name: 'Lifestyle', description: 'Lifestyle tips' },
  });

  // Tags
  const t1 = await prisma.tag.create({ data: { name: 'nestjs' } });
  const t2 = await prisma.tag.create({ data: { name: 'prisma' } });
  const t3 = await prisma.tag.create({ data: { name: 'typescript' } });
  const t4 = await prisma.tag.create({ data: { name: 'space' } });
  const t5 = await prisma.tag.create({ data: { name: 'health' } });

  // Articles
  const a1 = await prisma.article.create({
    data: {
      title: 'Intro to NestJS',
      content: 'NestJS is a progressive Node.js framework.',
      status: 'PUBLISHED',
      authorId: editor.id,
      categoryId: category1.id,
      tags: { connect: [{ id: t1.id }, { id: t3.id }] },
    },
  });

  const a2 = await prisma.article.create({
    data: {
      title: 'Prisma ORM Deep Dive',
      content: 'Prisma makes database access easy with an auto-generated query builder.',
      status: 'PUBLISHED',
      authorId: admin.id,
      categoryId: category1.id,
      tags: { connect: [{ id: t2.id }, { id: t3.id }] },
    },
  });

  const a3 = await prisma.article.create({
    data: {
      title: 'James Webb Telescope Discoveries',
      content: 'The JWST is changing our view of the universe.',
      status: 'DRAFT',
      authorId: editor.id,
      categoryId: category2.id,
      tags: { connect: [{ id: t4.id }] },
    },
  });

  const a4 = await prisma.article.create({
    data: {
      title: 'Top 10 Healthy Habits',
      content: 'Eat your vegetables and get enough sleep.',
      status: 'ARCHIVED',
      authorId: admin.id,
      categoryId: category3.id,
      tags: { connect: [{ id: t5.id }] },
    },
  });

  const a5 = await prisma.article.create({
    data: {
      title: 'Why TypeScript is awesome',
      content: 'Static typing saves you from runtime errors.',
      status: 'PUBLISHED',
      authorId: editor.id,
      categoryId: category1.id,
      tags: { connect: [{ id: t3.id }] },
    },
  });

  // Comments
  await prisma.comment.create({
    data: {
      content: 'Great article!',
      articleId: a1.id,
      authorId: admin.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: 'Thanks for the deep dive on Prisma.',
      articleId: a2.id,
      authorId: editor.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: 'I disagree with your point about static typing.',
      articleId: a5.id,
      authorId: admin.id, // could be generic null user, but admin is fine
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
