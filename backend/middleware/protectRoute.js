import User from "../models/user.model.js"
import jwt from "jsonwebtoken"
const protectRoute = async (req, res, next) => {
    try{
        const token = req.cookies?.jwt;

        if(!token) {
            return res.status(401).json({ ERROR: "Not authorized, token missing" })
        }

        const decode = jwt.verify(token, process.env.JWT_SECRET)

        if(!decode) {
            return res.status(401).json({ ERROR: "Not authorized, invalid token" })
        }
        
        const user = await User.findById(decode.userId).select("-password")

        if(!user) {
            return res.status(401).json({"ERROR" : "user is not available"})
        }
        req.user = user
        next()

    }catch(error) {
        console.log(`Error in protectRoute Page ${error}`)
        return res.status(500).json({"ERROR" : "Internal Server Error"})
   }
}

export default protectRoute;