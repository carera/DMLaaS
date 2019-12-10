# DMLaaS - Distributed Modular Language. As a Service.

DMLaaS - Distributed Modular Language as a Service is a programming language implemented as an API. This means that individual instructions
are executed via API calls to the interpreter. These instructions can be grouped into instruction blocks, forming programs, functions, and other structures typical language would have. The fact that blocks of instructions (at any granularity, down to individual instructions) can be (and are) executed on independent execution nodes (servers) allows virtually infinite scaling and parallelization.

**Distributed** - The code runs in a network. An arbitrarily large part of code can be executed on an independent execution node.

**Modular** - Building blocks of your program don't have to be written in DML, but a DML instruction can invoke a module, virtually from any language out there.

> ## Disclaimer
>
> This a conceptual, experimental case study, mostly for shits and giggles. And trolls. Maybe, one day, we will find energy to implement this.

## How to run

### Prerequisites

- Node 13, or nvm

```
nvm use                           // Switch to required Node version
npm i                             // Install dependencies
npm run start:server              // Start DML server
bin/dml -f <your program>         // Run your program
```

Example:

```
bin/dml -f examples/function.dml
```

## Syntax

Syntax is defined by HTTP calls - methods and paths, supported by indentation to define nesting. The API paths and methods
haven't been decided yet and are subject to change.

| Type                 | Syntax                            | Example               |
| -------------------- | --------------------------------- | --------------------- |
| Program declaration  | `program/{name}`                  | `program/hello-world` |
| Variable declaration | `var/{varName}/{value}`           | `var/a/3`             |
| Expression           | `{operator}/{arg1}/{arg2}/...`    | `+/3/5`               |
| Condition            | `if/{condition}/{arg1}/{arg2}`    | `if/</3/5`            |
| Function declaration | `defn/{name}/{arg1}/{arg2}/...`   | `defn/sum/a/b`        |
| Function invocation  | `callfn/{name}/{arg1}/{arg2}/...` | `callfn/sum/a/b`      |
| Parallel invocation  | `parallel`                        | `parrallel`           |
| Array                | `array/{val1}/{val2}/...`         | `array/2/4/6/8`       |

## Examples

Add two numbers:

```
+/3/5
```

Using variables:

```
var/a/3    // assign a = 3
var/b/5    // assign b = 5
var/c      // assign c = a + b
  +/a/b
```

Recursive fibonacci function:

```
program/my-fibonacci-example       // Create a program (or a namespace/scope, if you will) called my-fibonacci-example

  defn/fibonacci/num               // define function 'fibonacci' with single input parameter 'num'
    if/<=/num/1                    // if num <= 1
      var/result                   //   result = num
        var/num
    if/>/num/1                     // if num > 1
      var/a                        //   a = num - 1
        -/num/1
      var/b                        //   b = num - 2
        -/num/2
      var/fiba                     //   fiba = fibonacci(a)
        callfn/fibonacci/a
      var/fibb                     //   fibb = fibonacci(b)
        callfn/fibonacci/b
      var/result                   //   result = fiba + fibb
        +/fiba/fibb
    var/result                     // return result

  callfn/fibonacci/8               // call 'fibonacci' function with argument 8
```

Run multiple instructions in parallel

```
parallel
  +/4/5
  -/10/2
  **/2/12

// returns list of results: [ 9, 8, 4096 ]
```

Find other examples in the `examples` folder

## Memory

One might ask, where are declard variables, functions, and scopes stored? Right now, all of this is currently passed in the request body of the individual invocations

# Ideas & concepts to think through

### General consensus based selection of modules

Similarly to how NPM community decides which packages are good based on their popularity and rating, DMLaaS would choose to offer different libraries. Thanks to modularity, a call to e.g. `callfn/quicksort` does not necessarily have to invoke a bunch of nested HTTP calls, but an actual implementation of quicksort, in arbitrary language, based on which execution node offers its availability. Developers could also choose specific implementation themselves, if needed, perhaps by calling `callfn/npm-quicksort-13.3.1`

### REPL-like evaluation - select a block and execute only that.

### GUI programming - connect blocks to define sequences of calls.

### No module imports. Everything is always available in the network.

### Lazy evaluations?

Theoretically, since function declaration does not evaluate anything in its body but rather stores the nested instructions, these instructions can be measured for potential computation cost and cluster can be pre-warmed up.

### Scopes? Namespaces?

Does nesting mean isolated scope? In case instructions get distributed into multiple execution nodes, how do these nodes access variables in shared scope?

### Reduce boilerplate code by having guards/conditions as query parameters?

### Async? Parallelization?

```
parallel   // Call functions X, Y, and Z in parallel
  callfn/X
  callfn/Y
  callfn/Z
```

How to collect outputs?

### Lists? Collections? Or any data structures, really?

```
list/foo/6/5/4/3

defn/sort?params=data             // Define function that sorts list
  ... sorting algorithm ...       // ¯\_(ツ)_/¯
```

### Types?

There are many options on how to approach types:

```
var/number/a/3
number/a/3
var/a:number/3
```

### Automate interface generation from languages

To obtain interface of Array.prototype in JS, we can do:

```javascript
const arrObj = Object.getOwnPropertyNames(Array.prototype);
for (const funcKey in arrObj) {
  console.log(arrObj[funcKey]);
}
```

This will give us all properties and methods. Can we generate endpoints with these signatures and invoke given methods upon calling them?
