import { CPP_TYPE_MAP, JS_TYPE_MAP, RUST_TYPE_MAP, ScalarType, Schema, StructuralType } from "./mapping/mapper"
import fs from "fs";
import path, { join } from "path";

type BaseType = "int" | "long" | "double" | "bool" | "char" | "string"
type SpecialType = "TreeNode" | "ListNode"

type ParamType =
  | BaseType
  | SpecialType
  | `${BaseType}[]`
  | `${BaseType}[][]`

interface InputParam {
  id: string
  name: string
  type: ParamType
}

interface ProblemPayload {
  name: string,
  description:string,
  inputs: InputParam[]
  output: { type: ParamType }
}

const mapper = {
    'CPP': CPP_TYPE_MAP,
    'JS' : JS_TYPE_MAP,
    'RUST': RUST_TYPE_MAP
}

export function generateBoilerPlate(schemPath:string, schema ?:ProblemPayload){

    let isSchema = schema;

    if(schemPath){
      if(!fs.existsSync(join(__dirname, schemPath,'Structure.json'))){
        return false
      }
        const structure = fs.readFileSync(join(__dirname, schemPath,'Structure.json'), 'utf-8')
        isSchema = JSON.parse(structure) as ProblemPayload;
      }

    if(!isSchema){
      return false;
    }
    const languages = ['CPP','RUST','JS'] as const;
      const allStartCode = languages.map((language, index) => {  
        const langType = mapper[language]      
       const params = generateParams(isSchema, language, langType)

       const startCode = buildBoilerPlate(language, langType, isSchema,params)
        return {code: startCode,
          languageId: index + 1
        }
      })
      return allStartCode;
}

function generateParams(isSchema:ProblemPayload, language:string, langType:Record<any,any>){
  const params = isSchema.inputs.map((input) => {
           if(language === 'CPP'){
            if(checkForReference(input.type)){
                return `${langType[input.type]}& ${input.name}`
            }else{
                return `${langType[input.type]} ${input.name}`
                
            }
        }

        if(language === 'RUST'){
            return `${input.name}: ${langType[input.type]}`;
        }

        return `${input.name}`
        })
        .join(", ")
    return params;
}

function buildBoilerPlate(language:string, langType:Record<any,any>, schema:ProblemPayload, params:string){
  if(language === 'CPP'){
        const cppCode = `${langType[schema.output.type]} ${schema.name} (${params}) {\n //Type your logic here\n}`;
        return cppCode
      }
      
      if(language === 'RUST'){
        const rustCode = `fn ${schema.name}(${params}) ->${langType[schema.output.type]}  {\n //Type your logic here\n}`
        return rustCode
      }
      
      if(language === 'JS'){
        const jsCode = `function ${schema.name}(${params}){\n //Type your logic here\n}`
        return jsCode
    }
    return ""
}

function generateFullCode(language : 'CPP' | 'JS' | 'RUST', schemPath:string){
    const languageMapper = mapper[language]

  if(!languageMapper){
        throw Error("Invalid or unsupported language")
  }

  const input = fs.readFileSync(join(__dirname,'../../problems/new-problem/tests/inputs/0.txt'),'utf-8')   // ->tofix

  const cleanInput = input.trim().replace(/\r/g, "");
  const params = cleanInput.split('\n');

  const s = fs.readFileSync(join(schemPath,'Structure.json'), 'utf-8')
  const schema:Schema = JSON.parse(s)

  const declarations = schema.inputs.map((i,k) => {
    
    if(i.type.includes('[]') || i.type === 'string'){
      return `${languageMapper[i.type]} ${i.name} = ${params[k]}`
    }
    
    return `${languageMapper[i.type]} ${i.name} = ${params[k]}`
    
  })

  const cppCode = `
  #include<iostream>
  #include<vector>

  using namespace std;

  ##USER CODE GOES HERE

  int main(){
  ${declarations.join(";\n")}
  ${languageMapper[schema.output.type]} result = ${schema.name}(${schema.inputs.map(i => i.name)});
  cout << result << endl;
  return 0;
  }
  `.trim()

  const boilerPlateFull = join(schemPath, 'boilerPlateFull')
  if(!fs.existsSync(boilerPlateFull)){
    fs.mkdirSync(boilerPlateFull)
  }

  fs.writeFileSync(join(boilerPlateFull, 'function.cpp'),cppCode)

}


const cppSchema = {
  name: "maxPathWithConstraints",
  inputs: [
    {
      name: "n",
      type: "int"
    },
    {
      name: "edges",
      type: "int[][]" // adjacency list edges
    },
    {
      name: "weights",
      type: "int[]"
    },
    {
      name: "root",
      type: "TreeNode"
    },
    {
      name: "queries",
      type: "int[][]"
    },
    {
      name: "threshold",
      type: "double"
    },
    {
      name: "labels",
      type: "string[]"
    }
  ],
  output: {
    type: "long"
  }
} as const satisfies Schema;


const rustSchema = {
  name: "processMatrixAndList",
  inputs: [
    {
      name: "matrix",
      type: "double[][]"
    },
    {
      name: "values",
      type: "int[]"
    },
    {
      name: "head",
      type: "ListNode"
    },
    {
      name: "operations",
      type: "string[]"
    },
    {
      name: "k",
      type: "int"
    },
    {
      name: "scale",
      type: "double"
    }
  ],
  output: {
    type: "double[]"
  }
} as const satisfies Schema;
const cppAdvancedSchema = {
  name: "analyzeNetwork",
  inputs: [
    { name: "nodes", type: "int" },
    { name: "edges", type: "int[][]" },
    { name: "cost", type: "int[]" },
    { name: "active", type: "bool" },
    { name: "root", type: "TreeNode" }
  ],
  output: {
    type: "int[]"
  }
} as const satisfies Schema;

const checkForReference = (type: string) =>  type.includes('[]') || type === 'string';

// console.log(generateBoilerPlate('CPP',process.env.PATHTOSCHEMA!))


// console.log(generateFullCode('CPP',process.env.PATHTOSCHEMA!))


// function g2sum(a1:number,b1:number) {
//   return a1 + b1; 
// }

