//jshint esversion:6
import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import encrypt from 'mongoose-encryption';

const port = process.env.PORT || 3000;

await mongoose.connect('mongodb://127.0.0.1:27017/secrets');

const app = express();

const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

userSchema.plugin(encrypt, { secret: process.env.ENC_K, encryptedFields: ['password'] });

const User = mongoose.model("User", userSchema);

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", 'ejs'); //don't need in render .ejs ending anymore
app.use(express.static("public"));

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
    res.redirect("/");
  });

app.post("/register", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    
    const user = new User({
        username: username,
        password: password
    });

    try { 
        user.save();
    } catch (error) {
        console.log(error);
    }
    res.render("secrets");
});


app.post("/login", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    try {
        const user = await User.findOne({ username: username }).exec();
        if (!user) {
            throw new Error("user not found");
        }
        if (password !== user.password) {
            throw new Error("password wrong");
        }
        res.render("/secrets");
    } catch (error) {
        console.log(error);
        res.redirect("login");
    }

});




app.listen(port, function() {
    console.log(`Server started on port ${port}`);
  });