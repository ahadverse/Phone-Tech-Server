const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
const { response } = require('express');
const ObjectId = require('mongodb').ObjectId;
const port = process.env.PORT || 5000 ;
const stripe = require('stripe')(process.env.STRIPE_KEY)


// const corsConfig = {
//   origin: true ,
//   credentials: true,
//   }
// app.use(cors(corsConfig))
// app.options('*', cors(corsConfig))

// app.use(cors({origin : 'https://assignment-12-42953.web.app' , optionsSuccessStatus: 200}))

// var corsOptions = {
//   origin: 'https://assignment-12-42953.web.app',
//   optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
// }

app.use(cors())
app.use(express.json())

// app.use('*', cors())
// const corsConfig = {
//     origin: '*',
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE']
// }
// app.use(cors(corsConfig))
// // app.options("*", cors(corsConfig))
// // app.use(express.json())
// app.use(function (req, res, next) {
//     res.header("Access-Control-Allow-Origin", "https://assignment-12-42953.web.app")
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept,authorization")
//     next()
// })


const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.sbmqf.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyToken(req , res , next){
  const authHeader = req.headers.authorization;
  if(!authHeader){
    return res.status(401).send({message : 'unauthorised'})
  }
  const token = authHeader.split(' ')[1]
  jwt.verify(token , process.env.TOKEN , (err , decoded)=>{
    if(err){
      return res.status(403).send({message : 'Forbidden'})
    }
    req.decoded = decoded;
  })
  next()
}

async function run() {
    try {
      await client.connect();
      const productsCollection = client.db("phoneTech").collection("products");
      const orderCollection = client.db("phoneTech").collection("orders");
      const reviewsCollection = client.db("phoneTech").collection("reviews");
      const profileCollection = client.db("phoneTech").collection("profile");
      const userCollection = client.db("phoneTech").collection("users");
      const paymentCollection = client.db("phoneTech").collection("payment");
     
   

      // get products
      app.get('/products' , async(req, res)=>{
          const query = {};
          const result = await productsCollection.find(query).toArray()
          res.send(result)
      })

      // post products 
      app.post('/products' , async(req , res)=>{
        const query = req.body;
        const result = await productsCollection.insertOne(query)
        res.send(result)
      })

      app.delete('/products/:id' , async(req,res)=>{
        const id = req.params.id;
        const query = {_id:ObjectId(id)}
        const result = await productsCollection.deleteOne(query);
        res.send(result)
      })


      // post orders 
      app.post('/orders' , async(req,res)=>{
        const query = req.body;
        const result = await orderCollection.insertOne(query);
        res.send(result)
      })

      // get all-orders
      app.get('/all-orders', async(req,res)=>{
        const query = {}
        const result = await orderCollection.find(query).toArray()
        res.send(result)
      })

      app.get('/orders/:id'  , async(req, res)=>{
          const id = req.params.id;
          const query = {_id:ObjectId(id)}
          const result = await orderCollection.findOne(query)
          res.send(result)

      })

      // get orders by email 
  
      app.get('/orders' , cors(corsOptions) , async(req,res)=>{
        const customerEmail = req.query.customerEmail;
         const decodedEmail =  req.decoded.email;
         if(customerEmail == decodedEmail){
          const query = {customerEmail}
          const result = await orderCollection.find(query).toArray()
          res.send(result)
         }
         else{
           return res.status(403).send({ message : "forbidden access"})
         }
       
      })

      // delete orders 
      app.delete('/orders/:id' , async(req,res)=>{
          const id = req.params.id;
          const query = {_id:ObjectId(id)}
          const result = await orderCollection.deleteOne(query);
          res.send(result)
      })

      app.put('/order/:id' , async(req , res)=>{
        const id = req.params.id;
        const query = {_id:ObjectId(id)}
        const orderStatus = req.body.status;
        const updateDoc = {
          $set: {
            status : orderStatus
          },
        };
        const result = await orderCollection.updateOne(query, updateDoc);
        res.send(result)
      })

      app.patch('/order/:id' , async(req , res)=>{
        const id = req.params.id;
        const query = {_id:ObjectId(id)}
        const paymentBody = req.body;
        const payment = req.body.payment;
        const transactionId = req.body.transactionId;
        const options = { upsert : true};
        const updateDoc = {
          $set: {
            payment : payment,
            transactionId : transactionId,
          },
        };
        const results = await paymentCollection.insertOne(paymentBody)
        const result = await orderCollection.updateOne(query, updateDoc , options);
        res.send(result)
      })
    
      // post reviews
      app.post('/reviews' , async(req,res)=>{
        const query = req.body;
        const result = await reviewsCollection.insertOne(query);
        res.send(result)
      })

      // get reviews
      app.get('/reviews', async(req,res)=>{
        const query = {};
        const result = await reviewsCollection.find(query).toArray()
        res.send(result)
      })
      // post profile 
      app.post('/profile' , async(req , res)=>{
        const query = req.body;
        const result = await profileCollection.insertOne(query);
        res.send(result)
      })

      // get profile 
      app.get('/profile' , verifyToken ,  async(req , res)=>{
        const userEmail = req.query.userEmail;
        const query = {userEmail}
        console.log(query)
        const result = await profileCollection.find(query).toArray();
        res.send(result)
      })

      app.get('/users'  , verifyToken ,   async(req , res)=>{
        const query = {}
        const result = await userCollection.find(query).toArray()
        res.send(result)
      });
      app.put('/users/admin/:email', async(req , res)=>{
        const email = req.params.email;
        const filter = {email : email};
        const updateDocs = {
          $set : {role : 'admin'}
        };
        const result = await userCollection.updateOne(filter  , updateDocs )
        res.send(result)
      })

      app.put('/users/:email' , async(req , res)=>{
        const email = req.params.email;
        const user = req.body;
        const filter = {email : email};
        const options = { upsert : true};
        const updateDocs = {
          $set : user
        };
        const result = await userCollection.updateOne(filter  , updateDocs , options);
        const token = jwt.sign({email : email}, process.env.TOKEN , {expiresIn : '1d'})
        res.send({ result , token})
      })

      app.delete('/users/:id' , async(req,res)=>{
        const id = req.params.id;
        const query = {_id:ObjectId(id)}
        const result = await userCollection.deleteOne(query);
        res.send(result)
    })

    app.get('/admin/:email', async(req , res)=>{
      const email = req.params.email;
      const user = await userCollection.findOne({email : email});
      const isAdmin = user.role === 'admin' ;
      res.send(isAdmin)
    })

    app.post("/create-payment-intent" ,  async (req, res) => {
      const service = req.body;
      const amount = service.cost;
      
      console.log('amount' , amount)
 
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types:['card'] 
      });
    
      res.send({clientSecret: paymentIntent.client_secret});
    });

    } finally {
    //   await client.close();
    }
  }
  run().catch(console.dir);



app.get('/' , (req , res)=>{
    res.send('server is running like a bird')
})

app.listen(port , ()=>{
    console.log('server is running like a bird' , port)
})