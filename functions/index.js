const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const serviceAccount = require("./anger-away-firebase-adminsdk-7ohma-b7af43874d.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();
app.use(cors({ origin: true }));
app.use(express.json()); // JSON 요청 본문을 파싱하기 위해 필요

// user.js에서 정의된 라우트를 가져옴
const userRoutes = require("./api/user/user");
app.use("/user", userRoutes);

exports.api = functions.https.onRequest(app);
