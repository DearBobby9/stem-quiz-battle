const {
  sendJson,
  readJson,
  requirePost,
  getChallenge,
  verifyToken,
} = require('./_shared');

module.exports = async function revealAnswer(req, res) {
  if (!requirePost(req, res)) return;

  try {
    const { token, questionId } = await readJson(req);
    const payload = verifyToken(token);
    if (!payload || payload.type !== 'challenge') {
      sendJson(res, 401, { ok: false, message: 'Challenge access required.' });
      return;
    }

    const challenge = getChallenge(payload.challengeId);
    const question = challenge?.questions.find((item) => item.id === questionId);
    if (!question) {
      sendJson(res, 404, { ok: false, message: 'Question not found.' });
      return;
    }

    sendJson(res, 200, { ok: true, answer: question.a });
  } catch (error) {
    sendJson(res, 500, { ok: false, message: 'Answer lookup failed.' });
  }
};
