# Fingers Crossed transport for Pino

A [pino](https://getpino.io/) transport hold log until a log level is reach. 

## Installation

```shell
npm install @macfja/pino-fingers-crossed
```

## Why

In most case, you don't need logs to tell you every step and detail about your normally operating application.

But when an error occurs you want the maximum data possible.

Here enter the Fingers Crossed transport, it will hold all messages until a threshold, and there release all messages it has.
So you can add all the log you want in your code, and you will have them only when needed.

## Usage

To add the fingers-crossed feature to pino, you need to wrap your pino transport in the _default_ function of the library.

> [!NOTE]
> If you don't specify a transport, the standard output will be used.

By default, the transport will not hold any log, to activate the feature you need to add a binding,
the name of the binding is the variable `enable` from the library,
and the value is minimum log level to reach to release all the message in the queue.

> [!NOTE]
> This added binding will not appear in your logs 

Each logger (the current one or its child) will have its separated message queue, so logging a message that trigger a messages release will only be for the logger that log it, and not any of its parents.
Every child can have its own message level to trigger the queue. You can even change it on the fly (note that only new log can trigger a queue release), you just have to redeclare the binding. 

> [!TIP]
> It's best suited if you create a new child logger for each business event that you receive (it can be a HTTP request, cron task, MQ message, etc.)

You can deactivate the feature by setting the trigger level to `false`.

If your logger have the feature activated, but you still want to log directly a message, you can pass the trigger level to `false` in the first parameter of the logging function
(see example below)

### Example

```ts
import pino from "pino"
import fingersCrossed, { enable } from "@macfja/pino-fingers-crossed"

const logger = pino(fingersCrossed());

logger.info('Will appear immedialty')
logger.error('Will appear immedialty')

logger.setBindings({ [enable]: 50 })
logger.info('Will NOT appear immedialty')
logger.info('Will NOT appear immedialty')
logger.error('Will appear immedialty as well as the 2 previous messages') // error log are level 50
logger.info('Will NOT appear')
logger.info({ [enable]: false }, 'Will appear immedialty')
logger.info('Will NOT appear')

const child = logger.child({ [enable]: 60 }, { msgPrefix: '(child) ' })
child.info('Will NOT appear immedialty')
child.error('Will NOT appear immedialty')
child.info('Will NOT appear immedialty')
child.fatal('Will appear immedialty as well as the 3 previous messages') // fatal log are level 60
child.warn('Will NOT appear')

const great_child = child.child({ [enable]: 40 }, { msgPrefix: '(great child) ' })
great_child.info('Will NOT appear immedialty')
great_child.error('Will appear immedialty as well as the previous message') // error log are level 50
great_child.warn('Will appear immedialty') // warn log are level 40
great_child.info('Will NOT appear')
```

More examples:
 - [With Fastify](./doc/Fastify.md)
 - [With Express 4.x](./doc/Express4.md)

## Memory

The message of a Logger is keep in memory (if the `[enable]` binding is defined) until the trigger is reach.

But all messages are deleted from memory if the logger is freed with the Garbage Collector.
For example, if you create a new logger (or child logger) inside a function, all messages not send at the end of the function will be removed (without being outputted).

