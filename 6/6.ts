import * as fs from "fs"

interface ICommand {
    execute(): void
    undo(): void
    getDescription(): string
}

class PrintCharCommand implements ICommand {
    constructor(private char: string, private output: OutputManager) {}

    execute(): void {
        this.output.addChar(this.char)
    }

    undo(): void {
        this.output.removeLastChar()
    }

    getDescription(): string {
        return this.char
    }
}

class VolumeManager {
    static currentVolume: number = 50
}

class VolumeUpCommand implements ICommand {
    constructor(private output: OutputManager) {}

    execute(): void {
        VolumeManager.currentVolume = Math.min(100, VolumeManager.currentVolume + 20)
        this.output.addMessage(`volume increased to ${VolumeManager.currentVolume}%`)
    }

    undo(): void {
        VolumeManager.currentVolume = Math.max(0, VolumeManager.currentVolume - 20)
        this.output.addMessage(`volume decreased to ${VolumeManager.currentVolume}%`)
    }

    getDescription(): string {
        return "ctrl++"
    }
}

class VolumeDownCommand implements ICommand {
    constructor(private output: OutputManager) {}

    execute(): void {
        VolumeManager.currentVolume = Math.max(0, VolumeManager.currentVolume - 20)
        this.output.addMessage(`volume decreased to ${VolumeManager.currentVolume}%`)
    }

    undo(): void {
        VolumeManager.currentVolume = Math.min(100, VolumeManager.currentVolume + 20)
        this.output.addMessage(`volume increased to ${VolumeManager.currentVolume}%`)
    }

    getDescription(): string {
        return "ctrl+-"
    }
}

class MediaPlayerCommand implements ICommand {
    private static isPlaying: boolean = false

    constructor(private output: OutputManager) {}

    execute(): void {
        if (!MediaPlayerCommand.isPlaying) {
            MediaPlayerCommand.isPlaying = true
            this.output.addMessage("media player launched")
        } else {
            this.output.addMessage("media player already running")
        }
    }

    undo(): void {
        if (MediaPlayerCommand.isPlaying) {
            MediaPlayerCommand.isPlaying = false
            this.output.addMessage("media player closed")
        }
    }

    getDescription(): string {
        return "ctrl+p"
    }
}

class OutputManager {
    private currentText: string = ""
    private logFile: string = "output.txt"

    constructor() {
        if (!fs.existsSync(this.logFile)) {
            fs.writeFileSync(this.logFile, "", "utf8")
        }
    }

    addChar(char: string): void {
        this.currentText += char
        this.writeOutput(this.currentText)
    }

    removeLastChar(): void {
        if (this.currentText.length > 0) {
            this.currentText = this.currentText.slice(0, -1)
            this.writeOutput(this.currentText)
        }
    }

    addMessage(message: string): void {
        this.writeOutput(message)
    }

    private writeOutput(content: string): void {
        console.log(content)
        fs.appendFileSync(this.logFile, content + "\n", "utf8")
    }
}

class KeyboardStateSaver {
    private stateFile: string = "keyboard_state.json"

    saveState(keyboard: Keyboard): void {
        try {
            const bindings: { [key: string]: string } = {}
            keyboard.getKeyBindings().forEach((commandFactory, key) => {
                bindings[key] = this.getCommandType(commandFactory())
            })
            fs.writeFileSync(this.stateFile, JSON.stringify({ keyBindings: bindings }, null, 2))
            console.log("Keyboard state saved")
        } catch (error) {
            console.error(`Error saving state: ${error}`)
        }
    }

    loadState(keyboard: Keyboard): void {
        try {
            if (fs.existsSync(this.stateFile)) {
                const data = JSON.parse(fs.readFileSync(this.stateFile, "utf8"))
                for (const [key, commandType] of Object.entries(data.keyBindings)) {
                    const factory = this.createCommandFactory(commandType as string, keyboard.getOutputManager())
                    if (factory) keyboard.setKeyBinding(key, factory)
                }
                console.log("Keyboard state loaded")
            }
        } catch (error) {
            console.error(`Error loading state: ${error}`)
        }
    }

    private getCommandType(command: ICommand): string {
        if (command instanceof PrintCharCommand) return `PrintChar:${command.getDescription()}`
        if (command instanceof VolumeUpCommand) return "VolumeUp"
        if (command instanceof VolumeDownCommand) return "VolumeDown"
        if (command instanceof MediaPlayerCommand) return "MediaPlayer"
        return "Unknown"
    }

    private createCommandFactory(commandType: string, output: OutputManager): (() => ICommand) | null {
        if (commandType.startsWith("PrintChar:")) {
            const char = commandType.split(":")[1]
            return () => new PrintCharCommand(char, output)
        }
        if (commandType === "VolumeUp") return () => new VolumeUpCommand(output)
        if (commandType === "VolumeDown") return () => new VolumeDownCommand(output)
        if (commandType === "MediaPlayer") return () => new MediaPlayerCommand(output)
        return null
    }
}

class Keyboard {
    private keyBindings: Map<string, () => ICommand> = new Map()
    private commandHistory: ICommand[] = []
    private currentHistoryIndex: number = -1
    private output: OutputManager
    private stateSaver: KeyboardStateSaver

    constructor() {
        this.output = new OutputManager()
        this.stateSaver = new KeyboardStateSaver()
        this.initializeDefaultBindings()
        this.stateSaver.loadState(this)
    }

    private initializeDefaultBindings(): void {
        const chars = "abcdefghijklmnopqrstuvwxyz0123456789 "
        for (const char of chars) {
            this.keyBindings.set(char, () => new PrintCharCommand(char, this.output))
        }
        this.keyBindings.set("ctrl++", () => new VolumeUpCommand(this.output))
        this.keyBindings.set("ctrl+-", () => new VolumeDownCommand(this.output))
        this.keyBindings.set("ctrl+p", () => new MediaPlayerCommand(this.output))
    }

    setKeyBinding(key: string, commandFactory: () => ICommand): void {
        this.keyBindings.set(key, commandFactory)
    }

    pressKey(key: string): void {
        const commandFactory = this.keyBindings.get(key)
        if (commandFactory) {
            const command = commandFactory()
            this.commandHistory = this.commandHistory.slice(0, this.currentHistoryIndex + 1)
            command.execute()
            this.commandHistory.push(command)
            this.currentHistoryIndex++
        } else {
            console.log(`Unknown key: ${key}`)
        }
    }

    undo(): void {
        if (this.currentHistoryIndex >= 0) {
            const command = this.commandHistory[this.currentHistoryIndex]
            command.undo()
            this.currentHistoryIndex--
            this.output.addMessage("undo")
        } else {
            console.log("Nothing to undo")
        }
    }

    redo(): void {
        if (this.currentHistoryIndex < this.commandHistory.length - 1) {
            this.currentHistoryIndex++
            const command = this.commandHistory[this.currentHistoryIndex]
            command.execute()
            this.output.addMessage("redo")
        } else {
            console.log("Nothing to redo")
        }
    }

    saveState(): void {
        this.stateSaver.saveState(this)
    }

    getKeyBindings(): Map<string, () => ICommand> {
        return this.keyBindings
    }

    getOutputManager(): OutputManager {
        return this.output
    }
}

const demonstrate = (): void => {
    console.log("=== Virtual Keyboard Demo ===\n")
    const keyboard = new Keyboard()
    const keySequence = ["a", "b", "c", "undo", "undo", "redo", "ctrl++", "ctrl+-", "ctrl+p", "d", "undo", "undo"]

    for (const key of keySequence) {
        if (key === "undo") {
            keyboard.undo()
        } else if (key === "redo") {
            keyboard.redo()
        } else {
            keyboard.pressKey(key)
        }
    }

    keyboard.saveState()
    console.log("\n=== Demo Complete ===")
}

demonstrate()
