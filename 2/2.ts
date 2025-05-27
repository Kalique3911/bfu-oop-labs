import * as fs from "fs"
import * as path from "path"

enum Color {
    Black = "\x1b[30m",
    Red = "\x1b[31m",
    Green = "\x1b[32m",
    Yellow = "\x1b[33m",
    Blue = "\x1b[34m",
    Magenta = "\x1b[35m",
    Cyan = "\x1b[36m",
    White = "\x1b[37m",
}

type Position = { x: number; y: number }
type FontData = { [key: string]: string[] }

class Printer {
    private static fontData: FontData | null = null
    private static readonly RESET_COLOR = "\x1b[0m"
    private static readonly HIDE_CURSOR = "\x1b[?25l"
    private static readonly SHOW_CURSOR = "\x1b[?25h"
    private static readonly CLEAR_LINE = "\x1b[2K"
    private static readonly SAVE_CURSOR = "\x1b[s"
    private static readonly RESTORE_CURSOR = "\x1b[u"

    private readonly color: Color
    private readonly position: Position
    private readonly symbol: string
    private lastHeight: number = 0

    constructor(color: Color, position: Position, symbol: string = "*") {
        this.color = color
        this.position = position
        this.symbol = symbol.charAt(0) || "*"
    }

    private static loadFont(fontPath: string): void {
        try {
            const rawData = fs.readFileSync(path.resolve(fontPath), "utf-8")
            this.fontData = JSON.parse(rawData)
        } catch (error) {
            console.error(`Ошибка загрузки файла шрифта: ${error}`)
            this.fontData = {}
        }
    }

    private static internalPrint(text: string, color: Color, position: Position, symbol: string): number {
        if (!this.fontData) {
            this.loadFont("font.json")
        }

        const charHeight = this.fontData ? Object.values(this.fontData)[0]?.length || 0 : 0
        if (charHeight === 0) return 0

        const upperText = text.toUpperCase()

        process.stdout.write(this.SAVE_CURSOR + this.HIDE_CURSOR)

        for (let i = 0; i < charHeight; i++) {
            process.stdout.write(`\x1b[${position.y + i};${position.x}H${this.CLEAR_LINE}`)
        }

        for (let i = 0; i < charHeight; i++) {
            process.stdout.write(`\x1b[${position.y + i};${position.x}H`)
            let lineOutput = ""
            for (const char of upperText) {
                const template = this.fontData?.[char]
                if (template) {
                    lineOutput += template[i].replace(/\*/g, symbol) + " "
                }
            }
            process.stdout.write(color + lineOutput)
        }

        process.stdout.write(this.RESTORE_CURSOR + this.RESET_COLOR + this.SHOW_CURSOR)
        return position.y + 6
    }

    public static print(text: string, color: Color, position: Position, symbol: string = "*"): void {
        this.internalPrint(text, color, position, symbol.charAt(0) || "*")
    }

    public print(text: string): void {
        this.lastHeight = Printer.internalPrint(text, this.color, { x: this.position.x, y: this.lastHeight ? this.lastHeight : this.position.y }, this.symbol)
    }

    public static using(options: { color: Color; position: Position; symbol?: string }, callback: (printer: Printer) => void): void {
        process.stdout.write(this.SAVE_CURSOR + this.HIDE_CURSOR)

        const printer = new Printer(options.color, options.position, options.symbol)

        try {
            callback(printer)
        } finally {
            process.stdout.write(this.RESTORE_CURSOR + this.RESET_COLOR + this.SHOW_CURSOR)
        }
    }

    public static clearConsole(): void {
        process.stdout.write("\x1B[2J\x1B[0;0H")
    }
}

const demonstrate = () => {
    Printer.clearConsole()

    Printer.print("Abc", Color.Yellow, { x: 15, y: 2 }, "@")
    Printer.print("Hi", Color.Cyan, { x: 15, y: 8 }, "#")

    Printer.using({ color: Color.Green, position: { x: 1, y: 15 }, symbol: "+" }, (printer) => {
        printer.print("What are you doing?")
        printer.print("Huh")
        printer.print("What are you doing?")
        printer.print("Me? Just hanging around")
    })
}

demonstrate()
