import { z } from 'zod';

// ---------------------------------------------------------
// 1. PRIMITIVES & ENUMS
// ---------------------------------------------------------

// Define the raw arrays first so we can reuse them in validation logic if needed
const BASE_TYPES = ["int", "long", "double", "bool", "char", "string"] as const;
const SPECIAL_TYPES = ["TreeNode", "ListNode"] as const;

export const BaseTypeSchema = z.enum(BASE_TYPES);
export const SpecialTypeSchema = z.enum(SPECIAL_TYPES);

// ParamType is tricky because of the template literals (int[], int[][]). 
// We validate this using a custom refinement or a comprehensive regex.
export const ParamTypeSchema = z.string().refine((val) => {
  // Check if it is a simple BaseType
  if (BASE_TYPES.includes(val as any)) return true;
  // Check if it is a SpecialType
  if (SPECIAL_TYPES.includes(val as any)) return true;
  
  // Check array variations (e.g., "int[]", "int[][]")
  // Regex: Starts with a BaseType, followed by exactly "[]" or "[][]"
  const arrayRegex = new RegExp(`^(${BASE_TYPES.join('|')})(\\[\\]){1,2}$`);
  return arrayRegex.test(val);
}, {
  message: "Invalid ParamType. Must be a base type, special type, or 1D/2D array of base type."
});

// ---------------------------------------------------------
// 2. DOMAIN OBJECTS
// ---------------------------------------------------------

export const InputParamSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: ParamTypeSchema
});

export const ProblemPayloadSchema = z.object({
  name: z.string(),
  description: z.string(),
  inputs: z.array(InputParamSchema),
  output: z.object({ type: ParamTypeSchema }),
  problemId: z.string().nullable()
});

export const BoilerplateCodeSchema = z.object({
  code: z.string(),
  languageId: z.number(),
});

export const BolierPateResponseSchema = z.object({
  startCode: z.array(BoilerplateCodeSchema),
  problemId: z.string(),
});

export const ErrorResponseSchema = z.object({
  msg: z.string(),
});

export const TestCaseSchema = z.object({
  id: z.string(),
  input: z.string(),
  output: z.string(),
  isHidden: z.boolean(),
});

export const problemSubmission = z.object({
    cases: z.string(),
    
})
export const J0TestSchema = z.object({
  source_code: z.string(),
  language_id: z.number(),
  stdin: z.string(),
  expected_output: z.string()
});

// ---------------------------------------------------------
// 3. INFERRED TYPES (The "Single Source of Truth")
// ---------------------------------------------------------

export type BaseType = z.infer<typeof BaseTypeSchema>;
export type SpecialType = z.infer<typeof SpecialTypeSchema>;
export type ParamType = z.infer<typeof ParamTypeSchema>;
export type InputParam = z.infer<typeof InputParamSchema>;
export type ProblemPayload = z.infer<typeof ProblemPayloadSchema>;
export type BoilerplateCode = z.infer<typeof BoilerplateCodeSchema>;
export type BolierPateResponse = z.infer<typeof BolierPateResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type TestCase = z.infer<typeof TestCaseSchema>;
export type J0Test = z.infer<typeof J0TestSchema>;

// ---------------------------------------------------------
// 4. REACT PROPS HANDLING
// ---------------------------------------------------------

/* NOTE: We cannot validate functions (setProblemName, handleEdit) with Zod at runtime.
   Therefore, we keep the Zod schema for the *Data* parts of props, and 
   manually define the *Function* parts in TypeScript.
*/

// Schema for the data stored in the form state
export const ProblemFormStateSchema = z.object({
  problemName: z.string(),
  problemDesc: z.string(),
  params: z.array(z.any()), // You should ideally replace 'any' with a stricter schema if possible
  paramName: z.string(),
  selectedBase: z.any(),
  isArray: z.boolean(),
  dimension: z.union([z.literal(1), z.literal(2)]),
  special: z.any(),
  editingId: z.string().nullable(),
  outputType: z.any(),
  problemId: z.string().nullable(),
  baseTypes: z.array(z.string()),
  specialTypes: z.array(z.string()),
});

// The final Props interface combines the inferred data types + manual function types
export type Props = z.infer<typeof ProblemFormStateSchema> & {
  setProblemName: (v: string) => void;
  setProblemDesc: (v: string) => void;
  setParamName: (v: string) => void;
  setSelectedBase: (v: any) => void;
  setIsArray: (v: boolean) => void;
  setDimension: (v: 1 | 2) => void;
  setSpecial: (v: any) => void;
  handleAddOrUpdate: () => void;
  handleEdit: (p: any) => void;
  handleDelete: (id: string) => void;
  setOutputType: (v: any) => void;
  handleSubmit: () => void;
};
