const validateRegister = (req, res, next) => {
  const { email, password, name, nationalId } = req.body;

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  // Password validation
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  // Name validation
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ error: 'Valid name is required' });
  }

  // National ID validation
  if (!nationalId || nationalId.length < 5) {
    return res.status(400).json({ error: 'Valid national ID is required' });
  }

  next();
};

const validateTransaction = (req, res, next) => {
  const { type, amount, userId } = req.body;

  const validTypes = ['DEPOSIT', 'WITHDRAWAL', 'LOAN', 'REPAYMENT'];
  if (!type || !validTypes.includes(type)) {
    return res.status(400).json({ error: 'Valid transaction type is required' });
  }

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Valid amount is required' });
  }

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  next();
};

const validateCreditScoreRequest = (req, res, next) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  next();
};

module.exports = {
  validateRegister,
  validateTransaction,
  validateCreditScoreRequest
};