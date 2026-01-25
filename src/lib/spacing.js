// Shared spacing config for preview/editor/export so layouts stay consistent.
const BASE_PADDING_RATIO = 0.0475
const BASE_GAP_RATIO = 0.0150

export function getSpacingRatios(orientation) {
  const isVertical = orientation?.id === 'vertical'
  const multiplier = isVertical ? 1.15 : 1.2
  return {
    paddingRatio: BASE_PADDING_RATIO * multiplier,
    gapRatio: BASE_GAP_RATIO * multiplier,
  }
}
