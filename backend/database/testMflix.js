// Import dotenv
import dotenv from 'dotenv';
dotenv.config();

// Import mongoose
import mongoose from 'mongoose';

//console.log(process.env.MONGODB_URI);
// mongoose.connect(process.env.MONGODB_URI)
//     .then(() => {
//         console.log('Connected to MongoDB');
//     })
//     .catch((error) => {
//         console.error('Failed to connect to MongoDB', error);
//     });

async function testMflix() {


  console.log('inside testMflix()')
    // Open the sample_mflix database
    await mongoose.connect("mongodb+srv://perscholas:kA3GqdrJlVuRuTMT@cluster0.mf4c7.mongodb.net/sample_mflix?retryWrites=true&w=majority&appName=FirstCluster")
        .then(() => {
            console.log('Connected to MongoDB');
        })
        .catch((error) => {
            console.error('Failed to connect to MongoDB', error);
    })
        
    // Access the 'sample_mflix' collection
    const db = mongoose.connection;
    const sampleMflixCollection = db.collection('movies');

    // Example: Find one document in the 'sample_mflix' collection
    await sampleMflixCollection.findOne({}, (err, document) => {
        if (err) {
            console.error('Error fetching document:', err);
        } else {
            console.log('Document:', document);
        }
    })
}

// await testMflix();

export { testMflix }