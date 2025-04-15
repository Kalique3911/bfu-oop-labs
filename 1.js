var WIDTH = 800;
var HEIGHT = 600;
var Point2d = /** @class */ (function () {
    function Point2d(x, y) {
        this.x = x;
        this.y = y;
    }
    Object.defineProperty(Point2d.prototype, "x", {
        get: function () {
            return this._x;
        },
        set: function (value) {
            if (value < 0 || value > WIDTH) {
                throw new Error("x must be between 0 and ".concat(WIDTH));
            }
            this._x = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Point2d.prototype, "y", {
        get: function () {
            return this._y;
        },
        set: function (value) {
            if (value < 0 || value > HEIGHT) {
                throw new Error("y must be between 0 and ".concat(HEIGHT));
            }
            this._y = value;
        },
        enumerable: false,
        configurable: true
    });
    Point2d.prototype.equals = function (other) {
        return this.x === other.x && this.y === other.y;
    };
    Point2d.prototype.toString = function () {
        return "Point2d(".concat(this.x, ", ").concat(this.y, ")");
    };
    return Point2d;
}());
var Vector2d = /** @class */ (function () {
    function Vector2d(x, y) {
        this.x = x;
        this.y = y;
    }
    Vector2d.fromPoints = function (start, end) {
        return new Vector2d(end.x - start.x, end.y - start.y);
    };
    Object.defineProperty(Vector2d.prototype, "length", {
        get: function () {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        },
        enumerable: false,
        configurable: true
    });
    Vector2d.prototype.get = function (index) {
        if (index === 0)
            return this.x;
        if (index === 1)
            return this.y;
        throw new Error("Index out of range");
    };
    Vector2d.prototype.set = function (index, value) {
        if (index === 0)
            this.x = value;
        else if (index === 1)
            this.y = value;
        else
            throw new Error("Index out of range");
    };
    Vector2d.prototype.getValues = function () {
        return [this.x, this.y];
    };
    Vector2d.prototype.equals = function (other) {
        return this.x === other.x && this.y === other.y;
    };
    Vector2d.prototype.toString = function () {
        return "Vector2d(".concat(this.x, ", ").concat(this.y, ")");
    };
    Vector2d.prototype.add = function (other) {
        return new Vector2d(this.x + other.x, this.y + other.y);
    };
    Vector2d.prototype.subtract = function (other) {
        return new Vector2d(this.x - other.x, this.y - other.y);
    };
    Vector2d.prototype.multiply = function (scalar) {
        return new Vector2d(this.x * scalar, this.y * scalar);
    };
    Vector2d.prototype.divide = function (scalar) {
        if (scalar === 0)
            throw new Error("Division by zero");
        return new Vector2d(this.x / scalar, this.y / scalar);
    };
    Vector2d.prototype.dot = function (other) {
        return this.x * other.x + this.y * other.y;
    };
    Vector2d.prototype.cross = function (other) {
        return this.x * other.y - this.y * other.x;
    };
    Vector2d.dot = function (a, b) {
        return a.dot(b);
    };
    Vector2d.cross = function (a, b) {
        return a.cross(b);
    };
    Vector2d.tripleProduct = function (a, b, c) {
        return a.x * (b.y * c.x - b.x * c.y) - a.y * (b.x * c.x - b.x * c.x);
    };
    return Vector2d;
}());
// Демонстрация работы
var p1 = new Point2d(10, 20);
var p2 = new Point2d(30, 40);
console.log(p1.toString());
var v1 = new Vector2d(1, 2);
var v2 = Vector2d.fromPoints(p1, p2);
console.log(v2.toString());
console.log(v1.add(v2).toString());
console.log(v1.multiply(5).toString());
console.log(Vector2d.dot(v1, v2));
console.log(Vector2d.cross(v1, v2));
// Итерация через метод getValues()
var values = v1.getValues();
for (var i = 0; i < values.length; i++) {
    console.log(values[i]);
}
