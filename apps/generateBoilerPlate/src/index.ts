import { InputParam, LanguageType, OutputParams, ProblemPayload, Structure } from "@repo/types";
import { CPP_TYPE_MAP, JS_TYPE_MAP, RUST_TYPE_MAP, ScalarType, Schema, StructuralType } from "./mapping/mapper"
import fs from "fs";
import path, { join } from "path";
import { getParserType } from "./mapping/parserMapping";

const mapper = {
    'CPP': CPP_TYPE_MAP,
    'JS' : JS_TYPE_MAP,
    'RUST': RUST_TYPE_MAP
}

export function generateBoilerPlate(schemPath:string, schema ?:Structure){

    let isSchema = schema;

    if(schemPath){
      if(!fs.existsSync(join(__dirname, schemPath,'Structure.json'))){
        return false
      }
        const structure = fs.readFileSync(join(__dirname, schemPath,'Structure.json'), 'utf-8')
        isSchema = JSON.parse(structure) as Structure;
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

function generateParams(isSchema:Structure, language:string, langType:Record<any,any>){
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

function buildBoilerPlate(language:string, langType:Record<any,any>, schema:Structure, params:string){
  if(language === 'CPP'){
        const cppCode = `${langType[schema.output.type]} ${toCamelCase(schema.name)} (${params}) {\n //Type your logic here\n}`;
        return cppCode
      }
      
      if(language === 'RUST'){
        const rustCode = `fn ${toCamelCase(schema.name)}(${params}) ->${langType[schema.output.type]}  {\n //Type your logic here\n}`
        return rustCode
      }
      
      if(language === 'JS'){
        const jsCode = `function ${toCamelCase(schema.name)}(${params}){\n //Type your logic here\n}`
        return jsCode
    }
    return ""
}

export function generateFullCode(language : 'CPP' | 'JS' | 'RUST', schema:Structure, userCode:string, problemName:string){
    const languageMapper = mapper[language]
  
  if(!languageMapper){
        throw Error("Invalid or unsupported language")
  }
  const inputs = schema.inputs.map((i:Omit<InputParam,"id">) => {
    
    const varType = languageMapper[i.type as LanguageType]
    if(!varType){
      throw Error("Invalid Type")
    }
    
    const parserType = getParserType(i.type)
    return `getline(cin, line); ${varType} ${i.name} = ${parserType}(line);`
  }).join("\n");

  const functionParams = schema.inputs.map(i => i.name).join(", ");;
  const isVoid = schema.output.type === "void";
  const logicFunctionCall = isVoid
    ? `${toCamelCase(problemName)}(${functionParams});`  
    :`auto result = ${toCamelCase(problemName)}(${functionParams});`

  if (language === 'CPP') {
    return `
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <map>
#include <functional>
#include <climits>
#include "bridge.h"    // For printOutput, TreeNode*, ListNode*
#include "parser.h"    // All parsing logic

using namespace std;

// --- USER CODE START ---
${userCode}
// --- USER CODE END ---

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    try {
        string line;
        ${inputs}   // JS generates: getline(cin,line); auto x = parseVectorInt(line); ...

        ${logicFunctionCall}   // Example: auto result = twoSum(nums, target);

        ${isVoid ? `printOutput(${functionParams.split(',')[0]})` : 'printOutput(result)'};

    } catch(const exception& e) {
        cerr << "Runtime Error: " << e.what() << endl;
        return 1;
    }

    return 0;
}
`.trim();
}


    throw Error("Language implementation pending");

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

const toCamelCase = (str:string):string => {
  return str
    .split(/[^a-zA-Z0-9]/) // Split by space, hyphen, or underscore
    .filter(Boolean)       // Remove empty strings from double separators
    .map((word, index) => {
      if (index === 0) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');
};
console.log(generateBoilerPlate(process.env.PATHTOSCHEMA!))


// console.log(generateFullCode('CPP',process.env.PATHTOSCHEMA!))


// function g2sum(a1:number,b1:number) {
//   return a1 + b1; 
// }

