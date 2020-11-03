let express = require('express');
let router = express.Router();
const { Client } = require('pg');
const db = require('../utils/db');

const path = require('path');
const { query } = require('express');
const userlogin = require("../controllers/islogin");
router.post('/' , async (req,res ) =>{
 
    const client = new Client(db);
    await client.connect();
    const category = await client.query("SELECT danhmucid,ten from danhmuc");
    let course;
    var page1 = parseInt(req.body.pagenum) || 1;
    var value1 = req.body.value || 6;
    var offset = (page1-1) * value1;
    var limit = page1 * value1;
    if(!req.body.cateid){
        if(!req.query.search){
            course = await client.query("select khoahoc.courseid as courseid,khoahoc.ten as tenKH,giaovien.ten as tenGV,khoahoc.tongquan as tq,khoahoc.gia as gia,khoahoc.imagepath as image,khoahoc.danhmucid as dmid      from khoahoc,giaovien      where khoahoc.teacherid=giaovien.teacherid   group by khoahoc.courseid,khoahoc.ten, giaovien.ten,khoahoc.tongquan,khoahoc.gia,khoahoc.imagepath,khoahoc.danhmucid");
        }
        else{
            course = await client.query("select khoahoc.courseid as courseid,khoahoc.ten as tenKH,giaovien.ten as tenGV,khoahoc.tongquan as tq,khoahoc.gia as gia,khoahoc.imagepath as image,                   khoahoc.danhmucid as dmid      from khoahoc,giaovien      where khoahoc.teacherid=giaovien.teacherid and khoahoc.ten ilike '%"+req.query.search+"%'   group by khoahoc.courseid,khoahoc.ten, giaovien.ten,khoahoc.tongquan,khoahoc.gia,khoahoc.imagepath,khoahoc.danhmucid  order by khoahoc.gia asc ");
        }
    
    }
 
    else{
        course= await client.query("select khoahoc.courseid as courseid,khoahoc.ten as tenKH,giaovien.ten as tenGV,khoahoc.tongquan as tq,khoahoc.gia as gia,khoahoc.imagepath as image,                       khoahoc.danhmucid as dmid      from khoahoc,giaovien       where khoahoc.teacherid=giaovien.teacherid and khoahoc.danhmucid= '"+req.body.cateid+"'   group by khoahoc.courseid,khoahoc.ten, giaovien.ten,khoahoc.tongquan,khoahoc.gia,khoahoc.imagepath,khoahoc.danhmucid     order by khoahoc.gia asc");
    }

    res.render('courses',{categories:category.rows,courses:course.rows.slice(offset,limit),categoryid:req.body.categoryid,show:req.body.value});
    client.end();
});

router.get('/' , async (req,res ) =>{
 
    const client = new Client(db);
    await client.connect();
    const category = await client.query("SELECT danhmucid,ten from danhmuc");
    let course;
    //let page =(req.query.page -1) * 6;
    // offset gia tri bat dau
    // limit gia tri gioi han
    var page1 = parseInt(req.query.page) || 1;
    var value1;
    if(!req.body.value){
        value1 =6;
    }
    else{
        value1 = req.body.show;
    }
    var offset = (page1-1) * value1;
    var limit = page1 * value1;
    if(!req.query.category){
        if(!req.query.search){
            course = await client.query("select khoahoc.courseid as courseid,khoahoc.ten as tenKH,giaovien.ten as tenGV,khoahoc.tongquan as tq,khoahoc.gia as gia,khoahoc.imagepath as image,khoahoc.danhmucid as dmid      from khoahoc,giaovien      where khoahoc.teacherid=giaovien.teacherid   group by khoahoc.courseid,khoahoc.ten, giaovien.ten,khoahoc.tongquan,khoahoc.gia,khoahoc.imagepath,khoahoc.danhmucid");
        }
        else{
            course = await client.query("select khoahoc.courseid as courseid,khoahoc.ten as tenKH,giaovien.ten as tenGV,khoahoc.tongquan as tq,khoahoc.gia as gia,khoahoc.imagepath as image,                   khoahoc.danhmucid as dmid      from khoahoc,giaovien      where khoahoc.teacherid=giaovien.teacherid and khoahoc.ten ilike '%"+req.query.search+"%'   group by khoahoc.courseid,khoahoc.ten, giaovien.ten,khoahoc.tongquan,khoahoc.gia,khoahoc.imagepath,khoahoc.danhmucid  order by khoahoc.gia asc ");
        }
    
    }
 
    else{
        course= await client.query("select khoahoc.courseid as courseid,khoahoc.ten as tenKH,giaovien.ten as tenGV,khoahoc.tongquan as tq,khoahoc.gia as gia,khoahoc.imagepath as image,                       khoahoc.danhmucid as dmid      from khoahoc,giaovien       where khoahoc.teacherid=giaovien.teacherid and khoahoc.danhmucid= '"+req.query.category+"'   group by khoahoc.courseid,khoahoc.ten, giaovien.ten,khoahoc.tongquan,khoahoc.gia,khoahoc.imagepath,khoahoc.danhmucid     order by khoahoc.gia asc");
    }
    // ,categoryid:req.body.value
    console.log(course);
    res.render('courses',{categories:category.rows,courses:course.rows.slice(offset,limit),categoryid:req.query.category,pagenum:req.query.page});
    client.end();
});

router.get('/:course' , async(req,res) =>{
    const client = new Client(db);
    await client.connect();
    const query = {
        text: "SELECT * from courseofuser where usernameid = $1::text and courseid= $2::text",
        values: [req.session.username, req.params.course],
    };
    const ktuser = await client.query(query)
    const strbaihoc = {
        text: "SELECT * from baihoc where courseid= $1::text",
        values: [req.params.course],
    };
    const baihoc = await client.query(strbaihoc)

    const cour = await client.query("select khoahoc.ten as tenKH,  giaovien.ten as tenGV,  giaovien.imagepath as imagegv,  khoahoc.tongquan as tq,  khoahoc.gia as gia,  khoahoc.imagepath as imagekh,  danhmuc.ten as tendm,  khoahoc.chitiet as slbh,  giaovien.gioithieu as gt,  giaovien.chuyenmon as cm      from khoahoc,giaovien,danhmuc      where khoahoc.teacherid=giaovien.teacherid and danhmuc.danhmucid=khoahoc.danhmucid and  courseid = '" + req.params.course + "'      group by khoahoc.ten, giaovien.ten, giaovien.imagepath, khoahoc.tongquan, khoahoc.gia,khoahoc.imagepath, danhmuc.ten, khoahoc.chitiet,  giaovien.gioithieu,  giaovien.chuyenmon");
    console.log(baihoc.rows)
    res.render('course',{courses:cour.rows ,kt: ktuser, baihoc:baihoc.rows});
    client.end();
});
module.exports = router;

