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
    if (!Array.isArray(arr) || arr.length !== 21 || arr[0] !== 'TK-TESTE') {
      throw new Error(`Método toArray() incorreto. Esperado 21 colunas, gerou: ${arr.length}`);
    }

    Logger.log("  └ [OK] Regra de associação por ticket e conversão em Array(21) validadas.");
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

    // 1. Cria um objeto de teste e dispara a notificação via classe oficial
    const notifier = new FirebaseNotifier();
    const dadosEnvio = {
      ticket: 'TK-TESTE-FIREBASE',
      status: 'Testando Realtime DB',
      motivo: `Criado em: ${new Date().toLocaleTimeString('pt-BR')}`
    };

    Logger.log("  └ Enviando evento para o Realtime Database...");
    notifier.notificar(dadosEnvio);

    // 2. Faz o GET de leitura no mesmo nó para confirmar que o nó realmente existe lá
    const urlConsulta = `${dbUrl}/ultimo_evento.json?auth=${secret}`;
    const response = UrlFetchApp.fetch(urlConsulta, { method: 'get', muteHttpExceptions: true });

    const statusCode = response.getResponseCode();
    if (statusCode !== 200) {
      throw new Error(`Erro de autenticação ou conexão (${statusCode}): ${response.getContentText()}`);
    }

    const payloadRecebido = JSON.parse(response.getContentText());

    // 3. Valida se os dados no nó batem com o que foi enviado
    if (!payloadRecebido || !payloadRecebido.dados || payloadRecebido.dados.ticket !== 'TK-TESTE-FIREBASE') {
      throw new Error("O nó '/ultimo_evento' não contêm os dados esperados após o envio.");
    }

    Logger.log("  └ [OK] Nó '/ultimo_evento' foi gravado e lido no Realtime Database!");
    Logger.log(`    ↳ Ticket Gravado: ${payloadRecebido.dados.ticket}`);
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