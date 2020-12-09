const express = require("express");
const { WebhookClient } = require("dialogflow-fulfillment");
const app = express();
const fetch = require("node-fetch");
const base64 = require("base-64");

let username = "";
let password = "";
let token = "";

USE_LOCAL_ENDPOINT = false;
// set this flag to true if you want to use a local endpoint
// set this flag to false if you want to use the online endpoint
ENDPOINT_URL = "";
if (USE_LOCAL_ENDPOINT) {
  ENDPOINT_URL = "http://127.0.0.1:5000";
} else {
  ENDPOINT_URL = "https://mysqlcs639.cs.wisc.edu";
}

async function getToken() {
  let request = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + base64.encode(username + ":" + password),
    },
    redirect: "follow",
  };

  const serverReturn = await fetch(ENDPOINT_URL + "/login", request);
  const serverResponse = await serverReturn.json();
  token = serverResponse.token;

  return token;
}

app.get("/", (req, res) => res.send("online"));
app.post("/", express.json(), (req, res) => {
  const agent = new WebhookClient({ request: req, response: res });

  function welcome() {
    agent.add("Webhook works!");
    agent.add("Welcome to Wiscshop");
    console.log(ENDPOINT_URL);
  }

  function isLoggedIn() {
    console.log("currently your token is: " + token);

    agent.add("Checking if you are logged in...");
    if (token) {
      agent.add("You are logged in as " + username + ".");
    } else {
      agent.add('You are not logged in. Please enter "login" to start');
    }
  }

  async function login() {
    // Entire user query accessible by: agent.query
    // Entities accessible by: agent.parameters
    // You need to set this from `username` entity that you declare in DialogFlow
    username = agent.parameters.username;
    // You need to set this from password entity that you declare in DialogFlow
    password = agent.parameters.password;

    agent.add(
      "attempting to log in with " + username + " and " + password + "..."
    );

    if (username && password) {
      await getToken();
      if (token) {
        agent.add("Successfully logged in as " + username + ".");
        console.log("currently your token is: " + token);
      } else {
        agent.add("login failed. Please try again.");
      }
      // agent.add("Your token: " + token);
    }
  }

  async function fetchCategories() {
    let requestOptions = {
      method: "GET",
      redirect: "follow",
    };

    let response = await fetch(ENDPOINT_URL + "/categories", requestOptions);
    let result = await response.json();

    agent.add("The listed categories are: " + result.categories.join(", "));
  }

  async function navigateCategory() {
    if (!token) {
      agent.add("Please login first.");
    } else {
      let category = agent.parameters.category[0].toLowerCase();

      agent.add("Navigating you to " + category + " ...");

      let myHeaders = {
        "Content-Type": "application/json",
        "x-access-token": token,
      };

      let serverRoute = "/" + username + "/" + category;
      let body = JSON.stringify({ page: serverRoute });

      // console.log(body);

      let requestOptions = {
        method: "PUT",
        headers: myHeaders,
        body: body,
        redirect: "follow",
      };

      let response = await fetch(
        ENDPOINT_URL + "/application/",
        requestOptions
      ).catch((error) => console.log(error));
      let result = await response.json();

      if (result.message == "Application state modified!") {
        agent.add("Currently at the " + category + " page.");
        //agent.add(result.message);
      }
    }
  }

  async function navigateHome() {
    if (!token) {
      agent.add("Please login first.");
    } else {
      agent.add("Navigating you to home page");

      let myHeaders = {
        "Content-Type": "application/json",
        "x-access-token": token,
      };

      let serverRoute = "/" + username;
      let body = JSON.stringify({ page: serverRoute });

      // console.log(body);

      let requestOptions = {
        method: "PUT",
        headers: myHeaders,
        body: body,
        redirect: "follow",
      };

      let response = await fetch(
        ENDPOINT_URL + "/application/",
        requestOptions
      ).catch((error) => console.log(error));
      let result = await response.json();

      if (result.message == "Application state modified!") {
        agent.add("Currently at the home page.");
        //agent.add(result.message);
      }
    }
  }
  async function navigateToCart() {
    if (!token) {
      agent.add("Please login first.");
    } else {
      agent.add("Navigating you to your cart page");

      let myHeaders = {
        "Content-Type": "application/json",
        "x-access-token": token,
      };

      let serverRoute = "/" + username + "/cart";
      let body = JSON.stringify({ page: serverRoute });

      // console.log(body);

      let requestOptions = {
        method: "PUT",
        headers: myHeaders,
        body: body,
        redirect: "follow",
      };

      let response = await fetch(
        ENDPOINT_URL + "/application/",
        requestOptions
      ).catch((error) => console.log(error));
      let result = await response.json();

      if (result.message == "Application state modified!") {
        agent.add("Currently at the cart page.");
        //agent.add(result.message);
      }
    }
  }

  async function fetchProducts() {
    var requestOptions = {
      method: "GET",
      redirect: "follow",
    };

    let response = await fetch(
      "https://mysqlcs639.cs.wisc.edu/products",
      requestOptions
    ).catch((error) => agent.add(error));
    let result = await response.json();

    if (result) {
      let productList = [];
      let products = result.products;
      products.forEach((product) => productList.push(product.name));
      agent.add("Here are all Wiscshop products:");
      agent.add(productList);
    } else {
      agent.add("was not able fetch all product names");
    }
  }

  async function fetchProductInfo() {
    productId = "";
    productName = agent.parameters.product_name;
    productInfo = agent.parameters.product_info;

    agent.add(
      "Searching for " +
        productName +
        " and corresponding " +
        productInfo +
        "..."
    );
    //need to map the name to corresponding id so we can fetch all info for product
    var requestOptions = {
      method: "GET",
      redirect: "follow",
    };

    let response = await fetch(
      "https://mysqlcs639.cs.wisc.edu/products",
      requestOptions
    ).catch((error) => agent.add(error));
    let result = await response.json();
    let products = result.products;
    products.forEach((product) => {
      if (productName == product.name) {
        productId = product.id;
        // agent.add(productId + " is the products id");
      }
    });
    //now going to fetch product info with id, display requested info

    //only if the information is not related to ratings or reviews
    if (productInfo != "review" && productInfo != "ratings") {
      let response_2 = await fetch(
        "https://mysqlcs639.cs.wisc.edu/products/" + productId,
        requestOptions
      ).catch((error) => agent.add(error));
      let prod_result = await response_2.json();
      console.log(prod_result);
      for (const [key, value] of Object.entries(prod_result)) {
        if (key == productInfo) {
          agent.add(key + ": " + value);
        }
      }
    } //the user wants either ratings or reviews
    else {
      // /products/<product_id>/tags
      // /products/<product_id>/reviews
      // /products/<product_id>/reviews/<review_id></review_id>
      if (productInfo == "review" || productInfo == "ratings") {
        let response_3 = await fetch(
          "https://mysqlcs639.cs.wisc.edu/products/" + productId + "/reviews",
          requestOptions
        ).catch((error) => agent.add(error));
        let rev_result = await response_3.json();
        //array of reviews stored
        reviews = rev_result.reviews;
        //Output "title", "text" content
        if (productInfo == "review") {
          reviews.forEach((review) => {
            agent.add(
              "Review title: " +
                review.title +
                "\r\n" +
                "Review: " +
                review.text
            );
          });
        }

        //calculate average rating using "stars"
        if (productInfo == "ratings") {
          let totScore = 0;
          let totRev = 0;
          reviews.forEach((review) => {
            totRev++;
            totScore += review.stars;
          });
          let avgScore = Math.round(totScore / totRev);
          agent.add("The average rating is " + avgScore + " out of 5 stars.");
        }
      }
    }
  }

  async function fetchProductInfo_Internal(id){

    var requestOptions = {
      method: "GET",
      redirect: "follow",
    };

    let response = await fetch(
      "https://mysqlcs639.cs.wisc.edu/products/" + id,
      requestOptions
    ).catch((error) => agent.add(error));
    let prod_result = await response.json();

    return prod_result;
  }

  async function fetchTags() {
    let category_title = agent.parameters.category_title.toLowerCase();
    console.log(category_title);
    let requestOptions = {
      method: "GET",
      redirect: "follow",
    };

    let response = await fetch(
      ENDPOINT_URL + "/categories/" + category_title + "/tags",
      requestOptions
    );
    let result = await response.json();

    console.log(result);

    agent.add(
      "The listed tags for " +
        category_title +
        " are: " +
        result.tags.join(", ")
    );
  }

  async function getCartInfo() {
    if (!token) {
      agent.add("Please login first.");
    } else {
      let requestOptions = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
        redirect: "follow",
      };

      let response = await fetch(
        ENDPOINT_URL + "/application/products/",
        requestOptions
      ).catch((error) => console.log("error", error));

      let result = await response.json();
      let cartProducts = result.products;

      let itemsInCart = 0;
      let itemNames = [];
      let totalCost = 0;
      cartProducts.forEach((item) => {
        itemsInCart += item.count;
        itemNames.push(item.name);
        totalCost += item.price * item.count;
      });
      agent.add("There are " + itemsInCart + " items in total");
      agent.add("The items are: " + itemNames.join(", ") + ".");
      agent.add("The total price is " + totalCost + " dollars.");
    }
  }

  async function addTags() {
    // console.log("tag to be added: " + agent.parameters.tag);
    let tag = agent.parameters.tag;

    let endpoint = "/application/tags/" + tag;

    //POST request with token and body
    if (!token) {
      agent.add("Please login first.");
    } else {

      agent.add("Adding " + tag + " ...");

      let myHeaders = {
        "Content-Type": "application/json",
        "x-access-token": token,
      };

      let body = JSON.stringify({ tags: tag });
      // console.log("Body: " + body);

      // console.log(body);

      let requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: body,
        redirect: "follow",
      };

      let response = await fetch(
        ENDPOINT_URL + endpoint,
        requestOptions
      ).catch((error) => console.log(error));
      let result = await response.json();
      // console.log(result);
      agent.add(result.message);
    }
  }

  async function deleteTag() {
    // console.log("tag to be removed: " + agent.parameters.tag);
    let tag = agent.parameters.tag;

    let endpoint = "/application/tags/" + tag;

    //DELETE request with token and body
    if (!token) {
      agent.add("Please login first.");
    } else {

      agent.add("Removing " + tag + " ...");

      let myHeaders = {
        "Content-Type": "application/json",
        "x-access-token": token,
      };

      let body = JSON.stringify({ tags: tag });
      // console.log("Body: " + body);

      // console.log(body);

      let requestOptions = {
        method: "DELETE",
        headers: myHeaders,
        body: body,
        redirect: "follow",
      };

      let response = await fetch(
        ENDPOINT_URL + endpoint,
        requestOptions
      ).catch((error) => console.log(error));
      let result = await response.json();
      // console.log(result);
      agent.add(result.message);
    }
  }

  async function allTags() {
    let endpoint = "/application/tags";

    //GET request with token
    if (!token) {
      agent.add("Please login first.");
    } else {
      let requestOptions = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
        redirect: "follow",
      };

      let response = await fetch(
        ENDPOINT_URL + endpoint,
        requestOptions
      ).catch((error) => console.log("error", error));

      let result = await response.json();

      console.log(result);
      agent.add("All tags that are applied: ");
      if (result.tags.length == 0) {
        agent.add("no tags at this point.");
      } else {
        agent.add(result.tags);
      }
    }
  }

  async function addToCart(){
    //product to be added to cart
    let productName = agent.parameters.product;

    //now need to map product name to id
    let productId = -1;

    var requestOptions = {
      method: "GET",
      redirect: "follow",
    };

    let response = await fetch(
      "https://mysqlcs639.cs.wisc.edu/products",
      requestOptions
    ).catch((error) => agent.add(error));
    let result = await response.json();
    let products = result.products;
    products.forEach((product) => {
      if (productName === product.name) {
        // console.log('able to map ' + productName + ' to ' + product.name);
        productId = product.id;
      }
    });

    console.log('productId is: ' + productId);
    //use id for a POST request to endpoint
    //end path /application/products/<product_id>
    let path = ENDPOINT_URL + '/application/products/' + productId;

    if (!token) {
      agent.add("Please login first.");
    } else {

      agent.add("Adding " + productName + " to cart...");

      let myHeaders = {
        "Content-Type": "application/json",
        "x-access-token": token,
      };

      let product = await fetchProductInfo_Internal(productId);
      console.log(product);
      let body = JSON.stringify({ products: product});
      // console.log("Body: " + body);

      let requestOptions_2 = {
        method: "POST",
        headers: myHeaders,
        body: body,
        redirect: "follow",
      };

      let response_2 = await fetch(
        path,
        requestOptions_2
      ).catch((error) => console.log(error));
      let result_2 = await response_2.json();
      // console.log(result);
      agent.add(result_2.message);
    }


  }

  async function deleteFromCart(){
        //product to be deleted from cart
        let productName = agent.parameters.product;

        //now need to map product name to id
        let productId = -1;
    
        var requestOptions = {
          method: "GET",
          redirect: "follow",
        };
    
        let response = await fetch(
          "https://mysqlcs639.cs.wisc.edu/products",
          requestOptions
        ).catch((error) => agent.add(error));
        let result = await response.json();
        let products = result.products;
        products.forEach((product) => {
          if (productName === product.name) {
            // console.log('able to map ' + productName + ' to ' + product.name);
            productId = product.id;
          }
        });
    
        // console.log('productId is: ' + productId);
        //use id for a DELETE request to endpoint
        //end path /application/products/<product_id>
        let path = ENDPOINT_URL + '/application/products/' + productId;
    
        if (!token) {
          agent.add("Please login first.");
        } else {
    
          agent.add("Deleting " + productName + " from cart...");
    
          let myHeaders = {
            "Content-Type": "application/json",
            "x-access-token": token,
          };
    
          let product = await fetchProductInfo_Internal(productId);
          console.log(product);
          let body = JSON.stringify({ products: product});
          // console.log("Body: " + body);
    
          let requestOptions_2 = {
            method: "DELETE",
            headers: myHeaders,
            body: body,
            redirect: "follow",
          };
    
          let response_2 = await fetch(
            path,
            requestOptions_2
          ).catch((error) => console.log(error));
          let result_2 = await response_2.json();
          // console.log(result);
          agent.add(result_2.message);
        }
    
    


  }

  


  let intentMap = new Map();
  intentMap.set("Default Welcome Intent", welcome);
  // You will need to declare this `Login` content in DialogFlow to make this work
  intentMap.set("Login", login);
  intentMap.set("isLoggedIn", isLoggedIn);
  intentMap.set("describeCategories", fetchCategories);
  intentMap.set("describeTags", fetchTags);
  intentMap.set("navigateToCategory", navigateCategory);
  intentMap.set("describeAllProducts", fetchProducts);
  intentMap.set("describeProduct", fetchProductInfo);
  intentMap.set("goToCart", navigateToCart);
  intentMap.set("cartInfo", getCartInfo);
  intentMap.set("goHome", navigateHome);
  intentMap.set("addTags", addTags);
  intentMap.set("getAllTags", allTags);
  intentMap.set("removeTag", deleteTag);
  intentMap.set("addToCart", addToCart);
  intentMap.set("deleteFromCart", deleteFromCart)

  agent.handleRequest(intentMap);
});

app.listen(process.env.PORT || 8080);
