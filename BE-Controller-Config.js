function obterPropriedadeScript(chave, valorPadrao = '') {
  const props = PropertiesService.getScriptProperties();
  const valor = props.getProperty(chave);
  return valor !== null ? valor : valorPadrao;
}

function obterSpreadsheetId() {
  return obterPropriedadeScript('SPREADSHEET_ID');
}

function obterFirebaseDbUrl() {
  return obterPropriedadeScript('FIREBASE_DB_URL');
}

function obterFirebaseSecret() {
  return obterPropriedadeScript('FIREBASE_SECRET');
}

function obterConfiguracaoFirebase() {
  return {
    dbUrl: obterFirebaseDbUrl(),
    secret: obterFirebaseSecret()
  };
}

function obterConfiguracaoPublicaFirebase() {
  return {
    dbUrl: obterFirebaseDbUrl()
  };
}

function obterUrlFormReenvio() {
  return obterPropriedadeScript('FORM_REENVIO_URL') || '';
}

function obterUrlRepositorio() {
  return obterPropriedadeScript('URL_REPOSITORIO') || '';
}