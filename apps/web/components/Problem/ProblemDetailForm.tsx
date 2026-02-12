import { Props } from "@repo/types";

export default function ProblemDetailsForm(props: Props) {
  const {
    problemName, setProblemName,
    problemDesc, setProblemDesc,
    params, paramName, setParamName,
    selectedBase, setSelectedBase,
    isArray, setIsArray,
    dimension, setDimension,
    special, setSpecial,
    handleAddOrUpdate, handleEdit, handleDelete,
    editingId, outputType, setOutputType,
    handleSubmit, problemId,
    baseTypes, specialTypes
  } = props
  
  return (
    <div className="flex-1 max-w-2xl bg-white rounded-2xl shadow-lg p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Create Problem</h1>

      {/* Problem Info */}
      <div className="space-y-3">
        <input
          className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Problem Name"
          value={problemName}
          onChange={e => setProblemName(e.target.value)}
        />

        <textarea
          className="w-full border rounded-xl p-3 h-28 resize-none focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Problem Description"
          value={problemDesc}
          onChange={e => setProblemDesc(e.target.value)}
        />
      </div>

      {/* Parameter Builder */}
      <div className="bg-gray-50 border rounded-2xl p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-700">
          {editingId  ? "Edit Parameter" : "Add Parameter"}
        </h2>

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
            onChange={e => { setSelectedBase(e.target.value); setSpecial("") }}
          >
            {baseTypes.map(t => <option key={t}>{t}</option>)}
          </select>

          <label className="flex items-center gap-2 text-sm">
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
            onChange={e => { setSpecial(e.target.value); setIsArray(false) }}
          >
            <option value="">No Special Type</option>
            {specialTypes.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        <button
          onClick={handleAddOrUpdate}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {editingId ? "Update Parameter" : "Add Parameter"}
        </button>
      </div>

      {/* Parameter List */}
      {params.length > 0 && (
        <div className="border rounded-xl p-4 bg-gray-50 max-h-48 overflow-y-auto space-y-2">
          {params.map(p => (
            <div key={p.id} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
              <span className="font-mono text-sm">{p.name} : {p.type}</span>
              <div className="space-x-3 text-sm">
                <button onClick={() => handleEdit(p)} className="text-blue-600 hover:underline">Edit</button>
                <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:underline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Output Type */}
      <div>
        <h2 className="font-medium mb-2 text-gray-700">Output Type</h2>
        <select
          className="border rounded-lg p-2 w-full"
          value={outputType}
          onChange={e => setOutputType(e.target.value)}
        >
          {['void',...baseTypes, ...specialTypes, "int[]", "int[][]", "string[]", "string[][]","char[]","char[][]"].map(t => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

      <button
        onClick={handleSubmit}
        className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition"
      >
        {!problemId ? "Generate Boilerplate" : "Edit Boilerplate"}
      </button>
    </div>
  )
}
