const express = require('express')
const helmet = require("helmet")
const cors = require("cors")
const cookieperser =require("cookie-parser")
const mongoose = require('mongoose')
require('dotenv').config();
const app= express()

const authRouter = require('./routers/authrouter')

app.use(cors())
app.use(cookieperser())
app.use(express.json())
app.use(express.urlencoded({extended:true}))


mongoose.connect(process.env.MONGO_URI)
.then(()=>{
    console.log("mongoose connected")
})
.catch((err)=>{
    console.log(err)
})

app.get('/',(req,res)=>{
    res.json({message:"hello from the server"})
})

app.use("/api/auth", authRouter)

app.listen(process.env.PORT,()=>{
    console.log("Listening....")
})