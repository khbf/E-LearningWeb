var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser')
var app = express();
const userlogin = require('./controllers/islogin');
const session = require('express-session');
var passport = require('passport');
var localStrategy = require('passport-local').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const config = require('./controllers/config');
passport.serializeUser(function (user, done) {
    done(null, user);
});
passport.deserializeUser(function (obj, done) {
    done(null, obj);
});
passport.use(new FacebookStrategy({
    clientID: config.facebook_api_key,
    clientSecret: config.facebook_api_secret,
    callbackURL: config.callback_url
},
    function (accessToken, refreshToken, profile, done) {
        process.nextTick(function () {
            console.log(`https://graph.facebook.com/${profile.id}/picture?width=200&height=200&access_token=${accessToken}`)
            return done(null, profile, accessToken);
        });
    }
));
app.use(passport.initialize());
app.use(passport.session());
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: 'somesecret',
    cookie: { maxAge: null }
}));
// view engine setup
app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'jade');
//set public static forder
app.use(express.static(__dirname + '/public'));


let expressHbs = require('express-handlebars');
app.engine('hbs', expressHbs({
    extname: 'hbs',
    defaultlayout: 'main',
    layoutsDir: __dirname + '/views/layouts',
    partialsDir: __dirname + '/views/partials',
}));

app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
let Cart = require('./controllers/giohang')
app.use((req, res, next) => {
    var cart = new Cart(req.session.cart ? req.session.cart : {});
    req.session.cart = cart;
    res.locals.totalQuantity = cart.totalQuantity;
    res.locals.fullname = req.session.user ? req.session.fullname : '';
    res.locals.username = req.session.user ? req.session.username : '';
    res.locals.isLoggedIn = req.session.user ? true : false;
    res.locals.isAdmin = req.session.isAdmin ? true : false;
    next();
})

/*-----------------------------------router admin-----------------------------------*/
app.use(express.static(path.join(__dirname, '/public')));
var AdminRouter = require('./routers/Radmin');
app.use('/admin', AdminRouter);
/*--------------------------------end router admin-----------------------------------*/
app.use('/courses', require('./routers/coursesRouter'));
app.use('/', require('./routers/indexRouter'));

app.use('/', require('./routers/userRouter'));
app.get("/cart", (req, res) => {
    var cart = req.session.cart;
    res.locals.cart = cart.getCart();
    console.log(cart)
    res.render("cart");
});

const { Client } = require('pg');
const db = require('./utils/db');
const { query } = require('express');

app.post('/cart', async (req, res) => {
    const client = new Client(db);
    await client.connect();
    var cuorseid = req.body.id;
    var quantity = isNaN(req.body.quantity) ? 1 : req.body.quantity;
    const query = {
        text: "SELECT * from khoahoc where courseid = $1::text",
        values: [cuorseid],
    };
    
    const khoahoc = await client.query(query);
    console.log(khoahoc.rows[0].ten)
    var cartiem = req.session.cart.add(khoahoc.rows[0].ten,cuorseid,quantity)
})

app.get("/about", (req, res) => {
    var cart = req.session.cart;
    res.locals.cart = cart.getCart();
    console.log(cart)
    res.render("about_test");
});
//app.use('/cart',require('./routers/Rcart'));
/*-----------------------------------error-----------------------------------*/
// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });

//error handler
//  app.use(function(err, req, res, next) {
//    // set locals, only providing error in development
//    res.locals.message = err.message;
//    res.locals.error = req.app.get('env') === 'development' ? err : {};

//    // render the error page
//    res.status(err.status || 500);
//    res.render('error');
//  });
/*----------------------------------------------------------------------*/
app.set('port', process.env.PORT || 3000);
app.listen(app.get('port'), () => {
    console.log(`server is running  at port ${app.get('port')}`);
});
module.exports = app;
