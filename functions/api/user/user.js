const express = require("express");
const bcrypt = require("bcrypt");
const admin = require("firebase-admin");
const firestore = admin.firestore();
const VrExistedEnum = require("../../enum/vr.existed.enum");
const { generateToken, refreshToken } = require("./jwt");

const router = express.Router();

// 회원가입
router.post("/signup", async (req, res) => {
  const { email, password, name, VrExisted } = req.body;

  // 필수 필드 검증
  if (!email || !password || !name || typeof VrExisted === "undefined") {
    return res.status(400).json({ error: "All fields must be provided." });
  }

  // 'VrExisted' 값이 유효한 enum 값인지 검증
  if (!Object.values(VrExistedEnum).includes(VrExisted)) {
    return res.status(400).json({ error: "'VrExisted' is invalid." });
  }

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = await admin.auth().createUser({ email, password });
    const userId = user.uid;

    const userData = {
      id: userId,
      name: name,
      email: email,
      password: hashedPassword,
      VrExisted: VrExisted,
    };

    // Save user data to Firestore
    await firestore.collection("user").doc(userId).set(userData);

    // Generate JWT token
    const token = generateToken({ userId: userId, email: email });

    // Update userData with token
    await firestore.collection("user").doc(userId).update({ token: token });

    return res.status(201).json({ accessToken: token });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// 로그인 API
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await admin.auth().getUserByEmail(email);
    const userId = user.uid;

    const userSnapshot = await firestore.collection("user").doc(userId).get();
    const userData = userSnapshot.data();

    if (!userData) {
      return res.status(404).json({ error: "User not found" });
    }

    // 비밀번호 검증
    const passwordMatch = await bcrypt.compare(password, userData.password);
    if (!passwordMatch) {
      return res.status(400).json({ error: "Invalid password" });
    }

    // Generate JWT token
    const token = generateToken({ userId: userId, email: email });

    // Update userData with new token
    await firestore.collection("user").doc(userId).update({ token: token });

    return res.status(200).json({ accessToken: token, message: "Login successful" });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

module.exports = router;
