#!/usr/bin/env node

/**
 * SBLOCCO AUTONOMO VIA TCP DIRETTO
 * 
 * Questo script utilizza il reverse engineering del protocollo AQSH+
 * per sbloccare autonomamente gli orologi via connessione TCP diretta.
 * 
 * Autore: Fabio Marchetti
 * Data: 1 Gennaio 2026
 * Progetto: GPS Tracker - TCP Autonomous Unlock
 */

const net = require('net');
const crypto = require('crypto');
const AdvancedAQSHDecoder = require('./advanced_aqsh_decoder');

class TCPAutonomousUnlock {
  constructor(config = {}) {
    this.config = {
      // Server cinese da intercettare
      chineseServer: {
        ip: '52.28.132.157',
        port: 8001
      },
      
      // TUO server di destinazione
      targetServer: {
        ip: config.serverIP || '91.99.141.225',
        port: config.serverPort || 8001
      },
      
      // Configurazione proxy
      proxyPort: config.proxyPort || 8002,
      timeout: config.timeout || 30000
    };

    this.decoder = new AdvancedAQSHDecoder();
    this.connectedDevices = new Map();
    this.unlockResults = [];
  }

  /**
   * Avvia proxy intercettazione TCP
   */
  startInterceptionProxy() {
    console.log('🚀 Avvio proxy intercettazione TCP...');
    console.log(`🎯 Intercetta: ${this.config.chineseServer.ip}:${this.config.chineseServer.port}`);
    console.log(`🔄 Redirige a: ${this.config.targetServer.ip}:${this.config.targetServer.port}`);
    
    const proxyServer = net.createServer((clientSocket) => {
      const deviceInfo = `${clientSocket.remoteAddress}:${clientSocket.remotePort}`;
      console.log(`\n📱 Nuova connessione dispositivo: ${deviceInfo}`);
      
      // Connessione al server cinese per analisi
      const serverSocket = net.connect(
        this.config.chineseServer.port,
        this.config.chineseServer.ip
      );

      // Intercetta traffico dispositivo -> server
      clientSocket.on('data', async (data) => {
        console.log(`📤 [${deviceInfo}] Dati verso server (${data.length} bytes)`);
        
        // Analizza e modifica dati se necessario
        const modifiedData = await this.interceptAndModify(data, 'client_to_server', deviceInfo);
        
        // Inoltra al server (modificato o originale)
        if (modifiedData) {
          serverSocket.write(modifiedData);
        }
      });

      // Intercetta traffico server -> dispositivo
      serverSocket.on('data', async (data) => {
        console.log(`📥 [${deviceInfo}] Dati dal server (${data.length} bytes)`);
        
        // Analizza e modifica dati se necessario
        const modifiedData = await this.interceptAndModify(data, 'server_to_client', deviceInfo);
        
        // Inoltra al dispositivo (modificato o originale)
        if (modifiedData) {
          clientSocket.write(modifiedData);
        }
      });

      // Gestione disconnessioni
      clientSocket.on('close', () => {
        console.log(`❌ Dispositivo disconnesso: ${deviceInfo}`);
        serverSocket.destroy();
        this.connectedDevices.delete(deviceInfo);
      });

      serverSocket.on('close', () => {
        console.log(`❌ Server disconnesso per: ${deviceInfo}`);
        clientSocket.destroy();
      });

      // Gestione errori
      clientSocket.on('error', (err) => {
        console.error(`⚠️ Errore client ${deviceInfo}:`, err.message);
      });

      serverSocket.on('error', (err) => {
        console.error(`⚠️ Errore server per ${deviceInfo}:`, err.message);
      });
    });

    proxyServer.listen(this.config.proxyPort, '0.0.0.0', () => {
      console.log(`✅ Proxy intercettazione attivo su porta ${this.config.proxyPort}`);
      console.log(`💡 Configura orologi per connettersi a: YOUR_IP:${this.config.proxyPort}`);
    });

    return proxyServer;
  }

  /**
   * Intercetta e modifica pacchetti TCP
   */
  async interceptAndModify(data, direction, deviceInfo) {
    try {
      // Verifica se sono dati AQSH+ criptati
      if (data[0] === 0xff && data.slice(1, 5).toString('ascii') === 'AQSH') {
        console.log(`🔐 [${deviceInfo}] Rilevato protocollo AQSH+ criptato`);
        
        // Tenta decrittazione
        const hexData = data.toString('hex');
        const decryptResult = this.decoder.decode(hexData);
        
        if (decryptResult && decryptResult.fullDecrypted) {
          console.log(`✅ [${deviceInfo}] Decrittazione riuscita!`);
          
          // Modifica configurazione se necessario
          const modifiedData = this.modifyConfiguration(decryptResult.fullDecrypted, deviceInfo);
          
          if (modifiedData) {
            // Ri-cripta con la stessa chiave
            const reencrypted = this.reencryptData(modifiedData, decryptResult);
            return reencrypted;
          }
        } else {
          console.log(`❌ [${deviceInfo}] Decrittazione fallita`);
        }
      }
      
      // Se dati in chiaro, modifica direttamente
      const dataStr = data.toString();
      if (dataStr.includes('52.28.132.157')) {
        console.log(`🔧 [${deviceInfo}] Modifica configurazione server in dati chiaro`);
        const modified = dataStr.replace(/52\.28\.132\.157/g, this.config.targetServer.ip);
        return Buffer.from(modified);
      }
      
      // Analizza per identificazione dispositivo
      this.analyzeDeviceData(data, deviceInfo);
      
      // Restituisci dati originali se nessuna modifica necessaria
      return data;
      
    } catch (error) {
      console.error(`❌ Errore intercettazione [${deviceInfo}]:`, error.message);
      return data; // Restituisci dati originali in caso di errore
    }
  }

  /**
   * Modifica configurazione nei dati decrittati
   */
  modifyConfiguration(data, deviceInfo) {
    const dataStr = data.toString();
    
    // Cerca pattern di configurazione server
    if (dataStr.includes('52.28.132.157') || dataStr.includes('ip_url:')) {
      console.log(`🔧 [${deviceInfo}] Modifica configurazione server`);
      
      const modified = dataStr
        .replace(/52\.28\.132\.157/g, this.config.targetServer.ip)
        .replace(/ip_url:52\.28\.132\.157/g, `ip_url:${this.config.targetServer.ip}`);
      
      if (modified !== dataStr) {
        console.log(`✅ [${deviceInfo}] Configurazione modificata`);
        this.recordUnlockSuccess(deviceInfo);
        return Buffer.from(modified);
      }
    }
    
    return null; // Nessuna modifica necessaria
  }

  /**
   * Ri-cripta dati modificati
   */
  reencryptData(modifiedData, originalDecryptResult) {
    try {
      // Usa la stessa chiave e algoritmo della decrittazione
      const key = Buffer.from(originalDecryptResult.key.slice(0, 16).padEnd(16, '0'), 'ascii');
      const iv = Buffer.from(originalDecryptResult.iv, 'hex');
      
      const cipher = crypto.createCipheriv(originalDecryptResult.algorithm, key, iv);
      cipher.setAutoPadding(false);
      
      let encrypted = cipher.update(modifiedData);
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      
      // Ricostruisci header AQSH+
      const header = Buffer.from([0xff, 0x41, 0x51, 0x53, 0x48]); // ff + AQSH
      const length = Buffer.allocUnsafe(2);
      length.writeUInt16BE(encrypted.length, 0);
      const version = Buffer.from([0x01]);
      
      return Buffer.concat([header, length, version, encrypted]);
      
    } catch (error) {
      console.error('❌ Errore ri-crittazione:', error.message);
      return null;
    }
  }

  /**
   * Analizza dati per identificare dispositivo
   */
  analyzeDeviceData(data, deviceInfo) {
    const dataStr = data.toString();
    
    // Cerca IMEI nei dati
    const imeiMatch = dataStr.match(/\d{15}/);
    if (imeiMatch) {
      const imei = imeiMatch[0];
      if (!this.connectedDevices.has(deviceInfo)) {
        this.connectedDevices.set(deviceInfo, { imei, firstSeen: Date.now() });
        console.log(`📱 [${deviceInfo}] Dispositivo identificato: IMEI ${imei}`);
      }
    }
    
    // Cerca ID dispositivo
    const idMatch = dataStr.match(/ID:([^;]+);/);
    if (idMatch) {
      const deviceId = idMatch[1];
      const device = this.connectedDevices.get(deviceInfo) || {};
      device.deviceId = deviceId;
      this.connectedDevices.set(deviceInfo, device);
      console.log(`🆔 [${deviceInfo}] Device ID: ${deviceId}`);
    }
  }

  /**
   * Registra successo sblocco
   */
  recordUnlockSuccess(deviceInfo) {
    const device = this.connectedDevices.get(deviceInfo);
    const result = {
      deviceInfo,
      imei: device?.imei || 'unknown',
      deviceId: device?.deviceId || 'unknown',
      timestamp: new Date().toISOString(),
      method: 'tcp_intercept',
      success: true
    };
    
    this.unlockResults.push(result);
    console.log(`🎉 [${deviceInfo}] Sblocco registrato con successo!`);
  }

  /**
   * Genera report risultati
   */
  generateReport() {
    console.log('\n📊 REPORT SBLOCCO TCP AUTONOMO');
    console.log('═'.repeat(50));
    console.log(`📱 Dispositivi connessi: ${this.connectedDevices.size}`);
    console.log(`✅ Sbloccati con successo: ${this.unlockResults.length}`);
    
    if (this.unlockResults.length > 0) {
      console.log('\n🎯 DISPOSITIVI SBLOCCATI:');
      this.unlockResults.forEach((result, index) => {
        console.log(`   ${index + 1}. IMEI: ${result.imei} | ID: ${result.deviceId} | ${result.timestamp}`);
      });
    }
    
    console.log('═'.repeat(50));
  }

  /**
   * Salva risultati
   */
  saveResults() {
    const reportData = {
      timestamp: new Date().toISOString(),
      config: this.config,
      connectedDevices: Object.fromEntries(this.connectedDevices),
      unlockResults: this.unlockResults,
      summary: {
        totalConnected: this.connectedDevices.size,
        totalUnlocked: this.unlockResults.length,
        successRate: this.connectedDevices.size > 0 ? 
          (this.unlockResults.length / this.connectedDevices.size * 100).toFixed(1) + '%' : '0%'
      }
    };
    
    const fs = require('fs');
    const filename = `tcp_unlock_results_${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(reportData, null, 2));
    
    console.log(`💾 Risultati salvati: ${filename}`);
    return filename;
  }
}

/**
 * Funzione principale
 */
async function main() {
  console.log('🔓 SBLOCCO AUTONOMO TCP DIRETTO');
  console.log('═'.repeat(60));
  
  try {
    const config = {
      serverIP: process.env.SERVER_IP || '91.99.141.225',
      serverPort: process.env.SERVER_PORT || 8001,
      proxyPort: process.env.PROXY_PORT || 8002
    };

    const tcpUnlock = new TCPAutonomousUnlock(config);
    
    // Avvia proxy intercettazione
    const proxyServer = tcpUnlock.startInterceptionProxy();
    
    console.log('\n💡 ISTRUZIONI:');
    console.log('1. Configura gli orologi per connettersi al proxy:');
    console.log(`   Comando SMS: pw,123456,ip,YOUR_IP,${config.proxyPort}#`);
    console.log('2. Il proxy intercetterà e modificherà automaticamente la configurazione');
    console.log('3. Premi CTRL+C per terminare e vedere il report');
    
    // Gestione terminazione
    process.on('SIGINT', () => {
      console.log('\n⚠️ Terminazione in corso...');
      
      tcpUnlock.generateReport();
      tcpUnlock.saveResults();
      
      proxyServer.close(() => {
        console.log('✅ Proxy chiuso');
        process.exit(0);
      });
    });
    
    // Report periodico ogni 5 minuti
    setInterval(() => {
      console.log(`\n📊 Status: ${tcpUnlock.connectedDevices.size} connessi, ${tcpUnlock.unlockResults.length} sbloccati`);
    }, 300000);
    
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

module.exports = TCPAutonomousUnlock;