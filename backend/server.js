//const express = require('express')
import express from "express"
import dotenv from "dotenv"
import cookieParser from "cookie-parser"
import postRoute from "./routes/post.route.js"
import authRoute from "./routes/auth.route.js"
import userRoute from "./routes/user.route.js"
import connectDB from "./db/connectDB.js"
import cloudinary from "cloudinary"
import notificationRoute from "./routes/notification.route.js"
import Notification from "./models/notification.js"
import path from "path"

dotenv.config()
cloudinary.config({
    cloud_name:process.env.CLOUDINARY_NAME,
    api_key :process.env.CLOUDINARY_API_KEY,
    api_secret_key:process.env.CLOUDINARY_API_SECRET_KEY
})

const app = express()
const PORT = process.env.PORT;
const __dirname = path.resolve();

app.use(express.json());
app.use(cookieParser())


app.use('/api/auth', authRoute)
app.use('/api/user', userRoute)
app.use('/api/post', postRoute)
app.use('/api/notification', notificationRoute)


if (process.env.NODE_ENV === "production") {
	app.use(express.static(path.join(__dirname, "/frontend/build")));

	app.get("*", (req, res) => {
		res.sendFile(path.resolve(__dirname, "frontend", "build", "index.html"));
	});
}

app.listen(PORT, () => {
    console.log(`server is running in port ${PORT}`)
    connectDB()
})