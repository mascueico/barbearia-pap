const bcrypt = require('bcryptjs');

async function testPasswordCompare() {
    const plainPassword = '1234';
    const hashedPassword = '$2b$10$PmbT0dqx3wwuNSMtJRMCN.tQHhkwDxB0ng.QcRj5FIRdAvp0tCFgm';

    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    console.log('Is password match:', isMatch);

    if (isMatch) {
        console.log('✅ Senha correta');
    } else {
        console.log('❌ Senha incorreta');
    }
}

testPasswordCompare();
