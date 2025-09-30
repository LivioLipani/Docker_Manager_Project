require('dotenv').config({
    path: '.env', 
    debug: true
});

const jwt = require('jsonwebtoken');
const User = require('../query/user');

const generateToken = (userId) => {
    return jwt.sign(
        userId,
        process.env.ACCESS_TOKEN_SECRET
    )
}

const authenticateToken = () =>{

}

module.exports = {
  generateToken,
  authenticateToken
};