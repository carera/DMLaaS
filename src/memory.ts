import { Scope } from "./interfaces";
import uuid = require("uuid");

class Memory {
  memory: { [key: string]: Scope };
  constructor() {
    this.memory = {};
  }
  createScope = (prefix: string = "") => {
    const id = `${prefix}${uuid.v4()}`;
    this.memory[id] = { functions: {}, vars: {} };
    return id;
  };

  getInnermostScope = (scopes: string[]) => {
    return scopes[scopes.length - 1];
  };

  // GC v1 !!!
  clearScope = (scope: string) => {
    delete this.memory[scope];
  };

  findFunction = (name: string, scopes: string[]) => {
    for (let i = scopes.length - 1; i >= 0; i--) {
      const scopeName = scopes[i];
      const scope = this.memory[scopeName];
      if (scope.functions[name]) {
        return scope.functions[name];
      }
    }
    throw new Error(`Function ${name} not found.`);
  };

  findVariableValue = (name: string, scopes: string[]) => {
    for (let i = scopes.length - 1; i >= 0; i--) {
      const scopeName = scopes[i];
      const scope = this.memory[scopeName];
      if (scope.vars[name] !== undefined) {
        return scope.vars[name];
      }
    }
    // var not found, returning the name, maybe it's supposed to be value
    return name;
  };
}

export default new Memory();
