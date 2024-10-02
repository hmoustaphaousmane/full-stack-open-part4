const _ = require('lodash')

const dummy = (blogs) => 1

const totalLikes = (blogs) => {
  return blogs.length === 0
    ? 0
    : blogs.reduce((sum, blog) => {
      return sum + blog.likes
    }, 0)
}

const favoriteBlog = (blogs) => {
  if (blogs.length === 0)
    return {
      title: undefined,
      author: undefined,
      likes: undefined
    }

  const maxLikes = Math.max(...blogs.map(blog => blog.likes))
  const foundBlog = blogs.find(blog => blog.likes === maxLikes)
  return {
    title: foundBlog.title,
    author: foundBlog.author,
    likes: foundBlog.likes
  }
}

const mostBlogs = (blogs) => {
  // counts of number of blogs each author has
  const authorCounts = _.countBy(blogs, 'author')

  // author with the most blogs
  const topAuthor = _.maxBy(
    _.keys(authorCounts),
    author => authorCounts[author]
  )

  return {
    author: topAuthor,
    blogs: authorCounts[topAuthor]
  }
}

const mostLikes = (blogs) => {
  const likesByAuthor = _(blogs)
    .groupBy('author')
    .map((authorBlogs, author) => ({
      author,
      likes: _.sumBy(authorBlogs, 'likes')
    }))
    .value()

  return _.maxBy(likesByAuthor, 'likes')
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
}
