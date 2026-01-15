#!/usr/bin/env node

/**
 * PROXY TCP PER INTERCETTAZIONE E SBLOCCO AUTONOMO
 * 
 * Questo script crea un proxy TCP che intercetta la comunicazione
 * tra l'orologio e il server cinese, modificando i pacchetti per
 * redirigere l'orologio al tuo server.
 * 
 * Autore: Fabio Marchetti
 * Data: 1 Gennaio 2026
 * Progetto: GPS Tracker - TCP Intercept Proxy
 */

const net = require('net');
const fs = require('fs');

class TCPInterceptProxy {
  constructor() {
    this.config = {
      // Server cinese da intercettare
      chineseServer: {
        ip: '52.28.132.157',
        port: 8001
      },
      
      // TUO server di destinazione
      targetServer: {
        ip: '91.99.141.225',
        port: 8001
      },
      
      // Porta del proxy
      proxyPort: 8002
    };

    this.connectedDevices = new Map();
    this.interceptedPackets = [];
    this.modifiedPackets = [];
  }

  /**
   * Avvia il proxy di intercettazione
   */
  startProxy() {
    console.log('🚀 AVVIO PROXY INTERCETTAZIONE TCP');
    console.log('═'.repeat(50));
    console.log(`🎯 Intercetta: ${this.config.chineseServer.ip}:${this.config.chineseServer.port}`);
    console.log(`🔄 Redirige a: ${this.config.targetServer.ip}:${this.config.targetServer.port}`);
    console.log(`📡 Proxy porta: ${this.config.proxyPort}`);
    console.log('');

    const proxyServer = net.createServer((clientSocket) => {
      const deviceInfo = `${clientSocket.remoteAddress}:${clientSocket.remotePort}`;
      console.log(`\n📱 NUOVA CONNESSIONE: ${deviceInfo}`);
      
      // Connessione al server cinese
      const serverSocket = net.connect(
        this.config.chineseServer.port,
        this.config.chineseServer.ip,
        () => {
          console.log(`✅ Connesso al server cinese per ${deviceInfo}`);
        }
      );

      // Intercetta traffico: Dispositivo → Server Cinese
      clientSocket.on('data', (data) => {
        console.log(`\n📤 [${deviceInfo}] → Server Cinese (${data.length} bytes)`);
        console.log(`📝 Dati: ${data.toString().substring(0, 100)}`);
        
        // Registra pacchetto intercettato
        this.interceptedPackets.push({
          timestamp: new Date().toISOString(),
          direction: 'client_to_server',
          deviceInfo,
          data: data.toString('hex'),
          readable: data.toString()
        });
        
        // Analizza e modifica se necessario
        const modifiedData = this.analyzeAndModify(data, 'client_to_server', deviceInfo);
        
        // Inoltra al server cinese
        serverSocket.write(modifiedData);
      });

      // Intercetta traffico: Server Cinese → Dispositivo
      serverSocket.on('data', (data) => {
        console.log(`\n📥 [${deviceInfo}] ← Server Cinese (${data.length} bytes)`);
        console.log(`📝 Dati: ${data.toString().substring(0, 100)}`);
        
        // Registra pacchetto intercettato
        this.interceptedPackets.push({
          timestamp: new Date().toISOString(),
          direction: 'server_to_client',
          deviceInfo,
          data: data.toString('hex'),
          readable: data.toString()
        });
        
        // Analizza e modifica se necessario
        const modifiedData = this.analyzeAndModify(data, 'server_to_client', deviceInfo);
        
        // Inoltra al dispositivo
        clientSocket.write(modifiedData);
      });

      // Gestione disconnessioni
      clientSocket.on('close', () => {
        console.log(`❌ Dispositivo disconnesso: ${deviceInfo}`);
        serverSocket.destroy();
        this.saveInterceptionLog(deviceInfo);
      });

      serverSocket.on('close', () => {
        console.log(`❌ Server cinese disconnesso per: ${deviceInfo}`);
        clientSocket.destroy();
      });

      // Gestione errori
      clientSocket.on('error', (err) => {
        console.error(`⚠️ Errore dispositivo ${deviceInfo}:`, err.message);
      });

      serverSocket.on('error', (err) => {
        console.error(`⚠️ Errore server per ${deviceInfo}:`, err.message);
      });
    });

    // Avvia server proxy
    proxyServer.listen(this.config.proxyPort, '0.0.0.0', () => {
      console.log(`✅ PROXY ATTIVO su porta ${this.config.proxyPort}`);
      console.log('');
      console.log('📋 PROSSIMO PASSO:');
      console.log(`   Configura l'orologio per connettersi a: 91.99.141.225:${this.config.proxyPort}`);
      console.log('   Comando SMS: pw,123456,ip,91.99.141.225,8002#');
      console.log('');
      console.log('⏳ In attesa connessioni...');
    });

    return proxyServer;
  }

  /**
   * Analizza e modifica pacchetti intercettati
   */
  analyzeAndModify(data, direction, deviceInfo) {
    const dataStr = data.toString();
    let modified = false;
    let modifiedData = data;

    // Cerca riferimenti al server cinese nei dati
    if (dataStr.includes('52.28.132.157')) {
      console.log(`🔧 [${deviceInfo}] Trovato riferimento server cinese, modifico...`);
      
      const modifiedStr = dataStr.replace(/52\.28\.132\.157/g, this.config.targetServer.ip);
      modifiedData = Buffer.from(modifiedStr);
      modified = true;
      
      console.log(`✅ [${deviceInfo}] Server modificato: 52.28.132.157 → ${this.config.targetServer.ip}`);
    }

    // Cerca configurazioni IP nei pacchetti
    if (dataStr.includes('ip_url:')) {
      console.log(`🔧 [${deviceInfo}] Trovata configurazione IP, modifico...`);
      
      const modifiedStr = dataStr.replace(/ip_url:52\.28\.132\.157/g, `ip_url:${this.config.targetServer.ip}`);
      modifiedData = Buffer.from(modifiedStr);
      modified = true;
      
      console.log(`✅ [${deviceInfo}] Configurazione IP modificata`);
    }

    // Registra modifiche
    if (modified) {
      this.modifiedPackets.push({
        timestamp: new Date().toISOString(),
        direction,
        deviceInfo,
        original: data.toString(),
        modified: modifiedData.toString(),
        changes: 'Server IP redirected'
      });
      
      console.log(`📝 [${deviceInfo}] Pacchetto modificato e registrato`);
    }

    return modifiedData;
  }

  /**
   * Salva log intercettazione
   */
  saveInterceptionLog(deviceInfo) {
    const logData = {
      timestamp: new Date().toISOString(),
      deviceInfo,
      totalPackets: this.interceptedPackets.filter(p => p.deviceInfo === deviceInfo).length,
      modifiedPackets: this.modifiedPackets.filter(p => p.deviceInfo === deviceInfo).length,
      interceptedData: this.interceptedPackets.filter(p => p.deviceInfo === deviceInfo),
      modifications: this.modifiedPackets.filter(p => p.deviceInfo === deviceInfo)
    };

    const filename = `intercept_log_${deviceInfo.replace(/[:.]/g, '_')}_${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(logData, null, 2));
    
    console.log(`💾 Log intercettazione salvato: ${filename}`);
  }

  /**
   * Genera report in tempo reale
   */
  generateRealTimeReport() {
    console.log('\n📊 REPORT INTERCETTAZIONE');
    console.log('─'.repeat(40));
    console.log(`📱 Dispositivi connessi: ${this.connectedDevices.size}`);
    console.log(`📦 Pacchetti intercettati: ${this.interceptedPackets.length}`);
    console.log(`🔧 Pacchetti modificati: ${this.modifiedPackets.length}`);
    
    if (this.modifiedPackets.length > 0) {
      console.log('\n✅ MODIFICHE EFFETTUATE:');
      this.modifiedPackets.slice(-3).forEach((mod, index) => {
        console.log(`   ${index + 1}. ${mod.deviceInfo}: ${mod.changes}`);
      });
    }
    
    console.log('─'.repeat(40));
  }
}

/**
 * Funzione principale
 */
function main() {
  console.log('🌐 TCP INTERCEPT PROXY - SBLOCCO AUTONOMO');
  console.log('═'.repeat(60));
  
  const proxy = new TCPInterceptProxy();
  
  // Avvia proxy
  const server = proxy.startProxy();
  
  // Report periodico ogni 30 secondi
  const reportInterval = setInterval(() => {
    proxy.generateRealTimeReport();
  }, 30000);
  
  // Gestione terminazione
  process.on('SIGINT', () => {
    console.log('\n⚠️ Terminazione proxy...');
    
    clearInterval(reportInterval);
    proxy.generateRealTimeReport();
    
    // Salva log finale
    const finalLog = {
      timestamp: new Date().toISOString(),
      summary: {
        totalDevices: proxy.connectedDevices.size,
        totalPackets: proxy.interceptedPackets.length,
        totalModifications: proxy.modifiedPackets.length
      },
      allInterceptedPackets: proxy.interceptedPackets,
      allModifications: proxy.modifiedPackets
    };
    
    fs.writeFileSync(`final_intercept_log_${Date.now()}.json`, JSON.stringify(finalLog, null, 2));
    
    server.close(() => {
      console.log('✅ Proxy chiuso');
      process.exit(0);
    });
  });
  
  console.log('\n💡 ISTRUZIONI:');
  console.log('1. Lascia questo proxy in esecuzione');
  console.log('2. Configura l\'orologio per connettersi al proxy');
  console.log('3. Il proxy intercetterà e modificherà automaticamente i pacchetti');
  console.log('4. Premi CTRL+C per terminare e vedere il report finale');
}

// Esegui se chiamato direttamente
if (require.main === module) {
  main();
}

module.exports = TCPInterceptProxy;