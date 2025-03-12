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
  const { email, password } = req.body;
  try {
    const { error, value } = signupSchema.validate({ email, password });

    if (error) {
      return res
        .status(401)
        .json({ success: false, message: error.details[0] });
    }
    const existinguser = await User.findOne({ email });
    if (existinguser) {
      return res
        .status(401)
        .json({ success: false, message: "User already exist" });
    }
    const hashedPassword = await doHash(password, 12);
    const newUser = new User({
      email,
      password: hashedPassword,
    });
    const result = await newUser.save();
    result.password = undefined;
    res.status(201).json({
      success: true,
      message: "your account has been created successfully",
      result,
    });
  } catch (err) {
    console.log(err);
  }
};

exports.signin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const { error, value } = signinSchema.validate({ email, password });
    if (error) {
      return res
        .status(401)
        .json({ success: false, message: error.details[0] });
    }

    const existinguser = await User.findOne({ email }).select("+password");
    //   console.log(existinguser)
    if (!existinguser) {
      return res.status(401).json({
        success: false,
        message: "This user does not exist. Please sign up.",
      });
    }
    const result = await dohashValidation(password, existinguser.password);
    if (!result) {
      return res
        .status(401)
        .json({ success: false, message: "The credentials is false" });
    }
    const token = jwt.sign(
      {
        userId: existinguser._id,
        email: existinguser.email,
        varified: existinguser.verified,
      },
      process.env.Secret_Token,
      {
        expiresIn: "8h",
      }
    );
    res
      .cookie("Authorization", "Bearer" + token, {
        expires: new Date(Date.now() + 8 * 3600000),
        httpOnly: process.env.NODE_ENV == "production",
        secure: process.env.NODE_ENV == "production",
      })
      .json({
        success: true,
        token,
        message: "logged in successfully",
      });
  } catch (err) {
    console.log(err);
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


