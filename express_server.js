var express = require("express");
var app = express();
var PORT = 8080;

app.set("view engine", "ejs");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
const cookieParser = require('cookie-parser')
app.use(cookieParser());

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

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
  let templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_index", templateVars);
});

//Get route going to new URL page
app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_new", templateVars);
});

//Adds new key-value pair for website to URL Database, redirects client to short URL page
app.post("/urls", (req, res) => {
  let newShortKey = generateRandomString();
  //console.log(req.body)
  urlDatabase[newShortKey] = req.body['longURL'];
  //console.log(urlDatabase);
  res.redirect(`/urls/${newShortKey}`);
});

//Get route going to page for a particular URL
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase,
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  // console.log(req.body);
  urlDatabase[req.params.id] = req.body['update']
  res.redirect(/urls/)
})

//Link from the short URL to the full website
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  //console.log(urlDatabase)
  res.redirect("/urls");
})

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/login", (req, res) => {
  res.render("urls_login");
});

app.post("/login", (req, res) => {
  res.cookie("user_id", req.body['user_id']);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  res.render("urls_reg");
});

app.post("/register", (req, res) => {
  const newUserID = generateRandomString();
  // Handle registration with a blank field:
  if (!req.body.email || !req.body.password) {
    res.status(400).render("urls_reg");
  } else if (emailInObject(req.body.email)) {
    res.status(400).render("urls_reg");
  } else {
      users[newUserID] = {
      id : newUserID,
      email : req.body.email,
      password : req.body.password
    }
    res.cookie("user_id", newUserID);
    res.redirect("/urls");
  };
});

function generateRandomString() {
  let output = "";
  const alphanumeric = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  for (let i = 0; i < 6; i++) {
    output += alphanumeric.charAt(Math.floor(Math.random() * alphanumeric.length));
  };
  return output;
};

function emailInObject(emailInput) {
  for (user in users) {
    if (users[user].email == emailInput) {
      return true;
    }
  }
  return false;
}
