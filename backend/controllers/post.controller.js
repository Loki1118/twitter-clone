import User from "../models/user.model.js"
import cloudinary from "cloudinary"
import post from "../models/post.model.js"
import Notification from "../models/notification.js"

export const createPost = async(req, res) =>{
    try {
        const {text} = req.body
        let {img} = req.body
        const userId = req.user._id.toString()
        const user = await User.findById(userId)

        if(!user) {
            return res.status(400).json({"ERROR" : "User not Found"})
        }

        if(!text && !img) {
            return res.status(400).json({"ERROR" : "Post must have text or Image"})   
        }

        if(img) {
            const uploadedImg = await cloudinary.uploader.upload(img)
            img = uploadedImg.secure_url
        }

        const newPost = new post({
            user : userId,
            text,
            img
        })

        await newPost.save()
        res.status(200).json(newPost)

    }catch(error) {
        console.log(`Error in user update profile Page ${error}`)
        return res.status(500).json({"ERROR" : "Internal Server Error"})
   }
}

export const deletePost = async(req, res) => {
    try{
        const {id} = req.params
        const Post  = await post.findById(id)

        if(!Post) {
            return res.status(404).json({error : "Post not found"})
        }

        if(Post.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({error : "Not Authorized"})
        }

        if(Post.img) {
            await cloudinary.uploader.destroy(Post.img.split("/").pop().split(".")[0])
        }

        await post.findByIdAndDelete(id)
        return res.status(200).json({mes : "Deleted Successfully"})

    }catch(error) {
        console.log(`Error in user delete profile Page ${error}`)
        return res.status(500).json({"ERROR" : "Internal Server Error"})
   }
}

export const commentPost = async(req, res) => {
    try {
        const {id} = req.params
        const {text} = req.body
        const userId = req.user._id

        if(!text) {
            return res.status(400).json({error : "comments required"})
        }

        const Post = await post.findById(id)

        if(!Post) {
            return res.status(400).json({error : "Post not found"})
        }


        const comment = {
            user : userId,
            text
        }

        Post.comments.push(comment)
        await Post.save()
        return res.status(200).json(Post)

    }catch(error) {
        console.log(`Error in user comment profile Page ${error}`)
        return res.status(500).json({"ERROR" : "Internal Server Error"})
   }
}

export const likeUnlike = async(req, res) => {
    try{
        const userId = req.user._id
        const {id} = req.params
        const Post = await post.findById(id)

        if(!Post) {
            return res.status(404).json({error : "Post not found"})
        }

        const likeOrUnlike =  Post.likes.includes(id)

        if(likeOrUnlike) {
            //unlike it
            await post.updateOne({_id: id }, {$pull : {likes : userId}})
            await User.updateOne({_id : userId}, {$pull : {likedPosts : id}})
            return res.status(200).json({message : "unliked successfully"})
        }
        else {
            //like it
            Post.likes.push(userId)
            await User.updateOne({_id : userId}, {$push : {likedPosts : id}})
            await Post.save()
            

            const notification = new Notification({
                type : "like",
                from : userId,
                to : Post.user
            })

            await notification.save()
            return res.status(200).json({message : "liked successfully"})

        }


    }catch(error) {
        console.log(`Error in user like/unlike profile Page ${error}`)
        return res.status(500).json({"ERROR" : "Internal Server Error"})
   }
}


export const allPost = async(req, res) => {
    try {

        const Posts = await post.find().sort({createdAt : -1}).populate({
            path : "user",
            select : "password"
        })
        .populate({
            path: "comments.user",
            select : ["-password","-email", "-following","-followers","-bio","-link"]
        })
        if(Posts.length === 0) {
            return res.status(200).json([])
        }

        return res.status(200).json(Posts)

    }catch(error) {
        console.log(`Error in user getAll profile Page ${error}`)
        return res.status(500).json({"ERROR" : "Internal Server Error"})
   }
}


export const getLikedPosts = async(req, res) => {
    try{
        const userId = req.params.id;
        const user = await User.findById(userId)

        if(!user) {
            return res.status(404).json({error : "user not found"})
        }

        const likesPost = await post.find({_id : {$in : user.likedPosts}})
         .populate({
            path: "user",
            select : ["-password","-email", "-following","-followers","-bio","-link"]
        }) 
        .populate({
            path: "comments.user",
            select : ["-password","-email", "-following","-followers","-bio","-link"]
        })

        res.status(200).json({likesPost})

    }catch(error) {
        console.log(`Error in user get all Likedpost profile Page ${error}`)
        return res.status(500).json({"ERROR" : "Internal Server Error"})
   }
}

export const getFollowingPosts = async(req, res) => {
    try{
        const userId = req.user._id
        const user = await User.findById(userId)

        if(!user) {
            return res.status(404).json({error : "user not found"})
        }
        const following = user.following

        const feedPosts = await post.find({user : {$in : following}})
        .sort({createdAt  : -1})
         .populate({
            path: "user",
            select : ["-password","-email", "-following","-followers","-bio","-link"]
        }) 
        .populate({
            path: "comments.user",
            select : ["-password","-email", "-following","-followers","-bio","-link"]
        })

        return res.status(200).json(feedPosts)

    }catch(error) {
        console.log(`Error in user get all followingpost Page ${error}`)
        return res.status(500).json({"ERROR" : "Internal Server Error"})
   }
}

export const getUserPosts = async(req, res) => {
    try {

        const {username} =  req.params
        const user = await User.findOne({username})
        if(!user) {
            return res.status(404).json({error : "user not found"})
        }

        const userPosts = await post.find({user : user._id})
        .sort({createdAt  : -1})
         .populate({
            path: "user",
            select : ["-password","-email", "-following","-followers","-bio","-link"]
        }) 
        .populate({
            path: "comments.user",
            select : ["-password","-email", "-following","-followers","-bio","-link"]
        })

        return res.status(200).json(userPosts)

    }catch(error) {
        console.log(`Error in user get all user post Page ${error}`)
        return res.status(500).json({"ERROR" : "Internal Server Error"})
   }
}
