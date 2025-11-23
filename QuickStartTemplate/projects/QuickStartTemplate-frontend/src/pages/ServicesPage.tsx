import React from 'react'

type Props = {
  onNavigate: (view: 'register' | 'transfer' | 'help' | 'settings') => void
}

const ServicesPage: React.FC<Props> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-xl bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-bold mb-6">Services</h1>
        <div className="grid grid-cols-1 gap-4">
          <button onClick={() => onNavigate('register')} className="w-full text-left p-4 border rounded hover:bg-gray-100">Register vehicle</button>
          <button onClick={() => onNavigate('transfer')} className="w-full text-left p-4 border rounded hover:bg-gray-100">Transfer Title</button>
          <button onClick={() => onNavigate('help')} className="w-full text-left p-4 border rounded hover:bg-gray-100">Help</button>
          <button onClick={() => onNavigate('settings')} className="w-full text-left p-4 border rounded hover:bg-gray-100">Settings</button>
        </div>
      </div>
    </div>
  )
}

export default ServicesPage
