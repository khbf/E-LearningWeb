let express = require("express");
let app = express();
const { Client } = require("pg");
const db = require("../utils/db");
const path = require("path");
const upload = require("../Middleware/uploadMiddleware");
const Resize = require("../models/Resize");
const { isNull } = require("util");
const { array } = require("../Middleware/uploadMiddleware");
const userlogin=require('../controllers/islogin'); 

app.get("/",userlogin.isLoggend_Admin, async (req, res) => {
    const client = new Client(db);
    await client.connect();
    const query = {
        text: `SELECT date_part('month',created_at),sum(tongtien) as "tien"
        FROM public.donhang 
        where date_part('year',created_at) =date_part('year',now()) 
        group by date_part('month',created_at)`,
        rowMode: "array",
    };
    var data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const kq = await client.query(query);
    console.log(kq.rows);
    var j = 0;
    for (var i = 0; i < data.length; i++) {
        if (kq.rows[j][0] === i + 1) {
            data[i] = kq.rows[j][1];
            j = j + 1;
            if (j === kq.rowCount) {
                break;
            }
        }
    }
    console.log(JSON.stringify({ thang: data }));
    const query2 = {
        text: `select ctdonhang.courseid ,khoahoc.ten,sum(ctdonhang.tien) from khoahoc inner join ctdonhang on ctdonhang.courseid=khoahoc.courseid 
        group by ctdonhang.courseid,khoahoc.ten  order by sum(ctdonhang.tien) desc limit 6`
    }
    const top = await client.query(query2);
    console.log(top.rows)
    res.render("admin/dashboard", { thongke: data ,top: top.rows, layout: "../admin/layouts/main.hbs" });
});
app.get("/user",userlogin.isLoggend_Admin, async (req, res) => {
    const client = new Client(db);
    await client.connect();
    var pageu_offser = 0;
    var paget_offser = 0;
    var searchuser = "";
    if (req.query) {
        if (req.query.pageuser) {
            pageu_offser = (req.query.pageuser - 1) * 5;
        }
        if (req.query.pageteacher) {
            paget_offser = (req.query.pageteacher - 1) * 5;
        }
        if (req.query.user) {
            searchuser = "where usernameid = '" + req.query.user + "'";
        }
    }
    const users = await client.query("SELECT * from users " + searchuser + " ORDER  BY usernameid OFFSET " + pageu_offser);

    res.render("admin/tableuser", { user: users.rows, layout: "../admin/layouts/main.hbs" });
    client.end();
});
app.get("/user/add",userlogin.isLoggend_Admin, (req, res) => {
    res.render("admin/user", { layout: "../admin/layouts/main.hbs" });
});
app.get("/user/:username",userlogin.isLoggend_Admin, async (req, res) => {
    const client = new Client(db);
    await client.connect();
    console.log(req.query);
    const user = await client.query("SELECT * from users where usernameid='" + req.params.username + "'");
    res.render("admin/edituser", { user: user.rows, layout: "../admin/layouts/main.hbs" });
    client.end();
});
app.post("/user", upload.single("image"), async function (req, res) {
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
    const usernameid = req.body.username;
    const gmail = req.body.gmail;
    const password = req.body.password;
    const hoten = req.body.hoten;
    const image = "/img/" + filename;
    const client = new Client(db);
    await client.connect();
    const queryktuser = {
        text: 'SELECT usernameid FROM users where usernameid=$1::text',
        values: [usernameid],
    }
    const ktuser = await client.query(queryktuser);
    if (ktuser.rowCount === 1) {
        return res.send(
            `<script>confirm("Tài Khoản đã sử dụng"); history.back();</script>`
        );
    }
    const query = {
        text: 'INSERT INTO USERS VALUES ($1::text,$2::text,$3::text,0,$4::text,false,false,$5::text)',
        values: [usernameid, password, hoten, gmail, image],
    }
    await client.query(query)
    client.end();
    res.redirect("/admin");
});
app.post("/user/:username/updateuser", upload.single("image"), async (req, res) => {
    const imagePath = path.join(__dirname, "../public/img");
    // call class Resize
    const fileUpload = new Resize(imagePath);
    const gmail = req.body.gmail;
    const hoten = req.body.hoten;
    const isadmin = req.body.isadmin;

    const client = new Client(db);
    await client.connect();
    if (!req.file) {
        const query = {
            text: 'UPDATE users SET ten = $1::text,gmail=$2::text,isadmin=$3::boolean WHERE usernameId= $4::text',
            values: [hoten, gmail, isadmin, req.params.username],
        }
        await client.query(query);
    } else {

        const filename = await fileUpload.save(req.file.buffer);
        const image = "/img/" + filename;
        const query2 = {
            text: 'UPDATE users SET ten = $1::text,gmail=$2::text,isadmin=$3::boolean, imagepath =$5::text WHERE usernameId= $4::text',
            values: [hoten, gmail, isadmin, req.params.username, image],
        }
        await client.query(query2);
    }
    client.end();
    return res.send(
        `<script>confirm("Cập nhật thành công"); window.location="/admin/user";</script>`
    );
});
app.post("/user/:username/lock_user", async (req, res) => {
    const client = new Client(db);
    await client.connect();
    const query = {
        text: "UPDATE users SET lockuser='true' where usernameid = $1::text ",
        values: [req.params.username],
    }
    await client.query(query);
    client.end();
    return res.redirect("/admin/user");
});
app.post("/user/:username/unlock_user", async (req, res) => {
    const client = new Client(db);
    await client.connect();
    const query = {
        text: "UPDATE users SET lockuser='false' where usernameid = $1::text ",
        values: [req.params.username],
    }
    await client.query(query);
    client.end();
    return res.redirect("/admin/user");
});
app.get("/teacher",userlogin.isLoggend_Admin, async (req, res) => {
    const client = new Client(db);
    await client.connect();
    var paget_offser = 0;
    if (req.query) {
        if (req.query.pageteacher) {
            paget_offser = (req.query.pageteacher - 1) * 5;
        }
    }
    const giaovien = await client.query(
        "SELECT * from giaovien  ORDER  BY teacherid OFFSET " +
        paget_offser +
        "LIMIT  5"
    );
    console.log(giaovien.rows);
    var maxpaget = await client.query(
        "SELECT count(*)/5 +1 as page from giaovien"
    );
    res.render("admin/tablegiaovien", { giaovien: giaovien.rows, layout: "../admin/layouts/main.hbs" });
    client.end();
});
app.get("/teacher/:teacherid",userlogin.isLoggend_Admin, async (req, res) => {
    const client = new Client(db);
    await client.connect();
    const teacher = await client.query(
        "SELECT * from giaovien where teacherid='" + req.params.teacherid + "'"
    );
    console.log(teacher.rows);
    res.render("admin/teacher", { teacher: teacher.rows, layout: "../admin/layouts/main.hbs" });
    client.end();
});
app.post("/teacher/:teacher", upload.single("image"), async (req, res) => {
    const imagePath = path.join(__dirname, "../public/img");
    // call class Resize

    const fileUpload = new Resize(imagePath);
    const hoten = req.body.ten;
    const chuyenmon = req.body.chuyenmon;
    const gioithieu = req.body.gioithieu;

    const client = new Client(db);
    await client.connect();
    if (!req.file) {
        const query = {
            text: 'UPDATE giaovien SET ten =$1::text, chuyenmon =$2::text ,gioithieu= $3::text WHERE teacherid=$4::text',
            values: [hoten, chuyenmon, gioithieu, req.params.teacher],
        }
        await client.query(query);
    } else {
        const filename = await fileUpload.save(req.file.buffer);
        const image = "/img/" + filename;
        const query2 = {
            text: 'UPDATE giaovien SET ten =$1::text, chuyenmon =$2::text ,gioithieu= $3::text ,imagepath=$5::text WHERE teacherid=$4::text',
            values: [hoten, chuyenmon, gioithieu, req.params.teacher, image],
        }
        console.log(filename);
        await client.query(query2);
    }
    client.end();
    return res.send(
        `<script>confirm("Cập nhật thành công"); window.location="/admin/teacher";</script>`
    );
});
app.get("/courses",userlogin.isLoggend_Admin, async (req, res) => {
    const client = new Client(db);
    await client.connect();
    let danhmuc_id;
    let course_id;
    if (!req.query.danhmucid) {
        danhmuc_id = 1;
    } else {
        danhmuc_id = req.query.danhmucid;
    }
    if (!req.query.courseid) {
        course_id = "C01";
    } else {
        course_id = req.query.courseid;
    }
    const danhmuc = await client.query("SELECT * from danhmuc");
    const courses = await client.query(
        "SELECT * from khoahoc where danhmucid = '" + danhmuc_id + "'"
    );
    const baihoc = await client.query(
        "SELECT * from baihoc where courseid = '" + course_id + "'"
    );
    const giaovien = await client.query(
        "select * from giaovien"
    );
    res.render("admin/danhmuckhoahoc", {
        danhmuc: danhmuc.rows,
        courses: courses.rows,
        baihoc: baihoc.rows,
        giaovien: giaovien.rows,
        layout: "../admin/layouts/main.hbs"
    });
    client.end();
});
app.get("/themkhoahoc",userlogin.isLoggend_Admin, async (req, res) => {
    res.render('admin/editkhoahoc', { layout: "../admin/layouts/main.hbs" })
});
app.post("/themkhoahoc/adddanhmuc", async (req, res) => {
    const client = new Client(db);
    await client.connect();
    const name = req.body.name;
    console.log(name);
    const query = {
        text: 'INSERT INTO public.danhmuc VALUES ((select MAX(danhmucid)::INTEGER+1 from danhmuc),$1::text);',
        values: [name],
    }
    await client.query(query)
    client.end();
    res.redirect("/admin/courses");
});
app.post("/themkhoahoc/addkhoahoc", upload.single("image"), async (req, res) => {
    const imagePath = path.join(__dirname, "../public/img");
    // call class Resize
    const fileUpload = new Resize(imagePath);
    const client = new Client(db);
    await client.connect();
    const name = req.body.name;
    const gia = req.body.gia;
    const tongquan = req.body.tongquan
    const chitiet = req.body.chitiet
    const danhmuc = req.body.danhmucid
    const giaovien = req.body.giaovien
    const filename = await fileUpload.save(req.file.buffer);
    const image = "/img/" + filename;
    console.log(req.body)
    const query = {
        text: `INSERT INTO public.khoahoc VALUES ((select 'C'||MAX(SUBSTRING(courseid,2,10)::integer+1) from khoahoc), $1::text, $2::integer, $3::text, $4::integer, $7::text, $6::text, $5::text);`,
        values: [name, gia, tongquan, chitiet, danhmuc, giaovien,image],
    }
    await client.query(query)
    client.end();
    res.redirect("/admin/courses");
});
app.post("/themkhoahoc/addbaihoc", async (req, res) => {
    const client = new Client(db);
    await client.connect();
    const nd = req.body.nd;
    const link = req.body.link;
    const courseid = req.body.courseid
    const selectchuong = {
        text: `select * from baihoc where courseid = $1::text;`,
        values: [courseid],
    }
    let chuong = await client.query(selectchuong)
    console.log(chuong.rowCount+1)
    const query = {
        text: `INSERT INTO public.baihoc VALUES ((select 'S'||MAX(SUBSTRING(sessionid,2,10)::integer+1) from  baihoc), $1::integer, $2::text, $3::text, $4::text);`,
        values: [chuong.rowCount+1,nd, link, courseid],
    }
    await client.query(query)
    client.end();
    res.redirect("/admin/courses");
});
module.exports = app;
