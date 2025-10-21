// broken.ts - intentionally broken TypeScript

// Wrong variable type
let isActive: boolean = "true"; // ❌ string assigned to boolean
let something: string = "something";
// Function missing return type and wrong parameter usage
function multiply(a: number, b: string) {
    return a * b; // ❌ can't multiply number and string
}

// Class with broken syntax
class Car {
    make: string;
    model string; // ❌ missing colon

    constructor(make: string, model: string {
        this.make = make;
        this.model = model;
    }

    drive(): void {
        console.log("Driving " + this.make + " " + this.model)
    }
}

// Using undeclared variable
console.log(speed); // ❌ 'speed' is not defined

// Wrong enum usage
enum Direction {
    Up,
    Down,
    Left,
    Right
}

let move: Direction = "Up"; // ❌ string not assignable to enum
