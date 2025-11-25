// Home.tsx - Dark UI (Black & Grey Background, White Headings)

import { useWallet } from '@txnlab/use-wallet-react'
import React, { useState } from 'react'
import { AiOutlineDeploymentUnit, AiOutlineSend, AiOutlineStar, AiOutlineWallet } from 'react-icons/ai'
import { BsArrowUpRightCircle, BsWallet2 } from 'react-icons/bs'

// Frontend modals
import AppCalls from './components/AppCalls'
import ConnectWallet from './components/ConnectWallet'
import NFTmint from './components/NFTmint'
import Tokenmint from './components/Tokenmint'
import Transact from './components/Transact'

interface HomeProps {
  onNavigate?: (view: 'services' | 'register' | 'transfer' | 'help' | 'settings') => void
}

// Updated card styling for dark theme
const cardBase = 'rounded-xl shadow-md hover:shadow-lg transition border border-gray-700 bg-gray-900'
const iconStyle = 'text-3xl text-gray-200'

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)
  const [openPaymentModal, setOpenPaymentModal] = useState<boolean>(false)
  const [openMintModal, setOpenMintModal] = useState<boolean>(false)
  const [openTokenModal, setOpenTokenModal] = useState<boolean>(false)
  const [openAppCallsModal, setOpenAppCallsModal] = useState<boolean>(false)

  const { activeAddress } = useWallet()

  return (
    <div className="min-h-screen flex flex-col bg-black text-gray-200 antialiased">

      {/* Navbar */}
      <nav className="w-full flex items-center justify-between px-6 py-4 bg-gray-900 sticky top-0 z-30 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-gray-700 to-gray-500 text-white font-bold">A</div>
          <div className="text-lg font-semibold tracking-tight text-white">Algorand dApp Template</div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setOpenWalletModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-shadow shadow-sm bg-gray-800 hover:bg-gray-700"
          >
            <BsWallet2 className="text-white" />
            <span className="text-white">{activeAddress ? 'Wallet Linked' : 'Connect Wallet'}</span>
          </button>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative overflow-hidden bg-gradient-to-b from-black via-gray-900 to-black">
        <div className="max-w-7xl mx-auto px-6 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">

              <p className="inline-flex items-center gap-2 text-sm font-medium text-gray-300 bg-gray-800 rounded-full px-3 py-1 mb-4">
                <AiOutlineWallet className="text-white" />
                Algorand Universal Actions
              </p>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-white mb-4">
                Build secure Web3 experiences on Algorand — fast.
              </h1>

              <p className="text-gray-400 max-w-2xl text-lg mb-6">
                A unified interface to experiment with payments, NFT minting, token creation, and smart contract interactions. Optimized for developers and product teams.
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => (activeAddress ? setOpenPaymentModal(true) : setOpenWalletModal(true))}
                  className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-5 py-3 rounded-lg font-semibold shadow-md"
                >
                  Get Started
                </button>

                <button
                  onClick={() => (onNavigate ? onNavigate('help') : null)}
                  className="inline-flex items-center gap-2 bg-transparent text-white px-4 py-3 rounded-lg font-medium border border-gray-600"
                >
                  Learn More
                </button>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-2xl bg-gray-900 border border-gray-700 p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm text-gray-400">Account</div>
                    <div className="text-base font-medium text-white">{activeAddress ? activeAddress : 'Not connected'}</div>
                  </div>
                  <button onClick={() => setOpenWalletModal(true)} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm">
                    {activeAddress ? 'Manage' : 'Connect'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-gray-800">
                    <div className="text-sm text-gray-400">Balance</div>
                    <div className="font-medium text-white mt-1">— ALGO</div>
                  </div>

                  <div className="p-3 rounded-lg bg-gray-800">
                    <div className="text-sm text-gray-400">Network</div>
                    <div className="font-medium text-white mt-1"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-semibold text-white mb-4">Available Actions</h2>
      </main>

      <footer className="mt-12 py-8 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Algorand Universal dApp Template
      </footer>

      {/* Modals */}
      <ConnectWallet openModal={openWalletModal} closeModal={() => setOpenWalletModal(false)} />
      <Transact openModal={openPaymentModal} setModalState={setOpenPaymentModal} />
      <NFTmint openModal={openMintModal} setModalState={setOpenMintModal} />
      <Tokenmint openModal={openTokenModal} setModalState={setOpenTokenModal} />
      <AppCalls openModal={openAppCallsModal} setModalState={setOpenAppCallsModal} />
    </div>
  )
}

export default Home