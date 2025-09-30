const User = require('../query/user');
const { generateToken } = require('../middleware/auth');

const login = async(req, res) => {
  try{
    const {username, password}  = req.body;

    console.log(username, password);

    if(!username || !password){
      return res.status(400).json({ error: 'Username and Password are required'});
    }

    const user = await User.findByUsername(username);

    console.log("user", user);

    if(!user){
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const verifyPassword = await User.verifyPassword(password, user.password_hash);

    console.log("password", verifyPassword);

    if (!verifyPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id);

    res.status(200).json({
      token,
      user : {
        id: user.id,
        username: user.username,
        role: user.role
      }
    })

  }catch(error){
    console.log('Login error:', error);
    res.status(500).json({error: 'Server error'});
  }

}

module.exports = {
  login
};