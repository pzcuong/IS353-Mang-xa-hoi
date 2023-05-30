const tf = require("@tensorflow/tfjs-node");
const csv = require("csv-parser");
const fs = require("fs");
const util = require("util");
const pipeline = util.promisify(require("stream").pipeline);

class RecommendationSystem {
  constructor() {
    this.userCount = 0;
    this.maxCourses = 0;
    this.results = [];
    this.relationshipMatrix = [];
    this.finalMatrix = [];
    this.courseMatrix = [];
    this.model = null;
  }

  async loadCsv(file) {
    const results = [];
    await pipeline(
      fs.createReadStream(file),
      csv().on("data", (data) => results.push(data))
    );
    this.results = results;
    this.userCount = results.length;
    this.maxCourses = this.findMaxCourses(results);
  }

  findMaxCourses(results) {
    let maxCourses = 0;
    for (let user of results) {
      if (user["PastCourses"] !== "NULL") {
        const courses = user["PastCourses"].split(",").map(Number);
        maxCourses = Math.max(maxCourses, ...courses);
      }
    }
    return maxCourses;
  }

  createCourseMatrix() {
    const matrix = Array(this.userCount)
      .fill()
      .map(() => Array(this.maxCourses).fill(0));
    for (let i = 0; i < this.results.length; i++) {
      if (this.results[i]["PastCourses"] !== "NULL") {
        const courses = this.results[i]["PastCourses"].split(",");
        for (let course of courses) {
          matrix[i][Number(course) - 1] = 1;
        }
      }
    }
    this.courseMatrix = matrix;
  }

  createRelationshipMatrix() {
    const matrix = Array(this.userCount)
      .fill()
      .map(() => Array(this.userCount).fill(0));
    for (let i = 0; i < this.results.length; i++) {
      if (this.results[i]["SocialLinks"] !== "NULL") {
        const links = this.results[i]["SocialLinks"].split(",");
        for (let link of links) {
          const index = this.results.findIndex(
            (user) => user["UserID"] === link
          );
          if (index !== -1) {
            matrix[i][index] = 1;
            matrix[index][i] = 1;
          }
        }
      }
    }
    this.relationshipMatrix = matrix;
  }

  async transformData(newUser) {
    const age = newUser["Age"] === "NULL" ? 0 : parseInt(newUser["Age"]);
    const gender = newUser["Gender"] === "Nam" ? 0 : 1;
    const averageCourseRating =
      newUser["AverageCourseRating"] === "NULL"
        ? 0
        : parseFloat(newUser["AverageCourseRating"]);

    const relationshipRow = Array(this.userCount).fill(0);
    if (newUser["SocialLinks"] !== "NULL") {
      const links = newUser["SocialLinks"].split(",");
      for (let link of links) {
        const index = this.results.findIndex((user) => user["UserID"] === link);
        if (index !== -1) {
          relationshipRow[index] = 1;
        }
      }
    }

    return [age, gender, averageCourseRating, ...relationshipRow];
  }

  async transformCsv(file) {
    await this.loadCsv(file);
    this.createRelationshipMatrix();
    this.createCourseMatrix();

    this.finalMatrix = this.results.map((user, i) => {
      const age = user["Age"] === "NULL" ? 0 : parseInt(user["Age"]);
      const gender = user["Gender"] === "Nam" ? 0 : 1;
      const averageCourseRating =
        user["AverageCourseRating"] === "NULL"
          ? 0
          : parseFloat(user["AverageCourseRating"]);
      return [age, gender, averageCourseRating, ...this.relationshipMatrix[i]];
    });

    return {
      results: this.results,
      relationshipMatrix: this.relationshipMatrix,
      finalMatrix: this.finalMatrix,
    };
  }

  async trainModel() {
    // Convert the data to tensors
    const tensorX = tf
      .tensor2d(this.finalMatrix)
      .reshape([this.finalMatrix.length, this.finalMatrix[0].length, 1, 1]);
    const tensorY = tf.tensor2d(this.courseMatrix);

    // Define a model for multi-label classification.
    const model = tf.sequential();
    model.add(
      tf.layers.conv2d({
        filters: 64,
        kernelSize: [3, 1],
        activation: "relu",
        useBias: true,
        inputShape: [this.finalMatrix[0].length, 1, 1],
      })
    );
    model.add(
      tf.layers.conv2d({
        filters: 32,
        kernelSize: [2, 1],
        activation: "relu",
        useBias: true,
      })
    );
    model.add(tf.layers.flatten());
    model.add(
      tf.layers.dense({
        units: 32,
        activation: "relu",
        useBias: true,
      })
    );
    model.add(
      tf.layers.dense({
        units: this.courseMatrix[0].length,
        activation: "softmax",
        kernelInitializer: "randomNormal",
      })
    );
    model.compile({
      optimizer: "sgd",
      loss: "categoricalCrossentropy",
      metrics: ["accuracy"],
    });

    // Train the model using the data.
    await model.fit(tensorX, tensorY, { epochs: 10, batchSize: 32 });
    this.model = model;
  }

  async predictCourses(newUser) {
    const inputData = await this.transformData(newUser);
    const prediction = await this.model.predict(
      tf
        .tensor2d(inputData, [1, inputData.length])
        .reshape([1, inputData.length, 1, 1])
    );
    const predictionData = await prediction.data();
    const predictionArray = Array.from(predictionData);
    console.log(predictionArray); // print the predicted courses
  }

  async runRecommendationSystem(file, newUser) {
    await this.transformCsv(file);
    await this.trainModel();
    await this.predictCourses(newUser);
  }
}

// Usage example
const recommendationSystem = new RecommendationSystem();
recommendationSystem.runRecommendationSystem("train.csv", {
  UserID: "INST004",
  Age: "33",
  Gender: "Nu",
  Location: "321 Pine Ln",
  AverageCourseRating: "NULL",
  PastCourses: "NULL",
  SocialLinks: "STUD002",
});
