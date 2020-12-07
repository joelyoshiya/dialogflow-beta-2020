const express = require('express')
const { WebhookClient } = require('dialogflow-fulfillment')
const app = express()
const fetch = require('node-fetch')
const base64 = require('base-64')

let username = "";
let password = "";
let token = "";

USE_LOCAL_ENDPOINT = false;
// set this flag to true if you want to use a local endpoint
// set this flag to false if you want to use the online endpoint
ENDPOINT_URL = ""
if (USE_LOCAL_ENDPOINT){
ENDPOINT_URL = "http://127.0.0.1:5000"
} else{
ENDPOINT_URL = "https://mysqlcs639.cs.wisc.edu"
}



async function getToken () {
  let request = {
    method: 'GET',
    headers: {'Content-Type': 'application/json',
              'Authorization': 'Basic '+ base64.encode(username + ':' + password)},
    redirect: 'follow'
  }

  const serverReturn = await fetch(ENDPOINT_URL + '/login',request)
  const serverResponse = await serverReturn.json()
  token = serverResponse.token

  return token;
}

app.get('/', (req, res) => res.send('online'))
app.post('/', express.json(), (req, res) => {
  const agent = new WebhookClient({ request: req, response: res })

  function welcome () {
    agent.add('Webhook works!')
    agent.add('Welcome to Wiscshop')
    console.log(ENDPOINT_URL)
  }

  function isLoggedIn() {
    console.log("currently your token is: " + token)

    agent.add('Checking if you are logged in...')
    if(token){
      agent.add('You are logged in as ' + username + ".")
    }else{
      agent.add('You are not logged in. Please enter "login" to start')
    }
  }

  async function login () {
    // Entire user query accessible by: agent.query
    // Entities accessible by: agent.parameters
    // You need to set this from `username` entity that you declare in DialogFlow
    username = agent.parameters.username;
    // You need to set this from password entity that you declare in DialogFlow
    password = agent.parameters.password;

    agent.add('attempting to log in with ' + username + ' and ' + password + '...')

    if(username && password){
      await getToken()
      if(token){
        agent.add('Successfully logged in as ' + username + ".")
      }else{
        agent.add('login failed. Please try again.')
      }
      agent.add('Your token: ' + token)    
    }

  }

  async function fetchCategories() {

    let requestOptions = {
      method: 'GET',
      redirect: 'follow'
    };

    let response = await fetch(ENDPOINT_URL + '/categories', requestOptions);
    let result = await response.json();

    agent.add("The listed categories are: " + result.categories.join(", "))
  }

  async function navigateCategory(){
    let category = agent.parameters.category[0].toLowerCase();

    agent.add("Navigating you to " + category + " ...")

    let myHeaders = {
      "Content-Type": "application/json",
      "x-access-token": this.token
    }

    let serverRoute = '/' + username + '/' + category;
    let body = JSON.stringify({page: serverRoute});


    let requestOptions = {
      method: 'PUT',
      headers: myHeaders,
      body: body,
      redirect: 'follow'
    };

    let response = await fetch(ENDPOINT_URL + '/application/', requestOptions);
    let result = await response.json();
    console.log(result)
    agent.add(result);
  }

  async function fetchTags(){

    let category_title = agent.parameters.category_title.toLowerCase();
    console.log(category_title)
    let requestOptions = {
      method: 'GET',
      redirect: 'follow'
    };

    let response = await fetch(ENDPOINT_URL + '/categories/' + category_title + "/tags", requestOptions);
    let result = await response.json();

    console.log(result)

    agent.add("The listed tags for " + category_title + " are: " + result.tags.join(", "))
  }


  let intentMap = new Map()
  intentMap.set('Default Welcome Intent', welcome)
  // You will need to declare this `Login` content in DialogFlow to make this work
  intentMap.set('Login', login) 
  intentMap.set('isLoggedIn', isLoggedIn)
  intentMap.set('describeCategories', fetchCategories)
  intentMap.set('describeTags', fetchTags)
  intentMap.set('navigateToCategory', navigateCategory)
  agent.handleRequest(intentMap)
})

app.listen(process.env.PORT || 8080)
