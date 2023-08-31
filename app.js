//jshint esversion:6
import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import session from 'express-session';
import passport from 'passport';
import ejs from 'ejs';
import passportLocalMongoose from 'passport-local-mongoose';
import GoogleStrategy from 'passport-google-oauth20';
import findOrCreate from 'mongoose-findorcreate';

GoogleStrategy.Strategy;

const port = process.env.PORT || 3000;

await mongoose.connect('mongodb://127.0.0.1:27017/secrets');

const app = express();



app.set("view engine", 'ejs'); //don't need in render .ejs ending anymore
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
    secret: 'Our little secret',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", async (req, res) => {
    res.render("home");
});

app.get("/login", async (req, res) => {
    res.render("login.ejs");
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
// Successful authentication, redirect secrets.
    res.redirect('/secrets');
});

app.get("/register", async (req, res) => {
    res.render("register.ejs");
});

app.get("/logout", function(req, res){
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect("/");
      });
  });
const test = "huhu";

app.get("/secrets", async function(req, res){
if (req.isAuthenticated()) {
    const allUsersSecrets = await User.find({ secret: { $ne: null } });
    // console.log(allUsersSecrets);
    res.render("secrets", { userSecrets: allUsersSecrets});
} else {
    res.redirect("/login");
}
});

app.get("/submit", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login");
    }
})

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

app.post("/submit", async (req, res) => {
    const submittedSecret = req.body.secret;
    const user = await User.findById(req.user.id).exec();
    if (user) {
        user.secret = submittedSecret;
        user.save();
        res.redirect("/secrets");
    } else {
        res.redirect("/login");
    }
})

app.listen(port, function() {
    console.log(`Server started on port ${port}`);
  });