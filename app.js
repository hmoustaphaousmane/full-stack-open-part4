const config = require('./utils/config')
const blogRouter = require('./controllers/blog')
const express = require('express')
const app = express()
const cors = require('cors')
const logger = require('./utils/logger')
const mongoose = require('mongoose')

const mongoUrl = config.MONGODB_URI
mongoose.connect(mongoUrl)
  .then(() => logger.info('connected to MongoDB'))
  .catch(error => logger.error('error connecting to MongoDB', error.message))

app.use(cors())
app.use(express.json())

app.use('/api/blogs', blogRouter)

module.exports = app

