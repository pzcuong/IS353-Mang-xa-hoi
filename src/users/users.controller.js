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

    async joinCourse(req, res, next) {
        const result = await usersModels.joinCourse(req.user.result.UserID, req.params.id);
        return res.send(result);
    }

    async getLessonDetail(LessonID) {
        return await usersModels.getLessonDetail(LessonID);
    }

    async getComment(LessonID) {
        return await usersModels.getComment(LessonID);
    }

    async postComment(req, res, next) {
        const result = await usersModels.postComment(req.user.result.UserID, req.params.lesson_id, req.body.comment);
        return res.send(result);
    }

    async postReply(req, res, next) {
        return await usersModels.postReply(req.user.result.UserID, req.params.comment_id, req.body.reply);
    }

    async getUserCourses(UserID) {
        let result = await usersModels.getUserCourses(UserID);
        return result;
    }

    async getNoticeGroup() {
        return await usersModels.getNoticeGroup();
    }

    async getRecommendUsers(UserID) {
        const filepath = './train.csv';

        const recommendationSystem = new recommendUsers(filepath);
        const result = await recommendationSystem.runRecommendationSystem(UserID);

        let users_info = [];
        for(let i = 0; i < result.length; i++) {
            let user = await usersModels.getUser(result[i]);
            let count_same_courses = await usersModels.getUserSameCourse(UserID, result[i]);
            users_info[i] = user.result;
            users_info[i].count_same_courses = count_same_courses.result.num_courses;
        }

        return users_info;
    }

    async getRecommendCourses(UserID) {
        await usersModels.createDatasetRecommendCourses();

        const filepath = './train.csv';        

        const recommendationSystem = new recommendCourses();
        const userInfo = await usersModels.getRelationshipMatrix(UserID);

        const recommend_coursesID = await recommendationSystem.runRecommendationSystem(filepath, userInfo.result[0]);
        const courses_info = [];

        for (let i = 0; i < recommend_coursesID.length; i++) {
            let course = await usersModels.getCourseDetail(i+1);
            courses_info.push(course.result);
            if (courses_info[i] != undefined)
                courses_info[i].score = recommend_coursesID[i];
        }

        const filteredCourses = courses_info.filter(course => course !== undefined);
        filteredCourses.sort((a, b) => b.score - a.score)
        return filteredCourses;
    }

    async getCommunityDetect() {
        await usersModels.createDatasetRecommendCourses();

        const filepath = './train.csv';

        const communityDetection = new communityDetect();

        // Sử dụng lớp GraphConverter
        await communityDetection.convertCSVToGraphData(filepath);   
        let result = await communityDetection.runCommunityDetection();

        const communitiesByUserId = {};

        Object.entries(result.communities).forEach(([userId, communityId]) => {
        if (!communitiesByUserId[communityId]) {
            communitiesByUserId[communityId] = [];
        }
        communitiesByUserId[communityId].push(userId);
        });

        return communitiesByUserId;
    }

    async postNoticeGroup(req, res, next) {
        const result = await usersModels.postNoticeGroup(req.body);
        return res.send(result);
    }

    async getNotice(NoticeID) {
        const result = await usersModels.getNotice(NoticeID);
        return result;
    }
}

module.exports = new UserController();
