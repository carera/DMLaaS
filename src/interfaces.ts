export type Payload = {
  pid: string; // program id
  scopes: string[]; // array of scope IDs
  data: any; // returned value from interpreter
};
