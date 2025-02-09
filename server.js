require('dotenv').config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors()); // อนุญาตให้ Frontend เรียก API นี้ได้
app.use(express.json()); // รองรับ JSON Payload

const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN; // ใช้จาก .env

// สร้าง API Endpoint สำหรับส่งข้อความไปยัง LINE
app.post("/send-line-message", async (req, res) => {
    try {
        const { userId, message } = req.body;

        const response = await axios.post("https://api.line.me/v2/bot/message/push", {
            to: userId,
            messages: [{ type: "text", text: message }]
        }, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${LINE_ACCESS_TOKEN}`
            }
        });

        res.json({ success: true, response: response.data });
    } catch (error) {
        console.error("Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, error: error.response ? error.response.data : error.message });
    }
});

app.listen(3000, () => console.log("Server running on port 3000"));
