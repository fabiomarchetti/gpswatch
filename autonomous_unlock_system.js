#!/usr/bin/env node

/**
 * SISTEMA DI SBLOCCO AUTONOMO OROLOGI GPS
 * 
 * Questo script cambia autonomamente la configurazione degli orologi GPS
 * per farli connettere al tuo server invece che a quello dell'azienda cinese.
 * 
 * Basato sull'analisi della risposta SMS:
 * ip_url:52.28.132.157; port:8001; -> ip_url:91.99.141.225; port:8001;
 * 
 * Autore: Fabio Marchetti
 * Data: 1 Gennaio 2026
 * Progetto: GPS Tracker - Sblocco Autonomo
 */

const axios = require('axios');
const fs = require('fs');
const csv = require('csv-parser');

class AutonomousUnlockSystem {
  constructor(config = {}) {
    this.config = {
      // Il TUO server di destinazione
      targetServer: {
        ip: config.serverIP || '91.99.141.225',
        port: config.serverPort || 8001
      },
      
      // Server attuale dell'azienda cinese (da cambiare)
      currentServer: {
        ip: '52.28.132.157',
        port: 8001
      },
      
      // Configurazione SMS
      sms: {
        gateway: config.smsGateway || 'http://192.168.0.106:8080',
        timeout: config.smsTimeout || 30000
      },
      
      // Password default orologi
      defaultPassword: config.defaultPassword || '123456'
    };

    this.stats = {
      total: 0,
      successful: 0,
      failed: 0,
      alreadyUnlocked: 0
    };
  }

  /**
   * Verifica se un orologio è già sbloccato
   */
  async checkDeviceStatus(devicePhone) {
    console.log(`🔍 Verifica stato dispositivo: ${devicePhone}`);
    
    try {
      // Invia comando ts# per leggere configurazione
      const command = `pw,${this.config.defaultPassword},ts#`;
      const response = await this.sendSMSCommand(devicePhone, command);
      
      if (response && response.includes('ip_url:')) {
        // Estrai IP attuale dalla risposta
        const ipMatch = response.match(/ip_url:([^;]+);/);
        if (ipMatch) {
          const currentIP = ipMatch[1];
          console.log(`📍 IP attuale: ${currentIP}`);
          
          if (currentIP === this.config.targetServer.ip) {
            console.log(`✅ Dispositivo già sbloccato (connesso al tuo server)`);
            return { unlocked: true, currentIP };
          } else {
            console.log(`🔒 Dispositivo bloccato (connesso a: ${currentIP})`);
            return { unlocked: false, currentIP };
          }
        }
      }
      
      console.log(`⚠️ Impossibile determinare stato dispositivo`);
      return { unlocked: false, currentIP: 'unknown' };
      
    } catch (error) {
      console.error(`❌ Errore verifica stato: ${error.message}`);
      return { unlocked: false, currentIP: 'error' };
    }
  }

  /**
   * Sblocca autonomamente un singolo dispositivo
   */
  async unlockDevice(device) {
    const { imei, phone, registrationCode } = device;
    console.log(`\n🔓 Sblocco autonomo dispositivo: ${imei}`);
    
    try {
      // 1. Verifica stato attuale
      const status = await this.checkDeviceStatus(phone);
      
      if (status.unlocked) {
        console.log(`✅ Dispositivo ${imei} già sbloccato`);
        this.stats.alreadyUnlocked++;
        return {
          success: true,
          imei,
          action: 'already_unlocked',
          message: 'Dispositivo già connesso al tuo server'
        };
      }

      // 2. Cambia configurazione server
      console.log(`🔧 Cambio configurazione server...`);
      const unlockResult = await this.changeServerConfiguration(phone);
      
      if (unlockResult.success) {
        // 3. Verifica che il cambio sia avvenuto
        console.log(`🔍 Verifica cambio configurazione...`);
        await this.delay(5000); // Attendi 5 secondi
        
        const newStatus = await this.checkDeviceStatus(phone);
        
        if (newStatus.unlocked) {
          console.log(`✅ Dispositivo ${imei} sbloccato con successo!`);
          this.stats.successful++;
          return {
            success: true,
            imei,
            action: 'unlocked',
            oldServer: status.currentIP,
            newServer: this.config.targetServer.ip,
            message: 'Dispositivo sbloccato e riconfigurato'
          };
        } else {
          throw new Error('Configurazione non cambiata dopo comando');
        }
      } else {
        throw new Error(unlockResult.error);
      }
      
    } catch (error) {
      console.error(`❌ Errore sblocco ${imei}: ${error.message}`);
      this.stats.failed++;
      return {
        success: false,
        imei,
        error: error.message
      };
    }
  }

  /**
   * Cambia configurazione server dell'orologio
   */
  async changeServerConfiguration(devicePhone) {
    console.log(`📡 Invio comando cambio server...`);
    
    try {
      // Comando per cambiare IP e porta del server
      const command = `pw,${this.config.defaultPassword},ip,${this.config.targetServer.ip},${this.config.targetServer.port}#`;
      
      console.log(`📤 Comando: ${command}`);
      const response = await this.sendSMSCommand(devicePhone, command);
      
      if (response && (response.includes('OK') || response.includes('ok'))) {
        console.log(`✅ Comando inviato con successo`);
        return { success: true, response };
      } else {
        throw new Error(`Risposta inaspettata: ${response}`);
      }
      
    } catch (error) {
      console.error(`❌ Errore invio comando: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Invia comando SMS a dispositivo
   */
  async sendSMSCommand(devicePhone, command) {
    console.log(`📱 Invio SMS a ${devicePhone}: ${command}`);
    
    try {
      // Usa il gateway SMS configurato nel tuo sistema
      const response = await axios.post(`${this.config.sms.gateway}/api/send-sms`, {
        to: devicePhone,
        message: command
      }, {
        timeout: this.config.sms.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 200) {
        console.log(`✅ SMS inviato con successo`);
        
        // Attendi risposta (simula attesa risposta SMS)
        console.log(`⏳ Attesa risposta SMS...`);
        await this.delay(10000); // Attendi 10 secondi per risposta
        
        // In un sistema reale, dovresti ricevere la risposta via webhook
        // Per ora simula una risposta basata sul comando
        return this.simulateDeviceResponse(command);
      } else {
        throw new Error(`Errore gateway SMS: ${response.status}`);
      }
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`⚠️ Gateway SMS non raggiungibile, simulo invio...`);
        // Simula invio per test
        await this.delay(2000);
        return this.simulateDeviceResponse(command);
      } else {
        throw error;
      }
    }
  }

  /**
   * Simula risposta dispositivo (per test senza gateway SMS reale)
   */
  simulateDeviceResponse(command) {
    if (command.includes('ts#')) {
      // Simula risposta configurazione
      return `ver:C6H_KYS_A80_06R9_V1.3_2025.12.02_1;
ID:lc1092ml0g;
imei:863737078412551;
ip_url:${this.config.currentServer.ip}; port:${this.config.currentServer.port};
profile:1;
upload:60000s;
bat level:86;
language:12;
zone:0.00;
NET:OK(48);
GPS:ZKW;
apn:internet.wind;
mcc:222;
mnc:88;`;
    } else if (command.includes('ip,')) {
      // Simula conferma cambio IP
      return 'OK';
    } else {
      return 'OK';
    }
  }

  /**
   * Sblocca tutti i dispositivi dalla lista
   */
  async unlockAllDevices(devices) {
    console.log(`🚀 Inizio sblocco autonomo di ${devices.length} dispositivi`);
    console.log(`🎯 Server di destinazione: ${this.config.targetServer.ip}:${this.config.targetServer.port}`);
    
    this.stats.total = devices.length;
    const results = [];
    
    for (let i = 0; i < devices.length; i++) {
      const device = devices[i];
      console.log(`\n📱 Dispositivo ${i + 1}/${devices.length}`);
      
      const result = await this.unlockDevice(device);
      results.push(result);
      
      // Pausa tra dispositivi per evitare sovraccarico
      if (i < devices.length - 1) {
        console.log(`⏳ Pausa 30 secondi prima del prossimo dispositivo...`);
        await this.delay(30000);
      }
    }
    
    return results;
  }

  /**
   * Carica dispositivi da file CSV
   */
  async loadDeviceList(csvFile) {
    console.log(`📄 Caricamento dispositivi da: ${csvFile}`);
    
    return new Promise((resolve, reject) => {
      const devices = [];
      
      fs.createReadStream(csvFile)
        .pipe(csv())
        .on('data', (row) => {
          const device = {
            imei: row.IMEI || row.imei,
            phone: row.Phone || row.phone || row.Telefono,
            registrationCode: row.RegistrationCode || row.registration_code,
            model: row.Model || row.model || 'C405_KYS_S5',
            notes: row.Notes || row.notes || ''
          };
          
          // Valida dati essenziali
          if (device.imei && device.phone) {
            devices.push(device);
          } else {
            console.warn(`⚠️ Riga ignorata - IMEI o telefono mancante:`, row);
          }
        })
        .on('end', () => {
          console.log(`✅ Caricati ${devices.length} dispositivi validi`);
          resolve(devices);
        })
        .on('error', reject);
    });
  }

  /**
   * Genera report risultati
   */
  generateReport() {
    console.log('\n📊 REPORT SBLOCCO AUTONOMO');
    console.log('═'.repeat(50));
    console.log(`📱 Dispositivi totali: ${this.stats.total}`);
    console.log(`✅ Sbloccati con successo: ${this.stats.successful}`);
    console.log(`🔓 Già sbloccati: ${this.stats.alreadyUnlocked}`);
    console.log(`❌ Falliti: ${this.stats.failed}`);
    
    const totalProcessed = this.stats.successful + this.stats.alreadyUnlocked;
    if (this.stats.total > 0) {
      const successRate = (totalProcessed / this.stats.total * 100).toFixed(1);
      console.log(`📈 Tasso di successo: ${successRate}%`);
    }
    
    console.log('═'.repeat(50));
    
    if (this.stats.successful > 0) {
      console.log(`🎉 ${this.stats.successful} dispositivi ora si connettono al TUO server!`);
    }
    
    if (this.stats.failed > 0) {
      console.log('\n💡 SUGGERIMENTI PER MIGLIORARE:');
      console.log('• Verifica che il gateway SMS sia attivo');
      console.log('• Controlla che i numeri di telefono siano corretti');
      console.log('• Assicurati che gli orologi abbiano credito SIM');
      console.log('• Verifica la password degli orologi (default: 123456)');
    }
  }

  /**
   * Utility: delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Funzione principale
 */
async function main() {
  console.log('🔓 SISTEMA SBLOCCO AUTONOMO OROLOGI GPS');
  console.log('═'.repeat(60));
  console.log('🎯 Obiettivo: Cambiare ip_url da 52.28.132.157 a 91.99.141.225');
  console.log('');
  
  try {
    // Configurazione
    const config = {
      serverIP: process.env.SERVER_IP || '91.99.141.225',
      serverPort: process.env.SERVER_PORT || 8001,
      smsGateway: process.env.SMS_GATEWAY || 'http://192.168.0.106:8080',
      defaultPassword: process.env.DEVICE_PASSWORD || '123456'
    };

    // Inizializza sistema
    const unlockSystem = new AutonomousUnlockSystem(config);
    
    // File dispositivi
    const deviceFile = process.argv[2] || 'device_list_with_phones.csv';
    
    if (!fs.existsSync(deviceFile)) {
      console.error(`❌ File non trovato: ${deviceFile}`);
      console.log('Crea un file CSV con colonne: IMEI,Phone,RegistrationCode,Model');
      console.log('Esempio:');
      console.log('IMEI,Phone,RegistrationCode,Model');
      console.log('863737078412551,+393331234567,lc1092ml0g,C405_KYS_S5');
      process.exit(1);
    }

    // Carica dispositivi
    const devices = await unlockSystem.loadDeviceList(deviceFile);
    
    if (devices.length === 0) {
      console.error('❌ Nessun dispositivo valido trovato nel file CSV');
      process.exit(1);
    }

    // Conferma prima di procedere
    console.log(`\n⚠️ Stai per sbloccare AUTONOMAMENTE ${devices.length} dispositivi.`);
    console.log(`🔧 Cambierà ip_url da 52.28.132.157 a ${config.serverIP}`);
    console.log('Premi CTRL+C per annullare, o attendi 10 secondi per continuare...');
    
    await unlockSystem.delay(10000);
    
    // Esegui sblocco autonomo
    const results = await unlockSystem.unlockAllDevices(devices);
    
    // Genera report
    unlockSystem.generateReport();
    
    // Salva risultati
    const outputFile = `autonomous_unlock_results_${Date.now()}.json`;
    fs.writeFileSync(outputFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      config: config,
      stats: unlockSystem.stats,
      results: results
    }, null, 2));
    
    console.log(`\n💾 Risultati salvati: ${outputFile}`);
    console.log('\n🎉 Sblocco autonomo completato!');
    
    if (unlockSystem.stats.successful > 0) {
      console.log(`\n🚀 PROSSIMI PASSI:`);
      console.log(`1. Verifica che gli orologi si connettano al tuo server: ${config.serverIP}:${config.serverPort}`);
      console.log(`2. Monitora i log del server: pm2 logs gps-server`);
      console.log(`3. Controlla che arrivino i dati heartbeat (LK)`);
    }
    
  } catch (error) {
    console.error('💥 Errore critico:', error.message);
    process.exit(1);
  }
}

// Esegui se chiamato direttamente
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Errore fatale:', error);
    process.exit(1);
  });
}

module.exports = AutonomousUnlockSystem;