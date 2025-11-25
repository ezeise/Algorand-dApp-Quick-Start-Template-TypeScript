// Transact.tsx
// UI redesigned with TailwindCSS for a clean, modern Web3 payment interface
// ✅ All transaction + wallet logic remains unchanged

import { algo, AlgorandClient } from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useEffect, useState } from 'react'
import { AiOutlineLoading3Quarters, AiOutlineSend } from 'react-icons/ai'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

interface TransactInterface {
  openModal: boolean
  setModalState: (value: boolean) => void
}

const Transact = ({ openModal, setModalState }: TransactInterface) => {
  const LORA = 'https://lora.algokit.io/testnet'

  const [loading, setLoading] = useState(false)
  const [receiverAddress, setReceiverAddress] = useState('')
  const [assetType, setAssetType] = useState<'ALGO' | 'USDC'>('ALGO')

  const [groupLoading, setGroupLoading] = useState(false)
  const [groupReceiverAddress, setGroupReceiverAddress] = useState('')

  const [optInLoading, setOptInLoading] = useState(false)
  const [alreadyOpted, setAlreadyOpted] = useState(false)

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const algorand = AlgorandClient.fromConfig({ algodConfig })

  const { enqueueSnackbar } = useSnackbar()
  const { transactionSigner, activeAddress } = useWallet()

  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const usdcAssetId = 10458941n
  const usdcDecimals = 6

  useEffect(() => {
    const checkOptIn = async () => {
      try {
        if (!openModal || !activeAddress) {
          setAlreadyOpted(false)
          return
        }
        const acctInfo: any = await algorand.client.algod.accountInformation(activeAddress).do()
        const assets: any[] = Array.isArray(acctInfo?.assets) ? acctInfo.assets : []
        const opted = assets.some((a: any) => {
          const rawId = a?.['asset-id'] ?? a?.assetId ?? a?.asset?.id
          if (!rawId) return false
          try { return BigInt(rawId) === usdcAssetId } catch { return false }
        })
        setAlreadyOpted(opted)
      } catch (e) {
        console.error(e)
      }
    }
    checkOptIn()
  }, [openModal, activeAddress])

  const handleSubmit = async () => {
    setLoading(true)

    if (!transactionSigner || !activeAddress) {
      enqueueSnackbar('Please connect wallet first', { variant: 'warning' })
      setLoading(false)
      return
    }

    try {
      enqueueSnackbar(`Sending ${assetType}...`, { variant: 'info' })

      let txResult
      let msg

      if (assetType === 'ALGO') {
        txResult = await algorand.send.payment({
          signer: transactionSigner,
          sender: activeAddress,
          receiver: receiverAddress,
          amount: algo(1),
        })
        msg = '✅ 1 ALGO sent!'
      } else {
        const usdcAmount = 1n * 10n ** BigInt(usdcDecimals)
        txResult = await algorand.send.assetTransfer({
          signer: transactionSigner,
          sender: activeAddress,
          receiver: receiverAddress,
          assetId: usdcAssetId,
          amount: usdcAmount,
        })
        msg = '✅ 1 USDC sent!'
      }

      const txId = txResult?.txIds?.[0]

      enqueueSnackbar(`${msg} TxID: ${txId}`, { variant: 'success' })
      setSuccessMessage(`${msg} TxID: ${txId}`)
      setTimeout(() => setSuccessMessage(null), 6000)
      setReceiverAddress('')
    } catch (e) {
      enqueueSnackbar('Transaction failed', { variant: 'error' })
    }

    setLoading(false)
  }

  return (
    <dialog className={`${openModal ? 'modal-open' : ''}`}>
      <div className="bg-gray-900 text-white rounded-2xl max-w-xl mx-auto shadow-2xl p-6 border border-gray-700">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-800">
              <AiOutlineSend className="text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Send Payment</h2>
              <p className="text-sm text-gray-400">Transfer ALGO or USDC instantly</p>
            </div>
          </div>
          <button
            onClick={() => setModalState(false)}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {successMessage && (
          <div className="mb-4 rounded-lg bg-emerald-900/40 border border-emerald-700 p-3 text-sm text-emerald-300">
            {successMessage}
          </div>
        )}

        {/* Main Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Recipient Wallet Address</label>
            <input
              value={receiverAddress}
              onChange={(e) => setReceiverAddress(e.target.value)}
              placeholder="58 character Algorand address"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Asset</label>
              <div className="flex gap-2">
                {['ALGO', 'USDC'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setAssetType(type as any)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium ${assetType === type ? 'bg-white text-black' : 'bg-gray-800 text-gray-300'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Amount</label>
              <input
                readOnly
                value={`1 ${assetType}`}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3"
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || receiverAddress.length !== 58}
            className={`w-full rounded-xl py-3 font-semibold transition ${receiverAddress.length === 58 ? 'bg-white text-black hover:opacity-90' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <AiOutlineLoading3Quarters className="animate-spin" /> Sending...
              </span>
            ) : (
              `Send 1 ${assetType}`
            )}
          </button>
        </div>

        {/* Subtle footer */}
        <div className="mt-6 text-xs text-gray-500 text-center">
          Powered by Algorand • Secure on TestNet
        </div>
      </div>
    </dialog>
  )
}

export default Transact