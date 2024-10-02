const bcrypt = require('bcrypt')
const { test, after, beforeEach, describe } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')

const app = require('../app')
const api = supertest(app)

const User = require('../models/user')
const helper = require('./test_helper')

describe('when there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany()

    const passwordHash = await bcrypt.hash('foo', 10)
    const user = new User({ username: 'foo', passwordHash })

    await user.save()
  })

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'bar',
      name: 'bar',
      password: 'bar'
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1)

    const usernames = usersAtEnd.map(user => user.username)
    assert(usernames.includes(newUser.username))
  })

  test('creation fails with proper statuscode and message if username already taken', async () => {
    const usersAtStart = await helper.usersInDb()

    const user = { username: 'foo', name: 'foo', password: 'foo' }

    await api.post('/api/users')
      .send(user)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert.strictEqual(usersAtEnd.length, usersAtStart.length)
  })

  describe('creation fails with statuscode 400 and proper message', () => {
    test('if username or password is less than 3 characters long', async () => {
      const usersAtStart = await helper.usersInDb()

      const user1 = { username: 'hi', name: 'hi', password: 'hi' }

      await api.post('/api/users')
        .send(user1)
        .expect(400)
        .expect('Content-Type', /application\/json/)

      const user2 = { username: 'hello', name: 'hi', password: 'hi' }

      const result = await api.post('/api/users')
        .send(user2)
        .expect(400)
        .expect('Content-Type', /application\/json/)

      assert(result.body.error.includes('`password` must be at lest 3 characters long'))

      await api.post('/api/users')
        .send(user2)
        .expect(400)
        .expect('Content-Type', /application\/json/)

      const usersAtEnd = await helper.usersInDb()
      assert.strictEqual(usersAtEnd.length, usersAtStart.length)
    })
  })
})

after(async () => mongoose.connection.close())
