const { execSync } = require('child_process');
const fs = require('fs');

const repos = [
  'https://github.com/quantumlib/Qualtran.git',
  'https://github.com/tensorflow/quantum.git',
  'https://github.com/quantumlib/qsim.git',
  'https://github.com/quantumlib/OpenFermion.git'
];

if (!fs.existsSync('./quantum_libraries')) {
  fs.mkdirSync('./quantum_libraries');
}

for (const repo of repos) {
  const name = repo.split('/').pop().replace('.git', '');
  const path = `./quantum_libraries/${name}`;
  if (!fs.existsSync(path)) {
    console.log(`Cloning ${name}...`);
    try {
      execSync(`git clone --depth 1 ${repo} ${path}`, { stdio: 'inherit' });
    } catch (e) {
      console.error(`Failed to clone ${name}`);
    }
  } else {
    console.log(`${name} already exists.`);
  }
}
