const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const middleware = require('../utils/middleware')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog
    .find({})
    .populate('user', { username: 1, name: 1 })
  response.json(blogs)
})

blogsRouter.get('/:id', async (request, response, next) => {
  try {
    const blog = await Blog.findById(request.params.id)
    if (blog) {
      response.status(200).json(blog)
    } else {
      response.status(404).end()
    }
  } catch (exception) {
    next(exception)
  }
})

blogsRouter.post('/', middleware.userExtractor, async (request, response, next) => {
  const body = request.body

  if (body.title === undefined || body.url === undefined)
    response.status(400).json({ error: 'title or url is missing' })

  // const decodedToken = jwt.verify(
  //   request.token,
  //   process.env.SECRET
  // )
  // if (!decodedToken.id)
  //   return response.status(401).json({ error: 'token invalid' })

  // const user = await User.findById(decodedToken.id)
  const user = request.user

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes === undefined ? 0 : body.likes,
    user: user.id
  })

  try {
    const savedBlog = await blog.save()
    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()

    response.status(201).json(savedBlog)
  } catch (exception) {
    next(exception)
  }
})

// const removeBlog = async (user, blogId) => {
//   const blogs = user.blogs
//   // console.log('Blogs before deletion:', blogs)
//   const index = blogs.findIndex(blog => {
//     blog._id.toString() === blogId
//   })
//   if (index !== -1) {
//     user.blogs = blogs.filter((_, i) => i !== index)
//     await Blog.findByIdAndDelete(blogId)
//   }
//   // console.log('Blogs after deletion:', user.blogs)
//   return user
// }

blogsRouter.delete('/:id', middleware.userExtractor, async (request, response, next) => {
  // const decodedToken = jwt.verify(request.token, process.env.SECRET)

  // if (!decodedToken)
  //   return response.status(401).json({ error: 'invalid token' })

  // const user = await User.findById(decodedToken.id)
  const user = request.user

  const blogs = user.blogs
  console.log('User blogs before deletion:', blogs)

  const index = blogs.findIndex(blog =>
    blog._id.toString() === request.params.id.toString())

  if (index !== -1) {
    user.blogs = blogs.filter((_, i) => i !== index)
    console.log('User blogs after deletion:', user.blogs)
  }

  try {
    await Blog.findByIdAndDelete(request.params.id)
    await user.save()
    response.status(204).end()
  } catch (exception) {
    next(exception)
  }
})

blogsRouter.put('/:id', async (request, response, next) => {
  const body = request.body

  const blog = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes
  }
  try {
    const updatedBlog = await Blog.findByIdAndUpdate(
      request.params.id,
      blog,
      { new: true, runValidators: true, context: 'query' }
    )
    // console.log(updatedBlog)
    response.status(201).json(updatedBlog)
  } catch (exception) {
    next(exception)
  }
})

module.exports = blogsRouter
