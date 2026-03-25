const DAILY_LIMIT = 5000;
const pendingMints = new Map<string, { amount: number; timestamp: number }>();

export function checkDailyLimit(walletAddress: string, amount: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = today.getTime();

  let totalMinted = 0;
  for (const [key, value] of pendingMints.entries()) {
    if (key.startsWith(walletAddress.toLowerCase()) && value.timestamp >= todayStart) {
      totalMinted += value.amount;
    }
  }

  const remaining = DAILY_LIMIT - totalMinted - amount;

  if (remaining < 0) {
    return {
      allowed: false,
      remaining: totalMinted,
      message: `Daily limit exceeded. You've minted ${totalMinted} EURT today.`,
    };
  }

  return {
    allowed: true,
    remaining,
  };
}

export function recordPendingMint(walletAddress: string, amount: number, stripePaymentId: string) {
  const key = `${walletAddress.toLowerCase()}_${stripePaymentId}`;
  pendingMints.set(key, { amount, timestamp: Date.now() });
}

export function getPendingMints(walletAddress: string) {
  const mints: Array<{ id: string; amount: number; stripePaymentId: string; status: string; createdAt: string }> = [];
  
  for (const [key, value] of pendingMints.entries()) {
    if (key.startsWith(walletAddress.toLowerCase())) {
      const stripePaymentId = key.split('_')[1];
      mints.push({
        id: `pm_${stripePaymentId}`,
        amount: value.amount,
        stripePaymentId,
        status: 'pending',
        createdAt: new Date(value.timestamp).toISOString(),
      });
    }
  }

  return mints;
}

export function removePendingMint(pendingMintId: string) {
  pendingMints.delete(pendingMintId);
}
