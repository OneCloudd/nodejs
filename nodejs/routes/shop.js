var router = require('express').Router();

// 미들웨어인 로그인했니 함수, 로그인 세션이 있다면 항상 req.user가 있음
function 로그인했니(req, res, next){
    if (req.user){
        next()
    } else{
        res.send('로그인하지 않았습니다.')
    }
};

// 모든 router들에게 미들웨어 적용하는 코드( 첫번째 파라미터가 있으면 /shirt 경로에만 미들웨어 적용)
router.use('/shirts', 로그인했니);

router.get('/shirts', function(요청, 응답){
    응답.send('셔츠 파는 페이지입니다.');
 });
 
 router.get('/pants', function(요청, 응답){
    응답.send('바지 파는 페이지입니다.');
 });

 module.exports = router;
 