const sql = require("mssql");
const fs = require('fs');
const stringComparison = require('string-comparison');
const { config } = require('dotenv');

require('dotenv').config();

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
}

async function getUser(username) {
    try {
        let result = await TruyVan("Admin", `select * from Users where UserID = '${username}'`);
        if (result.statusCode == 200) {
            return ({
                statusCode: 200,
                message: 'Thành công',
                result: result.result.recordset[0]
            });
        }
        else
            return ({
                statusCode: 404,
                message: 'Không tìm thấy user',
                alert: 'Không tìm thấy user'
            });
    } catch (err) {
        console.log("Lỗi getUser (users.models)", err);
        return ({
            statusCode: 500,
            message: 'Lỗi hệ thống!',
            alert: 'Lỗi hệ thống'
        });
    }
}

async function createUser(data, role) {
    try {
        let SQLQuery = `insert into Users 
            (UserID, Email, HashPassword, RefreshToken, SignUpDate, UserType) 
            values (N'${data.MaND}', N'NULL', N'NULL', N'NULL', 'GETDATE()', N'${role}')`;

        let result = await TruyVan("Admin", SQLQuery);

        if(result.statusCode == 200) {
            return ({
                statusCode: 200,
                message: 'Thành công',
                result: "Thêm thành công!"
            })

        } else {
            return ({
                statusCode: 500,
                message: 'Kiểm tra lại thông tin người dùng!',
                alert: 'Kiểm tra lại thông tin người dùng!',
                error: "Kiểm tra lại thông tin người dùng!"
            });
        }
    }
    catch (err) {
        console.log("Lỗi createUser (users.models)", err);
        return ({
            statusCode: 500,
            message: 'Lỗi hệ thống!',
            alert: 'Lỗi hệ thống'
        });
    }
}

async function updateRefreshToken(username, refreshToken) {
    await sql.connect(configUser);
    const request = await new sql.Request();
    const result = await request.query`
        update Users set RefreshToken = ${refreshToken} where UserID = ${username}`;
    await sql.close()
    return result.rowsAffected[0];
}

async function updatePassword(username, hashPassword) {
    try {
        let SQLQuery = `update Users set HashPassword = N'${hashPassword}' where UserID = N'${username}'`;
        let result = await TruyVan("Admin", SQLQuery);
        console.log(result)
        if (result.statusCode == 200)
            return ({
                statusCode: 200,
                message: 'Thành công',
                alert: 'Thành công',
            });
    } catch (err) {
        console.log("Lỗi updatePassword (users.models)", err);
        return ({
            statusCode: 500,
            message: 'Lỗi hệ thống!',
            alert: 'Lỗi hệ thống'
        });
    }
}

async function getUserCourses(username) {
    try {
        let data = await getUser(username);
        console.log(data)
        let sql_statement = `
            select * from Courses inner join User_Courses on Courses.CourseID = User_Courses.CourseID
            where User_Courses.UserID = N'${data.result.UserID}'`;
        let result = await TruyVan("Admin", sql_statement);
        if (result.statusCode == 200)
            return ({
                statusCode: 200,
                message: 'Thành công',
                result: result.result.recordset
            });
        else
            return ({
                statusCode: 500,
                message: 'Lỗi hệ thống!',
                alert: 'Lỗi hệ thống'
            });
    } catch (err) {
        console.log("Lỗi getUserCourses (users.models)", err);
        return ({
            statusCode: 500,
            message: 'Lỗi hệ thống!',
            alert: 'Lỗi hệ thống'
        });
    }
}


let pool, result;

async function ConnectSQL() {
    try {
        pool = new sql.ConnectionPool(configUser);
        result = await pool.connect();
        console.log("Kết nối thành công");
        console.log(result)
    } catch (err) {
        console.log("Lỗi kết nối (users.models)", err);
    }
}

ConnectSQL()

async function TruyVan(TypeUser, SQLQuery) {
    try {
        if (TypeUser == 'Admin') {
            // let pool = await new sql.ConnectionPool(configUser);
            // let result = await pool.connect();
            let queryResult = await result.query(SQLQuery);
            // pool.close();
            return {
                statusCode: 200,
                user: 'Admin',
                message: "Thành công",
                result: queryResult
            };
        }
    } catch (err) {
        console.log("Lỗi TruyVan (users.models)", SQLQuery, err);  
        return {
            statusCode: 500,
            message: 'Lỗi truy vấn SQL!'
        };
    }
}

exports.getUser = getUser;
exports.createUser = createUser;
exports.updateRefreshToken = updateRefreshToken;
exports.updatePassword = updatePassword;
exports.TruyVan = TruyVan;
exports.getUserCourses = getUserCourses;
