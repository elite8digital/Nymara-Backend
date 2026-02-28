import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    uId: { 
      type: String, 
      unique: true,
      sparse: true // Allows multiple null values during creation
    },
    name: { 
      type: String, 
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"]
    },
    email: { 
      type: String, 
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email"
      ]
    },
    phoneNumber: { 
  type: String, 
  required: [true, "Phone number is required"],
  unique: true,
  trim: true,
  match: [
    /^\+[1-9]\d{7,14}$/,
    "Please provide a valid international phone number"
  ]
},
    password: { 
      type: String, 
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false // Don't return password by default in queries
    },
    isAdmin: { 
      type: Boolean, 
      default: false 
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { 
    timestamps: true 
  }
);

// 🔹 Pre-save hook for uId generation and password hashing
userSchema.pre("save", async function (next) {
  try {
    // 1️⃣ Generate sequential uId only for new users
    if (this.isNew && !this.uId) {
      const lastUser = await this.constructor
        .findOne({}, { uId: 1 })
        .sort({ uId: -1 })
        .lean()
        .exec();

      if (!lastUser || !lastUser.uId) {
        this.uId = "BOF001";
      } else {
        const lastNumber = parseInt(lastUser.uId.replace(/\D/g, ""), 10) || 0;
        const newNumber = lastNumber + 1;
        this.uId = `BOF${String(newNumber).padStart(3, "0")}`;
      }
    }

    // 2️⃣ Hash password only if modified
    if (this.isModified("password")) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }

    next();
  } catch (error) {
    next(error);
  }
});

// 🔑 Generate password reset token
userSchema.methods.createPasswordResetToken = function () {
  // Generate random token
  const plainToken = crypto.randomBytes(32).toString("hex");

  // Hash and save to database
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(plainToken)
    .digest("hex");

  // Set expiry (15 minutes)
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  // Return plain token (this goes in the email)
  return plainToken;
};

// 🔑 Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// 🔑 Static method to find user by email and include password
userSchema.statics.findByCredentials = async function (email) {
  return await this.findOne({ email }).select("+password");
};

// 🗑️ Remove sensitive data before sending response
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpire;
  return userObject;
};

// 📌 Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ uId: 1 });
userSchema.index({ phoneNumber: 1 });
userSchema.index({ resetPasswordToken: 1 });

export default mongoose.model("User", userSchema);