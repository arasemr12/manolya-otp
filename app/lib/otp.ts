import crypto from "node:crypto";

export const getRemaningTimeForOtpReset = (period = 30) => {
    const now = Date.now() / 1000; // Unix zamanı (saniye)
    return period - (now % period);
};
