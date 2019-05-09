var express = require("express");
var app = express();
var PORT = 8080;

app.set("view engine", "ejs");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
const cookieParser = require('cookie-parser')
app.use(cookieParser());

// Initiate server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// Short URL : Long URL database
var urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "user2RandomID" }
};

// User database
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
};

// Root page. Says hello.
app.get("/", (req, res) => {
  res.send("Hello!");
});

// GET routing to JSON files of URL database
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// GET routing to main URLs index
app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlsForUser(req.cookies["user_id"]),
    token: req.cookies["user_id"],
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_index", templateVars);
});

// Get routing to page for creating new URL
app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]]
  };
  if (req.cookies["user_id"]) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

// POST routing to generate new short URL at /URLs
app.post("/urls", (req, res) => {
  let newShortKey = generateRandomString();
  urlDatabase[newShortKey] = req.body['longURL'];
  res.redirect(`/urls/${newShortKey}`);
});

// GET routing going to details/edit page by ID
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase,
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_show", templateVars);
});

// POST routing to update details/edit page by ID
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body['update']
  res.redirect(/urls/)
});

// Link from short URL to full website
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]
  res.redirect(longURL);
});

// POST routing to delete a URL
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

// Misc hello page to be removed
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// GET routing to login page
app.get("/login", (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_login", templateVars);
});

// POST routing to login page, verifies if email exists, email and password match, creates cookie
app.post("/login", (req, res) => {
  if (emailInObject(req.body.email)) {
    for (user in users) {
      if (req.body.password === users[user]['password']) {
        res.cookie("user_id", user);
        res.redirect("/urls");
        break;
      };
    };
    res.status(403); // .render(/"urls_login")
  } else {
    res.status(403); //.render("urls_login")
  }
});

// POST routing to logout URL, clears cookie
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

// GET routing to load register page, create cookie
app.get("/register", (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_reg", templateVars);
});

// POST routing to register page, creates user ID if email not taken
app.post("/register", (req, res) => {
  const newUserID = generateRandomString();
  // Handle registration with a blank field:
  if (!req.body.email || !req.body.password) {
    res.status(400).send();
  // Handle registration of esisting email:
  } else if (emailInObject(req.body.email)) {
    res.status(400);
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

// Generator for short ID
function generateRandomString() {
  let output = "";
  const alphanumeric = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  for (let i = 0; i < 6; i++) {
    output += alphanumeric.charAt(Math.floor(Math.random() * alphanumeric.length));
  };
  return output;
};

// Verify if email in use
function emailInObject(emailInput) {
  for (user in users) {
    if (users[user]['email'] === emailInput) {
      return true;
    };
  };
  return false;
};

function urlsForUser(id) {
  let output = {}
  for (user in users) {
    if (id === users[user]['id']) {
      for (shortURL in urlDatabase) {
        output[shortURL] = urlDatabase[shortURL]['longURL'];
      }
    }
  }
  return output;
}



