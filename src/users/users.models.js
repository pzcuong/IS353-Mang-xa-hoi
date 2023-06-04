const sql = require("mssql");
const { config } = require('dotenv');
const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

config();

const configUser = {
    user: process.env.user,
    password: process.env.password,
    server: process.env.server,
    database: process.env.database,
    port: 1433,
    driver: 'msnodesqlv8',
    options: {
        trustedConnection: false,
        encrypt: true
    },
    pool: {
        max: 99,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

class Database {
  constructor() {
    this.pool = null;
  }

  async connect() {
    this.pool = await sql.connect(configUser);
    console.log("Kết nối thành công");
  }

  async close() {
    await this.pool.close();
    this.pool = null;
  }

  async query(TypeUser, SQLQuery) {
    if (TypeUser !== 'Admin') {
      return {
        statusCode: 500,
        message: 'Lỗi truy vấn SQL!'
      };
    }

    const request = this.pool.request();
    const queryResult = await request.query(SQLQuery);

    return {
      statusCode: 200,
      user: 'Admin',
      message: "Thành công",
      result: queryResult.recordset
    };
  }
}

class User {
    constructor() {
        this.db = new Database();
    }

    async executeQuery(TypeUser, SQLQuery) {
        try {
            if (!this.db.pool) 
                await this.db.connect();
            const result = await this.db.query(TypeUser, SQLQuery);
            return result;
        } catch (err) {
            console.log("Lỗi executeQuery (users.models)", err);
            return {
                statusCode: 500,
                message: 'Lỗi hệ thống!',
                alert: 'Lỗi hệ thống'
            };
        }
    }

    async returnMessage(result, return_array=false) {
        if (return_array)
            return {
                statusCode: 200,
                message: 'Thành công',
                result: result.result
            }
        if (result.statusCode === 200) 
            return {
                statusCode: 200,
                message: 'Thành công',
                result: result.result[0]
            };
        else 
            return {
                statusCode: 500,
                message: 'Lỗi hệ thống!',
                alert: 'Lỗi hệ thống'
            };
    }

    async getUser(username) {
        const result = await this.executeQuery("Admin", `select * from Users where UserID = '${username}'`);
        return this.returnMessage(result);
    }

    async getUserSameCourse(username1, username2) {
        let sql = `SELECT count(a.courseid) as num_courses
        FROM user_courses AS a
        JOIN user_courses AS b ON a.courseid = b.courseid
        WHERE a.userid = N'${username1}' AND b.userid = N'${username2}';
        `
        const result = await this.executeQuery("Admin", sql);
        return this.returnMessage(result);
    }

    async createUser(data, role) {
        const SQLQuery = `insert into Users 
            (UserID, Email, HashPassword, RefreshToken, SignUpDate, UserType) 
            values (N'${data.MaND}', N'NULL', N'NULL', N'NULL', 'GETDATE()', N'${role}')`;

        const result = await this.executeQuery("Admin", SQLQuery);
        return this.returnMessage(result);
    }

    async updateRefreshToken(username, refreshToken) {
        const SQLQuery = `update Users set RefreshToken = ${refreshToken} where UserID = ${username}`;
        const result = await this.executeQuery("Admin", SQLQuery);
        return result.rowsAffected[0];
    }

    async updatePassword(username, hashPassword) {
        const SQLQuery = `update Users set HashPassword = N'${hashPassword}' where UserID = N'${username}'`;
        const result = await this.executeQuery("Admin", SQLQuery);
        return this.returnMessage(result);
    }

    async getUserCourses(username) {
        const data = await this.getUser(username);
        const sql_statement = `
            select * from Courses 
            inner join User_Courses on Courses.CourseID = User_Courses.CourseID
            where User_Courses.UserID = N'${data.result.UserID}'`;
        const result = await this.executeQuery("Admin", sql_statement);
        return this.returnMessage(result, true);
    }

    async getCourses() {
        return this.returnMessage(
            await this.executeQuery("Admin", "select * from Courses"),
            true // return array
        )
    }

    async getCourseDetail(CourseID) {
        let courseDetail = await this.executeQuery("Admin", `select * from Courses where CourseID = N'${CourseID}'`);
        let modulesDetail = await this.executeQuery("Admin", `select * from Modules where CourseID = N'${CourseID}'`);
        let modules = [];

        for (let i = 0; i < modulesDetail.result.length; i++) {
            let module = modulesDetail.result[i];
            let lessonsDetail = await this.executeQuery("Admin", `select * from Lessons where ModuleID = N'${module.ModuleID}'`);
        
            modules.push({
                module: module,
                lessons: lessonsDetail.result
            });
        }

        if (courseDetail.result.length === 0) 
            return {
                statusCode: 404,
                message: 'Không tìm thấy khóa học',
                alert: 'Không tìm thấy khóa học'
            };
        
        courseDetail.result[0].modules = modules;
        return this.returnMessage(courseDetail);
    }

    async joinCourse(UserID, CourseID) {
        const sql_statement = `insert into User_Courses (UserID, CourseID) values (N'${UserID}', N'${CourseID}')`;
        const result = await this.executeQuery("Admin", sql_statement); 
        if (result.statusCode === 200) 
            return {
                result: result.result,
                statusCode: 200,
                message: 'Thành công',
            }
        else 
            return {
                statusCode: 400,
                message: 'Bạn đã tham gia khóa học này',
                result: null
            }
    }

    async getLessonDetail(LessonID) {
        return this.returnMessage(
            await this.executeQuery("Admin", `select * from Lessons where LessonID = N'${LessonID}'`)
        )
    }

    async getComment(LessonID) {
        let commentDetail = await this.executeQuery("Admin", `select * from Comments where LessonID = N'${LessonID}'`);
        let comments = [];
        for(let i = 0; i < commentDetail.result.length; i++) {
            let comment = commentDetail.result[i];
            let replyDetail = await this.executeQuery("Admin", `select * from Replies where CommentID = N'${comment.CommentID}'`);
            comment.replies = replyDetail.result;
            comments.push({
                comment: comment,
                // replies: replyDetail.result
            });
        }

        commentDetail.result = comments;
        return this.returnMessage(commentDetail, true);
    }

    async postComment(UserID, LessonID, Content) {
        const sql_statement = `insert into Comments (UserID, LessonID, Comment, CommentDate) 
            values (N'${UserID}', N'${LessonID}', N'${Content}', GETDATE())`;
        const result = await this.executeQuery("Admin", sql_statement);
        if (result.statusCode === 200) 
            return {
                result: result.result,
                statusCode: 200,
                message: 'Bình luận thành công',
            }
        else 
            return {
                statusCode: 400,
                message: 'Bình luận thất bại',
                result: null
            }
    }

    async postReply(UserID, CommentID, Content) {
        const sql_statement = `insert into Replies (UserID, CommentID, Reply, ReplyDate)
            values (N'${UserID}', N'${CommentID}', N'${Content}', GETDATE())`;
        const result = await this.executeQuery("Admin", sql_statement);
        if (result.statusCode === 200)
            return {
                result: result.result,
                statusCode: 200,
                message: 'Trả lời thành công',
            }
        else
            return {
                statusCode: 400,
                message: 'Trả lời thất bại',
                result: null
            }
    }

    async createDatasetRecommendCourses() {
        // Read sql statement from file
        const sql_statement = fs.readFileSync('./GetData.sql').toString();
        const result = await this.executeQuery("Admin", sql_statement);
        // Write to csv file
        const csvWriter = createCsvWriter({
            path: './train.csv',
            header: [
                {id: 'UserID', title: 'UserID'},
                {id: 'Age', title: 'Age'},
                {id: 'Gender', title: 'Gender'},
                {id: 'Location', title: 'Location'},
                {id: 'AverageCourseRating', title: 'AverageCourseRating'},
                {id: 'PastCourses', title: 'PastCourses'},
                {id: 'SocialLinks', title: 'SocialLinks'}
            ]
        });
        let data = [];
        for (let i = 0; i < result.result.length; i++) {
            let row = result.result[i];
            data.push({
                UserID: row.UserID,
                Age: row.Age === null ? 0 : row.Age,
                Gender: row.Gender,
                Location: row.Location,
                AverageCourseRating: row.AverageCourseRating === null ? 0 : row.AverageCourseRating,
                PastCourses: row.PastCourses === null ? 'NULL' : row.PastCourses,
                SocialLinks: row.SocialLinks === null ? 'NULL' : row.SocialLinks
            });
        }
        csvWriter.writeRecords(data)
            .then(() => {
                console.log('...Done');
            });
        return {
            statusCode: 200,
            message: 'Thành công',
            result: result.result
        };
    }

    async getRelationshipMatrix(UserID) {
        const sql_statement = `SELECT * FROM dbo.GetRelationshipMatrix(N'${UserID}')`;

        return this.returnMessage(
            await this.executeQuery("Admin", sql_statement),
            true // return array
        )
    }

    async getNoticeGroup() {
        const sql_statement = `SELECT * FROM GroupNotice`;

        return this.returnMessage(
            await this.executeQuery("Admin", sql_statement),
            true // return array
        )
    }

    async postNoticeGroup(data) {
        const sql_statement = `INSERT INTO GroupNotice (Title, Content, Date) 
            VALUES (N'${data.Title}', N'${data.Content}', GETDATE())`;

        const result = await this.executeQuery("Admin", sql_statement);
        if (result.statusCode === 200)
            return {
                result: result.result,
                statusCode: 200,
                message: 'Thành công',
            }
        else
            return {
                statusCode: 400,
                message: 'Thất bại',
                result: null
            }
    }
    
    async getNotice(NoticeID) {
        const sql_statement = `SELECT * FROM GroupNotice WHERE NoticeID = N'${NoticeID}'`;

        return this.returnMessage(
            await this.executeQuery("Admin", sql_statement)
        )
    }

}

module.exports = new User();