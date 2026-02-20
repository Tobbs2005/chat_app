const redisClient = require("../redis");

module.exports.rateLimiter =
  (secondsLimit, limitAmount) => async (req, res, next) => {
    const ip = req.connection.remoteAddress;
    [response] = await redisClient
      .multi()
      .incr(ip)
      .expire(ip, secondsLimit)
      .exec();

    if (response[1] > limitAmount)
      res.json({
        loggedIn: false,
        status: "Slow down!! Try again in a minute.",
      });
    else next();
  };

const secondsUntilNextUtcMidnight = () => {
  const now = new Date();
  const nextMidnightUtc = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0)
  );
  return Math.max(1, Math.floor((nextMidnightUtc.getTime() - now.getTime()) / 1000));
};

module.exports.dailyUploadLimiter =
  ({ limit = 3 } = {}) =>
  async (req, res, next) => {
    const userId = req.session?.user?.userid;
    const identifier = userId ? `user:${userId}` : `ip:${req.ip}`;
    const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
    const key = `ratelimit:uploads:${identifier}:${day}`;

    try {
      const ttlSeconds = secondsUntilNextUtcMidnight() + 60;
      const [[, count]] = await redisClient.multi().incr(key).expire(key, ttlSeconds).exec();

      if (Number(count) > limit) {
        res.status(429).json({
          error: `Upload limit reached. Max ${limit} uploads per day.`,
        });
        return;
      }

      next();
    } catch (error) {
      // Fail open if Redis is unavailable; uploads are still protected by auth and validation.
      next();
    }
  };
