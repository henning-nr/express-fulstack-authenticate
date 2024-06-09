const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;

const session = require('express-session');

app.use(session({
  secret: '8c10472423dc7ac1b8fdb91c96793ae8d385da1af1a334950f9f22dbef19edad', // substitua por uma chave secreta real
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // deve ser true se você estiver usando HTTPS
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Página inicial
app.get('/', (req, res) => {
  res.render('index');
});

// Página de registro
app.get('/register', (req, res) => {
  const token = req.session.token || ""
  res.render('register', {message: 'vamo registrar', token: token});
});

app.post('/register', async (req, res) => {
  console.log("vamo registrar")
  const token = req.session.token
  const { username, password, email, phone } = req.body;
  const response = await fetch('https://laughing-space-xylophone-gj9jjq64x46f77x-4000.app.github.dev/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, email, phone })
  });
  const response2 = await fetch('https://laughing-space-xylophone-gj9jjq64x46f77x-4000.app.github.dev/users', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  const userList = await response2.json()
  console.log(userList)
  const result = await response.json();
  console.log('registrar', result, token)
  res.render('register', { message: result, token: token });
});

// Página de login
app.get('/login', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao fazer logout' });
    }
  res.render('login', {message: "bem-vindo"});
  });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log("vou logar", req.body)
  const response = await fetch('https://laughing-space-xylophone-gj9jjq64x46f77x-4000.app.github.dev/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const result = await response.json();
  console.log(result)
  if (result.token != null) {
    let token = result.token
    req.session.token = token;
    res.redirect('/secure');
  } else {
    res.render('login', { message: result.error });
  }
});

// Página protegida
app.get('/secure', async (req, res) => {
  const token = req.session.token;
  console.log('token front', token)
  if (!token) {
    return res.redirect('/login');
  }
  const response = await fetch('https://laughing-space-xylophone-gj9jjq64x46f77x-4000.app.github.dev/api/secure', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const result = await response.json();
  if (result.error) {
    return res.redirect('/login');
  }
  res.render('secure', { message: result.message });
});

app.listen(port, () => {
  console.log(`Frontend rodando na porta ${port}`);
});
