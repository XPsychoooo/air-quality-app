const express = require('express');
const router = express.Router();
const { authRequired } = require('../middleware/authMiddleware');

router.get('/settings', authRequired, (req, res) => {
    res.render('settings/index', {
        title: 'Settings',
        user: req.user
    });
});

module.exports = router;
