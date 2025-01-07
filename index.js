const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;


app.use(cors({
  origin: ['http://localhost:5173', 'https://steady-strudel-46e00d.netlify.app'],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());



const verifyToken = (req, res, next) => {
  const token = req?.cookies?.artifactToken;
  if (!token) {
    return res.status(401).send({ message: 'unauthorized access' });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'unauthorized access' });
    }
    req.decodedData = decoded;
    next();
  })
}


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
    const likedDB = artifactsDB.collection("likedDB");


    app.post('/jwt', (req, res) => {
      const email = req.body;
      const token = jwt.sign(email, process.env.JWT_SECRET, {expiresIn: '1h'});
      res.cookie('artifactToken', token, {
        httpOnly: true,
        secure:  process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      }).send({success: true})
    })



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

    app.get('/myArtifacts', verifyToken, async (req, res) => {
      const email = req.query.email;
      if(req.decodedData.email !== email){
        return res.status(403).send({message: 'forbidden access'});
      }
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

    app.get('/myArtifacts', async (req, res) => {
      const id = req.params._id;
      const query = {_id: new ObjectId(id)};
      const result = await allArtifacts.findOne(query);
      res.send(result);
    })

    app.get('/featuredArtifacts', async (req, res) => {
      const likedArtifacts = await allArtifacts.find().toArray();
      likedArtifacts.sort((a, b) => b.likes - a.likes);
      const featuredArtifacts = likedArtifacts.slice(0, 6);
      res.send(featuredArtifacts);
    })

    app.get('/findArtifacts', async (req, res) => {
      const keyword = req.query.name;
      const artifacts = await allArtifacts.find().toArray();
      const results = artifacts.filter(artifact => artifact.artifactName.toLowerCase().replace(/\s+/g, '').trim().includes(keyword));
      res.send(results);
    })

    app.post('/manageLikes', async (req, res) => {
      const data = req.body;
      const result = await likedDB.insertOne(data);
      res.send(result);
    })

    app.get('/likedList', async (req, res) => {
      const email = req.query.email;
      const id = req.query.id;
      const result = await likedDB.find().toArray();
      let filteredLike = [];
      result.map(res => {
        if(res.id === id && res.userEmail === email){
          filteredLike.push(res);
        }
      });
      res.send(...filteredLike);
    })

    app.delete('/likedList/:id', async (req, res) => {
      const id = req.params.id;
      const query = {id: id};
      const result = await likedDB.deleteOne(query);
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
