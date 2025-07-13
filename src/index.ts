import { logger } from "./logger/index.js"
import { extractError } from "./utils.js"
import { startAPI } from "./api/index.js"

const listenPort = process.env.PORT || "8080"

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // TODO: env vars
      PORT?: string
    }
  }
}

process.on("unhandledRejection", (reason: any, _p: Promise<any>) => {
  logger.error(
    {
      err: reason instanceof Error ? extractError(reason) : reason,
    },
    "unhandled promise rejection"
  )
  // TODO: handle
})

async function main() {
  // blocking
  await startAPI(listenPort)
}

main()
