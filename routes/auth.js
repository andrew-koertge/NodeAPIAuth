const router = require('express').Router();
const User = require('../model/User');
const jwt = require('jsonwebtoken');
const {registerValidation, loginValidation} = require('..//validation');
const bcrypt = require('bcryptjs');

//validation
const Joi = require('@hapi/joi');

router.post('/register', async (req, res) => {

    //validate user data
    const {error} = registerValidation(req.body);
    if(error) return res.status(400).send(res.send(error.details[0].message));

    //checking if user is already in database
    const emailExists = await User.findOne({email: req.body.email});
    if(emailExists) return res.status(400).send('Email already exists');

    //hash password
    const salt = await bcrypt.gentSalt(10);
    const hashPassword = await bcrypt.hash(req.body.password, salt);

    //create a new user
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: hashPassword
    });
    try {
        const savedUser = await user.save();
        res.send({user: user._id});
    }catch(err){
        res.status(400).send(err);
    }


});

//login
router.post('/login', async (req, res) => {
    //validate user data
    const {error} = loginValidation(req.body);
    if(error) return res.status(400).send(res.send(error.details[0].message));
         //checking if the email exists
        const user = await User.findOne({email: req.body.email});
        if(!user) return res.status(400).send('Email or password is incorrect');
        //checking if password is correct
        const validPass = await bcrypt.compare(req.body.password, user.password);
        if (!validPass) return res.status(400).send('Invalid password');

        //create and assign a token
        const token = jwt.sign({_id: user._id}, process.env.TOKEN_SECRET);
        res.header('auth-token', token).send(token);
});

module.exports = router;