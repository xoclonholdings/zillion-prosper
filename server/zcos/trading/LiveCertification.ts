export const LIVE_TRADING_CERTIFICATION = Object.freeze({
  code: "production_certification_required",
  message:
    "Live execution requires an explicit production certification setting, a connected production broker, qualification, and the armed risk controls.",
});

/**
 * Live execution is implemented but fail-closed by default.
 *
 * Production may enable it only by explicitly setting
 * ZILLION_LIVE_TRADING_CERTIFIED=true after the operator has completed the
 * deployment/security review. This replaces the previous permanently-false
 * compile-time gate while preserving a safe default and making the Live user
 * experience fully actionable once the required operator input is supplied.
 */
export function isLiveTradingCertified(): boolean {
  return String(process.env.ZILLION_LIVE_TRADING_CERTIFIED || "")
    .trim()
    .toLowerCase() === "true";
}
