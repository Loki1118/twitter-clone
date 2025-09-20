import mongoose, { mongo } from "mongoose"
import User from "../models/user.model.js"
import bcrypt from "bcryptjs"
import { Profiler } from "react"
import generateToken from "../utils/generateToken.js"

export const signup = async (req, res) => {
   try {

    const {username, fullname, email, password} = req.body

    const emailRegex =  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

    if(!emailRegex.test(email)) {
        return res.status(400).json({error : "Invalid email format"})
    }

    const existingEmail  = await User.findOne({email})
    const existingUser  = await User.findOne({username}) 

    if(existingEmail || existingUser) {
        return res.status(400).json({error : "Email ID or Username is already Existing"})
    }

    if(!password || password.length < 6) {
        return res.status(400).json({error : "Password should be min 6 char "})
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password.toString(), salt)

    const newUser = new User(
        {
            username,
            fullname,
            email,
            password : hashedPassword
        }
    )

    if(newUser) {
        generateToken(newUser._id, res)
        await newUser.save()
        res.status(200).json(
            {
                _id : newUser._id,
                username : newUser.username,
                fullname : newUser.fullname,
                email : newUser.email,
                profileImg: newUser.profileImg,
                coverImg: newUser.coverImg,
                following: newUser.following,
                followers: newUser.followers,
                bio: newUser.bio,
                link: newUser.link
            })     
    }
    else {
        return res.status(400).json({error : "new user details are invalid"})
    }

   } catch(error) {
    console.log(`Error in signup Page ${error}`)
    res.status(500).json({"ERROR" : "Internal Server Error"})
   }
}

export const login = async (req, res) => {
    try {
        const {username, password} = req.body

        const user = await User.findOne({username})

        if (!user) {
            return res.status(400).json({ error: "username is mandatory" });
        }

        const pw = await bcrypt.compare(password, user.password)
        
        if(!pw) {
            return res.status(400).json({error : "password is incorrect"})
        }

        generateToken(user._id, res)

        res.status(200).json(
            {
                _id : user._id,
                username : user.username,
                fullname : user.fullname,
                email : user.email,
                profileImg: user.profileImg,
                coverImg: user.coverImg,
                following: user.following,
                followers: user.followers,
                bio: user.bio,
                link: user.link
            })

    }catch(error) {
    console.log(`Error in login Page ${error}`)
    res.status(500).json({"ERROR" : "Internal Server Error"})
   }
}

export const logout = async (req, res) => {
    try {
        res.cookie("jwt", "", {maxAge : 0})
        res.status(200).json({message : "Logout Successfully"})
    } catch(error) {
    console.log(`Error in logout Page ${error}`)
    res.status(500).json({"ERROR" : "Internal Server Error"})
   }
}


export const getme = async (req, res) => {
    try{ 
        const user = await User.findOne({_id : req.user._id}).select("-password")
        res.status(200).json(user)
    } catch(error) {
        console.log(`Error in getme Page ${error}`)
        res.status(500).json({"ERROR" : "Internal Server Error"})
   }
}