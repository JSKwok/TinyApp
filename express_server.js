const express = require('express');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const morgan = require('morgan');

const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'pumpkinSeeds',
  keys: ['secretKey']
}));
//app.use(morgan('dev'));

const error403 = 'Error 403: You do not have permission to access this resource. Please visit /login to begin';
const error404 = 'Error 404: The server was unable to find the requested resource.'
// Short URL : Long URL database
const urlDatabase = {
  'b2xVn2': {
    longURL: 'http://www.lighthouselabs.ca',
    userID: 'userRandomID'
  },
  '9sm5xK': {
    longURL: 'http://www.google.com',
    userID: 'user2RandomID'
  }
};

// User database
const users = {
  'userRandomID': {
    id: 'userRandomID',
    email: 'user@example.com',
    password: bcrypt.hashSync('qwer', 10)
  },
 'user2RandomID': {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: bcrypt.hashSync('asdf', 10)
  }
};

// Root page. Redirects to /urls if logged in, redirects to /login otherwise.
app.get('/', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  };
});

// GET routing to JSON files of URL database
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

// GET routing to main URLs index
app.get('/urls', (req, res) => {
  let templateVars = {
    urls: urlsForUser(req.session.user_id),
    token: req.session.user_id,
    user: users[req.session.user_id]
  };
  res.render('urls_index', templateVars);
});

// Get routing to page for creating new URL
app.get('/urls/new', (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  };
  if (req.session.user_id) {
    res.render('urls_new', templateVars);
  } else {
    res.redirect('/login');
  }
});

// POST routing to generate new short URL at /URLs
app.post('/urls', (req, res) => {
  if (!req.session.user_id) {
    res.status(403).send(error403)
  } else {
    let newShortKey = generateRandomString();
    urlDatabase[newShortKey] = {
      longURL : req.body['longURL'],
      userID : req.session.user_id
    }
    res.redirect(`/urls/${newShortKey}`);
  };
});

// GET routing going to details/edit page by ID
app.get('/urls/:shortURL', (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    database: urlDatabase,
    token: req.session.user_id,
    user: users[req.session.user_id]
  };
  if (!Object.keys(urlDatabase).includes(req.params.shortURL)) {
    res.status(404).send(error404);
  } else if (!req.session.user_id) {
    res.status(403).send(error403);
  } else if (req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
    res.status(403).send(error403);
  } else {
    res.render('urls_show', templateVars);
  };
});

// POST routing to update details/edit page by ID
app.post('/urls/:id', (req, res) => {
  if (!req.session.user_id) {
    res.status(403).send(error403);
  } else if (req.session.user_id !== urlDatabase[req.params.id].userID) {
    res.status(403).send(error403);
  } else {
    urlDatabase[req.params.id]['longURL'] = req.body['update'];
    res.redirect(/urls/);
  };
});

// Link from short URL to full website
app.get('/u/:shortURL', (req, res) => {
  if (!Object.keys(urlDatabase).includes(req.params.shortURL)) {
    res.status(404).send(error404);
  } else {
    const longURL = urlDatabase[req.params.shortURL]['longURL'];
    res.redirect(longURL);
  };
});

// POST routing to delete a URL
app.post('/urls/:shortURL/delete', (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  } else {
    res.status(403).send(error403);
  };
});

// GET routing to login page
app.get('/login', (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  };
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.render('urls_login', templateVars);
  };
});

// POST routing to login page, verifies if email exists, email and password match, creates cookie
app.post('/login', (req, res) => {
  if (emailInObject(req.body.email)) {
    for (user in users) {
      if (users[user]['email'] === req.body.email && bcrypt.compareSync(req.body.password, users[user]['password'])) {
        req.session.user_id = user;
        res.redirect('/urls');
        return;
      };
    };
    res.status(403).send('Email/password mismatch');
  } else {
    res.status(403).send('Email not found');
  };
});

// POST routing to logout URL, clears cookie
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

// GET routing to load register page, create cookie
app.get('/register', (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  };
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.render('urls_reg', templateVars);
  };
});

// POST routing to register page, creates user ID if email not taken
app.post('/register', (req, res) => {
  const newUserID = generateRandomString();
  // Handle registration with a blank field:
  if (!req.body.email || !req.body.password) {
    res.status(400).send('Please fill out all fields');
  // Handle registration of existing email:
  } else if (emailInObject(req.body.email)) {
    res.status(400).send('Email already in use');
  } else {
      let password = bcrypt.hashSync(req.body.password, 10);
      users[newUserID] = {
        id : newUserID,
        email : req.body.email,
        password : password
      };
    req.session.user_id = newUserID;
    res.redirect('/urls');
  };
});

// Generator for short ID
function generateRandomString() {
  let output = '';
  const alphanumeric = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
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
    if (id === urlDatabase[url].userID) {
      output[url] = urlDatabase[url].longURL;
    };
  };
  return output;
};

// Initiate server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

