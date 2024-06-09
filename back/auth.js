const jwt = require('jsonwebtoken');// Middleware para autenticação JWT

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    console.log('token back', token)
  
    if (!token) {
      console.log('sem token')
      return res.status(401).json({ error: 'Token não fornecido' });
    }
  
    jwt.verify(token, '8c10472423dc7ac1b8fdb91c96793ae8d385da1af1a334950f9f22dbef19edad', (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Token inválido' });
      }
      req.user = user;
      next();
    });
  }

  module.exports = authenticateToken