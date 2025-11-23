import { SupportedWallet, WalletId, WalletManager, WalletProvider } from '@txnlab/use-wallet-react'
import { Analytics } from '@vercel/analytics/react'
import { SnackbarProvider } from 'notistack'
import Home from './Home'
import { getAlgodConfigFromViteEnvironment, getKmdConfigFromViteEnvironment } from './utils/network/getAlgoClientConfigs'

import React, { useState } from 'react'
// ServicesPage replaced by rendering `Home` directly so users see service links on the homepage
import HelpPage from './pages/HelpPage'
import RegisterVehicle from './pages/RegisterVehicle'
import Settings from './pages/Settings'
import TransferTitle from './pages/TransferTitle'

// ...existing code...

let supportedWallets: SupportedWallet[]
if (import.meta.env.VITE_ALGOD_NETWORK === 'localnet') {
  const kmdConfig = getKmdConfigFromViteEnvironment()
  supportedWallets = [
    {
      id: WalletId.KMD,
      options: {
        baseServer: kmdConfig.server,
        token: String(kmdConfig.token),
        port: String(kmdConfig.port),
      },
    },
    { id: WalletId.LUTE },
  ]
} else {
  supportedWallets = [
    { id: WalletId.DEFLY },
    { id: WalletId.PERA },
    { id: WalletId.EXODUS },
    { id: WalletId.LUTE },
    // If you are interested in WalletConnect v2 provider
    // refer to https://github.com/TxnLab/use-wallet for detailed integration instructions
  ]
}

export default function App() {
  const algodConfig = getAlgodConfigFromViteEnvironment()

  const [stage, setStage] = useState<'auth' | 'congrats' | 'app'>('auth')
  const [authPage, setAuthPage] = useState<'signin' | 'signup'>('signin')
  const [formUserId, setFormUserId] = useState('')
  const [formPassphrase, setFormPassphrase] = useState('')
  const [formConfirmPassphrase, setFormConfirmPassphrase] = useState('')

  // app view state inside authenticated 'app' stage (declare hooks unconditionally)
  const [appView, setAppView] = useState<'services' | 'register' | 'transfer' | 'help' | 'settings'>('services')

  // Authenticated user info to show on congrats page
  const [authUser, setAuthUser] = useState<string | null>(null)
  const [authInternalId, setAuthInternalId] = useState<string | null>(null)

  const walletManager = new WalletManager({
    wallets: supportedWallets,
    defaultNetwork: algodConfig.network,
    networks: {
      [algodConfig.network]: {
        algod: {
          baseServer: algodConfig.server,
          port: algodConfig.port,
          token: String(algodConfig.token),
        },
      },
    },
    options: {
      resetNetwork: true,
    },
  })

  // Render sign-in / sign-up before showing the wallet UI
  if (stage === 'auth') {
    const handleSignIn = (e: React.FormEvent) => {
      e.preventDefault()
      // basic validation placeholder
      if (!formUserId || !formPassphrase) return
      // set authenticated user info and move to congratulations screen
      setAuthUser(formUserId)
      setAuthInternalId(Date.now().toString(36))
      setStage('congrats')
    }

    const handleSignUp = (e: React.FormEvent) => {
      e.preventDefault()
      // basic validation placeholder
      if (!formUserId || !formPassphrase || !formConfirmPassphrase) return
      if (formPassphrase !== formConfirmPassphrase) return
      // set authenticated user info and move to congratulations screen
      setAuthUser(formUserId)
      setAuthInternalId(Date.now().toString(36))
      setStage('congrats')
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center">
            {authPage === 'signin' ? 'Sign In' : 'Sign Up'}
          </h2>
          {authPage === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">User ID</label>
                <input type="text" value={formUserId} onChange={e => setFormUserId(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Enter your User ID" />
              </div>
              <div>
                <label className="block mb-1 font-medium">Passphrase</label>
                <input type="password" value={formPassphrase} onChange={e => setFormPassphrase(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Enter your passphrase" />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700">Sign In</button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">User ID</label>
                <input type="text" value={formUserId} onChange={e => setFormUserId(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Enter your User ID" />
              </div>
              <div>
                <label className="block mb-1 font-medium">Passphrase</label>
                <input type="password" value={formPassphrase} onChange={e => setFormPassphrase(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Enter your passphrase" />
              </div>
              <div>
                <label className="block mb-1 font-medium">Confirm Passphrase</label>
                <input type="password" value={formConfirmPassphrase} onChange={e => setFormConfirmPassphrase(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Confirm your passphrase" />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700">Sign Up</button>
            </form>
          )}

          <div className="mt-4 text-center">
            {authPage === 'signin' ? (
              <button onClick={() => setAuthPage('signup')} className="text-blue-600 underline">Don't have an account? Sign Up</button>
            ) : (
              <button onClick={() => setAuthPage('signin')} className="text-blue-600 underline">Already have an account? Sign In</button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Congratulations page shown after successful sign in / sign up
  if (stage === 'congrats') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">Congratulations!</h2>
          {authUser && authInternalId ? (
            <div className="mb-4">
              <p className="font-medium">Welcome, <span className="text-indigo-700">{authUser}</span>!</p>
              <p className="text-sm text-gray-600">Your ID: <span className="font-mono text-sm">{authInternalId}</span></p>
            </div>
          ) : (
            <p className="mb-4">Your account is ready.</p>
          )}
          <p className="mb-6">Click the button below to continue to the app.</p>
          <button
            onClick={() => setStage('app')}
            className="w-full bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700"
          >
            Continue to Home
          </button>
        </div>
      </div>
    )
  }

  if (stage === 'app') {
    const goBackToServices = () => setAppView('services')

    return (
      <SnackbarProvider maxSnack={3}>
        <WalletProvider manager={walletManager}>
          <div className="min-h-screen">
            <header className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold">QuickStart Template</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setStage('auth')} className="text-sm text-red-600">Logout</button>
              </div>
            </header>

            <main>
              {appView === 'services' && <Home onNavigate={v => setAppView(v)} />}
              {appView === 'register' && <RegisterVehicle onBack={goBackToServices} />}
              {appView === 'transfer' && <TransferTitle onBack={goBackToServices} />}
              {appView === 'help' && <HelpPage onBack={goBackToServices} />}
              {appView === 'settings' && <Settings onBack={goBackToServices} />}
            </main>

            <Analytics />
          </div>
        </WalletProvider>
      </SnackbarProvider>
    )
  }

  // Fallback (shouldn't be reachable because `stage` is restricted)
  return null
}
