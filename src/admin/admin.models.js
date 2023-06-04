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

  async query(SQLQuery) {
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

class Admin {
    constructor() {
        this.db = new Database();
    }

    async executeQuery(SQLQuery) {
        try {
            if (!this.db.pool) 
                await this.db.connect();
            const result = await this.db.query(SQLQuery);
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

    async createAccount(user_data) {
        const UserID = user_data.UserID;
        const Email = user_data.Email;
        const UserType = user_data.UserType;
        const FullName = user_data.FullName;
        const DateOfBirth = user_data.DateOfBirth;
        const Sex = user_data.Sex;
        const Address = user_data.Address;

        const result = await this.executeQuery(
            `INSERT INTO Users (UserID, Email, HashPassword, RefreshToken, SignUpDate, UserType, FullName, DateOfBirth, Sex, Address) 
            VALUES ('${UserID}', '${Email}', 'NULL', 'NULL', GETDATE(), '${UserType}', N'${FullName}', '${DateOfBirth}', '${Sex}', N'${Address}')`
        );

        console.log(result)
   
        if (result.statusCode === 200) 
            return {
                statusCode: 200,
                message: 'Thành công',
                result: null
            };
        else 
            return {
                statusCode: 500,
                message: 'Lỗi khi tạo người dùng!',
                alert: 'Lỗi hệ thống'
            };
    }
                
}

module.exports = new Admin();