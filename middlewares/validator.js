const Joi = require('joi');
const { post } = require('../routers/authrouter');

exports.signupSchema = Joi.object({
    email: Joi.string()
        .min(6)
        .max(60)
        .required()
        .email({ tlds: { allow: ['com', 'net'] } }),

    password: Joi.string()
        .required()
        .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$"))
       
});

exports.signinSchema = Joi.object({
    email: Joi.string()
        .min(6)
        .max(60)
        .required()
        .email({ tlds: { allow: ['com', 'net'] } }),

    password: Joi.string()
        .required()
        .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$"))
        
});

exports.acceptCodeSchema = Joi.object({
    email: Joi.string()
        .min(6)
        .max(60)
        .required()
        .email({ tlds: { allow: ['com', 'net'] } }),

        varificationCode: Joi.number()
        .required()
                
});

exports.passwordSchema = Joi.object({
    oldpassword: Joi.string()
        .required()
        .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$")),

    newpassword: Joi.string()
        .required()
        .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$"))
        
});

exports.acceptforgotCodeSchema = Joi.object({
    email: Joi.string()
        .min(6)
        .max(60)
        .required()
        .email({ tlds: { allow: ['com', 'net'] } }),

        varificationCode: Joi.number()
        .required(),

        newpassword: Joi.string()
        .required()
        .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$"))
    
                
});



exports.postValidatort = Joi.object({
    title:Joi.string().min(6).max(600).required(),
    description:Joi.string().min(6).required(),
    userId:Joi.string().required()
    
})