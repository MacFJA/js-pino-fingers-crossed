# Usage with Fastify

Here a very quick starting configuration for Fastify

```ts
const { default: fingersCrossed, enable } = require('@macfja/pino-fingers-crossed')
const fastify = require('fastify')({
  logger: {
    stream: fingersCrossed()
  }
})

if ('setBindings' in fastify.log && typeof fastify.log.setBindings === 'function') {
    // Set the trigger level to error
    fastify.log.setBindings({ [enable]: 50 })
}

fastify.get('/', (request, reply) => {
  // No logs will appear
  request.log.info('hello')
  request.log.warn('world')
  reply.send({ hello: 'world' })
})

fastify.get('/with-error', (request, reply) => {
  // Logs will be visible!
  request.log.info('hello')
  request.log.warn('world')
  request.log.error('oh no!')
  reply.send({ hello: 'world', error: true })
})

fastify.listen({ port: 3000 }, (err, address) => {
  if (err) {
    // Log this message no matter what
    fastify.log.error({ [enable]: false }, err)
    process.exit(1)
  }
})
```

---

## Registering the Fingers Crossed stream

```ts
const fastify = require('fastify')({
  logger: {
    stream: fingersCrossed()
  }
})
```

In the configuration for the Fastify we can specify lots of configuration inherited from pino LoggerOptions, and a additional `stream` option to set the pino stream to use.

## Defining the level trigger

```ts
if ('setBindings' in fastify.log && typeof fastify.log.setBindings === 'function') {
    // Set the trigger level to error
    fastify.log.setBindings({ [enable]: 50 })
}
```

Fastify logger is only type as a `FastifyBaseLogger`, which is a very simplified interface.
But in reality we have a full `pino.Logger` object, to use the needed `setBindings` function we check if the function exists (and also help Typescript compiler to understand that the function exist).
