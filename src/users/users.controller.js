// UserController.js
const usersModels = require('./users.models');
const recommendUsers = require('../recommend_system/recommend_users');
const recommendCourses = require('../recommend_system/recommend_courses');
const communityDetect = require('../recommend_system/community_detect');

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

    async getCourseDetail(CourseID) {
        return await usersModels.getCourseDetail(CourseID);
    }

    async joinCourse(UserID, CourseID) {
        return await usersModels.joinCourse(UserID, CourseID);
    }

    async getLessonDetail(LessonID) {
        return await usersModels.getLessonDetail(LessonID);
    }

    async getComment(LessonID) {
        return await usersModels.getComment(LessonID);
    }

    async postComment(UserID, LessonID, Content) {
        return await usersModels.postComment(UserID, LessonID, Content);
    }

    async postReply(UserID, CommentID, Content) {
        return await usersModels.postReply(UserID, CommentID, Content);
    }

    async getUserCourses(UserID) {
        let result = await usersModels.getUserCourses(UserID);
        return result;
    }

    async getRecommendUsers(UserID) {
        const filepath = './train.csv';

        const recommendationSystem = new recommendUsers(filepath);
        const result = recommendationSystem.runRecommendationSystem(UserID);

        return result;
    }

    async getRecommendCourses(UserID) {
        await usersModels.createDatasetRecommendCourses();

        const filepath = './train.csv';        

        const recommendationSystem = new recommendCourses();
        const userInfo = await usersModels.getRelationshipMatrix(UserID);

        return await recommendationSystem.runRecommendationSystem(filepath, userInfo.result[0]);
    }

    async getCommunityDetect() {
        await usersModels.createDatasetRecommendCourses();

        const filepath = './train.csv';

        const communityDetection = new communityDetect();

        // Sử dụng lớp GraphConverter
        await communityDetection.convertCSVToGraphData(filepath);   
        let result = await communityDetection.runCommunityDetection();
        console.log(result);

        return result;
    }
}

module.exports = new UserController();
