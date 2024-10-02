require('dotenv').config()
const bcrypt = require('bcrypt')
const { test, after, beforeEach, describe } = require('node:test')
const assert = require('node:assert')
const supertest = require('supertest')
const mongoose = require('mongoose')

const helper = require('./test_helper')
const app = require('../app')

const api = supertest(app)

const User = require('../models/user')
const Blog = require('../models/blog')

describe('when there is initially some notes saved', () => {
  beforeEach(async () => {
    // clear the database
    await User.deleteMany()
    await Blog.deleteMany({})

    // create a new user for tests
    const passwordHash = await bcrypt.hash('testuser', 10)
    const user = new User({
      username: 'testuser',
      name: 'Test User',
      passwordHash
    })
    await user.save()
    // console.log(user)

    for (const blog of helper.initialBlogs) {
      const blogObject = new Blog(blog)
      blogObject.user = user.id
      await blogObject.save()
      // console.log(blogObject)
    }
  })

  test('the correct amount of blogs is returned', async () => {
    const response = await api
      .get('/api/blogs')

    assert.strictEqual(response.body.length, helper.initialBlogs.length)
  })

  test('unique identifier property of a blog is named id', async () => {
    const blogs = (await api.get('/api/blogs')).body

    const blog = blogs[0]
    assert(blog.id)
    assert(!blog._id)
  })

  describe('viewing a specific blog', () => {
    test('a specific blog can be viewed', async () => {
      const blogsAtStart = await helper.blogsInDb()
      const blogToView = blogsAtStart[0]
      // console.log('blog to view', blogToView)

      const response = await api
        .get(`/api/blogs/${blogToView.id}`)
        .expect(200)
        .expect('Content-Type', /application\/json/)
      // console.log('get blog response', response.body)

      assert.deepStrictEqual(response.body, blogToView) // !resultBolg.body?
    })
  })

  describe('addition of a blog', () => {
    test('a valid blog can be added', async () => {
      const user = await User.findOne({ username: 'testuser' })
      const token = helper.setToken(user)

      const newBlog = {
        title: 'hello world',
        author: 'beginner',
        url: 'http://www.helloworld.org',
        likes: 4
      }

      await api
        .post('/api/blogs')
        .set({ Authorization: `Bearer ${token}` })
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const blogsAtEnd = await helper.blogsInDb()
      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length + 1)

      const titles = blogsAtEnd.map(b => b.title)
      assert(titles.includes('hello world'))

      const authors = blogsAtEnd.map(b => b.author)
      assert(authors.includes('beginner'))

      const urls = blogsAtEnd.map(b => b.url)
      assert(urls.includes('http://www.helloworld.org'))

      const likesList = blogsAtEnd.map(b => b.likes)
      assert(likesList.includes(4))
    })

    test('if likes value is missing, it defaults to 0', async () => {
      const user = await User.findOne({ username: 'testuser' })
      const token = helper.setToken(user)

      const response = await api
        .post('/api/blogs')
        .set({ Authorization: `Bearer ${token}` })
        .send({
          title: 'Go To Statement Considered Harmful',
          author: 'Edsger W. Dijkstra',
          url: 'https://homepages.cwi.nl/~storm/teaching/reader/Dijkstra68.pdf',
        })
        .expect(201)
        .expect('Content-Type', /application\/json/)

      assert.strictEqual(response.body.likes, 0)
    })

    test('blog with missing title or url is not added', async () => {
      const user = await User.findOne({ username: 'testuser' })
      const token = helper.setToken(user)

      const blogWithoutUrl = {
        title: 'Go To Statement Considered Harmful',
        author: 'Edsger W. Dijkstra',
      }
      await api
        .post('/api/blogs')
        .set({ Authorization: `Bearer ${token}` })
        .send(blogWithoutUrl)
        .expect(400)


      const blogWithoutTitle = {
        author: 'Edsger W. Dijkstra',
        url: 'https://homepages.cwi.nl/~storm/teaching/reader/Dijkstra68.pdf',
      }

      await api
        .post('/api/blogs')
        .set({ Authorization: `Bearer ${token}` })
        .send(blogWithoutTitle)
        .expect(400)

      const blogWithAuthorOnly = {
        author: 'Edsger W. Dijkstra',
      }
      await api
        .post('/api/blogs')
        .set({ Authorization: `Bearer ${token}` })
        .send(blogWithAuthorOnly)
        .expect(400)
    })
  })

  describe('deletion of a blog', () => {
    test('a blog can be deleted', async () => {
      const user = await User.findOne({ username: 'testuser' })
      const token = helper.setToken(user)

      const blogsAtStart = await helper.blogsInDb()

      const blogToDelete = blogsAtStart[0]

      await api
        .delete(`/api/blogs/${blogToDelete.id}`)
        .set({ Authorization: `Bearer ${token}` })
        .expect(204)

      const blogsAtEnd = await helper.blogsInDb()
      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length - 1)

      const titles = blogsAtEnd.map(blog => blog.title)
      assert(!titles.includes(blogToDelete.title))
    })
  })

  describe('updating a blog', () => {
    test('a blog can be update', async () => {
      const user = await User.findOne({ username: 'testuser' })
      const token = helper.setToken(user)

      const blogsAtStart = await helper.blogsInDb()

      const blogToUpdate = blogsAtStart[0]

      const updates = {
        title: blogToUpdate.title,
        author: blogToUpdate.author,
        url: blogToUpdate.url,
        likes: blogToUpdate.likes + 1
      }

      const response = await api
        .put(`/api/blogs/${blogToUpdate.id}`)
        .set({ Authorization: `Bearer ${token}` })
        .send(updates)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      assert.strictEqual(response.body.likes, blogToUpdate.likes + 1)
    })
  })
})

after(async () => await mongoose.connection.close())
