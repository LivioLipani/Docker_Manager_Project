const user = require('../query/user');

const getUsers = async (req, res) => {
    try {
        const users = await user.getAll();
        console.log(users);
        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
  getUsers
};
