const express = require("express")
const app = express();
const userModel = require("./models/user")
const postModel =require("./models/post")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken");
const crypto = require("crypto")
const path= require("path")
const cookieParser = require("cookie-parser");
const multerconfig = require("./config/multercinfig");
 app.set("view engine","ejs")
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static(path.join(__dirname,"public")));
app.use(cookieParser());

 app.get("/",function(req,res){
    res.render("tara")
})
 app.get("/login" ,function(req,res){
    res.render("login")
})
  app.get("/profile" ,isLogged,async function(req,res){
     let user =await userModel.findOne({email:req.user.email}). populate("posts")
     console.log(user)
      res.render("profile",{user})
})
app.get("/like/:id",isLogged, async function (req,res){
    let post = await postModel.findOne({_id:req.params.id}).populate("user");
    if(post.likes.indexOf(req.user.userid) === -1){
        post.likes.push(req.user.userid);
    }    
     else{
         post.likes.splice(post.likes.indexOf(req.user.userid),1);
     }
     await post.save();
     res.redirect("/profile")
});

app.get("/edit/:id",isLogged, async function (req,res){
    let post = await postModel.findOne({_id:req.params.id}).populate("user");
    
     res.render("edit",{post})

});

app.post("/update/:id",isLogged, async function (req,res){
 let post = await postModel.findOneAndUpdate({_id:req.params.id},{content:req.body.content})
    
     res.redirect("/profile")

});
app.post("/post" ,isLogged,async function(req,res){
    let user =await userModel.findOne({email:req.user.email}) 
    let {content} =req.body;

    let post = await postModel.create({
        user: user._id,
        content
    });
    user.posts.push(post._id);
    await user.save()
    res.redirect("/profile")
}) 

  app.post("/create",async function(req,res){
    let{email,password,username,name,age}=req.body
   let user = await userModel.findOne({email});
    if(user) return res.status(500).send("you can login"); 

    bcrypt.genSalt(10,function (err,salt){
        bcrypt.hash(password,salt,async function (err,hash){

    let user= await userModel.create({
        username,
        email,
        age,  
        name,
        password:hash,
    })
    let token = jwt.sign({email:email},"secret")
    res.cookie("token",token) 
    res.send("ragisterd")
    
}) 
})
}) 
app.post("/login",  async function(req,res){
    let{email,password} =req.body;
    let user = await userModel.findOne({email});
    if(!user) return res.status(500).send("something went wrong");

    bcrypt.compare(password,user.password,(err, result) => {
            if (result) {
                let token = jwt.sign({email: email}, "secret");
                res.cookie("token", token);
                res.status(200).redirect("/profile");
            }
            else res.redirect("/login");
           

        })

})
app.get("/logout",function(req,res){
    res.cookie("token","")
    res.redirect("/login")
    console.log(req.cookies)
})
  function isLogged(req,res,next){
      if(req.cookies.token=="") res.redirect("/login")
      else{
          let data =jwt.verify(req.cookies.token,"secret")
          req.user=data;
      }
      next();
  }
        
app.listen(3000)

