let express = require('express');
let router = express.Router();
const { Client } = require('pg')
const db = require('../utils/db')

const path = require('path');
router.get('/' , async (req,res ) =>{
    const client = new Client(db)
    await client.connect()
    
    const category = await client.query("SELECT ten from danhmuc")
    const khoahoc = await client.query("select khoahoc.courseid, khoahoc.ten as tenkh,giaovien.ten as tengv,khoahoc.tongquan as tq,count(courseofuser.usernameid),khoahoc.imagepath as image,khoahoc.gia as gia       from khoahoc,giaovien,courseofuser       where khoahoc.teacherid=giaovien.teacherid and khoahoc.courseid = courseofuser.courseid       group by khoahoc.courseid, khoahoc.ten,giaovien.ten,khoahoc.tongquan,khoahoc.imagepath,khoahoc.gia")

    res.render('index',{categories:category.rows,courses:khoahoc.rows.slice(0,3)});
    client.end();
});





module.exports = router;