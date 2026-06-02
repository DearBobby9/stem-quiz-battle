const {
  sendJson,
  readJson,
  requirePost,
  getChallenge,
  expectedAnswerCode,
  isValidCode,
} = require('./_shared');

module.exports = async function answerKey(req, res) {
  if (!requirePost(req, res)) return;

  try {
    const { answerKeyId, code } = await readJson(req);
    const challenge = getChallenge(answerKeyId);
    if (!challenge || !isValidCode(code, expectedAnswerCode(answerKeyId))) {
      sendJson(res, 401, { ok: false, message: 'Incorrect code.' });
      return;
    }

    sendJson(res, 200, {
      ok: true,
      title: challenge.answerTitle,
      questions: challenge.questions,
    });
  } catch (error) {
    sendJson(res, 500, { ok: false, message: 'Answer key access failed.' });
  }
};
