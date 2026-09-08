/**
 * Suíte de Testes Manuais do Backend (GAS) - MODO SEGURO
 * Selecione a função 'executarTodasAsValidacoes' no editor e clique em 'Executar'.
 */
function executarTodasAsValidacoes() {
  Logger.log("==================================================");
  Logger.log("🧪 INICIANDO SUÍTE DE TESTES COMPLETA DO BACKEND");
  Logger.log("==================================================");

  let passouEmTodos = true;

  passouEmTodos = testarClasseReenvio() && passouEmTodos;
  passouEmTodos = testarClasseResposta() && passouEmTodos;
  passouEmTodos = testarSpreadsheetRepositoryLeitura() && passouEmTodos;
  passouEmTodos = testarSpreadsheetRepositoryEscritaSegura() && passouEmTodos;
  passouEmTodos = testarFirebaseNotifier() && passouEmTodos;
  passouEmTodos = testarControllerEErros() && passouEmTodos;
  passouEmTodos = testarClasseProvaELeitura() && passouEmTodos;
  passouEmTodos = testarColunasIgnoradasEArrayFormula() && passouEmTodos;

  Logger.log("\n==================================================");
  if (passouEmTodos) {
    Logger.log("✅ RESULTADO FINAL: TODOS OS TESTES PASSARAM COM SUCESSO!");
  } else {
    Logger.log("❌ RESULTADO FINAL: ALGUNS TESTES FALHARAM. VERIFIQUE OS LOGS.");
  }
  Logger.log("==================================================");
}

// -----------------------------------------------------------------------------
// 1. TESTE UNITÁRIO: Classe Reenvio
// -----------------------------------------------------------------------------
function testarClasseReenvio() {
  Logger.log("\n[TESTE 1] Classe Reenvio...");
  try {
    const reenvio = new Reenvio({
      carimboDataHora: '2026-08-29 10:00:00',
      emailPessoal: 'pessoal@teste.com',
      emailInstitucional: 'inst@teste.com',
      ticket: 'TK-TESTE',
      urlAtualizada: 'http://video.com/1',
      autorizacaoAtualizada: 'Sim',
      descricao: 'Correção de áudio'
    });

    if (reenvio.ticket !== 'TK-TESTE' || reenvio.descricao !== 'Correção de áudio') {
      throw new Error("Campos não mapeados corretamente na classe Reenvio.");
    }

    Logger.log("  └ [OK] Instanciação e mapeamento de atributos validados.");
    return true;
  } catch (err) {
    Logger.log(`  └ [FALHA] ${err.message}`);
    return false;
  }
}

// -----------------------------------------------------------------------------
// 2. TESTE UNITÁRIO: Classe Resposta (Associação & toArray)
// -----------------------------------------------------------------------------
function testarClasseResposta() {
  Logger.log("\n[TESTE 2] Classe Resposta (Métodos e Associações)...");
  try {
    const resposta = new Resposta({
      rowIndex: 2,
      ticket: 'TK-TESTE',
      nomeCompleto: 'Aluno Teste',
      status: 'Pendente'
    });

    const reenvioValido = new Reenvio({ ticket: 'TK-TESTE', descricao: 'Reenvio Válido' });
    const reenvioInvalido = new Reenvio({ ticket: 'TK-OUTRO', descricao: 'Ticket Errado' });

    resposta.adicionarReenvio(reenvioValido);
    resposta.adicionarReenvio(reenvioInvalido);

    if (resposta.reenvios.length !== 1) {
      throw new Error(`Validação de ticket falhou. Esperado: 1 reenvio, Encontrado: ${resposta.reenvios.length}`);
    }

    const arr = resposta.toArray();
    if (!Array.isArray(arr) || arr.length !== 22 || arr[0] !== 'TK-TESTE') {
      throw new Error(`Método toArray() incorreto. Esperado 22 colunas, gerou: ${arr.length}`);
    }

    const respostaComLink = new Resposta({
      idProva: 'PRV-001',
      questaoNum: 1,
      tipo: 'discursiva'
    });
    if (respostaComLink.verQuestaoSite !== 'https://techsiprepare.github.io/#visualizar?prova=PRV-001&questao=1-Discursiva') {
      throw new Error(`Geração de verQuestaoSite incorreta: ${respostaComLink.verQuestaoSite}`);
    }

    Logger.log("  └ [OK] Regra de associação por ticket, conversão em Array(22) e geração de verQuestaoSite validadas.");
    return true;
  } catch (err) {
    Logger.log(`  └ [FALHA] ${err.message}`);
    return false;
  }
}

// -----------------------------------------------------------------------------
// 3. TESTE DE INTEGRAÇÃO: Leitura do Repository O(N+M)
// -----------------------------------------------------------------------------
function testarSpreadsheetRepositoryLeitura() {
  Logger.log("\n[TESTE 3] SpreadsheetRepository (Leitura O(N+M))...");
  try {
    const inicio = new Date().getTime();
    const repo = new SpreadsheetRepository();
    const respostas = repo.getRespostas();
    const tempo = new Date().getTime() - inicio;

    if (!Array.isArray(respostas)) {
      throw new Error("O retorno de getRespostas() deve ser um Array.");
    }

    Logger.log(`  └ [OK] Leitura realizada com sucesso (${respostas.length} registros em ${tempo}ms).`);
    return true;
  } catch (err) {
    Logger.log(`  └ [FALHA] ${err.message}`);
    return false;
  }
}

// -----------------------------------------------------------------------------
// 4. TESTE DE INTEGRAÇÃO: Escrita Segura (APENAS no ticket TK-TESTE)
// -----------------------------------------------------------------------------
function testarSpreadsheetRepositoryEscritaSegura() {
  Logger.log("\n[TESTE 4] SpreadsheetRepository (Escrita Segura em 'TK-TESTE')...");
  try {
    const repo = new SpreadsheetRepository();
    const respostas = repo.getRespostas();

    // BUSCA EXCLUSIVAMENTE O TICKET 'TK-TESTE'
    const itemTeste = respostas.find(r => r.ticket === 'TK-TESTE');

    if (!itemTeste) {
      Logger.log("  ⚠️ [PULADO] O registro com ticket 'TK-TESTE' não foi encontrado na planilha.");
      Logger.log("     Crie uma linha com o ticket 'TK-TESTE' na aba Gerenciamento_Respostas para testar a gravação.");
      return true;
    }

    Logger.log(`  └ Registro 'TK-TESTE' localizado na linha ${itemTeste.rowIndex}. Iniciando teste de gravação...`);

    const itemParaAtualizar = JSON.parse(JSON.stringify(itemTeste));
    const marcaTempo = `Teste Automatizado: ${new Date().toLocaleTimeString('pt-BR')}`;

    // Altera apenas o motivo e salva (sem restaurar o valor anterior)
    itemParaAtualizar.motivo = marcaTempo;
    repo.salvarResposta(itemParaAtualizar);

    // Validação re-lendo a planilha
    const respostasRevisadas = repo.getRespostas();
    const itemPersistido = respostasRevisadas.find(r => r.ticket === 'TK-TESTE');

    if (!itemPersistido || itemPersistido.motivo !== marcaTempo) {
      throw new Error("Falha de persistência: O dado gravado na linha do TK-TESTE não coincidiu.");
    }

    Logger.log(`  └ [OK] Escrita realizada e confirmada na linha 'TK-TESTE' (Motivo atual: "${marcaTempo}").`);
    return true;
  } catch (err) {
    Logger.log(`  └ [FALHA] ${err.message}`);
    return false;
  }
}

// -----------------------------------------------------------------------------
// 5. TESTE DE INTEGRAÇÃO: Firebase Notifier (Com Leitura de Confirmação)
// -----------------------------------------------------------------------------
function testarFirebaseNotifier() {
  Logger.log("\n[TESTE 5] Firebase Notifier (Criação e Leitura no Realtime Database)...");
  try {
    const props = PropertiesService.getScriptProperties();
    const dbUrl = props.getProperty('FIREBASE_DB_URL');
    const secret = props.getProperty('FIREBASE_SECRET');

    if (!dbUrl || !secret) {
      Logger.log("  ⚠️ [PULADO] Propriedades 'FIREBASE_DB_URL' ou 'FIREBASE_SECRET' não configuradas.");
      return true;
    }

    // 1. Monta os argumentos conforme a nova assinatura: notificar(resposta, sessionId, status)
    const notifier = new FirebaseNotifier();
    const respostaFake = { ticket: 'TK-TESTE-FIREBASE' };
    const sessionIdFake = 'SESSION-TESTE-001';
    const statusFake = 'sucesso';

    Logger.log("  └ Enviando evento para o Realtime Database...");
    notifier.notificar(respostaFake, sessionIdFake, statusFake);

    // 2. Faz o GET de leitura no mesmo nó para confirmar que o nó realmente existe lá
    const urlConsulta = `${dbUrl}/ultimo_evento.json?auth=${secret}`;
    const response = UrlFetchApp.fetch(urlConsulta, { method: 'get', muteHttpExceptions: true });

    const statusCode = response.getResponseCode();
    if (statusCode !== 200) {
      throw new Error(`Erro de autenticação ou conexão (${statusCode}): ${response.getContentText()}`);
    }

    const payloadRecebido = JSON.parse(response.getContentText());

    // 3. Valida o payload na nova estrutura plana: { ticket, sessionId, status, timestamp }
    if (!payloadRecebido || payloadRecebido.ticket !== 'TK-TESTE-FIREBASE') {
      throw new Error("O nó '/ultimo_evento' não contém os dados esperados após o envio.");
    }
    if (payloadRecebido.sessionId !== sessionIdFake) {
      throw new Error(`Campo 'sessionId' incorreto. Esperado: '${sessionIdFake}', Recebido: '${payloadRecebido.sessionId}'`);
    }
    if (payloadRecebido.status !== statusFake) {
      throw new Error(`Campo 'status' incorreto. Esperado: '${statusFake}', Recebido: '${payloadRecebido.status}'`);
    }
    if (typeof payloadRecebido.timestamp !== 'number') {
      throw new Error("Campo 'timestamp' ausente ou com tipo inválido no payload recebido.");
    }

    Logger.log("  └ [OK] Nó '/ultimo_evento' foi gravado e lido no Realtime Database!");
    Logger.log(`    ↳ Ticket: ${payloadRecebido.ticket}`);
    Logger.log(`    ↳ SessionId: ${payloadRecebido.sessionId}`);
    Logger.log(`    ↳ Status: ${payloadRecebido.status}`);
    Logger.log(`    ↳ Timestamp: ${new Date(payloadRecebido.timestamp).toLocaleString('pt-BR')}`);

    return true;
  } catch (err) {
    Logger.log(`  └ [FALHA] ${err.message}`);
    return false;
  }
}

// -----------------------------------------------------------------------------
// 6. TESTE DE CONTROLLER E TRATAMENTO DE ERROS
// -----------------------------------------------------------------------------
function testarControllerEErros() {
  Logger.log("\n[TESTE 6] Controller & Tratamento de Erros...");
  try {
    const repo = new SpreadsheetRepository();

    let disparouErroEsperado = false;
    try {
      repo.salvarResposta({ ticket: 'TK-TESTE' }); // Sem rowIndex
    } catch (e) {
      disparouErroEsperado = true;
    }

    if (!disparouErroEsperado) {
      throw new Error("O repositório permitiu salvar um objeto sem 'rowIndex'.");
    }

    const dadosController = carregarDadosIniciais();
    if (!Array.isArray(dadosController)) {
      throw new Error("Função de controller 'carregarDadosIniciais()' retornou valor inválido.");
    }

    Logger.log("  └ [OK] Validação de 'rowIndex' obrigatório e entrypoints do Controller validados.");
    return true;
  } catch (err) {
    Logger.log(`  └ [FALHA] ${err.message}`);
    return false;
  }
}

// -----------------------------------------------------------------------------
// 7. TESTE UNITÁRIO E INTEGRAÇÃO: Classe Questao, Prova & Repository getProvas
// -----------------------------------------------------------------------------
function testarClasseProvaELeitura() {
  Logger.log("\n[TESTE 7] Classe Questao, Prova e getProvas() O(N+M)...");
  try {
    const questaoValida = new Questao({
      idProva: 'PRV-001',
      questaoNum: 1,
      tipo: 'Objetiva',
      paginaPdf: 3,
      bloquear: 'Não',
      totalTentativas: 0
    });

    if (questaoValida.idProva !== 'PRV-001' || questaoValida.tipo !== 'Objetiva') {
      throw new Error("Mapeamento de atributos na classe Questao falhou.");
    }

    const prova = new Prova({
      idProva: 'PRV-001',
      ano: 2023,
      areaProva: 'Engenharia',
      modalidade: 'Presencial',
      numeroCaderno: 1,
      linkProva: 'http://prova.com'
    });

    if (prova.idProva !== 'PRV-001' || prova.areaProva !== 'Engenharia') {
      throw new Error("Mapeamento de atributos na classe Prova falhou.");
    }

    const questaoInvalida = new Questao({ idProva: 'PRV-OUTRA', questaoNum: 2 });
    prova.adicionarQuestao(questaoValida);
    prova.adicionarQuestao(questaoInvalida);

    if (prova.questoes.length !== 1) {
      throw new Error(`Associação de Questão a Prova por idProva falhou. Esperado: 1, Encontrado: ${prova.questoes.length}`);
    }

    const repo = new SpreadsheetRepository();
    const provas = repo.getProvas();
    if (!Array.isArray(provas)) {
      throw new Error("O retorno de getProvas() deve ser um Array.");
    }

    Logger.log(`  └ [OK] Instanciação de Questao/Prova e leitura de Provas_Enade com questões O(N+M) validadas (${provas.length} provas).`);
    return true;
  } catch (err) {
    Logger.log(`  └ [FALHA] ${err.message}`);
    return false;
  }
}

// -----------------------------------------------------------------------------
// 8. TESTE DE INTEGRAÇÃO: Validação de ArrayFormula e Fórmulas vs colunasIgnoradas
// -----------------------------------------------------------------------------
function testarColunasIgnoradasEArrayFormula() {
  Logger.log("\n[TESTE 8] Validação de Colunas Ignoradas (ArrayFormula/Fórmulas vs colunasIgnoradas em salvarResposta)...");
  try {
    const repo = new SpreadsheetRepository();
    const sheet = repo.getSpreadsheet().getSheetByName('Gerenciamento_Respostas');
    if (!sheet) {
      throw new Error("Aba 'Gerenciamento_Respostas' não encontrada na planilha.");
    }

    const lastCol = sheet.getLastColumn();
    if (lastCol === 0) {
      throw new Error("A aba 'Gerenciamento_Respostas' está vazia.");
    }

    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const formulasLinha1 = sheet.getRange(1, 1, 1, lastCol).getFormulas()[0];
    const maxLinhasParaVerificar = Math.min(sheet.getLastRow(), 5);
    const formulasLinha2 = maxLinhasParaVerificar >= 2
      ? sheet.getRange(2, 1, 1, lastCol).getFormulas()[0]
      : [];

    // Obtém dinamicamente a lista de colunas ignoradas da classe SpreadsheetRepository
    const colunasIgnoradas = SpreadsheetRepository.COLUNAS_IGNORADAS;
    const colunasComFormulaNaoIgnoradas = [];
    const colunasComFormulaIgnoradas = [];

    headers.forEach((headerRaw, index) => {
      const header = String(headerRaw || '').trim();
      const colNum = index + 1;
      const f1 = formulasLinha1[index] || '';
      const f2 = formulasLinha2[index] || '';

      const temFormula = f1.startsWith('=') || f2.startsWith('=') ||
        f1.toUpperCase().includes('ARRAYFORMULA') ||
        f2.toUpperCase().includes('ARRAYFORMULA');

      if (temFormula) {
        const estaIgnorada = colunasIgnoradas.includes(header);
        const formulaTexto = f1 || f2;
        const info = `Coluna ${colNum} ("${header}") [Fórmula: ${formulaTexto}]`;

        if (estaIgnorada) {
          colunasComFormulaIgnoradas.push(info);
        } else {
          colunasComFormulaNaoIgnoradas.push(info);
        }
      }
    });

    if (colunasComFormulaIgnoradas.length > 0) {
      Logger.log("  └ Colunas com fórmula devidamente ignoradas:");
      colunasComFormulaIgnoradas.forEach(c => Logger.log(`     ✓ ${c}`));
    }

    if (colunasComFormulaNaoIgnoradas.length > 0) {
      throw new Error(
        `Existem colunas com ArrayFormula/Fórmula que NÃO estão na constante 'colunasIgnoradas':\n` +
        colunasComFormulaNaoIgnoradas.map(c => `     ❌ ${c}`).join('\n') +
        `\n  💡 Solução: Adicione esses cabeçalhos em 'colunasIgnoradas' na função salvarResposta().`
      );
    }

    Logger.log("  └ [OK] Nenhuma coluna com ArrayFormula ou fórmula desprotegida foi encontrada.");
    return true;
  } catch (err) {
    Logger.log(`  └ [FALHA] ${err.message}`);
    return false;
  }
}