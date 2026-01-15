#!/bin/bash
# Script per avviare il tunnel SSH al database VPS con autossh
# Riconnessione automatica in caso di disconnessione

TUNNEL_PORT=5433
VPS_HOST="91.99.141.225"
SSH_KEY="/Users/fabio/.ssh/id_pgadmin"

# Controlla se il tunnel è già attivo
if lsof -i :$TUNNEL_PORT >/dev/null 2>&1; then
    echo "✅ Tunnel SSH già attivo sulla porta $TUNNEL_PORT"
    exit 0
fi

# Avvia il tunnel con autossh (riconnessione automatica)
echo "🔄 Avvio tunnel autossh verso $VPS_HOST..."
autossh -M 0 -f \
    -i "$SSH_KEY" \
    -L $TUNNEL_PORT:localhost:5432 \
    -N \
    -o "ServerAliveInterval=30" \
    -o "ServerAliveCountMax=3" \
    -o "ExitOnForwardFailure=yes" \
    root@$VPS_HOST

if [ $? -eq 0 ]; then
    echo "✅ Tunnel autossh attivo!"
    echo "   Database accessibile su localhost:$TUNNEL_PORT"
    echo "   Riconnessione automatica abilitata"
else
    echo "❌ Errore nell'avvio del tunnel"
    exit 1
fi
