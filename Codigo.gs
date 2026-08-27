/**
 * Configuração Global do Backend
 */
const SYSTEM_CONFIG = {
  get SPREADSHEET_ID() { return getSpreadsheetId(); },
  SHEETS: {
    GERENCIAMENTO: 'Gerenciamento_Respostas',
    PROVAS: 'Provas_Enade',
    REENVIOS: 'Reenvios'
  },
  STATUS: {
    NOVO: 'Novo',
    PRONTO_ANALISE: 'Pronto p/ Análise',
    EM_ANALISE: 'Em análise',
    PRONTO_REANALISE: 'Pronto p/ Reanálise',
    DEVOLVIDO: 'Devolvido para ajustes',
    APROVADO: 'Aprovado',
    REJEITADO: 'Rejeitado'
  }
};

function getSpreadsheet() {
  try {
    return SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(getSpreadsheetId());
  } catch (e) {
    return SpreadsheetApp.openById(getSpreadsheetId());
  }
}

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Painel de Curadoria - Módulo de Triagem')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createTemplateFromFile(filename).getRawContent();
}

function createResponse(success, data = null, message = '') {
  return { success, data, message };
}

/**
 * Helper para validar e priorizar a URL do vídeo
 */
function extrairUrlVideoValida(urlAtualizada, urlOriginal) {
  const strAtual = urlAtualizada ? String(urlAtualizada).trim() : '';
  const strOrig = urlOriginal ? String(urlOriginal).trim() : '';

  // Verifica se a URL atualizada é válida (inicia com protocolo http/https)
  if (strAtual !== '' && /^https?:\/\//i.test(strAtual)) {
    return strAtual;
  }
  
  // Fallback para a URL original
  if (strOrig !== '' && /^https?:\/\//i.test(strOrig)) {
    return strOrig;
  }

  // Caso o link não possua http/https mas não esteja vazio
  return strAtual || strOrig || '';
}

/**
 * Obtém os tickets filtrados segundo o esquema da aba Gerenciamento_Respostas
 */
function getTicketsTriagem(statusFiltro) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(SYSTEM_CONFIG.SHEETS.GERENCIAMENTO);
    if (!sheet) throw new Error(`Aba '${SYSTEM_CONFIG.SHEETS.GERENCIAMENTO}' não encontrada.`);

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return createResponse(true, []);

    const headers = data[0].map(h => String(h).trim());
    
    const map = {
      dataHora: headers.indexOf('Data/Hora'),
      ticket: headers.indexOf('Ticket'),
      idProva: headers.indexOf('ID_Prova'),
      questaoNum: headers.indexOf('Questao_Num'),
      tipo: headers.indexOf('Tipo'),
      nomeAluno: headers.indexOf('Nome Completo'),
      assunto: headers.indexOf('Assunto Principal'),
      urlOriginal: headers.indexOf('URL do Vídeo Original'),
      urlAtualizada: headers.indexOf('URL Atualizada'),
      urlOficial: headers.indexOf('URL do Vídeo Oficial'),
      preCuradoria: headers.indexOf('Pré-Curadoria'),
      status: headers.indexOf('Status'),
      motivo: headers.indexOf('Motivo'),
      responsavel: headers.indexOf('Responsável'),
      // verQuestao é calculado programaticamente; não lemos da planilha
      autorizacao: headers.indexOf('Autorização'),
      autorizacaoAtualizada: headers.indexOf('Autorização Atualizada')
    };

    const tickets = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rawStatus = row[map.status] ? String(row[map.status]).trim() : '';
      const currentStatus = rawStatus === '' ? SYSTEM_CONFIG.STATUS.NOVO : rawStatus;

      let incluir = false;
      if (statusFiltro === 'todos' || statusFiltro === 'ALL') {
        incluir = true;
      } else if (statusFiltro === 'em_analise') {
        incluir = currentStatus === SYSTEM_CONFIG.STATUS.EM_ANALISE;
      } else if (statusFiltro === 'pronto_analise') {
        incluir = currentStatus === SYSTEM_CONFIG.STATUS.PRONTO_ANALISE;
      } else if (statusFiltro === 'pronto_reanalise') {
        incluir = currentStatus === SYSTEM_CONFIG.STATUS.PRONTO_REANALISE;
      } else if (statusFiltro === 'devolvidos') {
        incluir = currentStatus === SYSTEM_CONFIG.STATUS.DEVOLVIDO;
      } else if (statusFiltro === 'aprovados') {
        incluir = currentStatus === SYSTEM_CONFIG.STATUS.APROVADO;
      } else if (statusFiltro === 'rejeitados') {
        incluir = currentStatus === SYSTEM_CONFIG.STATUS.REJEITADO;
      } else {
        // 'triagem' — padrão
        incluir = currentStatus === SYSTEM_CONFIG.STATUS.NOVO;
      }

      if (incluir) {
        const rawUrlAtualizada = map.urlAtualizada !== -1 ? row[map.urlAtualizada] : '';
        const rawUrlOriginal = map.urlOriginal !== -1 ? row[map.urlOriginal] : '';

        tickets.push({
          rowIndex: i + 1,
          idResposta: '',
          ticket: row[map.ticket] || `#TK-${i}`,
          idProva: row[map.idProva] || '',
          questaoNum: row[map.questaoNum] || '',
          tipo: row[map.tipo] || '',
          nomeAluno: row[map.nomeAluno] || 'Não informado',
          assunto: row[map.assunto] || '',
          videoUrl: extrairUrlVideoValida(rawUrlAtualizada, rawUrlOriginal),
          urlOficial: map.urlOficial !== -1 ? (row[map.urlOficial] || '') : '',
          preCuradoria: row[map.preCuradoria] || '',
          status: currentStatus,
          motivo: row[map.motivo] || '',
          responsavel: row[map.responsavel] || '',
          verQuestao: (function() {
            var preCur = row[map.preCuradoria] ? String(row[map.preCuradoria]) : '';
            var idP = row[map.idProva] ? String(row[map.idProva]).trim() : '';
            var qNum = row[map.questaoNum] ? String(row[map.questaoNum]).trim() : '';
            var tp = row[map.tipo] ? String(row[map.tipo]).trim() : '';
            var tipoCapit = tp.length > 0 ? tp.charAt(0).toUpperCase() + tp.slice(1).toLowerCase() : '';
            if (preCur.indexOf('\u2705') !== -1 && idP && qNum && tipoCapit) {
              return 'https://techsiprepare.github.io/#visualizar?prova=' + idP + '&questao=' + qNum + '-' + tipoCapit;
            }
            return '';
          })(),
          dataHora: map.dataHora !== -1 ? formatarDataExcel(row[map.dataHora]) : '',
          autorizacao: map.autorizacao !== -1 ? (row[map.autorizacao] || '') : '',
          autorizacaoAtualizada: map.autorizacaoAtualizada !== -1 ? (row[map.autorizacaoAtualizada] || '') : ''
        });
      }
    }

    return createResponse(true, tickets);
  } catch (error) {
    Logger.log("Erro em getTicketsTriagem: " + error.toString());
    return createResponse(false, null, error.message);
  }
}

function getProvasEnadeIds() {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(SYSTEM_CONFIG.SHEETS.PROVAS);
    if (!sheet) throw new Error(`Aba '${SYSTEM_CONFIG.SHEETS.PROVAS}' não encontrada.`);

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return createResponse(true, []);

    const ids = [];
    for (let i = 1; i < data.length; i++) {
      const idProva = data[i][0];
      if (idProva && String(idProva).trim() !== '') {
        ids.push(String(idProva).trim());
      }
    }

    return createResponse(true, [...new Set(ids)].sort());
  } catch (error) {
    Logger.log("Erro em getProvasEnadeIds: " + error.toString());
    return createResponse(false, null, error.message);
  }
}

/**
 * Salva o novo ID da Prova direto na linha informada.
 */
function salvarNovoIdProva(rowIndex, novoIdProva) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(SYSTEM_CONFIG.SHEETS.GERENCIAMENTO);
    if (!sheet) throw new Error(`Aba '${SYSTEM_CONFIG.SHEETS.GERENCIAMENTO}' não encontrada.`);

    // Descobre dinamicamente a coluna ID_Prova pelo cabeçalho
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const idxIdProva = headers.indexOf('ID_Prova');

    if (idxIdProva === -1) throw new Error('Coluna ID_Prova não encontrada.');

    // Grava diretamente na célula sem ler a tabela toda
    sheet.getRange(rowIndex, idxIdProva + 1).setValue(novoIdProva);
    return createResponse(true, null, 'ID da Prova atualizado com sucesso!');
  } catch (error) {
    Logger.log("Erro em salvarNovoIdProva: " + error.toString());
    return createResponse(false, null, error.message);
  }
}

/**
 * Altera o Status do Ticket diretamente na linha informada.
 */
function alterarStatusTicket(rowIndex, novoStatus) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(SYSTEM_CONFIG.SHEETS.GERENCIAMENTO);
    if (!sheet) throw new Error(`Aba '${SYSTEM_CONFIG.SHEETS.GERENCIAMENTO}' não encontrada.`);

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const idxStatus = headers.indexOf('Status');

    if (idxStatus === -1) throw new Error('Coluna Status não encontrada.');

    sheet.getRange(rowIndex, idxStatus + 1).setValue(novoStatus);
    return createResponse(true, null, `Status atualizado para "${novoStatus}"!`);
  } catch (error) {
    Logger.log("Erro em alterarStatusTicket: " + error.toString());
    return createResponse(false, null, error.message);
  }
}

/**
 * Atualiza os dados de análise do Ticket diretamente na linha informada.
 */
function atualizarDadosAnalise(rowIndex, novoStatus, responsavel, motivo) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(SYSTEM_CONFIG.SHEETS.GERENCIAMENTO);
    if (!sheet) throw new Error(`Aba '${SYSTEM_CONFIG.SHEETS.GERENCIAMENTO}' não encontrada.`);

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const idxStatus = headers.indexOf('Status');
    const idxResponsavel = headers.indexOf('Responsável');
    const idxMotivo = headers.indexOf('Motivo');

    if (novoStatus && idxStatus !== -1) {
      sheet.getRange(rowIndex, idxStatus + 1).setValue(novoStatus);
    }
    if (responsavel !== undefined && idxResponsavel !== -1) {
      sheet.getRange(rowIndex, idxResponsavel + 1).setValue(responsavel);
    }
    if (motivo !== undefined && idxMotivo !== -1) {
      sheet.getRange(rowIndex, idxMotivo + 1).setValue(motivo);
    }

    return createResponse(true, null, 'Ticket atualizado com sucesso!');
  } catch (error) {
    Logger.log("Erro em atualizarDadosAnalise: " + error.toString());
    return createResponse(false, null, error.message);
  }
}

/**
 * Salva a URL do Vídeo Oficial diretamente na linha informada.
 */
function salvarUrlVideoOficial(rowIndex, urlOficial) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(SYSTEM_CONFIG.SHEETS.GERENCIAMENTO);
    if (!sheet) throw new Error(`Aba '${SYSTEM_CONFIG.SHEETS.GERENCIAMENTO}' não encontrada.`);

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const idxUrlOficial = headers.indexOf('URL do Vídeo Oficial');

    if (idxUrlOficial === -1) throw new Error('Coluna "URL do Vídeo Oficial" não encontrada.');

    sheet.getRange(rowIndex, idxUrlOficial + 1).setValue(urlOficial);
    return createResponse(true, null, 'URL do Vídeo Oficial atualizada com sucesso!');
  } catch (error) {
    Logger.log("Erro em salvarUrlVideoOficial: " + error.toString());
    return createResponse(false, null, error.message);
  }
}

/**
 * Formata um objeto Date ou valor do Google Sheets em formato de data legível.
 */
function formatarDataExcel(valorData) {
  if (!valorData) return '';
  if (valorData instanceof Date) {
    return Utilities.formatDate(valorData, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
  }
  return String(valorData);
}

/**
 * Obtém a fila de tickets anteriores para a mesma questão (ID_Prova, Questao_Num, Tipo)
 * que possuem datas/timestamps estritamente inferiores ao ticket informado.
 */
function getFilaMesmaQuestao(idProva, questaoNum, tipo, rowIndexAtual) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(SYSTEM_CONFIG.SHEETS.GERENCIAMENTO);
    if (!sheet) throw new Error(`Aba '${SYSTEM_CONFIG.SHEETS.GERENCIAMENTO}' não encontrada.`);

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return createResponse(true, []);

    const headers = data[0].map(h => String(h).trim());

    const map = {
      dataHora: headers.indexOf('Data/Hora'),
      ticket: headers.indexOf('Ticket'),
      idProva: headers.indexOf('ID_Prova'),
      questaoNum: headers.indexOf('Questao_Num'),
      tipo: headers.indexOf('Tipo'),
      nomeAluno: headers.indexOf('Nome Completo'),
      assunto: headers.indexOf('Assunto Principal'),
      urlOriginal: headers.indexOf('URL do Vídeo Original'),
      urlAtualizada: headers.indexOf('URL Atualizada'),
      urlOficial: headers.indexOf('URL do Vídeo Oficial'),
      status: headers.indexOf('Status'),
      motivo: headers.indexOf('Motivo'),
      responsavel: headers.indexOf('Responsável')
    };

    if (map.dataHora === -1) throw new Error('Coluna "Data/Hora" não encontrada.');

    // Obter data/hora da linha atual
    const currentDataHoraVal = data[rowIndexAtual - 1][map.dataHora];
    if (!currentDataHoraVal) return createResponse(true, []);
    const currentTs = currentDataHoraVal instanceof Date ? currentDataHoraVal.getTime() : new Date(currentDataHoraVal).getTime();
    if (isNaN(currentTs)) return createResponse(true, []);

    const norm = str => String(str || '').trim().toUpperCase();
    const targetProva = norm(idProva);
    const targetQuestao = norm(questaoNum);
    const targetTipo = norm(tipo);

    const fila = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rIndex = i + 1;

      // Descarta o próprio ticket
      if (rIndex === Number(rowIndexAtual)) {
        continue;
      }

      const rIdProva = map.idProva !== -1 ? row[map.idProva] : '';
      const rQuestaoNum = map.questaoNum !== -1 ? row[map.questaoNum] : '';
      const rTipo = map.tipo !== -1 ? row[map.tipo] : '';

      // Verifica se é exatamente a mesma questão
      if (norm(rIdProva) === targetProva && norm(rQuestaoNum) === targetQuestao && norm(rTipo) === targetTipo) {
        const rowDataHora = row[map.dataHora];
        if (!rowDataHora) continue;
        const rowTs = rowDataHora instanceof Date ? rowDataHora.getTime() : new Date(rowDataHora).getTime();
        if (isNaN(rowTs)) continue;

        // Somente se possuir data inferior
        if (rowTs < currentTs) {
          const rawStatus = map.status !== -1 && row[map.status] ? String(row[map.status]).trim() : '';
          const currentStatus = rawStatus === '' ? SYSTEM_CONFIG.STATUS.NOVO : rawStatus;

          const rawUrlAtualizada = map.urlAtualizada !== -1 ? row[map.urlAtualizada] : '';
          const rawUrlOriginal = map.urlOriginal !== -1 ? row[map.urlOriginal] : '';

          fila.push({
            rowIndex: rIndex,
            ticket: row[map.ticket] || `#TK-${rIndex}`,
            idProva: rIdProva,
            questaoNum: rQuestaoNum,
            tipo: rTipo,
            nomeAluno: row[map.nomeAluno] || 'Não informado',
            assunto: row[map.assunto] || '',
            dataHora: formatarDataExcel(rowDataHora),
            numValue: rowTs,
            videoUrl: extrairUrlVideoValida(rawUrlAtualizada, rawUrlOriginal),
            urlOficial: map.urlOficial !== -1 ? (row[map.urlOficial] || '') : '',
            status: currentStatus,
            motivo: map.motivo !== -1 ? (row[map.motivo] || '') : '',
            responsavel: map.responsavel !== -1 ? (row[map.responsavel] || '') : ''
          });
        }
      }
    }

    // Ordena do mais antigo para o mais recente (ordem cronológica da fila)
    fila.sort((a, b) => a.numValue - b.numValue);

    return createResponse(true, fila);
  } catch (error) {
    Logger.log("Erro em getFilaMesmaQuestao: " + error.toString());
    return createResponse(false, null, error.message);
  }
}

/**
 * Obtém todos os vídeos (originais e reenvios) vinculados a um ticket.
 */
function getVideosTicket(ticketId, rowIndex) {
  try {
    const ss = getSpreadsheet();
    const sheetManagement = ss.getSheetByName(SYSTEM_CONFIG.SHEETS.GERENCIAMENTO);
    if (!sheetManagement) throw new Error('Aba de gerenciamento não encontrada.');

    // 1. Obter vídeo original do gerenciamento
    const headersManagement = sheetManagement.getRange(1, 1, 1, sheetManagement.getLastColumn()).getValues()[0];
    const idxOriginal = headersManagement.indexOf('URL do Vídeo Original');
    const idxDataHora = headersManagement.indexOf('Data/Hora');
    
    let originalUrl = '';
    let originalDataHora = '';
    let originalTs = 0;

    if (idxOriginal !== -1) {
      originalUrl = sheetManagement.getRange(rowIndex, idxOriginal + 1).getValue();
    }
    if (idxDataHora !== -1) {
      const dateVal = sheetManagement.getRange(rowIndex, idxDataHora + 1).getValue();
      originalDataHora = formatarDataExcel(dateVal);
      originalTs = dateVal instanceof Date ? dateVal.getTime() : new Date(dateVal).getTime();
    }

    const videos = [];
    if (originalUrl && /^https?:\/\//i.test(originalUrl)) {
      videos.push({
        tipo: 'Original',
        url: originalUrl,
        dataHora: originalDataHora || 'Sem data',
        ts: isNaN(originalTs) ? 0 : originalTs,
        descricao: ''
      });
    }

    // 2. Buscar reenvios na aba Reenvios
    const sheetReenvios = ss.getSheetByName(SYSTEM_CONFIG.SHEETS.REENVIOS);
    if (sheetReenvios) {
      const dataReenvios = sheetReenvios.getDataRange().getValues();
      if (dataReenvios.length > 1) {
        const headersReenvios = dataReenvios[0].map(h => String(h).trim());
        const mapReenvios = {
          dataHora: headersReenvios.indexOf('Carimbo de data/hora'),
          ticket: headersReenvios.indexOf('Ticket'),
          url: headersReenvios.indexOf('URL Atualizada'),
          descricao: headersReenvios.indexOf('Descrição')
        };

        const targetTicket = String(ticketId).trim().toUpperCase();

        for (let i = 1; i < dataReenvios.length; i++) {
          const row = dataReenvios[i];
          const ticketVal = mapReenvios.ticket !== -1 ? String(row[mapReenvios.ticket]).trim().toUpperCase() : '';
          
          if (ticketVal === targetTicket) {
            const urlVal = mapReenvios.url !== -1 ? String(row[mapReenvios.url]).trim() : '';
            if (urlVal && /^https?:\/\//i.test(urlVal)) {
              const dateVal = mapReenvios.dataHora !== -1 ? row[mapReenvios.dataHora] : '';
              const rowTs = dateVal instanceof Date ? dateVal.getTime() : new Date(dateVal).getTime();
              
              videos.push({
                tipo: 'Reenvio',
                url: urlVal,
                dataHora: formatarDataExcel(dateVal),
                ts: isNaN(rowTs) ? 0 : rowTs,
                descricao: mapReenvios.descricao !== -1 ? row[mapReenvios.descricao] : ''
              });
            }
          }
        }
      }
    }

    // Ordenar por data/hora (mais antigos primeiro)
    videos.sort((a, b) => a.ts - b.ts);

    return createResponse(true, videos);
  } catch (error) {
    Logger.log("Erro em getVideosTicket: " + error.toString());
    return createResponse(false, null, error.message);
  }
}

/**
 * Obtém todas as autorizações (original e reenvios) vinculadas a um ticket.
 */
function getAutorizacoesTicket(ticketId, rowIndex) {
  try {
    const ss = getSpreadsheet();
    const sheetManagement = ss.getSheetByName(SYSTEM_CONFIG.SHEETS.GERENCIAMENTO);
    if (!sheetManagement) throw new Error('Aba de gerenciamento não encontrada.');

    // 1. Obter autorização original do gerenciamento
    const headersManagement = sheetManagement.getRange(1, 1, 1, sheetManagement.getLastColumn()).getValues()[0];
    const idxAutorizacao = headersManagement.indexOf('Autorização');
    const idxDataHora = headersManagement.indexOf('Data/Hora');

    let originalUrl = '';
    let originalDataHora = '';
    let originalTs = 0;

    if (idxAutorizacao !== -1) {
      originalUrl = String(sheetManagement.getRange(rowIndex, idxAutorizacao + 1).getValue() || '').trim();
    }
    if (idxDataHora !== -1) {
      const dateVal = sheetManagement.getRange(rowIndex, idxDataHora + 1).getValue();
      originalDataHora = formatarDataExcel(dateVal);
      originalTs = dateVal instanceof Date ? dateVal.getTime() : new Date(dateVal).getTime();
    }

    const autorizacoes = [];
    if (originalUrl && /^https?:\/\//i.test(originalUrl)) {
      autorizacoes.push({
        tipo: 'Original',
        url: originalUrl,
        dataHora: originalDataHora || 'Sem data',
        ts: isNaN(originalTs) ? 0 : originalTs,
        descricao: ''
      });
    }

    // 2. Buscar autorizações atualizadas na aba Reenvios
    const sheetReenvios = ss.getSheetByName(SYSTEM_CONFIG.SHEETS.REENVIOS);
    if (sheetReenvios) {
      const dataReenvios = sheetReenvios.getDataRange().getValues();
      if (dataReenvios.length > 1) {
        const headersReenvios = dataReenvios[0].map(h => String(h).trim());
        const mapReenvios = {
          dataHora: headersReenvios.indexOf('Carimbo de data/hora'),
          ticket: headersReenvios.indexOf('Ticket'),
          autorizacao: headersReenvios.indexOf('Autorização Atualizada'),
          descricao: headersReenvios.indexOf('Descrição')
        };

        const targetTicket = String(ticketId).trim().toUpperCase();

        for (let i = 1; i < dataReenvios.length; i++) {
          const row = dataReenvios[i];
          const ticketVal = mapReenvios.ticket !== -1 ? String(row[mapReenvios.ticket]).trim().toUpperCase() : '';

          if (ticketVal === targetTicket) {
            const urlVal = mapReenvios.autorizacao !== -1 ? String(row[mapReenvios.autorizacao]).trim() : '';
            if (urlVal && /^https?:\/\//i.test(urlVal)) {
              const dateVal = mapReenvios.dataHora !== -1 ? row[mapReenvios.dataHora] : '';
              const rowTs = dateVal instanceof Date ? dateVal.getTime() : new Date(dateVal).getTime();

              autorizacoes.push({
                tipo: 'Reenvio',
                url: urlVal,
                dataHora: formatarDataExcel(dateVal),
                ts: isNaN(rowTs) ? 0 : rowTs,
                descricao: mapReenvios.descricao !== -1 ? row[mapReenvios.descricao] : ''
              });
            }
          }
        }
      }
    }

    // Ordenar por data/hora (mais antigos primeiro)
    autorizacoes.sort((a, b) => a.ts - b.ts);

    return createResponse(true, autorizacoes);
  } catch (error) {
    Logger.log("Erro em getAutorizacoesTicket: " + error.toString());
    return createResponse(false, null, error.message);
  }
}
