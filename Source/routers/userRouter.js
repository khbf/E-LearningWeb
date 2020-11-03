let express = require("express");

let router = express();
const db = require("../utils/db");
const { Client } = require("pg");
const path = require("path");
const upload = require("../Middleware/uploadMiddleware");
const Resize = require("../models/Resize");
const { isNull } = require("util");
const { array } = require("../Middleware/uploadMiddleware");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const passport = require('passport')
const userlogin = require("../controllers/islogin");

router.get('/auth/facebook', passport.authenticate('facebook'));

router.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), function (req, res) {
        console.log(req.authInfo)
        const client = new Client(db);
        client.connect();
        const usernameid = req.user.id
        const hoten = req.user.displayName
        const image = `https://graph.facebook.com/${req.user.id}/picture?width=200&height=200&access_token=${req.authInfo}`
        const queryktuser = {
            text: "SELECT * FROM users where usernameid=$1::text",
            values: [usernameid],
        };
        const insertuser = {
            text:
                "INSERT INTO USERS(usernameid,ten,sokhoahochoanthanh,lockuser,isadmin,imagepath) VALUES ($1::text,$2::text,0,false,false,$3::text)",
            values: [usernameid, hoten, image],
        };
        client.query(queryktuser, (err, result) => {
            if (err) {
                console.error(err.stack);
            } else {
                if (result.rowCount === 0) {

                    client.query(insertuser);
                    req.session.isAdmin = false;
                    req.session.user = usernameid;
                    req.session.fullname = hoten;
                    res.redirect("/");
                } else {
                    if (result.rows[0].lockuser) {
                        res.render("login", {
                            message: "Tài khoản đã bị khoá",
                            type: "aler-danger",
                        });
                    } else {
                        console.log(result.rows);
                        req.session.user = usernameid;
                        req.session.isAdmin = result.rows[0].isadmin;
                        req.session.fullname = result.rows[0].ten;
                        if (result.rows[0].isadmin) {
                            res.redirect("/admin");
                        } else {
                            res.redirect("/");
                        }
                    }
                }

            }
        });
    });
router.get("/login", userlogin.kt_page_login_registe, (req, res) => {
    res.render("login");
});
router.post("/login", userlogin.kt_page_login_registe, (req, res) => {
    const client = new Client(db);
    client.connect();
    let usernameid = req.body.username;
    let pass = req.body.pass;

    const query = {
        name: "get-name",
        text: "SELECT * from users where usernameid = $1::text",
        values: [usernameid],
        rowMode: "json",
    };
    client.query(query, (err, result) => {
        if (err) {
            console.error(err.stack);
        } else {
            if (result.rowCount === 0) {
                res.render("login", {
                    message: "Sai tài khoản",
                    type: "aler-danger",
                });
            } else {
                console.log(bcrypt.compareSync(pass, result.rows[0].matkhau));
                if (!bcrypt.compareSync(pass, result.rows[0].matkhau)) {
                    res.render("login", {
                        message: "Sai mật khẩu",
                        type: "aler-danger",
                    });
                } else {
                    if (result.rows[0].lockuser) {
                        res.render("login", {
                            message: "Tài khoản đã bị khoá",
                            type: "aler-danger",
                        });
                    } else {
                        console.log(result.rows);
                        req.session.fullname = result.rows[0].ten;
                        req.session.username = usernameid;
                        req.session.user = usernameid;
                        req.session.isAdmin = result.rows[0].isadmin;
                        if (result.rows[0].isadmin) {
                            res.redirect("/admin");
                        } else {
                            res.redirect("/");
                        }
                    }
                }
            }
        }
    });
});
router.get("/logout", (req, res, next) => {
    req.session.destroy((error) => {
        if (error) {
            return next(error);
        }
        return res.redirect("/login");
    });
});
router.get("/register", userlogin.kt_page_login_registe, (req, res) => {
    res.render("register");
});
router.post("/register", upload.single("image"), userlogin.kt_page_login_registe, async function (req, res) {
    // folder upload
    const imagePath = path.join(__dirname, "../public/img");
    // call class Resize
    const fileUpload = new Resize(imagePath);
    if (!req.file) {
        return res.send(
            `<script>confirm("Vui lòng thêm 1 hình ảnh"); history.back();</script>`
        );
    }

    const filename = await fileUpload.save(req.file.buffer);
    const image = "/img/" + filename;
    const usernameid = req.body.username;
    const gmail = req.body.gmail;
    const password = req.body.password;
    const confirm_password = req.body.confirmPassword;
    const hoten = req.body.hoten;

    const client = new Client(db);
    await client.connect();
    console.log(req.body);

    const queryktuser = {
        text: "SELECT usernameid FROM users where usernameid=$1::text",
        values: [usernameid],
    };
    const ktuser = await client.query(queryktuser);

    if (ktuser.rowCount === 1) {
        return res.send(
            `<script>confirm("Tài Khoản đã sử dụng"); history.back();</script>`
        );
    }
    if (password != confirm_password) {
        return res.send(
            `<script>confirm("Vui lòng kiểm tra lại mật khẩu"); history.back();</script>`
        );
    }
    const hashedPassword = bcrypt.hashSync(password, saltRounds);
    const query = {
        text:
            "INSERT INTO USERS VALUES ($1::text,$2::text,$3::text,0,$4::text,false,false,$5::text)",
        values: [usernameid, hashedPassword, hoten, gmail, image],
    };
    await client.query(query);
    client.end();
    res.redirect("/login");
});
module.exports = router;
