const express = require("express")
const postcontroller = require("../contorllers/postController")
const { identifier } = require("../middlewares/indentifier")
const router = express.Router()

router.get("/all-post", postcontroller.getallpost)
router.get("/single-post",  postcontroller.getsinglepost)
router.post("/create-post",identifier, postcontroller.CreatePost)
router.put("/update-post", identifier, postcontroller.UpdatePost)
// router.delete("/delete-post",identifier , authcontroller.varifyVarificationCode)


// router.get("/sign", authcontroller.hash)
module.exports = router;