import * as fs from "fs"
import * as path from "path"

class User {
    constructor(public id: number, public name: string, public login: string, private password: string, public email?: string, public address?: string) {}

    getPassword(): string {
        return this.password
    }

    setPassword(password: string): void {
        this.password = password
    }

    toString(): string {
        return `User(id: ${this.id}, name: ${this.name}, login: ${this.login}, email: ${this.email || "N/A"}, address: ${this.address || "N/A"})`
    }

    toJSON(): any {
        return {
            id: this.id,
            name: this.name,
            login: this.login,
            password: this.password,
            email: this.email,
            address: this.address,
        }
    }

    static fromJSON(data: any): User {
        return new User(data.id, data.name, data.login, data.password, data.email, data.address)
    }

    static compareByName(a: User, b: User): number {
        return a.name.localeCompare(b.name)
    }
}

interface IDataRepository<T> {
    getAll(): T[]
    getById(id: number): T | null
    add(item: T): void
    update(item: T): void
    delete(item: T): void
}

interface IUserRepository extends IDataRepository<User> {
    getByLogin(login: string): User | null
}

class DataRepository<T extends { id: number }> implements IDataRepository<T> {
    private items: T[] = []

    constructor(
        private filePath: string,
        private serializer: {
            serialize: (items: T[]) => string
            deserialize: (data: string) => T[]
        }
    ) {
        this.ensureDirectory()
        this.loadFromFile()
    }

    private ensureDirectory(): void {
        const dir = path.dirname(this.filePath)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
    }

    private loadFromFile(): void {
        try {
            if (fs.existsSync(this.filePath)) {
                const data = fs.readFileSync(this.filePath, "utf8")
                if (data.trim()) {
                    this.items = this.serializer.deserialize(data)
                }
            }
        } catch (error) {
            console.error(`Error loading from file: ${error}`)
            this.items = []
        }
    }

    private saveToFile(): void {
        try {
            const data = this.serializer.serialize(this.items)
            fs.writeFileSync(this.filePath, data, "utf8")
        } catch (error) {
            console.error(`Error saving to file: ${error}`)
        }
    }

    getAll(): T[] {
        return [...this.items]
    }

    getById(id: number): T | null {
        return this.items.find((item) => item.id === id) || null
    }

    add(item: T): void {
        if (!this.items.some((existing) => existing.id === item.id)) {
            this.items.push(item)
            this.saveToFile()
        }
    }

    update(item: T): void {
        const index = this.items.findIndex((i) => i.id === item.id)
        if (index !== -1) {
            this.items[index] = item
            this.saveToFile()
        }
    }

    delete(item: T): void {
        const index = this.items.findIndex((i) => i.id === item.id)
        if (index !== -1) {
            this.items.splice(index, 1)
            this.saveToFile()
        }
    }
}

class UserRepository extends DataRepository<User> implements IUserRepository {
    constructor(filePath: string = "data/users.json") {
        super(filePath, {
            serialize: (users: User[]) =>
                JSON.stringify(
                    users.map((u) => u.toJSON()),
                    null,
                    2
                ),
            deserialize: (data: string) => JSON.parse(data).map((u: any) => User.fromJSON(u)),
        })
    }

    getByLogin(login: string): User | null {
        return this.getAll().find((user) => user.login === login) || null
    }

    getAllSortedByName(): User[] {
        return this.getAll().sort(User.compareByName)
    }
}

interface IAuthService {
    signIn(user: User): void
    signOut(): void
    getCurrentUser(): User | null
}

class AuthService implements IAuthService {
    private currentUser: User | null = null
    private sessionFilePath: string

    constructor(private userRepository: IUserRepository, sessionFilePath: string = "data/session.json") {
        this.sessionFilePath = sessionFilePath
        this.ensureDirectory()
        this.loadSession()
    }

    private ensureDirectory(): void {
        const dir = path.dirname(this.sessionFilePath)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
    }

    private loadSession(): void {
        try {
            if (fs.existsSync(this.sessionFilePath)) {
                const data = fs.readFileSync(this.sessionFilePath, "utf8")
                if (data.trim()) {
                    const sessionData = JSON.parse(data)
                    const user = this.userRepository.getById(sessionData.userId)
                    if (user) {
                        this.currentUser = user
                        console.log(`Auto-signed in as: ${user.name}`)
                    }
                }
            }
        } catch (error) {
            console.error(`Error loading session: ${error}`)
        }
    }

    private saveSession(): void {
        try {
            if (this.currentUser) {
                const sessionData = { userId: this.currentUser.id }
                fs.writeFileSync(this.sessionFilePath, JSON.stringify(sessionData), "utf8")
            } else {
                if (fs.existsSync(this.sessionFilePath)) {
                    fs.unlinkSync(this.sessionFilePath)
                }
            }
        } catch (error) {
            console.error(`Error saving session: ${error}`)
        }
    }

    signIn(user: User): void {
        this.currentUser = user
        this.saveSession()
        console.log(`Signed in as: ${user.name}`)
    }

    signOut(): void {
        if (this.currentUser) {
            console.log(`Signed out: ${this.currentUser.name}`)
            this.currentUser = null
            this.saveSession()
        }
    }

    getCurrentUser(): User | null {
        return this.currentUser
    }
}

const demonstrate = (): void => {
    const userRepo = new UserRepository()
    const authService = new AuthService(userRepo)

    const user1 = new User(1, "Alaic son of Athanaric", "AAB", "rome410", "alaric@kantiana.com", "No permanent residence")
    const user2 = new User(2, "Flavius Julius Valens", "FJV", "adrianopolis378", "asdsa@sdasd.com", "Constantinople")
    const user3 = new User(3, "Achilleus son of Peleus", "AP", "troyXII")

    userRepo.add(user1)
    userRepo.add(user2)
    userRepo.add(user3)

    userRepo.getAllSortedByName().forEach((user) => console.log(user.toString()))

    const foundUser = userRepo.getByLogin("AP")
    if (foundUser) {
        authService.signIn(foundUser)
        console.log(`\nCurrent user: ${authService.getCurrentUser()?.toString()}`)
    }

    if (foundUser) {
        foundUser.address = "Hellas"
        userRepo.update(foundUser)
        console.log(`\nUpdated user: ${foundUser.toString()}`)
    }

    const anotherUser = userRepo.getByLogin("AAB")
    if (anotherUser) {
        authService.signOut()
        authService.signIn(anotherUser)
        console.log(`\nSwitched to: ${authService.getCurrentUser()?.toString()}`)
    }
}

demonstrate()
