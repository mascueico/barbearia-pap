const bcrypt = require('bcryptjs');

async function hashPassword() {
    const password = '1234';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log('Hashed password for 1234:', hashedPassword);
}

hashPassword().then(() => {
    console.log('Password hashed successfully');
}).catch(err => {
    console.error('Error hashing password:', err);
});
