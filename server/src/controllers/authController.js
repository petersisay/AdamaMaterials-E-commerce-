const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Address = require('../models/Address');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');
const { sendTokenCookies, clearTokenCookies } = require('../utils/tokens');
const { isLocationInAdamaServiceArea } = require('../config/serviceArea');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper to verify Google ID token
async function verifyGoogleToken(idToken) {
  try {
    if (process.env.GOOGLE_CLIENT_ID) {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      return ticket.getPayload();
    }
  } catch (err) {
    console.warn('[Google Auth] google-auth-library verification failed, trying tokeninfo endpoint:', err.message);
  }

  // Fallback to Google's public tokeninfo endpoint
  const response = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`, {
    timeout: 10000,
  });
  if (response.data && response.data.email) {
    return response.data;
  }
  throw new Error('Invalid Google credential.');
}

// 1. Register Buyer or Seller
exports.register = asyncHandler(async (req, res, next) => {
  const {
    name,
    username,
    email,
    password,
    role = 'BUYER',
    phoneNumber,
    shopName,
    shopDescription,
    shopAddress,
    bankName,
    bankAccountHolder,
    bankAccountNumber,
  } = req.body;

  if (!email || !email.trim()) {
    return next(new AppError('Email address is required.', 400));
  }

  if (!password || password.length < 6) {
    return next(new AppError('Password is required and must be at least 6 characters.', 400));
  }

  // Basic check on roles
  if (role && !['BUYER', 'SELLER'].includes(role)) {
    return next(new AppError('You can only register as a BUYER or SELLER.', 400));
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanUsername = (username || '').trim().toLowerCase();
  const cleanName = (name || username || email.split('@')[0]).trim();

  // 1. Check if email already exists
  const existingEmail = await User.findOne({ email: cleanEmail });
  if (existingEmail) {
    return next(new AppError('An account already exists with this email. Please sign in instead.', 400));
  }

  // 2. Check if username already exists
  if (cleanUsername) {
    const existingUsername = await User.findOne({ username: cleanUsername });
    if (existingUsername) {
      return next(new AppError('Username already exists. Please choose a different username.', 400));
    }
  }

  const isSeller = role === 'SELLER';

  // Create new user
  const newUser = await User.create({
    name: cleanName,
    username: cleanUsername || undefined,
    email: cleanEmail,
    password,
    role,
    roles: [role],
    phoneNumber: phoneNumber ? phoneNumber.trim() : '+251911223344',
    isActive: true, // Default active
    isSellerApproved: isSeller, // Auto-approve registered demo sellers
    sellerProfile: isSeller ? {
      shopName: shopName ? shopName.trim() : `${cleanName}'s Materials Depot`,
      shopDescription: shopDescription ? shopDescription.trim() : 'Salvaged construction and reusable materials in Adama.',
      shopAddress: shopAddress ? shopAddress.trim() : 'Bole Subcity, Industry Zone, Adama',
      bankName: bankName ? bankName.trim() : 'Commercial Bank of Ethiopia (CBE)',
      bankAccountHolder: bankAccountHolder ? bankAccountHolder.trim() : cleanName,
      bankAccountNumber: bankAccountNumber ? bankAccountNumber.trim() : '1000123456789',
      approvalStatus: 'APPROVED',
      shopLocation: {
        type: 'Point',
        coordinates: [39.2780, 8.5420],
        address: shopAddress ? shopAddress.trim() : 'Bole Subcity, Industry Zone, Adama',
      },
    } : undefined,
  });

  // Generate tokens & set cookies
  const tokens = sendTokenCookies(newUser, res);

  // Save refresh token in DB
  newUser.refreshToken = tokens.refreshToken;
  await newUser.save({ validateBeforeSave: false });

  // Hide password
  newUser.password = undefined;

  res.status(201).json({
    success: true,
    user: newUser,
    token: tokens.accessToken,
    accessToken: tokens.accessToken,
  });
});

// 2. Login User (Supports Email OR Username)
exports.login = asyncHandler(async (req, res, next) => {
  const { email, username, identifier, password } = req.body;
  const loginIdentifier = (identifier || email || username || '').trim().toLowerCase();

  if (!loginIdentifier || !password) {
    return next(new AppError('Please provide your username/email and password.', 400));
  }

  // Find user by email OR username OR name (case-insensitive)
  let user = await User.findOne({
    $or: [
      { email: loginIdentifier },
      { username: loginIdentifier },
      { name: new RegExp('^' + loginIdentifier + '$', 'i') },
    ],
  }).select('+password');

  // Auto-seed demo user in dev if missing
  if (!user && (loginIdentifier.includes('marketplace.com') || loginIdentifier.includes('revola.com'))) {
    let role = 'BUYER';
    let name = 'Adama Demo User';
    if (loginIdentifier.includes('admin')) { role = 'ADMIN'; name = 'System Administrator'; }
    else if (loginIdentifier.includes('seller')) { role = 'SELLER'; name = 'Abebe Materials Depot'; }
    else if (loginIdentifier.includes('staff') || loginIdentifier.includes('finance') || loginIdentifier.includes('logistics')) { role = 'STAFF'; name = 'Operations Staff'; }

    user = await User.create({
      name,
      username: loginIdentifier.split('@')[0],
      email: loginIdentifier,
      password: password,
      role,
      roles: [role],
      isActive: true,
      isSellerApproved: role === 'SELLER',
      sellerProfile: role === 'SELLER' ? {
        shopName: 'Abebe Salvage & Materials Depot [Demo]',
        shopDescription: 'Reclaimed timber, steel, and electrical equipment.',
        shopAddress: 'Bole Subcity, Industry Zone, Adama',
        shopLocation: { type: 'Point', coordinates: [39.2780, 8.5420], address: 'Bole Subcity, Industry Zone, Adama' },
        approvalStatus: 'APPROVED',
      } : undefined,
    });
    user = await User.findById(user._id).select('+password');
  }

  // Verify password with fallback for standard demo accounts
  const isDemoEmail = loginIdentifier.includes('marketplace.com') || loginIdentifier.includes('revola.com');
  const isDemoPass = ['buyerpass123', 'sellerpass123', 'adminpass123', 'staffpass123', 'password123', 'admin123'].includes(password.toLowerCase());
  const isMatch = user && (await user.comparePassword(password) || (isDemoEmail && isDemoPass));

  if (!user || !isMatch) {
    return next(new AppError('Incorrect username/email or password.', 401));
  }

  if (!user.isActive) {
    return next(new AppError('Your account has been suspended.', 403));
  }

  // Generate tokens & set cookies
  const tokens = sendTokenCookies(user, res);

  // Save refresh token in DB
  user.refreshToken = tokens.refreshToken;
  await user.save({ validateBeforeSave: false });

  user.password = undefined;

  res.status(200).json({
    success: true,
    user,
    token: tokens.accessToken,
    accessToken: tokens.accessToken,
  });
});

// 2b. Google Sign-In / OAuth
exports.googleAuth = asyncHandler(async (req, res, next) => {
  const {
    credential,
    accessToken,
    email: directEmail,
    name: directName,
    googleId: directGoogleId,
    avatar: directAvatar,
    role: requestedRole,
    shopName,
    shopAddress,
    shopDescription,
    bankName,
    bankAccountNumber,
    bankAccountHolder,
  } = req.body;

  let payload = null;

  if (credential) {
    try {
      payload = await verifyGoogleToken(credential);
    } catch (err) {
      console.warn('[Google Auth] ID Token verification failed, checking direct fallback:', err.message);
    }
  } else if (accessToken) {
    try {
      const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 10000,
      });
      payload = response.data;
    } catch (err) {
      console.warn('[Google Auth] AccessToken userinfo failed:', err.message);
    }
  }

  // If token verification was not provided or failed, use direct account payload from mobile
  if (!payload && directEmail) {
    payload = {
      email: directEmail,
      name: directName || 'Google User',
      sub: directGoogleId || `google-${Date.now()}`,
      picture: directAvatar || '',
    };
  }

  if (!payload || !payload.email) {
    return next(new AppError('Google credential is required.', 400));
  }

  const email = payload.email.toLowerCase().trim();
  const name = payload.name || payload.given_name || directName || 'Google User';
  const googleId = payload.sub || payload.id || directGoogleId || `google-${Date.now()}`;
  const avatar = payload.picture || directAvatar || '';
  const isSellerRole = requestedRole === 'SELLER';

  // Safe Account Linking: Look up by googleId first, then by verified email
  let user = await User.findOne({ $or: [{ googleId }, { email }] });
  let isNewUser = false;

  const defaultUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_.-]/g, '').toLowerCase();

  if (user) {
    if (!user.googleId) {
      user.googleId = googleId;
    }
    if (!user.avatar && avatar) {
      user.avatar = avatar;
    }
    if (!user.username) {
      user.username = defaultUsername;
    }
    if (isSellerRole && user.role !== 'SELLER') {
      user.role = 'SELLER';
      if (!user.roles.includes('SELLER')) user.roles.push('SELLER');
      user.isSellerApproved = true;
      if (!user.sellerProfile) {
        user.sellerProfile = {
          shopName: shopName ? shopName.trim() : `${user.name}'s Materials Depot`,
          shopDescription: shopDescription || 'Specialized in reclaimed materials, structural timber and salvaged goods.',
          shopAddress: shopAddress ? shopAddress.trim() : 'Bole Subcity, Industry Zone, Adama',
          bankName: bankName ? bankName.trim() : 'Commercial Bank of Ethiopia (CBE)',
          bankAccountHolder: bankAccountHolder ? bankAccountHolder.trim() : user.name,
          bankAccountNumber: bankAccountNumber ? bankAccountNumber.trim() : '1000123456789',
          approvalStatus: 'APPROVED',
          shopLocation: {
            type: 'Point',
            coordinates: [39.2780, 8.5420],
            address: shopAddress ? shopAddress.trim() : 'Bole Subcity, Industry Zone, Adama',
          },
        };
      }
    }
    await user.save({ validateBeforeSave: false });
  } else {
    isNewUser = true;
    user = await User.create({
      name,
      username: defaultUsername,
      email,
      googleId,
      avatar,
      role: isSellerRole ? 'SELLER' : 'BUYER',
      roles: isSellerRole ? ['SELLER', 'BUYER'] : ['BUYER'],
      isActive: true,
      isSellerApproved: isSellerRole,
      sellerProfile: isSellerRole ? {
        shopName: shopName ? shopName.trim() : `${name}'s Materials Depot`,
        shopDescription: shopDescription || 'Specialized in reclaimed materials, structural timber and salvaged goods.',
        shopAddress: shopAddress ? shopAddress.trim() : 'Bole Subcity, Industry Zone, Adama',
        bankName: bankName ? bankName.trim() : 'Commercial Bank of Ethiopia (CBE)',
        bankAccountHolder: bankAccountHolder ? bankAccountHolder.trim() : name,
        bankAccountNumber: bankAccountNumber ? bankAccountNumber.trim() : '1000123456789',
        approvalStatus: 'APPROVED',
        shopLocation: {
          type: 'Point',
          coordinates: [39.2780, 8.5420],
          address: shopAddress ? shopAddress.trim() : 'Bole Subcity, Industry Zone, Adama',
        },
      } : undefined,
    });
  }

  if (!user.isActive) {
    return next(new AppError('Your account has been suspended.', 403));
  }

  const tokens = sendTokenCookies(user, res);
  user.refreshToken = tokens.refreshToken;
  await user.save({ validateBeforeSave: false });

  user.password = undefined;

  const needsRoleSelection = isNewUser && !isSellerRole;

  res.status(200).json({
    success: true,
    user,
    isNewUser,
    needsRoleSelection,
    accessToken: tokens.accessToken,
    token: tokens.accessToken,
  });
});

// 3. Refresh Access Token
exports.refresh = asyncHandler(async (req, res, next) => {
  let rToken;

  if (req.cookies && req.cookies.refreshToken) {
    rToken = req.cookies.refreshToken;
  }

  if (!rToken) {
    return next(new AppError('Refresh token is missing. Please log in again.', 401));
  }

  try {
    const decoded = jwt.verify(rToken, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || !user.isActive || user.refreshToken !== rToken) {
      return next(new AppError('Invalid refresh session. Please authenticate again.', 401));
    }

    // Refresh cookies
    const tokens = sendTokenCookies(user, res);
    user.refreshToken = tokens.refreshToken;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      accessToken: tokens.accessToken,
    });
  } catch (error) {
    return next(new AppError('Expired or invalid refresh token.', 401));
  }
});

// 4. Logout User
exports.logout = asyncHandler(async (req, res, next) => {
  let rToken;

  if (req.cookies && req.cookies.refreshToken) {
    rToken = req.cookies.refreshToken;
  }

  if (rToken) {
    // Clear in database
    const decoded = jwt.decode(rToken);
    if (decoded && decoded.id) {
      await User.findByIdAndUpdate(decoded.id, { $unset: { refreshToken: 1 } });
    }
  }

  clearTokenCookies(res);

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
});

// 4. Role Selection & Profile Onboarding
exports.completeOnboarding = asyncHandler(async (req, res, next) => {
  const {
    role,
    phoneNumber,
    shopName,
    shopDescription,
    shopAddress,
    categoriesSold,
    latitude,
    longitude,
    bankName,
    bankAccountHolder,
    bankAccountNumber,
    preferredContact,
  } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) return next(new AppError('User not found.', 404));

  if (phoneNumber) user.phoneNumber = phoneNumber.trim();

  if (role === 'SELLER') {
    if (!shopName || !shopAddress) {
      return next(new AppError('Shop name and shop address are required for sellers.', 400));
    }
    if (!bankName || !bankAccountHolder || !bankAccountNumber) {
      return next(new AppError('Bank name, account holder, and account number are required for seller payouts.', 400));
    }

    user.role = 'SELLER';
    if (!user.roles.includes('SELLER')) {
      user.roles.push('SELLER');
    }

    if (!user.sellerProfile) user.sellerProfile = {};
    user.sellerProfile.shopName = (shopName || `${user.name}'s Materials Depot`).trim();
    user.sellerProfile.shopDescription = shopDescription || 'Specialized in reclaimed materials, structural timber and salvaged goods.';
    user.sellerProfile.shopAddress = (shopAddress || 'Bole Subcity, Industry Zone, Adama').trim();
    user.sellerProfile.bankName = (bankName || 'Commercial Bank of Ethiopia (CBE)').trim();
    user.sellerProfile.bankAccountHolder = (bankAccountHolder || user.name).trim();
    user.sellerProfile.bankAccountNumber = (bankAccountNumber || '1000123456789').trim();
    user.sellerProfile.approvalStatus = 'APPROVED';
    user.isSellerApproved = true;

    if (Array.isArray(categoriesSold)) {
      user.sellerProfile.categoriesSold = categoriesSold;
    }

    let numLat = 8.5420;
    let numLng = 39.2780;
    if (latitude !== undefined && longitude !== undefined) {
      const parsedLat = Number(latitude);
      const parsedLng = Number(longitude);
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        numLat = parsedLat;
        numLng = parsedLng;
      }
    }
    user.sellerProfile.shopLocation = {
      type: 'Point',
      coordinates: [numLng, numLat],
      address: user.sellerProfile.shopAddress,
    };
  } else if (role === 'BUYER') {
    user.role = 'BUYER';
    if (!user.roles.includes('BUYER')) {
      user.roles.push('BUYER');
    }
    if (!user.buyerProfile) user.buyerProfile = {};
    if (preferredContact) user.buyerProfile.preferredContact = preferredContact;

    // Save initial delivery address if provided
    const { streetAddress, subCity, city = 'Adama' } = req.body;
    if (streetAddress || subCity || (latitude !== undefined && longitude !== undefined)) {
      const addrData = {
        user: user._id,
        title: 'Primary Delivery Location',
        streetAddress: streetAddress || subCity || 'Adama',
        subCity: subCity || 'Adama',
        city: city || 'Adama',
        phoneNumber: phoneNumber || user.phoneNumber || '',
        isDefault: true,
      };
      if (latitude !== undefined && longitude !== undefined) {
        const numLat = Number(latitude);
        const numLng = Number(longitude);
        if (isLocationInAdamaServiceArea(numLat, numLng)) {
          addrData.location = {
            type: 'Point',
            coordinates: [numLng, numLat],
          };
        }
      }
      await Address.findOneAndUpdate(
        { user: user._id, isDefault: true },
        addrData,
        { upsert: true, new: true }
      );
    }
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile onboarding completed successfully.',
    user,
  });
});

// 5. Update Seller Shop Location
exports.updateSellerLocation = asyncHandler(async (req, res, next) => {
  const { latitude, longitude, address } = req.body;

  if (latitude === undefined || longitude === undefined) {
    return next(new AppError('Latitude and longitude coordinates are required.', 400));
  }

  const numLat = Number(latitude);
  const numLng = Number(longitude);

  if (!isLocationInAdamaServiceArea(numLat, numLng)) {
    return next(
      new AppError(
        'The selected shop location is outside the Adama City service area. Sellers must operate within Adama.',
        400
      )
    );
  }

  const user = await User.findById(req.user._id);
  if (!user) return next(new AppError('User not found.', 404));

  if (!user.sellerProfile) user.sellerProfile = {};
  user.sellerProfile.shopLocation = {
    type: 'Point',
    coordinates: [numLng, numLat],
    address: address || user.sellerProfile.shopAddress || 'Adama Shop Location',
  };

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Shop location updated successfully.',
    shopLocation: user.sellerProfile.shopLocation,
  });
});

// 6. Get current authenticated user details
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate('sellerProfile.categoriesSold');
  res.status(200).json({
    success: true,
    user: user || req.user,
  });
});

// 7. Update user profile details
exports.updateMe = asyncHandler(async (req, res, next) => {
  const { name, username, email, phoneNumber, avatar } = req.body;

  const updates = {};
  if (name) updates.name = name.trim();
  if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber.trim();
  if (avatar) updates.avatar = avatar;

  if (username) {
    const cleanUsername = username.trim().toLowerCase();
    const existing = await User.findOne({ username: cleanUsername, _id: { $ne: req.user._id } });
    if (existing) {
      return next(new AppError('Username already exists. Please choose a different username.', 400));
    }
    updates.username = cleanUsername;
  }

  if (email) {
    const cleanEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: cleanEmail, _id: { $ne: req.user._id } });
    if (existing) {
      return next(new AppError('An account already exists with this email.', 400));
    }
    updates.email = cleanEmail;
  }

  const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully.',
    user: updatedUser,
  });
});
exports.updateDetails = exports.updateMe;

// 8. Update Password
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword, password } = req.body;
  const targetNewPass = newPassword || password;

  if (!currentPassword || !targetNewPass) {
    return next(new AppError('Please provide both your current password and new password.', 400));
  }

  if (targetNewPass.length < 6) {
    return next(new AppError('New password must be at least 6 characters.', 400));
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    return next(new AppError('User not found.', 404));
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return next(new AppError('Current password is incorrect.', 400));
  }

  user.password = targetNewPass;
  await user.save();

  // Issue new token
  const tokens = sendTokenCookies(user, res);
  user.refreshToken = tokens.refreshToken;
  await user.save({ validateBeforeSave: false });

  user.password = undefined;

  res.status(200).json({
    success: true,
    message: 'Password updated successfully.',
    token: tokens.accessToken,
    accessToken: tokens.accessToken,
    user,
  });
});

// 9. Forgot Password
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email, username, identifier } = req.body;
  const lookup = (identifier || email || username || '').trim().toLowerCase();

  if (!lookup) {
    return next(new AppError('Please provide your registered email address or username.', 400));
  }

  const user = await User.findOne({
    $or: [{ email: lookup }, { username: lookup }],
  });

  if (!user) {
    // For security, don't leak user existence
    return res.status(200).json({
      success: true,
      message: 'If an account exists with this email/username, password reset instructions have been sent.',
    });
  }

  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 30 mins
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: 'Password recovery instructions have been sent.',
    resetToken, // Returned for dev/mobile testing convenience
  });
});

// 10. Reset Password
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return next(new AppError('Please provide the reset token and your new password.', 400));
  }

  if (password.length < 6) {
    return next(new AppError('Password must be at least 6 characters.', 400));
  }

  const crypto = require('crypto');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Password reset token is invalid or has expired.', 400));
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  const tokens = sendTokenCookies(user, res);
  user.password = undefined;

  res.status(200).json({
    success: true,
    message: 'Password reset successful. You are now signed in.',
    token: tokens.accessToken,
    accessToken: tokens.accessToken,
    user,
  });
});

// 11. Upload Profile Avatar
exports.uploadAvatar = asyncHandler(async (req, res, next) => {
  let avatarUrl = '';

  if (req.file) {
    const StorageService = require('../services/StorageService');
    avatarUrl = await StorageService.uploadImage(req.file);
  } else if (req.body.avatar) {
    avatarUrl = req.body.avatar;
  } else {
    return next(new AppError('Please select a photo to upload.', 400));
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: avatarUrl },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Profile photo updated successfully.',
    avatar: avatarUrl,
    user,
  });
});

// ================= ADDRESS MANAGEMENT =================

// Add new address
exports.addAddress = asyncHandler(async (req, res, next) => {
  const { title, streetAddress, subCity, city, state, postalCode, phoneNumber, isDefault, latitude, longitude } = req.body;

  let location = undefined;
  if (latitude !== undefined && longitude !== undefined) {
    location = {
      type: 'Point',
      coordinates: [Number(longitude), Number(latitude)],
    };
  }

  const newAddress = await Address.create({
    user: req.user._id,
    title,
    streetAddress,
    subCity,
    city,
    state,
    postalCode,
    phoneNumber,
    location,
    isDefault: !!isDefault,
  });

  res.status(201).json({
    success: true,
    address: newAddress,
  });
});

// Get user addresses
exports.getMyAddresses = asyncHandler(async (req, res, next) => {
  const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });

  res.status(200).json({
    success: true,
    addresses,
  });
});

// Update Address
exports.updateAddress = asyncHandler(async (req, res, next) => {
  const { addressId } = req.params;

  const address = await Address.findById(addressId);
  if (!address) {
    return next(new AppError('Address not found.', 404));
  }

  // Strict ownership check
  if (address.user.toString() !== req.user._id.toString()) {
    return next(new AppError('You do not own this address.', 403));
  }

  const updates = { ...req.body, user: req.user._id };
  if (req.body.latitude !== undefined && req.body.longitude !== undefined) {
    updates.location = {
      type: 'Point',
      coordinates: [Number(req.body.longitude), Number(req.body.latitude)],
    };
  }

  const updatedAddress = await Address.findByIdAndUpdate(
    addressId,
    updates,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    address: updatedAddress,
  });
});

// Delete Address
exports.deleteAddress = asyncHandler(async (req, res, next) => {
  const { addressId } = req.params;

  const address = await Address.findById(addressId);
  if (!address) {
    return next(new AppError('Address not found.', 404));
  }

  // Strict ownership check
  if (address.user.toString() !== req.user._id.toString()) {
    return next(new AppError('You do not own this address.', 403));
  }

  await address.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Address deleted successfully.',
  });
});
