import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { getDbStatus } from '../db';
import { fallbackStore } from '../fallbackStore';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fintrack_jwt_default_secret_key_2026';

const generateToken = (id: string, email: string, name: string) => {
  return jwt.sign({ id, email, name }, JWT_SECRET, { expiresIn: '30d' });
};

// GET DB status
router.get('/db-status', (req: Request, res: Response) => {
  const status = getDbStatus();
  res.json(status);
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, preferredCurrency } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Full name is required (minimum 2 characters).' });
    }

    if (!email || !email.includes('@') || !email.includes('.')) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const currency = preferredCurrency || 'USD';
    const status = getDbStatus();

    // 1. Try MongoDB if connected
    if (status.isConnected) {
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        return res.status(400).json({ error: 'An account with this email already exists.' });
      }

      const newUser = new User({
        name: cleanName,
        email: cleanEmail,
        password,
        preferredCurrency: currency,
        jobTitle: 'Personal Account',
        monthlyIncomeTarget: 5000,
        alertThresholdPercent: 80,
      });

      await newUser.save();

      const token = generateToken(newUser._id.toString(), newUser.email, newUser.name);

      return res.status(201).json({
        token,
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          jobTitle: newUser.jobTitle,
          preferredCurrency: newUser.preferredCurrency,
          isDemoUser: false,
          monthlyIncomeTarget: newUser.monthlyIncomeTarget,
          alertThresholdPercent: newUser.alertThresholdPercent,
          createdAt: newUser.createdAt,
        },
      });
    }

    // 2. Fallback store
    const existingInFallback = fallbackStore.users.find(
      (u) => u.email.toLowerCase() === cleanEmail
    );
    if (existingInFallback) {
      return res.status(400).json({ error: 'An account with this email already exists in local registry.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const newId = `user-${Date.now()}`;

    const newStoredUser = {
      id: newId,
      name: cleanName,
      email: cleanEmail,
      passwordHash,
      jobTitle: 'Personal Account',
      preferredCurrency: currency,
      isDemoUser: false,
      monthlyIncomeTarget: 5000,
      alertThresholdPercent: 80,
      createdAt: new Date().toISOString(),
    };

    fallbackStore.users.push(newStoredUser);
    const token = generateToken(newId, cleanEmail, cleanName);

    return res.status(201).json({
      token,
      user: {
        id: newStoredUser.id,
        name: newStoredUser.name,
        email: newStoredUser.email,
        jobTitle: newStoredUser.jobTitle,
        preferredCurrency: newStoredUser.preferredCurrency,
        isDemoUser: false,
        monthlyIncomeTarget: newStoredUser.monthlyIncomeTarget,
        alertThresholdPercent: newStoredUser.alertThresholdPercent,
        createdAt: newStoredUser.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Registration failed due to an internal server error.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const status = getDbStatus();

    // Check MongoDB first
    if (status.isConnected) {
      const user = await User.findOne({ email: cleanEmail });
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const token = generateToken(user._id.toString(), user.email, user.name);

      return res.json({
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          jobTitle: user.jobTitle,
          preferredCurrency: user.preferredCurrency,
          isDemoUser: user.isDemoUser,
          monthlyIncomeTarget: user.monthlyIncomeTarget,
          alertThresholdPercent: user.alertThresholdPercent,
          createdAt: user.createdAt,
        },
      });
    }

    // Check Fallback store
    const user = fallbackStore.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      return res.status(401).json({ error: 'No account found with this email. Try Demo Account or register.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    const token = generateToken(user.id, user.email, user.name);

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        jobTitle: user.jobTitle,
        preferredCurrency: user.preferredCurrency,
        isDemoUser: user.isDemoUser,
        monthlyIncomeTarget: user.monthlyIncomeTarget,
        alertThresholdPercent: user.alertThresholdPercent,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed due to an internal server error.' });
  }
});

// POST /api/auth/demo
router.post('/demo', async (req: Request, res: Response) => {
  const demoUser = fallbackStore.users.find((u) => u.isDemoUser) || {
    id: 'user-demo-alex',
    name: 'Alex Morgan',
    email: 'alex.morgan@fintrack.app',
    jobTitle: 'Senior Product Designer',
    preferredCurrency: 'USD',
    isDemoUser: true,
    monthlyIncomeTarget: 8500,
    alertThresholdPercent: 80,
    createdAt: '2026-01-15T09:00:00Z',
  };

  const token = generateToken(demoUser.id, demoUser.email, demoUser.name);

  return res.json({
    token,
    user: demoUser,
  });
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const status = getDbStatus();

    if (status.isConnected) {
      const user = await User.findById(userId).select('-password');
      if (user) {
        return res.json({
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          jobTitle: user.jobTitle,
          preferredCurrency: user.preferredCurrency,
          isDemoUser: user.isDemoUser,
          monthlyIncomeTarget: user.monthlyIncomeTarget,
          alertThresholdPercent: user.alertThresholdPercent,
          createdAt: user.createdAt,
        });
      }
    }

    const user = fallbackStore.users.find((u) => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      jobTitle: user.jobTitle,
      preferredCurrency: user.preferredCurrency,
      isDemoUser: user.isDemoUser,
      monthlyIncomeTarget: user.monthlyIncomeTarget,
      alertThresholdPercent: user.alertThresholdPercent,
      createdAt: user.createdAt,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
});

// PUT /api/auth/profile
router.put('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, jobTitle, preferredCurrency, monthlyIncomeTarget, alertThresholdPercent } = req.body;
    const status = getDbStatus();

    if (status.isConnected) {
      const updated = await User.findByIdAndUpdate(
        userId,
        {
          ...(name ? { name: name.trim() } : {}),
          ...(jobTitle !== undefined ? { jobTitle } : {}),
          ...(preferredCurrency ? { preferredCurrency } : {}),
          ...(monthlyIncomeTarget !== undefined ? { monthlyIncomeTarget } : {}),
          ...(alertThresholdPercent !== undefined ? { alertThresholdPercent } : {}),
        },
        { new: true }
      ).select('-password');

      if (updated) {
        return res.json(updated);
      }
    }

    const idx = fallbackStore.users.findIndex((u) => u.id === userId);
    if (idx !== -1) {
      if (name) fallbackStore.users[idx].name = name.trim();
      if (jobTitle !== undefined) fallbackStore.users[idx].jobTitle = jobTitle;
      if (preferredCurrency) fallbackStore.users[idx].preferredCurrency = preferredCurrency;
      if (monthlyIncomeTarget !== undefined) fallbackStore.users[idx].monthlyIncomeTarget = monthlyIncomeTarget;
      if (alertThresholdPercent !== undefined) fallbackStore.users[idx].alertThresholdPercent = alertThresholdPercent;

      return res.json(fallbackStore.users[idx]);
    }

    return res.status(404).json({ error: 'User profile not found.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

export default router;
