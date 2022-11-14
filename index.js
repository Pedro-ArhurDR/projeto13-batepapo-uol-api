import  express, { json }  from "express";
import cors from 'cors'
import { MongoClient, ObjectId } from "mongodb";
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

const userSchemaM = joi.object({ 
  to: joi.string().required(),
  text: joi.string().required(),
  type: joi.any().valid("message", "private_message")})

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

try {
    await mongoClient.connect();
    db = mongoClient.db("Uol");
  } catch (err) {
    console.log(err);
  }

setInterval(ExitUsers,15000)

async function  ExitUsers(){
  console.log('RETIRANDO USUARIOS')
  const allusers =  await db.collection('users').find().toArray()
  allusers.map(e => Date.now() - e.lastStatus > 10000?
   db.collection("users").deleteOne({ name:e.name })&& 
   db.collection('messages')
   .insertOne(
    {from: e.name, 
    to: 'Todos', 
    text: 'sai da sala...',
     type: 'status', 
     time: dayjs().format('HH:mm:ss')}
   )
   :null )
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
     await db.collection('messages').insertOne(status)
      await db.collection('users').insertOne(user)
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
      res.status(500).send(err);
    }
  });


  App.post("/messages", async (req, res) => {
    try {
      console.log('PÓST INICIADO')
      const User = req.headers.user
      console.log('SEU USER', User)
      const {to,text,type} = req.body
      const validar = {
        to: to,
      text: text,
      type: type
      }
      const validate = userSchemaM.validate(validar,{ abortEarly: false })
      if (validate.error) {
        const erros = validate.error.details.map((detail) => detail.message);
        res.sendStatus(422);
        console.log(erros)
        return;
      }
      const userExist = await db.collection('users').findOne({name:User})
      if(userExist === null){
        console.log('ERRO NULL')
        res.sendStatus(422)
        return
      }
      const menssagem = {
        from:User,
        to:to,
        text:text,
        type:type,
        time: dayjs().format('HH:mm:ss')
      }
      console.log(menssagem)
      await db.collection('messages').insertOne(menssagem)
      console.log('deu certo')
      res.sendStatus(201);
    } catch (err) {
      console.log(err);
      res.sendStatus(err);
    }
  });


  App.get("/messages", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit);
      const {user} = req.headers
      const arr = await db.collection('messages').find().toArray()
      const find = arr.filter( e => e.to === user|| 
        e.to ==='Todos'|| e.from===user||e.type==="message")
      if(limit>=1){
        const msg = find
        const Imsg = []
        for (let i = msg.length - 1; i >= 0; i--) {
          Imsg.push(msg[i]);
      }
      const final = Imsg.reverse()
        res.send(final.slice(find.length-limit,find.length))
        return
      }
      res.send(find)
    } catch (err) {
      console.log(err);
      res.sendStatus(err);
    }
  });


  App.post("/status", async (req, res) => {
    try {
      const {user} = req.headers
      const users =  await db.collection("users").find().toArray()
      const userExist= await db.collection("users").findOne({name:user})
      if(userExist===null){
        res.sendStatus(404)
        return
      }
      await db.
      collection('users').
      updateOne({name:user},{$set:{lastStatus:Date.now()}})
      res.sendStatus(200);
    } catch (err) {
      console.log(err);
      res.sendStatus(err);
    }
  });


App.listen(5000 , ()=>{
    console.log("server runnign in port:5000")
})