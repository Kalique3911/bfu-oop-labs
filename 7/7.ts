enum LifeStyle {
    PerRequest,
    Scoped,
    Singleton,
}

type InjectionToken<T> = symbol
type ClassType<T> = new (...args: any[]) => T
type Factory<T> = () => T

interface Registration {
    implementation: ClassType<any> | null
    lifestyle: LifeStyle
    dependencies: InjectionToken<any>[]
    constructorParams: any[]
    factory?: Factory<any>
}

class Injector {
    private container = new Map<InjectionToken<any>, Registration>()
    private singletons = new Map<InjectionToken<any>, any>()

    register<T>(token: InjectionToken<T>, classType: ClassType<T>, lifestyle: LifeStyle = LifeStyle.PerRequest, dependencies: InjectionToken<any>[] = [], constructorParams: any[] = []): void {
        this.container.set(token, { implementation: classType, lifestyle, dependencies, constructorParams })
    }

    registerFactory<T>(token: InjectionToken<T>, factory: Factory<T>, lifestyle: LifeStyle = LifeStyle.PerRequest): void {
        this.container.set(token, { implementation: null, lifestyle, factory, dependencies: [], constructorParams: [] })
    }

    getInstance<T>(token: InjectionToken<T>, scopeCache?: Map<InjectionToken<any>, any>): T {
        const registration = this.container.get(token)
        if (!registration) throw new Error(`Dependency not registered: ${token.toString()}`)

        switch (registration.lifestyle) {
            case LifeStyle.Singleton:
                return this.resolveSingleton(token, registration, scopeCache)
            case LifeStyle.Scoped:
                if (!scopeCache) throw new Error(`Cannot resolve Scoped dependency outside scope`)
                return this.resolveScoped(token, registration, scopeCache)
            default:
                return this.createInstance(registration, scopeCache)
        }
    }

    createScope(): { resolve: <T>(token: InjectionToken<T>) => T } {
        const scopeCache = new Map<InjectionToken<any>, any>()
        return { resolve: <T>(token: InjectionToken<T>): T => this.getInstance(token, scopeCache) }
    }

    private resolveSingleton<T>(token: InjectionToken<T>, registration: Registration, scopeCache?: Map<InjectionToken<any>, any>): T {
        if (!this.singletons.has(token)) {
            this.singletons.set(token, this.createInstance(registration, scopeCache))
        }
        return this.singletons.get(token)
    }

    private resolveScoped<T>(token: InjectionToken<T>, registration: Registration, scopeCache: Map<InjectionToken<any>, any>): T {
        if (!scopeCache.has(token)) {
            scopeCache.set(token, this.createInstance(registration, scopeCache))
        }
        return scopeCache.get(token)
    }

    private createInstance<T>(registration: Registration, scopeCache?: Map<InjectionToken<any>, any>): T {
        if (registration.factory) return registration.factory()

        const resolvedDependencies = registration.dependencies.map((depToken) => this.getInstance(depToken, scopeCache))
        return new registration.implementation!(...resolvedDependencies, ...registration.constructorParams)
    }
}

const IStorageToken = Symbol.for("IStorage")
interface IStorage {
    save(data: string): void
}

class FileStorage implements IStorage {
    constructor(private path: string) {}
    save(data: string) {
        console.log(`Saving to file ${this.path}: ${data}`)
    }
}

class DatabaseStorage implements IStorage {
    save(data: string) {
        console.log(`Saving to database: ${data}`)
    }
}

const ILoggerToken = Symbol.for("ILogger")
interface ILogger {
    log(message: string): void
}

class ConsoleLogger implements ILogger {
    log(message: string) {
        console.log(`[Console]: ${message}`)
    }
}

class FileLogger implements ILogger {
    constructor(private fileName: string) {}
    log(message: string) {
        console.log(`[File ${this.fileName}]: ${message}`)
    }
}

const IProcessorToken = Symbol.for("IProcessor")
interface IProcessor {
    process(data: string): void
}

class SimpleProcessor implements IProcessor {
    constructor(private logger: ILogger, private storage: IStorage) {}

    process(data: string) {
        this.logger.log(`Processing: ${data}`)
        this.storage.save(data.toUpperCase())
    }
}

class AdvancedProcessor implements IProcessor {
    constructor(private logger: ILogger, private storage: IStorage) {}

    process(data: string) {
        this.logger.log(`Advanced processing: ${data}`)
        this.storage.save(`[PROCESSED] ${data}`)
    }
}

const configureProduction = (injector: Injector): void => {
    injector.register(IStorageToken, FileStorage, LifeStyle.Singleton, [], ["prod.db"])
    injector.register(ILoggerToken, FileLogger, LifeStyle.Singleton, [], ["prod.log"])
    injector.register(IProcessorToken, AdvancedProcessor, LifeStyle.Scoped, [ILoggerToken, IStorageToken])
}

const configureDebug = (injector: Injector): void => {
    injector.registerFactory(IStorageToken, () => new DatabaseStorage(), LifeStyle.Singleton)
    injector.register(ILoggerToken, ConsoleLogger, LifeStyle.PerRequest)
    injector.register(IProcessorToken, SimpleProcessor, LifeStyle.PerRequest, [ILoggerToken, IStorageToken])
}

const demonstrate = () => {
    console.log("Production Configuration")
    const prodInjector = new Injector()
    configureProduction(prodInjector)

    const scope1 = prodInjector.createScope()
    const processor1 = scope1.resolve<IProcessor>(IProcessorToken)
    const processor2 = scope1.resolve<IProcessor>(IProcessorToken)

    processor1.process("test data")
    console.log("Same instance in scope:", processor1 === processor2)

    console.log("\nDebug Configuration")
    const debugInjector = new Injector()
    configureDebug(debugInjector)

    const proc1 = debugInjector.getInstance<IProcessor>(IProcessorToken)
    const proc2 = debugInjector.getInstance<IProcessor>(IProcessorToken)

    proc1.process("debug data")
    console.log("Different instances (PerRequest):", proc1 !== proc2)

    const storage1 = debugInjector.getInstance<IStorage>(IStorageToken)
    const storage2 = debugInjector.getInstance<IStorage>(IStorageToken)
    console.log("Same storage instance (Singleton):", storage1 === storage2)
}

demonstrate()
