const express = require('express');
const axios = require('axios');

const router = express.Router();
const URL = 'http://localhost:8002/v1';
axios.defaults.headers.origin = 'http://localhost:4000'; // origin 헤더 추가. 요청의 헤더 origin 값을 localhost:4000으로 설정. 어디서 요청을 보내는지 파악하기 위해 사용. 나중에 주소가 바뀌면 이 값도 따라서 바꾸면 됨. 

const request = async (req, api) => {
  try {
    if(!req.session.jwt) { //세션에 토큰이 없으면 clientSecret을 사용해 토큰을 발급받는 요청 보냄. 발급 받은 후에는 토큰을 이용해 API 요청을 보냄.
      const tokenResult = await axios.post(`${URL}/token`, {
        clientSecret : process.env.CLIENT_SECRET,
      });
      req.session.jwt = tokenResult.data.token; // 세션에 토큰 저장(토큰 재사용을 위해 저장)
    }
    return await axios.get(`${URL}${api}`, {  
      headers: {authorization: req.session.jwt},
    }); // API 요청
  } catch(error) { // 토큰이 만료되면 419 에러가 발생. 이때는 토큰을 지우고 request 함수를 재귀적으로 호출하여 다시 요청을 보냄
    if(error.response.status === 419) { // 토큰 만료 시 토큰 재발급 받기
      delete req.session.jwt;
      return request(req, api);
    } // 419 외의 다른 에러면
    return error.response;
  }
};
// request함수는 NodeBird API에 요청을 보내는 함수. 자주 재사용되므로 함수로 분리함. 

router.get('/mypost', async(req, res, next) => {
  try {
    const result = await request(req, '/posts/my');
    res.json(result.data);
  } catch(error) {
    console.error(error);
    next(error);
  }
});
// GET /mypost 라우터는 API를 사용해 자신이 작성한 포스트를 JSON 형식으로 가져오는 라우터임. 현재는 JSON으로만 응답하지만 템플릿 엔진을 사용해 화면을 렌더링 할 수도 있음. 

router.get('/search/:hashtag', async(req, res, next) => {
  try{
    const result = await request(
      req, `/posts/hashtag/${encodeURIComponent(req.params.hashtag)}`,
    );
    res.json(result.data);
  } catch(error) {
    if(error.code) {
      console.error(error);
      next(error);
    }
  }
});
// GET /search/:hashtag 라우터는 API를 사용해 해시태그를 검색하는 라우터임


// router.get('/test', async(req, res, next)=>{
//   //토큰 테스트 라우터
//   try{
//     if(!req.session.jwt) { //세션에 토큰이 없으면 토큰 발급 시도
//       const tokenResult = await axios.post('http://localhost:8002/v1/token', {
//         clientSecret: process.env.CLIENT_SECRET,
//       });
//       if(tokenResult.data && tokenResult.data.code === 200) { //토큰 발급 성공
//         req.session.jwt = tokenResult.data.token; //세션에 토큰 저장
//       } else { // 토큰 발급 실패
//         return res.json(tokenResult.data); // 실패 사유 응답
//       }
//     }
//     // 발급 받은 토큰 테스트
//     const result = await axios.get('http://localhost:8002/v1/test', {
//       headers: { authorization: req.session.jwt},
//     });
//     return res.json(result.data);
//   }catch(error) {
//     console.log(error);
//     if(error.response.status === 419) { //토큰 만료시
//       return res.json(error.response.data);
//     }
//     return next(error);
//   }
// });

module.exports = router;