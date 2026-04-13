function scoreLead({ companySize, urgency }) {
  let score = 50;
  if (companySize === 'pyme') score += 10;
  if (companySize === 'mid-market') score += 20;
  if (urgency === 'express') score += 20;
  return score;
}

module.exports = { scoreLead };
