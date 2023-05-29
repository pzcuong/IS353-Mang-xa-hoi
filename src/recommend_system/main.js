const csv = require('csvtojson');

// Preprocess the data
async function preprocessData() {
  try {
    // Read the CSV file and convert it to JSON
    const jsonData = await csv().fromFile('/Users/pzcuong/Desktop/SE104-QuanLyHocSinh-master/train.csv');

    // Handle missing values and convert data into suitable formats
    const processedData = jsonData.map((user) => {
      const processedUser = { ...user };
      // Handle missing values
      if (processedUser.AverageCourseRating === 'NULL') {
        processedUser.AverageCourseRating = 0; // Replace with appropriate default value
      }
      if (processedUser.PastCourses === 'NULL') {
        processedUser.PastCourses = ''; // Replace with appropriate default value
      }
      if (processedUser.SocialLinks === 'NULL') {
        processedUser.SocialLinks = ''; // Replace with appropriate default value
      }
      // Split PastCourses into an array
      processedUser.PastCourses = processedUser.PastCourses.split(',');
      return processedUser;
    });

    return processedData;
  } catch (error) {
    console.error('Error while reading CSV:', error);
    return [];
  }
}

// Calculate similarity between users based on shared courses
function calculateUserSimilarity(user1, user2) {
  // Calculate similarity between users based on relevant features (e.g., shared courses)
  const sharedCourses = [...new Set(user1.PastCourses.filter((course) => user2.PastCourses.includes(course)))];
  const similarity = sharedCourses.length / Math.sqrt(user1.PastCourses.length * user2.PastCourses.length);
  return similarity;
}

// Generate recommendations for a user based on user similarities
function generateRecommendations(userID, data) {
  const user = data.find((user) => user.UserID === userID);
  if (!user) {
    console.log('User not found!');
    return [];
  }

  const recommendations = [];
  for (const otherUser of data) {
    if (otherUser.UserID !== user.UserID) {
      const similarity = calculateUserSimilarity(user, otherUser);
      if (similarity > 0) {
        recommendations.push({ UserID: otherUser.UserID, Similarity: similarity });
      }
    }
  }

  // Sort recommendations by similarity in descending order
  recommendations.sort((a, b) => b.Similarity - a.Similarity);

  return recommendations;
}

// Usage example
async function runRecommendationSystem() {
  // Preprocess the data
  const processedData = await preprocessData();

  // Generate recommendations for a user
  const userID = 'INST002';
  const recommendations = generateRecommendations(userID, processedData);

  // Print the recommendations
  console.log(`Recommended courses for User ${userID}:`);
  recommendations.forEach((recommendation, index) => {
    console.log(`- Recommendation ${index + 1}: User ${recommendation.UserID} - Similarity: ${recommendation.Similarity}`);
  });
}

// Run the recommendation system
runRecommendationSystem();
