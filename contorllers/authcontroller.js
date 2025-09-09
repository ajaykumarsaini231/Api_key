const jwt = require("jsonwebtoken");
const {
  signupSchema,
  signinSchema,
  acceptCodeSchema,
  passwordSchema,
  acceptforgotCodeSchema,
} = require("../middlewares/validator");
const User = require("../models/usersModel");
const { doHash, dohashValidation, hmacProcess } = require("../utils/hashing");
const { transport } = require("../middlewares/sendmail");

exports.signup = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Validate input
    const { error } = signupSchema.validate({ name, email, password });
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await doHash(password, 12);

    // Generate OTP
    const codevalue = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes
    console.log("OTP:", codevalue);

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      varified: false,
      varificationCode: codevalue,
      varificationCodeValidation: expiry,
    });

    const result = await newUser.save();

    // Send OTP email
    await transport.sendMail({
      from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
      to: newUser.email,
      subject: "Verification code",
      html: `<h1>${codevalue}</h1>`,
    });

    result.password = undefined; // remove password

    res.status(201).json({
      success: true,
      message: "Signup successful. OTP sent to your email.",
      email: newUser.email,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};



exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    // Find user with OTP fields
    const user = await User.findOne({ email }).select(
      "+verificationCode +verificationCodeValidation"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.verified) {
      return res.status(400).json({
        success: false,
        message: "User already verified",
      });
    }

    // Check OTP validity
    if (
      user.verificationCode !== otp ||
      user.verificationCodeValidation < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // Mark user as verified
    user.verified = true;
    user.verificationCode = undefined;
    user.verificationCodeValidation = undefined;
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        name: user.name,
        email: user.email,
        verified: user.verified,
      },
      process.env.Secret_Token,
      { expiresIn: "8h" }
    );

    res.json({
      success: true,
      message: "OTP verified successfully. You are now logged in.",
      token,
      user: {
        name: user.name,
        email: user.email,
        photoUrl: user.photoUrl || null,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};



exports.signin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate input
    const { error } = signinSchema.validate({ email, password });
    if (error) {
      return res.status(401).json({
        success: false,
        message: error.details[0].message,
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email }).select("+password +photoUrl");
    if (!existingUser) {
      return res.status(401).json({
        success: false,
        message: "This user does not exist. Please sign up.",
      });
    }

    // Validate password
    const isValid = await dohashValidation(password, existingUser.password);
    if (!isValid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: existingUser._id,
        name: existingUser.name, // ✅ include name here too
        email: existingUser.email,
        verified: existingUser.verified,
      },
      process.env.Secret_Token,
      { expiresIn: "8h" }
    );

    // Send cookie + JSON response
    res
      .cookie("Authorization", "Bearer " + token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax",
        maxAge: 8 * 3600000, // 8 hours
      })
      .json({
        success: true,
        token, // still return for frontend localStorage
        user: {
          name: existingUser.name, // ✅ fixed this
          email: existingUser.email,
          photoUrl: existingUser.photoUrl || "/default-avatar.png",
        },
        message: "Logged in successfully",
      });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};


exports.signout = async (req, res) => {
  try {
    return res
      .cookie("Authorization")
      .status(200)
      .json({ success: true, message: "logged out successfully" });
  } catch (err) {
    return res.status(401).json({ message: err });
  }
};

exports.sendVarificationcode = async (req, res) => {
  const { email } = req.body;
  try {
    const existinguser = await User.findOne({ email });
    //   console.log(existinguser)
    if (!existinguser) {
      return res.status(404).json({
        success: false,
        message: "This user does not exist. Please sign up.",
      });
    }
    console.log(existinguser.varified);

    if (existinguser.varified) {
      console.log("User already verified:", existinguser.email); // Debugging line
      return res.status(400).json({ message: "User already verified" });
    }

    const codevalue = Math.floor(
      (Math.random() * (0.999999 - 0.1) + 0.1) * 1000000
    ).toString();
    console.log(codevalue);
    let info = await transport.sendMail({
      from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
      to: existinguser.email,
      subject: "Varification code",
      html: "<h1>" + codevalue + "</h1>",
    });

    if (info.accepted[0] === existinguser.email) {
      const hashedcodevalue = hmacProcess(
        codevalue,
        process.env.HMAC_VARIFICATION_CODE_SECRET
      );
      // Should be 'string'
      console.log(hashedcodevalue);

      existinguser.varificationCode = hashedcodevalue;
      existinguser.varificationCodeValidation = Date.now();
      await existinguser.save();
      return res.status(200).json({
        success: true,
        message: "The varifation code has been send to the resister email Id",
      });
    }
    return res
      .status(400)
      .json({ success: false, message: "code sent failed! " });
  } catch (err) {
    return res.status(401).json({ message: err });
  }
};

exports.varifyVarificationCode = async (req, res) => {
  const { email, varificationCode } = req.body;
  if (!email || !varificationCode) {
    return res.json({ message: "Kindly add email and varificationCode" });
  }
  try {
    const { error, value } = acceptCodeSchema.validate({
      email,
      varificationCode,
    });
    if (error) {
      return res
        .status(401)
        .json({ success: false, message: error.details[0] });
    }

    const codevalue = varificationCode.toString();
    const existinguser = await User.findOne({ email }).select(
      "+varificationCode +varificationCodeValidation"
    );
    //   console.log(existinguser)
    if (!existinguser) {
      return res.status(401).json({
        success: false,
        message: "This user does not exist. Please sign up.",
      });
    }

    if (existinguser.varified) {
      return res.status(400).json({ message: "user already varified" });
    }

    if (
      !existinguser.varificationCodeValidation ||
      !existinguser.varificationCode
    ) {
      return res.status(401).json({
        message: "The code is does not send earlier Kindly send again",
      });
    }
    if (Date.now() - existinguser.varificationCodeValidation > 5 * 60 * 1000) {
      return res.status(401).json({ message: "The code is expired!" });
    }
    const hashedcodevalue = hmacProcess(
      codevalue,
      process.env.HMAC_VARIFICATION_CODE_SECRET
    );

    if (hashedcodevalue === existinguser.varificationCode) {
      existinguser.varified = true;
      existinguser.varificationCode = undefined;
      existinguser.varificationCodeValidation = undefined;
      await existinguser.save();
      return res
        .status(201)
        .json({ success: true, message: "Your varification is done !" });
    }
  } catch (err) {
    console.log(err);
  }
};

exports.ChangePassword = async (req, res) => {
  const { userId, varified } = req.user;
  const { oldpassword, newpassword } = req.body;
  try {
    const { error, value } = passwordSchema.validate({
      oldpassword,
      newpassword,
    });
    if (error) {
      return res
        .status(401)
        .json({ success: false, message: error.details[0] });
    }
    console.log("hello")
    // if (!varified) {
    //   return res.status(401).json({ message: "You are not varified user" });
    // }

    const existinguser = await User.findOne({ _id: userId }).select("+password");
    if (!existinguser) {
      return res.status(401).json({
        success: false,
        message: "This user does not exist. Please sign up.",
      });
    }
    const result =await dohashValidation(oldpassword,existinguser.password)
    if(!result){
      return res.status(401).json({
        success: false,
        message: "Incorrect password",
      });
    }
    const hashnewPassword = await doHash(newpassword,12)
    existinguser.password =hashnewPassword;
    await existinguser.save()
    return res.status(200).json({
      success: true,
      message: "Password update",
    });
  } catch (error) {
    console.log(error);
  }
};

exports.sendforgetcode = async (req, res) => {
  const { email } = req.body;
  try {
    const existinguser = await User.findOne({ email });
    //   console.log(existinguser)
    if (!existinguser) {
      return res.status(404).json({
        success: false,
        message: "This user does not exist. Please sign up.",
      });
    }
    console.log(existinguser.varified);

   

    const codevalue = Math.floor(
      (Math.random() * (0.999999 - 0.1) + 0.1) * 1000000
    ).toString();
    console.log(codevalue);
    let info = await transport.sendMail({
      from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
      to: existinguser.email,
      subject: "Varification code",
      html: "<h1>" + codevalue + "</h1>",
    });

    if (info.accepted[0] === existinguser.email) {
      const hashedcodevalue = hmacProcess(
        codevalue,
        process.env.HMAC_VARIFICATION_CODE_SECRET
      );
      // Should be 'string'
      console.log(hashedcodevalue);

      existinguser.forgotPasswordCode = hashedcodevalue;
      existinguser.forgotPasswordCodevalidation = Date.now();
      await existinguser.save();
      return res.status(200).json({
        success: true,
        message: "The varifation code has been send to the resister email Id",
      });
    }
    return res
      .status(400)
      .json({ success: false, message: "code sent failed! " });
  } catch (err) {
    return res.status(401).json({ message: err });
  }
};

exports.varifyforgotCode = async (req, res) => {
  const { email, varificationCode , newpassword } = req.body;
  
  try {
    const { error, value } = acceptforgotCodeSchema.validate({
      email,
      varificationCode,
      newpassword,
    });
    if (error) {
      return res
        .status(401)
        .json({ success: false, message: error.details[0] });
    }

    const codevalue = varificationCode.toString();
    const existinguser = await User.findOne({ email }).select(
      "+forgotPasswordCode +forgotPasswordCodevalidation +password"
    );
    //   console.log(existinguser)
    if (!existinguser) {
      return res.status(401).json({
        success: false,
        message: "This user does not exist. Please sign up.",
      });
    }

   

    if (
      !existinguser.forgotPasswordCodevalidation ||
      !existinguser.forgotPasswordCode
    ) {
      return res.status(401).json({
        message: "The code is does not send earlier Kindly send again",
      });
    }
    if (Date.now() - existinguser.forgotPasswordCodevalidation > 5 * 60 * 1000) {
      return res.status(401).json({ message: "The code is expired!" });
    }
    const hashedcodevalue = hmacProcess(
      codevalue,
      process.env.HMAC_VARIFICATION_CODE_SECRET
    );

    if (hashedcodevalue === existinguser.forgotPasswordCode) {
      const hashnewPassword = await doHash(newpassword,12)
      
      existinguser.password =hashnewPassword
      existinguser.varified = true;
      existinguser.forgotPasswordCode = undefined;
      existinguser.forgotPasswordCodevalidation = undefined;
      await existinguser.save();
      return res
        .status(201)
        .json({ success: true, message: "Your password reset !" });
    }
  } catch (err) {
    console.log(err);
  }
};


