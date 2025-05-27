import * as fs from "fs"
import * as path from "path"
import * as net from "net"

interface ILogFilter {
    match(text: string): boolean
}

class SimpleLogFilter implements ILogFilter {
    constructor(private pattern: string) {}

    match(text: string): boolean {
        return text.includes(this.pattern)
    }
}

class ReLogFilter implements ILogFilter {
    constructor(private regex: RegExp) {}

    match(text: string): boolean {
        return this.regex.test(text)
    }
}

interface ILogHandler {
    handle(text: string): void
}

class ConsoleHandler implements ILogHandler {
    handle(text: string): void {
        console.log(`[Console] ${text}`)
    }
}

class FileHandler implements ILogHandler {
    constructor(private filePath: string) {
        const dir = path.dirname(filePath)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
    }

    handle(text: string): void {
        const timestamp = new Date().toISOString()
        fs.appendFileSync(this.filePath, `[${timestamp}] ${text}\n`, { encoding: "utf8" })
    }
}

class SocketHandler implements ILogHandler {
    constructor(private host: string, private port: number) {}

    handle(text: string): void {
        const client = new net.Socket()
        client.connect(this.port, this.host, () => {
            client.write(text + "\n")
            client.end()
        })
        client.on("error", (err) => {
            console.error(`[SocketHandler] Ошибка сокета: ${err.message}`)
        })
    }
}

import { EventLogger } from "node-windows"
class WindowsEventLogHandler implements ILogHandler {
    private logger: EventLogger

    constructor(source: string = "NodeJSApp") {
        this.logger = new EventLogger({
            source: source,
            eventLog: "Application",
        })
    }

    handle(text: string): void {
        try {
            this.logger.info(text)
        } catch (err) {
            console.error(`[EventLog] Ошибка: ${err.message}`)
        }
    }
}

class Logger {
    constructor(private filters: ILogFilter[] = [], private handlers: ILogHandler[] = []) {}

    log(text: string): void {
        const passed = this.filters.length === 0 || this.filters.some((filter) => filter.match(text))

        if (passed) {
            this.handlers.forEach((handler) => {
                try {
                    handler.handle(text)
                } catch (err) {
                    console.error(`[Logger] Ошибка обработчика: ${err.message}`)
                }
            })
        } else {
            console.log(`[Logger] Сообщение отфильтровано: ${text}`)
        }
    }

    addFilter(filter: ILogFilter): void {
        this.filters.push(filter)
    }

    addHandler(handler: ILogHandler): void {
        this.handlers.push(handler)
    }
}

const demonstrate = () => {
    const errorFilter = new SimpleLogFilter("ERROR")
    const criticalFilter = new ReLogFilter(/critical/i)

    const consoleHandler = new ConsoleHandler()
    const fileHandler = new FileHandler("logs/application.log")
    const socketHandler = new SocketHandler("127.0.0.1", 8000)
    const eventLogHandler = new WindowsEventLogHandler("MyNodeApp")

    const logger = new Logger([errorFilter, criticalFilter], [consoleHandler, fileHandler, socketHandler, eventLogHandler])

    logger.log("This is a simple INFO message")
    logger.log("ERROR: This is a critical failure")
    logger.log("ERROR: Minor issue")
    logger.log("CRITICAL: ERROR occurred")

    const messages = ["INFO: Application started", "WARNING: Low memory", "ERROR: Disk full", "CRITICAL: Database connection failed", "DEBUG: Variable x = 42"]

    messages.forEach((msg) => logger.log(msg))
}

demonstrate()
