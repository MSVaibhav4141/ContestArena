'use client'

import { useState } from "react"
import { createProblemAction } from "../../app/create/problem/action"

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


const baseTypes: BaseType[] = ["int","long","double","bool","char","string"]
const specialTypes: SpecialType[] = ["TreeNode","ListNode"]

export default function ProblemForm() {
  const [problemName, setProblemName] = useState("")
  const [problemDesc, setProblemDesc] = useState("")
  const [params, setParams] = useState<InputParam[]>([])
  const [outputType, setOutputType] = useState<ParamType>("int")

  const [editingId, setEditingId] = useState<string | null>(null)

  const [paramName, setParamName] = useState("")
  const [selectedBase, setSelectedBase] = useState<BaseType>("int")
  const [isArray, setIsArray] = useState(false)
  const [dimension, setDimension] = useState<1 | 2>(1)
  const [special, setSpecial] = useState<"" | SpecialType>("")

  const resetForm = () => {
    setParamName("")
    setSelectedBase("int")
    setIsArray(false)
    setDimension(1)
    setSpecial("")
    setEditingId(null)
  }

  const buildType = (): ParamType => {
    if (special) return special
    if (!isArray) return selectedBase
    return dimension === 1 ? `${selectedBase}[]` : `${selectedBase}[][]`
  }

  const handleAddOrUpdate = () => {
    if (!paramName.trim()) return alert("Parameter name required")

    const newParam: InputParam = {
      id: editingId ?? crypto.randomUUID(),
      name: paramName,
      type: buildType()
    }

    if (editingId) {
      setParams(prev => prev.map(p => p.id === editingId ? newParam : p))
    } else {
      setParams(prev => [...prev, newParam])
    }

    resetForm()
  }

  const handleEdit = (param: InputParam) => {
    setEditingId(param.id)
    setParamName(param.name)

    if (specialTypes.includes(param.type as SpecialType)) {
      setSpecial(param.type as SpecialType)
      setIsArray(false)
    } else if (param.type.includes("[]")) {
      const base = param.type.replace(/\[\]/g, "") as BaseType
      const dims = (param.type.match(/\[\]/g) || []).length as 1 | 2
      setSelectedBase(base)
      setIsArray(true)
      setDimension(dims)
      setSpecial("")
    } else {
      setSelectedBase(param.type as BaseType)
      setIsArray(false)
      setSpecial("")
    }
  }

  const handleDelete = (id: string) => {
    setParams(prev => prev.filter(p => p.id !== id))
  }

  const handleSubmit = async() => {
    const payload: ProblemPayload = {
      name: problemName,
      description: problemDesc,
      inputs: params,
      output: { type: outputType }
    }
    console.log(payload)
    const boilerCode = await createProblemAction(payload);
    console.log(boilerCode)
    
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Create Problem</h1>

      <input
        className={`w-full border rounded-lg p-2 `}
        placeholder="Problem Name"
        value={problemName}
        onChange={e => setProblemName(e.target.value)}
      />

      <input
        className="w-full border rounded-lg p-2"
        placeholder="Problem Desicriptiom"
        value={problemDesc}
        onChange={e => setProblemDesc(e.target.value)}
      />

      {/* PARAM FORM */}
      <div className="bg-gray-50 p-4 rounded-xl space-y-3 border">
        <h2 className="font-medium">{editingId ? "Edit Parameter" : "Add Parameter"}</h2>

        <input
          className="w-full border rounded-lg p-2"
          placeholder="Parameter Name"
          value={paramName}
          onChange={e => setParamName(e.target.value)}
        />

        <div className="flex flex-wrap gap-3 items-center">
          <select
            className="border rounded-lg p-2"
            value={selectedBase}
            onChange={e => { setSelectedBase(e.target.value as BaseType); setSpecial("") }}
          >
            {baseTypes.map(t => <option key={t}>{t}</option>)}
          </select>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isArray}
              onChange={e => { setIsArray(e.target.checked); setSpecial("") }}
            />
            Array
          </label>

          {isArray && (
            <select
              className="border rounded-lg p-2"
              value={dimension}
              onChange={e => setDimension(Number(e.target.value) as 1 | 2)}
            >
              <option value={1}>1D</option>
              <option value={2}>2D</option>
            </select>
          )}

          <select
            className="border rounded-lg p-2"
            value={special}
            onChange={e => { setSpecial(e.target.value as SpecialType); setIsArray(false) }}
          >
            <option value="">No Special Type</option>
            {specialTypes.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        <button
          onClick={handleAddOrUpdate}
          className="bg-black text-white px-4 py-2 rounded-lg hover:opacity-90"
        >
          {editingId ? "Update Parameter" : "Add Parameter"}
        </button>
      </div>

      {/* PARAM LIST */}
        {params.length > 0 && (
           <div className="border rounded-xl p-3 bg-gray-50 max-h-40 overflow-y-auto space-y-2">
        {params.map(p => (
          <div key={p.id} className="flex justify-between items-center border p-3 rounded-lg">
            <span className="font-mono">{p.name} : {p.type}</span>
            <div className="space-x-2">
              <button
                onClick={() => handleEdit(p)}
                className="text-blue-600 hover:underline"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(p.id)}
                className="text-red-600 hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

        )}
       
      {/* OUTPUT */}
      <div>
        <h2 className="font-medium mb-2">Output Type</h2>
        <select
          className="border rounded-lg p-2"
          value={outputType}
          onChange={e => setOutputType(e.target.value as ParamType)}
        >
          {[...baseTypes, ...specialTypes, "int[]", "int[][]", "string[]", "string[][]"].map(t => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

      <button
        onClick={handleSubmit}
        className="w-full bg-green-600 text-white py-3 rounded-xl font-medium hover:opacity-90"
      >
        GO 🚀 Generate Payload
      </button>
    </div>
  )
}