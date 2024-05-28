
// jwt 모듈 불러오기
const jwt = require("jsonwebtoken");

// 이 값은 JWT의 서명에 사용되는 비밀 키. 서버에서만 알려져 있어야하며, 클라이언트나 외부에 노출되면 안됨.
// 비밀키를 사용하여 토큰을 서명함으로써, 토큰이 손상되거나 변경되지 않았음을 검증할 수 있음
const SECRET_KEY = process.env.JWT_SECRET_KEY || "AngerAwayKey";
// 토큰에 대한 추가 옵션을 설정 = 24시간이 지나면 만료
const TOKEN_EXPIRATION = "24h";

//token발급
const generateToken = (payload) => {
    const token = jwt.sign(payload, SECRET_KEY, {
      expiresIn: TOKEN_EXPIRATION,
    });
  
    return token;
  }; 
  
  //기존 토큰을 사용하여 새로운 토큰을 생성하는 함수
  const refreshToken = (token) => {
    try {
      // 기존 토큰의 유효성 검사 및 디코딩
      const decoded = jwt.verify(token, SECRET_KEY);
  
      //새로운 페이로드 생성
      const payload = {
        userId: decoded.userId
      };
  
    //새로운 토큰 생성
    const newToken = generateToken(payload);
    return newToken;
    } catch(error) {
      //토큰 새로 고침 중 오류 발생 시 출력
      return res.status(400).json({error: error.message});
    };
  };
  

  module.exports = {generateToken, refreshToken}