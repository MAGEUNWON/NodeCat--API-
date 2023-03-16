const express = require('express');
const cookieParser = require('cookie-parser'); // 쿠키를 파싱하는 미들웨어
const morgan = require('morgan'); //HTTP 요청 로깅 미들웨어
const session = require('express-session'); //세션 관리 미들웨어
const nunjucks = require('nunjucks'); 
const dotenv = require('dotenv'); //.env 파일로부터 환경변수를 가져오는 라이브러리

dotenv.config(); //환경 변수를 설정

//라우터를 설정.
const indexRouter = require('./routes');

const app = express();
app.set('port', process.env.PORT || 4000);
app.set('view engine', 'html');
nunjucks.configure('views', {
  express: app,
  watch: true,
});

app.use(morgan('dev'));
app.use(cookieParser(process.env.COOKIE_SECRET));

//express 애플리케이션에 세션 미들웨어를 추가하는 부분. 세션 미들웨어는 사용자의 상태 정보를 유지하기 위해 사용됨. 
app.use(session({
  resave: false, // 요청이 왔을 때 세션에 수정사항이 생기지 않아도 다시 저장할지 여부를 나타내는 불리언 값. 'false'로 설정하면 요청이 왔을 때 세션에 변경 사항이 없으면 저장하지 않음. 
  saveUninitialized:false, // 새로운 세션을 만들 때 초기화되지 않은 세션을 저장할지 여부를 나타내는 불리언 값. 'false'로 설정하면 초기화되지 않는 세션은 저장하지 않음.
  secret: process.env.COOKIE_SECRET, // 세션 ID를 암호화하는 데 사용되는 문자열. 세션 ID를 암호화하여 보안을 강화함. 이 코드에서 '.env' 파일에서 'COOKIE_SECRET'환경 변수를 가져와 사용함.
  cookie: { // 세션 쿠키에 대한 옵션을 포험하는 객체 'httpOnly' 옵션은 쿠키가 JavaScript로 접근할 수 없도록 함. 'secure'옵션은 HTTPS 프로토콜에서만 쿠키가 전송될 수 있도록 함. 이 코드에서 secure 옵션이 'false'로 설정되어 있으므로 HTTPS를 사용하지 않아도 쿠키가 전송될 수 있음. 
    httpOnly: true,
    secure: false,
  },
}));

app.use('/', indexRouter); // '/' 경로로 요청이 들어오면 indexRouter를 사용

//404 에러 핸들러를 설정. 존재하지 않는 경로에 대한 요청이 들어오면 404 에러를 발생시킴
app.use((req, res, next)=> {
  const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  error.status = 404;
  next(error)
});

//에러 핸들러를 설정. 에러가 발생하면 페이지를 렌더링 함
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV !== 'production' ?  err : {};
  res.status(err.status || 500);
  res.render('error');
});

//서버를 실행함. 
app.listen(app.get('port'), () => {
  console.log(app.get('port'), '번 포트에서 대기 중')
});

