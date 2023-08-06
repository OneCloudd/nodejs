const express = require('express');
const app = express();
// POST요청으로서버에 데이터 전송하고 싶으면 body-parser가 필요
app.use(express.urlencoded({extended: true})) 
app.set('view engine', 'ejs');
// public 폴더사용하기 위한 코드
app.use('/public', express.static('public'));
// HTML에서 PUT/DELETE 요청하기 위한 코드
const methodOverride = require('method-override');
app.use(methodOverride('_method'));
// 환경변수
require('dotenv').config();
// ObjectID쓰기위한 코드
const {ObjectId} = require('mongodb');
// 몽고DB와 연결해주는 코드
var db;
const MongoClient = require('mongodb').MongoClient;
MongoClient.connect(process.env.DB_URL, function(에러, client){
    if (에러) return console.log(에러);

    // todoapp이라는 db에 연결
    db = client.db('todoapp');

    // post collection에 데이터 insert
    //db.collection('post').insertOne( {이름 : 'John', _id : 100, 나이 : 20}, function(에러, 결과){
    //    console.log('저장 완료')
    //});

    //서버띄우는 코드 여기로 옮기기
    app.listen(process.env.PORT, function(){
      console.log('listening on 8080')
    });
});


//누군가가 /pet 으로 방문을 하면 pet 관련 된 안내문을 띄워주자
app.get('/pet', function(req, res){
    res.send('펫용품을 쇼핑할 수 있는 페이지입니다.');
});

// function 이랑 => 같음 (신 문법)
app.get('/beauty', (req, res) => {
    res.send('뷰티용품을 쇼핑할 수 있는 페이지입니다.');
});

// /하나만 쓰면 홈, html파일을 보내는 코드
app.get('/', function(req, res){
    res.render('index.ejs')
});

// /fail
app.get('/fail', function(req,res){
    res.send('로그인 실패입니다.')
});

// write.html
app.get('/write', function(req, res){
    res.render('write.ejs')
    //res.sendFile(__dirname + '/write.html');
});


// /list 경로로 GET요청으로 접속하면 실제 DB에 저장된 데이터들이 출력되는 HTML을 보여줌
app.get('/list', function(req, res){
// DB에 저장된 post라는 collection안의 여러 데이터( find().toArray()는 여러개 )를 읽어옴 , html 출력보다 DB데이터 읽어오는게 먼저
db.collection('post').find().toArray(function(에러, 결과){
    console.log(결과);
// 읽어온 데이터를 ejs파일로 전달
res.render('list.ejs', { posts : 결과 });
});
});

// /detail로 접속하면 detail.ejs 출력
app.get('/detail/:id', function(req, res){
    db.collection('post').findOne({_id : parseInt(req.params.id)}, function(에러, 결과){
        console.log(결과);
        res.render('detail.ejs', { data : 결과 });
    });
});

// 수정페이지에 기존에 있는 데이터 보여주기
app.get('/edit/:id', function(req,res){
    db.collection('post').findOne({_id : parseInt(req.params.id)}, function(에러, 결과){
        console.log(결과);
        res.render('edit.ejs', { post : 결과 });
    });
    
});

// 수정
app.put('/edit', function(req, res){
    db.collection('post').updateOne({_id : parseInt(req.body.id)},{ $set : {제목 : req.body.title, 날짜 : req.body.date}},function(에러, 결과){
        console.log('수정완료');
        res.redirect('/list');
    });
});

// 세션 관련 라이브러리
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
app.use(session({secret : '비밀코드', resave : true, saveUninitialized : false}));
app.use(passport.initialize());
app.use(passport.session());

// 로그인
app.get('/login', function(req, res){
    res.render('login.ejs');
});
// passport - 로그인하면  local방식으로 아이디 비번 검사
app.post('/login', passport.authenticate('local', {
    failureRedirect : '/fail'
}), function(req, res){
    res.redirect('/');
});

// session이 있는사람만 들어갈 수 있는 mypage
app.get('/mypage', 로그인했니, function(req,res){
    console.log(req.user) // mypage접속 할 때 마다 user세션 출력
    res.render('mypage.ejs', {사용자 : req.user})
});

// 미들웨어인 로그인했니 함수, 로그인 세션이 있다면 항상 req.user가 있음
function 로그인했니(req, res, next){
    if (req.user){
        next()
    } else{
        res.send('로그인하지 않았습니다.')
    }
};

// Strategy 인증
passport.use(new LocalStrategy({
    usernameField: 'id', // form에 담긴 name="id" 인 값
    passwordField: 'pw',
    session: true, // 로그인 후 세션 저장
    passReqToCallback: false,
  }, function (입력한아이디, 입력한비번, done) { // 여기부터 사용자 id,pw 검증
    //console.log(입력한아이디, 입력한비번);
    db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
      if (에러) return done(에러)
  
      if (!결과) return done(null, false, { message: '존재하지않는 아이디요' })
      if (입력한비번 == 결과.pw) {
        return done(null, 결과)
      } else {
        return done(null, false, { message: '비번틀렸어요' })
      }
    })
  }));

// id를 이용해서 세션 저장시키는 코드(로그인 성공 시 작동)
passport.serializeUser(function(user, done){
    done(null, user.id)
});

// deserializeUser : 이 세션 데이터를 가진 사람을 DB에서 찾음(마이페이지 접속 시 작동)
passport.deserializeUser(function(아이디, done){
    db.collection('login').findOne({id : 아이디}, function(에러, 결과){
    done(null, 결과)
    })
});

// 회원가입 ( passport 아래 있어야함 )
app.post('/register', function(req,res){
    db.collection('login').insertOne({id : req.body.id, pw : req.body.pw}, function(에러, 결과){
        res.redirect('/')
    })
});

// 어떤 사람이 /add 경로로 POST 요청을 하면 ??를 해주세요 (passport 아래있어야 req.user._id 쓸 수 있음)
// input에 적은 정보는 req에 저장됨
app.post('/add', function(req, res){
    // body , body안에 name=title인 요소를 로그에 출력
    console.log(req.body);
    console.log(req.body.title);
    res.redirect('/');
    // 개시물 총 개수(colletion 'counter') 데이터 1개만 읽어오기
    db.collection('counter').findOne({name : '게시물 개수'}, function(에러, 결과){
        console.log(결과.totalPost);
        var 총게시물개수 = 결과.totalPost;
        var 저장할것 = { _id : 총게시물개수 + 1, 작성자 : req.user._id, 제목 : req.body.title, 날짜 : req.body.date}

        // DB에 저장
        db.collection('post').insertOne( 저장할것, 
            function(에러, 결과){
            console.log('body 저장완료');
            // counter collection에 있는 totalPost라는 항목도 1 증가시킴(수정)
            db.collection('counter').updateOne({name : '게시물 개수'}, { $inc : {totalPost : 1}}, function(에러, 결과){
                if(에러){return console.log(에러)}
            });
        });

    });

  });

// 게시물 삭제


app.delete('/delete', function (요청, 응답) {
    요청.body._id = parseInt(요청.body._id);
    //요청.body에 담겨온 게시물번호를 가진 글을 db에서 찾아서 삭제해주세요
    db.collection('post').deleteOne({_id : 요청.body._id, 작성자 : 요청.user._id }, function (에러, 결과) {
      console.log('삭제완료');
      console.log('에러',에러)
      응답.status(200).send({ message: '성공했습니다' });
    })
});


// query string과 일치하는 DB검색
app.get('/search', (req,res) => {
    var 검색조건 = [
        {
            $search: {
              index: 'titleSearch',
              text: {
                query: req.query.value,
                path: '제목'  // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
              }
            }
          }
          //,{ $project :{제목 : 1, _id : 0, score : { $meta : "searchScore" }}} //검색을 많이하면 그 검색어 scroe를 높게줘서 정렬함
          //,{ $sort : {_id : 1 }} //검색결과 정렬, {_id : -1 } 하면 역순정렬
          //,{ $limit : 10 } // 검색 리스트 제한
    ]
    console.log(req.query.value) // query string 출력
    db.collection('post').aggregate(검색조건).toArray((에러, 결과)=>{
        console.log(결과);
        res.render('search.ejs',{ 검색결과 : 결과});
    });
});

// route기능
app.use('/shop', require('./routes/shop.js'));
app.use('/board/sub', require('./routes/board.js'));

// multer라이브러리 사용
let multer = require('multer');
var storage = multer.diskStorage({

  destination : function(req, file, cb){
    cb(null, './public/image')
  },
  filename : function(req, file, cb){
    cb(null, file.originalname )
  }

});

var upload = multer({storage : storage});


// 업로드
app.get('/upload', function(req, res){
    res.render('upload.ejs')
});

// 이미지업로드, upload를 미들웨어처럼 실행
app.post('/upload', upload.single('upload'), function(요청, 응답){
    응답.send('업로드완료')
}); 

app.get('/image/:imageName',function(req, res){
    res.sendFile(__dirname + '/public/image/' + req.params.imageName)
});


app.get('/chat', 로그인했니, function(요청, 응답){ 

    db.collection('chatroom').find({ member : 요청.user._id }).toArray().then((결과)=>{
      console.log(결과);
      응답.render('chat.ejs', {data : 결과})
    })
  
  }); 

// 채팅방 출력
app.post('/chatroom', function(req, res){

    var 저장할거 = {
      title : req.body.당한사람id + '님과의 채팅방',
      member : [ObjectId(req.body.당한사람id), req.user._id],
      date : new Date()
    }
  
    db.collection('chatroom').insertOne(저장할거).then(function(결과){
      res.send('저장완료')
    });
  });

  // 채팅 메세지 발행
  app.post('/message', 로그인했니, function(요청, 응답){
    var 저장할거 = {
      parent : 요청.body.parent,
      userid : 요청.user._id,
      content : 요청.body.content,
      date : new Date(),
    }
    db.collection('message').insertOne(저장할거)
    .then((결과)=>{
      응답.send(결과);
    })
  }); 

  //서버와 유저간 실시간 소통채널 열기 ,serversendevent라고함
  app.get('/message/:parentid', 로그인했니, function(요청, 응답){

    응답.writeHead(200, {
      "Connection": "keep-alive",
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    });
  
    db.collection('message').find({ parent: 요청.params.parentid }).toArray()
    .then((결과)=>{
      console.log(결과);
      응답.write('event: test\n');
      응답.write(`data: ${JSON.stringify(결과)}\n\n`);
      // JSON.stringify(결과) :리스트형식인 '결과를' 문자열로 바꾸는 코드
    });
  
    // db에서 변동사항이 생기면 바로 적용시키는 코드
    // const 찾을문서 = [
    //   { $match: { 'fullDocument.parent': 요청.params.parentid } }
    // ];
  
    // const changeStream = db.collection('message').watch(찾을문서);
    // changeStream.on('change', result => {
    //   console.log(result.fullDocument);
    //   var 추가된문서 = [result.fullDocument];
    //   응답.write(`data: ${JSON.stringify(추가된문서)}\n\n`);
    // });
  
  });
