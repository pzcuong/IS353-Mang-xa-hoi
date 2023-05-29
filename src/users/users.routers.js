const express = require('express');
var pug = require('pug');
var path = require("path");
const router = express.Router();
const usersModel = require('../users/users.models');
const authMiddleware = require('../auth/auth.middlewares');
const authController = require('../auth/auth.controller');
const userController = require('./users.controller');
const adminController = require('../admin/admin.controller');
const isAuth = authMiddleware.isAuth;
const isAuthAdmin = authMiddleware.isAuthAdmin;
const isAuthGiaoVien = authMiddleware.isAuthGiaoVien;

router.route('/DoiMatKhau')
	.get(isAuth, async (req, res) => {
		let html = pug.renderFile('public/auth/changePassword.pug');
		res.send(html);
	})
	.post(isAuth, authController.DoiMatKhau);

router.get('/profile', isAuth, async (req, res) => {
		console.log(req.user);
		
		let userCourses = await userController.getUserCourses(req.user.result.UserID);

		let html = pug.renderFile('public/user/Profile.pug', {
			userCourses: userCourses.data.result,       
			user: req.user.result,        
			image: req.image,
			role: req.user.role
		});
		res.send(html);
	});


module.exports = router;
