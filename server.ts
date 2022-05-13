import fastify from 'fastify'
const server = fastify()

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

server.get('/ping', async (request, reply) => {
  return 'pong\n'
})

server.get('/allUsers', async (request, reply) => {
  const allUsers = await prisma.user.findMany({
    include: {
      posts: true,
      profile: true,
    },
  })
  return allUsers
})

server.get('/createUser', async (request, reply) => {
  const data = {
    data: {
      name: 'Alice',
      email: 'alice@prisma.io',
      posts: {
        create: { title: 'Hello World' },
      },
      profile: {
        create: { bio: 'I like turtles' },
      },
    },
  }
  return await prisma.user.create(data)
})

server.listen(8080, async (err, address) => {
  if (err) {
    console.error(err)
    await prisma.$disconnect()
    process.exit(1)
  }
  console.log(`Server listening at ${address}`)
})
