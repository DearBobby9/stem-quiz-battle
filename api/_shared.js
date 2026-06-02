const crypto = require('crypto');

const TOKEN_TTL_MS = 4 * 60 * 60 * 1000;

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return req.body ? JSON.parse(req.body) : {};

  let raw = '';
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

function requirePost(req, res) {
  if (req.method === 'POST') return true;
  sendJson(res, 405, { ok: false, message: 'POST required.' });
  return false;
}

function getQuizData() {
  const raw = process.env.QUIZ_DATA_JSON;
  if (!raw) throw new Error('QUIZ_DATA_JSON is not configured');
  return JSON.parse(raw);
}

function getChallenge(challengeId) {
  return getQuizData().challenges?.[challengeId] || null;
}

function expectedChallengeCode(challengeId) {
  return {
    logic: process.env.LOGIC_CODE,
    stem: process.env.STEM_CODE,
  }[challengeId];
}

function expectedAnswerCode(answerKeyId) {
  return {
    logic: process.env.ANSWER_LOGIC_CODE,
    stem: process.env.ANSWER_STEM_CODE,
  }[answerKeyId];
}

function isValidCode(input, expected) {
  return Boolean(expected) && String(input || '').trim() === expected;
}

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function getTokenSecret() {
  const secret = process.env.TOKEN_SECRET;
  if (!secret) throw new Error('TOKEN_SECRET is not configured');
  return secret;
}

function signatureFor(encodedPayload) {
  return crypto
    .createHmac('sha256', getTokenSecret())
    .update(encodedPayload)
    .digest('base64url');
}

function signToken(payload) {
  const encodedPayload = base64url(JSON.stringify({
    ...payload,
    exp: Date.now() + TOKEN_TTL_MS,
  }));
  return `${encodedPayload}.${signatureFor(encodedPayload)}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;

  const [encodedPayload, receivedSignature] = token.split('.');
  if (!encodedPayload || !receivedSignature) return null;

  const expectedSignature = signatureFor(encodedPayload);
  const expected = Buffer.from(expectedSignature);
  const received = Buffer.from(receivedSignature);
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
    return null;
  }

  const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
  if (!payload.exp || payload.exp < Date.now()) return null;
  return payload;
}

module.exports = {
  sendJson,
  readJson,
  requirePost,
  getChallenge,
  expectedChallengeCode,
  expectedAnswerCode,
  isValidCode,
  signToken,
  verifyToken,
};
