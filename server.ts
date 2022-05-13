import fastify from 'fastify'
import { hash, compare } from 'bcrypt';
import { PrismaClient } from '@prisma/client'

//
const server = fastify()
const prisma = new PrismaClient()

//
server.get('/ping', async (request, reply) => {
  return 'pong\n'
})

server.get('/allUsers', async (request, reply) => {
  return await prisma.user.findMany({
    include: {
      posts: true,
      profile: true,
    },
  })
})

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

server.get('/updateUser', async (request, reply) => {
  const passwd = await hash('pa55w0rd', 10)
  return await prisma.user.update({
    where: { id: 1 },
    data: {
      passwd: passwd,
      posts: {
        update: {
          where: { id: 1 },
          data: { published: false }
        }
      }
    }
  })
})

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
