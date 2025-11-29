// Tokenmint.tsx — Redesigned UI with TailwindCSS
// *** All ASA minting logic remains unchanged ***

import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useMemo, useState } from 'react'
import { AiOutlineLoading3Quarters, AiOutlineInfoCircle } from 'react-icons/ai'
import { BsCoin } from 'react-icons/bs'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

interface TokenMintProps {
  openModal: boolean
  setModalState: (value: boolean) => void
}

const Tokenmint = ({ openModal, setModalState }: TokenMintProps) => {
  const LORA = 'https://lora.algokit.io/testnet'

  // State (unchanged)
  const [assetName, setAssetName] = useState<string>('MasterPass Token')
  const [unitName, setUnitName] = useState<string>('MPT')
  const [total, setTotal] = useState<string>('1000')
  const [decimals, setDecimals] = useState<string>('0')
  const [loading, setLoading] = useState<boolean>(false)

  const { transactionSigner, activeAddress } = useWallet()
  const { enqueueSnackbar } = useSnackbar()

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const algorand = useMemo(() => AlgorandClient.fromConfig({ algodConfig }), [algodConfig])

  // --- MINT LOGIC (unchanged) ---
  const handleMintToken = async () => {
    if (!transactionSigner || !activeAddress) {
      enqueueSnackbar('Please connect your wallet first.', { variant: 'warning' })
      return
    }

    if (!assetName || !unitName) {
      enqueueSnackbar('Please enter an asset name and unit name.', { variant: 'warning' })
      return
    }
    if (!/^\d+$/.test(total)) {
      enqueueSnackbar('Total supply must be a whole number.', { variant: 'warning' })
      return
    }
    if (!/^\d+$/.test(decimals)) {
      enqueueSnackbar('Decimals must be a whole number.', { variant: 'warning' })
      return
    }

    try {
      setLoading(true)
      enqueueSnackbar('Creating token...', { variant: 'info' })

      const totalBig = BigInt(total)
      const decimalsBig = BigInt(decimals)
      const onChainTotal = totalBig * 10n ** decimalsBig

      const createResult = await algorand.send.assetCreate({
        sender: activeAddress,
        signer: transactionSigner,
        total: onChainTotal,
        decimals: Number(decimalsBig),
        assetName,
        unitName,
        defaultFrozen: false,
      })

      const id = createResult

      enqueueSnackbar(`✅ Success! Asset ID: ${id.assetId}`, {
        variant: 'success',
        action: () =>
          id ? (
            <a
              href={`${LORA}/asset/${id.assetId}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'underline', marginLeft: 8 }}
            >
              View on Lora ↗
            </a>
          ) : null,
      })

      setAssetName('MasterPass Token')
      setUnitName('MPT')
      setTotal('1000')
      setDecimals('0')
    } catch (error) {
      console.error(error)
      enqueueSnackbar('Failed to create token', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // --- NEW UI LAYOUT + STYLING ---
  return (
    <dialog className={`modal ${openModal ? 'modal-open' : ''}`}>
      <div className="modal-box max-w-xl p-8 bg-white rounded-2xl shadow-xl border border-gray-100">

        {/* Loading indicator */}
        {loading && (
          <div className="relative h-1 w-full -mt-2 mb-5 overflow-hidden rounded bg-gray-100">
            <div className="absolute inset-y-0 left-0 w-1/3 animate-[loading_1.2s_ease-in-out_infinite] bg-indigo-600" />
            <style>{`
              @keyframes loading {
                0% { transform: translateX(-120%); }
                50% { transform: translateX(60%); }
                100% { transform: translateX(220%); }
              }
            `}</style>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center">
              <BsCoin className="text-indigo-600 text-2xl" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Mint a New Token</h2>
              <p className="text-sm text-slate-500">Create an Algorand Standard Asset</p>
            </div>
          </div>
          <button
            onClick={() => setModalState(false)}
            className="text-slate-500 hover:text-slate-700 text-sm"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Token Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Token Name
            </label>
            <input
              type="text"
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50
                         focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 
                         transition-all"
              placeholder="e.g., MasterPass Token"
            />
          </div>

          {/* Symbol */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Symbol
            </label>
            <input
              type="text"
              value={unitName}
              onChange={(e) => setUnitName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50
                         focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 
                         transition-all"
              placeholder="e.g., MPT"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Total Supply */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Total Supply
              </label>
              <input
                type="number"
                min={1}
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50
                           focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 
                           transition-all"
                placeholder="e.g., 1000"
              />
            </div>

            {/* Decimals */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Decimals
              </label>
              <input
                type="number"
                min={0}
                max={19}
                value={decimals}
                onChange={(e) => setDecimals(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50
                           focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 
                           transition-all"
                placeholder="0 = whole tokens"
              />
              <p className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                <AiOutlineInfoCircle /> on-chain supply = total × 10^decimals
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:justify-end">

          <button
            onClick={() => setModalState(false)}
            className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-300 bg-white
                       hover:bg-slate-100 text-slate-700 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleMintToken}
            disabled={loading || !assetName || !unitName || !total}
            className={`w-full sm:w-auto px-5 py-3 rounded-xl font-semibold
                       transition flex items-center justify-center gap-2
                       ${loading
                         ? 'bg-indigo-500 text-white'
                         : 'bg-indigo-600 hover:bg-indigo-700 text-white'}
                       ${(!assetName || !unitName || !total) && 'opacity-40 cursor-not-allowed'}
            `}
          >
            {loading ? (
              <>
                <AiOutlineLoading3Quarters className="animate-spin" />
                Creating…
              </>
            ) : (
              'Mint Token'
            )}
          </button>

        </div>
      </div>
    </dialog>
  )
}

export default Tokenmint
