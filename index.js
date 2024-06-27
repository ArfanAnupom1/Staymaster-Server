const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const {
    MongoClient,
    ServerApiVersion,
    ObjectId
} = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;
const stripe = require('stripe')(process.env.STRIPE_SK_KEY)
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.h7doky8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

let mealCollection;
let requestMealCollection;
let userCollection;
let CommentCollection;
let UpComingCollection;
let paymentCollection;


const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    console.log('hiiiiiiiiiio', authHeader);
    if (!authHeader) {
        return res.status(401).send({
            message: 'Forbidden access'
        });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({
                message: 'Unauthorized access'
            });
        }
        req.decoded = decoded;
        next();
    });
};

const verifyAdmin = async (req, res, next) => {
    const email = req.decoded.email;
    const query = {
        email: email
    };
    const user = await userCollection.findOne(query);
    const isAdmin = user?.userRole === 'admin';
    if (!isAdmin) {
        return res.status(403).send({
            message: 'unauthorized'
        });
    }
    next();
}

async function run() {
    try {
        // await client.connect();


        mealCollection = client.db("hostelMange").collection('meals');
        userCollection = client.db("hostelMange").collection('user');
        requestMealCollection = client.db("hostelMange").collection('mealRequest');
        CommentCollection = client.db("hostelMange").collection('comment');
        UpComingCollection = client.db("hostelMange").collection('UpComing');
        packageCollection = client.db("hostelMange").collection('package');
        paymentCollection = client.db("hostelMange").collection('payment');

        app.delete('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: new ObjectId(id)
            };
            const result = await userCollection.deleteOne(query);
            res.send(result);
        });
        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = {
                email: user.email
            };
            const existingUser = await userCollection.findOne(query);
            if (existingUser) {
                return res.send({
                    message: 'User already exists',
                    insertedId: null
                });
            }
            const result = await userCollection.insertOne(user);
            res.send(result);
        });
        app.get('/user/:id', async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: new ObjectId(id)
            };
            const result = await userCollection.findOne(query);
            res.send(result);
        });
        app.get('/users', async (req, res) => {
            console.log(req.headers);
            const result = await userCollection.find().toArray();
            res.send(result);
        });
        app.get('/meals', async (req, res) => {
            const result = await mealCollection.find().toArray();
            res.send(result);
        });
        app.get('/package', async (req, res) => {
            const result = await packageCollection.find().toArray();
            res.send(result);
        });
        app.get('/package/:id', async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: new ObjectId(id)
            };
            const result = await packageCollection.findOne(query);
            res.send(result);
        });
        app.get('/UpComing', async (req, res) => {
            const result = await UpComingCollection.find().toArray();
            res.send(result);
        });


        app.post('/meals', async (req, res) => {
            const Item = req.body;
            console.log(Item);
            const result = await mealCollection.insertOne(Item);
            res.send(result);
        });

        app.post('/UpComing', async (req, res) => {
            const Item = req.body;
            console.log(Item);
            const result = await UpComingCollection.insertOne(Item);
            res.send(result);
        });
        app.get('/UpComing/:id', async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: new ObjectId(id)
            };
            const result = await UpComingCollection.findOne(query);
            res.send(result);
        });
        app.get('/meals/:id', async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: new ObjectId(id)
            };
            const result = await mealCollection.findOne(query);
            res.send(result);
        });
        app.get('/UpComing/:id', async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: new ObjectId(id)
            };
            const result = await UpComingCollection.findOne(query);
            res.send(result);
        });

        app.post('/requestedMeal', async (req, res) => {
            const cartItem = req.body;
            const result = await requestMealCollection.insertOne(cartItem);
            res.send(result);
        });
        app.get('/requestedMeal', async (req, res) => {
            const result = await requestMealCollection.find().toArray();
            res.send(result);
        });
        app.get('/requestedMeal', async (req, res) => {
            const email = req.query.email;
            // if (!email) {
            //     return res.status(400).send({
            //         message: 'Email query parameter is required'
            //     });
            // }
            const query = {
                email: email
            };
            const result = await requestMealCollection.find(query).toArray();
            res.send(result);
        });
        app.get('/payments', async (req, res) => {
            const email = req.query.email;
            // if (!email) {
            //     return res.status(400).send({
            //         message: 'Email query parameter is required'
            //     });
            // }
            const query = {
                email: email
            };
            const result = await paymentCollection.find(query).toArray();
            res.send(result);
        });


        app.patch('/meals/likes/:id', async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: new ObjectId(id)
            };
            const update = {
                $inc: {
                    likes: 1
                }
            };
            try {
                const result = await mealCollection.updateOne(query, update);
                if (result.modifiedCount === 1) {
                    res.send({
                        message: 'Like count updated successfully'
                    });
                } else {
                    res.status(404).send({
                        message: 'Meal not found'
                    });
                }
            } catch (error) {
                console.error("Error updating like count:", error);
                res.status(500).send({
                    message: 'Internal Server Error'
                });
            }
        });
        app.patch('/UpComing/likes/:id', async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: new ObjectId(id)
            };
            const update = {
                $inc: {
                    likes: 1
                }
            };
            try {
                const result = await UpComingCollection.updateOne(query, update);
                if (result.modifiedCount === 1) {
                    res.send({
                        message: 'Like count updated successfully'
                    });
                } else {
                    res.status(404).send({
                        message: 'Meal not found'
                    });
                }
            } catch (error) {
                console.error("Error updating like count:", error);
                res.status(500).send({
                    message: 'Internal Server Error'
                });
            }
        });
        app.delete('/requestedMeal/:id', async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: new ObjectId(id)
            };
            const result = await requestMealCollection.deleteOne(query);
            res.send(result);
        });





        app.delete('/UpComing/:id', verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: new ObjectId(id)
            };
            const result = await UpComingCollection.deleteOne(query);
            res.send(result);
        });
        app.patch('/users/admin/:id', verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = {
                _id: new ObjectId(id)
            };
            const updateDoc = {
                $set: {
                    userRole: 'admin'
                },
            };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);
        });
        app.patch('/requestedMeal/:id', async (req, res) => {
            const id = req.params.id;
            const filter = {
                _id: new ObjectId(id)
            };
            const updateDoc = {
                $set: {
                    status: 'Served'
                },
            };
            const result = await requestMealCollection.updateOne(filter, updateDoc);
            res.send(result);
        });
        app.patch('/user/:id', async (req, res) => {
            const id = req.params.id;
            const filter = {
                _id: new ObjectId(id)
            };
            const updateDoc = {
                $set: {
                    role: req.body
                },
            };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);
        });
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1h'
            });
            res.send({
                token
            });
        });

        app.get('/users/admin/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            if (email !== req.decoded.email) {
                return res.status(403).send({
                    message: 'unauthorized'
                });
            }
            const query = {
                email: email
            };
            const user = await userCollection.findOne(query);
            let admin = false;
            if (user) {
                admin = user?.userRole === 'admin';
            }
            res.send({
                admin
            });
        });


        app.get('/meals/:id', async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: new ObjectId(id)
            };
            const result = await mealCollection.findOne(query);
            res.send(result);
        });

        app.patch('/meals/:id', async (req, res) => {
            try {
                const item = req.body;
                const id = req.params.id;
                const filter = {
                    _id: new ObjectId(id)
                };
                const updateDoc = {
                    $set: {
                        title: item.title,
                        category: item.category,
                        rating: item.rating,
                        price: item.price,
                        description: item.description,
                        image: item.image,
                        ingredients: item.ingredients,
                    }
                };

                const result = await mealCollection.updateOne(filter, updateDoc);
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({
                    message: 'An error occurred while updating the item.'
                });
            }
        });
        app.patch('/UpComing/:id', async (req, res) => {
            try {
                const item = req.body;
                const id = req.params.id;
                const filter = {
                    _id: new ObjectId(id)
                };
                const updateDoc = {
                    $set: {
                        title: item.title,
                        category: item.category,
                        rating: item.rating,
                        price: item.price,
                        description: item.description,
                        image: item.image,
                        ingredients: item.ingredients,
                    }
                };

                const result = await UpComingCollection.updateOne(filter, updateDoc);
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({
                    message: 'An error occurred while updating the item.'
                });
            }
        });

        app.delete('/meals/:id', verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: new ObjectId(id)
            };
            const result = await mealCollection.deleteOne(query);
            res.send(result);
        });
        app.delete('/comment/:id', async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: new ObjectId(id)
            };
            const result = await CommentCollection.deleteOne(query);
            res.send(result);
        });
        app.post('/comment', async (req, res) => {
            const newComment = req.body;

            console.log(newComment)
            const result = await CommentCollection.insertOne(newComment);
            res.send(result);
        });

        app.get('/comment', async (req, res) => {
            console.log(req.headers);
            const result = await CommentCollection.find().toArray();
            res.send(result);
        });
        app.post('/create-payment-intent', async (req, res) => {
            try {
                const {
                    price
                } = req.body;

                // Validate if price is a valid number
                if (isNaN(price) || price <= 0) {
                    return res.status(400).send({
                        message: 'Invalid price value'
                    });
                }

                // Parse price as an integer (in cents)
                const amount = parseInt(price * 100);
                console.log(amount, 'amount inside the intent')

                const paymentIntent = await stripe.paymentIntents.create({
                    amount: amount,
                    currency: 'usd',
                    payment_method_types: ['card']
                });

                res.send({
                    clientSecret: paymentIntent.client_secret
                });
            } catch (error) {
                console.error("Error creating payment intent:", error);
                res.status(500).send({
                    message: 'Internal Server Error'
                });
            }
        });
        app.post('/payment', async (req, res) => {
            const newpayment = req.body;

            console.log(newpayment)
            const result = await paymentCollection.insertOne(newpayment);


            res.send(result);
        });





        // await client.db("admin").command({
        //     ping: 1
        // });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Uncomment this to close the connection when the server stops
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('hostel server is running');
});

app.listen(port, () => {
    console.log(`hostel is running on port: ${port}`);
});