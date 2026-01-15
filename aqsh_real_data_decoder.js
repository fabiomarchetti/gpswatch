#!/usr/bin/env node

/**
 * DECODER AQSH+ CON DATI REALI CATTURATI
 * 
 * Questo script analizza i dati AQSH+ reali catturati dal tuo orologio
 * per trovare la chiave di decrittazione e sbloccare altri orologi.
 * 
 * Dati catturati: ff415153480002b010000000a6efef2231a6958a144f64f1dd79aba757c81bb2a69e29356df79796a15436a1695654ba8e
 * 
 * Autore: Fabio Marchetti
 * Data: 1 Gennaio 2026
 * Progetto: GPS Tracker - Real AQSH+ Decoder
 */

const crypto = require('crypto');
const fs = require('fs');

class RealAQSHDecoder {
  constructor() {
    // Dati reali catturati dal tuo orologio
    this.realAQSHData = 'ff415153480002b010000000a6efef2231a6958a144f64f1dd79aba757c81bb2a69e29356df79796a15436a1695654ba8e';
    
    // Chiavi specifiche per il tuo dispositivo
    this.deviceSpecificKeys = [
      // Basate sul tuo IMEI: 863737078412551
      '863737078412551',
      '8637370784125516',
      '863737078412551k',
      
      // Basate sul Device ID: lc1092ml0g
      'lc1092ml0g123456',
      'lc1092ml0g000000',
      
      // Basate sul modello: C6H_KYS_A80
      'C6H_KYS_A80_key',
      'c6hkysa80key1234',
      
      // Chiavi derivate da timestamp
      '20251202key12345',
      '2025120212341234',
      
      // Combinazioni
      '863737lc1092ml0g',
      'lc1092863737key1'
    ];
    
    // Algoritmi da testare
    this.algorithms = [
      'aes-128-cbc',
      'aes-128-ecb', 
      'aes-256-cbc',
      'aes-256-ecb'
    ];
    
    // IV comuni
    this.commonIVs = [
      Buffer.alloc(16, 0), // Zero IV
      Buffer.from('1234567890123456', 'ascii'),
      Buffer.from('lc1092ml0g123456', 'ascii').slice(0, 16),
      Buffer.from('863737078412551', 'ascii').slice(0, 16)
    ];
  }

  /**
   * Analizza header AQSH+ dai dati reali
   */
  parseRealAQSHData() {
    console.log('🔍 ANALISI DATI AQSH+ REALI');
    console.log('═'.repeat(50));
    
    const data = Buffer.from(this.realAQSHData, 'hex');
    console.log(`📊 Lunghezza totale: ${data.length} bytes`);
    console.log(`📝 Dati hex: ${this.realAQSHData}`);
    
    // Analizza header
    const marker = data[0];
    const header = data.slice(1, 5).toString('ascii');
    const length = data.readUInt16BE(5);
    const version = data[7];
    const payload = data.slice(8);
    
    console.log('\n📋 STRUTTURA HEADER:');
    console.log(`   Marker: 0x${marker.toString(16)} (${marker === 0xff ? '✅ Valido' : '❌ Non valido'})`);
    console.log(`   Header: ${header} (${header === 'AQSH' ? '✅ Valido' : '❌ Non valido'})`);
    console.log(`   Length: ${length} bytes`);
    console.log(`   Version: ${version}`);
    console.log(`   Payload: ${payload.length} bytes`);
    
    return {
      isValid: marker === 0xff && header === 'AQSH',
      payload: payload,
      length: length,
      version: version
    };
  }

  /**
   * Tenta decrittazione con chiavi specifiche del dispositivo
   */
  tryDeviceSpecificDecryption(payload) {
    console.log('\n🔐 TENTATIVO DECRITTAZIONE CON CHIAVI SPECIFICHE');
    console.log('─'.repeat(50));
    
    const results = [];
    
    for (const algorithm of this.algorithms) {
      for (const keyStr of this.deviceSpecificKeys) {
        for (const iv of this.commonIVs) {
          try {
            // Prepara chiave
            let key = Buffer.from(keyStr.slice(0, 16).padEnd(16, '0'), 'ascii');
            
            // Adatta lunghezza chiave per algoritmo
            if (algorithm.includes('256')) {
              key = Buffer.concat([key, key]).slice(0, 32);
            } else {
              key = key.slice(0, 16);
            }
            
            const decipher = crypto.createDecipheriv(algorithm, key, iv);
            decipher.setAutoPadding(false);
            
            let decrypted = decipher.update(payload);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            
            // Verifica se sembra un protocollo GPS valido
            const decryptedStr = this.bufferToReadableString(decrypted);
            const confidence = this.calculateConfidence(decryptedStr);
            
            if (confidence > 20) {
              console.log(`\n🔑 POSSIBILE CHIAVE TROVATA:`);
              console.log(`   Algoritmo: ${algorithm}`);
              console.log(`   Chiave: ${keyStr}`);
              console.log(`   IV: ${iv.toString('hex').slice(0, 32)}`);
              console.log(`   Confidenza: ${confidence}`);
              console.log(`   Risultato: ${decryptedStr.substring(0, 100)}`);
              
              results.push({
                algorithm,
                key: keyStr,
                iv: iv.toString('hex'),
                confidence,
                decrypted: decryptedStr,
                fullDecrypted: decrypted
              });
            }
            
          } catch (error) {
            // Ignora errori di decrittazione
          }
        }
      }
    }
    
    return results.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Converte buffer in stringa leggibile
   */
  bufferToReadableString(buffer) {
    let result = '';
    for (let i = 0; i < Math.min(100, buffer.length); i++) {
      const byte = buffer[i];
      if (byte >= 32 && byte <= 126) {
        result += String.fromCharCode(byte);
      } else {
        result += `\\x${byte.toString(16).padStart(2, '0')}`;
      }
    }
    return result;
  }

  /**
   * Calcola confidenza del risultato
   */
  calculateConfidence(text) {
    let score = 0;
    
    // Pattern GPS specifici
    if (/\[.*\*.*\*.*\*.*\]/.test(text)) score += 50;
    if (/LK,|UD,|AL,|bphrt,|oxygen,|btemp2,/.test(text)) score += 40;
    if (/3707805539/.test(text)) score += 30; // Device ID specifico
    if (/863737078412551/.test(text)) score += 30; // IMEI specifico
    if (/\d{2},\d{2},\d{2}/.test(text)) score += 20;
    
    // Caratteri stampabili
    const printableCount = (text.match(/[a-zA-Z0-9\[\]*,.-]/g) || []).length;
    score += printableCount;
    
    // Penalizza caratteri di controllo
    const controlCount = (text.match(/\\x/g) || []).length;
    score -= controlCount * 2;
    
    return Math.max(0, score);
  }

  /**
   * Analisi completa dei dati reali
   */
  analyzeRealData() {
    console.log('🔬 ANALISI COMPLETA DATI AQSH+ REALI');
    console.log('═'.repeat(60));
    
    // Parse header
    const headerInfo = this.parseRealAQSHData();
    
    if (!headerInfo.isValid) {
      console.log('❌ Header AQSH+ non valido nei dati reali');
      return null;
    }
    
    // Tenta decrittazione
    const results = this.tryDeviceSpecificDecryption(headerInfo.payload);
    
    if (results.length > 0) {
      console.log('\n🎉 DECRITTAZIONE RIUSCITA!');
      console.log('═'.repeat(50));
      
      const bestResult = results[0];
      console.log(`🔑 Chiave migliore: ${bestResult.key}`);
      console.log(`🔧 Algoritmo: ${bestResult.algorithm}`);
      console.log(`📊 Confidenza: ${bestResult.confidence}`);
      console.log(`📝 Dati decrittati: ${bestResult.decrypted}`);
      
      // Salva chiave trovata
      this.saveFoundKey(bestResult);
      
      return bestResult;
    } else {
      console.log('\n❌ DECRITTAZIONE FALLITA');
      console.log('💡 Suggerimenti:');
      console.log('   • I dati potrebbero non essere AQSH+ standard');
      console.log('   • Potrebbe essere una variante proprietaria');
      console.log('   • Serve più analisi del protocollo');
      
      return null;
    }
  }

  /**
   * Salva chiave trovata per uso futuro
   */
  saveFoundKey(result) {
    const keyData = {
      timestamp: new Date().toISOString(),
      deviceIMEI: '863737078412551',
      deviceID: 'lc1092ml0g',
      foundKey: {
        algorithm: result.algorithm,
        key: result.key,
        iv: result.iv,
        confidence: result.confidence
      },
      originalData: this.realAQSHData,
      decryptedData: result.decrypted
    };
    
    fs.writeFileSync('found_aqsh_key.json', JSON.stringify(keyData, null, 2));
    console.log('\n💾 Chiave salvata in: found_aqsh_key.json');
    console.log('🚀 Questa chiave può essere usata per sbloccare altri orologi!');
  }
}

/**
 * Funzione principale
 */
function main() {
  const decoder = new RealAQSHDecoder();
  const result = decoder.analyzeRealData();
  
  if (result) {
    console.log('\n🎯 PROSSIMI PASSI:');
    console.log('1. Usa la chiave trovata per sbloccare altri orologi');
    console.log('2. Testa su un orologio bloccato');
    console.log('3. Se funziona, applica a tutti gli orologi');
  } else {
    console.log('\n🔄 ALTERNATIVE:');
    console.log('1. Raccogli più campioni di dati AQSH+');
    console.log('2. Analizza pattern temporali');
    console.log('3. Considera migrazione hardware');
  }
}

// Esegui se chiamato direttamente
if (require.main === module) {
  main();
}

module.exports = RealAQSHDecoder;