// app.ts - intentionally broken TypeScript

let username: string = 123; // ❌ Error: number assigned to string

function greet(name: string): string {
    return "Hello, " + name;
}

let result: number = greet("World"); // ❌ Error: string is not assignable to number

// Missing type annotation and wrong syntax
const add = (a: number, b: number => a + b; // ❌ Error: misplaced arrow

// Incorrect interface definition
interface Person {
    name: string
    age number; // ❌ Error: missing colon
}

let p: Person = {
    name: "Alice",
    age: "twenty" // ❌ Error: should be number
}

// Wrong function call
greet(42); // ❌ Error: argument of type 'number' not assignable to 'string'
