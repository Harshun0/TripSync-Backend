import { auth } from 'express-oauth2-jwt-bearer';

const jwtCheck = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
  tokenSigningAlg: 'RS256',
});

export const requireAuth = (req, res, next) => {
  jwtCheck(req, res, (err) => {
    if (err) {
      return res.status(401).json({ error: 'Unauthorized', message: err.message });
    }
    req.userId = req.auth?.payload?.sub;
    next();
  });
};

export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    req.userId = null;
    return next();
  }
  jwtCheck(req, res, (err) => {
    if (err) req.userId = null;
    else req.userId = req.auth?.payload?.sub;
    next();
  });
};
