import React from 'react'

type Props = {
  onBack: () => void
}

const TransferTitle: React.FC<Props> = ({ onBack }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-xl bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Transfer Title</h1>
        <p className="mb-6">Placeholder page for Transfer Title service — build your flow here.</p>
        <div className="flex gap-2">
          <button onClick={onBack} className="bg-gray-200 px-4 py-2 rounded">Back</button>
        </div>
      </div>
    </div>
  )
}

export default TransferTitle
