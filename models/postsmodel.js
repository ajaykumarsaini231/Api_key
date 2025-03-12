const mongoose = require("mongoose");

const postSchema = mongoose.Schema({
    title:{
        type:String,
        require:[true, 'title is required'],
        trim:true,
    },
    description:{
        type:String,
        require:[true, 'description is required'],
        trim:true,
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        require:true
    }
},{
    timestamps:true,
})

module.exports = mongoose.model('Post', postSchema)