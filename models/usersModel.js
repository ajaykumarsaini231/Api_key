const { required, boolean } = require("joi");
const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      unique: [true, "Email must be unique !"],
      minLength: [5, "Email must have 5 characters"],
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password must be provided"],
      trim: true,
      select: false,
    },
    varified: {
      type: Boolean,
      default: false,
    },
    varificationCode: {
      type: String,
      select: false,
    },
    varificationCodeValidation: {
      type: Number,
      select: false,
    },
    forgotPasswordCode: {
      type: String,
      select: false,
    },
    forgotPasswordCodevalidation: {
      type: Number,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
