const express = require('express');
const pug = require('pug');
const router = express.Router();
var path = require("path");
const usersModel = require('../users/users.models');
const authMiddleware = require('../auth/auth.middlewares');
const authController = require('../auth/auth.controller');
const isAuth = authMiddleware.isAuth;
const isAuthAdmin = authMiddleware.isAuthAdmin;
const adminController = require('../admin/admin.controller');

router.route('/create_account')
	.get(isAuthAdmin, adminController.renderCreateAccount)
	.post(isAuthAdmin, adminController.createAccount)

module.exports = router;