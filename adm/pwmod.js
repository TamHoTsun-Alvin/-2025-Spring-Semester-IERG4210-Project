const bcrypt = require('bcrypt');
const readlineSync = require('readline-sync');

while (true) {
  try {
    const plainPassword = readlineSync.question('Enter password (or type "exit"): ', {
      hideEchoBack: false
    });

    if (plainPassword.toLowerCase() === 'exit') {
      console.log('Exiting...');
      break;
    }

    if (!plainPassword) {
      console.log('No Empty PW.');
      continue;
    }

    const saltRounds = 14;
    const hash = bcrypt.hashSync(plainPassword, saltRounds);
    
    console.log(`\nBCrypt Hash: ${hash}\n`);
  } catch (err) {
    console.error('Error:', err.message);
  }
}