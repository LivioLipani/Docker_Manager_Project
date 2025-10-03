const jwt = require('jsonwebtoken');
const User = require('../query/user');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    //console.log("token",token);
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
        return res.status(401).json({ error: 'Invalid token' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

const generateToken = (userId) => {
    return jwt.sign(
        {"userId": userId},
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '4h' }
    );
}

module.exports = {
    authenticateToken,
    requireAdmin,
    generateToken
};