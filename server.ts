import fastify from 'fastify'
import { hash, compare } from 'bcrypt';
import { PrismaClient } from '@prisma/client'

//
const server = fastify()
const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] })

//
server.get('/ping', async (request, reply) => {
  return 'pong\n'
})

/*
  SELECT `main`.`User`.`id`, `main`.`User`.`email`, `main`.`User`.`passwd` FROM `main`.`User` WHERE 1=1 LIMIT ? OFFSET ?
  SELECT `main`.`Post`.`id`, `main`.`Post`.`createdAt`, `main`.`Post`.`updatedAt`, `main`.`Post`.`title`, `main`.`Post`.`content`, `main`.`Post`.`published`, `main`.`Post`.`authorId` FROM `main`.`Post` WHERE `main`.`Post`.`authorId` IN (?) LIMIT ? OFFSET ?
  SELECT `main`.`Profile`.`id`, `main`.`Profile`.`name`, `main`.`Profile`.`bio`, `main`.`Profile`.`userId` FROM `main`.`Profile` WHERE `main`.`Profile`.`userId` IN (?) LIMIT ? OFFSET ?
*/
server.get('/allUsers', async (request, reply) => {
  return await prisma.user.findMany({
    include: {
      posts: true,
      profile: true,
    },
  })
})

/*
  BEGIN
  INSERT INTO `main`.`User` (`email`) VALUES (?) RETURNING id
  INSERT INTO `main`.`Post` (`createdAt`, `updatedAt`, `title`, `published`, `authorId`) VALUES (?,?,?,?,?) RETURNING id
  INSERT INTO `main`.`Profile` (`name`, `bio`, `userId`) VALUES (?,?,?) RETURNING id
  SELECT `main`.`User`.`id`, `main`.`User`.`email`, `main`.`User`.`passwd` FROM `main`.`User` WHERE `main`.`User`.`id` = ? LIMIT ? OFFSET ?
  COMMIT
*/
server.get('/createUser', async (request, reply) => {
  const user = {
    data: {
      email: 'alice@prisma.io',
      posts: {
        create: { title: 'Hello World' },
      },
      profile: {
        create: { name: 'Alice', bio: 'I like turtles' },
      },
    },
  }
  return await prisma.user.create(user)
})

/*
  BEGIN
  SELECT `main`.`User`.`id` FROM `main`.`User` WHERE `main`.`User`.`id` = ?
  UPDATE `main`.`User` SET `passwd` = ? WHERE `main`.`User`.`id` IN (?)
  SELECT `main`.`Post`.`id`, `main`.`Post`.`authorId` FROM `main`.`Post` WHERE (`main`.`Post`.`id` = ? AND `main`.`Post`.`authorId` IN (?)) LIMIT ? OFFSET ?
  UPDATE `main`.`Post` SET `published` = ?, `updatedAt` = ? WHERE `main`.`Post`.`id` IN (?)
  SELECT `main`.`User`.`id`, `main`.`User`.`email`, `main`.`User`.`passwd` FROM `main`.`User` WHERE `main`.`User`.`id` = ? LIMIT ? OFFSET ?
  COMMIT
*/
server.get('/updateUser', async (request, reply) => {
  const passwd = await hash('pa55w0rd', 10)
  return await prisma.user.update({
    where: { id: 1 },
    data: {
      passwd: passwd,
      posts: {
        update: {
          where: { id: 1 },
          data: { published: true }
        }
      }
    }
  })
})

/*
  SELECT `main`.`User`.`id`, `main`.`User`.`email`, `main`.`User`.`passwd` FROM `main`.`User` WHERE `main`.`User`.`id` = ? LIMIT ? OFFSET ?
*/
server.get('/comparePasswd', async (request, reply) => {
  const user = await prisma.user.findUnique({
    where: { id: 1 },
  })
  if (user?.passwd)
    return await compare('pa55w0rd', user.passwd)
  return 'not found'
})

//
server.listen(8080, async (err, address) => {
  if (err) {
    console.error(err)
    await prisma.$disconnect()
    process.exit(1)
  }
  console.log(`Server listening at ${address}`)
})
