// Tokenmint.tsx
// Redesigned professional UI – TailwindCSS only
// ✅ All minting + wallet logic preserved exactly as provided

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

  const [assetName, setAssetName] = useState<string>('MasterPass Token')
  const [unitName, setUnitName] = useState<string>('MPT')
  const [total, setTotal] = useState<string>('1000')
  const [decimals, setDecimals] = useState<string>('0')

  const [loading, setLoading] = useState<boolean>(false)

  const { transactionSigner, activeAddress } = useWallet()
  const { enqueueSnackbar } = useSnackbar()

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const algorand = useMemo(() => AlgorandClient.fromConfig({ algodConfig }), [algodConfig])

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

  return (
    <dialog className={`modal ${openModal ? 'modal-open' : ''}`}>
      <div className="modal-box max-w-xl rounded-2xl bg-white shadow-xl border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-100 text-indigo-600">
              <BsCoin className="text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-800">Create Loyalty Token</h2>
              <p className="text-sm text-slate-500">Mint a new Algorand Standard Asset (ASA)</p>
            </div>
          </div>
          <button onClick={() => setModalState(false)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <div className="grid gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Token Name</label>
            <input
              type="text"
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="MasterPass Token"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Symbol</label>
            <input
              type="text"
              value={unitName}
              onChange={(e) => setUnitName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="MPT"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Total Supply</label>
              <input
                type="number"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Decimals</label>
              <input
                type="number"
                value={decimals}
                onChange={(e) => setDecimals(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                <AiOutlineInfoCircle /> total × 10^decimals
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={() => setModalState(false)}
            className="px-4 py-2 rounded-xl border text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleMintToken}
            disabled={loading}
            className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <AiOutlineLoading3Quarters className="animate-spin" /> Minting...
              </span>
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