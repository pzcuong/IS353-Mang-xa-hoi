CREATE TABLE Users (
    UserID NVARCHAR(100) PRIMARY KEY,
    Email NVARCHAR(100),
    HashPassword NVARCHAR(100), -- Consider storing hashed passwords, not plaintext
	RefreshToken NVARCHAR(100),
    SignUpDate DATE,
    UserType NVARCHAR(10) CHECK(UserType IN ('student', 'instructor')),
    FullName NVARCHAR(100),
    DateOfBirth DATE,
    Sex NVARCHAR(4),
    PhoneNumber NVARCHAR(10),
    Address NVARCHAR(100)
);

CREATE TABLE Courses (
    CourseID INT IDENTITY(1,1) PRIMARY KEY,
    CourseName NVARCHAR(100),
    CourseDescription TEXT,
    InstructorID NVARCHAR(100),
    FOREIGN KEY (InstructorID) REFERENCES Users(UserID)
);

CREATE TABLE Modules (
    ModuleID INT IDENTITY(1,1) PRIMARY KEY,
    ModuleName NVARCHAR(100),
    ModuleDescription TEXT,
    CourseID INT,
    FOREIGN KEY (CourseID) REFERENCES Courses(CourseID)
);

CREATE TABLE Lessons (
    LessonID INT IDENTITY(1,1) PRIMARY KEY,
    LessonName NVARCHAR(100),
    LessonContent TEXT,
    ModuleID INT,
    FOREIGN KEY (ModuleID) REFERENCES Modules(ModuleID)
);

CREATE TABLE User_Courses (
    UserID NVARCHAR(100),
    CourseID INT,
    EnrollmentDate DATE,
    PRIMARY KEY (UserID, CourseID),
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (CourseID) REFERENCES Courses(CourseID)
);

CREATE TABLE Progress (
    UserID NVARCHAR(100),
    CourseID INT,
    LessonID INT,
    LastAccessed DATE,
    Progress NVARCHAR(12) CHECK(Progress IN ('Not Started', 'In Progress', 'Completed')),
    PRIMARY KEY (UserID, CourseID, LessonID),
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (CourseID) REFERENCES Courses(CourseID),
    FOREIGN KEY (LessonID) REFERENCES Lessons(LessonID)
);

CREATE TABLE Course_Ratings (
    UserID NVARCHAR(100),
    CourseID INT,
    Rating INT CHECK (Rating BETWEEN 1 AND 5), -- assuming a 5-star rating system
    PRIMARY KEY (UserID, CourseID),
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (CourseID) REFERENCES Courses(CourseID)
);

CREATE TABLE Comments (
    CommentID INT IDENTITY(1,1) PRIMARY KEY,
    UserID NVARCHAR(100),
    LessonID INT,
    Comment TEXT,
    CommentDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (LessonID) REFERENCES Lessons(LessonID)
);

CREATE TABLE Replies (
    ReplyID INT IDENTITY(1,1) PRIMARY KEY,
    CommentID INT,
    UserID NVARCHAR(100),
    Reply TEXT,
    ReplyDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (CommentID) REFERENCES Comments(CommentID),
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

CREATE TABLE GroupNotice (
    NoticeID INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(100),
    Content NVARCHAR(MAX),
    Date DATETIME DEFAULT GETDATE(),
);


INSERT INTO Users (UserID, Email, HashPassword, RefreshToken, SignUpDate, UserType)
VALUES ('admin', 'pzcuonguit@gmail.com', 'NULL', 'NULL', GETDATE(), 'instructor');

UPDATE Users SET FullName = N'Phạm Quốc Cường', Sex = 'Male', PhoneNumber = '0387152838', Address = N'KTX Khu A, KP 6, Linh Trung, Thủ Đức, Hồ Chí Minh' WHERE UserID = 'admin';


INSERT INTO Users (UserID, Email, SignUpDate, UserType, FullName, DateOfBirth, Sex, PhoneNumber, Address)
VALUES
    ('INST001', 'instructor1@example.com', '2023-01-01', 'instructor', 'John Smith', '1980-05-10', 'Nam', '1234567890', '123 Main St'),
    ('INST002', 'instructor2@example.com', '2023-01-02', 'instructor', 'Jane Doe', '1985-09-15', 'Nu', '9876543210', '456 Elm St'),
    ('INST003', 'instructor3@example.com', '2023-01-03', 'instructor', 'Mike Johnson', '1975-03-22', 'Nam', '5555555555', '789 Oak Ave'),
    ('INST004', 'instructor4@example.com', '2023-01-04', 'instructor', 'Emily Wilson', '1990-12-05', 'Nu', '1112223333', '321 Pine Ln');

INSERT INTO Courses (CourseName, CourseDescription, InstructorID)
VALUES
    ('Introduction to Programming', 'Learn the basics of programming.', 'INST001'),
    ('Database Management', 'Explore concepts of database design and management.', 'INST002'),
    ('Web Development Fundamentals', 'Introduction to web development technologies.', 'INST001'),
    ('Network Security', 'Learn about securing computer networks.', 'INST003'),
    ('Software Engineering Principles', 'Study software development methodologies.', 'INST004'),
    ('Data Structures and Algorithms', 'Learn about common data structures and algorithms.', 'INST002'),
    ('Mobile App Development', 'Develop applications for mobile devices.', 'INST001'),
    ('Cloud Computing', 'Explore cloud computing technologies.', 'INST003'),
    ('Artificial Intelligence', 'Introduction to AI concepts and techniques.', 'INST004'),
    ('Cybersecurity', 'Study methods to protect computer systems from security threats.', 'INST003');

INSERT INTO User_Courses (UserID, CourseID, EnrollmentDate)
VALUES ('admin', 2, GETDATE())


INSERT INTO Users (UserID, Email, SignUpDate, UserType, FullName, DateOfBirth, Sex, PhoneNumber, Address)
VALUES
    ('STUD001', 'student1@example.com', '2023-02-01', 'student', 'David Johnson', '1998-07-20', 'Nam', '5551112222', '789 Oak Ave'),
    ('STUD002', 'student2@example.com', '2023-02-02', 'student', 'Sarah Wilson', '1995-11-12', 'Nu', '7778889999', '321 Pine Ln');

-- Insert values into Modules table (modules for the courses)
INSERT INTO Modules (ModuleName, ModuleDescription, CourseID)
VALUES
    ('Introduction to Programming Concepts', 'Basics of programming languages and concepts.', 2),
    ('Database Design and Modeling', 'Principles of database design and entity-relationship modeling.', 3),
    ('HTML and CSS Fundamentals', 'Foundations of web development using HTML and CSS.', 4),
    ('Network Protocols and Security', 'Understanding network protocols and implementing network security measures.', 5),
    ('Software Development Life Cycle', 'Phases and processes of software development life cycle.', 6),
    ('Data Structures in Java', 'Common data structures implementation in Java programming language.', 7),
    ('Android App Development', 'Building mobile applications for Android platform.', 8),
    ('Cloud Infrastructure and Deployment', 'Managing and deploying applications on cloud platforms.', 9),
    ('Introduction to AI Algorithms', 'Fundamental AI algorithms and their applications.', 10),
    ('Cybersecurity Best Practices', 'Best practices for securing computer systems and networks.', 11);

-- Insert values into Lessons table (lessons within modules)
INSERT INTO Lessons (LessonName, LessonContent, ModuleID)
VALUES
    ('Variables and Control Structures', 'Overview of variables, data types, and control structures.', 2),
    ('Entity-Relationship Diagrams', 'Creating ER diagrams for database design.', 3),
    ('Introduction to HTML', 'Basics of HTML tags and elements.', 4),
    ('Firewalls and Intrusion Detection Systems', 'Types of firewalls and IDS techniques.', 5),
    ('Agile Software Development', 'Understanding agile methodologies.', 6),
    ('Linked Lists and Stacks', 'Implementing linked lists and stacks in Java.', 7),
    ('Building User Interfaces', 'Creating user interfaces for Android apps.', 8),
    ('Deploying Applications on AWS', 'Deploying applications on Amazon Web Services.', 9),
    ('Machine Learning Algorithms', 'Overview of machine learning algorithms.', 10),
    ('Network Security Principles', 'Principles and practices for network security.', 11);


-- Insert values into User_Courses table (enrollments of users in courses)
INSERT INTO User_Courses (UserID, CourseID, EnrollmentDate)
VALUES
    ('STUD001', 2, '2023-02-10'),
    ('STUD001', 3, '2023-02-15'),
    ('STUD002', 2, '2023-02-12'),
    ('STUD002', 5, '2023-02-17');

-- Insert values into Progress table (tracking user progress in lessons)
INSERT INTO Progress (UserID, CourseID, LessonID, LastAccessed, Progress)
VALUES
    ('STUD001', 2, 4, '2023-02-12', 'Completed'),
    ('STUD001', 3, 3, '2023-02-15', 'Not Started'),
    ('STUD002', 2, 4, '2023-02-13', 'In Progress'),
    ('STUD002', 5, 5, '2023-02-17', 'In Progress');

-- Insert values into Course_Ratings table (ratings provided by users for courses)
INSERT INTO Course_Ratings (UserID, CourseID, Rating)
VALUES
    ('STUD001', 2, 4),
    ('STUD002', 2, 5),
    ('STUD001', 3, 3),
    ('STUD002', 5, 4);

-- Insert values into Comments table (comments by users on lessons)
INSERT INTO Comments (UserID, LessonID, Comment)
VALUES
    ('STUD001', 3, 'Great introduction to programming concepts.'),
    ('STUD001', 3, 'I found this lesson very helpful.'),
    ('STUD002', 4, 'Interesting lesson on network security.'),
    ('STUD002', 4, 'I enjoyed learning about firewalls.');

-- Insert values into Replies table (replies to comments by users)
INSERT INTO Replies (CommentID, UserID, Reply)
VALUES
    (9, 'INST001', 'Thank you for your feedback.'),
    (10, 'INST002', 'Glad to hear that you found it helpful.'),
    (9, 'INST002', 'I am glad you enjoyed it!'),
    (11, 'INST001', 'Great to hear your positive feedback.');

SELECT
    U.UserID,
    U.FullName,
    U.DateOfBirth,
    U.Sex,
    U.Address,
    U.Email,
    U.PhoneNumber,
    C.CourseID,
    C.CourseName,
    C.CourseDescription,
    U2.FullName AS InstructorName,
    M.ModuleID,
    M.ModuleName,
    M.ModuleDescription,
    L.LessonID,
    L.LessonName,
    L.LessonContent,
    UC.EnrollmentDate,
    P.LastAccessed,
    P.Progress,
    CR.Rating,
    CMT.CommentID,
    CMT.Comment,
    CMT.CommentDate,
    R.ReplyID,
    R.Reply,
    R.ReplyDate
FROM
    Users U
    INNER JOIN User_Courses UC ON U.UserID = UC.UserID
    INNER JOIN Courses C ON UC.CourseID = C.CourseID
    LEFT JOIN Users U2 ON C.InstructorID = U2.UserID
    LEFT JOIN Modules M ON C.CourseID = M.CourseID
    LEFT JOIN Lessons L ON M.ModuleID = L.ModuleID
    LEFT JOIN Progress P ON U.UserID = P.UserID AND C.CourseID = P.CourseID AND L.LessonID = P.LessonID
    LEFT JOIN Course_Ratings CR ON U.UserID = CR.UserID AND C.CourseID = CR.CourseID
    LEFT JOIN Comments CMT ON U.UserID = CMT.UserID AND L.LessonID = CMT.LessonID
    LEFT JOIN Replies R ON CMT.CommentID = R.CommentID
ORDER BY
    U.UserID,
    C.CourseID,
    M.ModuleID,
    L.LessonID,
    CMT.CommentID,
    R.ReplyID;
