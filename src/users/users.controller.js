const usersModel = require('../users/users.models');
var pug = require('pug');



async function getUserCourses(UserID) {
    let result = await usersModel.getUserCourses(UserID);
    console.log(result)
    if(result.statusCode === 200) {
        return ({
            statusCode: 200,
            message: 'Thành công',
            data: result
        });
    } else {
        return ({
            statusCode: 500,
            message: 'Lỗi hệ thống!'
        });
    }
}

exports.getUserCourses = getUserCourses;
