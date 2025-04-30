# Usage with Express 4.x

Here a very quick starting configuration for Express 4.x

```ts
const express = require('express')
const pino = require('pino')
const httpLogger = require('pino-http')
const { default: fingersCrossed, enable } = require('@macfja/pino-fingers-crossed')

// Create an express application
const app = express()

// Create the root logger
const logger = pino()

// Register the pino middleware
app.use(httpLogger({ logger }, fingersCrossed()))

// Set the trigger level to error
logger.setBindings({ [enable]: 50 })

app.get('/', (req, res) => {
  // No logs will appear
  req.log.info('hello')
  req.log.warn('world')
  res.send('hello world')
})

app.get('/with-error', (req, res) => {
  // Logs will be visible!
  req.log.info('hello')
  req.log.warn('world')
  req.log.error('oh no!')
  res.send('hello world')
})

app.listen(3000)
```
