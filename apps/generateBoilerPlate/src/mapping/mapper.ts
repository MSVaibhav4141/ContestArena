export const JS_TYPE_MAP = {
  "int": "number",
  "long": "number",
  "double": "number",
  "bool": "boolean",
  "char": "string",
  "string": "string",

  "int[]": "number[]",
  "double[]": "number[]",
  "string[]": "string[]",

  "int[][]": "number[][]",
  "double[][]": "number[][]",

  "TreeNode": "TreeNode",
  "ListNode": "ListNode"
};


export const CPP_TYPE_MAP = {
  // ===== Primitive =====
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
  "string[]":  "vector<string>",

  // ===== 2D arrays =====
  "int[][]":   "vector<vector<int>>",
  "double[][]": "vector<vector<double>>",

  // ===== Structures =====
  "TreeNode":  "TreeNode*",
  "ListNode":  "ListNode*",
};

export const RUST_TYPE_MAP = {
  "int": "i32",
  "long": "i64",
  "double": "f64",
  "bool": "bool",
  "char": "char",
  "string": "String",

  "int[]": "Vec<i32>",
  "double[]": "Vec<f64>",
  "string[]": "Vec<String>",

  "int[][]": "Vec<Vec<i32>>",
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
