// backend/src/routes/sacco.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// Get SACCO members
router.get('/:id/members', async (req, res) => {
  try {
    const members = await prisma.user.findMany({
      where: { saccoId: req.params.id },
      select: {
        id: true,
        name: true,
        email: true,
        creditScore: true,
        walletAddress: true
      }
    });
    
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

// Register new SACCO
router.post('/register', async (req, res) => {
  try {
    const { name, licenseNo, adminEmail } = req.body;
    
    const sacco = await prisma.sacco.create({
      data: {
        name,
        licenseNo,
        users: {
          create: {
            name: 'Admin User',
            email: adminEmail,
            role: 'ADMIN'
          }
        }
      }
    });
    
    res.status(201).json(sacco);
  } catch (error) {
    res.status(400).json({ error: 'SACCO registration failed' });
  }
});

module.exports = router;