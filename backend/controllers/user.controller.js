import User from "../models/user.model.js"
import Notification from "../models/notification.js"
import bcrypt from "bcryptjs"
import cloudinary from "cloudinary"

export const getprofile = async(req, res)=> {
    try{
        const {username} = req.params
        const user = await User.findOne({username})

        if(!user) {
            return res.status(400).json({"error":"User not found"}) 
        }

        return res.status(200).json(user);

    }catch(error) {
        console.log(`Error in user profile Page ${error}`)
        res.status(500).json({"ERROR" : "Internal Server Error"})
   }
}


export const followUnfollow = async(req, res) => {
    const {id} = req.params
    const userToModify = await User.findById(id)
    const currentUser = await User.findById(req.user._id)

    if(id === req.user._id) {
        return res.status(400).json({"error": "you cant unfollow or follow yourself"})
    }

    if(!currentUser || !userToModify) {
        return res.status(400).json({"error": "User Not Found"})
    }

    const isFollowing = currentUser.following.includes(id)

    if(isFollowing) {
        //unfollow
        await User.findByIdAndUpdate({_id : id}, {$pull : {followers : req.user._id}})
        await User.findByIdAndUpdate({_id : req.user._id}, {$pull : {following : id}})
        //send notificaiton
        return res.status(200).json({"message" : "unfollow successfully"})

    }
    else {
        //follow
        await User.findByIdAndUpdate({_id : id}, {$push : {followers : req.user._id}})
        await User.findByIdAndUpdate({_id : req.user._id}, {$push : {following : id}})
        //send notification
        const newnotificaiton = new Notification({
            type :"follow",
            from : req.user._id,
            to: id
        }) 
        await newnotificaiton.save()
        return res.status(200).json({"message" : "follow successfully"})
    }
}


export const getSuggested = async(req, res) => {
    try {

        const userId = req.user._id
        const userFollowedByMe = await User.findById({_id:userId}).select("-password")

        const users = await User.aggregate([
            { $match : {_id : {$ne : userId}} },
            { $sample : {size : 10} }
        ])

        const filteredUser = users.filter((user) => !userFollowedByMe.following.includes(user._id))
        const suggestedUser = filteredUser.slice(0,4)
        suggestedUser.forEach((user) => (user.password = null))
        return res.status(200).json(suggestedUser)


    }catch(error) {
        console.log(`Error in user suggestion Page ${error}`)
        res.status(500).json({"ERROR" : "Internal Server Error"})
   }
}

export const updateUser = async(req, res) => {
    try {
        const userId = req.user._id
        
        // ✅ validate req.body first
        if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: "Request body is missing" });
        }

        const {username, email, fullname, currentPassword, newPassword, bio, link} = req.body
        let {profileImg, coverImg} = req.body

        let user = await User.findById(userId)

        if(!user) {
            return res.status(400).json({error : "User not found"})
        }

        if((!newPassword && currentPassword)||(!currentPassword && newPassword) || (!currentPassword && !newPassword)) {
            return res.status(400).json({error : "New password and Current password is required"})
        }

        // ✅ password update logic
        if (currentPassword || newPassword) {
            if (!currentPassword || !newPassword) {
                return res.status(400).json({ error: "Both currentPassword and newPassword are required" });
            }

            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ error: "Current password is incorrect" });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({ error: "newPassword must be at least 6 characters" });
            }

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }

        if(profileImg) {
            if(user.profileImg){
                await cloudinary.uploader.destroy(user.profileImg.split("/").pop().split(".")[0])
            }
            const updatedprofile = await cloudinary.uploader.upload(profileImg)
            profileImg = updatedprofile.secure_url
        }

        if(coverImg) {
            if(user.coverImg){
                await cloudinary.uploader.destroy(user.profileImg.split("/").pop().split(".")[0])
            }
            const updatedprofile = await cloudinary.uploader.upload(coverImg)
            coverImg = updatedprofile.secure_url
        }


        user.fullname = fullname || user.fullname
        user.username = username || user.username
        user.email = email || user.email
        user.bio = bio || user.bio
        user.link = link || user.link
        user.profileImg = profileImg || user.profileImg
        user.coverImg = coverImg || user.coverImg

        user  = await user.save()
        //password is ull after saving in mongoDB
        user.password = null
        return res.status(200).json(user)

    }catch(error) {
        console.log(`Error in user update profile Page ${error}`)
        res.status(500).json({"ERROR" : "Internal Server Error"})
   }
}



