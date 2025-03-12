const { postValidatort } = require("../middlewares/validator");
const Post = require("../models/postsmodel");
const { post } = require("../routers/authrouter");

exports.getallpost = async (req, res) => {
  const { page } = req.query;
  const postsperpage = 10;

  try {
    let pageNum = 0
    if (page <= 1) {
      pageNum = 0;
    } else {
      pageNum = pageNum - 1;
    }
    const result = await Post.find()
      .sort({ createdAt: -1 })
      .skip(page * postsperpage)
      .limit(postsperpage)
      .populate({
        path: "userId",
        select: "email",
      });
      return res.status(200).json({success:true, message:"posts",data:result})
  } catch (error) {
    console.log(error);
  }
};
exports.getsinglepost = async (req,res)=>{
    const { _id } = req.query;
  try {
     const result = await Post.findOne({_id})
      .sort({ createdAt: -1 })
      .populate({
        path: "userId",
        select: "email",
      });
      return res.status(200).json({success:true, message:"post",data:result})
  } catch (error) {
    console.log(error);
  }
}

exports.CreatePost=async (req,res) => {
    const {userId} = req.user
    const { title, description} = req.body
    
    try {

        const {error, value} = await postValidatort.validate({title, description,userId})
        if (error) {
            return res.status(401).json({success:false, message:error.details[0].message})
        }
         const result = await Post.create({
            title,description, userId
         })
         return res.status(200).json({success:true, message:"created",data:result})

    } catch (error) {
        console.log(error);
    }
}


exports.UpdatePost=async (req,res) => {
    const {_id} = req.query
    const {userId } = req.user
    const { title, description} = req.body
        
    try {
        const {error, value} = await postValidatort.validate({title, description,userId})
        if (error) {
            return res.status(401).json({success:false, message:error.details[0].message})
        }

        const existingPost = await Post.findOne({_id})
        
        if(!existingPost){
            return res.status(401).json({success:false, message:"post does not exists"})

        }
        if(existingPost.userId.toString()!== userId){
            return res.status(401).json({success:false, message:"Unauthorized"})
        }

        existingPost.title = title
        existingPost.description = description;
       const result = await existingPost.save()
 
         return res.status(200).json({success:true, message:"updated",data:result})

    } catch (error) {
        console.log(error);
    }
}