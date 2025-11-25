// Transact.tsx
// Simple payment component: send 1 ALGO or 1 USDC from connected wallet → receiver address.
// Uses Algokit + wallet connector. Designed for TestNet demos.

import { algo, AlgorandClient } from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useState, useEffect } from 'react'
import { AiOutlineLoading3Quarters, AiOutlineSend } from 'react-icons/ai'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

interface TransactInterface {
  openModal: boolean
  setModalState: (value: boolean) => void
}

const Transact = ({ openModal, setModalState }: TransactInterface) => {
  const LORA = 'https://lora.algokit.io/testnet';

  // UI state
  const [loading, setLoading] = useState<boolean>(false)
  const [receiverAddress, setReceiverAddress] = useState<string>('')
  const [assetType, setAssetType] = useState<'ALGO' | 'USDC'>('ALGO') // toggle between ALGO and USDC

  // Atomic transfer UI state
  const [groupLoading, setGroupLoading] = useState<boolean>(false)
  const [groupReceiverAddress, setGroupReceiverAddress] = useState<string>('')

  // Opt-in UI state
  const [optInLoading, setOptInLoading] = useState<boolean>(false)
  const [alreadyOpted, setAlreadyOpted] = useState<boolean>(false)

  // Algorand client setup (TestNet by default from env)
  const algodConfig = getAlgodConfigFromViteEnvironment()
  const algorand = AlgorandClient.fromConfig({ algodConfig })

  // Wallet + notifications
  const { enqueueSnackbar } = useSnackbar()
  const { transactionSigner, activeAddress } = useWallet()

  // UI-only success message (does not change transaction logic)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // USDC constants (TestNet ASA)
  const usdcAssetId = 10458941n
  const usdcDecimals = 6

  // --- Pre-check: is wallet already opted in to USDC? (runs when modal opens or wallet changes)
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
          if (rawId === undefined || rawId === null) return false
          try {
            return BigInt(rawId) === usdcAssetId
          } catch {
            return false
          }
        })
        setAlreadyOpted(opted)
      } catch (e) {
        console.error('Opt-in precheck failed:', e)
      }
    }
    checkOptIn()
  }, [openModal, activeAddress])

  // ------------------------------
  // Handle sending single payment
  // ------------------------------
  const handleSubmit = async () => {
    setLoading(true)

    // Guard: wallet must be connected
    if (!transactionSigner || !activeAddress) {
      enqueueSnackbar('Please connect wallet first', { variant: 'warning' })
      setLoading(false)
      return
    }

    try {
      enqueueSnackbar(`Sending ${assetType} transaction...`, { variant: 'info' })

      let txResult;
      let msg;

      if (assetType === 'ALGO') {
        txResult = await algorand.send.payment({
          signer: transactionSigner,
          sender: activeAddress,
          receiver: receiverAddress,
          amount: algo(1),
        });
        msg = '✅ 1 ALGO sent!';
      } else {
        const usdcAmount = 1n * 10n ** BigInt(usdcDecimals);
        txResult = await algorand.send.assetTransfer({
          signer: transactionSigner,
          sender: activeAddress,
          receiver: receiverAddress,
          assetId: usdcAssetId,
          amount: usdcAmount,
        });
        msg = '✅ 1 USDC sent!';
      }

      const txId = txResult?.txIds?.[0];

      enqueueSnackbar(`${msg} TxID: ${txId}`, {
        variant: 'success',
        action: () =>
          txId ? (
            <a
              href={`${LORA}/transaction/${txId}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'underline', marginLeft: 8 }}
            >
              View on Lora ↗
            </a>
          ) : null,
      });

      // small UI success message (clears after a short delay)
      setSuccessMessage(`${msg} TxID: ${txId}`)
      setTimeout(() => setSuccessMessage(null), 7000)

      // Reset form
      setReceiverAddress('')
    } catch (e) {
      console.error(e)
      enqueueSnackbar(`Failed to send ${assetType}`, { variant: 'error' })
    }

    setLoading(false)
  }

  // ------------------------------
  // USDC Opt-in for CONNECTED wallet (fixed: safe BigInt handling)
  // ------------------------------
  const handleOptInUSDC = async () => {
    setOptInLoading(true)

    if (!transactionSigner || !activeAddress) {
      enqueueSnackbar('Please connect wallet first', { variant: 'warning' })
      setOptInLoading(false)
      return
    }

    try {
      // Check if already opted in (defensive against missing/varied shapes)
      const acctInfo: any = await algorand.client.algod.accountInformation(activeAddress).do()
      const assets: any[] = Array.isArray(acctInfo?.assets) ? acctInfo.assets : []

      const alreadyOptedNow = assets.some((a: any) => {
        // normalize possible keys: 'asset-id' (algod), 'assetId', or nested
        const rawId = a?.['asset-id'] ?? a?.assetId ?? a?.asset?.id
        if (rawId === undefined || rawId === null) return false
        try {
          return BigInt(rawId) === usdcAssetId
        } catch {
          return false
        }
      })

      setAlreadyOpted(alreadyOptedNow)

      if (alreadyOptedNow) {
        enqueueSnackbar('Your wallet is already opted in to USDC.', { variant: 'info' })
        setOptInLoading(false)
        return
      }

      // Opt in to USDC ASA
      const res = await algorand.send.assetOptIn({
        signer: transactionSigner,
        sender: activeAddress,
        assetId: usdcAssetId,
      })

      const txId = res?.txIds?.[0]
      enqueueSnackbar(`✅ Opt-in complete for USDC. TxID: ${txId}`, {
        variant: 'success',
        action: () =>
          txId ? (
            <a
              href={`${LORA}/transaction/${txId}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'underline', marginLeft: 8 }}
            >
              View on Lora ↗
            </a>
          ) : null,
      })

      // reflect that we're now opted in
      setAlreadyOpted(true)
    } catch (e) {
      console.error(e)
      enqueueSnackbar('USDC opt-in failed (maybe already opted in).', { variant: 'error' })
    }

    setOptInLoading(false)
  }

  // ------------------------------
  // Handle Atomic Group (2-in-1)
  // Sends: 1 ALGO + 1 USDC to the same receiver in one atomic group.
  // Note: Receiver must be opted-in to USDC (10458941).
  // ------------------------------
  const handleAtomicGroup = async () => {
    setGroupLoading(true)

    if (!transactionSigner || !activeAddress) {
      enqueueSnackbar('Please connect wallet first', { variant: 'warning' })
      setGroupLoading(false)
      return
    }
    if (groupReceiverAddress.length !== 58) {
      enqueueSnackbar('Enter a valid Algorand address (58 chars).', { variant: 'warning' })
      setGroupLoading(false)
      return
    }

    try {
      enqueueSnackbar('Sending atomic transfer: 1 ALGO + 1 USDC...', { variant: 'info' })

      const group = algorand.newGroup()

      // Tx 1: 1 ALGO payment
      group.addPayment({
        signer: transactionSigner,
        sender: activeAddress,
        receiver: groupReceiverAddress,
        amount: algo(1),
      })

      // Tx 2: 1 USDC ASA transfer (receiver must be opted-in)
      const oneUSDC = 1n * 10n ** BigInt(usdcDecimals)
      group.addAssetTransfer({
        signer: transactionSigner,
        sender: activeAddress,
        receiver: groupReceiverAddress,
        assetId: usdcAssetId,
        amount: oneUSDC,
      })

      const result = await group.send()
      const firstTx = result?.txIds?.[0]

      enqueueSnackbar(`✅ Atomic transfer complete! (1 ALGO + 1 USDC)`, {
        variant: 'success',
        action: () =>
          firstTx ? (
            <a
              href={`${LORA}/transaction/${firstTx}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'underline', marginLeft: 8 }}
            >
              View one tx on Lora ↗
            </a>
          ) : null,
      })

      setSuccessMessage('Atomic transfer complete! (1 ALGO + 1 USDC)')
      setTimeout(() => setSuccessMessage(null), 7000)

      setGroupReceiverAddress('')
    } catch (e) {
      console.error(e)
      enqueueSnackbar('Atomic transfer failed. Make sure the receiver is opted into USDC (10458941).', {
        variant: 'error',
      })
    }

    setGroupLoading(false)
  }

  // ------------------------------
  // Modal UI — Professional, solid theme + subtle loading animations
  // ------------------------------
  return (
    <dialog id="transact_modal" className={`${openModal ? 'modal-open' : ''}`}>
      <div className={`mx-auto max-w-2xl rounded-2xl overflow-hidden shadow-2xl ${loading || groupLoading || optInLoading ? 'ring-1 ring-indigo-100' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-indigo-700 to-violet-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/10 text-white"><AiOutlineSend /></div>
            <div>
              <div className="text-white text-lg font-semibold">Send Payment</div>
              <div className="text-indigo-200 text-sm">Quickly send 1 ALGO or 1 USDC from your connected wallet</div>
            </div>
          </div>
          <div>
            <button onClick={() => setModalState(false)} className="text-white/80 hover:text-white">Close</button>
          </div>
        </div>

        <div className="bg-white p-6">
          {/* Success message area (UI-only) */}
          {successMessage && (
            <div className="rounded-md bg-emerald-50 border border-emerald-100 p-3 mb-4">
              <div className="text-emerald-700 text-sm">{successMessage}</div>
            </div>
          )}

          {/* Main form */}
          <div className="grid grid-cols-1 gap-4">
            <label className="text-sm font-medium text-slate-700">Recipient Address</label>
            <input
              data-test-id="receiver-address"
              value={receiverAddress}
              onChange={(e) => setReceiverAddress(e.target.value)}
              placeholder="Algorand address (58 chars)"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700">Asset</label>
                <div className="mt-1 flex items-center gap-2">
                  <button
                    onClick={() => setAssetType('ALGO')}
                    className={`w-full rounded-lg px-3 py-2 text-sm font-medium ${assetType === 'ALGO' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-slate-700'}`}
                  >
                    ALGO
                  </button>
                  <button
                    onClick={() => setAssetType('USDC')}
                    className={`w-full rounded-lg px-3 py-2 text-sm font-medium ${assetType === 'USDC' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-slate-700'}`}
                  >
                    USDC
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Amount</label>
                <input readOnly value={`1 ${assetType}`} className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-3 text-slate-900 bg-gray-50" />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500">
              <div>Receiver length: <span className={`font-mono ${receiverAddress.length === 58 ? 'text-emerald-600' : 'text-rose-500'}`}>{receiverAddress.length}/58</span></div>
              <div>Fixed amount: 1 {assetType}</div>
            </div>

            <div className="mt-3">
              <button
                onClick={handleSubmit}
                disabled={loading || receiverAddress.length !== 58}
                className={`w-full rounded-lg px-4 py-3 font-semibold ${receiverAddress.length === 58 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500 cursor-not-allowed'}`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2"><AiOutlineLoading3Quarters className="animate-spin"/> Sending…</span>
                ) : (
                  `Send 1 ${assetType}`
                )}
              </button>
            </div>
          </div>

          {/* Advanced section */}
          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold">Advanced</div>
              <div className="text-xs text-slate-400">optional</div>
            </div>
            <p className="text-xs text-slate-500 mb-3">Atomic group: send 1 ALGO + 1 USDC together. Receiver must be opted-in to USDC (ID: 10458941).</p>

            <div className="flex gap-3 mb-3">
              <button
                onClick={handleOptInUSDC}
                disabled={optInLoading || !activeAddress || alreadyOpted}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${alreadyOpted ? 'bg-gray-200 text-slate-500 cursor-not-allowed' : 'bg-emerald-500 text-white'}`}
              >
                {optInLoading ? (<span className="flex items-center gap-2"><AiOutlineLoading3Quarters className="animate-spin"/> Opting in…</span>) : alreadyOpted ? 'Already Opted In' : 'Opt in USDC (my wallet)'}
              </button>
            </div>

            <label className="text-sm font-medium text-slate-700">Atomic Receiver Address</label>
            <input value={groupReceiverAddress} onChange={(e) => setGroupReceiverAddress(e.target.value)} placeholder="Algorand address (58 chars)" className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-3" />
            <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
              <div>Bundle: 1 ALGO + 1 USDC</div>
              <div className={`font-mono ${groupReceiverAddress.length === 58 ? 'text-emerald-600' : 'text-rose-500'}`}>{groupReceiverAddress.length}/58</div>
            </div>

            <div className="mt-3">
              <button onClick={handleAtomicGroup} disabled={groupLoading || groupReceiverAddress.length !== 58} className={`w-full rounded-lg px-4 py-3 font-semibold ${groupReceiverAddress.length === 58 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500 cursor-not-allowed'}`}>
                {groupLoading ? (<span className="flex items-center gap-2"><AiOutlineLoading3Quarters className="animate-spin"/> Sending Atomic…</span>) : 'Send Atomic: 1 ALGO + 1 USDC'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  )
}

export default Transact
