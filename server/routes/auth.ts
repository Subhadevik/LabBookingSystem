import { RequestHandler } from "express";
import { ObjectId } from "mongodb";
import { getDatabase } from "../db";
import { User, AuthResponse } from "@shared/types";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export const login: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const db = await getDatabase();
    const user = await db.collection<User>('users').findOne({ email });
    
    if (!user || !user.password) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      } as AuthResponse);
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      } as AuthResponse);
    }
    
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({ 
      success: true, 
      user: userWithoutPassword, 
      token 
    } as AuthResponse);
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    } as AuthResponse);
  }
};

export const register: RequestHandler = async (req, res) => {
  try {
    const { email, password, name, role, ccId } = req.body;
    
    const db = await getDatabase();
    
    // Check if user already exists
    const existingUser = await db.collection<User>('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      } as AuthResponse);
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser: User = {
      email,
      password: hashedPassword,
      name,
      role,
      ...(ccId && { ccId }),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection<User>('users').insertOne(newUser);
    
    const { password: _, ...userWithoutPassword } = newUser;
    
    res.status(201).json({ 
      success: true, 
      user: { ...userWithoutPassword, _id: result.insertedId } 
    } as AuthResponse);
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    } as AuthResponse);
  }
};

export const verifyToken: RequestHandler = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      } as AuthResponse);
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    
    const db = await getDatabase();
    const user = await db.collection<User>('users').findOne({ _id: new ObjectId(decoded.userId) });
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      } as AuthResponse);
    }
    
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({ 
      success: true, 
      user: userWithoutPassword 
    } as AuthResponse);
    
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    } as AuthResponse);
  }
};

// In-memory store for OTPs (in production, use Redis or database)
const otpStore: { [email: string]: { otp: string; expires: Date; verified: boolean } } = {};

export const forgotPassword: RequestHandler = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const db = await getDatabase();
    const user = await db.collection<User>('users').findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email address'
      });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomBytes(3).toString('hex').substring(0, 6).toUpperCase();

    // Store OTP with 10-minute expiry
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 10);

    otpStore[email] = {
      otp,
      expires,
      verified: false
    };

    // In a real application, you would send this OTP via email
    // For demo purposes, we'll log it to console
    console.log(`🔐 OTP for ${email}: ${otp} (expires in 10 minutes)`);

    // TODO: Send email with OTP using a service like SendGrid, Nodemailer, etc.
    // await sendOTPEmail(email, otp, user.name);

    res.json({
      success: true,
      message: 'OTP sent to your email address. Please check your inbox.',
      // For demo purposes only - remove in production
      demo_otp: otp
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const verifyOTP: RequestHandler = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    const storedOTP = otpStore[email];

    if (!storedOTP) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found for this email. Please request a new one.'
      });
    }

    if (new Date() > storedOTP.expires) {
      delete otpStore[email];
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    if (storedOTP.otp !== otp.toUpperCase()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please try again.'
      });
    }

    // Mark OTP as verified
    otpStore[email].verified = true;

    res.json({
      success: true,
      message: 'OTP verified successfully. You can now reset your password.'
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const resetPassword: RequestHandler = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const storedOTP = otpStore[email];

    if (!storedOTP || !storedOTP.verified) {
      return res.status(400).json({
        success: false,
        message: 'OTP not verified. Please verify OTP first.'
      });
    }

    if (new Date() > storedOTP.expires) {
      delete otpStore[email];
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please start the process again.'
      });
    }

    if (storedOTP.otp !== otp.toUpperCase()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP.'
      });
    }

    const db = await getDatabase();
    const user = await db.collection<User>('users').findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await db.collection<User>('users').updateOne(
      { email },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date()
        }
      }
    );

    // Clean up OTP store
    delete otpStore[email];

    res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
