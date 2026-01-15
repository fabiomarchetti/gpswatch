#!/usr/bin/env node

/**
 * SCRIPT DI SETUP PER SISTEMA SBLOCCO AUTOMATICO OROLOGI GPS
 * 
 * Questo script configura automaticamente l'ambiente per il sistema
 * di sblocco di massa degli orologi GPS.
 * 
 * Autore: Fabio Marchetti
 * Data: 1 Gennaio 2026
 * Progetto: GPS Tracker - Setup Automatico
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SetupManager {
  constructor() {
    this.envFile = '.env';
    this.requiredDirs = ['logs', 'results', 'backup'];
    this.requiredEnvVars = [
      'EMAIL_USER',
      'EMAIL_PASSWORD', 
      'EMAIL_FROM',
      'BUSINESS_EMAIL',
      'BUSINESS_PHONE',
      'BUSINESS_CONTACT',
      'SETRACKER_USERNAME',
      'SETRACKER_PASSWORD',
      'SERVER_IP',
      'SERVER_PORT'
    ];
  }

  /**
   * Verifica prerequisiti sistema
   */
  checkPrerequisites() {
    console.log('🔍 Verifica prerequisiti...');
    
    // Verifica Node.js
    try {
      const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
      console.log(`✅ Node.js: ${nodeVersion}`);
      
      const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
      if (majorVersion < 14) {
        throw new Error(`Node.js ${majorVersion} non supportato. Richiesto >= 14`);
      }
    } catch (error) {
      console.error('❌ Node.js non trovato o versione non supportata');
      process.exit(1);
    }

    // Verifica npm
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      console.log(`✅ npm: ${npmVersion}`);
    } catch (error) {
      console.error('❌ npm non trovato');
      process.exit(1);
    }

    console.log('✅ Prerequisiti verificati');
  }

  /**
   * Installa dipendenze
   */
  installDependencies() {
    console.log('📦 Installazione dipendenze...');
    
    try {
      execSync('npm install', { stdio: 'inherit' });
      console.log('✅ Dipendenze installate');
    } catch (error) {
      console.error('❌ Errore installazione dipendenze:', error.message);
      process.exit(1);
    }
  }

  /**
   * Crea directory necessarie
   */
  createDirectories() {
    console.log('📁 Creazione directory...');
    
    this.requiredDirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Directory creata: ${dir}`);
      } else {
        console.log(`ℹ️ Directory esistente: ${dir}`);
      }
    });
  }

  /**
   * Configura file .env
   */
  setupEnvironment() {
    console.log('⚙️ Configurazione ambiente...');
    
    if (fs.existsSync(this.envFile)) {
      console.log('ℹ️ File .env esistente trovato');
      this.loadExistingEnv();
    } else {
      console.log('📝 Creazione nuovo file .env');
      this.createNewEnv();
    }
  }

  /**
   * Carica .env esistente
   */
  loadExistingEnv() {
    const envContent = fs.readFileSync(this.envFile, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key] = value.replace(/"/g, '');
      }
    });

    // Verifica variabili mancanti
    const missingVars = this.requiredEnvVars.filter(varName => !envVars[varName]);
    
    if (missingVars.length > 0) {
      console.log('⚠️ Variabili mancanti nel file .env:');
      missingVars.forEach(varName => console.log(`   • ${varName}`));
      this.promptForMissingVars(missingVars, envVars);
    } else {
      console.log('✅ Tutte le variabili d\'ambiente configurate');
    }
  }

  /**
   * Crea nuovo file .env
   */
  createNewEnv() {
    const envTemplate = `# Configurazione Email
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=your_email@gmail.com

# Informazioni Business
BUSINESS_EMAIL=your_business@email.com
BUSINESS_PHONE=+39 XXX XXX XXXX
BUSINESS_CONTACT=Fabio Marchetti

# Credenziali SeTracker/Wonlex
SETRACKER_USERNAME=your_dealer_username
SETRACKER_PASSWORD=your_dealer_password
DEALER_CODE=your_dealer_code

# Configurazione Server
SERVER_IP=91.99.141.225
SERVER_PORT=8001

# Configurazione Batch
BATCH_SIZE=10
BATCH_DELAY=5000

# Debug
DEBUG=false
LOG_LEVEL=info
`;

    fs.writeFileSync(this.envFile, envTemplate);
    console.log(`✅ File .env creato: ${this.envFile}`);
    console.log('⚠️ IMPORTANTE: Modifica il file .env con i tuoi dati reali!');
  }

  /**
   * Richiede variabili mancanti
   */
  promptForMissingVars(missingVars, existingVars) {
    console.log('\n📝 Configurazione variabili mancanti...');
    
    const defaultValues = {
      'EMAIL_USER': 'your_email@gmail.com',
      'EMAIL_PASSWORD': 'your_app_password',
      'EMAIL_FROM': 'your_email@gmail.com',
      'BUSINESS_EMAIL': 'your_business@email.com',
      'BUSINESS_PHONE': '+39 XXX XXX XXXX',
      'BUSINESS_CONTACT': 'Fabio Marchetti',
      'SETRACKER_USERNAME': 'your_dealer_username',
      'SETRACKER_PASSWORD': 'your_dealer_password',
      'SERVER_IP': '91.99.141.225',
      'SERVER_PORT': '8001'
    };

    // Aggiungi variabili mancanti con valori di default
    missingVars.forEach(varName => {
      existingVars[varName] = defaultValues[varName] || 'CONFIGURE_ME';
    });

    // Riscrive il file .env
    const envContent = Object.entries(existingVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    fs.writeFileSync(this.envFile, envContent);
    console.log('✅ File .env aggiornato con variabili mancanti');
  }

  /**
   * Verifica configurazione
   */
  verifyConfiguration() {
    console.log('🔍 Verifica configurazione...');
    
    // Carica .env
    require('dotenv').config();
    
    const issues = [];
    
    // Verifica variabili critiche
    this.requiredEnvVars.forEach(varName => {
      const value = process.env[varName];
      if (!value || value.includes('your_') || value.includes('CONFIGURE_ME')) {
        issues.push(`${varName}: ${value || 'NON CONFIGURATA'}`);
      }
    });

    if (issues.length > 0) {
      console.log('\n⚠️ PROBLEMI DI CONFIGURAZIONE:');
      issues.forEach(issue => console.log(`   • ${issue}`));
      console.log('\n💡 Modifica il file .env con i tuoi dati reali prima di usare il sistema.');
      return false;
    } else {
      console.log('✅ Configurazione verificata');
      return true;
    }
  }

  /**
   * Crea file di esempio
   */
  createExampleFiles() {
    console.log('📄 Creazione file di esempio...');
    
    // File README
    const readmeContent = `# Sistema Sblocco Automatico Orologi GPS

## 🚀 Avvio Rapido

1. Configura il file \`.env\` con i tuoi dati
2. Modifica \`device_list_example.csv\` con i tuoi dispositivi
3. Esegui: \`npm run fota\` per richiesta FOTA di massa
4. Oppure: \`npm run unlock\` per sblocco automatizzato

## 📋 Comandi Disponibili

- \`npm run fota\` - Invia richiesta FOTA di massa
- \`npm run unlock\` - Sblocco automatizzato via API
- \`npm run decode\` - Test decoder AQSH+
- \`npm run setup\` - Riconfigura ambiente

## 📞 Supporto

Per supporto contatta: fabio@gps-tracker.it
`;

    fs.writeFileSync('README.md', readmeContent);
    console.log('✅ README.md creato');

    // Script di avvio
    const startScript = `#!/bin/bash
echo "🚀 Avvio Sistema Sblocco Orologi GPS"
echo "=================================="

# Verifica configurazione
if [ ! -f .env ]; then
    echo "❌ File .env non trovato. Esegui: npm run setup"
    exit 1
fi

# Menu interattivo
echo "Seleziona operazione:"
echo "1) Richiesta FOTA di massa"
echo "2) Sblocco automatizzato"
echo "3) Test decoder AQSH+"
echo "4) Verifica configurazione"

read -p "Scelta (1-4): " choice

case $choice in
    1) npm run fota ;;
    2) npm run unlock ;;
    3) npm run decode ;;
    4) npm run check-env ;;
    *) echo "Scelta non valida" ;;
esac
`;

    fs.writeFileSync('start.sh', startScript);
    try {
      execSync('chmod +x start.sh');
    } catch (error) {
      // Ignora errori su Windows
    }
    console.log('✅ Script start.sh creato');
  }

  /**
   * Esegue setup completo
   */
  async run() {
    console.log('🛠️ SETUP SISTEMA SBLOCCO AUTOMATICO OROLOGI GPS');
    console.log('═'.repeat(60));
    
    try {
      this.checkPrerequisites();
      this.createDirectories();
      this.installDependencies();
      this.setupEnvironment();
      this.createExampleFiles();
      
      const configOk = this.verifyConfiguration();
      
      console.log('\n🎉 SETUP COMPLETATO!');
      console.log('═'.repeat(40));
      
      if (configOk) {
        console.log('✅ Sistema pronto per l\'uso');
        console.log('\n🚀 PROSSIMI PASSI:');
        console.log('1. Modifica device_list_example.csv con i tuoi dispositivi');
        console.log('2. Esegui: npm run fota (per richiesta FOTA)');
        console.log('3. Oppure: npm run unlock (per sblocco automatico)');
      } else {
        console.log('⚠️ Configurazione incompleta');
        console.log('\n🔧 AZIONI RICHIESTE:');
        console.log('1. Modifica il file .env con i tuoi dati reali');
        console.log('2. Esegui nuovamente: npm run setup');
      }
      
      console.log('\n📚 DOCUMENTAZIONE:');
      console.log('• README.md - Guida completa');
      console.log('• documenti/SOLUZIONI_SBLOCCO_AUTOMATICO_OROLOGI.md - Soluzioni dettagliate');
      
    } catch (error) {
      console.error('\n💥 Errore durante il setup:', error.message);
      process.exit(1);
    }
  }
}

// Esegui setup
if (require.main === module) {
  const setup = new SetupManager();
  setup.run().catch(error => {
    console.error('💥 Errore fatale:', error);
    process.exit(1);
  });
}

module.exports = SetupManager;