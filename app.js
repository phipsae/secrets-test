//jshint esversion:6
import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import session from 'express-session';
import passport from 'passport';
import passportLocalMongoose from 'passport-local-mongoose';


const port = process.env.PORT || 3000;

await mongoose.connect('mongodb://127.0.0.1:27017/secrets');

const app = express();


app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", 'ejs'); //don't need in render .ejs ending anymore
app.use(express.static("public"));

app.use(session({
    secret: 'Our little secret',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", async (req, res) => {
    res.render("home");
});

app.get("/login", async (req, res) => {
    res.render("login.ejs");
});

app.get("/register", async (req, res) => {
    console.log(req.body);
    res.render("register.ejs");
});

app.get("/logout", function(req, res){
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect("/");
      });
  });

  app.get("/secrets", function(req, res){
    if (req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
  });

app.post("/register", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    User.register({username: username, active: false}, password, function(err, user) {
        if (err) { 
            console.log(err) 
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function() {
                res.redirect("/secrets");
            });
        }
      
      });
   
});


app.post("/login", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    const user = new User ({
        username: username,
        password: password
    });

    req.login(user, function(err) {
        if (err) { return next(err); } else {
            passport.authenticate("local")(req, res, function() {
                res.redirect("/secrets");
            });
        }
      });
});


app.listen(port, function() {
    console.log(`Server started on port ${port}`);
  });