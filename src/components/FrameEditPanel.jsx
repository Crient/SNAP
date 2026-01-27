import React from 'react'

export default function FrameEditPanel({
  isBottomSheet,
  frameSlots,
  selectedFrameIndex,
  selectedFrame,
  selectedFrameVisible,
  hasSelectedFrame,
  hasHiddenFrames,
  canUndoFrames,
  canRedoFrames,
  isExportDisabled,
  onSelectFrame,
  onUndo,
  onRedo,
  onToggleSelectedVisibility,
  onShowAll,
  onExport,
  onReset,
  onDoneEditing,
}) {
  return (
    <>
      {/* === FRAME EDIT HEADER === */}
      <div className="space-y-3" style={{ padding: isBottomSheet ? '14px 18px 10px 18px' : '14px 12px 10px 12px' }}>
        <div className="flex items-center justify-between">
          <div className="text-[15px] font-bold uppercase tracking-wide text-[var(--color-text-primary)]">
            Frame Editing
          </div>
          {hasSelectedFrame && (
            <div className="text-[11px] font-semibold text-[var(--color-text-muted)]">
              {selectedFrame?.label}{selectedFrameVisible ? '' : ' • Hidden'}
            </div>
          )}

        </div>
        <p className="text-[11px] mb-font-semibold text-[var(--color-text-muted)] leading-4">
          Drag frames on the canvas to swap. <br>
          </br>Tap a frame to select it.
        </p>
        <div className="text-[10px] font-semibold text-center uppercase tracking-wide text-[var(--color-text-muted)]"
        style={{marginTop: "2px"}}>
          Actions
        </div>
        <div className="flex gap-2" style={{ marginBottom: '6px', marginTop: '4px' }}>
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndoFrames}
            className="flex-1 h-9 rounded-lg text-[12px] font-bold transition-all shadow-sm
                       text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]
                       disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'var(--toggle-bg)' }}
          >
            Undo
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedoFrames}
            className="flex-1 h-9 rounded-lg text-[11px] font-semibold transition-all shadow-sm
                       text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]
                       disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'var(--toggle-bg)' }}
          >
            Redo
          </button>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onToggleSelectedVisibility}
            disabled={!hasSelectedFrame}
            className="flex-1 h-9 rounded-lg text-[11px] font-semibold transition-all shadow-sm
                       text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]
                       disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'var(--toggle-bg)' }}
          >
            {selectedFrameVisible ? 'Hide Selected' : 'Show Selected'}
          </button>
          <button
            type="button"
            onClick={onShowAll}
            disabled={!hasHiddenFrames}
            className="flex-1 h-9 rounded-lg text-[11px] font-semibold transition-all shadow-sm
                       text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]
                       disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'var(--toggle-bg)',

             }}
          >
            Show All
          </button>
        </div>
      </div>

      {/* Thin divider between actions and frames */}
      <div className="px-3">
        <div className="h-px w-full bg-[var(--card-border)] opacity-60" />
      </div>

      {/* === FRAME LIST === */}
      <div
        className="flex-1 overflow-visible min-h-0 py-3"
        style={{
          paddingLeft: isBottomSheet ? '16px' : '10px',
          paddingRight: isBottomSheet ? '16px' : '10px',
        }}
      >
        <div className="mb-2 text-[10px] text-center font-semibold uppercase tracking-wide text-[var(--color-text-muted)]"
        style={{ marginBottom: '5px', marginTop: '5px' }}>
          Frames
        </div>
        <div
          className="grid gap-3 w-full"
          style={{
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            maxWidth: '100%',
          }}
        >
          {frameSlots.map((slot) => {
            const isSelected = selectedFrameIndex === slot.slotIndex

            const slotBtnClass = [
              'rounded-full transition-all shadow-md',
              'flex items-center justify-center',
              'py-2.5 text-[12px] font-semibold',
              'ring-1 ring-inset',
              !slot.isVisible ? 'opacity-70' : '',
              isSelected
                ? 'ring-[#B8001F] bg-[#B8001F]/10 text-[#B8001F]'
                : 'ring-white/10 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
            ].join(' ')

            return (
              <button
                key={`frame-chip-${slot.slotIndex}`}
                type="button"
                onClick={() => onSelectFrame(slot.slotIndex)}
                className={slotBtnClass}
                style={{
                  '--tw-ring-offset-color': 'var(--panel-bg)',
                  paddingTop: '6px',
                  paddingBottom: '6px',
                  background: isSelected ? 'rgba(184, 0, 31, 0.12)' : 'var(--toggle-bg)',
                }}
              >
                <div className="relative flex items-center justify-center w-full px-3">
                  <span className="whitespace-nowrap text-center">
                    {slot.label}
                  </span>
                  {!slot.isVisible && (
                    <span className="absolute top-1 right-1 inline-flex items-center justify-center w-[6px] h-[6px] rounded-full bg-[#B8001F]" />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>


      {/* === FIXED BOTTOM ACTIONS === */}
      <div style={{ padding: isBottomSheet ? '8px 16px 16px 16px' : '10px 10px 14px 10px' }}>
        <button
          onClick={onExport}
          disabled={isExportDisabled}
          className="w-full py-2.5 rounded-lg btn-primary text-white font-bold text-[15px]
                     shadow-md hover:shadow-lg hover:shadow-[#B8001F]/15 transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Download
        </button>
        <div className="mt-4 flex items-center justify-center gap-3"
        style={{marginTop: '5px'}}>
          <button
            onClick={onReset}
            className="py-2 text-sm font-bold transition-all
                       text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            style={{ background: 'transparent', marginRight: '4px' }}
          >
            Start Over
          </button>
          <span
            className="h-4 bg-[var(--color-text-secondary)] opacity-60"
            style={{ width: '1.5px' }}
          />
          <button
            type="button"
            onClick={onDoneEditing}
            className="py-2 text-sm font-bold frame-edit-action"
            style={{ background: 'transparent', marginLeft: '4px' }}
          >
            Done Editing
          </button>
        </div>
      </div>
    </>
  )
}
