export const LIVE_TRADING_CERTIFICATION = Object.freeze({
  certified: false,
  code: "separate_certification_required",
  message: "Live trading is blocked until ZILLION Prosper receives separate production certification.",
});

export function isLiveTradingCertified(): boolean {
  return LIVE_TRADING_CERTIFICATION.certified;
}
