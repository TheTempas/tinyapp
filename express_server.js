const express = require("express");
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const app = express();

app.use(cookieParser());
const PORT = process.env.PORT || 8080;

app.use(cookieSession({
  name: 'session',
  keys: ["String"],
  maxAge: 24 * 60 * 60 * 1000
}))

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": {
              shortURL: "b2xVn2",
              longURL: "http://www.lighthouselabs.ca",
              user_id: "userRandomID"
  },
  "9sm5xK": {
              shortURL: "9sm5xK",
              longURL: "http://www.google.com",
              user_id: "userRandomID"
  }
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
};

function generateRandomAlphanumeric () {
  let alphabetAndNumbers = 'abcdefghijklmnopqrstuvwxyz1234567890'
  let randomString = '';
  for (let i = 0; i < 6; i++) {
  min = Math.ceil(0);
  max = Math.floor(36);
  randomString+= alphabetAndNumbers[Math.floor(Math.random() * (max - min)) + min];
  }
  return randomString;
};

function checkSameEmail (object, element) {
  for(let i = 0; i < object.length; i++) {
    if (object[i]["email"] === element) {
      return true;
    }
  }
};

function findEmailMatch (email) {
  for (let user_id in users) {
    if (users[user_id].email === email) {
      return users[user_id].id;
    }
  }
  return false;
};

function findPasswordMatch (user_id, password) {
  return bcrypt.compareSync(password, users[user_id].password);
};

function urlsForUser (id) {
  const urlList = [];
  for (let shortURL in urlDatabase) {
    if (urlDatabase[shortURL].user_id === id) {
      urlList.push(
        {shortURL: shortURL,
          longURL: urlDatabase[shortURL].longURL
      });
    }
  }
  return (urlList);
}

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls", (req, res) => {
  let user_id = req.session.user_id;
  let templateVars = {
    urls: urlsForUser(user_id),
    user_id: user_id,
    user: users[user_id] || ''
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/login");
  } else {
    let templateVars = {
      user_id: req.session.user_id,
      user: users[req.session.user_id]
    }
    res.render("urls_new", templateVars);
  }
});

app.post("/urls/", (req, res) => {
  let longURL = req.body.longURL;
  const shortURL = generateRandomAlphanumeric();
  urlDatabase[shortURL] = {
    shortURL: shortURL,
    longURL: longURL,
    user_id: req.session.user_id
  };
  res.redirect(`/urls/${shortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  if (urlDatabase[shortURL]) {
    let longURL = urlDatabase[shortURL].longURL;
    res.redirect(longURL);
  } else {
    res.status(404);
    res.send("Short URL Does Not Exist");
  }
});

app.get("/urls/:id", (req, res) => {
  let user_id = req.session.user_id;
  let shortURL = req.params.id;
  if (urlDatabase[shortURL]["user_id"] === user_id) {
  let templateVars = {
    shortURL: shortURL,
    urls: urlDatabase,
    user_id: user_id,
    user: users[user_id]
    }
    res.render("urls_show", templateVars);
  } else {
    res.status(403);
    res.send("You Are Not Allowed To Access This Page");
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls/");
});

app.post("/urls/:id/update", (req, res) => {
  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect("/urls/");
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/login", (req, res) => {
  let templateVars = {
    user_id: req.session.user_id,
    user: users[req.session.user_id]
  }
  res.render("urls_login", templateVars);
});

app.post("/login", (req, res) => {
  const emailForm = req.body.email;
  const passwordForm = req.body.password;
  const userMatchID = findEmailMatch(emailForm);
  if (userMatchID) {
    if (findPasswordMatch(userMatchID, passwordForm)) {
      req.session.user_id = ('user_id', users[userMatchID].id);
      } else {
        res.status(403);
        res.send("Wrong Password");
      }
  } else {
    res.status(403);
    res.send("Wrong Email");
  }
  res.redirect("/urls/");
});

app.post("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect("/urls/");
});

app.get("/register", (req, res) => {
  let templateVars = {
    user_id: req.session.user_id,
    user: users[req.session.user_id]
  }
  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  const emailForm = req.body.email;
  let passwordForm = req.body.password;
  passwordForm = bcrypt.hashSync(passwordForm, 10);
  if (emailForm === '' || passwordForm === '') {
    res.status(404);
    res.send("Eror Not Found")
  } else if (checkSameEmail(users, emailForm)) {
    res.status(404);
    res.send("Eror Not Found")
  } else {
  let user = {
    id: generateRandomAlphanumeric(),
    email: emailForm,
    password: passwordForm
  };
    users[user["id"]] = user;
    req.session.user_id = user.id;
    res.redirect("/urls/");
  };
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});