const tf = require('@tensorflow/tfjs-node');

const csv = require('csv-parser');
const fs = require('fs');
const util = require('util');
const pipeline = util.promisify(require('stream').pipeline);

let userCount = 0; // Keep track of the maximum number of users
let maxCourses = 0; // Keep track of the maximum number of courses

async function readCsv(file) {
    let results = [];
    await pipeline(
        fs.createReadStream(file),
        csv()
            .on('data', (data) => results.push(data))
    );
    userCount = results.length;
    // Find the maximum course number
    for (let user of results) {
        if (user['PastCourses'] !== 'NULL') {
            let courses = user['PastCourses'].split(',').map(Number);
            maxCourses = Math.max(maxCourses, ...courses);
        }
    }
    return results;
}

async function createCourseMatrix(file) {
    let results = await readCsv(file);
    // Initialize the course matrix
    let matrix = Array(userCount).fill().map(() => Array(maxCourses).fill(0));

    // Fill the course matrix
    for (let i = 0; i < results.length; i++) {
        if (results[i]['PastCourses'] !== 'NULL') {
            let courses = results[i]['PastCourses'].split(',');
            for (let course of courses) {
                matrix[i][Number(course) - 1] = 1; // Subtract 1 because course numbers start at 1
            }
        }
    }
    return matrix;
}

function createRelationshipMatrix(results) {
    // Initialize the relationship matrix
    let matrix = Array(userCount).fill().map(() => Array(userCount).fill(0));

    // Fill the relationship matrix
    for (let i = 0; i < results.length; i++) {
        if (results[i]['SocialLinks'] !== 'NULL') {
            let links = results[i]['SocialLinks'].split(',');
            for (let link of links) {
                let index = results.findIndex(user => user['UserID'] === link);
                if (index !== -1) {
                    matrix[i][index] = 1;
                    matrix[index][i] = 1; // Since the relationship is mutual
                }
            }
        }
    }
    return matrix;
}

async function transformData(newUser, results) {
  // Convert 'NULL' values to 0 and convert 'Nam' to 0 and 'Nu' to 1 for gender
  let age = newUser['Age'] === 'NULL' ? 0 : parseInt(newUser['Age']);
  let gender = newUser['Gender'] === 'Nam' ? 0 : 1;
  let averageCourseRating = newUser['AverageCourseRating'] === 'NULL' ? 0 : parseFloat(newUser['AverageCourseRating']);

  // Create a new relationship row for the new user
  let relationshipRow = Array(userCount).fill(0);
  if (newUser['SocialLinks'] !== 'NULL') {
      let links = newUser['SocialLinks'].split(',');
      for (let link of links) {
          let index = results.findIndex(user => user['UserID'] === link);
          if (index !== -1) {
              relationshipRow[index] = 1;
          }
      }
  }

  return [age, gender, averageCourseRating, ...relationshipRow]
}

async function transformCsv(file) {
    let results = await readCsv(file);
    let relationshipMatrix = createRelationshipMatrix(results);

    let finalMatrix = []

    // Print the final data
    for (let i = 0; i < results.length; i++) {
        let age = results[i]['Age'] === 'NULL' ? 0 : parseInt(results[i]['Age']);
        let gender = results[i]['Gender'] === 'Nam' ? 0 : 1;
        let averageCourseRating = results[i]['AverageCourseRating'] === 'NULL' ? 0 : parseFloat(results[i]['AverageCourseRating']);

        // console.log([results[i]['Age'], results[i]['Gender'], results[i]['AverageCourseRating'], ...relationshipMatrix[i]].join(','));
        finalMatrix.push([age, gender, averageCourseRating, ...relationshipMatrix[i]]);
    }

    // Return results and relationship matrix for further use
    return { results, relationshipMatrix, finalMatrix };
}

async function main() {
    let { results, relationshipMatrix, finalMatrix } = await transformCsv('train.csv');
    let courseMatrix = await createCourseMatrix('train.csv');

    console.log(finalMatrix);
    console.log(courseMatrix);

    // Convert the data to tensors
    const tensorX = tf.tensor2d(finalMatrix).reshape([finalMatrix.length, finalMatrix[0].length, 1, 1]);
    const tensorY = tf.tensor2d(courseMatrix);

    // Define a model for multi-label classification.
    const model = tf.sequential();
    // model.add(tf.layers.dense({units: pastCoursesData.uniqueValues.length, inputShape: [x[0].length], activation: 'sigmoid'})); // adjust inputShape to match data dimension
    model.add(tf.layers.conv2d({
      filters: 64,
      kernelSize: [3, 1],
      activation: 'relu',
      useBias: true,
      inputShape: [finalMatrix[0].length, 1, 1]
    }));
    
    model.add(tf.layers.conv2d({
      filters: 32,
      kernelSize: [2, 1],
      activation: 'relu',
      useBias: true
    }));
    
    model.add(tf.layers.flatten());
    
    model.add(tf.layers.dense({
      units: 32,
      activation: 'relu',
      useBias: true
    }));
    
    model.add(tf.layers.dense({
      units: courseMatrix[0].length,
      activation: 'softmax',
      kernelInitializer: 'randomNormal'
    }));
    // Prepare the model for training: Specify the loss and the optimizer.
    // model.compile({loss: 'binaryCrossentropy', optimizer: 'adam'});
    // Compile the model
    model.compile({
      optimizer: 'sgd',
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    // Train the model using the data.
    await model.fit(tensorX, tensorY, { epochs: 10, batchSize: 32 });

    let newUser = {
      UserID: "INST004",
      Age: "33",
      Gender: "Nu",
      Location: "321 Pine Ln",
      AverageCourseRating: "NULL",
      PastCourses: "NULL",
      SocialLinks: "STUD002"
    };

    let inputData = await transformData(newUser, results);

    const prediction = await model.predict(tf.tensor2d(inputData, [1, inputData.length]).reshape([1, inputData.length, 1, 1]));

    prediction.data().then(predictionData => {
      const predictionArray = Array.from(predictionData);
      console.log(predictionArray);  // print the predicted courses
    });
}

main();

