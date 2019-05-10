const express = require('express');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');

const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'tinyApp',
  keys: ['tinyKey']
}));

const error403 = 'Error 403: You do not have permission to access this resource. Please visit /login to begin';
const error404 = 'Error 404: The server was unable to find the requested resource.'

// Database object storing all short links created.
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

// Database object storing all user IDs.
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

// Root page. Redirects to /urls if logged in, redirects to /login otherwise
app.get('/', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  };
});

// Routing to load JSON files of URL database
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

// Routing to load main URLs index navigation page
app.get('/urls', (req, res) => {
  let templateVars = {
    urls: urlsForUser(req.session.user_id),
    token: req.session.user_id,
    user: users[req.session.user_id]
  };
  res.render('urls_index', templateVars);
  if (!req.session.user_id) {
    res.status(403);
  };
});

// Routing to load page for creating new short links
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

// Routing to generate new short links from randomly generated strings
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

// Routing to load the page to edit and view details for a generated short link
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

// Routing to change the full URL associated with a particular short link
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

// Routing to delete a previously created short link
app.post('/urls/:shortURL/delete', (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  } else {
    res.status(403).send(error403);
  };
});

// Routing to load login page
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

// Routing to verify login information, create a cookie if successful
app.post('/login', (req, res) => {
  if (emailInObject(req.body.email)) { // Verify if email is on database
    for (user in users) {
      if (users[user]['email'] === req.body.email && bcrypt.compareSync(req.body.password, users[user]['password'])) { // Verify if email and password are both a match
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

// Routing to leave current session, removes cookie
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

// Routing to load registration page
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

// Routing to create an account through the register page
app.post('/register', (req, res) => {
  const newUserID = generateRandomString();
  if (!req.body.email || !req.body.password) {
    res.status(400).send('Please fill out all fields.');
  } else if (emailInObject(req.body.email)) {
    res.status(400).send('Email already in use.');
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

// Generates a 6 character alphanumeric code to create short links and user ID.
function generateRandomString() {
  let output = '';
  const alphanumeric = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (let i = 0; i < 6; i++) {
    output += alphanumeric.charAt(Math.floor(Math.random() * alphanumeric.length));
  };
  return output;
};

// Verifies if entered email is already on the database
function emailInObject(emailInput) {
  for (user in users) {
    if (users[user]['email'] === emailInput) {
      return true;
    };
  };
  return false;
};

// Returns the short links associated with an inputted user account
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

