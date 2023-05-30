// UserController.js
const usersModels = require('./users.models');

class UserController {
    async getUser(UserID) {
        let result = await usersModels.getUser(UserID);
        return result;
    }

    async getCourses(UserID) {
        let all_courses = await usersModels.getCourses();
        let my_courses = await usersModels.getUserCourses(UserID);

        let result = [];
        for (let i = 0; i < all_courses.result.length; i++) {
            let course = all_courses.result[i];
            course.isBought = false;
            for (let j = 0; j < my_courses.result.length; j++) {
                let my_course = my_courses.result[j];
                if (course.CourseID === my_course.CourseID[0]) {
                    course.isBought = true;
                    break;
                }
            }
            result.push(course);
        }
        
        return {
            statusCode: 200,
            message: 'Thành công',
            result: result
        };
    }

    async getUserCourses(UserID) {
        let result = await usersModels.getUserCourses(UserID);
        return result;
    }
}

module.exports = new UserController();
