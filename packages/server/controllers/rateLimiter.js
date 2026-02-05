const redisClient = require('../redis');

module.exports.rateLimiter = (maxRequests = 10, timeWindow = 60) => {
  async (req, res, next) => {
    const ip = req.connection.remoteAddress;
    const [response] = await redisClient
      .multi()
      .incr(ip)
      .expire(ip, timeWindow)
      .exec();
    if (response[1] > maxRequests) {
      res.json({loggedIn: false, status: 'Too many requests'});
      return;
    } else {
      next();
    }
  };
};
