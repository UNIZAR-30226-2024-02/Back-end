// compile.test.js

const { execSync } = require('child_process');

test('Compilación del backend', () => {
  try {
    console.log('Iniciando la compilación del backend...');
    execSync('npm run dev', { cwd: 'server/src', stdio: 'inherit' });
    console.log('La compilación del backend se realizó correctamente.');
  } catch (error) {
    console.error(`Error durante la compilación del backend: ${error.message}`);
    throw error;
  }
});
