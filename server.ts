import fastify from 'fastify'
const server = fastify()

import fastifyBcrypt from 'fastify-bcrypt'
server.register(fastifyBcrypt)

//
import { PrismaClient } from '@prisma/client'
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
  const passwd = await server.bcrypt.hash('pa55w0rd')
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

server.listen(8080, async (err, address) => {
  if (err) {
    console.error(err)
    await prisma.$disconnect()
    process.exit(1)
  }
  console.log(`Server listening at ${address}`)
})
