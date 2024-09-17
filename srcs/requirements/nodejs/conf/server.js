const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Définir le répertoire des fichiers statiques
app.use(express.static(path.join(__dirname, 'static')));

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
