const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config()


const app = express()

app.use(bodyParser.json());
app.use(cors());

app.use(express.static('uploads'));
app.use(fileUpload());

const PORT = 5000;


app.get('/', (req, res) => {
    console.log('')
    res.json({msg: "Your api call is successfully completed!"});
})

//  Mongodb connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mycjj.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// client.connect(err => {
//   const userCollection = client.db(`${process.env.DB_NAME}`).collection("customersDB");
//   perform actions on the collection object
//   client.close();
// });

 const dbConnection = async () => {
    try {
        const response = await client.connect();
        console.log('database connected successfully!');
        // console.log(response);
        // await listDatabases(client);
        const userCollection =  client.db(`${process.env.DB_NAME}`).collection("customersDB");
        const services = client.db("creative-agency").collection("services");
        const feedbacks = client.db("creative-agency").collection("feedbacks");
        const orderList = client.db("creative-agency").collection("orderList");
        const dbAdmins = client.db('creative-agency').collection("dbAdmins");
        // Getting services from db and sending to the FrontEnd
        app.get('/services', (req, res) => {
           services.find({}).sort({_id: -1}).limit(6)
           .toArray((err, documents) => {
            //    console.log(documents);
               res.send(documents);
           })
        })

        // Getting feedbacks from db and sending to the FrontEnd
        app.get('/feedbacks', (req, res) => {
            feedbacks.find({}).sort({_id: -1}).limit(6)
           .toArray((err, documents) => {
            //    console.log(documents);
               res.send(documents);
           })
        })


        // Customer Order -  Method: POST
        app.post('/placeAOrder', (req, res) => {
            console.log(req.files.imgFile);
            const imgFile = req.files.imgFile;
            const newImg = imgFile.data;
            const encImg = newImg.toString('base64');

            const image = {
                contentType: imgFile.mimetype,
                size: imgFile.size,
                img: Buffer.from(encImg, 'base64')
            }
            console.log(image);
            const {name, email, description, price} = req.body;

            orderList.insertOne({name, email, description, price, image})
            .then(result => {
                res.send(result.insertedCount > 0);
            })
        })

        // Find all the orders
        app.get('/orders', (req, res) => {
            orderList.find({})
            .toArray((err, documents) => {
                console.log(documents);
                res.send(documents);
            })
        })

        // Add a review
        app.post('/addAFeedback', (req, res) => {
            console.log(req.body);
            const {name: user, company, description: feedback, email} = req.body;
            feedbacks.insertOne({
                user,
                email,
                feedback,
                company
            })
            .then(result => {
                res.send(result.insertedCount > 0);
            })
        })

        // Make Admin
        app.post('/makeAdmin', (req, res) => {
            console.log(req.body.email);
        })

        // Check admin
        app.post('/isAdmin', (req,  res) => {
            // console.log(req.body.email);
            // dbAdmins.find({})
            // .then(result => console.log(result));
            dbAdmins.find({email: req.body.email})
            .toArray((err, admins) => {
                console.log('isAdmin', admins.length > 0);
                res.send(admins.length > 0);
            })
        })
    

    } catch (e) {
        console.error(e);
    }finally {
        // await client.close();
    }
}

dbConnection();

async function listDatabases(client){
    databasesList = await client.db().admin().listDatabases();

    console.log("Databases:");
    databasesList.databases.forEach(db => console.log(` - ${db.name}`));
};



// Listening port 5000
app.listen(process.env.PORT || PORT, () => {
    console.log(`Server started at PORT ${process.env.PORT || PORT}`);
} )
