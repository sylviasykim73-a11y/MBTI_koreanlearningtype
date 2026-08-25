/**
 * Korean Learning Type - Scoring Engine
 * Pure functions: given the current answers, derive scores, percentages,
 * tied axes, the final 4-letter type, and the strongest single preference.
 *
 * `answers` shape: { [questionId]: "E" | "I" | "S" | "N" | "T" | "F" | "J" | "P" }
 * Tie-breaker answers are keyed by "TB-EI", "TB-SN", "TB-TF", "TB-JP".
 */

const AXES = [
  { key: "EI", left: "E", right: "I" },
  { key: "SN", left: "S", right: "N" },
  { key: "TF", left: "T", right: "F" },
  { key: "JP", left: "J", right: "P" },
];

function calculateScores(answers) {
  const scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
  Object.values(answers).forEach((value) => {
    if (Object.prototype.hasOwnProperty.call(scores, value)) {
      scores[value] += 1;
    }
  });
  return scores;
}

// Percentages are computed per axis from the base 6 questions of that axis only,
// so a tie-breaker (which decides the *winner*, not the percentage split) never
// skews the displayed percentage away from a true reading of the 6 core answers.
function calculatePercentages(scores) {
  const percentages = {};
  AXES.forEach(({ key, left, right }) => {
    const total = scores[left] + scores[right];
    if (total === 0) {
      percentages[key] = { [left]: 50, [right]: 50 };
      return;
    }
    const leftPct = Math.round((scores[left] / total) * 100);
    percentages[key] = { [left]: leftPct, [right]: 100 - leftPct };
  });
  return percentages;
}

function detectTies(scores) {
  return AXES.filter(({ left, right }) => scores[left] === scores[right]).map((a) => a.key);
}

// `tieBreakerAnswers` shape: { EI: "E"|"I", SN: "S"|"N", ... } (only for tied axes)
function determineFinalType(scores, tieBreakerAnswers = {}) {
  let code = "";
  AXES.forEach(({ key, left, right }) => {
    if (scores[left] === scores[right]) {
      code += tieBreakerAnswers[key] || left; // stable fallback: left letter wins
    } else {
      code += scores[left] > scores[right] ? left : right;
    }
  });
  return code;
}

// Strongest preference: the single letter with the highest percentage among
// the four "winning" letters of the final type. Ties broken by fixed axis
// priority (E/I > S/N > T/F > J/P) for stable, reproducible results.
function determineStrongestPreference(finalType, percentages) {
  const letters = finalType.split("");
  const axisOrder = ["EI", "SN", "TF", "JP"];
  let best = null;
  axisOrder.forEach((axisKey, i) => {
    const letter = letters[i];
    const pct = percentages[axisKey][letter];
    if (!best || pct > best.pct) {
      best = { letter, pct, axis: axisKey };
    }
  });
  return best;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    AXES,
    calculateScores,
    calculatePercentages,
    detectTies,
    determineFinalType,
    determineStrongestPreference,
  };
}
