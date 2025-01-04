const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;


app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());




const uri = `mongodb+srv://${process.env.DATABASE_USER}:${process.env.DATABASE_PASS}@cluster0.hhplj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const artifactsDB = client.db("artifactsDB");
    const allArtifacts = artifactsDB.collection("allArtifacts");



    app.post('/allArtifacts', async (req, res) => {
      const data = req.body;
      const result = await allArtifacts.insertOne(data);
      res.send(result);
    })

    app.get('/allArtifacts', async (req, res) => {
      const result = await allArtifacts.find().toArray();
      res.send(result);
    })

    app.get('/allArtifacts/:id', async (req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await allArtifacts.findOne(query);
      res.send(result);
    })

    app.get('/myArtifacts', async (req, res) => {
      const email = req.query.email;
      const query = {myEmail: email};
      const result = await allArtifacts.find(query).toArray();
      res.send(result);
    })

    app.delete('/allArtifacts/:id', async (req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await allArtifacts.deleteOne(query);
      res.send(result);
    })

    app.patch('/myArtifacts/:id', async (req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const opt = {upsert: true};
      const {artifactName, artifactImage, artifactType, historicalContext, createdAt, discoverdAt, discoverdBy, presentLocation} = req.body;
      const updatedData = {
        $set: {
          artifactName: artifactName,
          artifactImage: artifactImage, 
          artifactType: artifactType, 
          historicalContext: historicalContext, 
          createdAt: createdAt, 
          discoverdAt: discoverdAt, 
          discoverdBy: discoverdBy, 
          presentLocation: presentLocation,
        }
      };
      const result = await allArtifacts.updateOne(filter, updatedData, opt);
      res.send(result);
    })
    app.get('/myArtifacts/:id', async (req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await allArtifacts.findOne(query);
      res.send(result);
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!');
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
})
