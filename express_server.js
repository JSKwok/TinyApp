var express = require("express");
var app = express();
var PORT = 8080; // default port 8080

app.set("view engine", "ejs");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//Get route going to URL database
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Get route going to URLs page
app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", { urls: urlDatabase });
});

//Get route going to new URL page
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

//Post req to urlDatabase
app.post("/urls", (req, res) => {
  urlDatabase[generateRandomString()] = req.body['longURL'];
  // console.log(urlDatabase);
});

//Get route going to page for a particular URL
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase };
  res.render("urls_show", templateVars);
});


app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

function generateRandomString() {
  let output = "";
  const alphanumeric = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  for (let i = 0; i < 6; i++) {
    output += alphanumeric.charAt(Math.floor(Math.random() * alphanumeric.length));
  };
  return output;
};
