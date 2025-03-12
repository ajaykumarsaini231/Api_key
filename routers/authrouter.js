const express = require("express")
const authcontroller = require("../contorllers/authcontroller")
const { identifier } = require("../middlewares/indentifier")
const router = express.Router()

router.post("/signup", authcontroller.signup)
router.post("/signin",  authcontroller.signin)
router.post("/signout",identifier, authcontroller.signout)
router.patch("/sendVarificationCode", identifier, authcontroller.sendVarificationcode)
router.patch("/varifycode",identifier , authcontroller.varifyVarificationCode)
router.patch('/change-password',identifier,authcontroller.ChangePassword)
router.patch('/forgot-password-code', authcontroller.sendforgetcode)
router.patch('/forgot-password-code-validation', authcontroller.varifyforgotCode)

// router.get("/sign", authcontroller.hash)
module.exports = router;