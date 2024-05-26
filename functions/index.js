require("dotenv").config();

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const VrExistedEnum = require("./enum/vr.existed.enum");

admin.initializeApp();
const firestore = admin.firestore();

const app = express();
app.use(cors({origin: true}));

// 이 값은 JWT의 서명에 사용되는 비밀 키. 서버에서만 알려져 있어야하며, 클라이언트나 외부에 노출되면 안됨.
// 비밀키를 사용하여 토큰을 서명함으로써, 토큰이 손상되거나 변경되지 않았음을 검증할 수 있음
const SECRET_KEY = process.env.JWT_SECRET_KEY || "AngerAwayKey";
// 토큰에 대한 추가 옵션을 설정 = 24시간이 지나면 만료
const TOKEN_EXPIRATION = "24h";

// 회원가입
app.post("/signup", async (req, res) => {
  const {email, password, name, VrExisted} = req.body;

  // 필수 필드 검증
  if (!email || !password || !name || typeof VrExisted === "undefined") {
    return res.status(400).json({error: "All fields must be provided."});
  }

  // 'vrHave' 값이 유효한 enum 값인지 검증
  if (!Object.values(VrExistedEnum).includes(VrExisted)) {
    return res.status(400).json({error: "'VrExisted' is invalid."});
  }

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = await admin
        .auth()
        .createUser({email, password: hashedPassword});
    const userId = user.uid;

    const userData = {
      id: userId,
      name: name,
      email: email,
      password: hashedPassword,
      token: null,
      VrExisted: VrExisted,
    };

    // Save user data to Firestore
    await firestore.collection("user").doc(userId).set(userData);

    // Generate JWT token
    const token = jwt.sign({userId}, SECRET_KEY, {
      expiresIn: TOKEN_EXPIRATION,
    });

    return res.status(201).json({accessToken: token});
  } catch (error) {
    return res.status(400).json({error: error.message});
  }
});

// 로그인 API
app.post("/login", async (req, res) => {
  const {email} = req.body;

  try {
    const user = await admin.auth().getUserByEmail(email);
    const userId = user.uid;

    const userSnapshot = await firestore.collection("user").doc(userId).get();
    const userData = userSnapshot.data();

    if (!userData) {
      return res.status(404).json({error: "User not found"});
    }

    return res.status(200).json({message: "login Succeess"});
  } catch (error) {
    return res.status(400).json({error: error.message});
  }
});

exports.api = functions.https.onRequest(app);
