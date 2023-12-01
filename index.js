const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
var cors = require('cors')
require('dotenv').config();
const app = express()
const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);
const port = process.env.PORT||5000

app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5qjioco.mongodb.net/?retryWrites=true&w=majority`;

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
     client.connect();
    const categoriesCollection = client.db('kidszone').collection('categories');
    const productsCollection = client.db('kidszone').collection('products');
    const cartsCollection = client.db('kidszone').collection('carts');
    const ordersCollection = client.db('kidszone').collection('orders');
    app.get('/categories', async (req, res) => {
      const result = await categoriesCollection.find().toArray();
      res.send(result)
    })
    app.post('/categories', async (req, res) => {
      const newCategory = req.body;
      const result = await categoriesCollection.insertOne(newCategory);
      res.send(result)
    })
    app.get('/products', async (req, res) => {
      const type = req.query.type;

      // Check if a type is provided for filtering
      const filter = type ? { types: type } : {};

      // Fetch products based on the filter
      const result = await productsCollection.find(filter).toArray();

      res.json(result);
    })
    app.get('/products/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.findOne(query)
      res.send(result)
    })
    app.post('/products', async (req, res) => {
      const newProduct = req.body;
      const result = await productsCollection.insertOne(newProduct);
      res.send(result)
    })

    app.get('/carts', async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send([])
      }
      let query = { email: email };
    const result = await cartsCollection.find(query).toArray();
      res.send(result);
    })
    //appointmentCollection
    app.post('/carts', async (req, res) => {
      const cart = req.body;
      console.log(cart)
      const result = await cartsCollection.insertOne(cart);
      res.send(result)
    })
    app.delete('/carts', async (req, res) => {
      const cart = req.body;
      console.log(cart)
      const result = await cartsCollection.deleteMany(cart);
      res.send(result)
    })
    app.delete('/carts/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await cartsCollection.deleteOne(query);
      res.send(result)
    })
    app.post("/create-payment-intent", async (req, res) => {
      const { new_price } = req.body;
      const amount = parseInt(new_price)*100
      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types : ['card']
        // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
  
      });
    
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });
    app.get('/orders', async (req, res) => {
      const result = await ordersCollection.find().toArray();
      res.send(result)
    })
    app.post('/checkout', async (req, res) => {
      const { user, carts } = req.body;
      await ordersCollection.insertOne({
        carts,
        timestamp: new Date(),
      });
      res.status(200).json({ success: true, message: 'Checkout successful' });

    });




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
  res.send('server is running')
})

app.listen(port, () => {
  console.log(`server is running on port ${port}`)
})