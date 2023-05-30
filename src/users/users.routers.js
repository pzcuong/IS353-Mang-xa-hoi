const express = require('express');
const pug = require('pug');
const path = require("path");
const router = express.Router();
const usersModel = require('../users/users.models');
const authMiddleware = require('../auth/auth.middlewares');
const authController = require('../auth/auth.controller');
const userController = require('./users.controller');
const adminController = require('../admin/admin.controller');
const isAuth = authMiddleware.isAuth;
const isAuthAdmin = authMiddleware.isAuthAdmin;
const isAuthGiaoVien = authMiddleware.isAuthGiaoVien;

user_information = {};

// Middleware để gán giá trị mặc định cho req.locals
router.use(isAuth, (req, res, next) => {
	req.locals = {
		user: req.user.result,
		image: req.image,
		role: req.user.role
	};
	user_information = req.locals;
	next();
});

// Hàm render template
function renderTemplate(templatePath, locals, other_user=false) {
	if (!other_user) {
		locals.user = user_information.user;
		locals.image = user_information.image;
	} 

	locals.role = user_information.role;
	return pug.renderFile(templatePath, locals);
}

router.route('/change_password')
	.get(isAuth, async (req, res) => {
		const html = renderTemplate('public/auth/changePassword.pug', req.locals);
		res.send(html);
	})
	.post(isAuth, authController.DoiMatKhau);

	router.get('/profile', isAuth, async (req, res) => {
	console.log(req.user);
	let userCourses = await userController.getUserCourses(req.user.result.UserID);

	console.log(userCourses);

	const html = renderTemplate('public/user/Profile.pug', {
		userCourses: userCourses.result,
	});
	res.send(html);
});

router.get('/profile/:id', isAuth, async (req, res) => {
	let userInfo = await userController.getUser(req.params.id);
	let userCourses = await userController.getUserCourses(req.params.id);

	const html = renderTemplate('public/user/Profile.pug', {
		userCourses: userCourses.result,
		user: userInfo.result,
	}, other_user=true);
	res.send(html);
});

router.get('/courses', isAuth, async (req, res) => {
	let courses = await userController.getCourses(req.user.result.UserID);
	let recommend_users = await userController.getRecommendUsers(req.user.result.UserID);
	let recommend_courses = await userController.getRecommendCourses(req.user.result.UserID);
	let community_detect = await userController.getCommunityDetect();

	console.log("recommend_users", recommend_users);
	console.log("recommend_courses", recommend_courses);
	console.log("community_detect", community_detect);

	const html = renderTemplate('public/user/Courses.pug', {
		courses: courses.result,
	});
	res.send(html);
});

router.route('/courses/:id')
	.get(isAuth, async (req, res) => {
		const course = await userController.getCourseDetail(req.params.id);
		console.log(course.result.modules[0].lessons);

		const html = renderTemplate('public/user/CourseDetail.pug', {
			course: course.result,
		});
		res.send(html);
	})
	.post(isAuth, userController.joinCourse);

router.route('/courses/:id/lesson/:lesson_id')
	.get(isAuth, async (req, res) => {
		const lesson = await userController.getLessonDetail(req.params.lesson_id);
		const comment = await userController.getComment(req.params.lesson_id);

		const html = renderTemplate('public/user/LessonDetail.pug', {
			lesson: lesson.result,
			comment: comment.result
		});
		res.send(html);
	})
	.post(isAuth, userController.postComment);

router.post('/courses/:id/lesson/:lesson_id/comment/:comment_id', isAuth, userController.postReply);

router.get('/recommend_group', isAuth, async (req, res) => {
	let community_detect = await userController.getCommunityDetect();
	const html = renderTemplate('public/user/RecommendGroup.pug', {
		community_detect: community_detect.result
	});
	res.send(html);
});

module.exports = router;
