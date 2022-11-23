require('dotenv').config();
const express = require('express')
const bodyParser = require('body-parser')
const ejs = require('ejs')
const mongoose = require('mongoose')
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')
const findOrCreate = require('mongoose-find-or-create')

const app = express()

app.use(express.static("public"))
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}))

app.use(session({
    secret: process.env.SECRET_ID,
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize(undefined))
app.use(passport.session(undefined))

mongoose.connect(process.env.MONGODB_URL)

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema)

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
    done(null, user.id)
});
passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user)  {
        done(err, user)
    });
});

app.route("/")
    .get(function (req, res) {
        res.render("register", {alertDisplay: "none"});
    })
    .post(function (req, res) {
        const password = req.body.password
        const email = req.body.username
        const repeatPassword = req.body.repeatPassword

        if(password === repeatPassword){
            User.register({username: email}, password, function(err, user){
                if(err) {
                    console.log(err)
                    res.redirect("/");
                } else {
                    passport.authenticate("local")(req, res, function () {
                        res.redirect("/accountPage")
                    });
                }
            });
        } else {
            res.render("register", {alertDisplay: "block"});
            res.redirect("/")
        }
    });

app.get("/login", function (req, res) {
    res.render("login.ejs")
})

app.listen(3000, function () {
    console.log("Server is running on port 3000")
})