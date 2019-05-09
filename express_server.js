var express = require("express");
var app = express();
const bcrypt = require('bcrypt');
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
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "user2RandomID"
  }
};

// User database
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("qwer", 10)
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("asdf", 10)
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
  //console.log(urlsForUser(req.cookies["user_id"]));
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
  urlDatabase[newShortKey] = {
    longURL : req.body['longURL'],
    userID : req.cookies["user_id"]
  }
  // console.log(urlDatabase[newShortKey])
  // console.log(urlDatabase)
  // console.log(urlsForUser("userRandomID"))
  res.redirect(`/urls/${newShortKey}`);
});

// GET routing going to details/edit page by ID
app.get("/urls/:shortURL", (req, res) => {
  // console.log(urlDatabase[req.params.shortURL])
  let templateVars = {
    shortURL: req.params.shortURL,
    database: urlDatabase,
    token: req.cookies["user_id"],
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_show", templateVars);
});

// POST routing to update details/edit page by ID
app.post("/urls/:id", (req, res) => {
  if (req.cookies["user_id"]) {
    urlDatabase[req.params.id]['longURL'] = req.body['update'];
  };
  res.redirect(/urls/)
});

// Link from short URL to full website
app.get("/u/:shortURL", (req, res) => {
  console.log(urlDatabase[req.params.shortURL])
  const longURL = urlDatabase[req.params.shortURL]["longURL"]
  res.redirect(longURL);
});

// POST routing to delete a URL
app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.cookies["user_id"]) {
    delete urlDatabase[req.params.shortURL];
  }
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
    // console.log("Email exist?", emailInObject(req.body.email))
    for (user in users) {
      // console.log("Email good?", req.body.email === users[user]['email']);
      // console.log("Password good?", req.body.password === users[user]['password'])
      if (users[user]['email'] === req.body.email && bcrypt.compareSync(req.body.password, users[user]['password'])) {
        res.cookie("user_id", user);
        res.redirect("/urls");
        return;
      };
    }
    res.status(403).send("Email/password mismatch"); // .render(/"urls_login")
  } else {
    res.status(403).send("Email not found"); //.render("urls_login")
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
    res.status(400).send("Please fill out all fields");
  // Handle registration of existing email:
  } else if (emailInObject(req.body.email)) {
    res.status(400).send("Email already in use");
  } else {
      let password = bcrypt.hashSync(req.body.password, 10);
      users[newUserID] = {
        id : newUserID,
        email : req.body.email,
        password : password
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
  for (let url in urlDatabase) {
    //console.log("Does Id match? ", id, " = ", urlDatabase[url].userID)
    //console.log("Result? ", id === urlDatabase[url].userID)
    if (id === urlDatabase[url].userID) {
      output[url] = urlDatabase[url].longURL;
      // console.log('output: ' , output);
    }
  }
  return output;
}

// console.log("Final output", urlsForUser("user2RandomID"));
