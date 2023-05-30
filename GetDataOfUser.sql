CREATE FUNCTION GetRelationshipMatrix (@UserID NVARCHAR(100))
RETURNS TABLE
AS
RETURN
(
    -- Nội dung hàm
    WITH CourseData AS (
        SELECT DISTINCT 
            U.UserID,
            CAST(UC.CourseID AS NVARCHAR(10)) AS CourseID
        FROM
            Users U
        LEFT JOIN
            User_Courses UC ON U.UserID = UC.UserID
    ),
    SocialData AS (
        SELECT DISTINCT
            C.UserID,
            CAST(R.UserID AS NVARCHAR(100)) AS SocialUserID
        FROM
            Comments C
        LEFT JOIN
            Replies R ON C.CommentID = R.CommentID
    )
    SELECT 
        U.UserID,
        DATEDIFF(YEAR, U.DateOfBirth, GETDATE()) AS Age,
        U.Sex AS Gender,
        U.Address AS Location,
        AVG(CR.Rating) AS AverageCourseRating,
        (SELECT STRING_AGG(CourseData.CourseID, ',') FROM CourseData WHERE CourseData.UserID = U.UserID) AS [PastCourses],
        (SELECT STRING_AGG(SocialData.SocialUserID, ',') FROM SocialData WHERE SocialData.UserID = U.UserID) AS [SocialLinks]
    FROM
        Users U
    LEFT JOIN
        User_Courses UC ON U.UserID = UC.UserID
    LEFT JOIN
        Course_Ratings CR ON U.UserID = CR.UserID AND UC.CourseID = CR.CourseID
    WHERE U.UserID = @UserID
    GROUP BY 
        U.UserID, 
        DATEDIFF(YEAR, U.DateOfBirth, GETDATE()),
        U.Sex, 
        U.Address
)
