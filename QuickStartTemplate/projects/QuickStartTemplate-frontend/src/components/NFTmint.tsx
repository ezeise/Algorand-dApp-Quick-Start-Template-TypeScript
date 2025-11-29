// NFTmint.tsx
// Upload an image → send it to backend (Pinata/IPFS) → mint Algorand NFT (ASA)
// Works in Vercel (via VITE_API_URL) and GitHub Codespaces (auto-detects -3001 host).

import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet-react'
import { sha512_256 } from 'js-sha512'
import { useSnackbar } from 'notistack'
import React, { useRef, useState } from 'react'
import { AiOutlineCloudUpload, AiOutlineLoading3Quarters } from 'react-icons/ai'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

interface NFTMintProps {
  openModal: boolean
  setModalState: (value: boolean) => void
}

function resolveBackendBase(): string {
  const env = import.meta.env.VITE_API_URL?.trim()
  if (env) return env.replace(/\/$/, '')
  const host = window.location.host
  if (host.endsWith('.app.github.dev')) {
    const base = host.replace(/-\d+\.app\.github\.dev$/, '-3001.app.github.dev')
    return `https://${base}`
  }
  return 'http://localhost:3001'
}

const NFTmint = ({ openModal, setModalState }: NFTMintProps) => {
  const LORA = 'https://lora.algokit.io/testnet'

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('') 
  const [loading, setLoading] = useState<boolean>(false)
  const [nftName, setNftName] = useState('')
  const [nftDescription, setNftDescription] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { transactionSigner, activeAddress } = useWallet()
  const { enqueueSnackbar } = useSnackbar()

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const algorand = AlgorandClient.fromConfig({ algodConfig })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setSelectedFile(file)
    setPreviewUrl(file ? URL.createObjectURL(file) : '')
  }

  const handleDivClick = () => fileInputRef.current?.click()

  const handleMintNFT = async () => {
    setLoading(true)

    if (!transactionSigner || !activeAddress) {
      enqueueSnackbar('Please connect wallet first', { variant: 'warning' })
      setLoading(false)
      return
    }

    if (!selectedFile) {
      enqueueSnackbar('Please select an image file to mint.', { variant: 'warning' })
      setLoading(false)
      return
    }

    enqueueSnackbar('Uploading and preparing NFT...', { variant: 'info' })
    let metadataUrl = ''

    try {
      const backendBase = resolveBackendBase()
      const backendApiUrl = `${backendBase.replace(/\/$/, '')}/api/pin-image`

      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch(backendApiUrl, {
        method: 'POST',
        body: formData,
        mode: 'cors',
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Backend request failed: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      metadataUrl = data.metadataUrl
      if (!metadataUrl) throw new Error('Backend did not return a valid metadata URL')
    } catch (e: any) {
      enqueueSnackbar('Error uploading to backend. If in Codespaces, make port 3001 Public.', { variant: 'error' })
      setLoading(false)
      return
    }

    try {
      enqueueSnackbar('Minting NFT on Algorand...', { variant: 'info' })

      const metadataHash = new Uint8Array(Buffer.from(sha512_256.digest(metadataUrl)))

      const createNFTResult = await algorand.send.assetCreate({
        sender: activeAddress,
        signer: transactionSigner,
        total: 1n,
        decimals: 0,
        assetName: nftName || 'MasterPass Ticket',
        unitName: 'MTK',
        url: metadataUrl,
        metadataHash,
        defaultFrozen: false,
      })

      const id = createNFTResult

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

      setSelectedFile(null)
      setPreviewUrl('')
      setNftName('')
      setNftDescription('')
      setTimeout(() => setModalState(false), 2000)
    } catch (e: any) {
      enqueueSnackbar(`Failed to mint NFT: ${e.message || 'Unknown error'}`, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <dialog
      id="nft_modal"
      className={`modal modal-bottom sm:modal-middle backdrop-blur-sm ${openModal ? 'modal-open' : ''}`}
    >
      <div className="modal-box max-w-xl bg-white text-gray-900 rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8">

        <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
          <span className="h-12 w-12 flex items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
            <AiOutlineCloudUpload className="text-xl" />
          </span>
          Mint a New NFT
        </h3>

        <div className="space-y-5">

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
            <div
              onClick={handleDivClick}
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:border-indigo-300 transition"
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="rounded-lg max-h-52 object-contain shadow-sm bg-white"
                />
              ) : (
                <div className="text-center">
                  <AiOutlineCloudUpload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">Click to upload</p>
                  <p className="text-xs text-gray-400">PNG, JPG, GIF up to 10MB</p>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                className="sr-only"
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/gif"
              />
            </div>
          </div>

          {/* NFT Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">NFT Name</label>
            <input
              type="text"
              value={nftName}
              onChange={(e) => setNftName(e.target.value)}
              placeholder="e.g., MasterPass Ticket"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
            />
          </div>

          {/* NFT Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={nftDescription}
              onChange={(e) => setNftDescription(e.target.value)}
              placeholder="Describe your collectible..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
            />
          </div>

        </div>

        {/* Buttons */}
        <div className="modal-action mt-8 flex flex-col sm:flex-row-reverse gap-3">
          <button
            type="button"
            onClick={handleMintNFT}
            disabled={loading || !selectedFile}
            className={`w-full sm:w-auto px-5 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition ${
              selectedFile && !loading ? '' : 'opacity-60 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <AiOutlineLoading3Quarters className="animate-spin" />
                Minting...
              </span>
            ) : (
              'Mint NFT'
            )}
          </button>

          <button
            type="button"
            onClick={() => setModalState(false)}
            disabled={loading}
            className="w-full sm:w-auto px-5 py-3 rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </dialog>
  )
}

export default NFTmint
