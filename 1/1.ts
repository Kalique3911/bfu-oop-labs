const WIDTH: number = 1000
const HEIGHT: number = 800

class Point2d {
    private x: number
    private y: number

    constructor(X: number, Y: number) {
        this.x = X
        this.y = Y
    }

    get X(): number {
        return this.x
    }

    set X(value: number) {
        if (value < 0 || value > WIDTH) {
            throw new Error(`X must be between 0 and ${WIDTH}`)
        }
        this.x = value
    }

    get Y(): number {
        return this.y
    }

    set Y(value: number) {
        if (value < 0 || value > HEIGHT) {
            throw new Error(`Y must be between 0 and ${HEIGHT}`)
        }
        this.y = value
    }

    eq(other: Point2d): boolean {
        return this.X === other.X && this.Y === other.Y
    }

    str(): string {
        return `Point2d(${this.X}, ${this.Y})`
    }
}

type PointConstructor = {
    start: Point2d
    end: Point2d
}

type coordsConstructor = { x: number; y: number }

class Vector2d {
    private x: number
    private y: number

    constructor(args: PointConstructor | coordsConstructor) {
        if ("x" in args) {
            this.x = args.x
            this.y = args.y
        } else {
            this.x = args.start.X - args.start.X
            this.y = args.start.Y - args.start.Y
        }
    }

    get X(): number {
        return this.x
    }

    set X(value: number) {
        this.x = value
    }

    get Y(): number {
        return this.y
    }

    set Y(value: number) {
        this.y = value
    }

    get length(): number {
        return Math.sqrt(this.X * this.X + this.Y * this.Y)
    }

    getItem(index: number): number {
        if (index === 0) return this.X
        if (index === 1) return this.Y
        throw new Error("Index out of range")
    }

    setItem(index: number, value: number): void {
        if (index === 0) this.X = value
        else if (index === 1) this.Y = value
        else throw new Error("Index out of range")
    }

    iter() {
        return Object.values(this)
    }

    eq(other: Vector2d): boolean {
        return this.X === other.X && this.Y === other.Y
    }

    str(): string {
        return `Vector2d(${this.X}, ${this.Y})`
    }

    abs() {
        return Object.values(this).length
    }

    add(other: Vector2d): Vector2d {
        return new Vector2d({ x: this.X + other.X, y: this.Y + other.Y })
    }

    subtract(other: Vector2d): Vector2d {
        return new Vector2d({ x: this.X - other.X, y: this.Y - other.Y })
    }

    multiply(scalar: number): Vector2d {
        return new Vector2d({ x: this.X * scalar, y: this.Y * scalar })
    }

    divide(scalar: number): Vector2d {
        if (scalar === 0) throw new Error("Division by zero")
        return new Vector2d({ x: this.X / scalar, y: this.Y / scalar })
    }

    scalarProduct(other: Vector2d): number {
        return this.X * other.X + this.Y * other.Y
    }

    vectorProduct(other: Vector2d): number {
        return this.X * other.Y - this.Y * other.X
    }

    static scalarProduct(a: Vector2d, b: Vector2d): number {
        return a.scalarProduct(b)
    }

    static vectorProduct(a: Vector2d, b: Vector2d): number {
        return a.vectorProduct(b)
    }

    // static tripleProduct(a: Vector2d, b: Vector2d, c: Vector2d): number {
    //     return Vector2d.scalarProduct(a, Vector2d.vectorProduct(b, c))
    // }
}

const demonstrate = () => {
    try {
        const p1 = new Point2d(10, 20)
        const p2 = new Point2d(30, 40)
        const p3 = new Point2d(10, 20)

        console.log("Points:")
        console.log(p1.toString())
        console.log(p2.toString())
        console.log(`p1 equals p2: ${p1.eq(p2)}`)
        console.log(`p1 equals p3: ${p1.eq(p3)}`)
        console.log(p1.str())

        const v1 = new Vector2d({ x: 1, y: 2 })
        const v2 = new Vector2d({ x: 3, y: 4 })
        const v3 = new Vector2d({ start: p1, end: p2 })

        console.log("\nVectors:")
        console.log(v1.toString())
        console.log(v2.toString())
        console.log(v3.toString())

        console.log("\nVector operations:")
        console.log(`v1 + v2: ${v1.add(v2)}`)
        console.log(`v2 - v1: ${v2.subtract(v1)}`)
        console.log(`v1 * 3: ${v1.multiply(3)}`)
        console.log(`v2 / 2: ${v2.divide(2)}`)

        console.log("\nProducts:")
        console.log(`Dot product: ${v1.scalarProduct(v2)}`)
        console.log(`Cross product: ${v1.vectorProduct(v2)}`)
        console.log(`Static dot product: ${Vector2d.scalarProduct(v1, v2)}`)
        console.log(`Static cross product: ${Vector2d.vectorProduct(v1, v2)}`)

        console.log("\nIteration and indexing:")
        console.log(`v1[0]: ${v1.getItem(0)}`)
        console.log(`v1[1]: ${v1.getItem(1)}`)
        console.log("Iterating v2:")
        console.log(v2.iter())

        console.log(`Length of v1: ${v1.length}`)
        console.log(`Length of v2: ${v2.length}`)
    } catch (error) {
        console.error(error)
    }
}

demonstrate()
