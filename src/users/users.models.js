const sql = require("mssql");
const { config } = require('dotenv');

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
        console.log(data);
        const sql_statement = `
            select * from Courses inner join User_Courses on Courses.CourseID = User_Courses.CourseID
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
}

module.exports = new User();