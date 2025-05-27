interface IPropertyChangedListener<T = any> {
    onPropertyChanged(obj: T, propertyName: string, newValue: any): void
}

interface INotifyDataChanged {
    addPropertyChangedListener(listener: IPropertyChangedListener): void
    removePropertyChangedListener(listener: IPropertyChangedListener): void
}

class NotifyDataChanged implements INotifyDataChanged {
    private propertyChangedListeners: IPropertyChangedListener[] = []

    addPropertyChangedListener(listener: IPropertyChangedListener): void {
        this.propertyChangedListeners.push(listener)
    }

    removePropertyChangedListener(listener: IPropertyChangedListener): void {
        const index = this.propertyChangedListeners.indexOf(listener)
        if (index !== -1) {
            this.propertyChangedListeners.splice(index, 1)
        }
    }

    protected notifyPropertyChanged(propertyName: string, newValue: any): void {
        this.propertyChangedListeners.forEach((listener) => {
            listener.onPropertyChanged(this, propertyName, newValue)
        })
    }
}

interface IPropertyChangingListener<T = any> {
    onPropertyChanging(obj: T, propertyName: string, oldValue: any, newValue: any): boolean
}

interface INotifyDataChanging {
    addPropertyChangingListener(listener: IPropertyChangingListener): void
    removePropertyChangingListener(listener: IPropertyChangingListener): void
}

class NotifyDataChanging extends NotifyDataChanged implements INotifyDataChanging {
    private propertyChangingListeners: IPropertyChangingListener[] = []

    addPropertyChangingListener(listener: IPropertyChangingListener): void {
        this.propertyChangingListeners.push(listener)
    }

    removePropertyChangingListener(listener: IPropertyChangingListener): void {
        const index = this.propertyChangingListeners.indexOf(listener)
        if (index !== -1) {
            this.propertyChangingListeners.splice(index, 1)
        }
    }

    protected canChangeProperty(propertyName: string, oldValue: any, newValue: any): boolean {
        for (const listener of this.propertyChangingListeners) {
            if (!listener.onPropertyChanging(this, propertyName, oldValue, newValue)) {
                return false
            }
        }
        return true
    }

    protected setProperty<T>(propertyName: string, currentValue: T, newValue: T): T {
        if (currentValue === newValue) return currentValue

        if (!this.canChangeProperty(propertyName, currentValue, newValue)) {
            return currentValue
        }

        this.notifyPropertyChanged(propertyName, newValue)
        return newValue
    }
}

class User extends NotifyDataChanging {
    private _name: string = ""
    private _age: number = 0

    get name(): string {
        return this._name
    }
    set name(value: string) {
        this._name = this.setProperty("name", this._name, value)
    }

    get age(): number {
        return this._age
    }
    set age(value: number) {
        this._age = this.setProperty("age", this._age, value)
    }
}

class LogListener implements IPropertyChangedListener<User> {
    onPropertyChanged(obj: User, propertyName: string, newValue: any): void {
        console.log(`Changed ${propertyName} from ${obj[propertyName]} to ${newValue}`)
    }
}

class AgeValidator implements IPropertyChangingListener<User> {
    onPropertyChanging(obj: User, propertyName: string, oldValue: any, newValue: any): boolean {
        if (propertyName === "age" && (newValue < 0 || newValue > 100)) {
            console.log(`Invalid age: ${newValue}`)
            return false
        }
        return true
    }
}

const demonstrateee = (): void => {
    const user = new User()
    const logger = new LogListener()
    const validator = new AgeValidator()

    user.addPropertyChangedListener(logger)
    user.addPropertyChangingListener(validator)

    user.name = "Jack"
    user.name = "John"
    user.age = 25
    user.age = 150
    console.log(`Users name is ${user.name}, age is ${user.age}`)
}

demonstrateee()
