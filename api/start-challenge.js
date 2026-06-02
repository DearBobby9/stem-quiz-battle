const {
  sendJson,
  readJson,
  requirePost,
  getChallenge,
  expectedChallengeCode,
  isValidCode,
  signToken,
} = require('./_shared');

module.exports = async function startChallenge(req, res) {
  if (!requirePost(req, res)) return;

  try {
    const { challengeId, code } = await readJson(req);
    const challenge = getChallenge(challengeId);
    if (!challenge || !isValidCode(code, expectedChallengeCode(challengeId))) {
      sendJson(res, 401, { ok: false, message: 'Incorrect code.' });
      return;
    }

    sendJson(res, 200, {
      ok: true,
      token: signToken({ type: 'challenge', challengeId }),
      title: challenge.title,
    });
  } catch (error) {
    sendJson(res, 500, { ok: false, message: 'Challenge access failed.' });
  }
};
