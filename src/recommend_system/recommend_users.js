const csv = require('csvtojson');

class User {
  constructor(data) {
    this.userID = data.UserID;
    this.averageCourseRating = this.handleMissingValue(data.AverageCourseRating, 0);
    this.pastCourses = this.handleMissingValue(data.PastCourses, '').split(',');
    this.socialLinks = this.handleMissingValue(data.SocialLinks, '');
  }

  handleMissingValue(value, defaultValue) {
    return value === 'NULL' ? defaultValue : value;
  }
}

class RecommendationSystem {
  constructor(filepath) {
    this.filepath = filepath;
    this.data = [];
  }

  async loadAndPreprocessData() {
    try {
      const jsonData = await csv().fromFile(this.filepath);
      this.data = jsonData.map((user) => new User(user));
    } catch (error) {
      console.error('Error while reading CSV:', error);
    }
  }

  calculateUserSimilarity(user1, user2) {
    const sharedCourses = [...new Set(user1.pastCourses.filter((course) => user2.pastCourses.includes(course)))];
    const similarity = sharedCourses.length / Math.sqrt(user1.pastCourses.length * user2.pastCourses.length);
    return similarity;
  }

  generateRecommendations(userID) {
    const user = this.data.find((user) => user.userID === userID);
    if (!user) {
      console.log('User not found!');
      return [];
    }

    const recommendations = this.data
      .filter((otherUser) => otherUser.userID !== user.userID)
      .map((otherUser) => ({
        userID: otherUser.userID,
        similarity: this.calculateUserSimilarity(user, otherUser)
      }))
      .filter((recommendation) => recommendation.similarity > 0)
      .sort((a, b) => b.similarity - a.similarity);

    return recommendations;
  }

  async runRecommendationSystem(userID) {
    let return_array = [];
    await this.loadAndPreprocessData();
    const recommendations = this.generateRecommendations(userID);
    console.log(`Recommended users for ${userID}:`);
    recommendations.forEach((recommendation, index) => {
      console.log(`- Recommendation ${index + 1}: User ${recommendation.userID} - Similarity: ${recommendation.similarity}`);
      return_array.push(recommendation.userID);
    });

    return return_array;
  }
}

module.exports = RecommendationSystem;
