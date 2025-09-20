import express from "express"
import protectRoute from "../middleware/protectRoute.js"
import { getprofile, followUnfollow, getSuggested, updateUser } from "../controllers/user.controller.js"

const router = express.Router()

router.get("/profile/:username",protectRoute, getprofile)
router.post("/follow/:id",protectRoute, followUnfollow)
router.get("/suggested",protectRoute, getSuggested)
router.post("/update",protectRoute, updateUser)

export default router;