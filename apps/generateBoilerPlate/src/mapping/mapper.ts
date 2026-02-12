export const JS_TYPE_MAP = {
  "void":      "void",
  "int": "number",
  "long": "number",
  "double": "number",
  "bool": "boolean",
  "char": "string",
  "string": "string",
  
  "int[]": "number[]",
  "long[]": "number[]",
  "double[]": "number[]",
  "bool[]" : "number[]",
  "string[]": "string[]",

  "int[][]": "number[][]",
  "double[][]": "number[][]",
  "bool[][]": "number[][]",
  "string[][]": "string[][]",
  "char[]" : "string",
  "char[][]": "string[][]",
  'long[][]':"number[][]",

  "TreeNode": "TreeNode",
  "ListNode": "ListNode"
};


export const CPP_TYPE_MAP = {
  // ===== Primitive =====
  "void":      "void",
  "int":       "int",
  "long":      "long long",
  "double":    "double",
  "bool":      "bool",
  "char":      "char",
  "string":    "string",

  // ===== 1D arrays =====
  "int[]":     "vector<int>",
  "long[]":    "vector<long long>",
  "double[]":  "vector<double>",
  "bool[]" :   "vector<bool>",
  "char[]" :   "string",
  "string[]":  "vector<string>",

  // ===== 2D arrays =====
  "int[][]":    "vector<vector<int>>",
  "double[][]": "vector<vector<double>>",
  "bool[][]":   "vector<vector<bool>>",
  "long[][]":   "vector<vector<long long>>",
  "string[][]": "vector<vector<string>>",
  "char[][]":   "vector<vector<char>>",

  // ===== Structures =====
  "TreeNode":  "TreeNode*",
  "ListNode":  "ListNode*",
};

export const RUST_TYPE_MAP = {
  "void":      "void",
  "int": "i32",
  "long": "i64",

  "double": "f64",
  "bool": "bool",
  "char": "char",
  "string": "String",

  "char[]" : "Vec<char>",
  "int[]": "Vec<i32>",
  "long[]": "Vec<i64>",
  "bool[]" : "Vec<bool>",

  "double[]": "Vec<f64>",
  "string[]": "Vec<String>",

  "int[][]": "Vec<Vec<i32>>",
  'long[][]':"Vec<Vec<i64>>",
  "bool[][]": "Vec<Vec<bool>>",
  "char[][]": "Vec<Vec<char>>",
  "string[][]": "Vec<Vec<String>>",
  "double[][]": "Vec<Vec<f64>>",

  "TreeNode": "Option<Box<TreeNode>>",
  "ListNode": "Option<Box<ListNode>>"
};

export type ScalarType =
  | 'int'
  | 'bool'
  | 'long'
  | 'double'
  | 'string'
  | 'char';

export type StructuralType =
  | 'TreeNode'
  | 'ListNode';

export type ArrayType<T extends string> =
  | T
  | `${T}[]`
  | `${T}[][]`;

  export type TypeInput =Exclude<
  | ArrayType<Exclude<ScalarType, 'bool'|'long'|'char'>>
  | StructuralType
  | ScalarType, 'string[][]'>;

export type InputField = {
  name: string;
  type: TypeInput;
};

export type OutputField = {
  type: TypeInput;
};

export type Schema = {
  name: string;
  inputs: InputField[];
  output: OutputField;
};
