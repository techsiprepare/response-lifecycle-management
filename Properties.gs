/**
 * Properties.gs — Centraliza o acesso às Script Properties do projeto.
 *
 *   NUNCA coloque valores reais aqui. Configure as propriedades pelo menu:
 *   Extensions > Apps Script > Project Settings > Script Properties
 *   (ou execute a função setupScriptProperties() em env.example.gs uma única vez)
 *
 * Propriedades esperadas:
 *   SPREADSHEET_ID     — ID da planilha principal do projeto
 *   FORM_REENVIO_URL   — URL do formulário de reenvio de vídeo
 */

/**
 * Retorna o valor de uma Script Property pelo nome.
 * Lança um erro descritivo se a propriedade não estiver configurada.
 * @param {string} key
 * @returns {string}
 */
function getProperty(key) {
  const value = PropertiesService.getScriptProperties().getProperty(key);
  if (!value) {
    throw new Error(
      `Script Property "${key}" não configurada. ` +
      'Consulte env.example.gs para instruções de setup.'
    );
  }
  return value;
}

/**
 * Atalhos tipados para cada propriedade do projeto.
 */
function getSpreadsheetId() {
  return getProperty('SPREADSHEET_ID');
}

function getFormReenvioUrl() {
  return getProperty('FORM_REENVIO_URL');
}
