// TEST V1 only. These bonuses replace each other; they never accumulate.
function warIntentMultiplier(elapsedSeconds) {
  return elapsedSeconds >= 40 ? 1.16 : elapsedSeconds >= 20 ? 1.08 : 1;
}
module.exports = { warIntentMultiplier };
