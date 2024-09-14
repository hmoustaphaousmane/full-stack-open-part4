require('dotenv').config()
const { test, after, beforeEach, describe } = require('node:test')
const assert = require('node:assert')
const supertest = require('supertest')
const mongoose = require('mongoose')

const helper = require('./test_helper')
const app = require('../app')

const api = supertest(app)

const Blog = require('../models/blog')

beforeEach(async () => {
  await Blog.deleteMany({}) // clear the database

  for (const blog of helper.initialBlogs) {
    const blogObject = new Blog(blog)
    await blogObject.save()
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

test('a valid blog can be added', async () => {
  const newBlog = {
    title: 'hello world',
    author: 'beginner',
    url: 'http://www.helloworld.org',
    likes: 4
  }

  await api
    .post('/api/blogs')
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
  const response = await api
    .post('/api/blogs')
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
  const blogWithoutUrl = {
    title: 'Go To Statement Considered Harmful',
    author: 'Edsger W. Dijkstra',
  }
  await api
    .post('/api/blogs')
    .send(blogWithoutUrl)
    .expect(400)


  const blogWithoutTitle = {
    author: 'Edsger W. Dijkstra',
    url: 'https://homepages.cwi.nl/~storm/teaching/reader/Dijkstra68.pdf',
  }
  await api
    .post('/api/blogs')
    .send(blogWithoutTitle)
    .expect(400)


  const blogWithAuthorOnly = {
    author: 'Edsger W. Dijkstra',
  }
  await api
    .post('/api/blogs')
    .send(blogWithAuthorOnly)
    .expect(400)
})

after(async () => await mongoose.connection.close())
