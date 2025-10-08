const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/newsletter/subscribe
router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const existing = await prisma.newsletterSubscription.findUnique({ where: { email } });
    if (existing) {
      return res.status(200).json({ message: 'Already subscribed' });
    }

    const sub = await prisma.newsletterSubscription.create({ data: { email } });
    return res.status(201).json({ message: 'Subscribed successfully', id: sub.id });
  } catch (err) {
    console.error('Newsletter subscribe error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
