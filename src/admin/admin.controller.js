const pug = require('pug');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); 
var randToken = require('rand-token');
const adminModel = require('../admin/admin.models');
const authMiddleware = require('../auth/auth.middlewares');
const authController = require('../auth/auth.controller');
const authMethod = require('../auth/auth.methods');
const isAuthAdmin = authMiddleware.isAuthAdmin;

const SALT_ROUNDS = 10;


user_information = {};

class AdminController {
    async createAccount(req, res, next) {
        console.log(req.body)
        const result = await adminModel.createAccount(req.body);
        console.log(result)
        return res.json(result);
    }

    async renderCreateAccount(req, res, next) {
        let html = pug.renderFile('public/admin/ThemTaiKhoan.pug', {
            user: req.user.result,
            image: req.image,
            role: req.user.role
        });
        res.send(html);
    }
    
}

module.exports = new AdminController();
