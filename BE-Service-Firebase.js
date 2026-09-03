class FirebaseNotifier {
  constructor() {
    const props = PropertiesService.getScriptProperties();
    this.dbUrl = props.getProperty('FIREBASE_DB_URL');
    this.secret = props.getProperty('FIREBASE_SECRET');
  }

  notificar(resposta, sessionId) {
    if (!this.dbUrl) return;

    const url = `${this.dbUrl}/ultimo_evento.json?auth=${this.secret}`;
    const payload = JSON.stringify({
      dados: resposta,
      sessionId: sessionId,
      timestamp: Date.now()
    });

    UrlFetchApp.fetch(url, {
      method: 'put',
      contentType: 'application/json',
      payload: payload,
      muteHttpExceptions: true
    });
  }
}