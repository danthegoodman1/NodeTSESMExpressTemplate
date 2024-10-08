import express from "express"
import { v4 as uuidv4 } from "uuid"
import cors from "cors"
import { ZodError } from "zod"
import { logger } from "./logger/index.js"

import { extractError } from "./utils.js"

const listenPort = process.env.PORT || "8080"

declare global {
  namespace Express {
    interface Request {
      id: string
    }
  }

  namespace NodeJS {
    interface ProcessEnv {
      DB_FILENAME?: string
      ADMIN_EMAILS?: string
      AWS_DEFAULT_REGION?: string
      AWS_ACCESS_KEY_ID?: string
      AWS_SECRET_ACCESS_KEY?: string
      S3_BUCKET: string
      S3_ENDPOINT: string
      POSTMARK_TOKEN: string
      MY_URL: string

      AXIOM_ORG_ID: string
      AXIOM_TOKEN: string
      AXIOM_DATASET: string
    }
  }
}

process.on("unhandledRejection", (reason: any, p: Promise<any>) => {
  logger.error(
    {
      err: reason instanceof Error ? extractError(reason) : reason,
    },
    "unhandled promise rejection"
  )
})

async function main() {
  const app = express()
  app.use(express.json()) // MIGHT NEED TO MOVE THIS FOR STRIPE
  app.disable("x-powered-by")
  app.use(cors())

  app.use((req, res, next) => {
    const reqID = uuidv4()
    req.id = reqID
    next()
  })

  if (process.env.HTTP_LOG === "1") {
    logger.debug("using HTTP logger")
    app.use((req: any, res, next) => {
      req.log.info({ req })
      res.on("finish", () => req.log.info({ res }))
      next()
    })
  }

  app.get("/hc", (req, res) => {
    res.sendStatus(200)
  })

  // Error handler
  app.use((err: any, req: any, res: any, next: any) => {
    if (err instanceof ZodError) {
      return res.status(400).send(`Invalid body: ${err.message}`)
    }

    logger.error({ err, id: req.id })
    res.status(500).send("Internal Server Error")
  })

  const server = app.listen(listenPort, () => {
    logger.info(`API listening on port ${listenPort}`)
  })

  const signals = {
    SIGHUP: 1,
    SIGINT: 2,
    SIGTERM: 15,
  }

  let stopping = false
  Object.keys(signals).forEach((signal) => {
    process.on(signal, async () => {
      if (stopping) {
        return
      }
      stopping = true
      logger.info(`Received signal ${signal}, shutting down...`)
      logger.info("exiting...")
      logger.flush() // pino actually fails to flush, even with awaiting on a callback
      server.close()
      process.exit(0)
    })
  })
}

main()
