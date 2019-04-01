
'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { WebhookClient } = require('dialogflow-fulfillment');

process.env.DEBUG = 'dialogflow:*'; // enables lib debugging statements
admin.initializeApp(functions.config().firebase);
const db = admin.firestore();

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request: any, response: any) => {
  const _agent = new WebhookClient({ request: request, response: response });

  function welcome(agent: any) {
    agent.add(`welcome to hotel booking bot`);
  }

  function fallback(agent: any) {
    agent.add(`didn't understand? Can you say that again?`);
  }

  const bookHotel = async (agent: any) => {
    const params = agent.parameters;
    await db.collection('dialogflow').add({
      name: params.name,
      email: params.email,
      RoomType: params.RoomType,
      number: params.number
    }).then((data: any) => {
      console.log("data has been added", data);
      agent.add(`data has been saved`);
    }).catch((e: any) => {
      console.log(e);
      agent.add(`error writing on database`);
    })
  }

  const showBookings = async (agent: any) => {
    await db.collection('dialogflow').get()
      .then((querySnapshot: any) => {
        const orders: any = [];
        querySnapshot.forEach((doc: any) => { orders.push(doc.data()) });
        // now orders have something like this [ {...}, {...}, {...} ]
        // converting array to speech
      
        orders.forEach((eachOrder: any, index: any) => {
          let speech = `here are your orders \n`;
          speech += `number ${index + 1} is ${eachOrder.RoomType} room for ${eachOrder.number} persons, ordered by ${eachOrder.name} contact email is ${eachOrder.email} \n`
        })
        agent.add(speech);
      })
      .catch((err: any) => {
        console.log('Error getting documents', err);
        agent.add(`error reading data from database`);
      })
  }

  const countBookings = async (agent: any) => {

    await db.collection('dialogflow').get()
    .then((querySnapshot: any) => {

        var orders = [];
        querySnapshot.forEach((doc: any) => { orders.push(doc.data()) });
        // now orders have something like this [ {...}, {...}, {...} ]

       agent.add(`you have ${orders.length} orders`);
    })
    .catch((err: any) => {
        console.log('Error getting documents', err);
        agent.add(`something went wrong while reading from database`);
    })

  }
  // Map from Dialogflow intent names to functions to be run when the intent is matched
  const intentMap = new Map();
  intentMap.set('showBookings', showBookings);
  intentMap.set('bookHotel', bookHotel);
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('count booking', countBookings);
  _agent.handleRequest(intentMap);
});
