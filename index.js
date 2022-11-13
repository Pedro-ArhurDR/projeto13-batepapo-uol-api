import  express, { json }  from "express";
import cors from 'cors'
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import joi from 'joi'
import dayjs from "dayjs";
const App = express()
dotenv.config()
App.use(cors())
App.use(express.json())

const userSchema = joi.object({
  name: joi.string().required()
});

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

try {
    await mongoClient.connect();
    db = mongoClient.db("Uol");
  } catch (err) {
    console.log(err);
  }


App.post("/participants", async (req, res) => {
    try {

      const name = req.body
      const validate = userSchema.validate(name,{ abortEarly: false })
      const userExist = await db.collection('users').findOne(name)

      if(userExist!==null){
        res.sendStatus(409)
        console.log('USUARIO JA CADASTRADO')
        return
      }

      const user = {
        name: name.name, lastStatus: Date.now()
      }

      console.log(user)
      if (validate.error) {
        const erros = validate.error.details.map((detail) => detail.message);
        res.status(422).send(erros);
        return;
      }
      const status = {
      from: name.name, 
      to: 'Todos', 
      text: 'entra na sala...', 
      type: 'status', 
      time: dayjs().format('HH:mm:ss')}

      res.sendStatus(201)
      db.collection('status').insertOne(status)
      db.collection('users').insertOne(user)
      console.log('TUDOCERTO')

    } catch (err) {
      console.log(err);
      res.sendStatus(err);
    }

  });



  App.get("/participants", async (req, res) => {
    try {
      const participantes = await db.collection('users').find().toArray()
      res.send(participantes)
      return
    } catch (err) {
      console.log(err);
      res.sendStatus(err);
    }
  });


  App.post("/messages", async (req, res) => {
    try {
      const receitas = await db
        .collection("drinsOficiais")
        .find({})
        .toArray();
      res.send(receitas);
    } catch (err) {
      console.log(err);
      res.sendStatus(err);
    }
  });


  App.get("/messages", async (req, res) => {
    try {
      const receitas = await db
        .collection("drinsOficiais")
        .find({})
        .toArray();
      res.send(receitas);
    } catch (err) {
      console.log(err);
      res.sendStatus(err);
    }
  });


  App.post("/status", async (req, res) => {
    try {
      const receitas = await db
        .collection("drinsOficiais")
        .find({})
        .toArray();
      res.send(receitas);
    } catch (err) {
      console.log(err);
      res.sendStatus(err);
    }
  });


App.listen(5000 , ()=>{
    console.log("server runnign in port:5000")
})