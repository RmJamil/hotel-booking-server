const express = require('express')
var admin = require("firebase-admin");

var serviceAccount = require("./Firebase-admin-key.json");
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port =process.env.PORT|| 3000;

const dotenv = require('dotenv')
dotenv.config();
var cors = require('cors')


console.log(process.env.DB_USER)
console.log(process.env.DB_PASS)
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

//HotelManage
//MZLwDx6aqHqnVyeS

// name:JetWork
//password: 1bH2jZAd6Yt3alHn



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xjnpbnh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyFirebaseToken=async(req,res,next)=>{
  const authHeader=req.headers?.authorization;

  if(!authHeader || !authHeader.startsWith('Bearer ')){
    return res.status(401).send({
      message:'Unauthorized access not allowed !'
    })
  }

  const token =authHeader.split(' ')[1];
  console.log('token in middleware',token)

  try{
   const decoded=await admin.auth().verifyIdToken(token);
    req.decoded=decoded;
    next();
}
catch(error){
  return res.status(401).send({message:'Unauthorized access'})
}
}


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});







async function run() {
  try {

  
   

    //  const database = client.db("usersDb");
    // const jobdes= database.collection("jobs");
    const roomsCollection=client.db('HotelManage').collection('hotel-room');
    const myBookings=client.db('HotelManage').collection('MyBookings');
    const allrev=client.db('HotelManage').collection('allreviews');
    const allserv=client.db('HotelManage').collection('services');

    // app.get('/rooms',async(req,res)=>{
    //   const rooms=roomsCollection.find();
    //   const result=await rooms.toArray();
    //   res.send(result);
    // })
    app.get('/history',async(req,res)=>{
      
      const history=await myBookings.find().toArray();
    
      res.send(history);
    })
    app.get('/service',async(req,res)=>{
      
      const result=await allserv.find().toArray();
    
      res.send(result);
    })
app.get('/rooms/reviews', async (req, res) => {

    const review = await allrev.find().toArray();
    res.send(review); 
  
});



    app.get('/mybookings',verifyFirebaseToken,async(req,res)=>{
      const email=req.query.email;

      if(email!==req.decoded.email){
        return res.status(403).message({message:'forbidden access'})
      }
      const query={
        email:email
      }
      const result= await myBookings.find(query).toArray();
      res.send(result);
    })




    app.post('/rooms/booked', async(req, res) => {
        const booked=req.body;
        console.log(booked)
        const result=await myBookings.insertOne(booked);
        res.send(result);
  res.send('Got a POST request')
})
    app.post('/rooms/reviews', async(req, res) => {
        const rev=req.body;
        console.log(rev)
        const result=await allrev.insertOne(rev);
        
         const review=await allrev.find().toArray();
        res.send({result,review});
  // res.send('Got a POST request')
})

// app.get('/addtask',async(req,res)=>{
//     result= await jobdes.find().toArray();
//     res.send(result);
// })
app.get('/rooms', async (req, res) => {
  const sort = req.query.sort;
  let sortOption = {};

  if (sort === 'low') {
    sortOption = { rent: 1 }; // Ascending by rent
  } else if (sort === 'high') {
    sortOption = { rent: -1 }; // Descending by rent
  } else {
    sortOption = { room_number: 1 }; // Default: ascending room_number
  }

  try {
    const rooms = await roomsCollection.find().sort(sortOption).toArray();
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});





app.get('/rooms/:id',async(req,res)=>{
    const id=req.params.id;
    const query={_id:new ObjectId(id)}
    const result=await roomsCollection.findOne(query);
    
    res.send(result);
})
app.get('/mybookings/:email',async(req,res)=>{
    const email=req.params.email;
    const query={email:email}
    const result=await myBookings.find(query).toArray();
    
    res.send(result);
})

app.delete('/room/:id', async(req, res) => {
  const id= req.params.id;
   const query = { _id:new ObjectId(id) };
    const result = await myBookings.deleteOne(query);
  res.send(result)
})

app.patch('/mybooking',async(req,res)=>{
  console.log(req.body);
  const{id,selected }=req.body;
  console.log(id)
  const filter={_id:new ObjectId(id)}
  const updatedDoc={
    $set:{
date:selected
    }
  }
  const result=await myBookings.updateOne(filter,updatedDoc)
   const history=await myBookings.find().toArray();
    
      res.send({history,result});
  // res.send(result)
})
app.patch('/review',async(req,res)=>{
  console.log(req.body);
  const{email,num,reviews }=req.body;

  const query={
    email:email
  }
  const match=await myBookings.find(query).toArray()
  console.log(reviews)
  const filter={room_number:num}
  const find={roomNo:num}

  if(match.length!=0){
const updatedDoc={
    $push:{
reviews: {$each: reviews}
    }
  }

  const final=await roomsCollection.updateOne(filter,updatedDoc)
   const all=await roomsCollection.findOne(filter);
   const hisRev=await myBookings.updateOne(find,updatedDoc)
    
      res.send({final,all,match,hisRev});
      console.log(hisRev)
  }
 
  else{
    res.send({match})
  }
  
  // res.send(result)
})

// app.put('/updatepost/:id',async (req, res) => {
//   const id= req.params.id;
//    const filter = { _id:new ObjectId(id) };
//    const updatedJob=req.body;
//    const options={upsert:true};
//    const updatedDoc={
//     $set:updatedJob
//    }
//    const result = await jobdes.updateOne(filter,updatedDoc,options);
//   res.send(result);
// })



    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

