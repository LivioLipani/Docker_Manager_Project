const User = require('../query/user');
const { generateToken } = require('../middleware/auth');

const login = async(req, res) => {
  try{
    const {username, password}  = req.body;

    if(!username || !password){
      return res.status(400).json({ error: 'Username and Password are required'});
    }

    const user = await User.findByUsername(username);

    if(!user){
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const verifyPassword = await User.verifyPassword(password, user.password_hash);

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
    console.error('Login error:', error);
    res.status(500).json({error: 'Server error'});
  }
}

const verify_token = (req, res) => {
  res.json({
    valid: true, 
    user: req.user 
  });
};

const logout = (req, res) => {
  res.json({ message: 'Logged out successfully' });
};

const register = async (req, res) => {
  try {
    const { username, password, confirmPassword } = req.body;

    if (!username || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const newUser = await User.create(username, password, 'readonly');
    const token = generateToken(newUser.id);

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role
      }
    });
  }catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  login,
  verify_token,
  logout,
  register
};