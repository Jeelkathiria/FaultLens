const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const env = require('../config/env');
const { BadRequestError, UnauthorizedError, ConflictError } = require('../utils/errors');

class AuthController {
  /**
   * Register a new user
   */
  async register(req, res, next) {
    try {
      const { name, email, password, role } = req.body;

      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (existingUser) {
        throw new ConflictError('A user with this email address already exists');
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const user = await prisma.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          passwordHash,
          role: role === 'ADMIN' ? 'ADMIN' : 'DEVELOPER'
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        }
      });

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN }
      );

      res.status(201).json({
        success: true,
        data: {
          user,
          token
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Log in an existing user
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (!user) {
        throw new UnauthorizedError('Invalid email or password credentials');
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        throw new UnauthorizedError('Invalid email or password credentials');
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN }
      );

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt
          },
          token
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Fetch currently authenticated user profile
   */
  async getMe(req, res, next) {
    try {
      res.json({
        success: true,
        data: {
          user: req.user
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Google OAuth authentication / registration (Developer role only)
   */
  async googleAuth(req, res, next) {
    try {
      const { name, email, googleId, photoURL } = req.body;

      if (!email) {
        throw new BadRequestError('Email is required for Google authentication');
      }

      let user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (!user) {
        // Create user with DEVELOPER role (dev only)
        const salt = await bcrypt.genSalt(10);
        const randomPassword = require('crypto').randomBytes(16).toString('hex');
        const passwordHash = await bcrypt.hash(randomPassword, salt);

        user = await prisma.user.create({
          data: {
            name: name || 'Google Developer',
            email: email.toLowerCase(),
            passwordHash,
            role: 'DEVELOPER'
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true
          }
        });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: 'DEVELOPER' },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN }
      );

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: 'DEVELOPER',
            createdAt: user.createdAt,
            photoURL
          },
          token
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Logout user (client-side token removal)
   */
  async logout(req, res) {
    res.json({
      success: true,
      data: {
        message: 'Successfully logged out'
      }
    });
  }
}

module.exports = new AuthController();
