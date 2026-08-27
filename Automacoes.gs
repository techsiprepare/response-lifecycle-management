/**
 * Automacoes.gs — Módulo de automação de e-mails para o Painel de Curadoria.
 * Adaptado para ser invocado via google.script.run com rowIndex explícito,
 * sem dependência de linha/aba ativa na planilha.
 */

const AUTOMACOES_CONFIG = {
  SHEETS: {
    MANAGEMENT: 'Gerenciamento_Respostas'
  },
  URLS: {
    get FORM_REENVIO() { return getFormReenvioUrl(); },
    BASE_SITE: 'https://techsiprepare.github.io/#visualizar'
  },
  MODOS: {
    ALUNO: 'ALUNO',
    PROFESSOR: 'PROFESSOR'
  },
  ESCOLHAS: {
    ATUALIZADA: 'ATUALIZADA',
    ORIGINAL: 'ORIGINAL'
  }
};

// ============================================================================
// Funções Auxiliares Privadas
// ============================================================================

function _automacoes_ehUrlValida(url) {
  return typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'));
}

function _automacoes_normalizarTexto(valor) {
  return valor ? valor.toString().trim().toLowerCase() : '';
}

function _automacoes_existeRascunhoPendente(ticket) {
  const rascunhos = GmailApp.getDrafts();
  for (let i = 0; i < rascunhos.length; i++) {
    const mensagem = rascunhos[i].getMessage();
    if (mensagem.getSubject().includes(ticket) || mensagem.getPlainBody().includes(ticket)) {
      return true;
    }
  }
  return false;
}

function _automacoes_obterTemplateCorpoEmailHtml(dados) {
  const instrucoesProfessorHTML = dados.modo === AUTOMACOES_CONFIG.MODOS.PROFESSOR
    ? '<div style="background-color: #e8f4f8; padding: 12px; border: 1px solid #b6e0fe; margin-bottom: 15px;"><p style="margin: 0 0 8px 0; font-size: 0.95em;"><strong>Aluno,</strong> espere o professor corrigir e reenviar o barema completo aqui por este e-mail.</p><p style="margin: 0; font-size: 0.95em;"><strong>Professor,</strong> segue informações da resposta a ser corrigida, preencha o barema e dê as suas considerações.<br>Ao terminar, reenvie-o preenchido.</p></div>'
    : '';

  return '<div style="font-family: Arial, sans-serif; color: #333; max-width: 700px; margin: 0 auto; line-height: 1.5;">'
    + '<h2 style="color: #000000; border-bottom: 2px solid #356854; padding-bottom: 5px;">TechSI Prepare - Resolução de Questões do ENADE</h2>'
    + instrucoesProfessorHTML
    + '<div style="background-color: #f8f9fa; padding: 14px; margin-bottom: 15px; border-left: 4px solid #356854; border-top: 1px solid #ddd; border-right: 1px solid #ddd; border-bottom: 1px solid #ddd;">'
    + '<p style="margin: 4px 0;"><strong>Aluno:</strong> ' + dados.nomeAluno + '</p>'
    + '<p style="margin: 4px 0;"><strong>Ticket da Resposta:</strong> <code style="background: #e0e0e0; padding: 2px 6px;">' + dados.ticket + '</code></p>'
    + '<p style="margin: 4px 0;"><strong>Avaliador / Responsável:</strong> ' + dados.avaliador + '</p>'
    + '<p style="margin: 4px 0;"><strong>Data da Solicitação/Correção:</strong> ' + dados.dataAtual + '</p>'
    + '<p style="margin: 4px 0;"><strong>Questão:</strong> Prova ' + dados.idProva + ' | Qst ' + dados.questaoNum + ' (' + dados.tipoQuestao + ')</p>'
    + '<p style="margin: 4px 0;"><strong>Link do Enunciado:</strong> ' + dados.linkQuestaoHTML + '</p>'
    + '<p style="margin: 4px 0;"><strong>Link do Vídeo Submetido:</strong> ' + dados.linkVideoHTML + '</p>'
    + '</div>'
    + '<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; border-color: #ddd;"><thead><tr style="background-color: #356854; color: white;"><th style="width: 35%;">Critério Exigido</th><th style="width: 15%; text-align: center;">Atende</th><th style="width: 15%; text-align: center;">Não Atende</th><th style="width: 35%;">Observações</th></tr></thead><tbody>'
    + '<tr style="background-color: #f2f2f2;"><td colspan="4"><strong>1. QUALIDADE TÉCNICA &amp; FORMATO</strong></td></tr>'
    + '<tr><td>• Imagem e som em boa qualidade/resolução (mínimo 1080p, áudio limpo)</td><td style="text-align: center;">&nbsp;</td><td style="text-align: center;">&nbsp;</td><td></td></tr>'
    + '<tr><td>• Presença da imagem do apresentador (Picture-in-Picture / Webcam)</td><td style="text-align: center;">&nbsp;</td><td style="text-align: center;">&nbsp;</td><td></td></tr>'
    + '<tr><td>• Duração adequada do vídeo (3–15m Objetiva / 5–15m Discursiva)</td><td style="text-align: center;">&nbsp;</td><td style="text-align: center;">&nbsp;</td><td></td></tr>'
    + '<tr><td>• Foco único (exatamente 1 questão resolvida por arquivo)</td><td style="text-align: center;">&nbsp;</td><td style="text-align: center;">&nbsp;</td><td></td></tr>'
    + '<tr><td>• Enviou o vídeo corretamente utilizando um link do Google Drive, assim como especificado nas orientações.</td><td style="text-align: center;">&nbsp;</td><td style="text-align: center;">&nbsp;</td><td></td></tr>'
    + '<tr style="background-color: #f2f2f2;"><td colspan="4"><strong>2. DIDÁTICA E CONTEÚDO</strong></td></tr>'
    + '<tr><td>• Demonstração detalhada do raciocínio e dedução da resposta (passo a passo)</td><td style="text-align: center;">&nbsp;</td><td style="text-align: center;">&nbsp;</td><td></td></tr>'
    + '<tr><td>• Evita apenas apontar/revelar a resposta final sem a devida explicação</td><td style="text-align: center;">&nbsp;</td><td style="text-align: center;">&nbsp;</td><td></td></tr>'
    + '<tr><td>• Contextualização correta dos conceitos teóricos (sem misturar estruturas)</td><td style="text-align: center;">&nbsp;</td><td style="text-align: center;">&nbsp;</td><td></td></tr>'
    + '<tr style="background-color: #f2f2f2;"><td colspan="4"><strong>3. RECURSOS VISUAIS</strong></td></tr>'
    + '<tr><td>• Uso de recursos visuais dinâmicos (desenhos, esquemas ou diagramas)</td><td style="text-align: center;">&nbsp;</td><td style="text-align: center;">&nbsp;</td><td></td></tr>'
    + '<tr><td>• Ilustração visual clara da estrutura envolvida para facilitar a compreensão</td><td style="text-align: center;">&nbsp;</td><td style="text-align: center;">&nbsp;</td><td></td></tr>'
    + '<tr style="background-color: #f2f2f2;"><td colspan="4"><strong>4. FIDELIDADE AO ENUNCIADO</strong></td></tr>'
    + '<tr><td>• Utilização estrita da linguagem de programação exigida pelo exercício</td><td style="text-align: center;">&nbsp;</td><td style="text-align: center;">&nbsp;</td><td></td></tr>'
    + '<tr><td>• Indicação correta da resposta do exercício.</td><td style="text-align: center;">&nbsp;</td><td style="text-align: center;">&nbsp;</td><td></td></tr>'
    + '<tr style="background-color: #f2f2f2;"><td colspan="4"><strong>5. CONFORMIDADE</strong></td></tr>'
    + '<tr><td>• Enviou corretamente o Formulário de Autorização de Uso de Imagem e Voz</td><td style="text-align: center;">&nbsp;</td><td style="text-align: center;">&nbsp;</td><td></td></tr>'
    + '</tbody></table>'
    + '<div style="margin-top: 20px; padding: 10px; border: 1px solid #ccc;"><p style="margin: 0 0 5px 0;"><strong>Observações Gerais:</strong></p><p style="color: #666; font-style: italic;">[ Insira aqui os comentários e orientações para o aluno ]</p></div>'
    + '<div style="margin-top: 15px; padding: 12px; background-color: #fff3cd; border: 1px solid #ffe0b2;"><p style="margin: 0; font-weight: bold; color: #856404;">Situação Parecer Final:</p><p style="margin: 5px 0 0 0;">( &nbsp; ) Aprovado &nbsp;&nbsp;&nbsp;&nbsp; ( &nbsp; ) Devolvido para ajustes</p></div>'
    + '<div style="margin-top: 20px; padding: 14px; background-color: #f8f9fa; border-left: 4px solid #356854; border-top: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0; border-radius: 4px;"><p style="margin: 0 0 10px 0; font-size: 0.95em; color: #333; line-height: 1.4;"><strong>Atenção:</strong> Se a sua resposta foi devolvida para ajustes, acesse o link abaixo para enviar a versão atualizada do seu vídeo:</p><a href="' + AUTOMACOES_CONFIG.URLS.FORM_REENVIO + '" target="_blank" style="display: inline-block; padding: 8px 14px; background-color: #356854; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 0.9em; border-radius: 4px;">Formulário de Reenvio de Vídeo</a></div>'
    + '</div>';
}

// ============================================================================
// Funções Públicas — Chamadas via google.script.run
// ============================================================================

/**
 * Retorna a disponibilidade das URLs do ticket para o frontend exibir o modal de escolha.
 * @param {number} rowIndex - Índice da linha na planilha (1-based).
 */
function obterStatusUrlsTicket(rowIndex) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(getSpreadsheetId());
    const sheet = ss.getSheetByName(AUTOMACOES_CONFIG.SHEETS.MANAGEMENT);
    if (!sheet) throw new Error('Aba de gerenciamento não encontrada.');

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const idxUrlOriginal   = headers.indexOf('URL do Vídeo Original');
    const idxUrlAtualizada = headers.indexOf('URL Atualizada');

    const urlOriginal   = idxUrlOriginal   !== -1 ? (sheet.getRange(rowIndex, idxUrlOriginal + 1).getValue()   || '').toString().trim() : '';
    const urlAtualizada = idxUrlAtualizada !== -1 ? (sheet.getRange(rowIndex, idxUrlAtualizada + 1).getValue() || '').toString().trim() : '';

    return {
      success: true,
      data: {
        temUrlAtualizada: _automacoes_ehUrlValida(urlAtualizada),
        temUrlOriginal:   _automacoes_ehUrlValida(urlOriginal),
        urlAtualizada:    urlAtualizada,
        urlOriginal:      urlOriginal
      }
    };
  } catch (error) {
    Logger.log('Erro em obterStatusUrlsTicket: ' + error.toString());
    return { success: false, message: error.message };
  }
}

/**
 * Gera o rascunho de e-mail no Gmail com base na escolha de URL feita pelo usuário.
 * @param {string} modo - 'ALUNO' ou 'PROFESSOR'
 * @param {string} emailProfessor - E-mail do professor (usado quando modo = 'PROFESSOR')
 * @param {string} tipoEscolha - 'ATUALIZADA' ou 'ORIGINAL'
 * @param {number} rowIndex - Índice da linha na planilha (1-based).
 */
function processarEscolhaUrl(modo, emailProfessor, tipoEscolha, rowIndex) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(getSpreadsheetId());
    const sheet = ss.getSheetByName(AUTOMACOES_CONFIG.SHEETS.MANAGEMENT);
    if (!sheet) throw new Error('Aba de gerenciamento não encontrada.');

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const idx = function(nome) { return headers.indexOf(nome); };
    const rowData = sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];

    const ticket      = rowData[idx('Ticket')]        || '';
    const idProva     = rowData[idx('ID_Prova')]      || '';
    const questaoNum  = rowData[idx('Questao_Num')]   || '';
    const tipoQuestao = rowData[idx('Tipo')]          || '';
    const nomeAluno   = rowData[idx('Nome Completo')] || 'Não informado';
    const avaliador   = rowData[idx('Responsável')]   || Session.getActiveUser().getEmail();

    const urlVideoOriginal   = idx('URL do Vídeo Original') !== -1 ? (rowData[idx('URL do Vídeo Original')] || '').toString().trim() : '';
    const urlVideoAtualizada = idx('URL Atualizada')         !== -1 ? (rowData[idx('URL Atualizada')]        || '').toString().trim() : '';

    if (!ticket) {
      return { success: false, message: 'A linha não possui Ticket preenchido.' };
    }

    const emailPessoal       = idx('Endereço de e-mail')   !== -1 ? (rowData[idx('Endereço de e-mail')]   || '').toString().trim() : '';
    const emailInstitucional = idx('Email Institucional') !== -1 ? (rowData[idx('Email Institucional')] || '').toString().trim() : '';

    if (!emailPessoal && !emailInstitucional) {
      return { success: false, message: 'E-mails (pessoal e institucional) não encontrados na linha ' + rowIndex + '.' };
    }

    const ehAtualizada  = tipoEscolha === AUTOMACOES_CONFIG.ESCOLHAS.ATUALIZADA;
    const urlVideoFinal = ehAtualizada ? urlVideoAtualizada : urlVideoOriginal;
    const rotuloUrl     = ehAtualizada ? 'URL Atualizada (Reenvio)' : 'URL Original';

    const linkVideoHTML = _automacoes_ehUrlValida(urlVideoFinal)
      ? '<a href="' + urlVideoFinal + '" target="_blank" style="color: #356854; font-weight: bold;">Assistir Vídeo Submetido</a> <span style="font-size: 0.85em; color: #666;">(' + rotuloUrl + ')</span>'
      : '<span style="color: red; font-weight: bold;">[Link do Vídeo Não Encontrado ou Inválido - Selecionado: ' + rotuloUrl + ']</span>';

    const linkQuestaoSite = AUTOMACOES_CONFIG.URLS.BASE_SITE + '?prova=' + idProva + '&questao=' + questaoNum + '-' + tipoQuestao;
    const linkQuestaoHTML = '<a href="' + linkQuestaoSite + '" target="_blank" style="color: #356854; font-weight: bold;">Ver Enunciado da Questão no Site</a>';

    if (_automacoes_existeRascunhoPendente(ticket)) {
      return { success: false, message: 'Já existe um rascunho em andamento para o Ticket: ' + ticket + '. Finalize-o ou exclua-o no Gmail.' };
    }

    const emailsAlunoConcatenados = [emailInstitucional, emailPessoal]
      .filter(function(email, index, self) { return email && self.indexOf(email) === index; })
      .join(', ');

    var emailPrincipal = '';
    var emailCC = '';

    if (modo === AUTOMACOES_CONFIG.MODOS.PROFESSOR) {
      emailPrincipal = emailProfessor || avaliador;
      emailCC = emailsAlunoConcatenados;
    } else {
      emailPrincipal = emailInstitucional || emailPessoal;
      emailCC = (emailInstitucional && emailPessoal && emailInstitucional !== emailPessoal)
        ? emailPessoal : '';
    }

    const dataAtual = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy');
    const assunto   = '[TechSI Prepare] Espelho de Correção - Prova ' + idProva + ' (Questão ' + questaoNum + ') [' + ticket + ']';

    const corpoHTML = _automacoes_obterTemplateCorpoEmailHtml({
      modo:            modo,
      nomeAluno:       nomeAluno,
      ticket:          ticket,
      avaliador:       avaliador,
      dataAtual:       dataAtual,
      idProva:         idProva,
      questaoNum:      questaoNum,
      tipoQuestao:     tipoQuestao,
      linkQuestaoHTML: linkQuestaoHTML,
      linkVideoHTML:   linkVideoHTML
    });

    const opcoesEnvio = { htmlBody: corpoHTML };
    if (emailCC) opcoesEnvio.cc = emailCC;

    const threads = GmailApp.search('"' + ticket + '"');
    var ehEncadeado = false;

    if (threads.length > 0) {
      threads[0].createDraftReplyAll('', opcoesEnvio);
      ehEncadeado = true;
    } else {
      GmailApp.createDraft(emailPrincipal, assunto, '', opcoesEnvio);
    }

    return {
      success: true,
      data: {
        mensagem: ehEncadeado ? 'Rascunho Encadeado Criado!' : 'Novo Rascunho Criado!',
        modo:     modo,
        para:     emailPrincipal,
        cc:       emailCC,
        ticket:   ticket
      }
    };
  } catch (error) {
    Logger.log('Erro em processarEscolhaUrl: ' + error.toString());
    return { success: false, message: error.message };
  }
}
