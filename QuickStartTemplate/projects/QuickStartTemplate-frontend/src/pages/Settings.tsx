import React from 'react'
import ConnectWallet from '../components/ConnectWallet'

type Props = {
  onBack: () => void
}

const Settings: React.FC<Props> = ({ onBack }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-xl bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Settings</h1>
        <section className="mb-6">
          <h2 className="font-semibold mb-2">Wallet / Payment</h2>
          <p className="mb-4">Manage wallet connection and payment settings here.</p>
          {/* Use existing ConnectWallet component to let users manage wallet when inside WalletProvider */}
          <ConnectWallet />
        </section>

        <div className="flex gap-2">
          <button onClick={onBack} className="bg-gray-200 px-4 py-2 rounded">Back</button>
        </div>
      </div>
    </div>
  )
}

export default Settings
