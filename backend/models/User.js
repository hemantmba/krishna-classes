const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  fatherName: { type: String, required: true, trim: true },
  className: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  language: { type: String, enum: ['hindi', 'english'], default: 'hindi' },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  isActive: { type: Boolean, default: true },
  resetToken: String,
  resetTokenExpiry: Date,
  totalScore: { type: Number, default: 0 },
  totalTests: { type: Number, default: 0 },
  avatar: String,
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Index for performance
userSchema.index({ email: 1 });
userSchema.index({ className: 1 });
userSchema.index({ totalScore: -1 });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetToken;
  delete obj.resetTokenExpiry;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
