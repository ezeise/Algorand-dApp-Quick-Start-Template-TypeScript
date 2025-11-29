<dialog
  id="transact_modal"
  className={`modal modal-bottom sm:modal-middle ${openModal ? 'modal-open' : ''}`}
>
  <div className="
    modal-box max-w-lg rounded-2xl bg-white border border-gray-200 shadow-2xl
    p-6 sm:p-7 text-gray-900
  ">
    {/* Header */}
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-xl font-semibold flex items-center gap-2">
        <span className="h-9 w-9 flex items-center justify-center rounded-lg bg-indigo-100">
          <AiOutlineSend className="text-indigo-600 text-lg" />
        </span>
        Send Payment
      </h3>

      <button
        className="text-gray-400 hover:text-gray-600 text-sm"
        onClick={() => setModalState(false)}
      >
        Close
      </button>
    </div>

    {/* Success message */}
    {(loading || groupLoading || optInLoading) && (
      <div className="mb-4 p-3 rounded-lg bg-indigo-50 text-indigo-700 text-sm">
        Processing transaction…
      </div>
    )}

    {/* Recipient Address */}
    <div className="mb-5">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Recipient Address
      </label>
      <input
        type="text"
        className="
          w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5
          focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition
        "
        placeholder="Enter Algorand address"
        value={receiverAddress}
        onChange={(e) => setReceiverAddress(e.target.value)}
      />
      <p className="text-xs text-gray-500 mt-1">
        {receiverAddress.length}/58 characters
      </p>
    </div>

    {/* Amount (UI only — logic unchanged) */}
    <div className="mb-5">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Amount (fixed at 1 for now)
      </label>
      <input
        type="text"
        disabled
        className="
          w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5
          text-gray-500 cursor-not-allowed
        "
        value="1"
      />
      <p className="text-xs text-gray-400 mt-1">
        Amount is fixed at 1 ALGO or 1 USDC based on your selection.
      </p>
    </div>

    {/* Asset Type Toggle */}
    <div className="flex gap-3 mb-6">
      <button
        type="button"
        className={`
          flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition
          ${assetType === 'ALGO'
            ? 'bg-indigo-600 text-white border-indigo-600'
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}
        `}
        onClick={() => setAssetType('ALGO')}
      >
        ALGO
      </button>

      <button
        type="button"
        className={`
          flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition
          ${assetType === 'USDC'
            ? 'bg-indigo-600 text-white border-indigo-600'
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}
        `}
        onClick={() => setAssetType('USDC')}
      >
        USDC
      </button>
    </div>

    {/* Send Button */}
    <button
      data-test-id="send"
      type="button"
      disabled={loading || receiverAddress.length !== 58}
      onClick={handleSubmit}
      className={`
        w-full py-3 rounded-xl font-semibold text-sm transition
        ${receiverAddress.length === 58
          ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
          : 'bg-gray-200 text-gray-500 cursor-not-allowed'}
      `}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <AiOutlineLoading3Quarters className="animate-spin" />
          Sending…
        </span>
      ) : (
        `Send 1 ${assetType}`
      )}
    </button>

    {/* Divider */}
    <div className="my-8 border-t border-gray-200" />

    {/* Advanced Section */}
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
      <h4 className="text-sm font-semibold text-gray-800 mb-2">
        Advanced: Atomic Transfer & USDC Opt‑in
      </h4>
      <p className="text-xs text-gray-500 mb-4">
        Send 1 ALGO + 1 USDC in a single atomic group. Receiver must be opted‑in to USDC.
      </p>

      {/* Opt-in Button */}
      <button
        type="button"
        onClick={handleOptInUSDC}
        disabled={optInLoading || alreadyOpted}
        className={`
          w-full py-2.5 rounded-xl text-sm font-medium mb-4 transition
          ${alreadyOpted
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
            : 'bg-emerald-500 hover:bg-emerald-600 text-white'}
        `}
      >
        {optInLoading ? (
          <span className="flex items-center justify-center gap-2">
            <AiOutlineLoading3Quarters className="animate-spin" />
            Opting in…
          </span>
        ) : alreadyOpted ? (
          'Already Opted In'
        ) : (
          'Opt In to USDC'
        )}
      </button>

      {/* Atomic Receiver */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Receiver Address (Atomic)
        </label>
        <input
          type="text"
          className="
            w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5
            focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition
          "
          placeholder="Enter Algorand address"
          value={groupReceiverAddress}
          onChange={(e) => setGroupReceiverAddress(e.target.value)}
        />
        <p className="text-xs text-gray-500 mt-1">
          {groupReceiverAddress.length}/58 characters
        </p>
      </div>

      {/* Atomic Send */}
      <button
        type="button"
        onClick={handleAtomicGroup}
        disabled={groupReceiverAddress.length !== 58 || groupLoading}
        className={`
          w-full py-2.5 rounded-xl font-semibold text-sm transition
          ${groupReceiverAddress.length === 58
            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
            : 'bg-gray-200 text-gray-500 cursor-not-allowed'}
        `}
      >
        {groupLoading ? (
          <span className="flex items-center justify-center gap-2">
            <AiOutlineLoading3Quarters className="animate-spin" />
            Sending Atomic…
          </span>
        ) : (
          'Send Atomic: 1 ALGO + 1 USDC'
        )}
      </button>
    </div>
  </div>
</dialog>
