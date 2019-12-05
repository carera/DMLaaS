# DMLaaS - Distributed Modular Language. As a Service.

DMLaaS - Distributed Modular Language as a Service is a programming language implemented as an API. This means that individual instructions
are executed via API calls to the interpreter. These instructions can be grouped into instruction blocks, forming programs, functions, and other structures typical language would have. The fact that blocks of instructions (at any granularity, down to individual instructions) can be (and are) executed on independent execution nodes (servers) allows virtually infinite scaling and parallelization.

> ## Disclaimer
>
> This a conceptual, experimental case study, mostly for shits and giggles. And trolls. Maybe, one day, we will find energy to implement this.

## Syntax

Syntax is defined by HTTP calls - methods and paths, supported by indentation to define nesting. The API paths and methods
haven't been decided yet and are subject to change.

Declare variable (option 1)

    PUT /dallas/var/{varName}/{value}

Declare variable (option 2)

    PUT /dallas/var?{varName}={value}
    PUT /dallas/var?{varName1}={value1}&{varName2}={value2}

Assign result of another instruction to a variable

    PUT /dallas/var/a      // a =
      GET /dallas/+/3/5    //   3 + 5

... TBD ...

## Examples

Add two numbers:

```
PUT /dallas/var/a/3
PUT /dallas/var/b/5
GET /dallas/+/a/b
```

Fibonacci number:

```
PUT /dallas/program/my-fibonacci-example        // Create a program (or a namespace/scope, if you will) called my-fibonacci-example

  PUT /dallas/defn/fibonacci?params=num           // define function 'fibonacci' with single input parameter 'num'
    PUT /dallas/var?a=1&b=0&temp                // define a=1, b=0, temp
    PUT /dallas/while?cond=num>=0               // while num >= 0
      PUT /dallas/var/temp/a                    //   temp = a
      PUT /dallas/var/a                         //   a =
        GET /dallas/+/a/b                       //     a + b
      PUT /dallas/var/b/temp                    //   b = temp
      PUT /dallas/var/num                       //   num =
        GET /dallas/-/num/1                     //     num - 1
    GET /dallas/var/b                           // return b

  GET /dallas/callfn/fibonacci/8                // call 'fibonacci' function with argument 8
```

## Ideas & concepts to think through

### General consensus based selection of modules

Similarly to how NPM community decides which packages are good based on their popularity and rating, DMLaaS would choose to offer different libraries. Thanks to modularity, a call to e.g. `GET /dallas/callfn/quicksort` does not necessarily have to invoke a bunch of nested HTTP calls, but an actual implementation of quicksort, in arbitrary language, based on which execution node offers its availability. Developers could also choose specific implementation themselves, if needed, perhaps by calling `GET /dallas/callfn/npm-quicksort-13.3.1`

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
POST /dallas/parallel?callback=xyz   // Call functions X, Y, and Z in parallel and create callback 'xyz' through which to collect outputs
  GET /dallas/callfn/X
  GET /dallas/callfn/Y
  GET /dallas/callfn/Z

GET /dallas/collect/xyz              // Collect returned values from parallel execution
```

How to collect outputs?

### Lists? Collections? Or any data structures, really?

```
PUT /dallas/list/foo?items=6,5,4,3

PUT /dallas/defn/sort?params=data   // Define function that sorts list
  ... sorting algorithm ...         // ¯\_(ツ)_/¯
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
