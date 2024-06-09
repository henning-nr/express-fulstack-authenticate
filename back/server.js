const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser'); // Adicione esta linha
const cors = require('cors');
const authenticateToken = require('./auth.js')

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(cookieParser()); // Adicione esta linha

const db = new sqlite3.Database('database.db');

db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT,
  email TEXT,
  phone TEXT
)`, (err) => {
  if (err) {
    console.error('Erro ao criar a tabela users:', err);
  } else {
    console.log('Tabela users criada com sucesso');
  }
});

// Configuração da sessão (usando express-session)
app.use(session({
  secret: '8c10472423dc7ac1b8fdb91c96793ae8d385da1af1a334950f9f22dbef19edad',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false },
}));

// Configuração do rate limiting para proteção contra ataques de força bruta
const limiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas máximas por IP
  keyGenerator: (req, res) => req.headers['x-forwarded-for'] || req.ip // Use o cabeçalho 'X-Forwarded-For' se presente
});

app.use('/login', limiter);

app.get("/users", authenticateToken, (req, res) => {
  console.log("cheguei..")
  db.all('SELECT * FROM users', function (err, users) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao recuperar o usuário' });
    }

    // Retorna os dados do usuário inserido
    res.status(201).json(users);
  });
})

// Rota de registro de usuário
app.post('/register', (req, res) => {
  console.log('vim registrar')
  const { username, password, email, phone } = req.body;

  db.get('SELECT * FROM users WHERE username = ?', username, (err, row) => {
    if (row) {
      return res.status(400).json({ error: 'Nome de usuário já está em uso' });
    }

    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao criptografar a senha' });
      }

      db.run('INSERT INTO users (username, password, email, phone) VALUES (?, ?, ?, ?)', username, hash, email, phone, (err) => {
        if (err) {
          return res.status(500).json({ error: 'Erro ao criar o usuário' });
        }

        db.get('SELECT * FROM users WHERE username = ?', username, function (err, user) {
          if (err) {
            return res.status(500).json({ error: 'Erro ao recuperar o usuário' });
          }

          // Retorna os dados do usuário inserido
          res.status(201).json({ message: `Usuário registrado com sucessoss ${user.username} ` });
        });

        // res.status(201).json({ message: 'Usuário registrado  com sucesso' });
      });
    });
  });
});

// Rota de login
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM users WHERE username = ?', username, (err, row) => {
    if (!row) {
      return res.status(401).json({ error: 'Nome de usuário não encontrado' });
    }

    bcrypt.compare(password, row.password, (err, result) => {
      if (!result) {
        return res.status(401).json({ error: 'Senha incorreta' });
      }

      const token = jwt.sign({ userId: row.id }, '8c10472423dc7ac1b8fdb91c96793ae8d385da1af1a334950f9f22dbef19edad', { expiresIn: '1m' });
      req.session.token = token;
      res.json({ message: 'Login bem-sucedido', token });
    });
  });
});


// Rota protegida
app.get('/api/secure', authenticateToken, (req, res) => {

  res.json({ message: 'Rota protegida acessada com sucesso' });
});

app.listen(port, () => {
  console.log(`Servidor está rodando na porta ${port}`);
});
