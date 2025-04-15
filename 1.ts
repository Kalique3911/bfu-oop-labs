const WIDTH = 800
const HEIGHT = 600

class Point2d {
    private _x: number
    private _y: number

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }

    get x(): number {
        return this._x
    }

    set x(value: number) {
        if (value < 0 || value > WIDTH) {
            throw new Error(`x must be between 0 and ${WIDTH}`)
        }
        this._x = value
    }

    get y(): number {
        return this._y
    }

    set y(value: number) {
        if (value < 0 || value > HEIGHT) {
            throw new Error(`y must be between 0 and ${HEIGHT}`)
        }
        this._y = value
    }

    equals(other: Point2d): boolean {
        return this.x === other.x && this.y === other.y
    }

    toString(): string {
        return `Point2d(${this.x}, ${this.y})`
    }
}

class Vector2d {
    constructor(public x: number, public y: number) {}

    static fromPoints(start: Point2d, end: Point2d): Vector2d {
        return new Vector2d(end.x - start.x, end.y - start.y)
    }

    get length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y)
    }

    get(index: number): number {
        if (index === 0) return this.x
        if (index === 1) return this.y
        throw new Error("Index out of range")
    }

    set(index: number, value: number): void {
        if (index === 0) this.x = value
        else if (index === 1) this.y = value
        else throw new Error("Index out of range")
    }

    getValues(): [number, number] {
        return [this.x, this.y]
    }

    equals(other: Vector2d): boolean {
        return this.x === other.x && this.y === other.y
    }

    toString(): string {
        return `Vector2d(${this.x}, ${this.y})`
    }

    add(other: Vector2d): Vector2d {
        return new Vector2d(this.x + other.x, this.y + other.y)
    }

    subtract(other: Vector2d): Vector2d {
        return new Vector2d(this.x - other.x, this.y - other.y)
    }

    multiply(scalar: number): Vector2d {
        return new Vector2d(this.x * scalar, this.y * scalar)
    }

    divide(scalar: number): Vector2d {
        if (scalar === 0) throw new Error("Division by zero")
        return new Vector2d(this.x / scalar, this.y / scalar)
    }

    dot(other: Vector2d): number {
        return this.x * other.x + this.y * other.y
    }

    cross(other: Vector2d): number {
        return this.x * other.y - this.y * other.x
    }

    static dot(a: Vector2d, b: Vector2d): number {
        return a.dot(b)
    }

    static cross(a: Vector2d, b: Vector2d): number {
        return a.cross(b)
    }

    static tripleProduct(a: Vector2d, b: Vector2d, c: Vector2d): number {
        return a.x * (b.y * c.x - b.x * c.y) - a.y * (b.x * c.x - b.x * c.x)
    }
}

const p1 = new Point2d(10, 20)
const p2 = new Point2d(30, 40)
console.log(p1.toString())

const v1 = new Vector2d(1, 2)
const v2 = Vector2d.fromPoints(p1, p2)
console.log(v2.toString())

console.log(v1.add(v2).toString())
console.log(v1.multiply(5).toString())
console.log(Vector2d.dot(v1, v2))
console.log(Vector2d.cross(v1, v2))

const values = v1.getValues()
for (let i = 0; i < values.length; i++) {
    console.log(values[i])
}
