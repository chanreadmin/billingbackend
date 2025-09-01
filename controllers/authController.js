import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { jwtConfig } from '../config/jwt.js';
import Department from '../models/departmentModel.js';
import { sendPasswordResetEmail } from '../config/emailService.js';

// User signup
export const registerUser = async (req, res) => {
  try {
    const { name, username, email, password, role, department, specialization, consultationCharges, contactNumber } = req.body;

    const userExists = await User.findOne({ email });
    console.log("Existing user : ", userExists)
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    if (role === 'Doctor') {
      const departments = await Department.findById(department);

      if (!departments) {
        return res.status(404).json({ message: 'Department not found' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
      role,
      contactNumber,
      department: role === 'Doctor' ? department : null,
      specialization: role === 'Doctor' ? specialization : null,
      consultationCharges: role === 'Doctor' ? consultationCharges : null,
    });

    const token = jwt.sign({ id: user._id, role: user.role }, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn,
    });

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: user._id, name: user.name, role: user.role },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error });
  }
};

// User login
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  console.log(req.body)

  try {
    const user = await User.findOne({email});

    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn,
    });

    return res.status(200).json({
      message: 'Logged in successfully',
      token,
      user,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error });
  }
};

// Get user profile
export const getUserProfile = async (req, res) => {
  const { id } = req.user;

  try {
    const user = await User.findById(id).select('-password'); // Exclude password

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error });
  }
};

// Forgot password
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // For security, don't reveal if email exists or not
      return res.status(200).json({ 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save reset token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // Send email
    try {
      await sendPasswordResetEmail(user.email, resetToken, user.name);
      
      return res.status(200).json({
        message: 'Password reset link has been sent to your email address.'
      });
    } catch (emailError) {
      // Clear the reset token if email fails
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();
      
      console.error('Email sending failed:', emailError);
      return res.status(500).json({ 
        message: 'Failed to send password reset email. Please try again later.' 
      });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() } // Token hasn't expired
    });

    if (!user) {
      return res.status(400).json({ 
        message: 'Invalid or expired password reset token' 
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.status(200).json({
      message: 'Password has been reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Verify reset token (optional - for frontend validation)
export const verifyResetToken = async (req, res) => {
  const { token } = req.params;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ 
        message: 'Invalid or expired password reset token',
        valid: false 
      });
    }

    return res.status(200).json({
      message: 'Token is valid',
      valid: true,
      email: user.email // Don't send full email, just partial for confirmation
    });

  } catch (error) {
    console.error('Verify reset token error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};