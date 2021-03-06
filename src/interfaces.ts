export type Scope = {
  functions: { [key: string]: any };
  vars: { [key: string]: any };
};

export type Variable = {
  value: any;
  type: "string" | "number" | "function" | "array";
};
export type InstructionData = {
  code: string[];
  scopes: string[];
};
